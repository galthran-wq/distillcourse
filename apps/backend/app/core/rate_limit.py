from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, Request, status

WINDOW = timedelta(minutes=1)
MAX_REQUESTS = 10


class FixedWindow:
    """A per-process fixed-window counter, keyed by whatever the caller counts.

    One dict cleared whole when the window turns: no per-key expiry
    bookkeeping, and memory bounded by the number of keys seen in a minute.
    Counters are per process, so with N uvicorn workers the effective ceiling
    is N * max_requests — enough to keep credential stuffing and a runaway
    client off a box that has no shared cache to count in.
    """

    def __init__(self, max_requests: int) -> None:
        self.max_requests = max_requests
        self._window_start = datetime.now(UTC)
        self._hits: dict[str, int] = {}

    def check(self, key: str) -> None:
        now = datetime.now(UTC)
        if now - self._window_start >= WINDOW:
            self._hits.clear()
            self._window_start = now
        self._hits[key] = self._hits.get(key, 0) + 1
        if self._hits[key] > self.max_requests:
            raise HTTPException(
                status.HTTP_429_TOO_MANY_REQUESTS,
                "too many requests, try again in a minute",
            )

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
    _signup_and_login.check(_client_address(request))


def reset() -> None:
    for limiter in _limiters:
        limiter.clear()


def _client_address(request: Request) -> str:
    # The last entry, not the first: it is the one the proxy in front of us
    # appended, while everything to its left is whatever the client chose to
    # send. caddy discards a client-sent X-Forwarded-For outright, and this
    # survives a proxy that appends to it instead.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.rsplit(",", 1)[-1].strip()
    return request.client.host if request.client else "unknown"
