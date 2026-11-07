"""Review cards: picked, written when none is left, sent, and graded by a tap.

Grading a tap is code and nothing else — the marked option was checked against
the lesson when the card was kept, so the answer is known before the learner
presses anything, and no model is asked again. Only writing a card costs a
model call, and a card once written is reused: shared between learners unless
it was aimed at one of them, and served until the section it tests changes.
"""

import uuid
from collections.abc import Sequence
from datetime import UTC, datetime, timedelta
from html import escape
from typing import TYPE_CHECKING

from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.content.locators import lesson_url
from app.content.search import section_of, sections
from app.models import CardDelivery, ReviewCard
from app.review import repository, subject, writer
from app.scheduling import policy
from app.telegram import api
from app.telegram.outbox import Outbox

if TYPE_CHECKING:
    from app.telegram.updates import Tap

# The `callback_data` prefix of an answer button: `k:<delivery_id>:<option>`.
TAP = "k"
# An `order` card's: `o:<delivery_id>:<step>`, and `o:<delivery_id>:r` to start
# the order over.
ORDER = "o"
RESET = "r"
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
    drafts = [
        writer.shuffled(card) if card.kind == "order" else card for card in drafts
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


def _buttons(
    delivery_id: uuid.UUID, card: ReviewCard, chosen: list[int]
) -> api.Keyboard:
    """The keyboard of a card not yet answered — the one place it is built,
    whether the card was just sent or is an `order` card part-way through."""
    if card.kind == "order":
        steps = [
            {"text": str(step + 1), "callback_data": f"{ORDER}:{delivery_id}:{step}"}
            for step in range(len(card.options))
            if step not in chosen
        ]
        reset = [{"text": "Reset", "callback_data": f"{ORDER}:{delivery_id}:{RESET}"}]
        return [steps, reset] if chosen else [steps]
    buttons = [
        {"text": option, "callback_data": f"{TAP}:{delivery_id}:{index}"}
        for index, option in enumerate(card.options)
    ]
    # Line numbers fit side by side; a worded option needs the whole width.
    if card.kind == "spot_error":
        return [buttons]
    return [[button] for button in buttons]


def _sequence(steps: list[int]) -> str:
    return " → ".join(str(step + 1) for step in steps)


def _question(title: str, card: ReviewCard, chosen: list[int] | None = None) -> str:
    """The card as the learner reads it. An `order` card's steps are numbered
    under the prompt, since its buttons hold only the numbers, followed by the
    order tapped so far."""
    text = f"<b>{escape(title, quote=False)}</b>\n\n{card.prompt}"
    if card.kind != "order":
        return text
    steps = "\n".join(
        f"{number}. {escape(step, quote=False)}"
        for number, step in enumerate(card.options, start=1)
    )
    text = f"{text}\n\n{steps}"
    return f"{text}\n\nYour order: {_sequence(chosen)}" if chosen else text


async def deliver(
    session: AsyncSession, outbox: Outbox, user_id: uuid.UUID, card: ReviewCard
) -> CardDelivery:
    """Send a card. The delivery is recorded only once Telegram has the
    message: its id is what the feedback edits."""
    delivery_id = uuid.uuid7()
    message_id = await outbox.send(
        _question(await _title(session, card), card),
        keyboard=_buttons(delivery_id, card, []),
    )
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


async def _title(session: AsyncSession, card: ReviewCard) -> str:
    return (await subject.materials(session, [card.lesson]))[card.lesson].title


def _locator(card: ReviewCard) -> str:
    return card.lesson if card.anchor is None else f"{card.lesson}#{card.anchor}"


def _right(card: ReviewCard) -> str:
    if card.kind == "order":
        assert isinstance(card.answer, list)
        return _sequence(card.answer)
    assert isinstance(card.answer, int)
    right = card.options[card.answer]
    return f"line {right}" if card.kind == "spot_error" else escape(right, quote=False)


def _feedback(title: str, section: str, sent: CardDelivery, card: ReviewCard) -> str:
    link = lesson_url(_locator(card))
    mark = RIGHT if sent.outcome == "correct" else WRONG
    chosen = None
    if card.kind == "order":
        assert isinstance(sent.chosen, list)
        chosen = sent.chosen
    return (
        f"{_question(title, card, chosen)}\n\n{mark} {_right(card)}. "
        f"{escape(card.explanation, quote=False)} "
        f'<a href="{escape(link)}">{escape(section, quote=False)}</a>'
    )


def _tapped(data: str) -> tuple[uuid.UUID, str] | None:
    """`<prefix>:<delivery_id>:<value>`, the one shape every card button's
    `callback_data` has, as the delivery id and the raw value."""
    _, _, payload = data.partition(":")
    delivery_id, _, value = payload.partition(":")
    try:
        return uuid.UUID(delivery_id), value
    except ValueError:
        return None


async def _open(
    outbox: Outbox, tap: Tap
) -> tuple[CardDelivery, ReviewCard, str] | None:
    """The tapped card, if it is this learner's and still open. A card closed
    any way — tapped, graded in conversation, expired as ignored — is closed:
    a late tap must not move the ladder for it."""
    tapped = _tapped(tap.data)
    if tapped is None:
        return None
    delivery_id, value = tapped
    found = await repository.delivery(outbox.session, outbox.link.user_id, delivery_id)
    if found is None:
        return None
    sent, card = found
    if sent.answered_at is not None or sent.outcome is not None:
        return None
    return sent, card, value


async def _grade(
    outbox: Outbox,
    sent: CardDelivery,
    card: ReviewCard,
    outcome: repository.Tapped,
    chosen: int | list[int],
) -> None:
    await repository.grade(outbox.session, sent, card, outcome, chosen=chosen)
    await outbox.session.commit()
    title = await _title(outbox.session, card)
    chunk = section_of(await sections(outbox.session, card.lesson), _locator(card))
    section = title if chunk is None else chunk.title
    await outbox.edit_text(sent.tg_message_id, _feedback(title, section, sent, card))


async def answer(outbox: Outbox, tap: Tap) -> None:
    """A tapped option, graded against the marked answer and shown in place of
    the buttons. A card answered once is answered: a second tap, or a tap on a
    card already graded in conversation, changes nothing."""
    found = await _open(outbox, tap)
    if found is None:
        return
    sent, card, value = found
    try:
        option = int(value)
    except ValueError:
        return
    if card.kind == "order" or not 0 <= option < len(card.options):
        return
    await _grade(
        outbox, sent, card, "correct" if option == card.answer else "wrong", option
    )


async def arrange(outbox: Outbox, tap: Tap) -> None:
    """One number tapped on an `order` card, or Reset.

    The order so far is kept on the delivery, not in this process: the bot may
    restart between two taps. The card is graded on the tap that places the
    last step, whole or not at all — partial credit would need a rule the
    learner cannot see. Until then the card is as unanswered as one nobody
    touched.
    """
    found = await _open(outbox, tap)
    if found is None:
        return
    sent, card, value = found
    if card.kind != "order":
        return
    so_far = sent.chosen or []
    assert isinstance(so_far, list)
    if value == RESET:
        if not so_far:
            return
        chosen: list[int] = []
    else:
        try:
            placed = int(value)
        except ValueError:
            return
        if not 0 <= placed < len(card.options) or placed in so_far:
            return
        chosen = [*so_far, placed]
    if len(chosen) == len(card.options):
        await _grade(
            outbox, sent, card, "correct" if chosen == card.answer else "wrong", chosen
        )
        return
    # Reassigned, never appended to: SQLAlchemy does not see a JSONB value
    # changed in place.
    sent.chosen = chosen or None
    await outbox.session.commit()
    await outbox.edit_text(
        sent.tg_message_id,
        _question(await _title(outbox.session, card), card, chosen),
        keyboard=_buttons(sent.id, card, chosen),
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
