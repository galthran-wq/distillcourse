from typing import Any

import pytest
from pydantic_ai.messages import (
    ModelMessage,
    ModelRequest,
    ModelResponse,
    TextPart,
    ToolCallPart,
    ToolReturnPart,
)
from pydantic_ai.models.function import AgentInfo, FunctionModel
from pydantic_core import to_jsonable_python
from sqlalchemy.ext.asyncio import AsyncSession

from app.harness.repository import HarnessRepository
from app.models import Chat, User


@pytest.fixture
def repo(session: AsyncSession, user: User) -> HarnessRepository:
    return HarnessRepository(session, user.id)


@pytest.fixture
def other_repo(session: AsyncSession, other_user: User) -> HarnessRepository:
    return HarnessRepository(session, other_user.id)


@pytest.fixture
async def chat(repo: HarnessRepository) -> Chat:
    return await repo.create_chat(kind="web")


def returns(messages: list[ModelMessage], name: str) -> list[Any]:
    """What the named tool has returned so far, as the model sees it.

    Serialized, because the same content is a pydantic model while the run is
    live and plain json once it has been through the database.
    """
    return [
        to_jsonable_python(part.content)
        for message in messages
        if isinstance(message, ModelRequest)
        for part in message.parts
        if isinstance(part, ToolReturnPart) and part.tool_name == name
    ]


def call(name: str, **args: object) -> ModelResponse:
    return ModelResponse(parts=[ToolCallPart(tool_name=name, args=args)])


def calling(tool: str, **arguments: object) -> FunctionModel:
    """A model that calls one tool and then reports what it returned, which is
    what the learner would be told.

    It counts its own calls rather than reading them out of the history: an
    earlier turn of the same chat may have called the same tool, and this run
    has not called anything yet.
    """
    made = 0

    def turn(messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        nonlocal made
        if made == 0:
            made += 1
            return call(tool, **arguments)
        return ModelResponse(parts=[TextPart(content=str(returns(messages, tool)[-1]))])

    return FunctionModel(turn)


def echoing() -> FunctionModel:
    """A model that answers with the instructions it was given, which is how a
    test reads the prompt the harness assembled."""

    def turn(messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        request = messages[-1]
        assert isinstance(request, ModelRequest)
        return ModelResponse(parts=[TextPart(content=request.instructions or "")])

    return FunctionModel(turn)


def compacting(summary: str, *memories: dict[str, Any]) -> FunctionModel:
    """A model that answers a dialogue in text and a compaction in the
    structured output only that one asks for — one override for a run that
    compacts before it answers.
    """

    def turn(_messages: list[ModelMessage], info: AgentInfo) -> ModelResponse:
        if not info.output_tools:
            return ModelResponse(parts=[TextPart(content=summary)])
        return ModelResponse(
            parts=[
                ToolCallPart(
                    tool_name=info.output_tools[0].name,
                    args={"summary": summary, "memories": list(memories)},
                )
            ]
        )

    return FunctionModel(turn)
