import uuid
from datetime import UTC, datetime, timedelta

from pydantic_ai.messages import ModelRequest, ModelResponse, TextPart, UserPromptPart
from sqlalchemy.ext.asyncio import AsyncSession

from app.harness.repository import HarnessRepository
from app.models import Chat

QUESTION = ModelRequest(parts=[UserPromptPart(content="what is entropy?")])
ANSWER = ModelResponse(parts=[TextPart(content="expected surprise")])


async def test_a_chat_of_another_user_is_out_of_reach(
    repo: HarnessRepository, other_repo: HarnessRepository
) -> None:
    theirs = await other_repo.create_chat(kind="web")
    await other_repo.add_messages(theirs, [QUESTION], role="user")

    assert await repo.get_chat(theirs.id) is None
    assert theirs.id not in [chat.id for chat, _ in await repo.list_chats()]
    assert await repo.messages_today() == 0


async def test_history_round_trips_through_the_database(
    repo: HarnessRepository, chat: Chat
) -> None:
    await repo.add_messages(chat, [QUESTION], role="user")
    await repo.add_messages(chat, [ANSWER], role="agent")

    assert await repo.history(chat) == [QUESTION, ANSWER]


async def test_a_clear_marker_cuts_everything_before_it(
    repo: HarnessRepository, chat: Chat
) -> None:
    await repo.add_messages(chat, [QUESTION], role="user")
    await repo.add_messages(chat, [ANSWER], role="agent")
    await repo.add_messages(chat, [QUESTION], role="system", marker="clear")
    await repo.add_messages(chat, [ANSWER], role="agent")

    assert await repo.history(chat) == [ANSWER]


async def test_a_compact_marker_keeps_its_own_summary(
    repo: HarnessRepository, chat: Chat
) -> None:
    summary = ModelRequest(parts=[UserPromptPart(content="Summary: entropy.")])
    await repo.add_messages(chat, [QUESTION], role="user")
    await repo.add_messages(chat, [summary], role="system", marker="compact")
    await repo.add_messages(chat, [ANSWER], role="agent")

    assert await repo.history(chat) == [summary, ANSWER]


async def test_errored_rows_stay_out_of_the_context(
    repo: HarnessRepository, chat: Chat
) -> None:
    run_id = uuid.uuid4()
    await repo.add_messages(chat, [QUESTION], role="user", run_id=run_id)
    await repo.fail_run(chat, run_id, "openrouter said no")

    assert await repo.history(chat) == []
    assert [row.error for row in await repo.rows(chat)] == ["openrouter said no"]


async def test_a_title_is_cut_at_a_locator_boundary(
    repo: HarnessRepository, chat: Chat
) -> None:
    """A name is the question that started the chat, and the panel's header and
    the rail read the `[[locator]]`s in it back as the places they name. One
    section anchor is longer than the whole allowance, so a plain slice would
    leave half a locator behind — which nothing resolves, and which is then
    shown raw until the chat is named again."""
    await repo.set_title(
        chat, "what was traded at [[lesson:us-history/indigenous-america#cahokia]]?"
    )
    assert chat.title == "what was traded at"

    # One that fits is kept whole, brackets and all; only the words after it go.
    await repo.set_title(
        chat, "[[lesson:us-history/indigenous-america]] what was traded here?"
    )
    assert chat.title == "[[lesson:us-history/indigenous-america]] what was traded her"


async def test_a_stamp_without_a_name_keeps_the_name(
    repo: HarnessRepository, chat: Chat
) -> None:
    """What a naming pass that came back with nothing writes: it has still run,
    and the stamp is what stops the next run from buying the same silence."""
    await repo.set_title(chat, "what is entropy?")
    stamped = chat.titled_at

    await repo.set_title(chat, None)

    assert chat.title == "what is entropy?"
    assert stamped is not None and chat.titled_at is not None
    assert chat.titled_at >= stamped


async def test_only_one_run_holds_a_chat(repo: HarnessRepository, chat: Chat) -> None:
    assert await repo.claim_run(chat, uuid.uuid4()) is True
    assert await repo.claim_run(chat, uuid.uuid4()) is False


async def test_a_stale_claim_is_taken_over(
    session: AsyncSession, repo: HarnessRepository, chat: Chat
) -> None:
    await repo.claim_run(chat, uuid.uuid4())
    chat.claimed_until = datetime.now(UTC) - timedelta(seconds=1)
    await session.commit()

    assert await repo.claim_run(chat, uuid.uuid4()) is True


async def test_releasing_frees_the_chat_for_the_next_run(
    repo: HarnessRepository, chat: Chat
) -> None:
    run_id = uuid.uuid4()
    await repo.claim_run(chat, run_id)
    await repo.release_run(chat, run_id)

    assert await repo.claim_run(chat, uuid.uuid4()) is True
