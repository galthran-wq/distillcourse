from collections.abc import Awaitable, Callable
from typing import Any

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import TgLink
from app.telegram import api
from app.telegram.outbox import Outbox
from tests.conftest import Bot

KEYBOARD: api.Keyboard = [[{"text": "A", "callback_data": "card:a"}]]

DELIVERIES: dict[str, Callable[[Outbox], Awaitable[object]]] = {
    "send": lambda outbox: outbox.send("hi", keyboard=KEYBOARD),
    "send_photo": lambda outbox: outbox.send_photo(b"png", caption="c"),
    "edit_text": lambda outbox: outbox.edit_text(5, "hi", keyboard=KEYBOARD),
    "edit_caption": lambda outbox: outbox.edit_caption(5, "c"),
    "edit_keyboard": lambda outbox: outbox.edit_keyboard(5, None),
}


@pytest.mark.parametrize("deliver", DELIVERIES.values(), ids=DELIVERIES.keys())
async def test_a_blocked_bot_breaks_the_link_whatever_was_being_delivered(
    session: AsyncSession,
    link: TgLink,
    monkeypatch: pytest.MonkeyPatch,
    bot: Bot,
    deliver: Callable[[Outbox], Awaitable[object]],
) -> None:
    async def blocked(*_args: Any, **_kwargs: Any) -> None:
        raise api.BotBlocked("Forbidden: bot was blocked by the user")

    for name in (
        "send_photo",
        "edit_message_text",
        "edit_message_caption",
        "edit_message_keyboard",
    ):
        monkeypatch.setattr(api, name, blocked)
    bot.refuse = api.BotBlocked("Forbidden: bot was blocked by the user")

    with pytest.raises(api.BotBlocked):
        await deliver(Outbox(session=session, link=link))

    await session.refresh(link)
    assert link.status == "broken"


async def test_a_blocked_bot_on_the_unformatted_resend_breaks_the_link(
    session: AsyncSession, link: TgLink, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def refusing(*_args: Any, html: bool = True, **_kwargs: Any) -> int:
        if html:
            raise api.MarkupRejected("can't parse entities")
        raise api.BotBlocked("Forbidden: bot was blocked by the user")

    monkeypatch.setattr(api, "send_message", refusing)

    with pytest.raises(api.BotBlocked):
        await Outbox(session=session, link=link).send("<b>unclosed")

    await session.refresh(link)
    assert link.status == "broken"


async def test_the_keyboard_goes_under_the_last_part(
    session: AsyncSession, link: TgLink, bot: Bot
) -> None:
    outbox = Outbox(session=session, link=link)

    message_id = await outbox.send("a" * api.MESSAGE_LIMIT + "\nb", keyboard=KEYBOARD)

    assert [item.keyboard for item in bot.sent] == [None, KEYBOARD]
    assert message_id == 2
    assert outbox.sent == 2


async def test_markup_fallback_keeps_the_keyboard(
    session: AsyncSession, link: TgLink, bot: Bot
) -> None:
    bot.refuse = api.MarkupRejected("can't parse entities")

    await Outbox(session=session, link=link).send("<b>x", keyboard=KEYBOARD)

    assert [(item.html, item.keyboard) for item in bot.sent] == [(False, KEYBOARD)]


@pytest.mark.parametrize(
    ("name", "deliver"),
    [
        ("send_photo", lambda outbox: outbox.send_photo(b"png", caption="<b>c")),
        ("edit_message_text", lambda outbox: outbox.edit_text(5, "<b>hi")),
        ("edit_message_caption", lambda outbox: outbox.edit_caption(5, "<b>c")),
    ],
)
async def test_markup_the_parser_refuses_goes_out_unformatted(
    session: AsyncSession,
    link: TgLink,
    monkeypatch: pytest.MonkeyPatch,
    name: str,
    deliver: Callable[[Outbox], Awaitable[object]],
) -> None:
    """Every delivery treats an unparseable caption or edit as `send` does."""
    calls: list[bool] = []

    async def refusing(*_args: Any, html: bool = True, **_kwargs: Any) -> int:
        calls.append(html)
        if html:
            raise api.MarkupRejected("can't parse entities")
        return 7

    monkeypatch.setattr(api, name, refusing)

    await deliver(Outbox(session=session, link=link))

    assert calls == [True, False]
