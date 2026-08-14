"""What a `review` checkpoint is worth.

The one kind no comparison can answer: a few sentences the learner wrote,
against a rubric the author kept private. One model call decides it — no
tools, no history, nothing about the learner — and its answer is the verdict
the submission is stored with.

Lenient by design, stated in `lab_review.md`: the feedback is what the
checkpoint is for, and a `review` checkpoint gates nothing unless an author
marked it required. What cannot be judged — an outage, a spent budget, output
that will not validate — leaves the submission pending rather than failing a
learner for it.
"""

import asyncio
from typing import Annotated, Any

import logfire
from pydantic import AfterValidator, BaseModel
from pydantic_ai import Agent
from pydantic_ai.usage import RunUsage
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.harness.agent import model_for
from app.harness.limits import LimitExceeded, check_cost_ceiling
from app.harness.prompts import module, untrusted
from app.harness.usage import usage_row
from app.labs import verify
from app.labs.schemas import Submission

MAX_REVIEW_CHARS = 4000
FEEDBACK_CHARS = 400
# One question about one paragraph, retry included. Past this the judging is
# not coming, and the request it is holding open is worth more than the answer.
TIMEOUT_SECONDS = 60
ANSWER_SOURCE = "lab-submission"

# Nothing stores the text of an answer, so this promises only what is true: the
# attempt was logged, the answer was not.
PENDING = verify.Verdict(
    passed=None,
    pending=True,
    hint="Judging is unavailable right now. Post your answer again in a few minutes.",
)

# Toolless and deps-less for the reason `namer` is: this is one question about
# one paragraph, and an agent that could reach a tool could act on the
# learner's data while answering it. Declared here rather than beside the
# tutor's because what it grades is a lab's business; what it takes from the
# harness is the plumbing — the model, the budget, the usage row.
agent = Agent(name="lab-judge")


class Judgement(BaseModel):
    passed: bool
    # Clamped rather than refused: the likeliest slip is a sentence a few
    # characters over, and a checkpoint whose whole value is its feedback must
    # not lose it to a retry that then runs out.
    feedback: Annotated[str, AfterValidator(lambda text: text[:FEEDBACK_CHARS])]


async def grade(
    session: AsyncSession, spec: dict[str, Any], posted: Submission
) -> tuple[verify.Verdict, dict[str, Any] | None]:
    """The verdict for one posted answer, and what asking for it cost.

    Commits before it calls, and returns with no transaction open: the ceiling
    below is the last thing the judging needs the database for, and nothing
    that waits on a model may hold a pooled connection — or the caller's lock —
    while it does. The caller takes both back for the writing half.

    The cost is handed back rather than recorded here: a judged submission is
    the only checkpoint that spends the deployment's model budget, and the
    ceiling that budget is counted against sums the rows the caller stores it
    on.
    """
    # Both outside the try below: a payload the checkpoint cannot take is the
    # learner's to fix, and a spec with no rubric is a defect in the answer key.
    # Neither is the outage a pending verdict reports.
    question = _question(spec["rubric"], _answer(posted.payload))
    try:
        await check_cost_ceiling(session)
    except LimitExceeded:
        logfire.exception(
            "a lab review was left pending: the monthly ceiling is spent",
            lesson=posted.lesson,
            checkpoint=posted.checkpoint,
        )
        return PENDING, None
    await session.commit()
    # The run counts into this rather than reporting at the end, so a judgement
    # that never arrives is still charged for the calls it made — which is what
    # keeps a flapping judge visible to the ceiling above.
    usage = RunUsage()
    try:
        async with asyncio.timeout(TIMEOUT_SECONDS):
            judged = await agent.run(
                question,
                model=model_for(settings.DEFAULT_CHAT_MODEL),
                instructions=module("lab_review.md"),
                output_type=Judgement,
                usage=usage,
                retries=1,
            )
    except Exception:
        # Whatever the model did: refused the connection, never came back, or
        # answered twice running in a shape that will not validate. None of it
        # is the learner's doing and none of it is a reason to fail their answer.
        logfire.exception(
            "a lab review was left pending: the judge did not answer",
            lesson=posted.lesson,
            checkpoint=posted.checkpoint,
        )
        return PENDING, usage_row(usage) if usage.requests else None
    return (
        verify.Verdict(passed=judged.output.passed, hint=judged.output.feedback),
        usage_row(usage),
    )


def _answer(payload: Any) -> str:
    if not isinstance(payload, str) or not payload.strip():
        raise verify.Rejected("a review checkpoint takes the text of your answer")
    if len(payload) > MAX_REVIEW_CHARS:
        raise verify.Rejected(f"an answer is at most {MAX_REVIEW_CHARS} characters")
    return payload


def _question(rubric: str, answer: str) -> str:
    """The rubric plainly, the answer fenced. The rubric is the platform's own
    words; the answer is the one thing here written by someone with a reason to
    talk the judge into a pass."""
    return (
        f"## Rubric\n\n{rubric}\n\n## The answer\n\n{untrusted(ANSWER_SOURCE, answer)}"
    )
