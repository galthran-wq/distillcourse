import asyncio
import html
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager, suppress
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import logfire
from pydantic_ai.messages import ModelRequest, UserPromptPart
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.harness import runner
from app.harness.limits import LimitExceeded, check_run_allowed
from app.harness.prompts import ContextBlock
from app.harness.repository import HarnessRepository
from app.models import BackgroundRun, Chat, TgLink
from app.review import cards, controls, subject
from app.review.repository import OWN_WORDS
from app.scheduling import policy
from app.scheduling import repository as scheduling
from app.telegram import api, repository, speech, thread
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
# A voice note's transcript is already on screen: retyping it beats re-recording.
BUSY_HEARD = (
    "Still finishing the previous message. Send what I heard as text in a minute."
)
FAILED = "Something went wrong on my side. Send that again in a minute."
TAP_FAILED = "Something went wrong on my side. Press that again in a minute."
TAP_BUSY = "Still finishing the previous message. Press that again in a minute."
TOO_LONG = "Too long. Keep it under two minutes."
UNHEARD = "Couldn't make that out. Send it as text?"
# Checked on what Telegram reports, before anything is downloaded.
VOICE_SECONDS = 120
# The learner sees what was heard, because that is what gets graded; a long
# answer is recognisable from its start.
HEARD_CHARS = 200
CLEARED = "The learner cleared the thread; nothing before this point is yours."


@dataclass(frozen=True)
class Voice:
    file_id: str
    duration: int


@dataclass(frozen=True)
class Update:
    """A message. `text` is empty when it is a `voice`, whose transcript stands
    in for it."""

    update_id: int
    tg_chat_id: int
    text: str
    voice: Voice | None = None


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

    A sticker, a photo, an edit, an audio file, a video note: shapes that
    carry nothing for the tutor to read, all answered with the same silence. So
    is anything outside a private chat — a pairing code redeemed in a group
    would hand that group the learner's own thread, and a button pressed there
    would act on it. A voice message is kept, to be read once transcribed.
    """
    update_id = payload.get("update_id")
    if not isinstance(update_id, int):
        return None
    if "callback_query" in payload:
        return _tap(update_id, payload["callback_query"] or {})
    message = payload.get("message") or {}
    tg_chat_id = _private_chat(message)
    if tg_chat_id is None:
        return None
    voice = message.get("voice") or {}
    file_id, duration = voice.get("file_id"), voice.get("duration")
    if isinstance(file_id, str) and isinstance(duration, int):
        return Update(
            update_id=update_id,
            tg_chat_id=tg_chat_id,
            text="",
            voice=Voice(file_id=file_id, duration=duration),
        )
    text = message.get("text")
    if not isinstance(text, str) or not text.strip():
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
    cards.ANOTHER: controls.another,
    cards.NOT_TODAY: controls.not_today,
    cards.WRONG_CARD: controls.wrong_card,
    cards.NEXT: controls.next_card,
    cards.HARDER: controls.harder,
    cards.EXPLAIN: controls.explain,
    OWN_WORDS: controls.own_words,
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
    sent = await cards.recent(repo.session, repo.user_id, now - policy.IGNORED_AFTER)
    return await subject.open_block(repo.session, sent)


async def _answer(
    repo: HarnessRepository, chat: Chat, outbox: Outbox, text: str, busy: str = BUSY
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
                await outbox.send(busy)
                return
            await asyncio.sleep(RUN_WAIT_SECONDS)


async def _hear(repo: HarnessRepository, outbox: Outbox, voice: Voice) -> str | None:
    """The voice message as text, or None once the learner has been told why
    there is none. A guess is never passed on as what they said."""
    if voice.duration > VOICE_SECONDS:
        await outbox.send(TOO_LONG)
        return None
    # Before the download: a learner past a cap must not spend on the way to
    # being told so.
    await check_run_allowed(repo)
    try:
        audio = await api.download_file(voice.file_id)
        text, usage = await speech.transcribe(audio)
    except api.TelegramError, speech.TranscriptionFailed:
        logfire.exception("a telegram voice message was not transcribed")
        await outbox.send(UNHEARD)
        return None
    session = outbox.session
    session.add(
        BackgroundRun(user_id=outbox.link.user_id, kind=speech.TRANSCRIBE, usage=usage)
    )
    await session.commit()
    if not text:
        await outbox.send(UNHEARD)
        return None
    heard = text if len(text) <= HEARD_CHARS else text[:HEARD_CHARS] + "…"
    # Its own outbox: this line is not the answer, and counted as one it would
    # keep the run's answer from being delivered.
    await Outbox(session=session, link=outbox.link).send(
        f"<i>Heard:</i> {html.escape(heard)}"
    )
    return text


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


@asynccontextmanager
async def _refused(outbox: Outbox, busy: str) -> AsyncIterator[None]:
    """The two refusals the learner is told about rather than given an error
    for: the thread is held by another run, or a cap is spent — swallowed, the
    bot looks broken."""
    try:
        yield
    except runner.RunBusy:
        await outbox.send(busy)
    except LimitExceeded as exc:
        await outbox.send(str(exc))


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
        # Nested so the guard covers the answers below as well.
        async with (
            thread.typing(update.tg_chat_id),
            _guarded(outbox, FAILED, "telegram update failed"),
            _refused(outbox, BUSY),
        ):
            if update.voice is not None:
                text = await _hear(repo, outbox, update.voice)
                if text is not None:
                    await _answer(repo, chat, outbox, text, BUSY_HEARD)
            elif handler is None:
                await _answer(repo, chat, outbox, update.text)
            else:
                await outbox.send(await handler(repo, chat))


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
        async with (
            _guarded(outbox, TAP_FAILED, "telegram tap failed"),
            _refused(outbox, TAP_BUSY),
        ):
            await handler(outbox, tap)
