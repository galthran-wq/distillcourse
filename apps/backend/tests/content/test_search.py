import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.content.ingest import ingest
from app.content.schemas import ContentIndex
from app.content.search import fetch, search
from tests.content.conftest import document, index

# The queries a tutor actually issues, with the passage each one is asking
# for. They are the acceptance bar for tier-1 ranking: change the analyzer or
# the weights and this is what tells you whether it got better or worse.
CANONICAL_QUERIES = [
    ("surprisal of a single event", "lesson:information-theory/what-is-surprise"),
    (
        "entropy average surprisal source",
        "lesson:information-theory/entropy-as-average-surprise",
    ),
    ("why is KL divergence never negative", "lesson:information-theory/kl-divergence"),
    ("mode seeking reverse KL", "lesson:information-theory/kl-divergence"),
    (
        "capacity of the binary symmetric channel",
        "lesson:information-theory/channel-capacity",
    ),
    ("Kraft inequality codeword lengths", "lesson:information-theory/prefix-codes"),
    ("building a Huffman tree by merging", "lesson:information-theory/huffman-by-hand"),
    (
        "typical set asymptotic equipartition",
        "lesson:information-theory/source-coding-theorem-lite",
    ),
    (
        "cross entropy training objective",
        "lesson:information-theory/cross-entropy-loss",
    ),
    ("InfoNCE contrastive lower bound", "research:information-theory/infonce"),
]


@pytest.mark.parametrize(("query", "expected"), CANONICAL_QUERIES)
async def test_canonical_query_puts_the_right_passage_on_top(
    session: AsyncSession, corpus_index: ContentIndex, query: str, expected: str
) -> None:
    await ingest(session, corpus_index)

    hits = await search(session, query)

    assert hits, f"no hit for {query!r}"
    assert hits[0].locator.startswith(expected)
    assert hits[0].snippet != ""


async def test_hits_carry_what_a_consumer_needs_to_quote_them(
    session: AsyncSession, corpus_index: ContentIndex
) -> None:
    await ingest(session, corpus_index)

    hit = (await search(session, "Kraft inequality codeword lengths"))[0]

    assert hit.corpus == "lesson"
    assert hit.anchors == ["the-kraft-inequality", "the-budget-reading"]
    assert hit.breadcrumb.startswith("Information Theory")
    assert hit.metadata["word_count"] == 66
    assert hit.rank > 0


async def test_search_can_be_scoped_to_a_corpus_and_a_course(
    session: AsyncSession, corpus_index: ContentIndex
) -> None:
    await ingest(session, corpus_index)

    assert [h.corpus for h in await search(session, "entropy", corpus="concept")] == [
        "concept"
    ]
    assert await search(session, "entropy", course_slug="us-history") == []


async def test_a_renamed_heading_leaves_no_dead_locator_behind(
    session: AsyncSession,
) -> None:
    body = "The Kraft inequality bounds the codeword length budget."
    await ingest(session, index(document("lesson:it/prefix-codes#kraft", text=body)))

    await ingest(
        session, index(document("lesson:it/prefix-codes#the-kraft-budget", text=body))
    )

    assert [h.locator for h in await search(session, "Kraft inequality")] == [
        "lesson:it/prefix-codes#the-kraft-budget"
    ]


async def test_fetch_resolves_an_h3_anchor_to_its_containing_section(
    session: AsyncSession, corpus_index: ContentIndex
) -> None:
    await ingest(session, corpus_index)

    section = await fetch(
        session, "lesson:information-theory/prefix-codes#the-budget-reading"
    )

    assert section is not None
    assert (
        section.locator == "lesson:information-theory/prefix-codes#the-kraft-inequality"
    )


async def test_fetch_returns_none_for_a_locator_no_document_owns(
    session: AsyncSession, corpus_index: ContentIndex
) -> None:
    await ingest(session, corpus_index)

    assert await fetch(session, "lesson:information-theory/prefix-codes#gone") is None
