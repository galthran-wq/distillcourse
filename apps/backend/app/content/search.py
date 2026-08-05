from typing import Any

from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Document

# Tier 1 is Postgres FTS. ts_rank_cd has no idf, which on a corpus of hundreds
# of chunks costs less than it would gain: the consumer is an agent that
# reformulates its query, so recall matters more than the order of the top few.
CONFIG = "english"
SNIPPET_OPTIONS = "MaxFragments=2, MaxWords=28, MinWords=12, FragmentDelimiter= … "
# ts_rank_cd normalization: divide the rank by the document length.
RANK_NORMALIZATION = 2


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


async def fetch(session: AsyncSession, locator: str) -> Document | None:
    """Resolves a locator to the chunk that contains it.

    An h3 anchor has no chunk of its own — it resolves to the h2 section it
    sits in, so a reference a reader followed on the page also resolves here.
    """
    exact = (
        await session.scalars(select(Document).where(Document.locator == locator))
    ).first()
    if exact is not None or "#" not in locator:
        return exact

    document, anchor = locator.split("#", 1)
    return (
        await session.scalars(
            select(Document)
            .where(
                or_(
                    Document.locator == document,
                    Document.locator.startswith(f"{document}#"),
                ),
                Document.anchors.bool_op("@>")([anchor]),
            )
            .order_by(Document.position)
        )
    ).first()
