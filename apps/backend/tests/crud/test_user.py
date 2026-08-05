from pwdlib.hashers.bcrypt import BcryptHasher
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.core.security import verify_password
from app.models import User
from tests.utils.utils import random_email, random_password


async def test_create_user_stores_a_hash_not_the_password(
    session: AsyncSession,
) -> None:
    password = random_password()

    user = await crud.create_user(session, email=random_email(), password=password)

    assert user.hashed_password != password
    assert verify_password(password, user.hashed_password)[0]
    assert user.is_active is True
    assert user.is_superuser is False


async def test_get_user_by_email_finds_the_created_user(session: AsyncSession) -> None:
    email = random_email()
    created = await crud.create_user(session, email=email, password=random_password())

    found = await crud.get_user_by_email(session, email)

    assert found is not None
    assert found.id == created.id


async def test_get_user_by_email_returns_none_for_unknown_email(
    session: AsyncSession,
) -> None:
    assert await crud.get_user_by_email(session, random_email()) is None


async def test_authenticate_accepts_the_right_password(session: AsyncSession) -> None:
    email, password = random_email(), random_password()
    await crud.create_user(session, email=email, password=password)

    assert await crud.authenticate(session, email=email, password=password) is not None


async def test_authenticate_rejects_the_wrong_password(session: AsyncSession) -> None:
    email = random_email()
    await crud.create_user(session, email=email, password=random_password())

    assert await crud.authenticate(session, email=email, password="wrong") is None


async def test_authenticate_rejects_an_unknown_email(session: AsyncSession) -> None:
    assert (
        await crud.authenticate(
            session, email=random_email(), password=random_password()
        )
        is None
    )


async def test_authenticate_upgrades_a_bcrypt_hash_to_argon2(
    session: AsyncSession,
) -> None:
    email, password = random_email(), random_password()
    session.add(User(email=email, hashed_password=BcryptHasher().hash(password)))
    await session.commit()

    user = await crud.authenticate(session, email=email, password=password)

    assert user is not None
    assert user.hashed_password.startswith("$argon2")
