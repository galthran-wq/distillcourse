from dataclasses import dataclass, field
from datetime import datetime

from app.harness.repository import HarnessRepository
from app.harness.steering import Steering
from app.models import Chat
from app.telegram.outbox import Outbox


@dataclass
class HarnessDeps:
    """What tools receive as `RunContext.deps`. The repository is already
    scoped to the user, so a tool has no way to name another one."""

    repo: HarnessRepository
    chat: Chat
    current_locator: str | None = None
    # Only a run in the Telegram thread has somewhere to send a message of its
    # own; on the site the answer is the delivery.
    outbox: Outbox | None = None
    # Only a web run can be written to while it answers.
    steering: Steering | None = None
    # A run the poller started reads the poller's clock, so that what its
    # state says and what its tools check are one moment.
    now: datetime | None = None
    # The sections a coach run has been shown by `send_nudge`, which sends
    # nothing about a section until the run has read it.
    nudge_read: set[str] = field(default_factory=set)
