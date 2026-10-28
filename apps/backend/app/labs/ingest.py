"""Loading the labs' answer keys into the database.

The build writes one `labs-dist/private/<course>/<lesson>.json` per lab beside
the public half it publishes to the mirror; this is the only reader of it. The
keys deliberately do not travel with the content index: an expected output, a
held-out label or a rubric in `documents` is a passage search returns and the
tutor quotes, which is exactly what they exist not to be.

The same artifact carries the lab's reference solution, which lands in
`lab_solutions` — a table the lab tools read for a lab chat, and search never
does.
"""

import json
from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from sqlalchemy import Table, delete, tuple_
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.content.locators import CHECKPOINT_LENGTH, lesson_key
from app.models import Base, LabChallenge, LabSolution

CHALLENGES = Base.metadata.tables["lab_challenges"]
SOLUTIONS = Base.metadata.tables["lab_solutions"]


@dataclass
class LabIngestReport:
    labs: int
    checkpoints: int
    removed: int


async def ingest(session: AsyncSession, root: Path) -> LabIngestReport:
    """Bring the stored challenges up to what the build last wrote.

    The directory is the complete picture of the labs that exist, so a
    checkpoint an author deleted stops being verifiable here. An empty or
    absent directory means the labs were never built rather than that there are
    none, and leaves the table alone — otherwise a reindex from a machine that
    skipped the lab build would un-verify every lab on the site.
    """
    artifacts = sorted(root.glob("*/*.json")) if root.is_dir() else []
    if not artifacts:
        return LabIngestReport(labs=0, checkpoints=0, removed=0)

    loaded = {path: json.loads(path.read_text()) for path in artifacts}
    rows = [row for path, artifact in loaded.items() for row in _rows(path, artifact)]
    await _upsert(session, CHALLENGES, rows, ["lesson", "checkpoint"])
    solutions = [_solution(artifact) for artifact in loaded.values()]
    await _upsert(session, SOLUTIONS, solutions, ["lesson"])
    await session.execute(
        delete(LabSolution).where(
            LabSolution.lesson.not_in([row["lesson"] for row in solutions])
        )
    )
    removed = (
        await session.scalars(
            delete(LabChallenge)
            .where(
                tuple_(LabChallenge.lesson, LabChallenge.checkpoint).not_in(
                    [(row["lesson"], row["checkpoint"]) for row in rows]
                )
            )
            .returning(LabChallenge.checkpoint)
        )
    ).all()
    await session.commit()
    return LabIngestReport(
        labs=len(artifacts), checkpoints=len(rows), removed=len(removed)
    )


async def _upsert(
    session: AsyncSession, table: Table, rows: list[dict[str, Any]], key: list[str]
) -> None:
    statement = insert(table).values(rows)
    await session.execute(
        statement.on_conflict_do_update(
            index_elements=key,
            set_={
                name: statement.excluded[name] for name in rows[0] if name not in key
            },
        )
    )


def _lesson(artifact: dict[str, Any]) -> str:
    course, _, slug = str(artifact["lab"]).partition("/")
    return lesson_key(course, slug)


def _solution(artifact: dict[str, Any]) -> dict[str, Any]:
    return {
        "lesson": _lesson(artifact),
        "source": artifact["solution"],
        "content_version": bytes.fromhex(artifact["content_version"]),
    }


def _rows(path: Path, artifact: dict[str, Any]) -> Iterator[dict[str, Any]]:
    lesson = _lesson(artifact)
    version = bytes.fromhex(artifact["content_version"])
    for checkpoint, record in artifact["checkpoints"].items():
        if len(checkpoint) > CHECKPOINT_LENGTH:
            raise ValueError(
                f"{path}: checkpoint id {checkpoint!r} is longer than "
                f"{CHECKPOINT_LENGTH} characters"
            )
        yield {
            "lesson": lesson,
            "checkpoint": checkpoint,
            "kind": record["kind"],
            # Split rather than flattened: the manifest serves `public` whole
            # and reads nothing else, so no field of the answer key can reach a
            # learner by being forgotten in a whitelist.
            "spec": {
                "public": record["public"],
                "private": {
                    key: value
                    for key, value in record.items()
                    if key not in ("public", "kind")
                },
            },
            "content_version": version,
        }
