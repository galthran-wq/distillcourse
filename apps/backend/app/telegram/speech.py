"""A voice message as text, through OpenRouter's transcription endpoint.

The same key and the same bill as every other model call, so the monthly
ceiling sees it. Only the text comes back out of here: the audio is neither
stored nor logged.
"""

import base64
from typing import Any

import httpx

from app.core.config import settings
from app.harness.usage import COST_USD, INPUT_TOKENS, OUTPUT_TOKENS, REQUESTS

# The background_runs kind a transcription is billed under.
TRANSCRIBE = "transcribe"
URL = "https://openrouter.ai/api/v1/audio/transcriptions"
# Two minutes of speech is the longest a learner may send; this leaves the
# provider room to be slow about it.
TIMEOUT_SECONDS = 60.0


class TranscriptionFailed(Exception):
    pass


async def transcribe(audio: bytes) -> tuple[str, dict[str, Any]]:
    """The transcript, and what it cost as a usage row. The language is left to
    the model to detect: learners write to the bot in theirs."""
    body = {
        "model": settings.TRANSCRIPTION_MODEL,
        # Telegram's voice notes are Opus in an Ogg container.
        "input_audio": {"data": base64.b64encode(audio).decode(), "format": "ogg"},
    }
    headers = {"Authorization": f"Bearer {settings.OPENROUTER_API_KEY}"}
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            response = await client.post(URL, json=body, headers=headers)
        answer = response.json()
    except httpx.HTTPError as exc:
        raise TranscriptionFailed(f"transcription did not reach openrouter: {exc!r}")
    except ValueError:
        raise TranscriptionFailed(f"transcription answered {response.status_code}")
    if not isinstance(answer, dict):
        raise TranscriptionFailed(f"transcription answered {response.status_code}")
    text = answer.get("text")
    if not response.is_success or not isinstance(text, str):
        raise TranscriptionFailed(
            f"transcription failed: {response.status_code} {answer.get('error')}"
        )
    usage = answer.get("usage")
    if not isinstance(usage, dict):
        usage = {}
    cost = usage.get("cost")
    try:
        cost_usd = float(cost) if cost is not None else None
    except TypeError, ValueError:
        raise TranscriptionFailed(f"transcription reported a cost of {cost!r}")
    return text.strip(), {
        REQUESTS: 1,
        INPUT_TOKENS: usage.get(INPUT_TOKENS, 0),
        OUTPUT_TOKENS: usage.get(OUTPUT_TOKENS, 0),
        COST_USD: cost_usd,
    }
