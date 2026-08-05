import re
from collections.abc import Sequence
from typing import Any

from pydantic import BaseModel
from sqlalchemy import ColumnElement, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Document

# Tier 1 is Postgres FTS. ts_rank_cd has no idf, which on a corpus of hundreds
# of chunks costs less than it would gain: the consumer is an agent that
# reformulates its query, so recall matters more than the order of the top few.
CONFIG = "english"
SNIPPET_OPTIONS = "MaxFragments=2, MaxWords=28, MinWords=12, FragmentDelimiter= … "
# ts_rank_cd normalization: divide the rank by the document length.
RANK_NORMALIZATION = 2


def chunks_of(document: str) -> ColumnElement[bool]:
    """Every row the document at this locator was split into.

    A document with headings becomes one row per h2 section, so "the chunks of
    this lesson" is the anchorless locator or any anchor under it. The rule
    lives here because it is the index's, and both search and the telemetry
    threshold ask it.
    """
    return or_(
        Document.locator == document, Document.locator.startswith(f"{document}#")
    )


class SearchHit(BaseModel):
    locator: str
    corpus: str
    title: str
    breadcrumb: str
    snippet: str
    anchors: list[str]
    metadata: dict[str, Any]
    rank: float


async def search(
    session: AsyncSession,
    query: str,
    *,
    corpus: str | None = None,
    course_slug: str | None = None,
    limit: int = 10,
) -> list[SearchHit]:
    tsquery = func.websearch_to_tsquery(CONFIG, query)
    # Flag 2 divides the rank by the document length. Without it ts_rank_cd
    # rewards long chunks for nothing but their length, so on the real corpus a
    # rambling section outranks the short one that answers the query.
    rank = func.ts_rank_cd(Document.tsv, tsquery, RANK_NORMALIZATION).label("rank")
    snippet = func.ts_headline(CONFIG, Document.text, tsquery, SNIPPET_OPTIONS).label(
        "snippet"
    )

    statement = select(
        Document.locator,
        Document.corpus,
        Document.title,
        Document.breadcrumb,
        snippet,
        Document.anchors,
        Document.meta.label("metadata"),
        rank,
    ).where(Document.tsv.bool_op("@@")(tsquery))
    if corpus is not None:
        statement = statement.where(Document.corpus == corpus)
    if course_slug is not None:
        statement = statement.where(Document.course_slug == course_slug)
    # Locator breaks ties so that repeating a query repeats its answer.
    statement = statement.order_by(rank.desc(), Document.locator).limit(limit)

    # By name, not by position: adding a column to the select above must not
    # silently shift every field after it into its neighbour.
    return [
        SearchHit(**row._mapping) for row in (await session.execute(statement)).all()
    ]


async def sections(session: AsyncSession, path: str) -> list[Document]:
    """Every chunk of one document — a locator without its anchor — in reading
    order. A consumer that has them all can answer both "this section" and
    "the whole lesson" from a single query, and knows each chunk's neighbours.
    """
    return list(
        (
            await session.scalars(
                select(Document).where(chunks_of(path)).order_by(Document.position)
            )
        ).all()
    )


def section_of(chunks: Sequence[Document], locator: str) -> Document | None:
    """The chunk a locator names, out of the chunks of its document.

    An h3 anchor has no chunk of its own — it resolves to the h2 section it
    sits in, so a reference a reader followed on the page also resolves here.
    """
    anchor = locator.partition("#")[2]
    return next(
        (
            chunk
            for chunk in chunks
            if chunk.locator == locator or (anchor != "" and anchor in chunk.anchors)
        ),
        None,
    )


async def suggest(
    session: AsyncSession, locator: str, *, limit: int = 3
) -> list[SearchHit]:
    """The locators closest to one that resolved to nothing.

    The words of the locator are OR-ed rather than searched as a phrase:
    websearch_to_tsquery ANDs its terms, and the one word the caller got wrong
    is exactly the one that must not veto the match. The corpus prefix is a
    filter rather than a word — asking for a lesson and being offered the
    concept entry of the same name is not the correction the caller needs.
    """
    corpus, _, path = locator.partition(":")
    words = [
        word
        for word in re.split(r"[^a-z0-9]+", (path or locator).lower())
        if len(word) > 1
    ]
    if not words:
        return []
    query = " OR ".join(words)
    hits = await search(session, query, corpus=corpus, limit=limit) if path else []
    # The prefix can be the part that is wrong, and no suggestion at all is the
    # one answer that helps nobody.
    return hits or await search(session, query, limit=limit)
