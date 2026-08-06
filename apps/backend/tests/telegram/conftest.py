from typing import Any

import pytest
from httpx import AsyncClient, Response

from app.core.config import settings
from app.telegram import api
from tests.conftest import TG_CHAT_ID

WEBHOOK = "/api/tg/webhook"
SECRET = "the-shared-secret"
BOT = "distillcourse_bot"


@pytest.fixture(autouse=True)
def configured_bot(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "TELEGRAM_BOT_TOKEN", "424242:not-a-real-token")
    monkeypatch.setattr(settings, "TELEGRAM_BOT_USERNAME", BOT)
    monkeypatch.setattr(settings, "TELEGRAM_WEBHOOK_SECRET", SECRET)


def message(
    text: str,
    *,
    update_id: int = 1,
    tg_chat_id: int = TG_CHAT_ID,
    chat_type: str = "private",
) -> dict[str, Any]:
    return {
        "update_id": update_id,
        "message": {"chat": {"id": tg_chat_id, "type": chat_type}, "text": text},
    }


async def deliver(
    client: AsyncClient, payload: dict[str, Any], *, secret: str = SECRET
) -> Response:
    """One update, as Telegram posts it. The reply is written by the background
    task the route starts, which httpx runs before it hands the response back."""
    return await client.post(WEBHOOK, json=payload, headers={api.SECRET_HEADER: secret})
