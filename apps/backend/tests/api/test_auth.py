import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.core import rate_limit, security, sessions
from app.core.config import settings
from app.labs import repository as labs
from app.models import LabToken, UserSession
from tests.utils.utils import random_email, random_password, signup, signup_body

AUTH = f"{settings.API_V1_STR}/auth"


def login_body(body: dict[str, Any], **overrides: Any) -> dict[str, Any]:
    credentials = {
        "email": body["email"],
        "password": body["password"],
        "timezone": body["timezone"],
    }
    return credentials | overrides


async def stored_session(session: AsyncSession) -> UserSession:
    return (await session.scalars(select(UserSession))).one()


async def test_signup_returns_the_user_and_opens_a_session(client: AsyncClient) -> None:
    body = signup_body()

    response = await client.post(f"{AUTH}/signup", json=body)

    assert response.status_code == 201
    assert response.json()["email"] == body["email"]
    assert response.json()["timezone"] == body["timezone"]
    assert client.cookies.get(sessions.COOKIE_NAME)
    assert (await client.get(f"{AUTH}/me")).json()["email"] == body["email"]


async def test_signup_rejects_a_duplicate_email(client: AsyncClient) -> None:
    body = await signup(client)

    response = await client.post(
        f"{AUTH}/signup", json=signup_body(email=body["email"])
    )

    assert response.status_code == 409


async def test_signup_rejects_the_same_email_in_another_case(
    client: AsyncClient,
) -> None:
    body = await signup(client)

    response = await client.post(
        f"{AUTH}/signup", json=signup_body(email=body["email"].upper())
    )

    assert response.status_code == 409


async def test_signup_rejects_an_unknown_timezone(client: AsyncClient) -> None:
    response = await client.post(
        f"{AUTH}/signup", json=signup_body(timezone="Mars/Olympus")
    )

    assert response.status_code == 422


async def test_signup_rejects_an_oversized_timezone(client: AsyncClient) -> None:
    # Long enough that zoneinfo's own lookup would raise OSError rather than
    # the ZoneInfoNotFoundError the validator translates.
    response = await client.post(
        f"{AUTH}/signup", json=signup_body(timezone="Europe/" + "x" * 300)
    )

    assert response.status_code == 422


async def test_signup_rejects_a_full_name_longer_than_the_column(
    client: AsyncClient,
) -> None:
    response = await client.post(
        f"{AUTH}/signup", json=signup_body(full_name="x" * 256)
    )

    assert response.status_code == 422


async def test_signup_rejects_a_password_below_the_policy(client: AsyncClient) -> None:
    body = signup_body(password="x" * (security.MIN_PASSWORD_LENGTH - 1))

    assert (await client.post(f"{AUTH}/signup", json=body)).status_code == 422


async def test_login_rejects_the_wrong_password(client: AsyncClient) -> None:
    body = await signup(client)

    response = await client.post(
        f"{AUTH}/login", json=login_body(body, password="not-the-password")
    )

    assert response.status_code == 401


async def test_login_rejects_an_unknown_email(client: AsyncClient) -> None:
    response = await client.post(
        f"{AUTH}/login",
        json={
            "email": random_email(),
            "password": random_password(),
            "timezone": "UTC",
        },
    )

    assert response.status_code == 401


async def test_login_records_the_timezone_the_browser_reports(
    client: AsyncClient, session: AsyncSession
) -> None:
    body = await signup(client, timezone="Europe/Berlin")

    response = await client.post(
        f"{AUTH}/login", json=login_body(body, timezone="Asia/Tokyo")
    )

    assert response.json()["timezone"] == "Asia/Tokyo"
    user = await crud.get_user_by_email(session, body["email"])
    assert user is not None
    assert user.timezone == "Asia/Tokyo"


async def test_login_deletes_sessions_that_have_expired(
    client: AsyncClient, session: AsyncSession
) -> None:
    body = await signup(client)
    expired = await stored_session(session)
    expired.expires_at = datetime.now(UTC) - timedelta(seconds=1)
    await session.commit()

    assert (
        await client.post(f"{AUTH}/login", json=login_body(body))
    ).status_code == 200

    remaining = (await session.scalars(select(UserSession))).all()
    assert [row.token_hash for row in remaining] != [expired.token_hash]
    assert len(remaining) == 1


async def test_me_rejects_a_request_without_a_session(client: AsyncClient) -> None:
    assert (await client.get(f"{AUTH}/me")).status_code == 401


async def test_logout_revokes_the_session_rather_than_expiring_the_cookie(
    client: AsyncClient,
) -> None:
    await signup(client)
    token = client.cookies[sessions.COOKIE_NAME]

    assert (await client.post(f"{AUTH}/logout")).status_code == 204

    replayed = await client.get(
        f"{AUTH}/me", headers={"Cookie": f"{sessions.COOKIE_NAME}={token}"}
    )
    assert replayed.status_code == 401


async def test_logout_all_ends_every_session_of_the_user(
    client: AsyncClient, other_client: AsyncClient
) -> None:
    body = await signup(client)
    assert (
        await other_client.post(f"{AUTH}/login", json=login_body(body))
    ).status_code == 200

    assert (await client.post(f"{AUTH}/logout-all")).status_code == 204

    assert (await other_client.get(f"{AUTH}/me")).status_code == 401
    assert (await client.get(f"{AUTH}/me")).status_code == 401


async def test_logout_all_unpairs_the_notebooks_as_well(
    client: AsyncClient, session: AsyncSession
) -> None:
    """A lab token speaks for the account and no browser holds it, so the sweep
    that ends every session has to reach it too."""
    body = await signup(client)
    user_id = uuid.UUID(body["id"])
    now = datetime.now(UTC)
    code = await labs.issue_code(session, user_id, now=now)
    await labs.redeem(session, code.code, now=now)

    assert (await client.post(f"{AUTH}/logout-all")).status_code == 204

    token = await session.scalar(select(LabToken).where(LabToken.user_id == user_id))
    assert token is not None and token.revoked_at is not None


async def test_change_password_keeps_this_session_and_drops_the_others(
    client: AsyncClient, other_client: AsyncClient
) -> None:
    body = await signup(client)
    assert (
        await other_client.post(f"{AUTH}/login", json=login_body(body))
    ).status_code == 200

    response = await client.post(
        f"{AUTH}/change-password",
        json={"current_password": body["password"], "new_password": "a-new-password"},
    )

    assert response.status_code == 204
    assert (await client.get(f"{AUTH}/me")).status_code == 200
    assert (await other_client.get(f"{AUTH}/me")).status_code == 401
    assert (
        await other_client.post(
            f"{AUTH}/login", json=login_body(body, password="a-new-password")
        )
    ).status_code == 200


async def test_change_password_unpairs_the_notebooks(
    client: AsyncClient, session: AsyncSession
) -> None:
    """The browser asking keeps its session; a notebook has none to keep, and a
    pasted token is the copy of the credential most likely to have leaked."""
    body = await signup(client)
    user_id = uuid.UUID(body["id"])
    now = datetime.now(UTC)
    code = await labs.issue_code(session, user_id, now=now)
    await labs.redeem(session, code.code, now=now)

    response = await client.post(
        f"{AUTH}/change-password",
        json={"current_password": body["password"], "new_password": "a-new-password"},
    )

    assert response.status_code == 204
    token = await session.scalar(select(LabToken).where(LabToken.user_id == user_id))
    assert token is not None and token.revoked_at is not None


async def test_change_password_rejects_a_wrong_current_password(
    client: AsyncClient,
) -> None:
    await signup(client)

    response = await client.post(
        f"{AUTH}/change-password",
        json={"current_password": "not-the-password", "new_password": "a-new-password"},
    )

    assert response.status_code == 401


async def test_change_password_requires_a_session(client: AsyncClient) -> None:
    response = await client.post(
        f"{AUTH}/change-password",
        json={"current_password": "whatever", "new_password": "a-new-password"},
    )

    assert response.status_code == 401


async def test_signup_and_login_are_rate_limited(client: AsyncClient) -> None:
    body = await signup(client)
    rejected = login_body(body, password="not-the-password")

    for _ in range(rate_limit.MAX_REQUESTS - 1):
        assert (await client.post(f"{AUTH}/login", json=rejected)).status_code == 401

    assert (await client.post(f"{AUTH}/login", json=rejected)).status_code == 429


async def test_a_session_older_than_a_day_slides_forward(
    client: AsyncClient, session: AsyncSession
) -> None:
    await signup(client)
    stored = await stored_session(session)
    stored.last_used_at = datetime.now(UTC) - 2 * sessions.RENEWAL_INTERVAL
    stored.expires_at = (
        datetime.now(UTC) + sessions.LIFETIME - 2 * sessions.RENEWAL_INTERVAL
    )
    await session.commit()
    expires_at = stored.expires_at

    assert (await client.get(f"{AUTH}/me")).status_code == 200

    assert stored.expires_at > expires_at


async def test_a_session_used_twice_in_a_day_is_written_once(
    client: AsyncClient, session: AsyncSession
) -> None:
    await signup(client)
    stored = await stored_session(session)
    last_used_at = stored.last_used_at

    assert (await client.get(f"{AUTH}/me")).status_code == 200

    assert stored.last_used_at == last_used_at


async def test_an_expired_session_is_rejected(
    client: AsyncClient, session: AsyncSession
) -> None:
    await signup(client)
    stored = await stored_session(session)
    stored.expires_at = datetime.now(UTC) - timedelta(seconds=1)
    await session.commit()

    assert (await client.get(f"{AUTH}/me")).status_code == 401


async def test_a_deactivated_user_cannot_use_their_session(
    client: AsyncClient, session: AsyncSession
) -> None:
    body = await signup(client)
    user = await crud.get_user_by_email(session, body["email"])
    assert user is not None
    user.is_active = False
    await session.commit()

    assert (await client.get(f"{AUTH}/me")).status_code == 401
