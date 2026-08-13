import asyncio
import hashlib
import json
import logging
import sys
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.content.schemas import ContentIndex, IndexDocument
from app.core.db import engine, session_factory
from app.labs import ingest as lab_challenges
from app.models import Base, Document

logger = logging.getLogger(__name__)

# The upsert runs against the Table, not the mapped class: "metadata" is a
# column here and an attribute of Declarative itself on the class.
DOCUMENTS = Base.metadata.tables["documents"]


@dataclass
class IngestReport:
    inserted: int
    updated: int
    unchanged: int
    deleted: int


def content_hash(document: IndexDocument) -> str:
    payload = json.dumps(document.model_dump(), sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(payload.encode()).hexdigest()


async def ingest(session: AsyncSession, index: ContentIndex) -> IngestReport:
    """Upserts an index file and removes what it no longer contains.

    The file is the complete picture of the corpora it mentions: a chunk that
    disappeared (a renamed h2, a deleted lesson) is deleted here, because a
    locator that no longer resolves is a passage the tutor would quote and the
    reader could not find. Corpora absent from the file are left alone, so a
    separately ingested corpus survives a content reindex.
    """
    if not index.documents:
        raise ValueError("refusing to ingest an empty index: it would empty the table")
    hashes = {document.locator: content_hash(document) for document in index.documents}
    if len(hashes) != len(index.documents):
        raise ValueError("index contains duplicate locators")

    corpora = {document.corpus for document in index.documents}
    stored = (
        await session.execute(
            select(Document.locator, Document.content_hash).where(
                Document.corpus.in_(corpora)
            )
        )
    ).all()
    existing: dict[str, str] = {row.locator: row.content_hash for row in stored}

    changed = [
        d for d in index.documents if existing.get(d.locator) != hashes[d.locator]
    ]
    if changed:
        rows = [
            {
                "corpus": d.corpus,
                "course_slug": d.course_slug,
                "locator": d.locator,
                "title": d.title,
                "breadcrumb": d.breadcrumb,
                "text": d.text,
                "anchors": d.anchors,
                "position": d.position,
                "metadata": d.metadata,
                "content_hash": hashes[d.locator],
            }
            for d in changed
        ]
        statement = insert(DOCUMENTS).values(rows)
        # The update set is derived from the row itself, so a column added above
        # is updated on re-ingest and not only on first insert.
        await session.execute(
            statement.on_conflict_do_update(
                index_elements=["locator"],
                set_={
                    name: statement.excluded[name]
                    for name in rows[0]
                    if name != "locator"
                },
            )
        )

    removed = (
        await session.scalars(
            delete(Document)
            .where(Document.corpus.in_(corpora), Document.locator.notin_(hashes))
            .returning(Document.locator)
        )
    ).all()
    await session.commit()

    return IngestReport(
        inserted=sum(1 for d in changed if d.locator not in existing),
        updated=sum(1 for d in changed if d.locator in existing),
        unchanged=len(index.documents) - len(changed),
        deleted=len(removed),
    )


async def main(path: Path, labs_root: Path | None = None) -> None:
    index = ContentIndex.model_validate_json(path.read_text())
    async with session_factory() as session:
        report = await ingest(session, index)
        # The labs' answer keys land in the same command as the lessons they
        # belong to: a lab whose brief is on the site and whose challenges are
        # not is a lesson nobody can submit against.
        labs = await lab_challenges.ingest(session, labs_root) if labs_root else None
    await engine.dispose()
    logger.info(
        "%s: %d inserted, %d updated, %d unchanged, %d deleted",
        path,
        report.inserted,
        report.updated,
        report.unchanged,
        report.deleted,
    )
    if labs is not None:
        logger.info(
            "%s: %d labs, %d checkpoints, %d removed",
            labs_root,
            labs.labs,
            labs.checkpoints,
            labs.removed,
        )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    if not 2 <= len(sys.argv) <= 3:
        raise SystemExit(
            "usage: python -m app.content.ingest <index.json> [<labs-private-dir>]"
        )
    asyncio.run(
        main(Path(sys.argv[1]), Path(sys.argv[2]) if len(sys.argv) == 3 else None)
    )
