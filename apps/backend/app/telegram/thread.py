"""The outbound half of the channel: the one thread and how a run reaches it.

Two processes deliver over it — the webhook answering a question and the poller
opening the conversation — so it belongs to neither of them.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.harness import runner
from app.harness.prompts import RunKind
from app.harness.repository import HarnessRepository
from app.models import Chat
from app.telegram.outbox import Outbox


async def of(session: AsyncSession, user_id: uuid.UUID) -> Chat:
    """The eternal thread, made on demand. There is exactly one and it is never
    replaced: `/clear` marks it, it does not open another."""
    chat: Chat | None = await session.scalar(
        select(Chat)
        .where(Chat.user_id == user_id, Chat.kind == "telegram")
        .order_by(Chat.created_at)
        .limit(1)
    )
    if chat is not None:
        return chat
    return await HarnessRepository(session, user_id).create_chat(kind="telegram")


async def converse(
    repo: HarnessRepository,
    chat: Chat,
    outbox: Outbox,
    prompt: str,
    *,
    run_kind: RunKind = "chat",
) -> None:
    """Run the tutor over the thread and make sure the learner hears something.

    Delivery is hybrid: the run sends what it wants through `send_message`, and
    a run that sent nothing has its answer delivered here. A bot that thinks
    and then says nothing is indistinguishable from a broken one.
    """
    answer = await runner.run(
        repo, chat, prompt, medium="telegram", run_kind=run_kind, outbox=outbox
    )
    if outbox.sent == 0 and answer.strip():
        await outbox.send(answer)
