from datetime import UTC, datetime, timedelta
from math import ceil

from fastapi import HTTPException, Request, status

WINDOW = timedelta(minutes=1)
MAX_REQUESTS = 10


class FixedWindow:
    """A per-process fixed-window counter, keyed by whatever the caller counts.

    One dict cleared whole when the window turns: no per-key expiry
    bookkeeping, and memory bounded by the number of keys seen in one window.
    Counters are per process, so with N uvicorn workers the effective ceiling
    is N * max_requests — enough to keep credential stuffing and a runaway
    client off a box that has no shared cache to count in.
    """

    def __init__(self, max_requests: int, window: timedelta = WINDOW) -> None:
        self.max_requests = max_requests
        self.window = window
        self._window_start = datetime.now(UTC)
        self._hits: dict[str, int] = {}

    def check(self, key: str) -> None:
        now = datetime.now(UTC)
        if now - self._window_start >= self.window:
            self._hits.clear()
            self._window_start = now
        self._hits[key] = self._hits.get(key, 0) + 1
        if self._hits[key] > self.max_requests:
            # The window is fixed, so the moment it turns is known exactly.
            # Saying it is what makes a spent daily budget read as "tomorrow"
            # rather than as "later" to the notebook client, which prints it.
            wait = self._window_start + self.window - now
            raise HTTPException(
                status.HTTP_429_TOO_MANY_REQUESTS,
                "too many requests, try again later",
                headers={"Retry-After": str(ceil(wait.total_seconds()))},
            )

    def refund(self, key: str) -> None:
        """Give back a hit whose work never happened.

        For a budget that has to be spent before the work it bounds — a model
        call — rather than after it. Guarded rather than trusted: the window may
        have turned since the hit was counted, and a key must never be owed an
        attempt it never made.
        """
        if self._hits.get(key):
            self._hits[key] -= 1

    def clear(self) -> None:
        self._hits.clear()
        self._window_start = datetime.now(UTC)


_limiters: list[FixedWindow] = []


def register(limiter: FixedWindow) -> FixedWindow:
    """Adds a limiter to the set `reset()` empties between tests.

    Explicit rather than done in the constructor, which would keep every
    window ever built alive for the life of the process.
    """
    _limiters.append(limiter)
    return limiter


_signup_and_login = register(FixedWindow(MAX_REQUESTS))


def rate_limit(request: Request) -> None:
    _signup_and_login.check(client_address(request))


def reset() -> None:
    for limiter in _limiters:
        limiter.clear()


def client_address(request: Request) -> str:
    # The last entry, not the first: it is the one the proxy in front of us
    # appended, while everything to its left is whatever the client chose to
    # send. caddy discards a client-sent X-Forwarded-For outright, and this
    # survives a proxy that appends to it instead.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.rsplit(",", 1)[-1].strip()
    return request.client.host if request.client else "unknown"
