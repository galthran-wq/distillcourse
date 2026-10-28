"""The short code review under every `distill.check` verdict.

One toolless model call, the way `judge.py` is one: everything the review
needs is handed in — the checkpoint, the verdict, the output it expects, the
reference solution and the learner's function — so there is no tool loop to
wait on and nothing the call could act on. What it borrows from the harness is
the lab chat it is written into, so `distill.ask` continues from it and the
site shows it, and the claim on that chat, so a review and a question never
write into it at once.

The review comes after the verdict and never touches it: the submission is
read, not written, and a review that fails stores nothing.
"""

import asyncio
import json
import uuid
from collections.abc import AsyncGenerator
from typing import Any

import logfire
from pydantic import BaseModel
from pydantic_ai import Agent
from pydantic_ai.messages import ModelRequest, ModelResponse, TextPart, UserPromptPart
from pydantic_ai.usage import RunUsage
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.config import settings
from app.harness import runner
from app.harness.agent import model_for
from app.harness.limits import check_cost_ceiling
from app.harness.prompts import learner_attachment, module, untrusted
from app.harness.repository import HarnessRepository
from app.harness.usage import usage_row
from app.labs import repository
from app.labs.chat import url
from app.labs.schemas import DoneEvent, ErrorEvent, TextEvent
from app.models import Chat, LabChallenge, LabSolution, LabSubmission

SOURCE = "lab-submission"
# A few sentences. Past this the model is not coming back with them, and the
# lab chat is claimed for as long as it is out.
TIMEOUT_SECONDS = 60

# Toolless and deps-less for `judge.agent`'s reason: the learner's code is in
# the prompt, and an agent that could reach a tool could be talked by it into
# acting on their data.
agent = Agent(name="lab-check-review")


class NotFound(Exception):
    """No submission of the caller's in this lab has that id."""


class Unreviewable(Exception):
    """A submission with no function to read: another kind of checkpoint, or a
    source the notebook could not read."""


def _line(event: BaseModel) -> str:
    return f"data: {event.model_dump_json()}\n\n"


async def start(
    *,
    session_factory: async_sessionmaker[AsyncSession],
    repo: HarnessRepository,
    lesson: str,
    submission_id: uuid.UUID,
) -> AsyncGenerator[str]:
    """Claim the lab chat and start the review; hand back its event stream.

    Everything that can refuse happens here, before the response starts — an
    unknown submission, a spent budget, a chat with a run in flight — so the
    client is told why in a status code rather than in the stream.
    """
    session = repo.session
    submitted = await session.get(LabSubmission, submission_id)
    if (
        submitted is None
        or submitted.user_id != repo.user_id
        or submitted.lesson != lesson
    ):
        raise NotFound("no submission of yours in this lab has that id")
    challenge = await session.get(LabChallenge, (lesson, submitted.checkpoint))
    if submitted.source is None or challenge is None or challenge.kind != "exact":
        raise Unreviewable("that submission has no function to review")
    question = await _question(session, submitted, challenge)
    await check_cost_ceiling(session)
    chat = await repo.lab_chat(lesson)
    run_id = uuid.uuid4()
    if not await repo.claim_run(chat, run_id):
        raise runner.RunBusy
    queue: asyncio.Queue[str | None] = asyncio.Queue()
    runner.detach(
        _review(
            session_factory=session_factory,
            user_id=repo.user_id,
            chat_id=chat.id,
            run_id=run_id,
            check=_check(submitted),
            question=question,
            queue=queue,
        )
    )
    return runner.relay(queue)


def _passed(submitted: LabSubmission) -> bool:
    return bool(submitted.verdict.get("passed"))


def _check(submitted: LabSubmission) -> str:
    """The learner's turn, as the lab chat stores it: what was checked and how
    it went, then the function, fenced as the notebook's attachments are."""
    assert submitted.source is not None
    outcome = "passed" if _passed(submitted) else "failed"
    return (
        f"check {submitted.checkpoint}: {outcome}\n\n"
        f"{learner_attachment(submitted.checkpoint, 'function', submitted.source)}"
    )


def _block(title: str, value: Any) -> str:
    return f"## {title}\n\n```json\n{json.dumps(value, indent=2)}\n```"


async def _question(
    session: AsyncSession, submitted: LabSubmission, challenge: LabChallenge
) -> str:
    assert submitted.source is not None
    declared = await repository.lab(session, submitted.lesson)
    order = declared.checkpoints if declared else []
    ids = [entry.id for entry in order]
    position = ids.index(submitted.checkpoint) if submitted.checkpoint in ids else -1
    wording = order[position].text if position >= 0 else "(not in the index)"
    following = order[position + 1] if 0 <= position < len(order) - 1 else None
    solution = await session.get(LabSolution, submitted.lesson)
    hint = submitted.verdict.get("hint")
    verdict = "passed" if _passed(submitted) else "failed"
    if hint:
        verdict += (
            f" — their output matches a known wrong answer, whose hint is: {hint}"
        )
    parts = [
        f"## The checkpoint `{submitted.checkpoint}`\n\n{wording}",
        _block("Its inputs", challenge.spec["public"]),
        _block("The output it expects", challenge.spec["private"]["expected"]),
        f"## The verdict\n\n{verdict}",
        "## The next checkpoint\n\n"
        + (
            f"`{following.id}`: {following.text}"
            if following
            else "none: this is the last"
        ),
        "## The reference solution\n\n"
        + (
            f"```python\n{solution.source}\n```"
            if solution is not None
            else "(none stored for this lab)"
        ),
        f"## The learner's function\n\n{untrusted(SOURCE, submitted.source)}",
    ]
    return "\n\n".join(parts)


async def _review(
    *,
    session_factory: async_sessionmaker[AsyncSession],
    user_id: uuid.UUID,
    chat_id: uuid.UUID,
    run_id: uuid.UUID,
    check: str,
    question: str,
    queue: asyncio.Queue[str | None],
) -> None:
    async with session_factory() as session:
        repo = HarnessRepository(session, user_id)
        chat: Chat | None = None
        try:
            chat = await repo.get_chat(chat_id)
            assert chat is not None
            usage = RunUsage()
            text: list[str] = []
            async with asyncio.timeout(TIMEOUT_SECONDS):
                async with agent.run_stream(
                    question,
                    model=model_for(settings.LAB_REVIEW_MODEL),
                    instructions=module("lab_check_review.md"),
                    usage=usage,
                ) as streamed:
                    async for delta in streamed.stream_text(delta=True):
                        text.append(delta)
                        queue.put_nowait(_line(TextEvent(delta=delta)))
            # Stored only once whole: a review that broke off is not one, and
            # the learner's next question must not continue from half of it.
            await repo.add_messages(
                chat,
                [ModelRequest(parts=[UserPromptPart(content=check)])],
                role="user",
                run_id=run_id,
            )
            await repo.add_messages(
                chat,
                [ModelResponse(parts=[TextPart(content="".join(text))])],
                role="agent",
                run_id=run_id,
                usage=usage_row(usage),
            )
            if chat.title is None:
                await repo.set_title(chat, check.partition("\n")[0])
            queue.put_nowait(_line(DoneEvent(chat_id=chat.id, url=url(chat))))
        except Exception as exc:
            # The verdict is printed and stored already; whatever went wrong
            # here — the model, the budget, the database — costs the learner
            # only the review.
            logfire.exception("a check review failed", run_id=str(run_id))
            queue.put_nowait(_line(ErrorEvent(detail=str(exc) or type(exc).__name__)))
        finally:
            if chat is not None:
                await runner.guarded(
                    repo.release_run(chat, run_id),
                    "releasing run {run_id} failed",
                    run_id,
                )
            queue.put_nowait(None)
