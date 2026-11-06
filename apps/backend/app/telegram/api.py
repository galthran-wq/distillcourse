import json
from typing import Any

import httpx

from app.core.config import settings

API_URL = "https://api.telegram.org"
TIMEOUT_SECONDS = 20.0
# The Bot API rejects anything longer outright.
MESSAGE_LIMIT = 4096
# The header Telegram puts the shared secret in. It is a header rather than a
# query parameter because a query string is written to every access log the
# request passes through.
SECRET_HEADER = "X-Telegram-Bot-Api-Secret-Token"
# Telegram refuses a button whose callback_data is longer, in bytes.
CALLBACK_DATA_LIMIT = 64

# Rows of buttons, each {"text", "callback_data"} or {"text", "url"}.
Keyboard = list[list[dict[str, str]]]


class TelegramError(Exception):
    pass


class BotBlocked(TelegramError):
    """The learner blocked the bot, or deleted the chat with it. The channel is
    down until they open it again; nothing is retried into it."""


class MarkupRejected(TelegramError):
    """Telegram would not parse the HTML, so it refused the whole message. The
    text is resent unformatted rather than dropped."""


async def _call(
    method: str, payload: dict[str, Any], *, photo: bytes | None = None
) -> dict[str, Any]:
    if settings.TELEGRAM_BOT_TOKEN is None:
        raise TelegramError("telegram is not configured")
    url = f"{API_URL}/bot{settings.TELEGRAM_BOT_TOKEN}/{method}"
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            if photo is None:
                response = await client.post(url, json=payload)
            else:
                # Uploaded bytes go as multipart, where every other field is a
                # string and a nested one (the keyboard) is JSON inside it.
                fields = {
                    key: value if isinstance(value, str) else json.dumps(value)
                    for key, value in payload.items()
                }
                response = await client.post(
                    url, data=fields, files={"photo": ("photo.png", photo)}
                )
        body: dict[str, Any] = response.json()
    except httpx.HTTPError as exc:
        raise TelegramError(f"{method} did not reach telegram: {exc}")
    except ValueError as exc:
        raise TelegramError(f"{method} came back as something other than json: {exc}")
    if response.is_success:
        result: dict[str, Any] = body.get("result", {})
        return result
    description = str(body.get("description", response.status_code))
    if response.status_code == 403:
        raise BotBlocked(description)
    # 400 covers every malformed request; only the parser's own complaint means
    # the text would go through unformatted.
    if response.status_code == 400 and "parse" in description.lower():
        raise MarkupRejected(description)
    # An edit to what the message already says: a double tap does it, and the
    # message is right as it stands.
    if response.status_code == 400 and "message is not modified" in description:
        return {}
    raise TelegramError(f"{method} failed: {description}")


def _with_keyboard(
    payload: dict[str, Any], keyboard: Keyboard | None
) -> dict[str, Any]:
    if keyboard is None:
        return payload
    for row in keyboard:
        for button in row:
            data = button.get("callback_data", "")
            assert len(data.encode()) <= CALLBACK_DATA_LIMIT, data
    return {**payload, "reply_markup": {"inline_keyboard": keyboard}}


async def send_chat_action(tg_chat_id: int) -> None:
    """The "typing…" bar. Telegram shows it for ~5 seconds or until a message
    lands, so a long run refreshes it in a loop."""
    await _call("sendChatAction", {"chat_id": tg_chat_id, "action": "typing"})


async def send_message(
    tg_chat_id: int, text: str, *, html: bool = True, keyboard: Keyboard | None = None
) -> int:
    payload: dict[str, Any] = {"chat_id": tg_chat_id, "text": text}
    if html:
        payload["parse_mode"] = "HTML"
    sent = await _call("sendMessage", _with_keyboard(payload, keyboard))
    return int(sent["message_id"])


async def send_photo(
    tg_chat_id: int,
    photo: str | bytes,
    *,
    caption: str | None = None,
    keyboard: Keyboard | None = None,
) -> int:
    payload: dict[str, Any] = {"chat_id": tg_chat_id}
    if caption is not None:
        payload |= {"caption": caption, "parse_mode": "HTML"}
    payload = _with_keyboard(payload, keyboard)
    if isinstance(photo, str):
        sent = await _call("sendPhoto", payload | {"photo": photo})
    else:
        sent = await _call("sendPhoto", payload, photo=photo)
    return int(sent["message_id"])


async def edit_message_text(
    tg_chat_id: int, message_id: int, text: str, *, keyboard: Keyboard | None = None
) -> None:
    payload = {
        "chat_id": tg_chat_id,
        "message_id": message_id,
        "text": text,
        "parse_mode": "HTML",
    }
    await _call("editMessageText", _with_keyboard(payload, keyboard))


async def edit_message_caption(
    tg_chat_id: int, message_id: int, caption: str, *, keyboard: Keyboard | None = None
) -> None:
    payload = {
        "chat_id": tg_chat_id,
        "message_id": message_id,
        "caption": caption,
        "parse_mode": "HTML",
    }
    await _call("editMessageCaption", _with_keyboard(payload, keyboard))


async def edit_message_keyboard(
    tg_chat_id: int, message_id: int, keyboard: Keyboard | None
) -> None:
    """`None` takes the buttons off."""
    payload = {"chat_id": tg_chat_id, "message_id": message_id}
    await _call("editMessageReplyMarkup", _with_keyboard(payload, keyboard))


async def answer_callback(callback_id: str, text: str | None = None) -> None:
    """Stops the spinner Telegram shows on a pressed button; `text` is a toast."""
    payload: dict[str, Any] = {"callback_query_id": callback_id}
    if text is not None:
        payload["text"] = text
    await _call("answerCallbackQuery", payload)


async def set_webhook(url: str, secret: str) -> None:
    await _call(
        "setWebhook",
        {
            "url": url,
            "secret_token": secret,
            # Everything else — edits, reactions, channel posts — is noise this
            # bot has no handler for, and asking for it only costs deliveries.
            "allowed_updates": ["message", "callback_query"],
        },
    )
