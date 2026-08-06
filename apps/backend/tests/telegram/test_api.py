from typing import Any

import httpx
import pytest

from app.telegram import api

CALL = {"chat_id": 4242, "text": "entropy is the average surprisal"}


def answering(
    monkeypatch: pytest.MonkeyPatch, status: int, description: str = ""
) -> None:
    """Telegram's side of one call, without the network.

    The rest of the suite stubs `send_message` and raises these exceptions
    itself; this is the one place the mapping from a response to them is the
    thing under test.
    """
    body: dict[str, Any] = {"ok": status == 200, "result": {"message_id": 5}}
    if description:
        body["description"] = description

    async def post(
        _self: httpx.AsyncClient, _url: str, **_kwargs: Any
    ) -> httpx.Response:
        return httpx.Response(status, json=body)

    monkeypatch.setattr(httpx.AsyncClient, "post", post)


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
