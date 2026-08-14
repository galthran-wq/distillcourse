import uuid

import pytest
from pydantic_ai.messages import ModelRequest, ModelResponse, TextPart, UserPromptPart

from app.core.config import settings
from app.harness.limits import LimitExceeded, check_run_allowed
from app.harness.repository import HarnessRepository
from app.models import Chat, LabSubmission, User

QUESTION = ModelRequest(parts=[UserPromptPart(content="what is entropy?")])
ANSWER = ModelResponse(parts=[TextPart(content="expected surprise")])


async def test_the_cap_rejects_the_message_after_the_last_allowed_one(
    repo: HarnessRepository, chat: Chat
) -> None:
    for _ in range(settings.DAILY_MESSAGE_CAP - 1):
        await repo.add_messages(chat, [QUESTION], role="user")
    await check_run_allowed(repo)

    await repo.add_messages(chat, [QUESTION], role="user")
    with pytest.raises(LimitExceeded, match="daily message cap"):
        await check_run_allowed(repo)


async def test_another_users_traffic_does_not_count_against_the_cap(
    repo: HarnessRepository, other_repo: HarnessRepository
) -> None:
    theirs = await other_repo.create_chat(kind="web")
    for _ in range(settings.DAILY_MESSAGE_CAP):
        await other_repo.add_messages(theirs, [QUESTION], role="user")

    await check_run_allowed(repo)


async def test_the_ceiling_halts_runs_once_the_budget_is_spent(
    repo: HarnessRepository, chat: Chat
) -> None:
    await repo.add_messages(
        chat,
        [ANSWER],
        role="agent",
        usage={"cost_usd": settings.MONTHLY_COST_CEILING_USD, "requests": 1},
    )

    with pytest.raises(LimitExceeded, match="monthly budget"):
        await check_run_allowed(repo)


async def test_the_ceiling_counts_what_a_labs_judge_spent(
    repo: HarnessRepository, user: User
) -> None:
    """The judge of a lab's review checkpoint bills the same key as a chat
    does, so a ceiling blind to it would stop being the deployment's budget."""
    repo.session.add(
        LabSubmission(
            id=uuid.uuid4(),
            user_id=user.id,
            lesson="lesson:information-theory/surprisal-lab",
            checkpoint="why-uniform",
            verdict={"passed": True, "hint": None, "score": None, "pending": False},
            usage={"cost_usd": settings.MONTHLY_COST_CEILING_USD, "requests": 1},
        )
    )
    await repo.session.commit()

    with pytest.raises(LimitExceeded, match="monthly budget"):
        await check_run_allowed(repo)


async def test_the_ceiling_counts_every_user_of_the_instance(
    repo: HarnessRepository, other_repo: HarnessRepository
) -> None:
    theirs = await other_repo.create_chat(kind="web")
    await other_repo.add_messages(
        theirs,
        [ANSWER],
        role="agent",
        usage={"cost_usd": settings.MONTHLY_COST_CEILING_USD},
    )

    with pytest.raises(LimitExceeded, match="monthly budget"):
        await check_run_allowed(repo)
