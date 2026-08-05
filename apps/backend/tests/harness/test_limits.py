import pytest
from pydantic_ai.messages import ModelRequest, ModelResponse, TextPart, UserPromptPart

from app.core.config import settings
from app.harness.deps import HarnessDeps
from app.harness.limits import LimitExceeded, check_run_allowed, claim_web_search
from app.harness.repository import HarnessRepository
from app.models import Chat

QUESTION = ModelRequest(parts=[UserPromptPart(content="what is entropy?")])
ANSWER = ModelResponse(parts=[TextPart(content="expected surprise")])


async def test_the_cap_rejects_the_message_after_the_last_allowed_one(
    repo: HarnessRepository, chat: Chat
) -> None:
    for _ in range(settings.DAILY_MESSAGE_CAP - 1):
        await repo.add_message(chat, QUESTION, role="user")
    await check_run_allowed(repo)

    await repo.add_message(chat, QUESTION, role="user")
    with pytest.raises(LimitExceeded, match="daily message cap"):
        await check_run_allowed(repo)


async def test_another_users_traffic_does_not_count_against_the_cap(
    repo: HarnessRepository, other_repo: HarnessRepository
) -> None:
    theirs = await other_repo.create_chat(kind="web")
    for _ in range(settings.DAILY_MESSAGE_CAP):
        await other_repo.add_message(theirs, QUESTION, role="user")

    await check_run_allowed(repo)


async def test_the_ceiling_halts_runs_once_the_budget_is_spent(
    repo: HarnessRepository, chat: Chat
) -> None:
    await repo.add_message(
        chat,
        ANSWER,
        role="agent",
        usage={"cost_usd": settings.MONTHLY_COST_CEILING_USD, "requests": 1},
    )

    with pytest.raises(LimitExceeded, match="monthly budget"):
        await check_run_allowed(repo)


async def test_the_ceiling_counts_every_user_of_the_instance(
    repo: HarnessRepository, other_repo: HarnessRepository
) -> None:
    theirs = await other_repo.create_chat(kind="web")
    await other_repo.add_message(
        theirs,
        ANSWER,
        role="agent",
        usage={"cost_usd": settings.MONTHLY_COST_CEILING_USD},
    )

    with pytest.raises(LimitExceeded, match="monthly budget"):
        await check_run_allowed(repo)


async def test_web_searches_are_capped_across_runs(
    repo: HarnessRepository, chat: Chat
) -> None:
    await repo.add_message(
        chat,
        ANSWER,
        role="agent",
        usage={"web_search_calls": settings.DAILY_WEB_SEARCH_CAP - 1},
    )
    deps = HarnessDeps(repo=repo, chat=chat)

    await claim_web_search(deps)
    assert deps.tally.web_search_calls == 1

    with pytest.raises(LimitExceeded, match="web search cap"):
        await claim_web_search(deps)


async def test_a_single_run_cannot_outrun_the_cap(
    repo: HarnessRepository, chat: Chat
) -> None:
    deps = HarnessDeps(repo=repo, chat=chat)

    for _ in range(settings.DAILY_WEB_SEARCH_CAP):
        await claim_web_search(deps)

    with pytest.raises(LimitExceeded, match="web search cap"):
        await claim_web_search(deps)
