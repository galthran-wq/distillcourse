import json
from dataclasses import dataclass
from typing import Any

import httpx
import pytest

from app.telegram import api

# Bound before the suite's autouse stub replaces them on the module: these
# tests are of the real calls.
from app.telegram.api import (
    answer_callback,
    edit_message_caption,
    edit_message_keyboard,
    edit_message_text,
    send_message,
    send_photo,
)

CALL = {"chat_id": 4242, "text": "entropy is the average surprisal"}


@dataclass
class Posted:
    method: str = ""
    json: dict[str, Any] | None = None
    data: dict[str, str] | None = None
    files: dict[str, Any] | None = None


def answering(
    monkeypatch: pytest.MonkeyPatch,
    status: int = 200,
    description: str = "",
    result: dict[str, Any] | None = None,
) -> Posted:
    """Telegram's side of one call, without the network, and what was posted.

    The rest of the suite stubs `send_message` and raises these exceptions
    itself; this is the one place the mapping from a response to them is the
    thing under test.
    """
    body: dict[str, Any] = {
        "ok": status == 200,
        "result": {"message_id": 5} if result is None else result,
    }
    if description:
        body["description"] = description
    posted = Posted()

    async def post(_self: httpx.AsyncClient, url: str, **kwargs: Any) -> httpx.Response:
        posted.method = url.rsplit("/", 1)[-1]
        posted.json = kwargs.get("json")
        posted.data = kwargs.get("data")
        posted.files = kwargs.get("files")
        return httpx.Response(status, json=body)

    monkeypatch.setattr(httpx.AsyncClient, "post", post)
    return posted


async def test_a_call_that_worked_returns_the_result(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    answering(monkeypatch, 200)

    assert await api._call("sendMessage", CALL) == {"message_id": 5}


async def test_a_403_is_a_blocked_bot(monkeypatch: pytest.MonkeyPatch) -> None:
    answering(monkeypatch, 403, "Forbidden: bot was blocked by the user")

    with pytest.raises(api.BotBlocked):
        await api._call("sendMessage", CALL)


async def test_html_the_parser_refuses_is_a_markup_rejection(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The one refusal the outbox can do something about: send it unformatted."""
    answering(
        monkeypatch,
        400,
        'Bad Request: can\'t parse entities: Unsupported start tag "hmm" at byte 4',
    )

    with pytest.raises(api.MarkupRejected):
        await api._call("sendMessage", CALL)


async def test_any_other_bad_request_is_a_plain_failure(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Resending unformatted would not help, so it must not be mistaken for a
    parser complaint — the caller has to see this one."""
    answering(monkeypatch, 400, "Bad Request: message is too long")

    with pytest.raises(api.TelegramError) as failure:
        await api._call("sendMessage", CALL)

    assert not isinstance(failure.value, api.MarkupRejected)
    assert "message is too long" in str(failure.value)


async def test_a_network_failure_is_a_telegram_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def post(
        _self: httpx.AsyncClient, _url: str, **_kwargs: Any
    ) -> httpx.Response:
        raise httpx.ConnectError("no route to api.telegram.org")

    monkeypatch.setattr(httpx.AsyncClient, "post", post)

    with pytest.raises(api.TelegramError):
        await api._call("sendMessage", CALL)


KEYBOARD: api.Keyboard = [
    [
        {"text": "A", "callback_data": "card:1:a"},
        {"text": "B", "callback_data": "card:1:b"},
    ],
    [{"text": "Read the lesson", "url": "https://distillcourse.example/l"}],
]
MARKUP = {"inline_keyboard": KEYBOARD}


async def test_a_message_with_buttons_returns_its_id(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    posted = answering(monkeypatch, result={"message_id": 17})

    message_id = await send_message(4242, "<b>Which?</b>", keyboard=KEYBOARD)

    assert message_id == 17
    assert posted.method == "sendMessage"
    assert posted.json == {
        "chat_id": 4242,
        "text": "<b>Which?</b>",
        "parse_mode": "HTML",
        "reply_markup": MARKUP,
    }


async def test_a_message_without_buttons_carries_no_markup(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    posted = answering(monkeypatch, result={"message_id": 3})

    await send_message(4242, "plain", html=False)

    assert posted.json == {"chat_id": 4242, "text": "plain"}


async def test_an_edit_replaces_text_and_buttons(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    posted = answering(monkeypatch, result={"message_id": 17})

    await edit_message_text(4242, 17, "Right.", keyboard=KEYBOARD)

    assert posted.method == "editMessageText"
    assert posted.json == {
        "chat_id": 4242,
        "message_id": 17,
        "text": "Right.",
        "parse_mode": "HTML",
        "reply_markup": MARKUP,
    }


async def test_a_caption_edit(monkeypatch: pytest.MonkeyPatch) -> None:
    posted = answering(monkeypatch, result={"message_id": 17})

    await edit_message_caption(4242, 17, "Figure 2")

    assert posted.method == "editMessageCaption"
    assert posted.json == {
        "chat_id": 4242,
        "message_id": 17,
        "caption": "Figure 2",
        "parse_mode": "HTML",
    }


async def test_unformatted_edits_and_captions_carry_no_parse_mode(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """What the outbox falls back to when Telegram will not parse the HTML."""
    posted = answering(monkeypatch, result={"message_id": 17})

    await edit_message_text(4242, 17, "<b>x", html=False)
    assert posted.json == {"chat_id": 4242, "message_id": 17, "text": "<b>x"}

    await edit_message_caption(4242, 17, "<b>x", html=False)
    assert posted.json == {"chat_id": 4242, "message_id": 17, "caption": "<b>x"}

    await send_photo(
        4242, "https://distillcourse.example/f.png", caption="<b>x", html=False
    )
    assert posted.json == {
        "chat_id": 4242,
        "photo": "https://distillcourse.example/f.png",
        "caption": "<b>x",
    }


async def test_a_keyboard_edit_to_none_takes_the_buttons_off(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    posted = answering(monkeypatch, result={"message_id": 17})

    await edit_message_keyboard(4242, 17, None)

    assert posted.method == "editMessageReplyMarkup"
    assert posted.json == {"chat_id": 4242, "message_id": 17}


async def test_a_keyboard_edit_sends_the_new_buttons(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    posted = answering(monkeypatch, result={"message_id": 17})

    await edit_message_keyboard(4242, 17, KEYBOARD)

    assert posted.json == {"chat_id": 4242, "message_id": 17, "reply_markup": MARKUP}


async def test_an_answered_tap_with_and_without_a_toast(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    posted = answering(monkeypatch, result={})

    await answer_callback("cb-1")
    assert posted.method == "answerCallbackQuery"
    assert posted.json == {"callback_query_id": "cb-1"}

    await answer_callback("cb-2", "Saved")
    assert posted.json == {"callback_query_id": "cb-2", "text": "Saved"}


async def test_a_photo_by_url_is_json(monkeypatch: pytest.MonkeyPatch) -> None:
    posted = answering(monkeypatch, result={"message_id": 21})

    message_id = await send_photo(
        4242, "https://distillcourse.example/f.png", caption="Fig", keyboard=KEYBOARD
    )

    assert message_id == 21
    assert posted.method == "sendPhoto"
    assert posted.files is None
    assert posted.json == {
        "chat_id": 4242,
        "photo": "https://distillcourse.example/f.png",
        "caption": "Fig",
        "parse_mode": "HTML",
        "reply_markup": MARKUP,
    }


async def test_a_photo_from_bytes_is_multipart(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Every multipart field is a string, so the keyboard travels as JSON."""
    posted = answering(monkeypatch, result={"message_id": 22})
    png = b"\x89PNG\r\n\x1a\n"

    message_id = await send_photo(4242, png, keyboard=KEYBOARD)

    assert message_id == 22
    assert posted.json is None
    assert posted.files == {"photo": ("photo.png", png)}
    assert posted.data == {"chat_id": "4242", "reply_markup": json.dumps(MARKUP)}


async def test_an_edit_that_changes_nothing_is_not_an_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A double tap edits a message into what it already says."""
    answering(
        monkeypatch,
        400,
        "Bad Request: message is not modified: specified new message content "
        "and reply markup are exactly the same",
    )

    await edit_message_text(4242, 17, "Right.")


async def test_callback_data_over_telegrams_limit_is_refused_before_sending(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    answering(monkeypatch, result={"message_id": 1})
    long = [[{"text": "x", "callback_data": "card:" + "é" * 30}]]

    with pytest.raises(AssertionError):
        await send_message(4242, "x", keyboard=long)


async def test_the_webhook_asks_for_button_presses(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    posted = answering(monkeypatch, result={})

    await api.set_webhook("https://distillcourse.example/api/tg/webhook", "s")

    assert posted.json is not None
    assert posted.json["allowed_updates"] == ["message", "callback_query"]
