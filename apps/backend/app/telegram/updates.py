import asyncio
import uuid
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from pydantic_ai.messages import ModelRequest, UserPromptPart
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.harness import runner
from app.harness.limits import LimitExceeded
from app.harness.prompts import RunKind
from app.harness.repository import HarnessRepository
from app.models import Chat
from app.scheduling import policy
from app.scheduling import repository as scheduling
from app.telegram import api, repository
from app.telegram.outbox import Outbox

# The thread is the queue: one run holds it at a time, whichever process
# started it, so an incoming message waits for a proactive one to finish rather
# than talking over it. A wait this long covers an ordinary run; beyond it the
# learner is told, because silence reads as a broken bot.
RUN_WAIT_SECONDS = 5.0
RUN_ATTEMPTS = 6

PAIR_FIRST = (
    "This chat is not connected to a distillcourse account. Sign in on the "
    "site, open Settings and follow the pairing link from there."
)
START_HELP = "Open Settings on the site and follow the pairing link from there."
PAIRED = (
    "Paired. This thread is where I answer questions, and where the platform "
    "opens the conversation itself: reviews of material you finished and "
    "reminders you set.\n\n"
    "/clear — start the history over\n"
    "/compact — replace the history with a summary\n"
    "/mute — stop messages the platform starts (/unmute resumes them)"
)
BUSY = "Still finishing the previous message. Send that again in a minute."
CLEARED = "The learner cleared the thread; nothing before this point is yours."


@dataclass(frozen=True)
class Update:
    update_id: int
    tg_chat_id: int
    text: str


def parse(payload: dict[str, Any]) -> Update | None:
    """The three fields this bot acts on, or nothing.

    A sticker, a photo, an edit, a message from a group: all shapes that carry
    no text for the tutor to read, and all answered with the same silence.
    """
    update_id = payload.get("update_id")
    message = payload.get("message") or {}
    tg_chat_id = (message.get("chat") or {}).get("id")
    text = message.get("text")
    if (
        not isinstance(update_id, int)
        or not isinstance(tg_chat_id, int)
        or not isinstance(text, str)
        or not text.strip()
    ):
        return None
    return Update(update_id=update_id, tg_chat_id=tg_chat_id, text=text.strip())


async def thread_of(session: AsyncSession, user_id: uuid.UUID) -> Chat:
    """The eternal thread, made on demand. There is exactly one and it is never
    replaced: `/clear` marks it, it does not open another."""
    chat = await scheduling.thread(session, user_id)
    if chat is not None:
        return chat
    return await HarnessRepository(session, user_id).create_chat(kind="telegram")


async def converse(
    repo: HarnessRepository,
    thread: Chat,
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
        repo, thread, prompt, medium="telegram", run_kind=run_kind, outbox=outbox
    )
    if outbox.sent == 0 and answer.strip():
        await outbox.send(answer)


async def _clear(repo: HarnessRepository, thread: Chat) -> str:
    await repo.add_messages(
        thread,
        [ModelRequest(parts=[UserPromptPart(content=CLEARED)])],
        role="system",
        marker="clear",
    )
    return "Cleared. Nothing above this line reaches the tutor."


async def _compact(repo: HarnessRepository, thread: Chat) -> str:
    await runner.compact(repo, thread, medium="telegram")
    return "Compacted. The thread continues from a summary of what came before."


async def _mute(repo: HarnessRepository, _thread: Chat) -> str:
    await scheduling.mute(repo.session, repo.user_id, until=policy.INDEFINITE)
    return "Muted. Answers continue; nothing is sent unprompted until /unmute."


async def _unmute(repo: HarnessRepository, _thread: Chat) -> str:
    await scheduling.mute(repo.session, repo.user_id, until=None)
    return "Unmuted. Reviews and reminders resume."


_COMMANDS: dict[str, Callable[[HarnessRepository, Chat], Awaitable[str]]] = {
    "/clear": _clear,
    "/compact": _compact,
    "/mute": _mute,
    "/unmute": _unmute,
}


async def _pair(session: AsyncSession, update: Update, code: str) -> None:
    if not code:
        await api.send_message(update.tg_chat_id, START_HELP, html=False)
        return
    try:
        link = await repository.redeem(
            session, code, tg_chat_id=update.tg_chat_id, now=datetime.now(UTC)
        )
    except repository.PairingRejected as exc:
        await api.send_message(
            update.tg_chat_id,
            f"{exc}. Settings on the site issues a fresh one.",
            html=False,
        )
        return
    await thread_of(session, link.user_id)
    await api.send_message(update.tg_chat_id, PAIRED, html=False)


async def _answer(
    repo: HarnessRepository, thread: Chat, outbox: Outbox, text: str
) -> None:
    for attempt in range(RUN_ATTEMPTS):
        try:
            await converse(repo, thread, outbox, text)
            return
        except runner.RunBusy:
            if attempt + 1 == RUN_ATTEMPTS:
                await outbox.send(BUSY)
                return
            await asyncio.sleep(RUN_WAIT_SECONDS)
        except LimitExceeded as exc:
            # A cap is not an error to swallow: the learner is told why the
            # tutor stopped answering, or the bot looks broken.
            await outbox.send(str(exc))
            return


async def handle(
    session_factory: async_sessionmaker[AsyncSession], update: Update
) -> None:
    """One incoming message, end to end. Runs after the webhook has answered
    Telegram, so how long the tutor thinks is nobody's timeout."""
    async with session_factory() as session:
        link = await repository.link_for_chat(session, update.tg_chat_id)
        command, _, argument = update.text.partition(" ")
        if command == "/start":
            await _pair(session, update, argument.strip())
            return
        if link is None:
            await api.send_message(update.tg_chat_id, PAIR_FIRST, html=False)
            return
        if link.status != "active":
            # They are writing to us, so whatever broke the channel is over.
            await repository.set_status(session, link, "active")
        repo = HarnessRepository(session, link.user_id)
        thread = await thread_of(session, link.user_id)
        outbox = Outbox(session=session, link=link)
        handler = _COMMANDS.get(command)
        try:
            if handler is None:
                await _answer(repo, thread, outbox, update.text)
            else:
                await outbox.send(await handler(repo, thread))
        except runner.RunBusy:
            await outbox.send(BUSY)
        except api.BotBlocked:
            # The outbox has recorded that the channel is down. There is
            # nowhere left to say anything about it.
            return
