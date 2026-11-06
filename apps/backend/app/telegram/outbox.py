from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from functools import partial

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import TgLink
from app.telegram import api, repository


def split(text: str) -> list[str]:
    """Cut a message Telegram would refuse into ones it accepts.

    A safety net, not a layout tool: the tutor is told to keep its own messages
    short (`prompts/medium/telegram.md`), and this is what happens when it does
    not. The cut prefers a line break, which is also the least likely place to
    be inside a tag.
    """
    parts: list[str] = []
    rest = text
    while len(rest) > api.MESSAGE_LIMIT:
        cut = rest.rfind("\n", 0, api.MESSAGE_LIMIT)
        if cut <= 0:
            cut = api.MESSAGE_LIMIT
        parts.append(rest[:cut].strip())
        rest = rest[cut:].lstrip("\n")
    parts.append(rest)
    # Telegram refuses a message with no text in it, and a part that is only
    # whitespace is one; there is nothing in it to lose by dropping it.
    return [part for part in parts if part.strip()]


@dataclass
class Outbox:
    """Where a run's messages to the learner go.

    It counts what it sent because delivery is hybrid: the tutor sends with the
    `send_message` tool when it wants to, and a run that ends without having
    sent anything has its final answer delivered for it — a silent bot is worse
    than a badly formatted one.
    """

    session: AsyncSession
    link: TgLink
    sent: int = field(default=0, init=False)

    @asynccontextmanager
    async def _delivering(self) -> AsyncIterator[None]:
        try:
            yield
        except api.BotBlocked:
            await repository.set_status(self.session, self.link, "broken")
            raise

    async def _formatted[T](self, deliver: Callable[..., Awaitable[T]]) -> T:
        """`deliver` as HTML, or unformatted if Telegram will not parse it: it
        refuses the whole message over one unclosed tag, so the choice is
        unformatted text or nothing at all."""
        async with self._delivering():
            try:
                return await deliver(html=True)
            except api.MarkupRejected:
                return await deliver(html=False)

    async def send(
        self, html: str, *, keyboard: api.Keyboard | None = None
    ) -> int | None:
        """The id of the last message out, which carries the keyboard: buttons
        belong under the end of what they answer. None when there was no text."""
        message_id = None
        parts = split(html)
        for index, part in enumerate(parts):
            buttons = keyboard if index == len(parts) - 1 else None
            message_id = await self._formatted(
                partial(api.send_message, self.link.tg_chat_id, part, keyboard=buttons)
            )
            # Per message actually out, not per call: a call that had nothing
            # to send must not count as the learner having heard something.
            self.sent += 1
        return message_id

    async def send_photo(
        self,
        photo: str | bytes,
        *,
        caption: str | None = None,
        keyboard: api.Keyboard | None = None,
    ) -> int:
        message_id = await self._formatted(
            partial(
                api.send_photo,
                self.link.tg_chat_id,
                photo,
                caption=caption,
                keyboard=keyboard,
            )
        )
        self.sent += 1
        return message_id

    async def edit_text(
        self, message_id: int, html: str, *, keyboard: api.Keyboard | None = None
    ) -> None:
        await self._formatted(
            partial(
                api.edit_message_text,
                self.link.tg_chat_id,
                message_id,
                html,
                keyboard=keyboard,
            )
        )

    async def edit_caption(
        self, message_id: int, html: str, *, keyboard: api.Keyboard | None = None
    ) -> None:
        await self._formatted(
            partial(
                api.edit_message_caption,
                self.link.tg_chat_id,
                message_id,
                html,
                keyboard=keyboard,
            )
        )

    async def edit_keyboard(
        self, message_id: int, keyboard: api.Keyboard | None
    ) -> None:
        async with self._delivering():
            await api.edit_message_keyboard(self.link.tg_chat_id, message_id, keyboard)
