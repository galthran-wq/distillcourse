from typing import Any

import httpx
import pytest

from app.core.config import settings
from app.harness.web_search import API_URL, WebSearchUnavailable, as_text, ask


def payload(text: str, **extra: object) -> dict[str, object]:
    return {"choices": [{"message": {"content": text}}]} | extra


def test_the_answer_carries_the_pages_it_came_from() -> None:
    text = as_text(
        payload(
            "Two labs published it.",
            search_results=[{"title": "A paper", "url": "https://example.test/a"}],
        )
    )

    assert text.startswith("Two labs published it.")
    assert "- A paper: https://example.test/a" in text


def test_sources_are_read_from_either_shape_the_api_returns() -> None:
    """`citations` and `search_results` are the same field before and after a
    rename; an answer that silently loses its sources is unciteable."""
    assert "https://example.test/a" in as_text(
        payload("An answer.", citations=["https://example.test/a"])
    )
    assert as_text(payload("An answer.")) == "An answer."


def test_an_empty_answer_is_an_unavailable_search() -> None:
    with pytest.raises(WebSearchUnavailable):
        as_text(payload("   "))
    with pytest.raises(WebSearchUnavailable):
        as_text({})


@pytest.mark.parametrize(
    "body",
    [
        {"text": "<html>the gateway is down</html>"},
        {"json": {"choices": [{"message": {}}]}},
    ],
)
async def test_a_body_this_client_cannot_read_is_an_unavailable_search(
    monkeypatch: pytest.MonkeyPatch, body: dict[str, Any]
) -> None:
    """Decoding the body and walking it are as much of the provider's contract
    as its status code. Anything raised here that is not WebSearchUnavailable
    escapes the tool and takes the learner's whole turn with it."""
    monkeypatch.setattr(settings, "PERPLEXITY_API_KEY", "not-a-real-key")

    async def post(*_args: Any, **_kwargs: Any) -> httpx.Response:
        return httpx.Response(200, request=httpx.Request("POST", API_URL), **body)

    monkeypatch.setattr(httpx.AsyncClient, "post", post)

    with pytest.raises(WebSearchUnavailable, match="unusable"):
        await ask("what happened today")


async def test_without_a_key_no_request_is_attempted(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "PERPLEXITY_API_KEY", None)

    with pytest.raises(WebSearchUnavailable, match="not configured"):
        await ask("what happened today")
