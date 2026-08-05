import uuid
from datetime import datetime
from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field

from app.content import locators

MAX_BATCH_EVENTS = 50
MAX_PAYLOAD_BYTES = 2048
# Reading one lesson flushes six times a minute per tab; the ceiling leaves
# room for several open tabs and still bounds what one account can write.
MAX_BATCHES_PER_MINUTE = 60

# `<section-anchor>/<kind><n>`: the anchor namespace is the index's
# (app/content/locators.py), and the ordinal disambiguates two proofs in one
# section.
Target = Annotated[str, Field(max_length=120, pattern=r"^[a-z0-9/-]+$")]

OPENED = "lesson_opened"
HEARTBEAT = "heartbeat"
SCROLL = "scroll"
TOGGLE_OPENED = "toggle_opened"
DEMO_INTERACTED = "demo_interacted"
# Derived server-side from the aggregate, never accepted from a browser, so it
# is deliberately absent from PAYLOADS below.
COMPLETED = "lesson_completed"


class Opened(BaseModel):
    referrer: Annotated[str, Field(max_length=200)] | None = None


class Heartbeat(BaseModel):
    # The client sends one every ten seconds of attention. The cap is what
    # stops a forged batch from completing a lesson nobody read.
    seconds: Annotated[int, Field(ge=1, le=60)]


class Scroll(BaseModel):
    pct: Annotated[int, Field(ge=0, le=100)]


class Toggled(BaseModel):
    kind: Literal["proof", "solution", "aside"]
    target: Target


class DemoInteraction(BaseModel):
    demo: Annotated[str, Field(max_length=64)]
    target: Target


PAYLOADS: dict[str, type[BaseModel]] = {
    OPENED: Opened,
    HEARTBEAT: Heartbeat,
    SCROLL: Scroll,
    TOGGLE_OPENED: Toggled,
    DEMO_INTERACTED: DemoInteraction,
}


class RawEvent(BaseModel):
    """One event as the browser sent it, before its payload is understood."""

    id: uuid.UUID
    type: Annotated[str, Field(max_length=24)]
    client_ts: datetime
    payload: dict[str, Any] = {}


class EventBatch(BaseModel):
    lesson: Annotated[str, Field(pattern=rf"^{locators.LESSON.pattern}$")]
    events: Annotated[list[RawEvent], Field(max_length=MAX_BATCH_EVENTS)]
