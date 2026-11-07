"""The weekly note: how each course is holding, what is slipping, and one
thing to do next.

A tool of the coach's, not a timer: the state says when one is available and
the run decides whether it is worth sending. Code writes every number and
every title; the model writes only the next step. To a learner who has gone
quiet a report is noise, so none goes out without an answer in two weeks —
they get a card instead.
"""

import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta
from html import escape

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.content.locators import course_of, lesson_url
from app.content.structure import structure
from app.harness.prompts import ContextBlock
from app.harness.repository import HarnessRepository
from app.models import CardDelivery, CoachNote, LessonProgress, ReviewCard, ReviewState
from app.review import cards, subject
from app.review import repository as review
from app.telegram import api, thread
from app.telegram.outbox import Outbox

EVERY = timedelta(days=7)
ANSWERED_WITHIN = timedelta(days=14)
# A ladder this far up has been answered right at a spaced interval at least
# twice: the lesson is holding rather than merely started.
HOLDING_STEP = 2
SLIPPING_SHOWN = 3


@dataclass(frozen=True)
class Report:
    lines: list[str]
    # What the Send it button puts a card on: the lesson slipping most lately.
    card: str | None
    # Where the next step links instead, when nothing is slipping: the lesson
    # read last and left unfinished, and its title.
    link: tuple[str, str] | None


async def unavailable(
    session: AsyncSession, user_id: uuid.UUID, now: datetime
) -> str | None:
    last: datetime | None = await session.scalar(
        select(func.max(CoachNote.sent_at)).where(CoachNote.user_id == user_id)
    )
    if last is not None and now - last < EVERY:
        return f"a weekly note went out {(now - last).days} days ago, one a week"
    answered = await review.last_answer(session, user_id)
    if answered is None or now - answered > ANSWERED_WITHIN:
        return "no card answered in two weeks; a quiet learner gets a card"
    return None


async def _last_answers(session: AsyncSession, user_id: uuid.UUID) -> dict[str, str]:
    rows = await session.execute(
        select(ReviewCard.lesson, CardDelivery.outcome)
        .join(ReviewCard, ReviewCard.id == CardDelivery.card_id)
        .where(
            CardDelivery.user_id == user_id,
            CardDelivery.outcome.in_(review.ANSWERED),
        )
        .order_by(ReviewCard.lesson, CardDelivery.answered_at.desc())
        .distinct(ReviewCard.lesson)
    )
    return {lesson: outcome for lesson, outcome in rows.tuples() if outcome}


async def _unfinished(session: AsyncSession, user_id: uuid.UUID) -> str | None:
    lesson: str | None = await session.scalar(
        select(LessonProgress.lesson)
        .where(LessonProgress.user_id == user_id, LessonProgress.completed_at.is_(None))
        .order_by(LessonProgress.last_seen.desc())
        .limit(1)
    )
    return lesson


async def report(session: AsyncSession, user_id: uuid.UUID) -> Report:
    states = (
        await session.scalars(
            select(ReviewState)
            .where(ReviewState.user_id == user_id)
            .order_by(ReviewState.updated_at.desc())
        )
    ).all()
    last = await _last_answers(session, user_id)
    slipping = [
        state.lesson
        for state in states
        if state.last_outcome == "failed" or last.get(state.lesson) == "wrong"
    ]
    courses: dict[str, list[ReviewState]] = {}
    for state in states:
        courses.setdefault(course_of(state.lesson), []).append(state)
    unfinished = None if slipping else await _unfinished(session, user_id)
    titles = await subject.materials(
        session, [*slipping[:SLIPPING_SHOWN], *filter(None, [unfinished])]
    )
    lines = []
    for slug, ladders in sorted(courses.items()):
        spine = await structure(session, slug)
        holding = sum(
            state.step >= HOLDING_STEP and state.lesson not in slipping
            for state in ladders
        )
        name = spine[0].title if spine else slug
        lines.append(f"{escape(name, quote=False)}: {holding}/{len(ladders)} holding")
    if slipping:
        shown = ", ".join(
            escape(titles[lesson].title, quote=False)
            for lesson in slipping[:SLIPPING_SHOWN]
        )
        lines.append(f"Slipping: {shown}")
    return Report(
        lines=lines,
        card=slipping[0] if slipping else None,
        link=None if unfinished is None else (unfinished, titles[unfinished].title),
    )


def _text(found: Report, next_step: str) -> str:
    step = f"Next: {escape(next_step, quote=False)}"
    if found.link is not None:
        lesson, title = found.link
        step += (
            f' <a href="{escape(lesson_url(lesson))}">{escape(title, quote=False)}</a>'
        )
    return "\n".join([*found.lines, step])


async def block(
    session: AsyncSession, user_id: uuid.UUID, now: datetime
) -> ContextBlock:
    """What the coach is told about the note: whether one may go out, and
    what code would write in it."""
    why = await unavailable(session, user_id, now)
    if why is not None:
        return ContextBlock(title="Weekly note", body=f"Not available: {why}.")
    found = await report(session, user_id)
    if found.card is not None:
        under = f"a Send it button for a card on `{found.card}`"
    elif found.link is not None:
        under = f"a link to `{found.link[0]}`"
    else:
        under = "no button and no link"
    body = "\n".join(
        [
            "Available. Code writes:",
            *found.lines,
            f"then your next step, with {under}.",
        ]
    )
    return ContextBlock(title="Weekly note", body=body)


async def send(
    session: AsyncSession,
    outbox: Outbox,
    user_id: uuid.UUID,
    now: datetime,
    next_step: str,
) -> None:
    """Holding the thread, as a card does, so it does not land in the middle
    of a run. Recorded before it goes out, so no note is sent that the next
    run's limits cannot see; taken back if Telegram refuses it."""
    found = await report(session, user_id)
    note = CoachNote(user_id=user_id, sent_at=now, lesson=found.card)
    session.add(note)
    await session.commit()
    keyboard: api.Keyboard | None = None
    if found.card is not None:
        keyboard = [
            [{"text": "Send it", "callback_data": f"{cards.SEND_IT}:{note.id}"}]
        ]
    repo = HarnessRepository(session, user_id)
    try:
        async with thread.holding(repo, await thread.of(session, user_id)):
            message_id = await outbox.send(_text(found, next_step), keyboard=keyboard)
    except Exception:
        await session.rollback()
        await session.execute(delete(CoachNote).where(CoachNote.id == note.id))
        await session.commit()
        raise
    assert message_id is not None
    note.tg_message_id = message_id
    await session.commit()
