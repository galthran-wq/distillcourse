from __future__ import annotations

import pytest

import distill
from distill import api
from distill.errors import LabError
from tests.conftest import CODE, LAB, TOKEN, Server


def test_a_code_becomes_the_token_every_submission_carries(
    server: Server, capsys: pytest.CaptureFixture[str]
) -> None:
    distill.login(CODE)
    distill.open_lab(LAB)
    distill.submit_review("why-uniform", "Because no outcome is favoured.")

    assert server.bearers == [f"Bearer {TOKEN}"]
    assert TOKEN not in capsys.readouterr().out


def test_an_unpaired_kernel_is_told_how_to_pair(
    server: Server, capsys: pytest.CaptureFixture[str]
) -> None:
    """Opening a lab needs no token — the manifest is public — so this is where
    a learner who skipped the login cell finds out, rather than at the first
    checkpoint they have just solved."""
    distill.open_lab(LAB)

    assert api.UNPAIRED in capsys.readouterr().out
    with pytest.raises(LabError, match="not paired"):
        distill.submit_review("why-uniform", "Because no outcome is favoured.")
    assert server.posted == []


def test_a_token_in_the_environment_stands_in_for_pairing(
    server: Server, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv(api.TOKEN_VAR, "a-token-issued-by-hand")
    distill.open_lab(LAB)
    distill.submit_review("why-uniform", "Because no outcome is favoured.")

    assert server.bearers == ["Bearer a-token-issued-by-hand"]
