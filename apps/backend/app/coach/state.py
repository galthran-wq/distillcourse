"""What the coach is told: a summary of where the learner stands, built by
code, in place of the thread.

Replaying the thread — hundreds of cards nobody answered — is what made the
old bot talk about its own queue, and it is the costly part of a run. Each
section here is something a decision about one message turns on, and nothing
else is in the run's context.
"""

from collections import Counter
from collections.abc import Sequence
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.coach import nudges
from app.harness.prompts import ContextBlock, render
from app.harness.title import transcript
from app.memory import repository as memory
from app.models import (
    CardDelivery,
    Chat,
    LessonProgress,
    Message,
    ReviewCard,
    ReviewState,
    Schedule,
    User,
)
from app.review import repository as review
from app.review.tools import NOTE_PREFIX
from app.scheduling import gates, policy
from app.scheduling import repository as scheduling

# The slug prefix of what the learner told the tutor about the bot itself
# ("only mornings"). Carried in full, and binding (`prompts/coach.md`).
BOT_PREFIX = "bot-"
DELIVERIES = 10
# Ladders due, from each end: the lessons finished last and the ones finished
# longest ago. The middle of a long list decides nothing the ends do not.
DUE_ENDS = 10
HOURS_OVER = timedelta(days=30)
READING = 5
MESSAGES = 3
MESSAGES_SOURCE = "learner-messages"


def _day(moment: datetime, hours: policy.Hours) -> str:
    return f"{moment.astimezone(hours.tz):%Y-%m-%d %H:%M}"


async def _waking(
    session: AsyncSession, user: User, row: Schedule, now: datetime, hours: policy.Hours
) -> ContextBlock:
    reason = row.payload.get("reason") or ""
    refused = await gates.refusal(session, user, now)
    lines = [
        f"It is {now.astimezone(hours.tz):%A %Y-%m-%d %H:%M} on the learner's "
        f"clock (`{user.timezone}`); their waking hours are "
        f"{hours.opens:%H:%M}–{hours.closes:%H:%M}.",
        f"The last run's reason: {reason}" if reason else "There was no earlier run.",
        f"What woke this run: {row.payload.get('note', '')}",
        "A card can go out now." if refused is None else refused,
    ]
    return ContextBlock(title="This run", body="\n".join(lines))


async def _silence(session: AsyncSession, user: User, now: datetime) -> ContextBlock:
    last = await scheduling.last_answer(session, user.id)
    count = await scheduling.silence(session, user.id)
    answered = (
        "They have never answered a card or written in the thread."
        if last is None
        else f"Days since they last answered a card or wrote: {(now - last).days}."
    )
    return ContextBlock(
        title="Silence",
        body=f"{answered}\nCards in a row that went unanswered: {count}.",
    )


async def _deliveries(
    session: AsyncSession, user: User, hours: policy.Hours
) -> ContextBlock:
    rows = await session.execute(
        select(CardDelivery, ReviewCard)
        .join(ReviewCard, ReviewCard.id == CardDelivery.card_id)
        .where(CardDelivery.user_id == user.id)
        .order_by(CardDelivery.sent_at.desc())
        .limit(DELIVERIES)
    )
    sent_cards = [
        (
            sent.sent_at,
            f"`{card.lesson}`, {card.kind} level {card.level}: "
            f"{sent.outcome or 'open'}"
            + ("" if sent.initiated else " (they asked for it)"),
        )
        for sent, card in rows.tuples()
    ]
    sent_nudges = [
        (
            row.due_at,
            f"`{nudges.locator(row.payload['lesson'], row.payload['anchor'])}`, "
            f"{row.payload['nudge']} nudge",
        )
        for row in await session.scalars(
            select(Schedule)
            .where(Schedule.user_id == user.id, Schedule.kind == nudges.KIND)
            .order_by(Schedule.due_at.desc())
            .limit(DELIVERIES)
        )
    ]
    newest = sorted([*sent_cards, *sent_nudges], reverse=True)[:DELIVERIES]
    lines = [f"- {_day(moment, hours)} {line}" for moment, line in newest]
    return ContextBlock(
        title="The last cards and nudges sent, newest first",
        body="\n".join(lines) or "None yet.",
    )


async def _answer_hours(
    session: AsyncSession, user: User, now: datetime, hours: policy.Hours
) -> ContextBlock:
    since = now - HOURS_OVER
    taps = await session.scalars(
        select(CardDelivery.answered_at).where(
            CardDelivery.user_id == user.id,
            CardDelivery.outcome.in_(("correct", "wrong")),
            CardDelivery.answered_at >= since,
        )
    )
    messages = await session.scalars(
        select(Message.created_at)
        .join(Chat, Chat.id == Message.chat_id)
        .where(
            Chat.user_id == user.id,
            Chat.kind == "telegram",
            Message.role == "user",
            Message.created_at >= since,
        )
    )
    by_hour = Counter(
        moment.astimezone(hours.tz).hour
        for moment in [*taps, *messages]
        if moment is not None
    )
    body = ", ".join(f"{hour:02}:00 {count}" for hour, count in sorted(by_hour.items()))
    return ContextBlock(
        title="Taps and messages by hour of day, last 30 days, their clock",
        body=body or "None.",
    )


def _ends(states: Sequence[ReviewState]) -> Sequence[ReviewState]:
    if len(states) <= 2 * DUE_ENDS:
        return states
    return [*states[:DUE_ENDS], *states[-DUE_ENDS:]]


async def _due(
    session: AsyncSession, user: User, now: datetime, hours: policy.Hours
) -> ContextBlock:
    """The ladders `send_card` would take: one carded within the rest is left
    out, as the floor and the Next button leave it out."""
    states = await review.due(session, user.id, now, recent_first=True)
    lines = [
        f"- `{state.lesson}`: step {state.step}, level {state.level}, last "
        f"{state.last_outcome or 'not asked yet'}, due since "
        f"{_day(state.next_due_at, hours)}"
        for state in _ends(states)
        if state.next_due_at is not None
    ]
    return ContextBlock(
        title=f"Review ladders due ({len(states)}), the lesson finished last first",
        body="\n".join(lines) or "None.",
    )


async def _memories(session: AsyncSession, user: User) -> list[ContextBlock]:
    rows = await memory.index(session, user.id)
    notes = [
        f"- `{row.slug}`: {row.description}"
        for row in rows
        if row.slug.startswith(NOTE_PREFIX)
    ]
    instructions = [
        f"- `{row.slug}`: {row.content}"
        for row in rows
        if row.slug.startswith(BOT_PREFIX)
    ]
    blocks = []
    if notes:
        blocks.append(ContextBlock(title="Review notes", body="\n".join(notes)))
    if instructions:
        blocks.append(
            ContextBlock(
                title="What the learner told the bot", body="\n".join(instructions)
            )
        )
    return blocks


def _left(row: LessonProgress) -> str:
    if row.completed_at is not None:
        return "finished"
    if row.last_anchor is None:
        return "unfinished"
    return f"unfinished, stopped at `{row.last_anchor}`"


async def _reading(
    session: AsyncSession, user: User, hours: policy.Hours
) -> ContextBlock:
    rows = await session.scalars(
        select(LessonProgress)
        .where(LessonProgress.user_id == user.id)
        .order_by(LessonProgress.last_seen.desc())
        .limit(READING)
    )
    lines = [
        f"- `{row.lesson}`: {row.max_scroll_pct}% scrolled, last read "
        f"{_day(row.last_seen, hours)}, " + _left(row)
        for row in rows
    ]
    return ContextBlock(
        title="Lessons read last", body="\n".join(lines) or "None opened yet."
    )


async def _messages(session: AsyncSession, user: User) -> ContextBlock | None:
    """For the language and the tone of what the bot sends, not the content."""
    rows = (
        await session.scalars(
            select(Message)
            .join(Chat, Chat.id == Message.chat_id)
            .where(
                Chat.user_id == user.id,
                Chat.kind == "telegram",
                Message.role == "user",
            )
            .order_by(Message.created_at.desc())
            .limit(MESSAGES)
        )
    ).all()
    if not rows:
        return None
    return ContextBlock(
        title="Their last messages in the thread",
        body=transcript(rows[::-1]),
        untrusted_source=MESSAGES_SOURCE,
    )


async def block(session: AsyncSession, user: User, row: Schedule, now: datetime) -> str:
    hours = policy.Hours.of(user)
    blocks = [
        await _waking(session, user, row, now, hours),
        await _silence(session, user, now),
        await _deliveries(session, user, hours),
        await _answer_hours(session, user, now, hours),
        await _due(session, user, now, hours),
        *await _memories(session, user),
        await _reading(session, user, hours),
        await _messages(session, user),
    ]
    return "\n\n".join(render(block) for block in blocks if block is not None)
