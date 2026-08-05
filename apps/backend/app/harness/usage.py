from typing import Any

from pydantic_ai.usage import RunUsage

REQUESTS = "requests"
INPUT_TOKENS = "input_tokens"
OUTPUT_TOKENS = "output_tokens"
COST_USD = "cost_usd"


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
    }
