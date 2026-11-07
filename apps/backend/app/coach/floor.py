"""The weekly floor: the bot does not get to give up on a learner.

When a week has passed with nothing sent on the platform's own account and a
run ends silent, code sends a card anyway, chosen with no model: the lesson
finished most recently whose ladder is due and had no card in the last three
days, at its level, with a card this learner has not seen in two weeks. The
limits the coach is held to hold here too.
"""

from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.harness import runner
from app.models import CardDelivery, TgLink, User
from app.review import cards
from app.review import repository as review
from app.scheduling import gates
from app.telegram.outbox import Outbox

FLOOR = timedelta(days=7)


async def owed(session: AsyncSession, link: TgLink, now: datetime) -> bool:
    """A week without a card the platform sent, counted from pairing for a
    learner who has had none."""
    last: datetime | None = await session.scalar(
        select(func.max(CardDelivery.sent_at)).where(
            CardDelivery.user_id == link.user_id, CardDelivery.initiated
        )
    )
    return now - (last or link.created_at) >= FLOOR


async def send(
    session: AsyncSession, outbox: Outbox, user: User, now: datetime
) -> CardDelivery | None:
    if await gates.refusal(session, user, now) is not None:
        return None
    easy = await review.level_one_only(session, user.id, now)
    for state in await review.due(session, user.id, now, recent_first=True):
        try:
            sent = await cards.offer(
                session, outbox, user.id, state.lesson, 1 if easy else state.level
            )
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
