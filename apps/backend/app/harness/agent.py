from functools import lru_cache

from pydantic_ai import Agent, Tool
from pydantic_ai.models.openrouter import OpenRouterModel, OpenRouterModelSettings
from pydantic_ai.providers.openrouter import OpenRouterProvider

from app.core.config import ChatModel, settings
from app.harness.deps import HarnessDeps
from app.memory.tools import delete_memory, read_memory, save_memory
from app.review.tools import report_review_outcome
from app.scheduling.tools import (
    cancel_reminder,
    create_reminder,
    list_reminders,
    mute_proactive,
    unmute_proactive,
)
from app.telegram.tools import send_message

# Barriers, every one of them: the tool calls of one model response run as
# concurrent tasks, and every tool the tutor has drives the run's single
# AsyncSession, which is not safe to use from two coroutines at once — the
# second one to touch it raises "another operation is in progress" and takes
# the whole run down with it. Two `search_content` calls in one response is the
# most ordinary thing a tutor does, so the overlap is not a corner case. Tools
# registered by `app/harness/tools.py` say the same thing at their decorator.
_BARRIERS = (
    create_reminder,
    list_reminders,
    cancel_reminder,
    mute_proactive,
    unmute_proactive,
    send_message,
    read_memory,
    save_memory,
    delete_memory,
    report_review_outcome,
)

tutor = Agent(
    name="tutor",
    deps_type=HarnessDeps,
    tools=[Tool(function, sequential=True) for function in _BARRIERS],
)


def chat_model(openrouter_id: str) -> ChatModel:
    # A chat outlives the pool it chose from: a model dropped from the config
    # falls back to the default instead of failing the run.
    pool = settings.chat_model_pool
    return pool.get(openrouter_id, pool[settings.DEFAULT_CHAT_MODEL])


@lru_cache
def model_for(openrouter_id: str) -> OpenRouterModel:
    return OpenRouterModel(
        chat_model(openrouter_id).openrouter_id,
        provider=OpenRouterProvider(api_key=settings.OPENROUTER_API_KEY),
        # Usage accounting returns what OpenRouter actually billed, which is
        # what the monthly ceiling is counted in.
        settings=OpenRouterModelSettings(openrouter_usage={"include": True}),
    )


def compact_threshold(openrouter_id: str) -> int:
    return min(
        settings.COMPACT_AT_TOKENS,
        chat_model(openrouter_id).context_window - settings.CONTEXT_RESERVE_TOKENS,
    )
