from app.core.config import settings
from app.harness import runner
from app.harness.agent import tutor
from app.harness.repository import HarnessRepository
from app.memory import repository
from app.models import Chat
from tests.harness.conftest import compacting
from tests.memory.conftest import GOAL

QUESTION = "what is entropy?"


async def test_a_compaction_stores_what_it_found_worth_remembering(
    repo: HarnessRepository, chat: Chat
) -> None:
    """Compaction is the one moment the whole conversation is in front of the
    model, so it is where the profile is written as well as the summary."""
    with tutor.override(model=compacting("they study entropy", GOAL.model_dump())):
        await runner.run(repo, chat, QUESTION)
        summary = await runner.compact(repo, chat)

    rows = await repository.index(repo.session, repo.user_id)
    assert summary == "they study entropy"
    assert [(row.slug, row.content) for row in rows] == [(GOAL.slug, GOAL.content)]


async def test_a_candidate_under_an_existing_slug_replaces_it(
    repo: HarnessRepository, chat: Chat
) -> None:
    """Consolidation, not accumulation: a slug the compaction reuses is the
    memory it revised."""
    await repository.save(repo.session, repo.user_id, GOAL, source="agent")
    revised = GOAL.model_copy(update={"content": "The interview moved to October."})

    with tutor.override(model=compacting("they study entropy", revised.model_dump())):
        await runner.run(repo, chat, QUESTION)
        await runner.compact(repo, chat)

    rows = await repository.index(repo.session, repo.user_id)
    assert [row.content for row in rows] == ["The interview moved to October."]


async def test_a_compaction_may_write_no_more_than_a_run_may(
    repo: HarnessRepository, chat: Chat
) -> None:
    candidates = [
        {
            "slug": f"fact-{number}",
            "description": f"the {number}th thing worth knowing",
            "content": f"fact number {number}",
        }
        for number in range(settings.MEMORY_WRITES_PER_RUN + 1)
    ]

    with tutor.override(model=compacting("they study entropy", *candidates)):
        await runner.run(repo, chat, QUESTION)
        await runner.compact(repo, chat)

    rows = await repository.index(repo.session, repo.user_id)
    assert len(rows) == settings.MEMORY_WRITES_PER_RUN
