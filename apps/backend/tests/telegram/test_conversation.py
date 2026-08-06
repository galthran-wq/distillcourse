import uuid

import pytest
from httpx import AsyncClient
from pydantic_ai.messages import ModelMessage, ModelResponse, TextPart, ToolCallPart
from pydantic_ai.models.function import AgentInfo, FunctionModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.harness.agent import tutor
from app.harness.repository import HarnessRepository
from app.models import Chat, TgLink, User
from app.scheduling import policy
from app.telegram import api, outbox, repository, updates

# Aliased because `thread` here is the fixture holding the Chat row.
from app.telegram import thread as delivery
from tests.conftest import Bot, replying
from tests.telegram.conftest import deliver, message


def sending(*parts: str, then: str) -> FunctionModel:
    """A model that writes its messages with the tool, then answers `then`."""
    calls = iter(parts)

    def turn(_messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        text = next(calls, None)
        if text is None:
            return ModelResponse(parts=[TextPart(content=then)])
        return ModelResponse(
            parts=[ToolCallPart(tool_name="send_message", args={"html": text})]
        )

    return FunctionModel(turn)


@pytest.fixture
async def thread(session: AsyncSession, link: TgLink) -> Chat:
    return await HarnessRepository(session, link.user_id).create_chat(kind="telegram")


@pytest.mark.usefixtures("link")
async def test_an_answer_nobody_sent_is_delivered(
    client: AsyncClient, bot: Bot
) -> None:
    with replying("the surprisal of an outcome is -log p"):
        await deliver(client, message("what is surprisal?"))

    assert bot.texts == ["the surprisal of an outcome is -log p"]


@pytest.mark.usefixtures("link")
async def test_a_run_that_sent_its_own_messages_is_not_delivered_twice(
    client: AsyncClient, bot: Bot
) -> None:
    """The tool is the delivery once it is used; the final answer would be a
    repeat of what the learner already read."""
    with tutor.override(model=sending("first half", "second half", then="both sent")):
        await deliver(client, message("explain typical sets"))

    assert bot.texts == ["first half", "second half"]


@pytest.mark.usefixtures("link")
async def test_a_run_whose_tool_sent_nothing_still_answers(
    client: AsyncClient, bot: Bot
) -> None:
    """A tool call with no text in it is not a delivery: counted as one, it
    suppresses the final answer and the learner reads silence."""
    with tutor.override(model=sending("   ", then="the surprisal is -log p")):
        await deliver(client, message("what is surprisal?"))

    assert bot.texts == ["the surprisal is -log p"]


@pytest.mark.usefixtures("link")
async def test_a_run_that_fails_outright_says_so(
    monkeypatch: pytest.MonkeyPatch, client: AsyncClient, bot: Bot
) -> None:
    """Handling an update is the top of a background task, and the update id is
    already recorded, so an escaping exception is permanent silence."""

    async def explode(*_args: object, **_kwargs: object) -> None:
        raise RuntimeError("the provider fell over")

    monkeypatch.setattr(delivery, "converse", explode)

    await deliver(client, message("what is entropy?"))

    assert bot.texts == [updates.FAILED]


@pytest.mark.usefixtures("link")
async def test_html_telegram_will_not_parse_is_resent_as_plain_text(
    client: AsyncClient, bot: Bot
) -> None:
    """Telegram refuses the whole message over one bad tag, so the choice is
    unformatted text or nothing."""
    bot.refuse = api.MarkupRejected("can't parse entities")

    with replying("<b>entropy is 2 bits"):
        await deliver(client, message("how many bits?"))

    assert [(item.text, item.html) for item in bot.sent] == [
        ("<b>entropy is 2 bits", False)
    ]


async def test_a_blocked_bot_marks_the_channel_broken(
    client: AsyncClient, session: AsyncSession, link: TgLink, bot: Bot
) -> None:
    bot.refuse = api.BotBlocked("bot was blocked by the user")

    with replying():
        await deliver(client, message("what is entropy?"))

    await session.refresh(link)
    assert link.status == "broken"


async def test_a_message_from_a_repaired_channel_opens_it_again(
    client: AsyncClient, session: AsyncSession, link: TgLink
) -> None:
    """They are writing to us, so whatever broke the channel is over."""
    link.status = "broken"
    await session.commit()

    with replying():
        await deliver(client, message("i'm back"))

    await session.refresh(link)
    assert link.status == "active"


def test_a_message_too_long_for_telegram_is_split() -> None:
    body = "\n".join("a paragraph of some length" for _ in range(400))

    parts = outbox.split(body)

    assert len(parts) > 1
    assert all(len(part) <= api.MESSAGE_LIMIT for part in parts)
    assert "".join(parts).replace("\n", "") == body.replace("\n", "")


def test_a_message_with_nowhere_to_break_is_cut_anyway() -> None:
    parts = outbox.split("x" * (api.MESSAGE_LIMIT + 10))

    assert [len(part) for part in parts] == [api.MESSAGE_LIMIT, 10]


async def test_clear_cuts_the_history_the_next_run_is_given(
    client: AsyncClient, session: AsyncSession, thread: Chat, bot: Bot
) -> None:
    repo = HarnessRepository(session, thread.user_id)
    with replying():
        await deliver(client, message("what is entropy?"))
    assert await repo.live_rows(thread) != []

    await deliver(client, message("/clear", update_id=2))

    assert await repo.live_rows(thread) == []
    assert "Cleared" in bot.texts[-1]


async def test_clear_waits_for_the_run_holding_the_thread(
    client: AsyncClient, session: AsyncSession, thread: Chat, bot: Bot
) -> None:
    """The claim is the thread's queue, and `/clear` is in it: a marker written
    beside a run in flight is overtaken by that run's own output."""
    await HarnessRepository(session, thread.user_id).claim_run(thread, uuid.uuid4())

    await deliver(client, message("/clear"))

    assert bot.texts == [updates.BUSY]


async def test_compact_replaces_the_history_with_a_summary(
    client: AsyncClient, session: AsyncSession, thread: Chat, bot: Bot
) -> None:
    repo = HarnessRepository(session, thread.user_id)
    with replying():
        await deliver(client, message("what is entropy?"))

    with replying("they asked about entropy"):
        await deliver(client, message("/compact", update_id=2))

    rows = await repo.live_rows(thread)
    assert rows[0].marker == "compact"
    assert "they asked about entropy" in str(rows[0].pydantic_ai)
    assert "Compacted" in bot.texts[-1]


@pytest.mark.usefixtures("link")
async def test_mute_and_unmute_are_bot_commands(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    await deliver(client, message("/mute"))
    await session.refresh(user)
    assert user.muted_until == policy.INDEFINITE

    await deliver(client, message("/unmute", update_id=2))
    await session.refresh(user)
    assert user.muted_until is None
    assert [text.split(".")[0] for text in bot.texts] == ["Muted", "Unmuted"]


async def test_a_thread_already_running_makes_the_learner_wait(
    monkeypatch: pytest.MonkeyPatch,
    client: AsyncClient,
    session: AsyncSession,
    thread: Chat,
    bot: Bot,
) -> None:
    """The thread is the queue. An incoming message waits for the run holding it
    and, if that outlasts the wait, says so rather than vanishing."""
    monkeypatch.setattr(updates, "RUN_ATTEMPTS", 2)
    monkeypatch.setattr(updates, "RUN_WAIT_SECONDS", 0.0)
    await HarnessRepository(session, thread.user_id).claim_run(thread, thread.id)

    with replying():
        await deliver(client, message("are you there?"))

    assert bot.texts == [updates.BUSY]


@pytest.mark.usefixtures("link")
async def test_a_stranger_cannot_reach_another_learners_thread(
    client: AsyncClient, session: AsyncSession, bot: Bot
) -> None:
    """An unpaired chat id is nobody's, whatever it claims to be."""
    with replying():
        await deliver(client, message("what is entropy?", tg_chat_id=999))

    assert bot.texts == [updates.PAIR_FIRST]
    assert await repository.link_for_chat(session, 999) is None
