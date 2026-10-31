import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

from httpx import AsyncClient

from app.core import sessions
from app.core.config import settings
from app.models import User, UserSession


def random_email() -> str:
    # example.com, not example.test: EmailStr rejects the special-use TLDs.
    return f"{secrets.token_hex(8)}@example.com"


def random_password() -> str:
    return secrets.token_urlsafe(16)


def signup_body(**overrides: Any) -> dict[str, Any]:
    body: dict[str, Any] = {
        "email": random_email(),
        "password": random_password(),
        "timezone": "Europe/Berlin",
    }
    return body | overrides


async def signup(client: AsyncClient, **overrides: Any) -> dict[str, Any]:
    """Opens an account and leaves the client holding its session cookie."""
    body = signup_body(**overrides)
    response = await client.post(f"{settings.API_V1_STR}/auth/signup", json=body)
    assert response.status_code == 201, response.text
    return body | {"id": response.json()["id"]}


def user_session(user: User, *, lifetime: timedelta = sessions.LIFETIME) -> UserSession:
    now = datetime.now(UTC)
    return UserSession(
        token_hash=secrets.token_bytes(32),
        user_id=user.id,
        created_at=now,
        last_used_at=now,
        expires_at=now + lifetime,
    )
