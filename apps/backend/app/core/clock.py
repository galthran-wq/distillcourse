from typing import Annotated
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import AfterValidator, Field


def zone(name: str) -> ZoneInfo:
    """Resolve a `users.timezone` value. Lives here rather than in scheduling
    because every run carries the learner's clock, not only the scheduled ones."""
    try:
        return ZoneInfo(name)
    # Unparenthesized by PEP 758 (3.14); `ruff format` rewrites the tuple form
    # to this one under `target-version = "py314"`.
    except ZoneInfoNotFoundError, ValueError:
        # The column holds whatever a browser reported at signup; one
        # unreadable row must not stop the poller for everyone else.
        return ZoneInfo("UTC")


def _known_timezone(value: str) -> str:
    try:
        ZoneInfo(value)
    except (ZoneInfoNotFoundError, ValueError) as exc:
        raise ValueError(f"unknown timezone: {value}") from exc
    return value


# Scheduling (quiet hours, proactive reviews) reads this straight from the row,
# so anything that is not an IANA zone has to be rejected at the door — at
# signup, at login, and where the learner sets it by hand. The length bound
# runs first because ZoneInfo turns the name into a filesystem path, and an
# over-long one raises OSError, which no validator here catches.
TimezoneName = Annotated[str, Field(max_length=64), AfterValidator(_known_timezone)]
