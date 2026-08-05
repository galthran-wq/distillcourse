import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.memory import repository
from app.memory.repository import Recollection
from tests.utils.utils import signup

MEMORIES = "/api/v1/memories"

GOAL = Recollection(
    slug="goal-information-theory",
    description="here to prepare for an ML interview in six weeks",
    content="Wants the information theory course done by mid-September.",
)


@pytest.fixture
async def reader(client: AsyncClient, session: AsyncSession) -> uuid.UUID:
    user_id = uuid.UUID(str((await signup(client))["id"]))
    await repository.save(session, user_id, GOAL, source="agent")
    return user_id


async def test_an_anonymous_visitor_gets_nothing(client: AsyncClient) -> None:
    assert (await client.get(MEMORIES)).status_code == 401
    assert (await client.delete(f"{MEMORIES}/{GOAL.slug}")).status_code == 401


@pytest.mark.usefixtures("reader")
async def test_the_page_shows_what_the_tutor_wrote(client: AsyncClient) -> None:
    listed = (await client.get(MEMORIES)).json()

    assert [(row["slug"], row["content"], row["source"]) for row in listed] == [
        (GOAL.slug, GOAL.content, "agent")
    ]


async def test_a_correction_replaces_the_tutors_words_with_the_learners(
    client: AsyncClient, reader: uuid.UUID, session: AsyncSession
) -> None:
    response = await client.put(
        f"{MEMORIES}/{GOAL.slug}",
        json={
            "description": "the interview is in October",
            "content": "Not six weeks.",
        },
    )

    rows = await repository.index(session, reader)
    assert response.status_code == 204
    assert [(row.description, row.content, row.source) for row in rows] == [
        ("the interview is in October", "Not six weeks.", "user")
    ]


@pytest.mark.usefixtures("reader")
async def test_a_memory_the_learner_deletes_is_gone(client: AsyncClient) -> None:
    response = await client.delete(f"{MEMORIES}/{GOAL.slug}")

    assert response.status_code == 204
    assert (await client.get(MEMORIES)).json() == []


@pytest.mark.usefixtures("reader")
async def test_what_is_not_remembered_cannot_be_edited_or_deleted(
    client: AsyncClient,
) -> None:
    edit = await client.put(
        f"{MEMORIES}/never-written", json={"description": "d", "content": "c"}
    )

    assert edit.status_code == 404
    assert (await client.delete(f"{MEMORIES}/never-written")).status_code == 404


@pytest.mark.usefixtures("reader")
async def test_one_learner_cannot_reach_anothers_profile(
    client: AsyncClient, other_client: AsyncClient
) -> None:
    """Two accounts, one slug: the row belongs to whoever the session says."""
    await signup(other_client)

    assert (await other_client.get(MEMORIES)).json() == []
    assert (await other_client.delete(f"{MEMORIES}/{GOAL.slug}")).status_code == 404
    assert len((await client.get(MEMORIES)).json()) == 1
