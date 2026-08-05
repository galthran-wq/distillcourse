from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.harness.repository import HarnessRepository
from app.harness.usage import COST_USD
from app.models import Message


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


async def check_run_allowed(repo: HarnessRepository) -> None:
    sent = await repo.messages_today()
    if sent >= settings.DAILY_MESSAGE_CAP:
        raise LimitExceeded(
            f"daily message cap reached ({settings.DAILY_MESSAGE_CAP} per day)"
        )
    await check_cost_ceiling(repo.session)
