from datetime import UTC, datetime

from httpx import AsyncClient
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.routes.labs import CODES_PER_HOUR
from app.core.config import settings
from app.core.sessions import token_hash
from app.labs import repository
from app.models import LabPairingCode, LabToken, User

LABS = f"{settings.API_V1_STR}/labs"


async def issued_code(client: AsyncClient) -> str:
    response = await client.post(f"{LABS}/pairing-code")
    assert response.status_code == 201
    code: str = response.json()["code"]
    return code


async def test_an_anonymous_visitor_gets_no_code(client: AsyncClient) -> None:
    assert (await client.post(f"{LABS}/pairing-code")).status_code == 401


async def test_a_code_from_the_page_pairs_a_notebook(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    issued = await signed_in.post(f"{LABS}/pairing-code")

    assert issued.status_code == 201
    body = issued.json()
    assert datetime.fromisoformat(body["expires_at"]) > datetime.now(UTC)

    paired = await signed_in.post(f"{LABS}/pair", json={"code": body["code"]})

    assert paired.status_code == 200
    token = paired.json()["token"]
    stored = await session.scalar(
        select(LabToken).where(LabToken.token_hash == token_hash(token))
    )
    assert stored is not None and stored.user_id == user.id


async def test_pairing_needs_no_session_of_its_own(
    client: AsyncClient, session: AsyncSession, user: User
) -> None:
    """The notebook has no cookie jar: the code is the whole credential."""
    code = await repository.issue_code(session, user.id, now=datetime.now(UTC))

    paired = await client.post(f"{LABS}/pair", json={"code": code.code})

    assert paired.status_code == 200


async def test_a_code_that_is_not_good_is_answered_in_words(
    signed_in: AsyncClient, session: AsyncSession
) -> None:
    code = await issued_code(signed_in)
    await session.execute(update(LabPairingCode).values(expires_at=datetime.now(UTC)))
    await session.commit()

    for body, expected in (
        ({"code": "made-up"}, "not one of ours"),
        ({"code": code}, "expired"),
    ):
        refused = await signed_in.post(f"{LABS}/pair", json=body)
        assert refused.status_code == 400
        assert expected in refused.json()["detail"]


async def test_code_issuance_is_rate_limited(signed_in: AsyncClient) -> None:
    for _ in range(CODES_PER_HOUR):
        assert (await signed_in.post(f"{LABS}/pairing-code")).status_code == 201

    assert (await signed_in.post(f"{LABS}/pairing-code")).status_code == 429
