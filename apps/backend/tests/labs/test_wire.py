"""The API's half of the shapes `python/wire_shapes.json` pins.

The build writes the private artifact, this app ingests it and answers a
notebook, and `apps/lab-client` reads those answers — three implementations
whose test material states the same shapes three times. This file is what
stops a rename in one of them from passing every suite while a real notebook
posts a body the server refuses, or reads a field that no longer exists.
"""

import json
from pathlib import Path
from typing import Any

from pydantic import BaseModel

from app.labs.schemas import (
    CheckpointProgress,
    Completion,
    Device,
    Manifest,
    ManifestCheckpoint,
    Submission,
    SubmissionResult,
    Token,
)
from tests.labs.conftest import DECLARED, SPECS
from tests.labs.test_ingest import ARTIFACT

SHAPES: dict[str, Any] = json.loads(
    (
        Path(__file__).parents[3] / "frontend/lib/labs/python/wire_shapes.json"
    ).read_text()
)


def fields(model: type[BaseModel]) -> set[str]:
    return set(model.model_fields)


def test_every_message_the_notebook_exchanges_has_the_pinned_fields() -> None:
    assert fields(Device) == set(SHAPES["device"])
    assert fields(Token) == set(SHAPES["token"])
    assert fields(Manifest) == set(SHAPES["manifest"])
    assert fields(ManifestCheckpoint) == set(SHAPES["manifest_checkpoint"])
    assert fields(Submission) == set(SHAPES["submission"])
    assert fields(SubmissionResult) == set(SHAPES["submission_result"])
    assert fields(Completion) == set(SHAPES["completion"])
    assert fields(CheckpointProgress) == set(SHAPES["checkpoint_progress"])


def test_the_artifact_this_suite_ingests_is_the_one_the_build_writes() -> None:
    """The fixture is hand-written — small enough to read, small enough to
    drift away from what `build_lab.py` actually produces."""
    assert set(ARTIFACT) == set(SHAPES["private_artifact"])
    for checkpoint, record in ARTIFACT["checkpoints"].items():
        assert set(record) == set(SHAPES["private_checkpoint"][record["kind"]]), (
            checkpoint
        )


def test_the_answer_keys_this_suite_grades_against_are_the_ones_the_build_writes() -> (
    None
):
    """`SPECS` is the stored form: the artifact's `public` half under `public`
    and everything else, `kind` excepted, under `private`. That split is
    `ingest._rows`, and what `verify` and `judge` are handed."""
    for entry in DECLARED:
        pinned = set(SHAPES["private_checkpoint"][entry["kind"]]) - {"kind", "public"}
        assert set(SPECS[entry["id"]]["private"]) == pinned, entry["id"]
