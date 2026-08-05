from dataclasses import dataclass

from app.harness.repository import HarnessRepository
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
