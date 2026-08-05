from dataclasses import dataclass

from app.harness.repository import HarnessRepository
from app.models import Chat


@dataclass
class HarnessDeps:
    """What tools receive as `RunContext.deps`. The repository is already
    scoped to the user, so a tool has no way to name another one."""

    repo: HarnessRepository
    chat: Chat
    current_locator: str | None = None
