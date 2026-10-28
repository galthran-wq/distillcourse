"""A question asked from the notebook, run on the tutor harness.

The run is the web chat's own (`runner.start_stream`): the same claim, limits,
storage and naming, in a chat of kind `lab`. What is the notebook's is only at
the two ends — the question arrives as text and attachments rather than as a
Vercel AI request, and the answer leaves as four small events rather than as
that protocol's stream, which a client limited to httpx + numpy has no use for.
"""

import uuid
from collections.abc import AsyncGenerator, AsyncIterator, Callable, Sequence
from typing import Any

from pydantic import BaseModel
from pydantic_ai.ui.vercel_ai import VercelAIAdapter
from pydantic_ai.ui.vercel_ai.request_types import SubmitMessage, TextUIPart, UIMessage
from pydantic_ai.ui.vercel_ai.response_types import (
    BaseChunk,
    ErrorChunk,
    TextDeltaChunk,
    ToolInputAvailableChunk,
)

from app.core.config import settings
from app.harness import prompts
from app.harness.agent import tutor
from app.harness.deps import HarnessDeps
from app.labs.schemas import (
    Attachment,
    DoneEvent,
    ErrorEvent,
    StepEvent,
    TextEvent,
)
from app.models import Chat


def url(chat: Chat) -> str:
    """The chat on the site: the lab's lesson page, which opens the chat it is
    named by."""
    assert chat.lab_lesson is not None
    course, _, lesson = chat.lab_lesson.removeprefix("lesson:").partition("/")
    return f"{settings.FRONTEND_HOST}/courses/{course}/lessons/{lesson}?chat={chat.id}"


def question(text: str) -> VercelAIAdapter[HarnessDeps, str]:
    """The question as the run takes it: a one-message request, the shape the
    web panel posts, so the stream path is the web chat's own."""
    return VercelAIAdapter[HarnessDeps, str](
        agent=tutor,
        run_input=SubmitMessage(
            id=str(uuid.uuid4()),
            messages=[
                UIMessage(
                    id=str(uuid.uuid4()),
                    role="user",
                    parts=[TextUIPart(text=text)],
                )
            ],
        ),
    )


def attached(attachments: Sequence[Attachment]) -> str | None:
    """Every attachment, fenced, for the top of the learner's message — stored
    with it, so the site shows the chat the notebook had."""
    if not attachments:
        return None
    return "\n\n".join(
        prompts.learner_attachment(item.name, item.kind, item.text)
        for item in attachments
    )


def _place(locator: Any) -> str:
    """What a locator is called in a line of steps: its last segment."""
    path = str(locator).partition("#")[0]
    return path.rpartition("/")[2] or path


_STEPS: dict[str, Callable[[dict[str, Any]], str]] = {
    "search_content": lambda args: f"searching the course for {args.get('query')}",
    "fetch_content": lambda args: f"reading {_place(args.get('locator'))}",
    "get_course_structure": lambda _: "reading the course outline",
    "get_user_progress": lambda _: "checking what you have read",
    "web_search": lambda args: f"searching the web for {args.get('query')}",
    "get_lab_progress": lambda _: "checking your progress",
    "get_checkpoint": lambda args: f"checking {args.get('checkpoint')}",
    "get_reference_solution": lambda _: "reading the reference solution",
}


def _step(chunk: ToolInputAvailableChunk) -> StepEvent:
    args = chunk.input if isinstance(chunk.input, dict) else {}
    label = _STEPS.get(chunk.tool_name)
    return StepEvent(label=label(args) if label else chunk.tool_name.replace("_", " "))


def line(event: BaseModel) -> str:
    """One event of an answer, as the notebook reads it off the stream."""
    return f"data: {event.model_dump_json()}\n\n"


async def events(
    chunks: AsyncIterator[BaseChunk],
    chat: Chat,
    attachments: Sequence[Attachment],
) -> AsyncGenerator[str]:
    """The run's stream as the notebook reads it, ending in exactly one `done`
    or one `error`."""
    if attachments:
        names = ", ".join(attachment.name for attachment in attachments)
        yield line(StepEvent(label=f"reading your {names}"))
    async for chunk in chunks:
        if isinstance(chunk, TextDeltaChunk):
            yield line(TextEvent(delta=chunk.delta))
        elif isinstance(chunk, ToolInputAvailableChunk):
            yield line(_step(chunk))
        elif isinstance(chunk, ErrorChunk):
            yield line(ErrorEvent(detail=chunk.error_text))
            return
    yield line(DoneEvent(chat_id=chat.id, url=url(chat)))
