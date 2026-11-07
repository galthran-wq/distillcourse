from datetime import UTC, datetime, timedelta
from typing import Any

from pydantic_ai.messages import ModelMessage, ModelResponse
from pydantic_ai.models.function import AgentInfo, FunctionModel

from tests.harness.conftest import call


def deciding(
    *sends: dict[str, Any] | tuple[str, dict[str, Any]],
    next_check_at: datetime | None = None,
    reason: str = "nothing worth sending",
    asked: list[list[ModelMessage]] | None = None,
) -> FunctionModel:
    """The coach, answered from the test: each send in turn — `send_card` with
    a bare set of arguments, else the tool a `(name, arguments)` pair names —
    then its decision, a day out unless told otherwise.

    It counts its own calls: what the tools returned is the subject of the
    tests that read them. `asked` collects what each request was handed."""
    made = 0

    def turn(messages: list[ModelMessage], info: AgentInfo) -> ModelResponse:
        nonlocal made
        if asked is not None:
            asked.append(list(messages))
        if made < len(sends):
            made += 1
            send = sends[made - 1]
            tool, arguments = send if isinstance(send, tuple) else ("send_card", send)
            return call(tool, **arguments)
        at = next_check_at or datetime.now(UTC) + timedelta(days=1)
        return call(
            info.output_tools[0].name, next_check_at=at.isoformat(), reason=reason
        )

    return FunctionModel(turn)
