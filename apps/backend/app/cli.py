import argparse
import asyncio
import getpass
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.core import sessions
from app.core.config import settings
from app.core.db import engine, session_factory
from app.core.security import (
    MAX_PASSWORD_LENGTH,
    MIN_PASSWORD_LENGTH,
    get_password_hash,
)
from app.models import User
from app.telegram import api
from app.telemetry import passes, progress

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)


async def _require_user(session: AsyncSession, email: str) -> User:
    user = await crud.get_user_by_email(session, email)
    if user is None:
        raise SystemExit(f"no user with email {email}")
    return user


async def reset_password(session: AsyncSession, email: str, password: str) -> None:
    user = await _require_user(session, email)
    user.hashed_password = get_password_hash(password)
    # Whoever knew the old password may still hold a live cookie, and the reset
    # exists precisely because control of the account is in doubt.
    await sessions.revoke_user(session, user.id)
    await session.commit()
    logger.info("password reset for %s; all sessions revoked", email)


async def delete_user(session: AsyncSession, email: str) -> None:
    # The sessions go with the row: the foreign key cascades in the database.
    await session.delete(await _require_user(session, email))
    await session.commit()
    logger.info("deleted %s", email)


async def set_active(session: AsyncSession, email: str, active: bool) -> None:
    """Close an account without deleting what it wrote, or open it again.

    `users.is_active` is what the login and the per-request session check read;
    this is what writes it, so an account can be stopped without taking its
    telemetry, its chats and its ladders down with it.
    """
    user = await _require_user(session, email)
    user.is_active = active
    if not active:
        await sessions.revoke_user(session, user.id)
    await session.commit()
    logger.info("%s is now %s", email, "active" if active else "deactivated")


async def rebuild_progress(session: AsyncSession) -> None:
    logger.info("rebuilt %d lesson aggregates", await progress.rebuild(session))
    logger.info("credited %d reading days", await passes.rebuild(session))


async def set_webhook(url: str) -> None:
    """Tell Telegram where to post. The full URL, ending in /api/tg/webhook."""
    if settings.TELEGRAM_WEBHOOK_SECRET is None:
        raise SystemExit("TELEGRAM_WEBHOOK_SECRET is unset")
    await api.set_webhook(url, settings.TELEGRAM_WEBHOOK_SECRET)
    logger.info("telegram will post updates to %s", url)


def _prompt_new_password() -> str:
    password = getpass.getpass("new password: ")
    if not MIN_PASSWORD_LENGTH <= len(password) <= MAX_PASSWORD_LENGTH:
        raise SystemExit(
            f"password must be {MIN_PASSWORD_LENGTH}-{MAX_PASSWORD_LENGTH} characters"
        )
    if password != getpass.getpass("repeat: "):
        raise SystemExit("passwords do not match")
    return password


async def _run(arguments: argparse.Namespace) -> None:
    async with session_factory() as session:
        if arguments.command == "reset-password":
            await reset_password(session, arguments.email, _prompt_new_password())
        elif arguments.command == "delete-user":
            await delete_user(session, arguments.email)
        elif arguments.command == "deactivate-user":
            await set_active(session, arguments.email, False)
        elif arguments.command == "activate-user":
            await set_active(session, arguments.email, True)
        elif arguments.command == "rebuild-progress":
            await rebuild_progress(session)
        elif arguments.command == "set-webhook":
            await set_webhook(arguments.url)
        else:
            raise SystemExit(f"unknown command: {arguments.command}")
    await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    subcommands = parser.add_subparsers(dest="command", required=True)
    for name in ("reset-password", "delete-user", "deactivate-user", "activate-user"):
        subcommands.add_parser(name).add_argument("email")
    subcommands.add_parser("rebuild-progress")
    subcommands.add_parser("set-webhook").add_argument("url")
    asyncio.run(_run(parser.parse_args()))


if __name__ == "__main__":
    main()
