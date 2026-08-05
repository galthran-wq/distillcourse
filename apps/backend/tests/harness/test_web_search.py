import pytest

from app.core.config import settings
from app.harness.web_search import WebSearchUnavailable, as_text, ask


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


async def test_without_a_key_no_request_is_attempted(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "PERPLEXITY_API_KEY", None)

    with pytest.raises(WebSearchUnavailable, match="not configured"):
        await ask("what happened today")
