import asyncio
import uuid
from collections.abc import Awaitable, Callable
from contextlib import suppress
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import logfire
from pydantic_ai.messages import ModelRequest, UserPromptPart
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.harness import runner
from app.harness.limits import LimitExceeded
from app.harness.repository import HarnessRepository
from app.models import Chat
from app.scheduling import policy
from app.scheduling import repository as scheduling
from app.telegram import api, repository, thread
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
FAILED = "Something went wrong on my side. Send that again in a minute."
CLEARED = "The learner cleared the thread; nothing before this point is yours."


@dataclass(frozen=True)
class Update:
    update_id: int
    tg_chat_id: int
    text: str


def parse(payload: dict[str, Any]) -> Update | None:
    """The three fields this bot acts on, or nothing.

    A sticker, a photo, an edit: shapes that carry no text for the tutor to
    read, all answered with the same silence. So is anything outside a private
    chat — a pairing code redeemed in a group would hand that group the
    learner's own thread.
    """
    update_id = payload.get("update_id")
    message = payload.get("message") or {}
    chat = message.get("chat") or {}
    text = message.get("text")
    if (
        not isinstance(update_id, int)
        or chat.get("type") != "private"
        or not isinstance(chat.get("id"), int)
        or not isinstance(text, str)
        or not text.strip()
    ):
        return None
    return Update(update_id=update_id, tg_chat_id=chat["id"], text=text.strip())


async def _clear(repo: HarnessRepository, chat: Chat) -> str:
    # Under the claim runs take, because that is what serializes the thread: a
    # marker written beside a run in flight is overtaken by that run's output,
    # and the history it was meant to cut survives.
    run_id = uuid.uuid4()
    if not await repo.claim_run(chat, run_id):
        raise runner.RunBusy
    try:
        await repo.add_messages(
            chat,
            [ModelRequest(parts=[UserPromptPart(content=CLEARED)])],
            role="system",
            marker="clear",
        )
    finally:
        await repo.release_run(chat, run_id)
    return "Cleared. Nothing above this line reaches the tutor."


async def _compact(repo: HarnessRepository, chat: Chat) -> str:
    await runner.compact(repo, chat, medium="telegram")
    return "Compacted. The thread continues from a summary of what came before."


async def _mute(repo: HarnessRepository, _chat: Chat) -> str:
    await scheduling.mute(repo.session, repo.user_id, until=policy.INDEFINITE)
    return "Muted. Answers continue; nothing is sent unprompted until /unmute."


async def _unmute(repo: HarnessRepository, _chat: Chat) -> str:
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
    await thread.of(session, link.user_id)
    await api.send_message(update.tg_chat_id, PAIRED, html=False)


async def _answer(
    repo: HarnessRepository, chat: Chat, outbox: Outbox, text: str
) -> None:
    for attempt in range(RUN_ATTEMPTS):
        try:
            await thread.converse(repo, chat, outbox, text)
            return
        except runner.RunBusy:
            if attempt + 1 == RUN_ATTEMPTS:
                await outbox.send(BUSY)
                return
            await asyncio.sleep(RUN_WAIT_SECONDS)


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
        chat = await thread.of(session, link.user_id)
        outbox = Outbox(session=session, link=link)
        handler = _COMMANDS.get(command)
        try:
            try:
                if handler is None:
                    await _answer(repo, chat, outbox, update.text)
                else:
                    await outbox.send(await handler(repo, chat))
            except runner.RunBusy:
                await outbox.send(BUSY)
            except LimitExceeded as exc:
                # A cap is not an error to swallow: the learner is told why the
                # tutor stopped answering, or the bot looks broken.
                await outbox.send(str(exc))
        except api.BotBlocked:
            # The outbox has recorded that the channel is down. There is
            # nowhere left to say anything about it.
            return
        except Exception:
            # Nested so this covers the two answers above as well. It is the
            # top of a background task: nothing catches what escapes here, the
            # update id is already recorded so Telegram will not deliver the
            # message again, and an update that ends in silence is a bot that
            # looks dead. Saying so is best effort — the channel may be what
            # broke.
            logfire.exception("telegram update failed")
            with suppress(Exception):
                await outbox.send(FAILED)
