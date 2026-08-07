from typing import Any

import httpx

from app.core.config import settings

# Perplexity answers rather than lists links, which is what a tutor needs: one
# call, one paragraph, its sources named. The API is OpenAI-shaped.
API_URL = "https://api.perplexity.ai/chat/completions"
TIMEOUT_SECONDS = 30.0


class WebSearchUnavailable(Exception):
    """The web is not reachable right now — a missing key, a provider error, an
    answer that came back empty or in a shape this client cannot read. The
    tutor is expected to continue without it.
    """


def _sources(payload: dict[str, Any]) -> list[str]:
    # Two shapes, because the field was renamed: `citations` is a list of
    # urls, `search_results` carries the page title with each.
    results = payload.get("search_results") or []
    if results:
        return [
            f"{result.get('title') or result['url']}: {result['url']}"
            for result in results
        ]
    return list(payload.get("citations") or [])


def as_text(payload: dict[str, Any]) -> str:
    """A Perplexity response as the paragraph and the sources behind it."""
    choices = payload.get("choices") or []
    text = choices[0]["message"]["content"].strip() if choices else ""
    if not text:
        raise WebSearchUnavailable("the web search returned no answer")
    sources = _sources(payload)
    if not sources:
        return text
    return text + "\n\nSources:\n" + "\n".join(f"- {source}" for source in sources)


async def ask(query: str) -> str:
    """One web search, as text with its sources listed.

    What comes back is outside material: every caller hands it to the model
    fenced as untrusted.
    """
    if settings.PERPLEXITY_API_KEY is None:
        raise WebSearchUnavailable("web search is not configured")
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            response = await client.post(
                API_URL,
                headers={"Authorization": f"Bearer {settings.PERPLEXITY_API_KEY}"},
                json={
                    "model": settings.PERPLEXITY_MODEL,
                    "messages": [{"role": "user", "content": query}],
                },
            )
            response.raise_for_status()
            payload: dict[str, Any] = response.json()
        return as_text(payload)
    except httpx.HTTPError as exc:
        raise WebSearchUnavailable(f"the web search provider failed: {exc}")
    # A 200 whose body is not the json this client expects: decoding it and
    # walking it are as much of the provider's contract as the status code,
    # and a raw KeyError here would abort the learner's whole turn.
    except (ValueError, KeyError, TypeError, AttributeError) as exc:
        raise WebSearchUnavailable(
            f"the web search provider returned an unusable answer: {exc}"
        )
