import uuid
from datetime import datetime

from pydantic_ai import RunContext

from app.core.clock import zone
from app.harness.deps import HarnessDeps
from app.scheduling import policy, repository


async def _their_clock(deps: HarnessDeps, moment: datetime) -> datetime:
    # A model that writes `2026-08-07T09:00` means it on the learner's clock,
    # which is the only clock any of these times were spoken in.
    if moment.tzinfo is not None:
        return moment
    user = await deps.repo.user()
    return moment.replace(tzinfo=zone(user.timezone))


async def create_reminder(
    ctx: RunContext[HarnessDeps], due_at: datetime, note: str
) -> str:
    """Have the platform message the learner at a time they asked for.

    Args:
        due_at: when to send it, on the learner's clock.
        note: what to remind them of, in one line, in their own words.
    """
    repo = ctx.deps.repo
    if await repository.thread(repo.session, repo.user_id) is None:
        return (
            "no reminder was set: the learner has no Telegram thread connected, "
            "and that is where the platform sends messages of its own"
        )
    row = await repository.create(
        repo.session,
        user_id=repo.user_id,
        kind="reminder",
        due_at=await _their_clock(ctx.deps, due_at),
        payload={"note": note},
        created_by="user",
    )
    return f"reminder {row.id} is set"


async def list_reminders(ctx: RunContext[HarnessDeps]) -> list[dict[str, str]]:
    """The reminders the learner has waiting, with the id needed to cancel one."""
    repo = ctx.deps.repo
    return [
        {
            "id": str(row.id),
            "due_at": row.due_at.isoformat(),
            "note": row.payload["note"],
        }
        for row in await repository.pending_reminders(repo.session, repo.user_id)
    ]


async def cancel_reminder(ctx: RunContext[HarnessDeps], reminder_id: uuid.UUID) -> str:
    """Drop a reminder the learner no longer wants.

    Args:
        reminder_id: the id `list_reminders` gave for it.
    """
    repo = ctx.deps.repo
    if await repository.cancel(repo.session, repo.user_id, reminder_id):
        return f"reminder {reminder_id} is cancelled"
    return "no reminder of the learner's is waiting under that id"


async def mute_proactive(
    ctx: RunContext[HarnessDeps], until: datetime | None = None
) -> str:
    """Stop the platform from opening the conversation on its own.

    Answers to what the learner writes are unaffected; only messages the
    platform starts are paused.

    Args:
        until: when they may resume, on the learner's clock. Omit it to pause
            them until the learner asks for them back.
    """
    repo = ctx.deps.repo
    resumes = (
        policy.INDEFINITE if until is None else await _their_clock(ctx.deps, until)
    )
    await repository.mute(repo.session, repo.user_id, until=resumes)
    if until is None:
        return "proactive messages are off until the learner turns them back on"
    return f"proactive messages are off until {resumes.isoformat()}"


async def unmute_proactive(ctx: RunContext[HarnessDeps]) -> str:
    """Let the platform open the conversation again."""
    repo = ctx.deps.repo
    await repository.mute(repo.session, repo.user_id, until=None)
    return "proactive messages are on again"
