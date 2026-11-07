from datetime import UTC, datetime, time, timedelta
from typing import Any

from pydantic_ai.messages import ModelMessage, ModelResponse
from pydantic_ai.models.function import AgentInfo, FunctionModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User
from tests.harness.conftest import call


def deciding(
    *sends: dict[str, Any],
    next_check_at: datetime | None = None,
    reason: str = "nothing worth sending",
    asked: list[list[ModelMessage]] | None = None,
) -> FunctionModel:
    """The coach, answered from the test: `send_card` with each set of
    arguments in turn, then its decision — a day out unless told otherwise.

    It counts its own calls: what the tools returned is the subject of the
    tests that read them. `asked` collects what each request was handed."""
    made = 0

    def turn(messages: list[ModelMessage], info: AgentInfo) -> ModelResponse:
        nonlocal made
        if asked is not None:
            asked.append(list(messages))
        if made < len(sends):
            made += 1
            return call("send_card", **sends[made - 1])
        at = next_check_at or datetime.now(UTC) + timedelta(days=1)
        return call(
            info.output_tools[0].name, next_check_at=at.isoformat(), reason=reason
        )

    return FunctionModel(turn)


async def awake(session: AsyncSession, user: User) -> None:
    """The whole day is waking hours, so that a send tool, which reads the
    real clock rather than the test's, is never refused for the hour the
    suite happens to run at."""
    user.quiet_start, user.quiet_end = time(0), time(23, 59, 59)
    await session.commit()


async def asleep(session: AsyncSession, user: User) -> None:
    """Waking hours that do not include the real clock's present hour."""
    hour = datetime.now(UTC).hour
    opens = (hour + 1) % 24 if hour < 23 else 1
    user.quiet_start, user.quiet_end = time(opens), time(opens, 30)
    await session.commit()
