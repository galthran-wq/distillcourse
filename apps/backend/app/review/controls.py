"""The buttons under a card besides its options: putting it aside, flagging it,
and what a learner can ask for once they have answered it — and the one under
the coach's weekly note, which asks for a card the same way.

Every button is spent once. Under an open card, answering or putting it aside
spends them all (the delivery's outcome); under the feedback, each is spent by
being pressed (`follow_ups`). A second press — a double tap, a stale message —
does nothing.
"""

import uuid
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import AbstractAsyncContextManager, asynccontextmanager, suppress
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import Update, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import InstrumentedAttribute

from app.content.locators import section_key
from app.core.config import settings
from app.harness.repository import HarnessRepository
from app.models import CardDelivery, CoachNote, ReviewCard, Schedule, User
from app.review import cards, ladder, repository, subject
from app.scheduling import policy
from app.scheduling import repository as scheduling
from app.telegram import api, thread
from app.telegram.outbox import Outbox

if TYPE_CHECKING:
    from app.telegram.updates import Tap

NOTHING_ELSE = "Nothing else for now."
TODAYS = "That's today's."
# Stored as what the learner said: the button is their message.
EXPLAIN_PROMPT = "Explain this card."
OWN_WORDS_PROMPT = "I'll put the answer to this card in my own words."
PRESSED = "pressed"

Finder = Callable[
    [AsyncSession, uuid.UUID, str, int, datetime], Awaitable[ReviewCard | None]
]


async def _card(outbox: Outbox, tap: Tap) -> tuple[CardDelivery, ReviewCard] | None:
    try:
        delivery_id = uuid.UUID(tap.data.partition(":")[2])
    except ValueError:
        return None
    return await repository.delivery(outbox.session, outbox.link.user_id, delivery_id)


async def _open(outbox: Outbox, tap: Tap) -> tuple[CardDelivery, ReviewCard] | None:
    """The card under the button, locked, while it is still open
    (`repository.is_open`, the rule its answer buttons go by too)."""
    found = await _card(outbox, tap)
    return None if found is None or not repository.is_open(found[0]) else found


async def _tapped(outbox: Outbox, tap: Tap) -> tuple[CardDelivery, ReviewCard] | None:
    """The tapped card under a feedback button, locked, while that button is
    unpressed."""
    found = await _card(outbox, tap)
    prefix = tap.data.partition(":")[0]
    # Graded by a tap, and by nothing else: an `order` card part-way through
    # holds a `chosen` too, and so does one put aside half-way.
    if (
        found is None
        or found[0].outcome not in repository.ANSWERED
        or found[0].chosen is None
        or prefix in found[0].follow_ups
    ):
        return None
    return found


@dataclass
class _Press:
    # Set when the press did nothing: the button is given back and stays.
    given_back: bool = False


@asynccontextmanager
async def _pressing(
    outbox: Outbox,
    restore: Update,
    message_id: int,
    keyboard: Callable[[], api.Keyboard | None],
) -> AsyncIterator[_Press]:
    """Act on a button the caller has just marked spent. The mark is committed
    first, so a second press finds it spent; `restore` gives the button back
    if the action fails — the learner is told to press it again — or did
    nothing. Once done, the message's keyboard becomes `keyboard()`."""
    session = outbox.session
    await session.commit()
    press = _Press()
    try:
        yield press
    except Exception:
        await session.rollback()
        await session.execute(restore)
        await session.commit()
        raise
    if press.given_back:
        await session.execute(restore)
        await session.commit()
        return
    with suppress(api.TelegramError):
        await outbox.edit_keyboard(message_id, keyboard())


def spending[M: CardDelivery | Schedule](
    outbox: Outbox,
    row: M,
    column: InstrumentedAttribute[dict[str, Any]],
    key: str,
    value: object,
    message_id: int,
    keyboard: Callable[[], api.Keyboard | None],
) -> AbstractAsyncContextManager[_Press]:
    """A button spent by setting `key` in the row's JSONB `column`, acted on
    as `_pressing` does."""
    model, name = type(row), column.key
    setattr(row, name, {**getattr(row, name), key: value})
    restore = (
        update(model).where(model.id == row.id).values({name: column.op("-")(key)})
    )
    return _pressing(outbox, restore, message_id, keyboard)


def _following_up(
    outbox: Outbox,
    sent: CardDelivery,
    card: ReviewCard,
    prefix: str,
    value: str = PRESSED,
) -> AbstractAsyncContextManager[_Press]:
    """A button under the feedback, spent in its delivery's `follow_ups`; it
    leaves the keyboard once done."""
    return spending(
        outbox,
        sent,
        CardDelivery.follow_ups,
        prefix,
        value,
        sent.tg_message_id,
        lambda: cards.follow_ups(sent, card),
    )


async def _due_card(
    session: AsyncSession,
    user_id: uuid.UUID,
    now: datetime,
    find: Finder,
    *,
    easy: bool,
) -> ReviewCard | None:
    """A card of the lesson whose review is owed longest. `easy` is
    `level_one_only`, asked once by the caller."""
    for state in await repository.due(session, user_id, now, recent_first=False):
        card = await find(
            session, user_id, state.lesson, 1 if easy else state.level, now
        )
        if card is not None:
            return card
    return None


async def _swap(outbox: Outbox, sent: CardDelivery, card: ReviewCard) -> None:
    """Another card in the same message: one level lower on the same lesson,
    else the next due lesson's, else nothing. Only cards already written — the
    learner is waiting on a tap, not on a model.

    What put the card aside commits with the edit and not before it: a failed
    edit leaves the old buttons on the message, and they must still work."""
    session, user_id = outbox.session, outbox.link.user_id
    now = datetime.now(UTC)
    easy = await repository.level_one_only(session, user_id, now)
    level = 1 if easy else max(card.level - 1, 1)
    replacement = await cards.existing(session, user_id, card.lesson, level, now)
    if replacement is None:
        replacement = await _due_card(session, user_id, now, cards.existing, easy=easy)
    if replacement is None:
        title = await cards.title_of(session, card)
        await cards.edit(
            outbox,
            sent.tg_message_id,
            card,
            f"{cards.skipped(title)}\n\n{NOTHING_ELSE}",
        )
        await session.commit()
        return
    await cards.replace(session, outbox, user_id, replacement, sent, card, now)


async def another(outbox: Outbox, tap: Tap) -> None:
    """Skipped, and nothing else moves: not the level, not the ladder."""
    found = await _open(outbox, tap)
    if found is None:
        return
    sent, card = found
    repository.skip(sent, datetime.now(UTC))
    await _swap(outbox, sent, card)


async def not_today(outbox: Outbox, tap: Tap) -> None:
    found = await _open(outbox, tap)
    if found is None:
        return
    sent, _ = found
    session = outbox.session
    now = datetime.now(UTC)
    repository.skip(sent, now)
    user = await session.get(User, outbox.link.user_id)
    assert user is not None
    await scheduling.pause_cards(
        session, user.id, until=policy.tomorrow_open(now, policy.Hours.of(user))
    )
    # Committed only once the buttons are gone, so a failed edit leaves them
    # working.
    await outbox.edit_keyboard(sent.tg_message_id, None)
    await session.commit()


async def wrong_card(outbox: Outbox, tap: Tap) -> None:
    """Retired on the first report — with one learner, waiting for a second
    means never — put aside and filed for a human before anything is sent:
    the report must hold whatever Telegram does with the edit. Then swapped
    as Another question would; a swap Telegram refuses leaves the card put
    aside with nothing in its place, as when there is no other card."""
    found = await _open(outbox, tap)
    if found is None:
        return
    sent, card = found
    session, user_id = outbox.session, outbox.link.user_id
    card.status = "retired"
    repository.skip(sent, datetime.now(UTC))
    # Commits the retirement and the skip with the incident.
    await HarnessRepository(session, user_id).file_incident(
        await thread.of(session, user_id),
        locator=section_key(card.lesson, card.anchor),
        kind="error",
        summary=(
            f"The learner reported review card {card.id} as wrong; it is "
            f"retired. Its prompt: {card.prompt}"
        ),
    )
    try:
        # A refused edit fails before the swap writes anything.
        await _swap(outbox, sent, card)
    except api.BotBlocked:
        raise
    except api.TelegramError:
        with suppress(api.TelegramError):
            await outbox.edit_keyboard(sent.tg_message_id, None)


async def _capped(session: AsyncSession, user_id: uuid.UUID, now: datetime) -> bool:
    """Whether the day's cards are spent, those the learner asked for
    included."""
    user = await session.get(User, user_id)
    assert user is not None
    since = policy.day_start(now, policy.Hours.of(user))
    return await repository.cards_today(session, user_id, since) >= (
        settings.CARDS_PER_DAY
    )


async def _asked(
    outbox: Outbox, now: datetime, send: Callable[[], Awaitable[bool]]
) -> bool:
    """A card the learner pressed for: it spends no initiation, so the day's
    cap is what bounds it, and they are told when there is none to send.
    Whether `send` put one out."""
    if await _capped(outbox.session, outbox.link.user_id, now):
        await outbox.send(TODAYS)
        return False
    async with thread.typing(outbox.link.tg_chat_id):
        sent = await send()
    if not sent:
        await outbox.send(NOTHING_ELSE)
    return sent


async def send_asked_for(
    outbox: Outbox, find: Callable[[], Awaitable[ReviewCard | None]]
) -> bool:
    """The card `find` picks, sent because the learner asked for it, as
    `_asked` bounds it. Whether one went out."""
    session, user_id, now = outbox.session, outbox.link.user_id, datetime.now(UTC)

    async def found() -> bool:
        card = await find()
        return (
            card is not None
            and await cards.deliver(session, outbox, user_id, card, now) is not None
        )

    return await _asked(outbox, now, found)


async def next_card(outbox: Outbox, tap: Tap) -> None:
    """The next due card, now."""
    found = await _tapped(outbox, tap)
    if found is None:
        return
    sent, card = found
    session, user_id = outbox.session, outbox.link.user_id
    now = datetime.now(UTC)

    async def following() -> ReviewCard | None:
        easy = await repository.level_one_only(session, user_id, now)
        return await _due_card(session, user_id, now, cards.pick, easy=easy)

    async with _following_up(outbox, sent, card, cards.NEXT):
        await send_asked_for(outbox, following)


async def send_it(outbox: Outbox, tap: Tap) -> None:
    """A card on the lesson the coach's weekly note found slipping, now. A
    press that sends none — the day's cards spent, none on the lesson — gives
    the button back: it is the note's one action."""
    try:
        note_id = uuid.UUID(tap.data.partition(":")[2])
    except ValueError:
        return
    session, user_id = outbox.session, outbox.link.user_id
    note = await session.scalar(
        select(CoachNote)
        .where(CoachNote.id == note_id, CoachNote.user_id == user_id)
        .with_for_update()
    )
    if (
        note is None
        or note.lesson is None
        or note.tg_message_id is None
        or note.pressed_at is not None
    ):
        return
    lesson = note.lesson
    now = datetime.now(UTC)

    async def on_lesson() -> bool:
        state = await repository.state_of(session, user_id, lesson)
        return (
            state is not None
            and await cards.offer(session, outbox, state, None, now, asked=True)
            is not None
        )

    note.pressed_at = now
    restore = update(CoachNote).where(CoachNote.id == note_id).values(pressed_at=None)
    async with _pressing(outbox, restore, note.tg_message_id, lambda: None) as press:
        press.given_back = not await _asked(outbox, now, on_lesson)


async def harder(outbox: Outbox, tap: Tap) -> None:
    """A card of this lesson a level up, written if there is none: the learner
    asked, and can wait. Held to the day's cap as Next is, before anything is
    written."""
    found = await _tapped(outbox, tap)
    if found is None or found[1].level >= ladder.TOP_LEVEL:
        return
    sent, card = found
    session, user_id, now = outbox.session, outbox.link.user_id, datetime.now(UTC)

    async def up() -> bool:
        picked = await cards.pick(session, user_id, card.lesson, card.level + 1, now)
        return (
            picked is not None
            and await cards.deliver(session, outbox, user_id, picked, now, harder=True)
            is not None
        )

    async with _following_up(outbox, sent, card, cards.HARDER):
        await _asked(outbox, now, up)


async def _converse(
    outbox: Outbox, sent: CardDelivery, card: ReviewCard, prompt: str
) -> None:
    """A run on the thread about this one card, which its context carries with
    the learner's choice and the right answer."""
    session, user_id = outbox.session, outbox.link.user_id
    blocks = await subject.open_block(session, [(sent, card)])
    async with thread.typing(outbox.link.tg_chat_id):
        await thread.converse(
            HarnessRepository(session, user_id),
            await thread.of(session, user_id),
            outbox,
            prompt,
            blocks=blocks,
        )


async def explain(outbox: Outbox, tap: Tap) -> None:
    found = await _tapped(outbox, tap)
    if found is None:
        return
    sent, card = found
    async with _following_up(outbox, sent, card, cards.EXPLAIN):
        await _converse(outbox, sent, card, EXPLAIN_PROMPT)


async def own_words(outbox: Outbox, tap: Tap) -> None:
    """The run asks for the answer in one line; the learner's reply is graded
    by the run that reads it, as recall rather than recognition."""
    found = await _tapped(outbox, tap)
    if found is None:
        return
    sent, card = found
    async with _following_up(
        outbox, sent, card, cards.OWN_WORDS, value=repository.ASKED
    ):
        await _converse(outbox, sent, card, OWN_WORDS_PROMPT)
