import json
from pathlib import Path
from typing import Any

import pytest

from app.content.schemas import ContentIndex, IndexDocument

FIXTURES = Path(__file__).resolve().parent / "fixtures"


def document(locator: str, **overrides: Any) -> IndexDocument:
    corpus = locator.split(":", 1)[0]
    defaults: dict[str, Any] = {
        "corpus": corpus,
        "course_slug": "information-theory",
        "locator": locator,
        "title": "A title",
        "breadcrumb": "A › B",
        "text": "Some body text.",
        "anchors": [],
        "position": 0,
        "metadata": {"word_count": 3},
    }
    return IndexDocument.model_validate(defaults | overrides)


def index(*documents: IndexDocument) -> ContentIndex:
    return ContentIndex(schema_version=1, documents=list(documents))


@pytest.fixture(scope="session")
def corpus_index() -> ContentIndex:
    """A real export slice: the information-theory course, unedited.

    Regenerate with `CONTENT_PREVIEW=1 npm run export-index` and keep the
    documents whose `course_slug` is `information-theory`. It is a frozen
    snapshot on purpose — the ranking thresholds in test_search.py are measured
    against these 231 chunks, so refreshing it means re-measuring them.

    Session-scoped because it is read-only and parsing 800 kB of JSON per test
    is pure overhead; each test still ingests it into its own transaction.
    """
    raw = json.loads((FIXTURES / "corpus.json").read_text())
    return ContentIndex.model_validate(raw)
