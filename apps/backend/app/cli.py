import argparse
import asyncio
import getpass
import logging
import sys
from datetime import UTC, datetime
from pathlib import Path

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
from app.harness import filing
from app.labs import repository as labs
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
    # Whoever knew the old password may still hold a live cookie or a paired
    # notebook, and the reset exists precisely because control of the account is
    # in doubt.
    await sessions.revoke_user(session, user.id)
    await labs.revoke_all(session, user.id, now=datetime.now(UTC))
    await session.commit()
    logger.info("password reset for %s; sessions and lab tokens revoked", email)


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
        # And the notebooks. `revoked_at` is the only thing that ends a lab
        # token, so one left alone here survives the deactivation and starts
        # authenticating again the moment the account is reopened.
        await labs.revoke_all(session, user.id, now=datetime.now(UTC))
    await session.commit()
    logger.info("%s is now %s", email, "active" if active else "deactivated")


async def rebuild_progress(session: AsyncSession) -> None:
    """Re-derives every aggregate and every reading day from the raw events.

    One walk over the pairs, and one transaction per pair under that pair's
    lock: a reader flushing mid-rebuild waits for their own pair and no longer
    than that, where a rebuild holding one lock for the whole corpus would
    stall every reader on the site.

    Side effects are deliberately not replayed. A completion that was already
    derived keeps its `lesson_completed` event; one that a changed heuristic
    creates here gets none, because the review ladder it would start is not a
    thing to hand out retroactively. Reading days are added and never removed:
    `events` is pruned, and a day whose events are gone is still a day that was
    read.
    """
    pairs = await progress.pairs(session)
    days = 0
    for user_id, lesson, timezone in pairs:
        await progress.lock(session, user_id, lesson)
        await progress.recompute(session, user_id, lesson)
        days += await passes.credit(session, user_id, lesson, timezone)
        await session.commit()
    logger.info(
        "rebuilt %d lesson aggregates, credited %d reading days", len(pairs), days
    )


async def set_webhook(url: str) -> None:
    """Tell Telegram where to post. The full URL, ending in /api/tg/webhook."""
    if settings.TELEGRAM_WEBHOOK_SECRET is None:
        raise SystemExit("TELEGRAM_WEBHOOK_SECRET is unset")
    await api.set_webhook(url, settings.TELEGRAM_WEBHOOK_SECRET)
    logger.info("telegram will post updates to %s", url)


async def propose_chat_courses(session: AsyncSession) -> None:
    """Print the filing proposal: chat id, title, proposed course, evidence and
    the first question, tab-separated, for a person to settle and hand back to
    `file-chats`."""
    for proposal in await filing.propose(session):
        sys.stdout.write(proposal.row() + "\n")


async def file_chats(session: AsyncSession, path: Path) -> None:
    try:
        counts = await filing.apply(session, filing.parse(path.open()))
    except ValueError as exc:
        raise SystemExit(str(exc)) from exc
    for course, count in counts.most_common():
        logger.info("%s: %d", course, count)


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
        elif arguments.command == "propose-chat-courses":
            await propose_chat_courses(session)
        elif arguments.command == "file-chats":
            await file_chats(session, arguments.path)
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
    subcommands.add_parser("propose-chat-courses")
    subcommands.add_parser("file-chats").add_argument("path", type=Path)
    asyncio.run(_run(parser.parse_args()))


if __name__ == "__main__":
    main()
