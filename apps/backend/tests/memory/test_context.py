from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.harness import runner
from app.harness.agent import tutor
from app.harness.repository import HarnessRepository
from app.memory import repository
from app.memory.repository import Recollection
from app.models import Chat, User
from tests.harness.conftest import calling, echoing
from tests.memory.conftest import GOAL


async def test_a_fact_saved_in_web_chat_reaches_a_telegram_run(
    session: AsyncSession, user: User
) -> None:
    """The profile is of the learner, not of the chat it was written in: what
    the tutor was told on the site is in front of it when the same learner
    writes on Telegram."""
    repo = HarnessRepository(session, user.id)
    web = await repo.create_chat(kind="web")
    thread = await repo.create_chat(kind="telegram")

    with tutor.override(model=calling("save_memory", **GOAL.model_dump())):
        await runner.run(repo, web, "I have an interview in six weeks", medium="web")
    with tutor.override(model=echoing()):
        prompt = await runner.run(repo, thread, "what should I do tonight?")

    assert f"- `{GOAL.slug}`: {GOAL.description}" in prompt
    # Descriptions only: the body is what read_memory is for, and what keeps a
    # profile of paragraphs out of every prompt.
    assert GOAL.content not in prompt


async def test_a_profile_past_the_soft_cap_is_told_to_consolidate(
    repo: HarnessRepository, chat: Chat
) -> None:
    for number in range(settings.MEMORY_INDEX_SOFT_CAP + 1):
        await repository.save(
            repo.session,
            repo.user_id,
            Recollection(
                slug=f"fact-{number:03d}",
                description=f"the {number}th thing worth knowing",
                content=f"fact number {number}",
            ),
            source="agent",
        )

    with tutor.override(model=echoing()):
        prompt = await runner.run(repo, chat, "what were we doing?")

    assert "merge the memories that overlap" in prompt


async def test_an_empty_profile_puts_nothing_in_the_prompt(
    repo: HarnessRepository, chat: Chat
) -> None:
    with tutor.override(model=echoing()):
        prompt = await runner.run(repo, chat, "what were we doing?")

    assert "What you remember about the learner" not in prompt
