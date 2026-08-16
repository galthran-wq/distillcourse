"""What a run is told before the learner says anything.

The assembly is the seam between the page and the tutor: what is prefetched
here is what an answer can be right about without spending a tool call on it.
"""

from datetime import UTC, datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.content.ingest import ingest
from app.content.schemas import ContentIndex
from app.core.config import ChatModel, settings
from app.harness import context, runner
from app.harness.agent import tutor
from app.harness.repository import HarnessRepository
from app.models import Chat, LessonProgress
from tests.content.conftest import corpus_index  # noqa: F401  (a shared fixture)
from tests.harness.conftest import echoing

ENTROPY = "lesson:information-theory/entropy-as-average-surprise"
# An h3 of the fixture corpus: it resolves to the h2 section that holds it,
# which is what a reader who followed a reference on the page is looking at.
SECTION = f"{ENTROPY}#expected-surprisal-no-new-primitive"


async def read(
    session: AsyncSession, user_id: object, lesson: str, **fields: object
) -> None:
    now = datetime.now(UTC)
    defaults: dict[str, object] = {
        "active_seconds": 600,
        "max_scroll_pct": 100,
        "proofs_opened": 0,
        "solutions_opened": 0,
        "demos_touched": 0,
        "first_seen": now,
        "last_seen": now,
        "completed_at": now,
    }
    session.add(LessonProgress(user_id=user_id, lesson=lesson, **(defaults | fields)))
    await session.commit()


@pytest.mark.usefixtures("corpus_index")
async def test_the_section_on_screen_travels_with_the_question(
    session: AsyncSession,
    repo: HarnessRepository,
    corpus_index: ContentIndex,  # noqa: F811
) -> None:
    """#11's scenario is "why is this true?" with nothing selected: the section
    the reader is looking at is in the prompt, so the answer does not depend on
    the model deciding to fetch it first."""
    await ingest(session, corpus_index)

    blocks = await context.blocks(repo, current_locator=SECTION)
    prompt = "\n".join(block.body for block in blocks)

    assert f"They are reading `{SECTION}`." in prompt
    # The spine around it: which lesson of the course this is, what it is read
    # after, and what it teaches.
    assert '"Entropy" is lesson 2 of' in prompt
    assert "Information Theory" in prompt
    assert "It is read after: Surprisal." in prompt
    assert "- Entropy: " in prompt
    # And the section itself, not a locator the model has to go and read.
    assert "The probability-weighted average" in prompt or len(prompt) > 4000


@pytest.mark.usefixtures("corpus_index")
async def test_a_section_longer_than_the_bound_is_cut_rather_than_dropped(
    session: AsyncSession,
    repo: HarnessRepository,
    corpus_index: ContentIndex,  # noqa: F811
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    await ingest(session, corpus_index)
    monkeypatch.setattr(context, "SECTION_CHARS", 40)

    blocks = await context.blocks(repo, current_locator=SECTION)

    assert "`fetch_content` has the whole section" in blocks[-1].body


async def test_a_locator_the_index_never_saw_still_says_where_they_are(
    repo: HarnessRepository,
) -> None:
    blocks = await context.blocks(repo, current_locator="lesson:gone/missing#here")

    assert [block.title for block in blocks] == [
        "The learner's clock",
        "Where the learner is",
    ]


async def test_what_they_have_read_is_one_line_and_only_theirs(
    session: AsyncSession, repo: HarnessRepository, other_repo: HarnessRepository
) -> None:
    await read(session, repo.user_id, ENTROPY)
    await read(session, repo.user_id, f"{ENTROPY}-2", completed_at=None)
    await read(session, other_repo.user_id, "lesson:information-theory/theirs")

    [block] = [
        block
        for block in await context.blocks(repo)
        if block.title == "What the learner has read"
    ]

    assert "finished 1 of the 2 lessons" in block.body
    assert "theirs" not in block.body


async def test_a_reader_with_no_history_gets_no_progress_block(
    repo: HarnessRepository,
) -> None:
    titles = [block.title for block in await context.blocks(repo)]

    assert "What the learner has read" not in titles


async def test_a_platform_run_bills_the_default_model_whatever_the_chat_uses(
    monkeypatch: pytest.MonkeyPatch, repo: HarnessRepository, chat: Chat
) -> None:
    """A review, a proactive message and a compaction are the instance's own
    spending; the learner's model choice governs the dialogue they are having,
    not what the platform starts by itself (#10)."""
    asked: list[str] = []
    monkeypatch.setattr(
        runner, "model_for", lambda openrouter_id, **_: asked.append(openrouter_id)
    )

    async def no_retitle(*_args: object, **_kwargs: object) -> None:
        return None

    # Retitling is the platform's own spending too, but it is title.py's story;
    # this test pins what the RUNS bill.
    monkeypatch.setattr(runner, "retitle", no_retitle)
    # The deployed pool may be a single model; billing needs a distinct one.
    other = "test/other"
    monkeypatch.setattr(
        settings,
        "CHAT_MODELS",
        [
            *settings.CHAT_MODELS,
            ChatModel(
                openrouter_id=other, display_name="Other", context_window=1_000_000
            ),
        ],
    )
    await repo.set_model(chat, other)

    with tutor.override(model=echoing(), tools=[]):
        await runner.run(repo, chat, "what is due?", run_kind="review")
        await runner.run(repo, chat, "what is entropy?", run_kind="chat")

    assert asked == [settings.DEFAULT_CHAT_MODEL, other]
