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


@pytest.fixture
def corpus_index() -> ContentIndex:
    """The canonical-query corpus: real lesson vocabulary, overlapping terms."""
    raw = json.loads((FIXTURES / "corpus.json").read_text())
    return ContentIndex.model_validate(raw)
