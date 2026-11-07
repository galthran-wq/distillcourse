import asyncio
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager, suppress
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import logfire
from pydantic_ai.messages import ModelRequest, UserPromptPart
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.harness import runner
from app.harness.limits import LimitExceeded
from app.harness.prompts import ContextBlock
from app.harness.repository import HarnessRepository
from app.models import Chat, TgLink
from app.review import cards, subject
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
# How far back the cards a message may be about reach: the day a card is open
# for before it counts as ignored.
LATE_ANSWER = policy.IGNORED_AFTER

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
TAP_FAILED = "Something went wrong on my side. Press that again in a minute."
CLEARED = "The learner cleared the thread; nothing before this point is yours."


@dataclass(frozen=True)
class Update:
    update_id: int
    tg_chat_id: int
    text: str


@dataclass(frozen=True)
class Tap:
    """A pressed inline button. `data` is `<prefix>:<payload>`."""

    update_id: int
    tg_chat_id: int
    callback_id: str
    message_id: int
    data: str


def _private_chat(holder: dict[str, Any]) -> int | None:
    chat = holder.get("chat") or {}
    tg_chat_id = chat.get("id")
    if chat.get("type") != "private" or not isinstance(tg_chat_id, int):
        return None
    return tg_chat_id


def _tap(update_id: int, query: dict[str, Any]) -> Tap | None:
    message = query.get("message") or {}
    tg_chat_id = _private_chat(message)
    callback_id = query.get("id")
    message_id = message.get("message_id")
    data = query.get("data")
    if (
        tg_chat_id is None
        or not isinstance(callback_id, str)
        or not isinstance(message_id, int)
        or not isinstance(data, str)
    ):
        return None
    return Tap(
        update_id=update_id,
        tg_chat_id=tg_chat_id,
        callback_id=callback_id,
        message_id=message_id,
        data=data,
    )


def parse(payload: dict[str, Any]) -> Update | Tap | None:
    """The fields this bot acts on, or nothing.

    A sticker, a photo, an edit: shapes that carry no text for the tutor to
    read, all answered with the same silence. So is anything outside a private
    chat — a pairing code redeemed in a group would hand that group the
    learner's own thread, and a button pressed there would act on it.
    """
    update_id = payload.get("update_id")
    if not isinstance(update_id, int):
        return None
    if "callback_query" in payload:
        return _tap(update_id, payload["callback_query"] or {})
    message = payload.get("message") or {}
    tg_chat_id = _private_chat(message)
    text = message.get("text")
    if tg_chat_id is None or not isinstance(text, str) or not text.strip():
        return None
    return Update(update_id=update_id, tg_chat_id=tg_chat_id, text=text.strip())


async def dismiss(payload: dict[str, Any]) -> None:
    """Answer a button press `parse` dropped. Telegram spins a pressed button
    until it is answered, in a group as anywhere else."""
    query = payload.get("callback_query") or {}
    callback_id = query.get("id")
    if isinstance(callback_id, str):
        with suppress(api.TelegramError):
            await api.answer_callback(callback_id)


async def _clear(repo: HarnessRepository, chat: Chat) -> str:
    # A marker written beside a run in flight is overtaken by that run's
    # output, and the history it was meant to cut survives.
    async with thread.holding(repo, chat):
        await repo.add_messages(
            chat,
            [ModelRequest(parts=[UserPromptPart(content=CLEARED)])],
            role="system",
            marker="clear",
        )
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


# Keyed by the `callback_data` prefix before the first ":". A handler is
# called with the learner's outbox and the tap; the button is already answered.
TAP_HANDLERS: dict[str, Callable[[Outbox, Tap], Awaitable[None]]] = {
    cards.TAP: cards.answer,
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


async def _open_reviews(
    repo: HarnessRepository, now: datetime
) -> tuple[ContextBlock, ...]:
    """The cards this message may be about: a learner who writes "it's the
    second one" is answering a card, and the run is handed the ids it grades
    one by."""
    sent = await cards.recent(repo.session, repo.user_id, now - LATE_ANSWER)
    return await subject.open_block(repo.session, sent)


# A refresh under Telegram's ~5s display, so the bar never flickers off
# mid-run.
TYPING_REFRESH_SECONDS = 4.5


async def _typing(tg_chat_id: int) -> None:
    """Keeps the "typing…" bar up until cancelled. Failures are swallowed:
    the indicator is a nicety, the answer is what matters."""
    while True:
        with suppress(api.TelegramError):
            await api.send_chat_action(tg_chat_id)
        await asyncio.sleep(TYPING_REFRESH_SECONDS)


async def _answer(
    repo: HarnessRepository, chat: Chat, outbox: Outbox, text: str
) -> None:
    for attempt in range(RUN_ATTEMPTS):
        try:
            # Read per attempt, not once: what is open changes while we wait,
            # because what we are waiting for is the run that may have graded it.
            blocks = await _open_reviews(repo, datetime.now(UTC))
            await thread.converse(repo, chat, outbox, text, blocks=blocks)
            return
        except runner.RunBusy:
            if attempt + 1 == RUN_ATTEMPTS:
                await outbox.send(BUSY)
                return
            await asyncio.sleep(RUN_WAIT_SECONDS)


async def _learner(session: AsyncSession, tg_chat_id: int) -> TgLink | None:
    link = await repository.link_for_chat(session, tg_chat_id)
    if link is not None and link.status != "active":
        # They are reaching us, so whatever broke the channel is over.
        await repository.set_status(session, link, "active")
    return link


@asynccontextmanager
async def _guarded(outbox: Outbox, failed: str, what: str) -> AsyncIterator[None]:
    """The top of a background task: nothing catches what escapes here, the
    update id is already recorded so Telegram will not deliver it again, and an
    update that ends in silence is a bot that looks dead. Saying so is best
    effort — the channel may be what broke."""
    try:
        yield
    except api.BotBlocked:
        # The outbox has recorded that the channel is down. There is nowhere
        # left to say anything about it.
        return
    except Exception:
        logfire.exception(what)
        with suppress(Exception):
            await outbox.send(failed)


async def handle(
    session_factory: async_sessionmaker[AsyncSession], update: Update
) -> None:
    """One incoming message, end to end. Runs after the webhook has answered
    Telegram, so how long the tutor thinks is nobody's timeout."""
    async with session_factory() as session:
        command, _, argument = update.text.partition(" ")
        if command == "/start":
            await _pair(session, update, argument.strip())
            return
        link = await _learner(session, update.tg_chat_id)
        if link is None:
            await api.send_message(update.tg_chat_id, PAIR_FIRST, html=False)
            return
        repo = HarnessRepository(session, link.user_id)
        chat = await thread.of(session, link.user_id)
        outbox = Outbox(session=session, link=link)
        handler = _COMMANDS.get(command)
        typing = asyncio.create_task(_typing(update.tg_chat_id))
        try:
            # Nested so the guard covers the answers below as well.
            async with _guarded(outbox, FAILED, "telegram update failed"):
                try:
                    if handler is None:
                        await _answer(repo, chat, outbox, update.text)
                    else:
                        await outbox.send(await handler(repo, chat))
                except runner.RunBusy:
                    await outbox.send(BUSY)
                except LimitExceeded as exc:
                    # A cap is not an error to swallow: the learner is told why
                    # the tutor stopped answering, or the bot looks broken.
                    await outbox.send(str(exc))
        finally:
            typing.cancel()


async def handle_tap(
    session_factory: async_sessionmaker[AsyncSession], tap: Tap
) -> None:
    # Telegram spins the pressed button until this is answered, whatever comes
    # of the tap — an unknown button and an unpaired chat included.
    with suppress(api.TelegramError):
        await api.answer_callback(tap.callback_id)
    handler = TAP_HANDLERS.get(tap.data.partition(":")[0])
    if handler is None:
        return
    async with session_factory() as session:
        link = await _learner(session, tap.tg_chat_id)
        if link is None:
            return
        outbox = Outbox(session=session, link=link)
        async with _guarded(outbox, TAP_FAILED, "telegram tap failed"):
            await handler(outbox, tap)
