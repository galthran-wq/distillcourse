"""The weekly floor: the bot does not get to give up on a learner.

When a week has passed with nothing sent on the platform's own account — no
card, reading nudge or weekly note — and a run ends silent, code sends a card
anyway, chosen with no model: the lesson finished most recently whose ladder
is due and had no card in the last three days, at its level, with a card this
learner has not seen in two weeks. The limits the coach is held to hold here
too.

A reminder is the learner's appointment and a card they asked for is their
move, so neither pays the floor nor spends the day's message
(`scheduling.repository.last_initiation`).
"""

from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.harness import runner
from app.models import CardDelivery, TgLink, User
from app.review import cards
from app.review import repository as review
from app.scheduling import gates
from app.scheduling import repository as scheduling
from app.telegram.outbox import Outbox

FLOOR = timedelta(days=7)


async def owed(session: AsyncSession, link: TgLink, now: datetime) -> bool:
    """A week without anything the platform sent on its own account,
    counted from pairing for a learner who has had none."""
    last = await scheduling.last_initiation(session, link.user_id)
    return now - (last or link.created_at) >= FLOOR


async def send(
    session: AsyncSession, outbox: Outbox, user: User, now: datetime
) -> CardDelivery | None:
    if await gates.refusal(session, user, now) is not None:
        return None
    for state in await review.due(session, user.id, now, recent_first=True):
        try:
            sent = await cards.offer(session, outbox, state, None, now)
        except runner.RunBusy:
            # The learner is in a conversation: the floor is owed still, and
            # the next run's silence pays it.
            return None
        if sent is not None:
            return sent
        # No card survived the check: put off on its ladder, so the writer
        # is not paid again for this lesson every run until one does.
        await review.postpone(session, user.id, state.lesson, now)
        await session.commit()
    return None
