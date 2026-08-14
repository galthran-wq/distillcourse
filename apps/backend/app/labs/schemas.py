import uuid
from datetime import datetime
from typing import Annotated, Any

from pydantic import BaseModel, Field

from app.content import locators

# One float per held-out row and nothing larger: an `exact` payload is at most
# 64 numbers or a digest, and a `review` one is 4000 characters.
MAX_SUBMISSION_BYTES = 256 * 1024

Lesson = Annotated[str, Field(pattern=rf"^{locators.LESSON.pattern}$")]
Checkpoint = Annotated[
    str, Field(pattern=locators.SLUG_PATTERN, max_length=locators.CHECKPOINT_LENGTH)
]
# sha256 of the lab's sources, hex — what the build stamped both the notebook
# and the answer key with.
ContentVersion = Annotated[str, Field(pattern=r"^[0-9a-f]{64}$")]


class Redemption(BaseModel):
    """A pairing code posted back by the notebook that was handed it."""

    code: str


class Token(BaseModel):
    """The one response a raw lab token ever rides in — redeeming a pairing
    code, or the device poll that found its approval."""

    token: str


class Device(BaseModel):
    """What starting a device pairing hands the notebook: the code it will
    poll, and the URL the learner approves at — built server-side so the
    client needs no idea how the site's routes are laid out."""

    code: str
    approve_url: str
    expires_at: datetime


class Submission(BaseModel):
    """One posted attempt at one checkpoint."""

    # The notebook's, not ours: a post retried over a dropped connection
    # carries the same id and is answered with the verdict it already earned.
    id: uuid.UUID
    # The locator the manifest handed out, echoed back — the client never
    # builds one.
    lesson: Lesson
    checkpoint: Checkpoint
    content_version: ContentVersion
    payload: Any


class Completion(BaseModel):
    """How close the lab is to done. Optional checkpoints are counted by
    neither number: only the required set gates the lesson."""

    passed_required: int
    total_required: int


class SubmissionResult(BaseModel):
    passed: bool | None
    hint: str | None
    score: float | None
    pending: bool
    progress: Completion


class ManifestCheckpoint(BaseModel):
    id: Checkpoint
    kind: str
    text: str
    required: bool
    # The build's public half of the checkpoint: `seed`/`inputs_code`/`atol`
    # for `exact`, `metric`/`threshold`/`holdout` for `metric`. Served whole
    # and never assembled field by field, so nothing private reaches a learner
    # by being forgotten in a whitelist.
    spec: dict[str, Any]


class Manifest(BaseModel):
    lesson: Lesson
    content_version: ContentVersion
    data_files: list[str]
    checkpoints: list[ManifestCheckpoint]


class CheckpointProgress(BaseModel):
    """One checkpoint's standing, and nothing about what the checkpoint is:
    its kind, wording and required flag are content, which the page reads from
    the lesson's own `lab` block. Restating them here would offer a second
    source for the same fact, and the wrong one."""

    id: Checkpoint
    attempts: int
    passed_at: datetime | None
    best_score: float | None
    feedback: str | None


class Progress(BaseModel):
    checkpoints: list[CheckpointProgress]
