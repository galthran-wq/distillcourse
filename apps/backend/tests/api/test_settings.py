from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import TgLink, User
from app.scheduling import policy
from app.telegram import repository

SETTINGS = f"{settings.API_V1_STR}/settings"


@pytest.fixture(autouse=True)
def configured_bot(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "TELEGRAM_BOT_USERNAME", "distillcourse_bot")


async def test_an_anonymous_visitor_gets_nothing(client: AsyncClient) -> None:
    assert (await client.get(SETTINGS)).status_code == 401
    assert (await client.post(f"{SETTINGS}/telegram/code")).status_code == 401


async def test_the_defaults_are_what_the_poller_reads(signed_in: AsyncClient) -> None:
    state = (await signed_in.get(SETTINGS)).json()

    assert state == {
        "timezone": "UTC",
        "quiet_start": "09:00:00",
        "quiet_end": "22:00:00",
        "muted_until": None,
        "telegram": "none",
    }


async def test_the_learner_moves_the_window_and_their_clock(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    updated = await signed_in.patch(
        SETTINGS,
        json={
            "quiet_start": "07:30:00",
            "quiet_end": "23:00:00",
            "timezone": "Europe/Moscow",
        },
    )

    assert updated.status_code == 200
    await session.refresh(user)
    assert policy.Hours.of(user).opens.hour == 7
    assert user.timezone == "Europe/Moscow"


async def test_a_window_that_closes_before_it_opens_is_refused(
    signed_in: AsyncClient,
) -> None:
    refused = await signed_in.patch(
        SETTINGS, json={"quiet_start": "22:00:00", "quiet_end": "09:00:00"}
    )

    assert refused.status_code == 400


async def test_an_unknown_timezone_is_refused(signed_in: AsyncClient) -> None:
    refused = await signed_in.patch(SETTINGS, json={"timezone": "Mars/Olympus"})

    assert refused.status_code == 422


async def test_the_page_pauses_and_resumes_proactive_messages(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    muted = (await signed_in.patch(SETTINGS, json={"muted": True})).json()
    await session.refresh(user)
    assert user.muted_until == policy.INDEFINITE
    assert muted["muted_until"] is not None

    await signed_in.patch(SETTINGS, json={"muted": False})
    await session.refresh(user)
    assert user.muted_until is None


async def test_a_pairing_link_is_issued_and_expires(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    issued = await signed_in.post(f"{SETTINGS}/telegram/code")

    assert issued.status_code == 201
    body = issued.json()
    code = body["link"].removeprefix("https://t.me/distillcourse_bot?start=")
    assert code != body["link"]
    assert datetime.fromisoformat(body["expires_at"]) > datetime.now(UTC)

    link = await repository.redeem(session, code, tg_chat_id=5, now=datetime.now(UTC))

    assert link.user_id == user.id


@pytest.mark.usefixtures("link")
async def test_unpairing_disconnects_the_channel(signed_in: AsyncClient) -> None:
    assert (await signed_in.get(SETTINGS)).json()["telegram"] == "active"

    removed = await signed_in.delete(f"{SETTINGS}/telegram")

    assert removed.status_code == 204
    assert (await signed_in.get(SETTINGS)).json()["telegram"] == "none"


async def test_a_broken_channel_is_reported_to_the_page(
    signed_in: AsyncClient, session: AsyncSession, link: TgLink
) -> None:
    """What the site's banner reads."""
    link.status = "broken"
    await session.commit()

    assert (await signed_in.get(SETTINGS)).json()["telegram"] == "broken"


async def test_no_pairing_is_offered_without_a_configured_bot(
    signed_in: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "TELEGRAM_BOT_USERNAME", None)

    assert (await signed_in.post(f"{SETTINGS}/telegram/code")).status_code == 503
