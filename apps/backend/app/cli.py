import argparse
import asyncio
import getpass
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.core import sessions
from app.core.db import engine, session_factory
from app.core.security import get_password_hash
from app.models import User

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)

MIN_PASSWORD_LENGTH = 8


async def _require_user(session: AsyncSession, email: str) -> User:
    user = await crud.get_user_by_email(session, email)
    if user is None:
        raise SystemExit(f"no user with email {email}")
    return user


async def reset_password(session: AsyncSession, email: str, password: str) -> None:
    user = await _require_user(session, email)
    user.hashed_password = get_password_hash(password)
    await session.commit()
    # Whoever knew the old password may still hold a live cookie, and the reset
    # exists precisely because control of the account is in doubt.
    await sessions.revoke_user(session, user.id)
    logger.info("password reset for %s; all sessions revoked", email)


async def delete_user(session: AsyncSession, email: str) -> None:
    # The sessions go with the row: the foreign key cascades in the database.
    await session.delete(await _require_user(session, email))
    await session.commit()
    logger.info("deleted %s", email)


def _prompt_new_password() -> str:
    password = getpass.getpass("new password: ")
    if len(password) < MIN_PASSWORD_LENGTH:
        raise SystemExit(f"password must be at least {MIN_PASSWORD_LENGTH} characters")
    if password != getpass.getpass("repeat: "):
        raise SystemExit("passwords do not match")
    return password


async def _run(command: str, email: str) -> None:
    async with session_factory() as session:
        if command == "reset-password":
            await reset_password(session, email, _prompt_new_password())
        else:
            await delete_user(session, email)
    await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    subcommands = parser.add_subparsers(dest="command", required=True)
    for name in ("reset-password", "delete-user"):
        subcommands.add_parser(name).add_argument("email")
    arguments = parser.parse_args()
    asyncio.run(_run(arguments.command, arguments.email))


if __name__ == "__main__":
    main()
