import json
from pathlib import Path
from typing import Any

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.labs.ingest import ingest
from app.models import LabChallenge
from tests.labs.conftest import DIGEST, LESSON, SPECS, VERSION

# The shape `apps/frontend/lib/labs/python/build_lab.py` writes: the answer key
# flat, and under `public` the same half its manifest publishes.
ARTIFACT: dict[str, Any] = {
    "lab": "information-theory/surprisal-lab",
    "content_version": VERSION,
    "checkpoints": {
        "surprisal": {
            "kind": "exact",
            **SPECS["surprisal"]["private"],
            "public": SPECS["surprisal"]["public"],
        },
        "why-uniform": {
            "kind": "review",
            **SPECS["why-uniform"]["private"],
            "public": {},
        },
    },
}


@pytest.fixture
def built(tmp_path: Path) -> Path:
    """A `labs-dist/private` the build could have written."""
    lab = tmp_path / "information-theory"
    lab.mkdir()
    (lab / "surprisal-lab.json").write_text(json.dumps(ARTIFACT))
    return tmp_path


async def stored(session: AsyncSession) -> dict[str, LabChallenge]:
    rows = await session.scalars(select(LabChallenge))
    return {row.checkpoint: row for row in rows}


async def test_a_built_lab_becomes_the_challenges_the_api_grades_against(
    session: AsyncSession, built: Path
) -> None:
    report = await ingest(session, built)

    assert (report.labs, report.checkpoints, report.removed) == (1, 2, 0)
    rows = await stored(session)
    assert rows["surprisal"].lesson == LESSON
    assert rows["surprisal"].kind == "exact"
    assert rows["surprisal"].content_version == bytes.fromhex(VERSION)
    assert rows["surprisal"].spec == {
        "public": SPECS["surprisal"]["public"],
        "private": SPECS["surprisal"]["private"],
    }
    assert rows["why-uniform"].spec["private"]["rubric"].startswith("Pass if")


async def test_ingesting_the_same_build_again_changes_nothing(
    session: AsyncSession, built: Path
) -> None:
    await ingest(session, built)

    report = await ingest(session, built)

    assert (report.checkpoints, report.removed) == (2, 0)
    assert set(await stored(session)) == {"surprisal", "why-uniform"}


async def test_a_checkpoint_the_author_deleted_stops_being_verifiable(
    session: AsyncSession, built: Path
) -> None:
    await ingest(session, built)
    artifact = dict(ARTIFACT)
    artifact["checkpoints"] = {"surprisal": ARTIFACT["checkpoints"]["surprisal"]}
    (built / "information-theory" / "surprisal-lab.json").write_text(
        json.dumps(artifact)
    )

    report = await ingest(session, built)

    assert report.removed == 1
    assert set(await stored(session)) == {"surprisal"}


async def test_a_directory_with_no_artifacts_leaves_the_table_alone(
    session: AsyncSession, built: Path, tmp_path: Path
) -> None:
    """A reindex from a machine that skipped the lab build must not un-verify
    every lab on the site."""
    await ingest(session, built)

    report = await ingest(session, tmp_path / "never-built")

    assert (report.labs, report.removed) == (0, 0)
    assert set(await stored(session)) == {"surprisal", "why-uniform"}


async def test_the_answer_key_never_reaches_the_public_half(
    session: AsyncSession, built: Path
) -> None:
    await ingest(session, built)

    rows = await stored(session)

    for row in rows.values():
        served = json.dumps(row.spec["public"])
        for secret in ("expected", "wrong", "rubric", "labels", DIGEST):
            assert secret not in served
