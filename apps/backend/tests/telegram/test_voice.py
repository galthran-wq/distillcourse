import base64
import html
from typing import Any

import httpx
import pytest
from httpx import AsyncClient
from logfire.testing import CaptureLogfire
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.harness.repository import HarnessRepository
from app.models import BackgroundRun, Chat, Message, TgLink, User
from app.telegram import api, speech, updates
from tests.conftest import TG_CHAT_ID, Bot, replying
from tests.telegram.conftest import AUDIO, Ears, deliver, voice

pytestmark = pytest.mark.usefixtures("link")

# Bound before the `ears` fixture replaces it on the module, for the tests of
# the real call.
REAL_TRANSCRIBE = speech.transcribe


@pytest.fixture
async def thread(session: AsyncSession, link: TgLink) -> Chat:
    return await HarnessRepository(session, link.user_id).create_chat(kind="telegram")


def test_a_voice_message_in_a_private_chat_is_read() -> None:
    update = updates.parse(voice(duration=42))

    assert update == updates.Update(
        update_id=1,
        tg_chat_id=TG_CHAT_ID,
        text="",
        voice=updates.Voice(file_id="voice-file", duration=42),
    )


@pytest.mark.parametrize(
    "payload",
    [
        voice(chat_type="group"),
        {
            "update_id": 1,
            "message": {
                "chat": {"id": TG_CHAT_ID, "type": "private"},
                "video_note": {"file_id": "round", "duration": 5, "length": 240},
            },
        },
        {
            "update_id": 1,
            "message": {
                "chat": {"id": TG_CHAT_ID, "type": "private"},
                "audio": {"file_id": "song", "duration": 180},
            },
        },
    ],
    ids=["voice in a group", "video note", "audio file"],
)
def test_other_sounds_and_other_chats_are_ignored(payload: dict[str, Any]) -> None:
    assert updates.parse(payload) is None


@pytest.mark.usefixtures("thread")
async def test_the_transcript_is_shown_and_answered_like_typed_text(
    client: AsyncClient, session: AsyncSession, bot: Bot, ears: Ears
) -> None:
    with replying("right, the average moves less"):
        await deliver(client, voice())

    assert ears.downloads == ["voice-file"]
    assert ears.transcribed == [AUDIO]
    assert bot.texts == [
        "<i>Heard:</i> more data lowers variance",
        "right, the average moves less",
    ]
    stored = [str(row.pydantic_ai) for row in await session.scalars(select(Message))]
    assert any("more data lowers variance" in row for row in stored)


@pytest.mark.usefixtures("thread")
async def test_what_was_heard_is_escaped_and_cut(
    client: AsyncClient, bot: Bot, ears: Ears
) -> None:
    transcript = "a < b " + "x" * 300
    ears.heard = transcript

    with replying():
        await deliver(client, voice())

    assert bot.texts[0] == (
        "<i>Heard:</i> " + html.escape(transcript[: updates.HEARD_CHARS]) + "…"
    )


@pytest.mark.usefixtures("ears")
async def test_a_busy_thread_points_at_the_transcript_rather_than_a_re_recording(
    monkeypatch: pytest.MonkeyPatch,
    client: AsyncClient,
    session: AsyncSession,
    thread: Chat,
    bot: Bot,
) -> None:
    monkeypatch.setattr(updates, "RUN_ATTEMPTS", 1)
    await HarnessRepository(session, thread.user_id).claim_run(thread, thread.id)

    with replying():
        await deliver(client, voice())

    assert bot.texts == ["<i>Heard:</i> more data lowers variance", updates.BUSY_HEARD]


async def test_a_voice_over_two_minutes_is_refused_unheard(
    client: AsyncClient, session: AsyncSession, bot: Bot, ears: Ears
) -> None:
    await deliver(client, voice(duration=updates.VOICE_SECONDS + 1))

    assert bot.texts == [updates.TOO_LONG]
    assert ears.downloads == []
    assert ears.transcribed == []
    assert await session.scalar(select(BackgroundRun)) is None


@pytest.mark.parametrize(
    "heard", [speech.TranscriptionFailed("503"), ""], ids=["failure", "empty"]
)
@pytest.mark.usefixtures("thread")
async def test_nothing_heard_says_so_and_starts_no_run(
    client: AsyncClient,
    session: AsyncSession,
    bot: Bot,
    ears: Ears,
    heard: str | Exception,
) -> None:
    ears.heard = heard

    with replying("this must not be said"):
        await deliver(client, voice())

    assert bot.texts == [updates.UNHEARD]
    assert await session.scalar(select(Message)) is None


@pytest.mark.usefixtures("thread")
async def test_a_file_telegram_will_not_hand_over_says_so(
    monkeypatch: pytest.MonkeyPatch, client: AsyncClient, bot: Bot, ears: Ears
) -> None:
    async def missing(_file_id: str) -> bytes:
        raise api.TelegramError("getFile failed: file is too big")

    monkeypatch.setattr(api, "download_file", missing)

    await deliver(client, voice())

    assert bot.texts == [updates.UNHEARD]
    assert ears.transcribed == []


@pytest.mark.usefixtures("thread")
async def test_what_a_transcription_cost_is_kept_and_counted(
    client: AsyncClient, session: AsyncSession, user: User, ears: Ears, bot: Bot
) -> None:
    ears.cost = settings.MONTHLY_COST_CEILING_USD

    with replying("this must not be said"):
        await deliver(client, voice())

    run = await session.scalar(select(BackgroundRun))
    assert run is not None
    assert (run.user_id, run.kind) == (user.id, speech.TRANSCRIBE)
    assert run.usage["cost_usd"] == settings.MONTHLY_COST_CEILING_USD
    # The transcription spent the budget, so the run after it is refused, and
    # said to be as it would be for a typed message.
    assert bot.texts[0].startswith("<i>Heard:</i>")
    assert "monthly budget" in bot.texts[-1]


async def test_a_spent_budget_is_reported_before_anything_is_downloaded(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot, ears: Ears
) -> None:
    session.add(
        BackgroundRun(
            user_id=user.id,
            kind=speech.TRANSCRIBE,
            usage={"cost_usd": settings.MONTHLY_COST_CEILING_USD},
        )
    )
    await session.commit()

    await deliver(client, voice())

    assert ears.downloads == []
    assert len(bot.texts) == 1
    assert "monthly budget" in bot.texts[0]


@pytest.mark.usefixtures("thread")
async def test_a_learner_at_the_daily_cap_is_told_before_anything_is_downloaded(
    monkeypatch: pytest.MonkeyPatch, client: AsyncClient, bot: Bot, ears: Ears
) -> None:
    monkeypatch.setattr(settings, "DAILY_MESSAGE_CAP", 0)

    await deliver(client, voice())

    assert ears.downloads == []
    assert ears.transcribed == []
    assert len(bot.texts) == 1
    assert "daily message cap" in bot.texts[0]


@pytest.mark.usefixtures("thread")
async def test_no_audio_reaches_the_database_or_the_logs(
    monkeypatch: pytest.MonkeyPatch,
    client: AsyncClient,
    session: AsyncSession,
    capfire: CaptureLogfire,
    ears: Ears,
) -> None:
    post = httpx.AsyncClient.post

    async def refused(
        self: httpx.AsyncClient, url: str, **kwargs: Any
    ) -> httpx.Response:
        # The test client posts the update through the same method.
        if url != speech.URL:
            return await post(self, url, **kwargs)
        return httpx.Response(400, json={"error": {"message": "bad audio"}})

    # The real transcription call, failing, so what it logs is under test.
    monkeypatch.setattr(speech, "transcribe", REAL_TRANSCRIBE)
    monkeypatch.setattr(httpx.AsyncClient, "post", refused)
    await deliver(client, voice())
    monkeypatch.setattr(speech, "transcribe", ears.transcribe)
    with replying():
        await deliver(client, voice(update_id=2))

    encoded = base64.b64encode(AUDIO).decode()
    logged = str(capfire.exporter.exported_spans_as_dict())
    assert "bad audio" in logged
    rows = [
        str(row.__dict__)
        for model in (Message, BackgroundRun)
        for row in await session.scalars(select(model))
    ]
    for dump in [logged, *rows]:
        assert encoded not in dump
        assert "the learner's voice" not in dump


async def test_transcribe_sends_the_ogg_as_base64_and_returns_a_usage_row(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    posted: dict[str, Any] = {}

    async def post(_self: httpx.AsyncClient, url: str, **kwargs: Any) -> httpx.Response:
        posted.update(url=url, body=kwargs["json"])
        return httpx.Response(
            200,
            json={
                "text": " Больше данных ",
                "usage": {"cost": 0.0001, "input_tokens": 3, "output_tokens": 4},
            },
        )

    monkeypatch.setattr(httpx.AsyncClient, "post", post)

    text, usage = await speech.transcribe(AUDIO)

    assert text == "Больше данных"
    assert usage == {
        "requests": 1,
        "input_tokens": 3,
        "output_tokens": 4,
        "cost_usd": 0.0001,
    }
    assert posted["url"] == speech.URL
    assert posted["body"] == {
        "model": settings.TRANSCRIPTION_MODEL,
        "input_audio": {"data": base64.b64encode(AUDIO).decode(), "format": "ogg"},
    }


async def test_download_file_asks_for_the_path_then_fetches_it(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def post(_self: httpx.AsyncClient, url: str, **kwargs: Any) -> httpx.Response:
        assert url.endswith("/getFile")
        assert kwargs["json"] == {"file_id": "voice-file"}
        return httpx.Response(200, json={"result": {"file_path": "voice/file_7.oga"}})

    async def get(_self: httpx.AsyncClient, url: str, **_: Any) -> httpx.Response:
        assert url.endswith("/voice/file_7.oga")
        assert "/file/bot" in url
        return httpx.Response(200, content=AUDIO)

    monkeypatch.setattr(httpx.AsyncClient, "post", post)
    monkeypatch.setattr(httpx.AsyncClient, "get", get)

    assert await api.download_file("voice-file") == AUDIO


@pytest.mark.parametrize(
    "answer",
    [["a list"], {"text": "hi", "usage": {"cost": "free"}}],
    ids=["not-an-object", "bad-cost"],
)
async def test_a_malformed_transcription_answer_is_a_failure(
    monkeypatch: pytest.MonkeyPatch, answer: object
) -> None:
    async def post(_self: httpx.AsyncClient, _url: str, **_: Any) -> httpx.Response:
        return httpx.Response(200, json=answer)

    monkeypatch.setattr(httpx.AsyncClient, "post", post)

    with pytest.raises(speech.TranscriptionFailed):
        await speech.transcribe(AUDIO)
