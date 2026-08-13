"""The checkpoint API as a notebook talks to it.

Nothing is retried and nothing is written to disk: the learner is sitting at a
prompt, and running the cell again is the retry. Every refusal the server can
answer with becomes one line telling them what to do about it.
"""

from __future__ import annotations

import os
from typing import Any

import httpx

from distill.errors import LabError

# The deployment a notebook opened from the public mirror submits to.
DEFAULT_HOST = "https://distillcourse.com"
# DISTILL_API points a checkout at a backend of its own. Read where the request
# is made rather than at import, because the generated notebook's first cell is
# `import distill`: a host set in any cell after it would otherwise be ignored.
HOST_VAR = "DISTILL_API"
# Pairing is skipped entirely when this is set: it belongs to whoever is
# running that backend, while a pairing code belongs to a learner.
TOKEN_VAR = "DISTILL_TOKEN"

TIMEOUT = 30.0

UNREACHABLE = (
    "could not reach distillcourse — check the connection and run the cell again"
)
STALE = "the lab was updated — reopen the notebook from the course page"
UNPAIRED = 'not paired — run distill.login("<the code from the lesson page>")'


class Api:
    """One notebook's connection, and the token its submissions carry.

    The token stays here, in this process, for as long as the kernel lives: it
    speaks for the learner's account, so it is never printed and never stored.
    """

    def __init__(self, client: httpx.Client) -> None:
        self._client = client
        self._paired: str | None = None

    @property
    def token(self) -> str | None:
        return os.environ.get(TOKEN_VAR) or self._paired

    def pair(self, code: str) -> None:
        self._paired = str(
            self._request("POST", "/labs/pair", body={"code": code})["token"]
        )

    def manifest(self, lab: str) -> dict[str, Any]:
        return self._request("GET", f"/labs/{lab}/manifest")

    def submit(self, body: dict[str, Any]) -> dict[str, Any]:
        return self._request("POST", "/labs/submissions", body=body, as_learner=True)

    def _request(
        self, method: str, path: str, *, body: Any = None, as_learner: bool = False
    ) -> dict[str, Any]:
        headers = {}
        if as_learner:
            if self.token is None:
                raise LabError(UNPAIRED)
            headers["Authorization"] = f"Bearer {self.token}"
        try:
            response = self._client.request(
                method, _url(path), json=body, headers=headers
            )
        except httpx.HTTPError:
            raise LabError(UNREACHABLE) from None
        if not response.is_success:
            raise LabError(_refusal(response))
        answer: dict[str, Any] = response.json()
        return answer


def connect() -> Api:
    return Api(httpx.Client(timeout=TIMEOUT))


def _url(path: str) -> str:
    host = os.environ.get(HOST_VAR) or DEFAULT_HOST
    return f"{host.rstrip('/')}/api/v1{path}"


def _refusal(response: httpx.Response) -> str:
    if response.status_code == httpx.codes.UNAUTHORIZED:
        return UNPAIRED
    if response.status_code == httpx.codes.CONFLICT:
        return STALE
    after = response.headers.get("retry-after")
    # RFC 7231 also allows an HTTP-date there; the server sends a delay, and a
    # date read out as a delay would be worse than not saying one at all.
    if (
        response.status_code == httpx.codes.TOO_MANY_REQUESTS
        and after
        and after.isdigit()
    ):
        return f"too many attempts — try again in {_wait(int(after))}"
    return _detail(response)


def _wait(seconds: int) -> str:
    """The delay as the learner would say it: a daily budget is hours away."""
    if seconds < 90:
        return f"{seconds}s"
    if seconds < 90 * 60:
        return f"{round(seconds / 60)} minutes"
    return f"{round(seconds / 3600)} hours"


def _detail(response: httpx.Response) -> str:
    """What the server said, when it said it in words meant for a person.

    FastAPI answers a malformed body with a list of validation errors under the
    same key; that is a bug in this client rather than something to read out.
    """
    try:
        detail = response.json().get("detail")
    except ValueError:
        detail = None
    if isinstance(detail, str):
        return detail
    return f"the server refused that ({response.status_code})"
