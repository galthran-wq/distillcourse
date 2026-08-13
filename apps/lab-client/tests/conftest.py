"""A checkpoint API that answers without a backend.

The shapes are the ones `apps/backend/tests/labs/conftest.py` builds a real lab
out of: a manifest whose spec halves are what the build publishes, and a
verdict with every field the submission endpoint returns. A fake that drifts
from them is a suite passing against a server that does not exist.
"""

from __future__ import annotations

import json
from typing import Any

import httpx
import pytest

import distill
from distill import api

LAB = "information-theory/surprisal-lab"
LESSON = f"lesson:{LAB}"
VERSION = "a1" * 32
TOKEN = "the-long-lived-bearer-token"
CODE = "K7xR2mQ9pLw4"

INPUTS_CODE = "p = rng.random(4)\ninputs = (p,)\n"
ATOL = 1e-06
THRESHOLD = 0.85

MANIFEST: dict[str, Any] = {
    "lesson": LESSON,
    "content_version": VERSION,
    "data_files": [],
    "checkpoints": [
        {
            "id": "surprisal",
            "kind": "exact",
            "text": "Return the surprisal of each probability.",
            "required": True,
            "spec": {"seed": 1337, "inputs_code": INPUTS_CODE, "atol": ATOL},
        },
        {
            "id": "beat-baseline",
            "kind": "metric",
            "text": "Beat the baseline on the held-out set.",
            "required": True,
            "spec": {
                "metric": "roc_auc",
                "threshold": THRESHOLD,
                "holdout": "data/holdout.csv",
            },
        },
        {
            "id": "why-uniform",
            "kind": "review",
            "text": "Say why the uniform distribution maximises entropy.",
            "required": False,
            "spec": {},
        },
    ],
}


def verdict(
    *,
    passed: bool | None = True,
    hint: str | None = None,
    score: float | None = None,
    pending: bool = False,
    done: int = 1,
    required: int = 2,
) -> dict[str, Any]:
    return {
        "passed": passed,
        "hint": hint,
        "score": score,
        "pending": pending,
        "progress": {"passed_required": done, "total_required": required},
    }


class Server:
    """What the client talked to, and what it will be told next."""

    def __init__(self) -> None:
        self.posted: list[dict[str, Any]] = []
        self.bearers: list[str | None] = []
        self.answer: dict[str, Any] = verdict()
        self.refusal: httpx.Response | None = None
        self.unreachable = False

    def handle(self, request: httpx.Request) -> httpx.Response:
        if self.unreachable:
            raise httpx.ConnectError("no route to host", request=request)
        if self.refusal is not None:
            return self.refusal
        if request.url.path.endswith("/pair"):
            return httpx.Response(200, json={"token": TOKEN})
        if request.url.path.endswith("/manifest"):
            return httpx.Response(200, json=MANIFEST)
        self.bearers.append(request.headers.get("authorization"))
        self.posted.append(json.loads(request.content))
        return httpx.Response(200, json=self.answer)


@pytest.fixture
def server(monkeypatch: pytest.MonkeyPatch) -> Server:
    fake = Server()
    monkeypatch.delenv(api.TOKEN_VAR, raising=False)
    monkeypatch.setattr(distill, "_lab", None)
    monkeypatch.setattr(
        distill,
        "_api",
        api.Api(
            httpx.Client(
                base_url="http://labs.test/api/v1",
                transport=httpx.MockTransport(fake.handle),
            )
        ),
    )
    return fake


@pytest.fixture
def paired(server: Server) -> Server:
    """A kernel that has run the login cell and opened the lab."""
    distill.login(CODE)
    distill.open_lab(LAB)
    return server
