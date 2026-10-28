"""What the tutor can read about the lab a lab chat belongs to.

A toolset of its own rather than tools on the agent: it is handed to a run
only when the chat is a lab's (`app/harness/runner.py`), so a web or Telegram
conversation never sees a lab it is not in. Every tool reads the lab off the
chat, never off an argument, and the learner off the repository — there is no
other lab or learner to name.

Nothing here is withheld from the learner: the platform is self-taught and the
repository is public, so the reference solution and the expected outputs are
material the tutor may quote. How much of it to show is the lab prompt's
business (`lab.md`), not the toolset's.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel
from pydantic_ai import FunctionToolset, RunContext, ToolFailed

from app.harness.deps import HarnessDeps
from app.harness.prompts import ContextBlock, module
from app.labs import repository
from app.models import Chat, LabChallenge, LabSolution


class CheckpointStanding(BaseModel):
    id: str
    kind: str
    required: bool
    passed: bool
    attempts: int
    # What the last attempt was told, and when it was made: the hint names the
    # wrong answer the learner most recently produced.
    last_hint: str | None
    last_submitted_at: datetime | None


class CheckpointKey(BaseModel):
    """One checkpoint as the grader sees it, minus the held-out labels: a
    metric checkpoint's labels are thousands of numbers no answer is made
    better by reading."""

    id: str
    kind: str
    text: str
    required: bool
    # The half the notebook computes from: the seed and inputs code of an
    # `exact` checkpoint, the metric and threshold of a `metric` one.
    spec: dict[str, Any]
    # The hint each known wrong answer of an `exact` checkpoint earns.
    hints: list[str]
    # The canonical form a passing `exact` answer must match: its values, or
    # the digest of an output too large to store.
    expected: Any
    reference_score: float | None
    rubric: str | None


toolset = FunctionToolset[HarnessDeps]()


def _lesson(ctx: RunContext[HarnessDeps]) -> str:
    lesson = ctx.deps.chat.lab_lesson
    if lesson is None:
        # The toolset is only handed to lab chats; reaching this is a wiring
        # defect, reported to the model rather than taking the run down.
        raise ToolFailed("this chat is not a lab's")
    return lesson


@toolset.tool(sequential=True)
async def get_lab_progress(ctx: RunContext[HarnessDeps]) -> list[CheckpointStanding]:
    """Where the learner stands on each checkpoint of this lab, in the order the
    lab asks for them: passed or not, how many attempts, and the hint and time
    of the last one."""
    repo, lesson = ctx.deps.repo, _lesson(ctx)
    declared = await repository.lab(repo.session, lesson)
    # The page's own reading of the learner's standing, so the tutor and the
    # checklist beside it cannot disagree about what has passed.
    standing = await repository.standing(repo.session, repo.user_id, lesson)
    if declared is None or standing is None:
        raise ToolFailed("this lab is not in the index")
    last = await repository.last_submitted(repo.session, repo.user_id, lesson)
    return [
        CheckpointStanding(
            id=entry.id,
            kind=entry.kind,
            required=entry.required,
            passed=state.passed_at is not None,
            attempts=state.attempts,
            last_hint=state.feedback,
            last_submitted_at=last.get(entry.id),
        )
        for entry, state in zip(declared.checkpoints, standing.checkpoints, strict=True)
    ]


@toolset.tool(sequential=True)
async def get_checkpoint(
    ctx: RunContext[HarnessDeps], checkpoint: str
) -> CheckpointKey:
    """One checkpoint of this lab: its wording, its inputs, the hints for the
    known wrong answers, and the output it expects.

    Args:
        checkpoint: the checkpoint id, as `get_lab_progress` lists it.
    """
    session, lesson = ctx.deps.repo.session, _lesson(ctx)
    declared = await repository.lab(session, lesson)
    entry = next(
        (
            item
            for item in (declared.checkpoints if declared else [])
            if item.id == checkpoint
        ),
        None,
    )
    challenge = await session.get(LabChallenge, (lesson, checkpoint))
    if entry is None or challenge is None:
        raise ToolFailed(f"this lab has no checkpoint {checkpoint!r}")
    private = challenge.spec["private"]
    return CheckpointKey(
        id=entry.id,
        kind=challenge.kind,
        text=entry.text,
        required=entry.required,
        spec=challenge.spec["public"],
        hints=[variant["hint"] for variant in private.get("wrong", [])],
        expected=private.get("expected"),
        reference_score=private.get("reference_score"),
        rubric=private.get("rubric"),
    )


@toolset.tool(sequential=True)
async def get_reference_solution(ctx: RunContext[HarnessDeps]) -> str:
    """The author's reference solution to this whole lab, `solution.py` as
    written: the code every checkpoint's expected output was captured from."""
    solution = await ctx.deps.repo.session.get(LabSolution, _lesson(ctx))
    if solution is None:
        raise ToolFailed("no reference solution is stored for this lab")
    return solution.source


def briefing(chat: Chat) -> ContextBlock:
    """The lab prompt, handed over as a block of the run's context because it
    is a property of the chat rather than of the medium or the run kind: the
    same lab chat is continued from the notebook and from the site."""
    return ContextBlock(
        title="The lab",
        body=f"{module('lab.md')}\n\nThe lab is `{chat.lab_lesson}`; its brief "
        "is that lesson's text.",
    )
