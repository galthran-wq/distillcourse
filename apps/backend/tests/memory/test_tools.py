from pydantic_ai.toolsets import FunctionToolset

from app.core.config import settings
from app.harness import runner
from app.harness.agent import tutor
from app.harness.repository import HarnessRepository
from app.memory import repository
from app.models import Chat
from tests.harness.conftest import calling
from tests.memory.conftest import GOAL, NOTATION, saving


def test_the_memory_tools_never_overlap_on_the_run_session() -> None:
    """All three drive the run's one AsyncSession, which two coroutines may not
    share. The tool calls of a single model response are concurrent tasks
    unless a tool declares itself a barrier, and a response that reads a memory
    and saves one is ordinary."""
    toolset = tutor.toolsets[0]
    assert isinstance(toolset, FunctionToolset)

    assert [
        toolset.tools[name].sequential
        for name in ("read_memory", "save_memory", "delete_memory")
    ] == [True, True, True]


async def test_a_fact_from_the_dialogue_is_remembered(
    repo: HarnessRepository, chat: Chat
) -> None:
    with tutor.override(model=calling("save_memory", **GOAL.model_dump())):
        await runner.run(repo, chat, "I have an interview in six weeks")

    rows = await repository.index(repo.session, repo.user_id)
    assert [(row.slug, row.content, row.source) for row in rows] == [
        (GOAL.slug, GOAL.content, "agent")
    ]


async def test_the_bodies_are_read_by_slug_in_one_call(
    repo: HarnessRepository, chat: Chat
) -> None:
    """The index carries descriptions; this is how the tutor gets the facts
    themselves, as many at once as bear on the question."""
    for memory in (GOAL, NOTATION):
        await repository.save(repo.session, repo.user_id, memory, source="agent")

    with tutor.override(
        model=calling("read_memory", slugs=[GOAL.slug, NOTATION.slug, "never-written"])
    ):
        answer = await runner.run(repo, chat, "what should I read next?")

    assert GOAL.content in answer
    assert NOTATION.content in answer
    assert "never-written" not in answer


async def test_a_memory_that_no_longer_holds_is_forgotten(
    repo: HarnessRepository, chat: Chat
) -> None:
    await repository.save(repo.session, repo.user_id, GOAL, source="agent")

    with tutor.override(model=calling("delete_memory", slug=GOAL.slug)):
        await runner.run(repo, chat, "the interview is off")

    assert await repository.index(repo.session, repo.user_id) == []


async def test_the_writes_of_one_run_are_capped(
    repo: HarnessRepository, chat: Chat
) -> None:
    """The cap is what a prompt injection runs into: whatever a run was talked
    into, it can only rewrite the profile so many times."""
    with tutor.override(model=saving(settings.MEMORY_WRITES_PER_RUN + 1)):
        answer = await runner.run(repo, chat, "remember everything about me")

    rows = await repository.index(repo.session, repo.user_id)
    assert len(rows) == settings.MEMORY_WRITES_PER_RUN
    assert "memory writes are capped" in answer


async def test_the_cap_is_spent_per_run_and_not_for_good(
    repo: HarnessRepository, chat: Chat
) -> None:
    with tutor.override(model=saving(settings.MEMORY_WRITES_PER_RUN + 1)):
        await runner.run(repo, chat, "remember everything about me")
    with tutor.override(model=calling("save_memory", **NOTATION.model_dump())):
        await runner.run(repo, chat, "and I think in bits")

    slugs = [row.slug for row in await repository.index(repo.session, repo.user_id)]
    assert NOTATION.slug in slugs
