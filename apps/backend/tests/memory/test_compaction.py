from app.core.config import settings
from app.harness import runner
from app.harness.agent import tutor
from app.harness.repository import HarnessRepository
from app.memory import repository
from app.memory.repository import DESCRIPTION_LENGTH
from app.models import Chat
from tests.harness.conftest import compacting
from tests.memory.conftest import GOAL, compacting_and_saving

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


async def test_the_candidates_share_the_allowance_the_tools_spend_from(
    repo: HarnessRepository, chat: Chat
) -> None:
    """The cap bounds the run, not the route into it: a compaction that saves
    through the tool and then returns candidates gets one allowance between
    them, not one each."""
    cap = settings.MEMORY_WRITES_PER_RUN
    candidates = [
        {
            "slug": f"candidate-{number}",
            "description": f"the {number}th thing worth knowing",
            "content": f"fact number {number}",
        }
        for number in range(cap)
    ]

    with tutor.override(
        model=compacting_and_saving("they study entropy", cap, *candidates)
    ):
        await runner.run(repo, chat, QUESTION)
        await runner.compact(repo, chat)

    slugs = [row.slug for row in await repository.index(repo.session, repo.user_id)]
    assert len(slugs) == cap
    assert all(slug.startswith("tool-") for slug in slugs)


async def test_a_candidate_that_will_not_validate_costs_the_summary_nothing(
    repo: HarnessRepository, chat: Chat
) -> None:
    """The chat continues on the summary and cannot continue without it, so a
    memory the model wrote too long fails alone."""
    overlong = {
        "slug": GOAL.slug,
        "description": "d" * (DESCRIPTION_LENGTH + 1),
        "content": GOAL.content,
    }

    with tutor.override(model=compacting("they study entropy", overlong)):
        await runner.run(repo, chat, QUESTION)
        summary = await runner.compact(repo, chat)

    assert summary == "they study entropy"
    assert await repository.index(repo.session, repo.user_id) == []
