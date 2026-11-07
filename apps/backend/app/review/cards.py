"""Review cards: picked, written when none is left, sent, and graded by a tap.

Grading a tap is code and nothing else — the marked option was checked against
the lesson when the card was kept, so the answer is known before the learner
presses anything, and no model is asked again. Only writing a card costs a
model call, and a card once written is reused: shared between learners unless
it was aimed at one of them, and served until the section it tests changes.
"""

import asyncio
import uuid
from collections.abc import Sequence
from datetime import UTC, datetime, timedelta
from html import escape
from typing import TYPE_CHECKING

from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.content.locators import figure_url, lesson_url
from app.content.search import figures, section_of, sections
from app.models import CardDelivery, ReviewCard
from app.review import repository, subject, writer
from app.scheduling import policy
from app.telegram import api, formula
from app.telegram.outbox import Outbox

if TYPE_CHECKING:
    from app.telegram.updates import Tap

# The `callback_data` prefix of an answer button: `k:<delivery_id>:<option>`.
TAP = "k"
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
            figures=figures([chunk]),
        )
        for chunk in await sections(session, lesson)
    ]


async def _showable(draft: writer.Draft, section: writer.Section) -> bool:
    """A card's image can be sent: its figure is one its section has, and its
    formula renders."""
    if draft.figure is not None:
        return draft.figure in {figure.src for figure in section.figures}
    if draft.formula is not None:
        try:
            await asyncio.to_thread(formula.render, [draft.formula])
        except formula.FormulaError:
            return False
    return True


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
        if card.kind in writer.KINDS[level]
        and card.section in by_anchor
        and await _showable(card, by_anchor[card.section])
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
            figure=card.figure,
            formula=card.formula,
            owner_id=None if focus is None else user_id,
            content_hash=by_anchor[card.section].content_hash,
        )
        for card in kept
    ]
    session.add_all(cards)
    await session.commit()
    return cards


async def pick(
    session: AsyncSession, user_id: uuid.UUID, lesson: str, level: int
) -> ReviewCard | None:
    """A card of this lesson and level the learner has not seen lately, from a
    section that still reads as it did when the card was written. Writes a
    batch when there is none; None when no card of that batch survived."""
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
    for card in candidates:
        if fresh.get(card.anchor) == card.content_hash:
            return card
    written = await write(session, user_id, lesson, level)
    return written[0] if written else None


def _buttons(delivery_id: uuid.UUID, card: ReviewCard) -> api.Keyboard:
    buttons = [
        {"text": option, "callback_data": f"{TAP}:{delivery_id}:{index}"}
        for index, option in enumerate(card.options)
    ]
    # Line numbers fit side by side; a worded option needs the whole width.
    if card.kind == "spot_error":
        return [buttons]
    return [[button] for button in buttons]


def _question(title: str, card: ReviewCard) -> str:
    return f"<b>{escape(title, quote=False)}</b>\n\n{card.prompt}"


async def deliver(
    session: AsyncSession, outbox: Outbox, user_id: uuid.UUID, card: ReviewCard
) -> CardDelivery:
    """Send a card. The delivery is recorded only once Telegram has the
    message: its id is what the feedback edits."""
    title = (await subject.materials(session, [card.lesson]))[card.lesson].title
    delivery_id = uuid.uuid7()
    question = _question(title, card)
    keyboard = _buttons(delivery_id, card)
    photo = await _image(card)
    if photo is None:
        message_id = await outbox.send(question, keyboard=keyboard)
    else:
        message_id = await outbox.send_photo(photo, caption=question, keyboard=keyboard)
    # A card always has text, so a message always went out.
    assert message_id is not None
    delivery = CardDelivery(
        id=delivery_id,
        user_id=user_id,
        card_id=card.id,
        tg_message_id=message_id,
        sent_at=datetime.now(UTC),
    )
    session.add(delivery)
    await session.commit()
    return delivery


async def _image(card: ReviewCard) -> str | bytes | None:
    if card.figure is not None:
        return figure_url(card.figure)
    if card.formula is not None:
        return await asyncio.to_thread(formula.render, [card.formula])
    return None


def _locator(card: ReviewCard) -> str:
    return card.lesson if card.anchor is None else f"{card.lesson}#{card.anchor}"


def _feedback(
    title: str, section: str, card: ReviewCard, outcome: repository.Tapped
) -> str:
    right = card.options[card.answer]
    answer = (
        f"line {right}" if card.kind == "spot_error" else escape(right, quote=False)
    )
    link = lesson_url(_locator(card))
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
    title = (await subject.materials(session, [card.lesson]))[card.lesson].title
    chunk = section_of(await sections(session, card.lesson), _locator(card))
    section = title if chunk is None else chunk.title
    feedback = _feedback(title, section, card, outcome)
    # A card with an image is a photo, whose text is its caption.
    if card.figure is None and card.formula is None:
        await outbox.edit_text(sent.tg_message_id, feedback)
    else:
        await outbox.edit_caption(sent.tg_message_id, feedback)


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
