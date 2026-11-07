"""The buttons under a card besides its options: putting it aside, flagging it,
and what a learner can ask for once they have answered it.

Every button is spent once. Under an open card, answering or putting it aside
spends them all (the delivery's outcome); under the feedback, each is spent by
being pressed (`follow_ups`). A second press — a double tap, a stale message —
does nothing.
"""

import uuid
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager, suppress
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.harness.repository import HarnessRepository
from app.models import CardDelivery, ReviewCard, User
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

Finder = Callable[[AsyncSession, uuid.UUID, str, int], Awaitable[ReviewCard | None]]


async def _card(outbox: Outbox, tap: Tap) -> tuple[CardDelivery, ReviewCard] | None:
    try:
        delivery_id = uuid.UUID(tap.data.partition(":")[2])
    except ValueError:
        return None
    return await repository.delivery(outbox.session, outbox.link.user_id, delivery_id)


async def _open(outbox: Outbox, tap: Tap) -> tuple[CardDelivery, ReviewCard] | None:
    """The card under the button, locked, while it is still unanswered."""
    found = await _card(outbox, tap)
    return None if found is None or found[0].answered_at is not None else found


async def _tapped(outbox: Outbox, tap: Tap) -> tuple[CardDelivery, ReviewCard] | None:
    """The tapped card under a feedback button, locked, while that button is
    unpressed."""
    found = await _card(outbox, tap)
    prefix = tap.data.partition(":")[0]
    # An `order` card part-way through holds a `chosen` but is not tapped yet.
    if (
        found is None
        or found[0].answered_at is None
        or found[0].chosen is None
        or prefix in found[0].follow_ups
    ):
        return None
    return found


@asynccontextmanager
async def _pressing(
    outbox: Outbox,
    sent: CardDelivery,
    card: ReviewCard,
    prefix: str,
    value: str = PRESSED,
) -> AsyncIterator[None]:
    """Spend a feedback button before acting on it, so a second press finds it
    spent, and give it back if the action fails: the learner is told to press
    it again. Once done, the button leaves the keyboard."""
    session = outbox.session
    delivery_id = sent.id
    sent.follow_ups = {**sent.follow_ups, prefix: value}
    await session.commit()
    try:
        yield
    except Exception:
        await session.rollback()
        await session.execute(
            update(CardDelivery)
            .where(CardDelivery.id == delivery_id)
            .values(follow_ups=CardDelivery.follow_ups.op("-")(prefix))
        )
        await session.commit()
        raise
    with suppress(api.TelegramError):
        await outbox.edit_keyboard(sent.tg_message_id, cards.follow_ups(sent, card))


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
        card = await find(session, user_id, state.lesson, 1 if easy else state.level)
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
    replacement = await cards.existing(session, user_id, card.lesson, level)
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
    await cards.replace(session, outbox, user_id, replacement, sent, card)


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
    means never — put aside as Another question would, then filed for a human
    once the swap has committed the retirement."""
    found = await _open(outbox, tap)
    if found is None:
        return
    sent, card = found
    session, user_id = outbox.session, outbox.link.user_id
    card.status = "retired"
    repository.skip(sent, datetime.now(UTC))
    await _swap(outbox, sent, card)
    await HarnessRepository(session, user_id).file_incident(
        await thread.of(session, user_id),
        locator=cards.locator(card),
        kind="error",
        summary=(
            f"The learner reported review card {card.id} as wrong; it is "
            f"retired. Its prompt: {card.prompt}"
        ),
    )


async def next_card(outbox: Outbox, tap: Tap) -> None:
    """The next due card, now. The learner asked, so it spends no initiation;
    the day's cap is what bounds it."""
    found = await _tapped(outbox, tap)
    if found is None:
        return
    sent, card = found
    session, user_id = outbox.session, outbox.link.user_id
    now = datetime.now(UTC)
    user = await session.get(User, user_id)
    assert user is not None
    async with _pressing(outbox, sent, card, cards.NEXT):
        since = policy.day_start(now, policy.Hours.of(user))
        if await repository.cards_today(session, user_id, since) >= (
            settings.CARDS_PER_DAY
        ):
            await outbox.send(TODAYS)
            return
        async with thread.typing(outbox.link.tg_chat_id):
            following = await _due_card(
                session,
                user_id,
                now,
                cards.pick,
                easy=await repository.level_one_only(session, user_id, now),
            )
        if following is None:
            await outbox.send(NOTHING_ELSE)
            return
        await cards.deliver(session, outbox, user_id, following)


async def harder(outbox: Outbox, tap: Tap) -> None:
    """A card of this lesson a level up, written if there is none: the learner
    asked, and can wait."""
    found = await _tapped(outbox, tap)
    if found is None or found[1].level >= ladder.TOP_LEVEL:
        return
    sent, card = found
    session, user_id = outbox.session, outbox.link.user_id
    async with _pressing(outbox, sent, card, cards.HARDER):
        async with thread.typing(outbox.link.tg_chat_id):
            up = await cards.pick(session, user_id, card.lesson, card.level + 1)
        if up is None:
            await outbox.send(NOTHING_ELSE)
            return
        await cards.deliver(session, outbox, user_id, up, harder=True)


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
    async with _pressing(outbox, sent, card, cards.EXPLAIN):
        await _converse(outbox, sent, card, EXPLAIN_PROMPT)


async def own_words(outbox: Outbox, tap: Tap) -> None:
    """The run asks for the answer in one line; the learner's reply is graded
    by the run that reads it, as recall rather than recognition."""
    found = await _tapped(outbox, tap)
    if found is None:
        return
    sent, card = found
    async with _pressing(outbox, sent, card, cards.OWN_WORDS, value=repository.ASKED):
        await _converse(outbox, sent, card, OWN_WORDS_PROMPT)
