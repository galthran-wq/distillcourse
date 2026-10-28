"""Filing the chats that predate `chats.course` under a course, once.

Which course a conversation is about is a judgement, so it is made in two
steps a person stands between: `propose` reads each chat for the locators it
carries and prints what they point at, the person settles every row the
evidence does not, and `apply` writes the list they signed off.
"""

import json
import re
import uuid
from collections import Counter
from collections.abc import Iterable, Iterator
from dataclasses import dataclass
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.content.locators import ANCHOR, SLUG, course_of
from app.content.structure import structure
from app.models import Chat, Message

# Written in the cell a person fills in: no course the evidence agrees on.
UNDECIDED = "?"
# What the person writes for a chat that belongs to no course.
GENERAL = "general"

# The position block the harness puts in a turn's instructions
# (`harness/context.py`), and a reference as a message writes one — a quoted
# passage, an `@` mention, a locator the tutor cited.
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


def _args(part: dict[str, Any]) -> dict[str, Any]:
    args = part.get("args")
    if isinstance(args, str):
        try:
            args = json.loads(args)
        except ValueError:
            return {}
    return args if isinstance(args, dict) else {}


def _texts(content: object) -> Iterator[str]:
    if isinstance(content, str):
        yield content
    elif isinstance(content, list):
        yield from (item for item in content if isinstance(item, str))


def evidence(payload: dict[str, Any]) -> Iterator[tuple[str, str]]:
    """`(source, course)` for every course one stored message points at.

    Tool returns are not read: a search answers across every course, so what
    it found says what the index holds rather than what was asked about.
    """
    for found in _READING.finditer(payload.get("instructions") or ""):
        yield "reading", course_of(found[1])
    for part in payload.get("parts", []):
        kind = part.get("part_kind")
        if kind == "user-prompt":
            for text in _texts(part.get("content")):
                for found in _REFERENCE.finditer(text):
                    yield "quoted", course_of(found[1])
        elif kind == "tool-call" and part.get("tool_name") == "fetch_content":
            locator = _args(part).get("locator")
            if isinstance(locator, str) and ":" in locator:
                yield "fetched", course_of(locator)
        elif kind == "tool-call" and part.get("tool_name") == "search_content":
            course = _args(part).get("course")
            if isinstance(course, str) and course:
                yield "searched", course


def _subject(payloads: Iterable[dict[str, Any]]) -> str:
    for payload in payloads:
        for part in payload.get("parts", []):
            if part.get("part_kind") == "user-prompt":
                return next(_texts(part.get("content")), "")[:200]
    return ""


def classify(
    chat_id: uuid.UUID,
    title: str | None,
    payloads: list[dict[str, Any]],
    courses: set[str],
) -> Proposal:
    """A course only where every pointer the chat carries agrees on one that
    still exists; anything else is left for the person to read."""
    found = Counter(item for payload in payloads for item in evidence(payload))
    named = {course for _, course in found}
    course = next(iter(named)) if len(named) == 1 and named <= courses else UNDECIDED
    return Proposal(chat_id, title, course, found, _subject(payloads))


async def propose(session: AsyncSession) -> list[Proposal]:
    """Every web chat not yet filed. Selected column by column rather than as
    `Chat`, so it reads a database the column has not been added to yet."""
    courses = {course.course for course in await structure(session)}
    chats = (
        await session.execute(
            select(Chat.id, Chat.title)
            .where(Chat.kind == "web")
            .order_by(Chat.created_at)
        )
    ).all()
    proposals = []
    for chat_id, title in chats:
        payloads = (
            await session.scalars(
                select(Message.pydantic_ai)
                .where(Message.chat_id == chat_id)
                .order_by(Message.id)
            )
        ).all()
        proposals.append(classify(chat_id, title, list(payloads), courses))
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
    for chat_id, course in filed.items():
        await session.execute(
            update(Chat)
            .where(Chat.id == chat_id, Chat.kind == "web")
            .values(course=course)
        )
    await session.commit()
    return Counter(course or GENERAL for course in filed.values())
