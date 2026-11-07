"""Review cards: picked, written when none is left, sent, and graded by a tap.

Grading a tap is code and nothing else — the marked option was checked against
the lesson when the card was kept, so the answer is known before the learner
presses anything, and no model is asked again. Only writing a card costs a
model call, and a card once written is reused: shared between learners unless
it was aimed at one of them, and served until the section it tests changes.
"""

import uuid
from collections.abc import Sequence
from contextlib import suppress
from datetime import UTC, datetime, timedelta
from html import escape
from typing import TYPE_CHECKING

from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.content.locators import lesson_url
from app.content.search import section_of, sections
from app.harness.repository import HarnessRepository
from app.models import CardDelivery, ReviewCard
from app.review import ladder, repository, subject, writer
from app.scheduling import policy
from app.telegram import api, thread
from app.telegram.outbox import Outbox

if TYPE_CHECKING:
    from app.telegram.updates import Tap

# The `callback_data` prefix of an answer button: `k:<delivery_id>:<option>`.
TAP = "k"
# The other buttons are `<prefix>:<delivery_id>`. Under a card still open:
ANOTHER = "a"
NOT_TODAY = "n"
WRONG_CARD = "w"
# Under the feedback on a tapped one:
NEXT = "x"
HARDER = "h"
EXPLAIN = "e"
# Kept in the data layer, which subject and tools read it from.
OWN_WORDS = repository.OWN_WORDS
# A card this learner saw more recently than this is not put to them again.
UNSEEN_FOR = timedelta(days=14)
RIGHT = "✓"
WRONG = "✗"


async def _sections(session: AsyncSession, lesson: str) -> list[writer.Section]:
    return [
        writer.Section(
            anchor=chunk.locator.partition("#")[2] or None,
            title=chunk.title,
            text=chunk.text,
            content_hash=chunk.content_hash,
        )
        for chunk in await sections(session, lesson)
    ]


async def write(
    session: AsyncSession,
    user_id: uuid.UUID,
    lesson: str,
    level: int,
    *,
    focus: str | None = None,
) -> list[ReviewCard]:
    """A batch of cards at one level, written from the lesson's own text and
    kept only where the check passes them. A `focus` is one learner's
    confusion, and the cards aimed at it are theirs alone."""
    found = await _sections(session, lesson)
    if not found:
        return []
    material = (await subject.materials(session, [lesson]))[lesson]
    by_anchor = {section.anchor or "": section for section in found}
    # The batch size is the prompt's to ask for and the code's to hold to: a
    # writer that returns more would have them all checked and stored.
    drafts = [
        card
        for card in (
            await writer.draft(session, user_id, material, found, level, focus)
        )[: writer.BATCH]
        if card.kind in writer.KINDS[level] and card.section in by_anchor
    ]
    kept = (
        await writer.check(session, user_id, material, found, drafts) if drafts else []
    )
    cards = [
        ReviewCard(
            lesson=lesson,
            anchor=by_anchor[card.section].anchor,
            kind=card.kind,
            level=level,
            prompt=card.prompt,
            options=card.options,
            answer=card.answer,
            explanation=card.explanation,
            owner_id=None if focus is None else user_id,
            content_hash=by_anchor[card.section].content_hash,
        )
        for card in kept
    ]
    session.add_all(cards)
    await session.commit()
    return cards


async def existing(
    session: AsyncSession, user_id: uuid.UUID, lesson: str, level: int
) -> ReviewCard | None:
    """A card of this lesson and level the learner has not seen lately, from a
    section that still reads as it did when the card was written."""
    fresh = {
        section.anchor: section.content_hash
        for section in await _sections(session, lesson)
    }
    last_seen = (
        select(func.max(CardDelivery.sent_at))
        .where(CardDelivery.card_id == ReviewCard.id, CardDelivery.user_id == user_id)
        .correlate(ReviewCard)
        .scalar_subquery()
    )
    candidates = await session.scalars(
        select(ReviewCard)
        .where(
            ReviewCard.lesson == lesson,
            ReviewCard.level == level,
            ReviewCard.status == "active",
            or_(ReviewCard.owner_id.is_(None), ReviewCard.owner_id == user_id),
            or_(
                last_seen.is_(None),
                last_seen < datetime.now(UTC) - UNSEEN_FOR,
            ),
        )
        # Never seen first, then the one seen longest ago.
        .order_by(last_seen.asc().nulls_first(), ReviewCard.created_at)
    )
    return next(
        (card for card in candidates if fresh.get(card.anchor) == card.content_hash),
        None,
    )


async def pick(
    session: AsyncSession, user_id: uuid.UUID, lesson: str, level: int
) -> ReviewCard | None:
    """An existing card, or one of a batch written when there is none; None
    when no card of that batch survived."""
    card = await existing(session, user_id, lesson, level)
    if card is not None:
        return card
    written = await write(session, user_id, lesson, level)
    return written[0] if written else None


def _button(text: str, prefix: str, delivery_id: uuid.UUID) -> dict[str, str]:
    return {"text": text, "callback_data": f"{prefix}:{delivery_id}"}


def _buttons(delivery_id: uuid.UUID, card: ReviewCard) -> api.Keyboard:
    options = [
        {"text": option, "callback_data": f"{TAP}:{delivery_id}:{index}"}
        for index, option in enumerate(card.options)
    ]
    # Line numbers fit side by side; a worded option needs the whole width.
    rows = [options] if card.kind == "spot_error" else [[o] for o in options]
    return [
        *rows,
        [
            _button("Another question", ANOTHER, delivery_id),
            _button("Not today", NOT_TODAY, delivery_id),
        ],
        [_button("This card is wrong", WRONG_CARD, delivery_id)],
    ]


def follow_ups(sent: CardDelivery, card: ReviewCard) -> api.Keyboard | None:
    """The buttons under the feedback, less the ones already pressed. There is
    no harder card than level 3."""
    rows = [
        [("Next", NEXT), ("Harder one", HARDER)],
        [("Explain", EXPLAIN), ("In my own words", OWN_WORDS)],
    ]
    shown = [
        [
            _button(text, prefix, sent.id)
            for text, prefix in row
            if prefix not in sent.follow_ups
            and not (prefix == HARDER and card.level >= ladder.TOP_LEVEL)
        ]
        for row in rows
    ]
    return [row for row in shown if row] or None


def _question(title: str, card: ReviewCard) -> str:
    return f"<b>{escape(title, quote=False)}</b>\n\n{card.prompt}"


async def title_of(session: AsyncSession, card: ReviewCard) -> str:
    return (await subject.materials(session, [card.lesson]))[card.lesson].title


def skipped(title: str) -> str:
    return f"{escape(title, quote=False)} — skipped"


async def _record(
    session: AsyncSession,
    delivery_id: uuid.UUID,
    user_id: uuid.UUID,
    card: ReviewCard,
    message_id: int,
    *,
    harder: bool = False,
) -> CardDelivery:
    delivery = CardDelivery(
        id=delivery_id,
        user_id=user_id,
        card_id=card.id,
        tg_message_id=message_id,
        sent_at=datetime.now(UTC),
        harder=harder,
    )
    session.add(delivery)
    await session.commit()
    return delivery


async def _tidy(session: AsyncSession, outbox: Outbox, sent: CardDelivery) -> None:
    """Fold the cards still open from before this one into a line each: the
    thread must not become a wall of unanswered questions. A folded card is
    skipped, whether or not its message could still be edited — the learner
    can no longer be held to it either way."""
    folded = (
        (
            await session.execute(
                select(CardDelivery, ReviewCard)
                .join(ReviewCard, ReviewCard.id == CardDelivery.card_id)
                .where(
                    CardDelivery.user_id == sent.user_id,
                    CardDelivery.outcome.is_(None),
                    CardDelivery.sent_at >= sent.sent_at - policy.IGNORED_AFTER,
                    CardDelivery.id != sent.id,
                )
                # A tap on one of them grades it under the same lock; whichever
                # comes second finds it answered.
                .with_for_update(of=CardDelivery)
            )
        )
        .tuples()
        .all()
    )
    if not folded:
        return
    for delivery, _ in folded:
        repository.skip(delivery, sent.sent_at)
    await session.commit()
    titles = await subject.materials(session, {card.lesson for _, card in folded})
    for delivery, card in folded:
        with suppress(api.TelegramError):
            await outbox.edit_text(
                delivery.tg_message_id, skipped(titles[card.lesson].title)
            )


async def deliver(
    session: AsyncSession,
    outbox: Outbox,
    user_id: uuid.UUID,
    card: ReviewCard,
    *,
    harder: bool = False,
) -> CardDelivery:
    """Send a card, holding the thread so it does not land in the middle of
    a run. The delivery is recorded only once Telegram has the message: its id
    is what the feedback edits."""
    delivery_id = uuid.uuid7()
    question = _question(await title_of(session, card), card)
    repo = HarnessRepository(session, user_id)
    async with thread.holding(repo, await thread.of(session, user_id)):
        message_id = await outbox.send(question, keyboard=_buttons(delivery_id, card))
    # A card always has text, so a message always went out.
    assert message_id is not None
    delivery = await _record(
        session, delivery_id, user_id, card, message_id, harder=harder
    )
    await _tidy(session, outbox, delivery)
    return delivery


async def replace(
    session: AsyncSession,
    outbox: Outbox,
    user_id: uuid.UUID,
    card: ReviewCard,
    message_id: int,
) -> CardDelivery:
    """Put a card in place of another in the message that carried it."""
    delivery_id = uuid.uuid7()
    await outbox.edit_text(
        message_id,
        _question(await title_of(session, card), card),
        keyboard=_buttons(delivery_id, card),
    )
    return await _record(session, delivery_id, user_id, card, message_id)


def locator(card: ReviewCard) -> str:
    return card.lesson if card.anchor is None else f"{card.lesson}#{card.anchor}"


def _feedback(
    title: str, section: str, card: ReviewCard, outcome: repository.Tapped
) -> str:
    right = card.options[card.answer]
    answer = (
        f"line {right}" if card.kind == "spot_error" else escape(right, quote=False)
    )
    link = lesson_url(locator(card))
    mark = RIGHT if outcome == "correct" else WRONG
    return (
        f"{_question(title, card)}\n\n{mark} {answer}. {escape(card.explanation, quote=False)} "
        f'<a href="{escape(link)}">{escape(section, quote=False)}</a>'
    )


def _chosen(data: str) -> tuple[uuid.UUID, int] | None:
    _, _, payload = data.partition(":")
    delivery_id, _, option = payload.partition(":")
    try:
        return uuid.UUID(delivery_id), int(option)
    except ValueError:
        return None


async def answer(outbox: Outbox, tap: Tap) -> None:
    """A tapped option, graded against the marked answer and shown in place of
    the buttons. A card answered once is answered: a second tap, or a tap on a
    card already graded in conversation, changes nothing."""
    session = outbox.session
    chosen = _chosen(tap.data)
    if chosen is None:
        return
    delivery_id, option = chosen
    found = await repository.delivery(session, outbox.link.user_id, delivery_id)
    if found is None:
        return
    sent, card = found
    if sent.answered_at is not None or not 0 <= option < len(card.options):
        return
    outcome: repository.Tapped = "correct" if option == card.answer else "wrong"
    await repository.grade(session, sent, card, outcome, chosen=option)
    await session.commit()
    title = await title_of(session, card)
    chunk = section_of(await sections(session, card.lesson), locator(card))
    section = title if chunk is None else chunk.title
    await outbox.edit_text(
        sent.tg_message_id,
        _feedback(title, section, card, outcome),
        keyboard=follow_ups(sent, card),
    )


async def expire(session: AsyncSession, now: datetime) -> None:
    """A card nobody answered in a day is ignored. The ladder does not move:
    silence is not evidence about what they know, and the backoff is what
    answers it."""
    await session.execute(
        update(CardDelivery)
        .where(
            CardDelivery.outcome.is_(None),
            CardDelivery.sent_at <= now - policy.IGNORED_AFTER,
        )
        .values(outcome="ignored")
    )
    await session.commit()


async def recent(
    session: AsyncSession, user_id: uuid.UUID, since: datetime
) -> Sequence[tuple[CardDelivery, ReviewCard]]:
    """The cards sent to this learner since a moment, oldest first."""
    rows = await session.execute(
        select(CardDelivery, ReviewCard)
        .join(ReviewCard, ReviewCard.id == CardDelivery.card_id)
        .where(CardDelivery.user_id == user_id, CardDelivery.sent_at >= since)
        .order_by(CardDelivery.sent_at)
    )
    return [(sent, card) for sent, card in rows.tuples()]
