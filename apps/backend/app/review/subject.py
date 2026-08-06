"""What a review is *about*, assembled for the run that conducts it.

A review that asks "what was that lesson about" is a review of nothing. The
subject is the concepts the lesson introduces, as the course itself defines
them, plus the ones it is easiest to confuse them with — which the spine
already knows, because it says which lesson introduced each concept and in
what order the lessons are read.
"""

from collections.abc import Iterator, Sequence
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
from app.models import Schedule
from app.review import ladder

DUE = "The reviews due now"
OPEN = "The review still open"

CONDUCT = (
    "Each item is one lesson. Ask about one of them, wait for the answer, "
    "judge it, and only then offer the next. Every item you get an answer on "
    "is reported with `report_review_outcome`, quoting its schedule id."
)
# The poller's message is a `review` run and carries the review module in its
# system prompt. Every turn after it — the answer, the judging, the follow-ups,
# the grading call — is an incoming message, and that is a `chat` run, whose
# modules do not include it. So the block that hands a chat run the open review
# hands it the rules for conducting one as well; without this the dialogue the
# module describes is in force only for the question nobody has answered yet.
CLOSE = "\n\n".join(
    (
        prompts.module("review.md"),
        "The learner has written to you while a review of theirs was open. If "
        "what they say answers it, grade it with `report_review_outcome` and "
        "carry on with what they came for. If it does not, answer what they "
        "asked and leave the review alone — it comes back another day.",
    )
)


@dataclass(frozen=True)
class Material:
    """One lesson's worth of review subject."""

    row: Schedule
    title: str
    concepts: list[ConceptEntry]
    confusable: list[ConceptEntry]


def _neighbours(order: Sequence[LessonEntry], position: int) -> set[str]:
    """The lessons either side of this one. Concepts introduced next door are
    the ones a learner mixes up with these — they were met days apart, in the
    same notation, about the same object."""
    around = (position - 1, position + 1)
    return {order[index].slug for index in around if 0 <= index < len(order)}


def _material(course: CourseStructure, row: Schedule) -> Material | None:
    order = reading_order(course)
    position = next(
        (
            index
            for index, entry in enumerate(order)
            if entry.locator == row.payload["lesson"]
        ),
        None,
    )
    if position is None:
        return None
    entry = order[position]
    taught = set(entry.introduces) | set(entry.reinforces)
    nearby = _neighbours(order, position)
    return Material(
        row=row,
        title=entry.title,
        concepts=[concept for concept in course.concepts if concept.id in taught],
        confusable=[
            concept
            for concept in course.concepts
            if concept.id not in taught and concept.introduced_in in nearby
        ],
    )


def _lines(material: Material) -> Iterator[str]:
    row = material.row
    step = int(row.payload.get("step", 0))
    yield (
        f"- {material.title} (`{row.payload['lesson']}`), schedule `{row.id}`, "
        f"interval {step + 1} of {len(ladder.STEPS)}. "
        f"Ask for {ladder.question_format(step)}."
    )
    for concept in material.concepts:
        yield f"  - {concept.name}: {concept.definition}"
    for concept in material.confusable:
        yield f"  - confusable with {concept.name}: {concept.definition}"


async def _materials(session: AsyncSession, rows: Sequence[Schedule]) -> list[Material]:
    """One pass over the spine of every course the due items belong to.

    Keyed off the lesson locator the row carries rather than its `topic`, which
    is the poller's rotation field and says nothing about where the material is.
    """
    courses = {row.id: course_of(row.payload["lesson"]) for row in rows}
    spines = {
        spine.course: spine
        for slug in sorted(set(courses.values()) - {""})
        for spine in await structure(session, slug)
    }
    found = []
    for row in rows:
        spine = spines.get(courses[row.id])
        material = _material(spine, row) if spine is not None else None
        # A lesson the index no longer carries still has a ladder and still
        # gets asked about; it just arrives without its concepts.
        found.append(
            material
            or Material(
                row=row, title=row.payload["lesson"], concepts=[], confusable=[]
            )
        )
    return found


async def block(
    session: AsyncSession, rows: Sequence[Schedule], *, title: str, instruction: str
) -> tuple[prompts.ContextBlock, ...]:
    # A review names the lesson it is of. A row that does not is something else
    # the poller is carrying — a reminder, or a review whose payload predates
    # the ladder — and there is no subject matter to assemble for it.
    reviews = [row for row in rows if row.kind == "review" and "lesson" in row.payload]
    if not reviews:
        return ()
    body = [
        line
        for material in await _materials(session, reviews)
        for line in _lines(material)
    ]
    return (
        prompts.ContextBlock(title=title, body="\n".join([*body, "", instruction])),
    )


async def due_block(
    session: AsyncSession, rows: Sequence[Schedule]
) -> tuple[prompts.ContextBlock, ...]:
    """The material for the reviews the poller is delivering right now."""
    return await block(session, rows, title=DUE, instruction=CONDUCT)


async def open_block(
    session: AsyncSession, rows: Sequence[Schedule]
) -> tuple[prompts.ContextBlock, ...]:
    """The material for a review the learner has walked into mid-conversation.

    Without this a review hangs until it times out while the learner is right
    there, and an answer that arrives late is read as a change of subject.
    """
    return await block(session, rows, title=OPEN, instruction=CLOSE)
