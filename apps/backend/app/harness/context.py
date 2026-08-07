"""What a run is told about the learner before the conversation starts.

Rebuilt per run, and #10 fixes what it holds: the learner's clock, the index of
what the tutor remembers (#18), one line about what they have read (#8), and —
when the client sent a position — where that is in the course spine and the
full text of the section on their screen (#11).

The section is prefetched rather than left to `fetch_content`, because the
question the widget exists for is "why is this true?" with nothing selected: a
model that answers that without reading the section answers blind, and a model
that always fetches first spends a round trip on what the request already knew.
"""

from collections.abc import Sequence
from datetime import datetime

from app.content.locators import course_of
from app.content.search import section_of, sections
from app.content.structure import (
    CourseStructure,
    LessonEntry,
    module_of,
    reading_order,
    structure,
)
from app.core.clock import zone
from app.core.config import settings
from app.harness.prompts import ContextBlock
from app.harness.repository import HarnessRepository
from app.memory import repository as memory
from app.models import Memory
from app.telemetry import progress

# How much of the section on screen is inlined. Past this it is named and left
# to `fetch_content`: one long chapter must not spend the window the
# conversation itself needs.
SECTION_CHARS = 6000


async def _clock(repo: HarnessRepository) -> ContextBlock:
    """Every run carries the learner's clock: a reminder they ask for is set
    from the model's reading of "Friday", and the model has no clock at all."""
    user = await repo.user()
    now = datetime.now(zone(user.timezone))
    return ContextBlock(
        title="The learner's clock",
        body=f"Their timezone is `{user.timezone}`; it is {now:%A %Y-%m-%d %H:%M} there.",
    )


def _index_line(row: Memory) -> str:
    # A row the learner rewrote on their own page says so. Saving under that
    # slug replaces their wording with the tutor's, and the index is the only
    # place a run could learn which lines it was corrected on.
    if row.source == "user":
        return f"- `{row.slug}` (the learner corrected this): {row.description}"
    return f"- `{row.slug}`: {row.description}"


async def memory_index(repo: HarnessRepository) -> tuple[ContextBlock, ...]:
    """What the tutor remembers about the learner, as slugs and descriptions.

    The bodies stay out: a memory is a paragraph, and the whole design is that
    the model fetches the few its descriptions say bear on the question. Public
    because a compaction is given the same index — that is what makes it
    consolidate the profile instead of growing it.
    """
    rows = await memory.index(repo.session, repo.user_id)
    if not rows:
        return ()
    lines = [_index_line(row) for row in rows]
    if len(rows) > settings.MEMORY_INDEX_SOFT_CAP:
        lines.append(
            f"\nThis is more than the {settings.MEMORY_INDEX_SOFT_CAP} lines this "
            "profile is meant to be: merge the memories that overlap and delete "
            "the ones that no longer hold, rather than adding another."
        )
    return (
        ContextBlock(
            title="What you remember about the learner",
            body="\n".join(lines),
        ),
    )


async def _progress(repo: HarnessRepository) -> tuple[ContextBlock, ...]:
    """One line about what they have read.

    The per-lesson detail is `get_user_progress`; this is what tells a run there
    is something to ask it for, and what keeps an answer from addressing a
    reader of forty lessons as if they had opened none.
    """
    readings = await progress.of_reader(repo.session, repo.user_id)
    if not readings:
        return ()
    finished = [reading for reading in readings if reading.completed_at is not None]
    latest = readings[0]
    return (
        ContextBlock(
            title="What the learner has read",
            body=(
                f"They have finished {len(finished)} of the {len(readings)} lessons "
                f"they have opened; the last one they read was `{latest.lesson}`, on "
                f"{latest.last_seen:%Y-%m-%d}. `get_user_progress` has the rest, "
                "including which solutions they have already opened."
            ),
        ),
    )


def _spine_lines(courses: Sequence[CourseStructure], lesson: str) -> list[str]:
    """Where this lesson sits in its course, what it is read after, and what it
    teaches — the part of the spine that bears on a question asked here."""
    for course in courses:
        order = reading_order(course)
        entry = next((item for item in order if item.locator == lesson), None)
        if entry is None:
            continue
        return [
            _position_line(course, order, entry),
            *_prerequisite_lines(order, entry),
            *_concept_lines(course, entry),
        ]
    return []


def _position_line(
    course: CourseStructure, order: Sequence[LessonEntry], entry: LessonEntry
) -> str:
    module = module_of(course, entry)
    where = (
        f'"{course.title}"' if module is None else f'"{course.title}", {module.title}'
    )
    return f'"{entry.title}" is lesson {order.index(entry) + 1} of {len(order)} in {where}.'


def _prerequisite_lines(order: Sequence[LessonEntry], entry: LessonEntry) -> list[str]:
    # By title, not by slug: the prerequisite is named to the learner in an
    # answer, and a slug is not what the lesson is called.
    titles = [item.title for item in order if item.slug in entry.prerequisites]
    return [f"It is read after: {', '.join(titles)}."] if titles else []


def _concept_lines(course: CourseStructure, entry: LessonEntry) -> list[str]:
    taught = set(entry.introduces) | set(entry.reinforces)
    return [
        f"- {concept.name}: {concept.definition}"
        for concept in course.concepts
        if concept.id in taught
    ]


def _bounded(text: str) -> str:
    if len(text) <= SECTION_CHARS:
        return text
    return (
        f"{text[:SECTION_CHARS]}\n\n[cut here; `fetch_content` has the whole section]"
    )


async def _position(
    repo: HarnessRepository, current_locator: str | None
) -> tuple[ContextBlock, ...]:
    if current_locator is None:
        return ()
    session = repo.session
    path = current_locator.partition("#")[0]
    lines = [
        f"They are reading `{current_locator}`.",
        *_spine_lines(await structure(session, course_of(path)), path),
    ]
    blocks = [ContextBlock(title="Where the learner is", body="\n".join(lines))]
    # The lesson may not be in the index at all — a locator from a page built
    # before the last reindex — in which case they are still somewhere, and
    # only the section text is missing.
    chunk = section_of(await sections(session, path), current_locator)
    if chunk is not None:
        blocks.append(
            ContextBlock(
                title="The section on their screen",
                body=f"`{chunk.locator}` — {chunk.breadcrumb}\n\n{_bounded(chunk.text)}",
            )
        )
    return tuple(blocks)


async def blocks(
    repo: HarnessRepository,
    *,
    current_locator: str | None = None,
    extra: tuple[ContextBlock, ...] = (),
) -> tuple[ContextBlock, ...]:
    """The whole assembly, in the order the prompt reads it. `extra` is what
    the caller knows and this module cannot — the reviews a poller run is
    delivering, the one a conversation walked into."""
    return (
        await _clock(repo),
        *await memory_index(repo),
        *await _progress(repo),
        *await _position(repo, current_locator),
        *extra,
    )
