from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, Request, status

WINDOW = timedelta(minutes=1)
MAX_REQUESTS = 10

# A fixed window over one dict, cleared whole when the window turns: no per-key
# expiry bookkeeping, and memory bounded by the number of addresses seen in a
# minute. Counters are per process, so with N uvicorn workers the effective
# ceiling is N * MAX_REQUESTS — enough to keep credential stuffing off a box
# that has no shared cache to count in.
_window_start = datetime.now(UTC)
_hits: dict[str, int] = {}


def rate_limit(request: Request) -> None:
    global _window_start
    now = datetime.now(UTC)
    if now - _window_start >= WINDOW:
        _hits.clear()
        _window_start = now
    address = _client_address(request)
    _hits[address] = _hits.get(address, 0) + 1
    if _hits[address] > MAX_REQUESTS:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "too many requests, try again in a minute",
        )


def reset() -> None:
    global _window_start
    _hits.clear()
    _window_start = datetime.now(UTC)


def _client_address(request: Request) -> str:
    # The last entry, not the first: it is the one the proxy in front of us
    # appended, while everything to its left is whatever the client chose to
    # send. caddy discards a client-sent X-Forwarded-For outright, and this
    # survives a proxy that appends to it instead.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.rsplit(",", 1)[-1].strip()
    return request.client.host if request.client else "unknown"
