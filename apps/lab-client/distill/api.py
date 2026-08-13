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
# DISTILL_API points a checkout at a backend of its own.
BASE_URL = os.environ.get("DISTILL_API", "https://distillcourse.com").rstrip("/")
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
            response = self._client.request(method, path, json=body, headers=headers)
        except httpx.HTTPError:
            raise LabError(UNREACHABLE) from None
        if not response.is_success:
            raise LabError(_refusal(response)) from None
        answer: dict[str, Any] = response.json()
        return answer


def connect() -> Api:
    return Api(httpx.Client(base_url=f"{BASE_URL}/api/v1", timeout=TIMEOUT))


def _refusal(response: httpx.Response) -> str:
    if response.status_code == httpx.codes.UNAUTHORIZED:
        return UNPAIRED
    if response.status_code == httpx.codes.CONFLICT:
        return STALE
    after = response.headers.get("retry-after")
    if response.status_code == httpx.codes.TOO_MANY_REQUESTS and after:
        return f"too many attempts — try again in {after}s"
    return _detail(response)


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
