from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


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
