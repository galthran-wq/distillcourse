"""The coach: a background agent that decides whether the bot says anything to
one learner now, and when to look again.

Not a tutor run. It is handed a summary (`state.py`) rather than the thread,
its only way to reach the learner is a send tool, and what it returns is when
to check next — never text to deliver. Staying silent is a run that called no
send tool, which is the outcome a run starts from.
"""

from datetime import datetime

from pydantic import BaseModel
from pydantic_ai import Agent, Tool
from pydantic_ai.usage import RunUsage, UsageLimits
from sqlalchemy.ext.asyncio import AsyncSession

from app.coach import state
from app.coach.tools import send_card, send_nudge
from app.coach.wake import KIND
from app.core.config import settings
from app.harness.agent import model_for
from app.harness.deps import HarnessDeps
from app.harness.limits import check_cost_ceiling
from app.harness.prompts import module
from app.harness.repository import HarnessRepository
from app.harness.tools import (
    fetch_content,
    get_course_structure,
    get_user_progress,
    search_content,
)
from app.harness.usage import charge_background
from app.memory.tools import read_memory, save_memory
from app.models import Schedule, User
from app.telegram import thread
from app.telegram.outbox import Outbox

# A run reads a little and sends at most one card; past this it is looping.
RUN_REQUESTS = 8


class Decision(BaseModel):
    # Wall-clock time on the learner's clock, which is what the run was asked
    # for and reads its state in; any zone written on it is set aside
    # (`wake.clamp`).
    next_check_at: datetime
    # One line, handed to the next run.
    reason: str


# Barriers, every one, for the reason `app/harness/agent.py` gives: they share
# the run's single AsyncSession. The read tools are the tutor's own functions,
# registered here a second time rather than copied.
coach = Agent(
    name="coach",
    deps_type=HarnessDeps,
    output_type=Decision,
    tools=[
        Tool(function, sequential=True)
        for function in (
            search_content,
            fetch_content,
            get_course_structure,
            get_user_progress,
            read_memory,
            save_memory,
            send_card,
            send_nudge,
        )
    ],
)


async def decide(
    session: AsyncSession, user: User, outbox: Outbox, row: Schedule, now: datetime
) -> Decision:
    """One run, charged to `background_runs` whether or not it decides —
    including one that fails before the model is asked: that row is also what
    the daily run cap counts."""
    await check_cost_ceiling(session)
    usage = RunUsage()
    try:
        deps = HarnessDeps(
            repo=HarnessRepository(session, user.id),
            chat=await thread.of(session, user.id),
            outbox=outbox,
            now=now,
        )
        summary = await state.block(session, user, row, now)
        # Nothing that waits on a model holds a pooled connection while it does.
        await session.commit()
        result = await coach.run(
            summary,
            model=model_for(settings.COACH_MODEL),
            deps=deps,
            instructions=module("coach.md"),
            usage=usage,
            usage_limits=UsageLimits(request_limit=RUN_REQUESTS),
        )
    except Exception:
        await session.rollback()
        raise
    finally:
        await charge_background(session, user.id, KIND, usage)
        await session.commit()
    return result.output
