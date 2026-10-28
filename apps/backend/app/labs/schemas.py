import uuid
from datetime import datetime
from typing import Annotated, Any, Literal

from pydantic import AfterValidator, BaseModel, Field

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
    # The checked function as the notebook read it, for the review that follows
    # the verdict; null where the source cannot be read, and absent from a
    # client older than the review. Held to an attachment's cap by clamping
    # rather than refusing: nothing about the review may cost the verdict.
    source: (
        Annotated[str, AfterValidator(lambda text: text[:ATTACHMENT_CHARS])] | None
    ) = None


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


# What one attached object may weigh, and how many one question carries — the
# client's own caps (`distill.tutor.ATTACHMENT_CHARS`, `ATTACHMENTS`), held here too: a cap only a
# client keeps is not a cap.
ATTACHMENT_CHARS = 20_000
ATTACHMENTS = 16
QUESTION_CHARS = 8_000


class Attachment(BaseModel):
    """An object from the learner's kernel, as the notebook rendered it."""

    name: Annotated[str, Field(max_length=200)]
    kind: Literal["function", "table", "array", "value", "error"]
    text: Annotated[str, Field(max_length=ATTACHMENT_CHARS)]


class Ask(BaseModel):
    """A question asked from the notebook. No chat id continues the learner's
    latest chat in this lab."""

    text: Annotated[str, Field(min_length=1, max_length=QUESTION_CHARS)]
    chat_id: uuid.UUID | None = None
    attachments: Annotated[list[Attachment], Field(max_length=ATTACHMENTS)] = []


class CheckReview(BaseModel):
    """`distill.check` asking for the review of the verdict it just printed:
    the submission it posted names everything the review reads."""

    submission_id: uuid.UUID


class LabChat(BaseModel):
    chat_id: uuid.UUID
    # Where the chat opens on the site: the lab's lesson page.
    url: str


# The answer to an `Ask` or a `CheckReview`, one of these per `data:` line. Four events and
# nothing else: a notebook renders a line of steps and a growing answer, and a
# client that must stay httpx + numpy has no use for the web chat's protocol.
class StepEvent(BaseModel):
    type: Literal["step"] = "step"
    label: str


class TextEvent(BaseModel):
    type: Literal["text"] = "text"
    delta: str


class DoneEvent(BaseModel):
    type: Literal["done"] = "done"
    chat_id: uuid.UUID
    url: str


class ErrorEvent(BaseModel):
    type: Literal["error"] = "error"
    detail: str
