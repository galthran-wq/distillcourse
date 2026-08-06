from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash, verify_password
from app.models import User

# Verifying against a throwaway hash when the email is unknown keeps the
# response time of "no such user" indistinguishable from "wrong password".
DUMMY_HASH = get_password_hash("not-a-real-password")


async def create_user(
    session: AsyncSession,
    *,
    email: str,
    password: str,
    timezone: str,
    full_name: str | None = None,
) -> User:
    user = User(
        email=email,
        hashed_password=get_password_hash(password),
        timezone=timezone,
        full_name=full_name,
    )
    session.add(user)
    # Flush, not commit: the caller owns the transaction, and the INSERT still
    # happens here, so a duplicate email raises IntegrityError at this line.
    await session.flush()
    return user


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    return (await session.scalars(select(User).where(User.email == email))).first()


async def authenticate(
    session: AsyncSession, *, email: str, password: str
) -> User | None:
    user = await get_user_by_email(session, email)
    if user is None:
        verify_password(password, DUMMY_HASH)
        return None
    return user if verify_password(password, user.hashed_password) else None
