"""The outbound half of the channel: the one thread and how a run reaches it.

Two processes deliver over it — the webhook answering a question and the poller
opening the conversation — so it belongs to neither of them.
"""

import asyncio
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager, suppress

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.harness import runner
from app.harness.prompts import ContextBlock, RunKind
from app.harness.repository import HarnessRepository
from app.models import Chat
from app.telegram import api
from app.telegram.outbox import Outbox

# A refresh under Telegram's ~5s display, so the bar never flickers off
# mid-run.
TYPING_REFRESH_SECONDS = 4.5


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


@asynccontextmanager
async def holding(repo: HarnessRepository, chat: Chat) -> AsyncIterator[None]:
    """The thread's claim, for work that writes into it without a run. The
    claim is what serializes the thread, whoever writes: a card or a marker
    put in beside a run in flight lands in the middle of what that run says.
    """
    run_id = uuid.uuid4()
    if not await repo.claim_run(chat, run_id):
        raise runner.RunBusy
    try:
        yield
    finally:
        await repo.release_run(chat, run_id)


async def converse(
    repo: HarnessRepository,
    chat: Chat,
    outbox: Outbox,
    prompt: str,
    *,
    run_kind: RunKind = "chat",
    blocks: tuple[ContextBlock, ...] = (),
) -> None:
    """Run the tutor over the thread and make sure the learner hears something.

    Delivery is hybrid: the run sends what it wants through `send_message`, and
    a run that sent nothing has its answer delivered here. A bot that thinks
    and then says nothing is indistinguishable from a broken one.
    """
    answer = await runner.run(
        repo,
        chat,
        prompt,
        medium="telegram",
        run_kind=run_kind,
        blocks=blocks,
        outbox=outbox,
    )
    if outbox.sent == 0 and answer.strip():
        await outbox.send(answer)


async def _typing(tg_chat_id: int) -> None:
    """Failures are swallowed: the indicator is a nicety, the answer is what
    matters."""
    while True:
        with suppress(api.TelegramError):
            await api.send_chat_action(tg_chat_id)
        await asyncio.sleep(TYPING_REFRESH_SECONDS)


@asynccontextmanager
async def typing(tg_chat_id: int) -> AsyncIterator[None]:
    """The "typing…" bar, kept up for as long as the block runs."""
    task = asyncio.create_task(_typing(tg_chat_id))
    try:
        yield
    finally:
        task.cancel()
