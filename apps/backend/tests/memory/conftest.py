from pydantic_ai.messages import ModelMessage, ModelResponse, TextPart
from pydantic_ai.models.function import AgentInfo, FunctionModel

from app.memory.repository import Recollection
from tests.harness.conftest import call, chat, other_repo, repo, returns  # noqa: F401

# Memory is written and read inside runs, so these tests are built on the same
# user-scoped repository and chat the harness tests are.

GOAL = Recollection(
    slug="goal-information-theory",
    description="here to prepare for an ML interview in six weeks",
    content="Wants the information theory course done by mid-September for an "
    "interview; asked for the shortest path through it.",
)
NOTATION = Recollection(
    slug="notation-logs-base-two",
    description="reads logs as base 2 by default",
    content="Follows entropy in bits without being told; base-e restatements "
    "cost them a step every time.",
)


def saving(times: int) -> FunctionModel:
    """A model that tries to remember one thing per turn, that many times over,
    and then reports what the last attempt returned."""
    made = 0

    def turn(messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        nonlocal made
        if made < times:
            made += 1
            return call(
                "save_memory",
                slug=f"fact-{made}",
                description=f"the {made}th thing worth knowing",
                content=f"fact number {made}",
            )
        return ModelResponse(
            parts=[TextPart(content=str(returns(messages, "save_memory")[-1]))]
        )

    return FunctionModel(turn)
