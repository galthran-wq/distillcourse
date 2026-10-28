"""Filing the chats that predate `chats.course` under a course, once.

Which course a conversation is about is a judgement, so it is made in two
steps a person stands between: `propose` reads each chat for the locators it
carries and prints what they point at, the person settles every row the
evidence does not, and `apply` writes the list they signed off.
"""

import re
import uuid
from collections import Counter
from collections.abc import Iterable, Iterator, Sequence
from dataclasses import dataclass

from pydantic_ai.messages import (
    ModelMessage,
    ModelMessagesTypeAdapter,
    ModelRequest,
    ToolCallPart,
    UserPromptPart,
)
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.content.locators import ANCHOR, SLUG, course_of
from app.content.structure import structure
from app.models import Chat, Message

# Written in the cell a person fills in: no course the evidence agrees on.
UNDECIDED = "?"
# What the person writes for a chat that belongs to no course.
GENERAL = "general"
# Enough of the first question to tell what it was about, on one line.
SUBJECT_LENGTH = 200

# The position block the harness puts in a turn's instructions
# (`harness/context.py`), and a reference as a message writes one — a quoted
# passage or an `@` mention in what the learner wrote.
_READING = re.compile(rf"They are reading `(lesson:{SLUG}/{SLUG})(?:#{ANCHOR})?`")
_REFERENCE = re.compile(rf"\[\[((?:lesson|research|concept|course):{SLUG}[^\]]*)\]\]")


@dataclass(frozen=True)
class Proposal:
    chat_id: uuid.UUID
    title: str | None
    course: str
    evidence: Counter[tuple[str, str]]
    subject: str

    def row(self) -> str:
        evidence = ", ".join(
            f"{source} {course} x{count}"
            for (source, course), count in self.evidence.most_common()
        )
        cells = [
            str(self.chat_id),
            self.title or "",
            self.course,
            evidence,
            self.subject,
        ]
        return "\t".join(" ".join(cell.split()) for cell in cells)


def evidence(message: ModelMessage) -> Iterator[tuple[str, str]]:
    """`(source, course)` for every course one stored message points at.

    Tool returns are not read: a search answers across every course, so what
    it found says what the index holds rather than what was asked about.
    """
    if isinstance(message, ModelRequest):
        for found in _READING.finditer(message.instructions or ""):
            yield "reading", course_of(found[1])
    for part in message.parts:
        if isinstance(part, UserPromptPart) and isinstance(part.content, str):
            for found in _REFERENCE.finditer(part.content):
                yield "quoted", course_of(found[1])
        elif isinstance(part, ToolCallPart) and part.tool_name == "fetch_content":
            locator = part.args_as_dict().get("locator")
            if isinstance(locator, str) and ":" in locator:
                yield "fetched", course_of(locator)
        elif isinstance(part, ToolCallPart) and part.tool_name == "search_content":
            course = part.args_as_dict().get("course")
            if isinstance(course, str) and course:
                yield "searched", course


def _subject(rows: Sequence[Message], messages: Sequence[ModelMessage]) -> str:
    # The learner's own first words: a compaction summary or a message the
    # platform started by itself is stored as a prompt too, under another role.
    for row, message in zip(rows, messages, strict=True):
        if row.role != "user":
            continue
        for part in message.parts:
            if isinstance(part, UserPromptPart) and isinstance(part.content, str):
                return part.content[:SUBJECT_LENGTH]
    return ""


def classify(chat: Chat, rows: Sequence[Message], courses: set[str]) -> Proposal:
    """A course only where every pointer the chat carries agrees on one that
    still exists; anything else is left for the person to read."""
    messages = ModelMessagesTypeAdapter.validate_python(
        [row.pydantic_ai for row in rows]
    )
    found = Counter(item for message in messages for item in evidence(message))
    named = {course for _, course in found}
    course = next(iter(named)) if len(named) == 1 and named <= courses else UNDECIDED
    return Proposal(chat.id, chat.title, course, found, _subject(rows, messages))


async def propose(session: AsyncSession) -> list[Proposal]:
    """Every web chat not filed under a course yet."""
    courses = {course.course for course in await structure(session)}
    chats = (
        await session.scalars(
            select(Chat)
            .where(Chat.kind == "web", Chat.course.is_(None))
            .order_by(Chat.created_at)
        )
    ).all()
    proposals = []
    for chat in chats:
        rows = (
            await session.scalars(
                select(Message).where(Message.chat_id == chat.id).order_by(Message.id)
            )
        ).all()
        proposals.append(classify(chat, rows, courses))
    return proposals


def parse(lines: Iterable[str]) -> dict[uuid.UUID, str | None]:
    """The reviewed list: a proposal row per line with its third cell settled
    to a course slug or `general`. One still `?` is a row nobody decided, and
    refusing the whole file is what keeps it from being filed by default."""
    filed: dict[uuid.UUID, str | None] = {}
    for number, line in enumerate(lines, 1):
        if not line.strip():
            continue
        cells = line.rstrip("\n").split("\t")
        if len(cells) < 3 or cells[2] in ("", UNDECIDED):
            raise ValueError(f"line {number}: no course decided")
        filed[uuid.UUID(cells[0])] = None if cells[2] == GENERAL else cells[2]
    return filed


async def apply(
    session: AsyncSession, filed: dict[uuid.UUID, str | None]
) -> Counter[str]:
    courses = {course.course for course in await structure(session)}
    unknown = {course for course in filed.values() if course is not None} - courses
    if unknown:
        raise ValueError(f"not a course in the index: {', '.join(sorted(unknown))}")
    counts: Counter[str] = Counter()
    for chat_id, course in filed.items():
        # Only a chat still unfiled: one a page or the reader's own "Move to…"
        # filed since the proposal was printed keeps where it was put.
        filing = await session.execute(
            update(Chat)
            .where(Chat.id == chat_id, Chat.kind == "web", Chat.course.is_(None))
            .values(course=course)
            .returning(Chat.id)
        )
        if filing.first() is not None:
            counts[course or GENERAL] += 1
    await session.commit()
    return counts
