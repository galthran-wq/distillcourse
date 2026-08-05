import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.content.ingest import ingest
from app.content.schemas import ContentIndex
from app.content.search import SearchHit, fetch, search
from tests.content.conftest import document, index

# The queries a tutor actually issues, with the lesson that should answer each.
# They are the acceptance bar for tier-1 ranking: change the analyzer or the
# weights and this is what tells you whether it got better or worse.
#
# They are scored against a real export slice, not a hand-made corpus, because
# ranking is only decided under real competition: every query here also matches
# the sibling sections of its own lesson, the lesson's summary chunk, and the
# exercises chunk that repeats its vocabulary. A fixture of one-answer-each
# documents rates every ranking function perfectly and rules out nothing.
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
    ("Kraft inequality codeword lengths", "lesson:information-theory/kraft-inequality"),
    ("building a Huffman tree by merging", "lesson:information-theory/huffman-by-hand"),
    (
        "typical set asymptotic equipartition",
        "lesson:information-theory/source-coding-theorem-lite",
    ),
    (
        "cross entropy training objective",
        "lesson:information-theory/cross-entropy-loss",
    ),
    ("InfoNCE contrastive lower bound", "lesson:information-theory/infonce"),
]

# Of the ten, how many must put their lesson in first place. Measured on this
# fixture: 7 as the code stands, and 4 if ts_rank_cd loses its length
# normalization — so the margin is what keeps a ranking regression visible,
# while the three misses stay honest about what tier-1 does not do. The three
# are queries another lesson answers as well ("cross entropy training
# objective" is also the subject of minimum-description-length).
MIN_RANKED_FIRST = 6


def lessons_ranked(hits: list[SearchHit]) -> list[str]:
    """The lessons the hits point at, best first, each appearing once."""
    ordered: list[str] = []
    for hit in hits:
        lesson = hit.locator.split("#")[0]
        if lesson not in ordered:
            ordered.append(lesson)
    return ordered


@pytest.mark.parametrize(("query", "expected"), CANONICAL_QUERIES)
async def test_a_canonical_query_surfaces_its_lesson(
    session: AsyncSession, corpus_index: ContentIndex, query: str, expected: str
) -> None:
    await ingest(session, corpus_index)

    # Scoped to lessons: the concept entry and the research brief on the same
    # term are good answers to these queries too, so an unscoped assertion
    # would be testing which corpus wins rather than how lessons rank.
    hits = await search(session, query, corpus="lesson")

    assert hits, f"no hit for {query!r}"
    assert all(hit.snippet != "" for hit in hits)
    assert expected in lessons_ranked(hits)[:3], f"{query!r} -> {lessons_ranked(hits)}"


async def test_most_canonical_queries_rank_their_lesson_first(
    session: AsyncSession, corpus_index: ContentIndex
) -> None:
    await ingest(session, corpus_index)

    missed = []
    for query, expected in CANONICAL_QUERIES:
        ranked = lessons_ranked(await search(session, query, corpus="lesson"))
        if ranked[:1] != [expected]:
            missed.append(f"{query!r} -> {ranked[:1]}, wanted {expected}")

    first = len(CANONICAL_QUERIES) - len(missed)
    assert first >= MIN_RANKED_FIRST, f"only {first} ranked first:\n" + "\n".join(
        missed
    )


async def test_hits_carry_what_a_consumer_needs_to_quote_them(
    session: AsyncSession, corpus_index: ContentIndex
) -> None:
    await ingest(session, corpus_index)

    hit = (await search(session, "Gibbs inequality overhead never negative"))[0]

    assert hit.locator == (
        "lesson:information-theory/kl-divergence"
        "#gibbs-inequality-the-overhead-is-never-negative"
    )
    assert hit.corpus == "lesson"
    assert hit.anchors == [
        "gibbs-inequality-the-overhead-is-never-negative",
        "one-inequality-many-corollaries",
    ]
    assert hit.breadcrumb.startswith("Information Theory")
    assert hit.metadata["word_count"] > 0
    assert hit.rank > 0


async def test_search_can_be_scoped_to_a_corpus_and_a_course(
    session: AsyncSession, corpus_index: ContentIndex
) -> None:
    await ingest(session, corpus_index)

    concepts = await search(session, "entropy", corpus="concept")
    assert concepts != []
    assert {hit.corpus for hit in concepts} == {"concept"}
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
        session,
        "lesson:information-theory/kl-divergence#one-inequality-many-corollaries",
    )

    assert section is not None
    assert section.locator == (
        "lesson:information-theory/kl-divergence"
        "#gibbs-inequality-the-overhead-is-never-negative"
    )


async def test_fetch_returns_none_for_a_locator_no_document_owns(
    session: AsyncSession, corpus_index: ContentIndex
) -> None:
    await ingest(session, corpus_index)

    assert await fetch(session, "lesson:information-theory/kl-divergence#gone") is None
