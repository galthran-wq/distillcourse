from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.memory import repository
from app.memory.repository import Recollection
from app.models import Memory, User

BACKGROUND = Recollection(
    slug="background-signal-processing",
    description="worked in DSP; comfortable with Fourier analysis",
    content="Five years on radar signal processing. Fourier transforms and "
    "sampling are second nature; probability is the weaker side.",
)


async def stored(session: AsyncSession, user: User) -> list[Memory]:
    return list(
        (await session.scalars(select(Memory).where(Memory.user_id == user.id))).all()
    )


async def test_a_slug_written_twice_is_one_memory(
    session: AsyncSession, user: User
) -> None:
    """The profile is merged, not accumulated: a fact that changed replaces the
    stale one under the slug that names it."""
    await repository.save(session, user.id, BACKGROUND, source="agent")
    await repository.save(
        session,
        user.id,
        BACKGROUND.model_copy(update={"content": "Now works on speech models."}),
        source="agent",
    )

    rows = await stored(session, user)
    assert [row.slug for row in rows] == [BACKGROUND.slug]
    assert rows[0].content == "Now works on speech models."


async def test_a_memory_is_reachable_only_by_the_learner_it_is_about(
    session: AsyncSession, user: User, other_user: User
) -> None:
    await repository.save(session, user.id, BACKGROUND, source="agent")

    assert await repository.index(session, other_user.id) == []
    assert await repository.read(session, other_user.id, [BACKGROUND.slug]) == []
    assert await repository.remove(session, other_user.id, BACKGROUND.slug) is False
    assert len(await stored(session, user)) == 1


async def test_the_learners_own_correction_is_marked_as_theirs(
    session: AsyncSession, user: User
) -> None:
    await repository.save(session, user.id, BACKGROUND, source="agent")

    edited = await repository.edit(
        session,
        user.id,
        BACKGROUND.slug,
        description="worked in DSP, not in ML",
        content="Radar signal processing, no machine learning background.",
    )

    rows = await stored(session, user)
    assert edited is True
    assert rows[0].source == "user"
    assert rows[0].content.startswith("Radar signal processing")


async def test_editing_what_is_not_remembered_writes_nothing(
    session: AsyncSession, user: User
) -> None:
    """The page corrects what the tutor wrote; it is not a way to author
    memories the tutor never had."""
    edited = await repository.edit(
        session, user.id, "never-written", description="d", content="c"
    )

    assert edited is False
    assert await stored(session, user) == []
