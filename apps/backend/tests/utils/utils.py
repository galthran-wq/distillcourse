import secrets
from datetime import UTC, datetime, timedelta

from app.core import sessions
from app.models import User, UserSession


def random_email() -> str:
    # example.com, not example.test: EmailStr rejects the special-use TLDs.
    return f"{secrets.token_hex(8)}@example.com"


def random_password() -> str:
    return secrets.token_urlsafe(16)


def user_session(user: User, *, lifetime: timedelta = sessions.LIFETIME) -> UserSession:
    now = datetime.now(UTC)
    return UserSession(
        token_hash=secrets.token_bytes(32),
        user_id=user.id,
        created_at=now,
        last_used_at=now,
        expires_at=now + lifetime,
    )
