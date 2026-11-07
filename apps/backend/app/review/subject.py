"""What a review is *about*: the lesson's concepts, and the cards it was put as.

A card that asks "what was that lesson about" is a card about nothing. The
subject is the concepts the lesson introduces, as the course itself defines
them, plus the ones it is easiest to confuse them with — which the spine
already knows, because it says which lesson introduced each concept and in
what order the lessons are read.
"""

from collections.abc import Collection, Iterator, Sequence
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.content.locators import course_of
from app.content.structure import (
    ConceptEntry,
    CourseStructure,
    LessonEntry,
    reading_order,
    structure,
)
from app.harness import prompts
from app.models import CardDelivery, ReviewCard
from app.review.repository import ASKED, OWN_WORDS

SENT = "Review cards sent in the last day"
# The cards are graded by taps, which are not messages: a chat run sees only
# what the learner wrote. This block is what lets it read "the second one,
# surely" as an answer to a card, and the module it carries is what tells it
# how to grade one.
CLOSE = "\n\n".join(
    (
        prompts.module("review.md"),
        "If what the learner writes answers one of these cards in their own "
        "words and it is not graded yet, grade it with `report_review_outcome` "
        "and carry on with what they came for. If it does not, answer what "
        "they asked and leave the cards alone.",
    )
)


@dataclass(frozen=True)
class Material:
    """One lesson's worth of review subject."""

    lesson: str
    title: str
    concepts: list[ConceptEntry]
    confusable: list[ConceptEntry]


def _neighbours(order: Sequence[LessonEntry], position: int) -> set[str]:
    """The lessons either side of this one. Concepts introduced next door are
    the ones a learner mixes up with these — they were met days apart, in the
    same notation, about the same object."""
    around = (position - 1, position + 1)
    return {order[index].slug for index in around if 0 <= index < len(order)}


def _material(course: CourseStructure, lesson: str) -> Material | None:
    order = reading_order(course)
    position = next(
        (index for index, entry in enumerate(order) if entry.locator == lesson),
        None,
    )
    if position is None:
        return None
    entry = order[position]
    taught = set(entry.introduces) | set(entry.reinforces)
    nearby = _neighbours(order, position)
    return Material(
        lesson=lesson,
        title=entry.title,
        concepts=[concept for concept in course.concepts if concept.id in taught],
        confusable=[
            concept
            for concept in course.concepts
            if concept.id not in taught and concept.introduced_in in nearby
        ],
    )


async def materials(
    session: AsyncSession, lessons: Collection[str]
) -> dict[str, Material]:
    """One pass over the spine of every course the lessons belong to.

    A lesson the index no longer carries still has a ladder; it arrives under
    its locator, without concepts.
    """
    spines = {
        spine.course: spine
        for slug in sorted({course_of(lesson) for lesson in lessons} - {""})
        for spine in await structure(session, slug)
    }
    found = {}
    for lesson in lessons:
        spine = spines.get(course_of(lesson))
        material = _material(spine, lesson) if spine is not None else None
        found[lesson] = material or Material(
            lesson=lesson, title=lesson, concepts=[], confusable=[]
        )
    return found


def concepts(material: Material) -> Iterator[str]:
    for concept in material.concepts:
        yield f"- {concept.name}: {concept.definition}"
    for concept in material.confusable:
        yield f"- confusable with {concept.name}: {concept.definition}"


def _shown(card: ReviewCard, chosen: int | list[int]) -> str:
    if card.kind == "order":
        assert isinstance(chosen, list)
        return " then ".join(repr(card.options[step]) for step in chosen)
    assert isinstance(chosen, int)
    return repr(card.options[chosen])


def _status(delivery: CardDelivery, card: ReviewCard) -> str:
    if delivery.outcome is None:
        return "not answered yet"
    if delivery.chosen is None:
        return f"graded {delivery.outcome}"
    tapped = f"tapped {_shown(card, delivery.chosen)}: {delivery.outcome}"
    own = delivery.follow_ups.get(OWN_WORDS)
    if own is None:
        return tapped
    if own == ASKED:
        return (
            f"{tapped}; they asked to answer it in their own words, which is "
            "not graded yet"
        )
    return f"{tapped}; their own words graded {own}"


async def open_block(
    session: AsyncSession, sent: Sequence[tuple[CardDelivery, ReviewCard]]
) -> tuple[prompts.ContextBlock, ...]:
    """The cards a learner's message may be about, with the ids the tutor
    grades a written answer by."""
    if not sent:
        return ()
    found = await materials(session, {card.lesson for _, card in sent})
    body = [
        f"- {found[card.lesson].title} (`{card.lesson}`), delivery "
        f"`{delivery.id}`, sent {delivery.sent_at:%Y-%m-%d %H:%M} UTC, "
        f"{_status(delivery, card)}.\n"
        f"  Question: {card.prompt}\n"
        f"  Options: {' | '.join(card.options)}\n"
        f"  Right answer: {_shown(card, card.answer)}. {card.explanation}"
        for delivery, card in sent
    ]
    return (prompts.ContextBlock(title=SENT, body="\n".join([*body, "", CLOSE])),)
