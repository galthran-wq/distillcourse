import uuid
from typing import Any

from pydantic_ai.usage import RunUsage
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import BackgroundRun

REQUESTS = "requests"
INPUT_TOKENS = "input_tokens"
OUTPUT_TOKENS = "output_tokens"
COST_USD = "cost_usd"
WEB_SEARCH_CALLS = "web_search_calls"


def usage_row(usage: RunUsage) -> dict[str, Any]:
    """What a run cost, as stored on `messages.usage`.

    The caps read these keys back out of jsonb, where a typo is not an error
    but a sum over nothing, so the names are written once and imported.
    """
    return {
        REQUESTS: usage.requests,
        INPUT_TOKENS: usage.input_tokens,
        OUTPUT_TOKENS: usage.output_tokens,
        COST_USD: float(usage.cost) if usage.cost is not None else None,
        # What the run spent outside the model: the web_search tool counts
        # itself into the run's usage details, and its cap sums this key back
        # out of jsonb the way the ceiling sums the cost.
        WEB_SEARCH_CALLS: usage.details.get(WEB_SEARCH_CALLS, 0),
    }


async def charge_background(
    session: AsyncSession, user_id: uuid.UUID | None, kind: str, usage: RunUsage
) -> None:
    """Record a call that belongs to no chat, where the monthly ceiling sums it.
    Uncommitted: it is written in the caller's transaction."""
    session.add(BackgroundRun(user_id=user_id, kind=kind, usage=usage_row(usage)))
    await session.flush()
