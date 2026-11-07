from dataclasses import dataclass, field
from typing import Any

import pytest
from httpx import AsyncClient, Response

from app.core.config import settings
from app.telegram import api, speech
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


AUDIO = b"OggS\x00 the learner's voice"


def voice(
    *,
    duration: int = 7,
    update_id: int = 1,
    chat_type: str = "private",
) -> dict[str, Any]:
    return {
        "update_id": update_id,
        "message": {
            "chat": {"id": TG_CHAT_ID, "type": chat_type},
            "voice": {"file_id": "voice-file", "duration": duration},
        },
    }


@dataclass
class Ears:
    """Telegram's file store and the transcription model, recorded. `heard` is
    what the model returns; an exception there is raised instead."""

    heard: str | Exception = "more data lowers variance"
    cost: float = 0.001
    downloads: list[str] = field(default_factory=list)
    transcribed: list[bytes] = field(default_factory=list)

    async def download_file(self, file_id: str) -> bytes:
        self.downloads.append(file_id)
        return AUDIO

    async def transcribe(self, audio: bytes) -> tuple[str, dict[str, Any]]:
        self.transcribed.append(audio)
        if isinstance(self.heard, Exception):
            raise self.heard
        return self.heard, {"requests": 1, "cost_usd": self.cost}


@pytest.fixture
def ears(monkeypatch: pytest.MonkeyPatch) -> Ears:
    stub = Ears()
    monkeypatch.setattr(
        settings, "TRANSCRIPTION_MODEL", "mistralai/voxtral-mini-transcribe"
    )
    monkeypatch.setattr(api, "download_file", stub.download_file)
    monkeypatch.setattr(speech, "transcribe", stub.transcribe)
    return stub


def tap(
    data: str,
    *,
    update_id: int = 1,
    chat_type: str = "private",
    callback_id: str = "cb-1",
    message_id: int = 55,
) -> dict[str, Any]:
    return {
        "update_id": update_id,
        "callback_query": {
            "id": callback_id,
            "from": {"id": TG_CHAT_ID},
            "message": {
                "message_id": message_id,
                "chat": {"id": TG_CHAT_ID, "type": chat_type},
            },
            "data": data,
        },
    }
