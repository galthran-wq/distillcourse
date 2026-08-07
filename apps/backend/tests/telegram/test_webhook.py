from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Chat, Message, User
from app.telegram import repository, updates
from tests.conftest import TG_CHAT_ID, Bot, replying
from tests.telegram.conftest import WEBHOOK, deliver, message


async def user_turns(session: AsyncSession) -> int:
    total = await session.scalar(
        select(func.count()).select_from(Message).where(Message.role == "user")
    )
    return int(total or 0)


async def test_an_update_without_the_secret_is_refused(client: AsyncClient) -> None:
    """The header is the only thing that says a request is Telegram's."""
    assert (await client.post(WEBHOOK, json=message("hello"))).status_code == 403
    refused = await deliver(client, message("hello"), secret="not-it")

    assert refused.status_code == 403


@pytest.mark.usefixtures("link")
async def test_a_paired_learner_is_answered_in_the_thread(
    client: AsyncClient, session: AsyncSession, bot: Bot
) -> None:
    with replying("entropy is the average surprisal"):
        response = await deliver(client, message("what is entropy?"))

    assert response.status_code == 200
    assert bot.texts == ["entropy is the average surprisal"]
    thread = await session.scalar(select(Chat).where(Chat.kind == "telegram"))
    assert thread is not None
    assert await user_turns(session) == 1


@pytest.mark.usefixtures("link")
async def test_a_redelivered_update_does_not_run_twice(
    client: AsyncClient, session: AsyncSession, bot: Bot
) -> None:
    """Telegram retries an update whose 200 it missed; the run has already
    happened, and the second copy must not start another."""
    with replying():
        first = await deliver(client, message("what is entropy?", update_id=7))
        second = await deliver(client, message("what is entropy?", update_id=7))

    assert (first.status_code, second.status_code) == (200, 200)
    assert len(bot.texts) == 1
    assert await user_turns(session) == 1


async def test_a_chat_nobody_paired_is_told_where_to_pair(
    client: AsyncClient, session: AsyncSession, bot: Bot
) -> None:
    with replying():
        await deliver(client, message("what is entropy?"))

    assert bot.texts == [updates.PAIR_FIRST]
    assert await session.scalar(select(Chat)) is None


async def test_the_start_link_pairs_and_opens_the_thread(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    code = await repository.issue_code(session, user.id, now=datetime.now(UTC))

    await deliver(client, message(f"/start {code.code}"))

    link = await repository.link_for_user(session, user.id)
    assert link is not None and link.tg_chat_id == TG_CHAT_ID
    assert bot.texts == [updates.PAIRED]
    assert await session.scalar(select(Chat).where(Chat.kind == "telegram")) is not None


async def test_a_start_without_a_code_says_where_to_get_one(
    client: AsyncClient, bot: Bot
) -> None:
    await deliver(client, message("/start"))

    assert bot.texts == [updates.START_HELP]


async def test_an_expired_code_is_answered_with_the_reason(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    stale = await repository.issue_code(
        session, user.id, now=datetime.now(UTC) - 2 * repository.CODE_TTL
    )

    await deliver(client, message(f"/start {stale.code}"))

    assert "expired" in bot.texts[0]
    assert await repository.link_for_user(session, user.id) is None


async def test_an_update_carrying_no_text_is_acknowledged_and_ignored(
    client: AsyncClient, session: AsyncSession, bot: Bot
) -> None:
    sticker = {
        "update_id": 3,
        "message": {"chat": {"id": TG_CHAT_ID, "type": "private"}},
    }

    response = await deliver(client, sticker)

    assert response.status_code == 200
    assert bot.sent == []
    # Nothing was acted on, so nothing is remembered either.
    assert await repository.first_sighting(session, 3) is True


async def test_a_group_chat_cannot_redeem_a_pairing_code(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    """A code spent in a group would put the learner's own thread — reviews,
    reminders, everything they ever asked — in front of that whole room."""
    code = await repository.issue_code(session, user.id, now=datetime.now(UTC))

    response = await deliver(
        client, message(f"/start {code.code}", chat_type="supergroup")
    )

    assert response.status_code == 200
    assert bot.sent == []
    assert await repository.link_for_user(session, user.id) is None
