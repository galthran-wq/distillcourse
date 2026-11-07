"""Whether the platform may open the conversation now. The coach decides what
to say and when; these are the limits it cannot talk its way past.

A refusal is a sentence rather than an exception: it is returned to the model
by the send tools, which reads it and decides again. `/mute` and a broken
channel are not here — `repository.claim_due` holds those learners before
anything runs.
"""

from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User
from app.scheduling import policy, repository


async def refusal(session: AsyncSession, user: User, now: datetime) -> str | None:
    hours = policy.Hours.of(user)
    if not policy.in_window(now, hours):
        return (
            f"Not sent: it is outside the learner's waking hours "
            f"({hours.opens:%H:%M}–{hours.closes:%H:%M})."
        )
    if user.cards_paused_until is not None and now < user.cards_paused_until:
        return (
            "Not sent: the learner pressed Not today; nothing goes out until "
            f"{user.cards_paused_until.astimezone(hours.tz):%Y-%m-%d %H:%M}."
        )
    spent = await repository.initiations_today(
        session, user.id, policy.day_start(now, hours)
    )
    if spent >= policy.DAILY_INITIATIONS:
        return "Not sent: today's message has already gone out."
    silence = await repository.silence(session, user.id)
    wait = policy.silence_wait(silence)
    last = await repository.last_initiation(session, user.id)
    if wait and last is not None and now < last + wait:
        return (
            f"Not sent: {silence} cards in a row went unanswered, so nothing "
            f"goes out before {(last + wait).astimezone(hours.tz):%Y-%m-%d %H:%M}."
        )
    return None
