from typing import Any

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import TgLink
from app.telegram import api, repository, updates
from app.telegram.outbox import Outbox
from tests.conftest import TG_CHAT_ID, Bot
from tests.telegram.conftest import deliver, message

PRIVATE = {"id": TG_CHAT_ID, "type": "private"}


def tap(
    data: str,
    *,
    update_id: int = 1,
    chat_type: str = "private",
    callback_id: str = "cb-1",
) -> dict[str, Any]:
    return {
        "update_id": update_id,
        "callback_query": {
            "id": callback_id,
            "from": {"id": TG_CHAT_ID},
            "message": {
                "message_id": 55,
                "chat": {"id": TG_CHAT_ID, "type": chat_type},
            },
            "data": data,
        },
    }


@pytest.fixture
def pressed(monkeypatch: pytest.MonkeyPatch) -> list[tuple[int, updates.Tap]]:
    """A handler registered under `test`, recording whom it was called for."""
    calls: list[tuple[int, updates.Tap]] = []

    async def handler(outbox: Outbox, tap: updates.Tap) -> None:
        calls.append((outbox.link.tg_chat_id, tap))

    monkeypatch.setitem(updates.TAP_HANDLERS, "test", handler)
    return calls


def test_a_message_parses_to_an_update() -> None:
    assert updates.parse(message("  hello ", update_id=9)) == updates.Update(
        update_id=9, tg_chat_id=TG_CHAT_ID, text="hello"
    )


def test_a_callback_parses_to_a_tap() -> None:
    assert updates.parse(tap("test:a:1", update_id=4)) == updates.Tap(
        update_id=4,
        tg_chat_id=TG_CHAT_ID,
        callback_id="cb-1",
        message_id=55,
        data="test:a:1",
    )


def test_a_callback_from_a_group_is_nothing() -> None:
    assert updates.parse(tap("test:a", chat_type="group")) is None


async def test_a_button_pressed_in_a_group_is_still_answered(
    client: AsyncClient, bot: Bot, pressed: list[tuple[int, updates.Tap]]
) -> None:
    """Dropped, but not left spinning for whoever pressed it."""
    await deliver(client, tap("test:a", chat_type="group"))

    assert bot.answered == ["cb-1"]
    assert pressed == []


@pytest.mark.parametrize(
    "query",
    [
        {},
        {"id": "cb-1", "data": "test:a"},
        {"id": "cb-1", "message": {"message_id": 55, "chat": PRIVATE}},
        {"id": 7, "data": "test:a", "message": {"message_id": 55, "chat": PRIVATE}},
        {"id": "cb-1", "data": "test:a", "message": {"chat": PRIVATE}},
    ],
)
def test_a_malformed_callback_is_nothing(query: dict[str, Any]) -> None:
    assert updates.parse({"update_id": 1, "callback_query": query}) is None


@pytest.mark.usefixtures("link")
async def test_a_tap_reaches_its_handler_once(
    client: AsyncClient, bot: Bot, pressed: list[tuple[int, updates.Tap]]
) -> None:
    """Telegram redelivers a callback it missed the 200 for, like a message."""
    first = await deliver(client, tap("test:a:1", update_id=11))
    second = await deliver(client, tap("test:a:1", update_id=11))

    assert (first.status_code, second.status_code) == (200, 200)
    assert [(chat, t.data) for chat, t in pressed] == [(TG_CHAT_ID, "test:a:1")]
    assert bot.answered == ["cb-1"]


@pytest.mark.usefixtures("link", "pressed")
async def test_an_unknown_prefix_is_answered_and_ignored(
    client: AsyncClient, bot: Bot
) -> None:
    response = await deliver(client, tap("gone:1"))

    assert response.status_code == 200
    assert bot.answered == ["cb-1"]
    assert bot.sent == []


async def test_a_tap_from_an_unpaired_chat_is_answered_and_dropped(
    client: AsyncClient, bot: Bot, pressed: list[tuple[int, updates.Tap]]
) -> None:
    await deliver(client, tap("test:a"))

    assert bot.answered == ["cb-1"]
    assert pressed == []
    assert bot.sent == []


@pytest.mark.usefixtures("link")
async def test_a_tap_works_when_the_answer_to_it_fails(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
    pressed: list[tuple[int, updates.Tap]],
) -> None:
    """The spinner is a nicety; the tap is the learner's answer."""

    async def unreachable(_callback_id: str, _text: str | None = None) -> None:
        raise api.TelegramError("answerCallbackQuery did not reach telegram")

    monkeypatch.setattr(api, "answer_callback", unreachable)

    await deliver(client, tap("test:a"))

    assert len(pressed) == 1


async def test_a_tap_reopens_a_broken_link(
    client: AsyncClient,
    session: AsyncSession,
    link: TgLink,
    pressed: list[tuple[int, updates.Tap]],
) -> None:
    await repository.set_status(session, link, "broken")

    await deliver(client, tap("test:a"))

    await session.refresh(link)
    assert link.status == "active"
    assert len(pressed) == 1


@pytest.mark.usefixtures("link")
async def test_a_failed_tap_asks_for_another_press(
    client: AsyncClient, bot: Bot, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Not "send that again": the learner typed nothing."""

    async def broken(_outbox: Outbox, _tap: updates.Tap) -> None:
        raise RuntimeError("card handler failed")

    monkeypatch.setitem(updates.TAP_HANDLERS, "test", broken)

    await deliver(client, tap("test:a"))

    assert bot.texts == [updates.TAP_FAILED]
