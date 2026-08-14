from datetime import UTC, datetime

from httpx import AsyncClient
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.routes.labs import (
    CODES_PER_HOUR,
    DEVICE_CODES_PER_HOUR,
    DEVICE_POLLS_PER_MINUTE,
)
from app.core.config import settings
from app.core.sessions import token_hash
from app.labs import repository
from app.models import LabDeviceCode, LabPairingCode, LabToken, User

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


async def test_a_notebook_walks_the_device_flow_end_to_end(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    """`signed_in` plays both parties: the routes the notebook calls take no
    auth, so the cookie it also carries only matters at the approval."""
    started = await signed_in.post(f"{LABS}/device")
    assert started.status_code == 201
    body = started.json()
    code = body["code"]
    assert body["approve_url"] == f"{settings.FRONTEND_HOST}/labs/pair/{code}"
    assert datetime.fromisoformat(body["expires_at"]) > datetime.now(UTC)

    pending = await signed_in.get(f"{LABS}/device/{code}")
    assert pending.status_code == 428

    assert (await signed_in.post(f"{LABS}/device/{code}/approve")).status_code == 204

    released = await signed_in.get(f"{LABS}/device/{code}")
    assert released.status_code == 200
    token = released.json()["token"]
    stored = await session.scalar(
        select(LabToken).where(LabToken.token_hash == token_hash(token))
    )
    assert stored is not None and stored.user_id == user.id
    # The raw token went out exactly once; from here the code is spent.
    assert (await signed_in.get(f"{LABS}/device/{code}")).status_code == 410


async def test_an_anonymous_visitor_cannot_approve(client: AsyncClient) -> None:
    code = (await client.post(f"{LABS}/device")).json()["code"]

    assert (await client.post(f"{LABS}/device/{code}/approve")).status_code == 401


async def test_an_expired_device_code_answers_gone(
    client: AsyncClient, session: AsyncSession
) -> None:
    code = (await client.post(f"{LABS}/device")).json()["code"]
    await session.execute(update(LabDeviceCode).values(expires_at=datetime.now(UTC)))
    await session.commit()

    expired = await client.get(f"{LABS}/device/{code}")

    assert expired.status_code == 410
    assert "distill.login()" in expired.json()["detail"]


async def test_device_issuance_is_rate_limited(client: AsyncClient) -> None:
    for _ in range(DEVICE_CODES_PER_HOUR):
        assert (await client.post(f"{LABS}/device")).status_code == 201

    assert (await client.post(f"{LABS}/device")).status_code == 429


async def test_device_polling_is_rate_limited_per_code(client: AsyncClient) -> None:
    code = (await client.post(f"{LABS}/device")).json()["code"]

    for _ in range(DEVICE_POLLS_PER_MINUTE):
        assert (await client.get(f"{LABS}/device/{code}")).status_code == 428

    assert (await client.get(f"{LABS}/device/{code}")).status_code == 429
    # The window is the code's, not the endpoint's: another notebook's wait is
    # not spent by this one's looping.
    assert (await client.get(f"{LABS}/device/other")).status_code == 404
