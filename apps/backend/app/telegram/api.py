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


class TelegramError(Exception):
    pass


class BotBlocked(TelegramError):
    """The learner blocked the bot, or deleted the chat with it. The channel is
    down until they open it again; nothing is retried into it."""


class MarkupRejected(TelegramError):
    """Telegram would not parse the HTML, so it refused the whole message. The
    text is resent unformatted rather than dropped."""


async def _call(method: str, payload: dict[str, Any]) -> dict[str, Any]:
    if settings.TELEGRAM_BOT_TOKEN is None:
        raise TelegramError("telegram is not configured")
    url = f"{API_URL}/bot{settings.TELEGRAM_BOT_TOKEN}/{method}"
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            response = await client.post(url, json=payload)
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
    raise TelegramError(f"{method} failed: {description}")


async def send_chat_action(tg_chat_id: int) -> None:
    """The "typing…" bar. Telegram shows it for ~5 seconds or until a message
    lands, so a long run refreshes it in a loop."""
    await _call("sendChatAction", {"chat_id": tg_chat_id, "action": "typing"})


async def send_message(tg_chat_id: int, text: str, *, html: bool = True) -> None:
    payload: dict[str, Any] = {"chat_id": tg_chat_id, "text": text}
    if html:
        payload["parse_mode"] = "HTML"
    await _call("sendMessage", payload)


async def set_webhook(url: str, secret: str) -> None:
    await _call(
        "setWebhook",
        {
            "url": url,
            "secret_token": secret,
            # Everything else — edits, reactions, channel posts — is noise this
            # bot has no handler for, and asking for it only costs deliveries.
            "allowed_updates": ["message"],
        },
    )
