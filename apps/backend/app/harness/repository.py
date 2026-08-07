import uuid
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

from pydantic_ai.messages import ModelMessage, ModelMessagesTypeAdapter
from pydantic_ai.ui.vercel_ai import VercelAIAdapter
from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.harness.usage import INPUT_TOKENS, OUTPUT_TOKENS, WEB_SEARCH_CALLS
from app.models import Chat, Incident, Message, User

Role = Literal["user", "agent", "system"]
Marker = Literal["clear", "compact"]

TITLE_LENGTH = 60


def _projection(messages: Sequence[ModelMessage]) -> list[dict[str, Any]]:
    return [
        ui.model_dump(mode="json", by_alias=True)
        for ui in VercelAIAdapter.dump_messages(messages)
    ]


@dataclass(frozen=True)
class HarnessRepository:
    """Every query is filtered by the user baked in here; there is no method
    that takes a user id, so a chat or message of another user is not
    reachable from an instance scoped to this one."""

    session: AsyncSession
    user_id: uuid.UUID

    async def create_chat(
        self, *, kind: Literal["web", "telegram"], model: str | None = None
    ) -> Chat:
        chat = Chat(
            user_id=self.user_id,
            kind=kind,
            model=model or settings.DEFAULT_CHAT_MODEL,
        )
        self.session.add(chat)
        await self.session.commit()
        return chat

    async def user(self) -> User:
        return await self.session.get_one(User, self.user_id)

    async def get_chat(self, chat_id: uuid.UUID) -> Chat | None:
        chat: Chat | None = await self.session.scalar(
            select(Chat).where(Chat.id == chat_id, Chat.user_id == self.user_id)
        )
        return chat

    async def list_chats(self) -> Sequence[Chat]:
        return (
            await self.session.scalars(
                select(Chat)
                .where(Chat.user_id == self.user_id)
                .order_by(Chat.created_at.desc())
            )
        ).all()

    async def set_model(self, chat: Chat, model: str) -> None:
        chat.model = model
        await self.session.commit()

    async def claim_run(self, chat: Chat, run_id: uuid.UUID) -> bool:
        # One statement, so two tabs racing on the same chat cannot both win;
        # an expired claim is indistinguishable from no claim.
        claimed = await self.session.scalar(
            update(Chat)
            .where(
                Chat.id == chat.id,
                Chat.user_id == self.user_id,
                or_(Chat.active_run_id.is_(None), Chat.claimed_until < func.now()),
            )
            .values(
                active_run_id=run_id,
                claimed_until=func.now()
                + timedelta(seconds=settings.RUN_CLAIM_TTL_SECONDS),
            )
            .returning(Chat.id)
        )
        await self.session.commit()
        return claimed is not None

    async def release_run(self, chat: Chat, run_id: uuid.UUID) -> None:
        await self.session.execute(
            update(Chat)
            .where(Chat.id == chat.id, Chat.active_run_id == run_id)
            .values(active_run_id=None, claimed_until=None)
        )
        await self.session.commit()

    async def add_messages(
        self,
        chat: Chat,
        messages: Sequence[ModelMessage],
        *,
        role: Role,
        run_id: uuid.UUID | None = None,
        usage: dict[str, Any] | None = None,
        marker: Marker | None = None,
    ) -> None:
        """Store messages that belong to one turn.

        The UI projection is dumped over the whole sequence and kept on its
        last row: the library resolves a tool call against the return that
        follows it, which a message-at-a-time dump never sees. Usage lands on
        the same row — it is one number for the run, not one per message.
        """
        payloads = ModelMessagesTypeAdapter.dump_python(list(messages), mode="json")
        projection = _projection(messages)
        for index, payload in enumerate(payloads):
            last = index == len(payloads) - 1
            self.session.add(
                Message(
                    chat_id=chat.id,
                    run_id=run_id,
                    role=role,
                    pydantic_ai=payload,
                    projection=projection if last else [],
                    usage=usage if last else None,
                    marker=marker,
                )
            )
        await self.session.commit()

    async def fail_run(self, chat: Chat, run_id: uuid.UUID, error: str) -> None:
        await self.session.execute(
            update(Message)
            .where(Message.chat_id == chat.id, Message.run_id == run_id)
            .values(error=error)
        )
        await self.session.commit()

    async def set_title(self, chat: Chat, title: str) -> None:
        chat.title = title[:TITLE_LENGTH]
        # What "since the title was set" is counted from below.
        chat.titled_at = datetime.now(UTC)
        await self.session.commit()

    async def last_message_at(self) -> dict[uuid.UUID, datetime]:
        """When each of this learner's chats was last written in.

        A max over the rows themselves rather than a column kept on the chat:
        the listing is the only reader, and a maximum cannot fall out of step
        with what it is a maximum of.
        """
        rows = await self.session.execute(
            select(Message.chat_id, func.max(Message.created_at))
            .join(Chat, Chat.id == Message.chat_id)
            .where(Chat.user_id == self.user_id)
            .group_by(Message.chat_id)
        )
        return dict(rows.tuples().all())

    async def rows(self, chat: Chat) -> Sequence[Message]:
        return (
            await self.session.scalars(
                select(Message).where(Message.chat_id == chat.id).order_by(Message.id)
            )
        ).all()

    async def live_rows(self, chat: Chat) -> list[Message]:
        """The rows the next run will be given: everything after the last
        marker, minus what a failed run left behind."""
        rows = [row for row in await self.rows(chat) if row.error is None]
        start = 0
        for index, row in enumerate(rows):
            # A clear cuts everything up to and including itself; a compact
            # keeps its own row, which holds the summary of what it replaced.
            if row.marker == "clear":
                start = index + 1
            elif row.marker == "compact":
                start = index
        return rows[start:]

    async def history(self, chat: Chat) -> list[ModelMessage]:
        return ModelMessagesTypeAdapter.validate_python(
            [row.pydantic_ai for row in await self.live_rows(chat)]
        )

    async def messages_since_title(self, chat: Chat) -> int:
        """How much conversation the chat has had since it was last named.

        Counted over the live rows, so a compaction resets it the way it resets
        the history: what a renaming pass would be shown is what triggers it.
        A chat nobody has named has no moment to count from.
        """
        if chat.titled_at is None:
            return 0
        return sum(
            1 for row in await self.live_rows(chat) if row.created_at > chat.titled_at
        )

    async def context_tokens(self, chat: Chat) -> int:
        """Size of the prompt the next run would send, taken from what the last
        one actually cost — no tokenizer, and correct for the model in use.

        A marker's own usage is the cost of producing it, not the size of what
        it left behind, so a fresh summary reads as an empty context.
        """
        for row in reversed(await self.live_rows(chat)):
            if row.marker is None and row.usage is not None:
                return int(row.usage.get(INPUT_TOKENS, 0)) + int(
                    row.usage.get(OUTPUT_TOKENS, 0)
                )
        return 0

    async def messages_today(self) -> int:
        total = await self.session.scalar(
            select(func.count())
            .select_from(Message)
            .join(Chat, Chat.id == Message.chat_id)
            .where(
                Message.role == "user",
                Chat.user_id == self.user_id,
                Message.created_at >= func.date_trunc("day", func.now()),
            )
        )
        return int(total or 0)

    async def web_searches_today(self) -> int:
        total = await self.session.scalar(
            select(func.sum(Message.usage[WEB_SEARCH_CALLS].as_integer()))
            .select_from(Message)
            .join(Chat, Chat.id == Message.chat_id)
            .where(
                Chat.user_id == self.user_id,
                Message.created_at >= func.date_trunc("day", func.now()),
            )
        )
        return int(total or 0)

    async def file_incident(
        self, chat: Chat, *, locator: str, kind: str, summary: str
    ) -> Incident:
        incident = Incident(
            user_id=self.user_id,
            chat_id=chat.id,
            locator=locator,
            kind=kind,
            summary=summary,
        )
        self.session.add(incident)
        await self.session.commit()
        return incident
