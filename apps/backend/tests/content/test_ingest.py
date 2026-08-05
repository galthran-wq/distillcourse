import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.content.ingest import ingest
from app.content.schemas import ContentIndex
from app.models import Document
from tests.content.conftest import document, index


async def locators(session: AsyncSession) -> set[str]:
    return set((await session.scalars(select(Document.locator))).all())


async def test_first_ingest_inserts_every_document(session: AsyncSession) -> None:
    report = await ingest(
        session,
        index(
            document("lesson:it/entropy"),
            document("lesson:it/entropy#definition"),
            document("research:it/entropy"),
        ),
    )

    assert (report.inserted, report.updated, report.unchanged, report.deleted) == (
        3,
        0,
        0,
        0,
    )
    assert len(await locators(session)) == 3


async def test_reingesting_the_same_index_writes_nothing(
    session: AsyncSession,
) -> None:
    unchanged_index = index(
        document("lesson:it/entropy"), document("lesson:it/entropy#definition")
    )
    await ingest(session, unchanged_index)

    report = await ingest(session, unchanged_index)

    assert (report.inserted, report.updated, report.deleted) == (0, 0, 0)
    assert report.unchanged == 2


async def test_editing_one_lesson_rewrites_only_its_chunks(
    session: AsyncSession,
) -> None:
    untouched = document("lesson:it/kraft#budget")
    await ingest(session, index(document("lesson:it/entropy#definition"), untouched))

    report = await ingest(
        session,
        index(
            document("lesson:it/entropy#definition", text="A rewritten definition."),
            untouched,
        ),
    )

    assert (report.inserted, report.updated, report.unchanged) == (0, 1, 1)
    rewritten = (
        await session.scalars(
            select(Document).where(Document.locator == "lesson:it/entropy#definition")
        )
    ).one()
    assert rewritten.text == "A rewritten definition."


async def test_renaming_a_heading_drops_the_old_chunk(session: AsyncSession) -> None:
    await ingest(
        session,
        index(document("lesson:it/entropy"), document("lesson:it/entropy#old-name")),
    )

    report = await ingest(
        session,
        index(document("lesson:it/entropy"), document("lesson:it/entropy#new-name")),
    )

    assert (report.inserted, report.deleted) == (1, 1)
    assert await locators(session) == {
        "lesson:it/entropy",
        "lesson:it/entropy#new-name",
    }


async def test_deleting_a_lesson_removes_all_of_its_chunks(
    session: AsyncSession,
) -> None:
    await ingest(
        session,
        index(
            document("lesson:it/entropy"),
            document("lesson:it/doomed"),
            document("lesson:it/doomed#section"),
        ),
    )

    report = await ingest(session, index(document("lesson:it/entropy")))

    assert report.deleted == 2
    assert await locators(session) == {"lesson:it/entropy"}


async def test_a_corpus_the_index_does_not_mention_survives(
    session: AsyncSession,
) -> None:
    await ingest(session, index(document("pdf:shannon1948#p12")))

    await ingest(session, index(document("lesson:it/entropy")))

    assert await locators(session) == {"pdf:shannon1948#p12", "lesson:it/entropy"}


async def test_an_empty_index_is_refused_rather_than_emptying_the_table(
    session: AsyncSession,
) -> None:
    await ingest(session, index(document("lesson:it/entropy")))

    with pytest.raises(ValueError, match="empty index"):
        await ingest(session, ContentIndex(schema_version=1, documents=[]))

    assert await locators(session) == {"lesson:it/entropy"}


async def test_duplicate_locators_are_refused(session: AsyncSession) -> None:
    with pytest.raises(ValueError, match="duplicate locators"):
        await ingest(
            session,
            index(document("lesson:it/entropy"), document("lesson:it/entropy")),
        )


async def test_ingest_preserves_the_fields_consumers_read(
    session: AsyncSession,
) -> None:
    await ingest(
        session,
        index(
            document(
                "lesson:it/entropy#definition",
                anchors=["definition", "a-detail"],
                position=2,
                metadata={"word_count": 412, "document_word_count": 2544},
            )
        ),
    )

    stored = (await session.scalars(select(Document))).one()
    assert stored.anchors == ["definition", "a-detail"]
    assert stored.position == 2
    # #8 thresholds lesson completion on length, so it has to survive ingest.
    assert stored.meta["word_count"] == 412
    assert stored.meta["document_word_count"] == 2544
    # The generated column is what search reads; it must exist without a write.
    assert await session.scalar(select(func.length(Document.tsv))) is not None
