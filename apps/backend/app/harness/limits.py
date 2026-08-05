from pydantic_ai.usage import RunUsage
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.harness.repository import HarnessRepository
from app.harness.usage import COST_USD, WEB_SEARCH_CALLS
from app.models import Message

MEMORY_WRITES = "memory_writes"


class LimitExceeded(Exception):
    pass


async def check_cost_ceiling(session: AsyncSession) -> None:
    # Instance-wide, not per user: this ceiling protects the budget of the
    # deployment, and every run spends from the same OpenRouter key.
    spent = await session.scalar(
        select(func.sum(Message.usage[COST_USD].as_float())).where(
            Message.created_at >= func.date_trunc("month", func.now())
        )
    )
    if float(spent or 0.0) >= settings.MONTHLY_COST_CEILING_USD:
        raise LimitExceeded(
            f"monthly budget of ${settings.MONTHLY_COST_CEILING_USD:.2f} is spent"
        )


async def check_web_search_allowed(repo: HarnessRepository, usage: RunUsage) -> None:
    # The run in flight has not stored its usage yet, so the searches it has
    # already made are counted from the live usage rather than from the table.
    spent = await repo.web_searches_today() + usage.details.get(WEB_SEARCH_CALLS, 0)
    if spent >= settings.WEB_SEARCH_DAILY_CAP:
        raise LimitExceeded(
            f"daily web search cap reached ({settings.WEB_SEARCH_DAILY_CAP} per day)"
        )


def check_memory_write_allowed(usage: RunUsage) -> None:
    # An injection guard rather than a budget: text the run read — a web
    # result, a pasted quote — can talk it into rewriting the learner's
    # profile, and this bounds how much of it one run can rewrite. Counted in
    # the run's own usage details and never stored: the cap ends with the run.
    if usage.details.get(MEMORY_WRITES, 0) >= settings.MEMORY_WRITES_PER_RUN:
        raise LimitExceeded(
            f"memory writes are capped at {settings.MEMORY_WRITES_PER_RUN} per run"
        )


async def check_run_allowed(repo: HarnessRepository) -> None:
    sent = await repo.messages_today()
    if sent >= settings.DAILY_MESSAGE_CAP:
        raise LimitExceeded(
            f"daily message cap reached ({settings.DAILY_MESSAGE_CAP} per day)"
        )
    await check_cost_ceiling(repo.session)
