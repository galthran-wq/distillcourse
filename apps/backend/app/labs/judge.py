"""What a `review` checkpoint is worth.

The one kind no comparison can answer: a few sentences the learner wrote,
against a rubric the author kept private. One model call decides it — no
tools, no history, nothing about the learner — and its answer is the verdict
the submission is stored with.

Lenient by design, which `lab_review.md` is where it is said: the feedback is
what the checkpoint is for, and a `review` checkpoint gates nothing unless an
author marked it required. What cannot be judged — an outage, a spent budget,
output that will not validate — leaves the submission pending rather than
failing a learner for it.
"""

from typing import Any

import logfire
from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.usage import RunUsage
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.harness.agent import model_for
from app.harness.limits import check_cost_ceiling
from app.harness.prompts import module, untrusted
from app.harness.usage import usage_row
from app.labs import verify

MAX_REVIEW_CHARS = 4000
FEEDBACK_CHARS = 400
ANSWER_SOURCE = "lab-submission"

PENDING = verify.Verdict(
    passed=None,
    pending=True,
    hint="Judging is unavailable. Your answer is recorded; submit it again to have it graded.",
)

# Toolless and deps-less for the reason `namer` is: this is one question about
# one paragraph, and an agent that could reach a tool could act on the
# learner's data while answering it. Declared here rather than beside the
# tutor's because what it grades is a lab's business; what it takes from the
# harness is the plumbing — the model, the budget, the usage row.
agent = Agent(name="lab-judge")


class Judgement(BaseModel):
    """The judge's whole output, validated rather than read out of prose. A
    run that will not produce it earns `PENDING` instead."""

    passed: bool
    feedback: str = Field(max_length=FEEDBACK_CHARS)


async def grade(
    session: AsyncSession, spec: dict[str, Any], payload: Any
) -> tuple[verify.Verdict, dict[str, Any] | None]:
    """The verdict for one posted answer, and what asking for it cost.

    The cost is handed back rather than recorded here: a judged submission is
    the only checkpoint that spends the deployment's model budget, and the
    ceiling that budget is counted against sums the rows the caller stores it
    on.
    """
    answer = _answer(payload)
    # The run counts into this rather than reporting at the end, so a judgement
    # that never arrives is still charged for the calls it made — which is what
    # keeps a flapping judge visible to the ceiling above.
    usage = RunUsage()
    try:
        await check_cost_ceiling(session)
        judged = await agent.run(
            _question(spec["rubric"], answer),
            model=model_for(settings.DEFAULT_CHAT_MODEL),
            instructions=module("lab_review.md"),
            output_type=Judgement,
            usage=usage,
            # One retry of output that will not validate, then
            # UnexpectedModelBehavior and the pending below.
            retries=1,
        )
    except Exception:
        # Whatever went wrong: the model, the monthly ceiling, an output that
        # would not validate twice running. None of it is the learner's doing
        # and none of it is a reason to fail their answer.
        logfire.exception("a lab review submission was left pending")
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
