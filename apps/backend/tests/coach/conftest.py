from datetime import UTC, datetime, timedelta
from typing import Any

from pydantic_ai.messages import ModelMessage, ModelResponse
from pydantic_ai.models.function import AgentInfo, FunctionModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.coach import wake
from app.coach.agent import coach, decide
from app.models import Schedule, TgLink, User
from app.scheduling import repository as scheduling
from app.telegram.outbox import Outbox
from tests.harness.conftest import call
from tests.scheduling.conftest import NOON

FAR = NOON + timedelta(days=5)


def deciding(
    *sends: dict[str, Any],
    tool: str = "send_card",
    next_check_at: datetime | None = None,
    reason: str = "nothing worth sending",
    asked: list[list[ModelMessage]] | None = None,
) -> FunctionModel:
    """The coach, answered from the test: `tool` with each set of arguments in
    turn, then its decision — a day out unless told otherwise.

    It counts its own calls: what the tools returned is the subject of the
    tests that read them. `asked` collects what each request was handed."""
    made = 0

    def turn(messages: list[ModelMessage], info: AgentInfo) -> ModelResponse:
        nonlocal made
        if asked is not None:
            asked.append(list(messages))
        if made < len(sends):
            made += 1
            return call(tool, **sends[made - 1])
        at = next_check_at or datetime.now(UTC) + timedelta(days=1)
        return call(
            info.output_tools[0].name, next_check_at=at.isoformat(), reason=reason
        )

    return FunctionModel(turn)


async def wake_up(
    session: AsyncSession, user: User, *, at: datetime = FAR, reason: str = ""
) -> Schedule:
    return await scheduling.create(
        session,
        user_id=user.id,
        kind="coach",
        due_at=at,
        payload={"reason": reason, "note": wake.OWN},
        created_by="system",
    )


async def run(
    session: AsyncSession,
    user: User,
    link: TgLink,
    *sends: dict[str, Any],
    tool: str = "send_card",
    asked: list[list[ModelMessage]] | None = None,
    at: datetime = NOON,
) -> list[ModelMessage]:
    """One coach run on a fresh wake-up; what its last request was handed."""
    seen = [] if asked is None else asked
    row = await wake_up(session, user, at=at)
    with coach.override(model=deciding(*sends, tool=tool, asked=seen)):
        await decide(session, user, Outbox(session=session, link=link), row, at)
    return seen[-1]
