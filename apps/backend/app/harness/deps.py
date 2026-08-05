from dataclasses import dataclass, field

from app.harness.repository import HarnessRepository
from app.models import Chat


@dataclass
class RunTally:
    """Metered calls made during the current run, before they reach the usage
    row the caps are counted from."""

    web_search_calls: int = 0


@dataclass
class HarnessDeps:
    """What tools receive as `RunContext.deps`. The repository is already
    scoped to the user, so a tool has no way to name another one."""

    repo: HarnessRepository
    chat: Chat
    current_locator: str | None = None
    tally: RunTally = field(default_factory=RunTally)
