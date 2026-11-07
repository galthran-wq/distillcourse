"""Reading nudges: a short message with a link into a lesson, the coach's way
of getting the learner reading again. `resume` sends them back to the section
of a lesson they left unfinished; `hook` puts a puzzle from the opening of one
they have not started.

A nudge is recorded as a `schedules` row of kind `nudge`, born `done`. Its id
is what Quick check instead carries — a lesson locator can outgrow the 64
bytes Telegram allows `callback_data` — and its `due_at` is what the day's
message and the backoff count.
"""

import uuid
from contextlib import suppress
from datetime import UTC, datetime
from html import escape
from typing import TYPE_CHECKING, Final, Literal

from pydantic_ai.messages import ModelResponse, TextPart
from sqlalchemy import select, update

from app.content.locators import lesson_url
from app.core.config import settings
from app.harness.repository import HarnessRepository
from app.models import Schedule, User
from app.review import cards, controls
from app.review import repository as review
from app.scheduling import policy
from app.scheduling import repository as scheduling
from app.telegram import api, thread
from app.telegram.outbox import Outbox

if TYPE_CHECKING:
    from app.telegram.updates import Tap

Kind = Literal["resume", "hook"]
KIND: Final = "nudge"
# The `callback_data` prefix of Quick check instead: `q:<schedule id>`.
QUICK_CHECK = "q"
QUICK = "quick"
# What interrupts the learner is short, or it is not read.
TEXT_CHARS = 300


def locator(lesson: str, anchor: str | None) -> str:
    return lesson if anchor is None else f"{lesson}#{anchor}"


def _keyboard(row: Schedule) -> api.Keyboard:
    """The link, and under a `resume` whose button is unspent, Quick check."""
    payload = row.payload
    link = lesson_url(locator(payload["lesson"], payload["anchor"]))
    resume = payload["nudge"] == "resume"
    keyboard = [[{"text": "Continue" if resume else "Read it", "url": link}]]
    if resume and QUICK not in payload:
        keyboard[0].append(
            {"text": "Quick check instead", "callback_data": f"{QUICK_CHECK}:{row.id}"}
        )
    return keyboard


async def send(
    repo: HarnessRepository,
    outbox: Outbox,
    kind: Kind,
    lesson: str,
    anchor: str | None,
    text: str,
    now: datetime,
) -> None:
    """Send it and record it, holding the thread so it does not land in the
    middle of a run. Written to the thread as the tutor's own message, so a
    reply to it is read with it in view. Raises `runner.RunBusy`."""
    session = repo.session
    row = scheduling.new(
        user_id=repo.user_id,
        kind=KIND,
        due_at=now,
        payload={"nudge": kind, "lesson": lesson, "anchor": anchor},
        created_by="system",
    )
    row.id = uuid.uuid4()
    row.status = "done"
    chat = await thread.of(session, repo.user_id)
    async with thread.holding(repo, chat):
        await outbox.send(escape(text, quote=False), keyboard=_keyboard(row))
    session.add(row)
    await repo.add_messages(
        chat, [ModelResponse(parts=[TextPart(content=text)])], role="agent"
    )


async def _nudge(outbox: Outbox, tap: Tap) -> Schedule | None:
    """The tapped nudge, locked, if it is this learner's and its button is
    unspent."""
    try:
        row_id = uuid.UUID(tap.data.partition(":")[2])
    except ValueError:
        return None
    row = await outbox.session.scalar(
        select(Schedule)
        .where(
            Schedule.id == row_id,
            Schedule.user_id == outbox.link.user_id,
            Schedule.kind == KIND,
        )
        .with_for_update()
    )
    if row is None or row.payload["nudge"] != "resume" or QUICK in row.payload:
        return None
    return row


async def _check(outbox: Outbox, lesson: str) -> None:
    session, user_id = outbox.session, outbox.link.user_id
    user = await session.get(User, user_id)
    assert user is not None
    since = policy.day_start(datetime.now(UTC), policy.Hours.of(user))
    if await review.cards_today(session, user_id, since) >= settings.CARDS_PER_DAY:
        await outbox.send(controls.TODAYS)
        return
    async with thread.typing(outbox.link.tg_chat_id):
        card = await cards.pick(session, user_id, lesson, 1)
    if card is None:
        await outbox.send(controls.NOTHING_ELSE)
        return
    await cards.deliver(session, outbox, user_id, card)


async def quick_check(outbox: Outbox, tap: Tap) -> None:
    """A level 1 card on the nudge's lesson, now, in place of reading. The
    learner asked, so it spends no initiation; the day's cap on cards is what
    bounds it, as it bounds Next. The button is spent before the card is
    looked for and given back if that fails, so the learner can press it
    again."""
    row = await _nudge(outbox, tap)
    if row is None:
        return
    session, row_id = outbox.session, row.id
    row.payload = {**row.payload, QUICK: True}
    await session.commit()
    try:
        await _check(outbox, row.payload["lesson"])
    except Exception:
        await session.rollback()
        await session.execute(
            update(Schedule)
            .where(Schedule.id == row_id)
            .values(payload=Schedule.payload.op("-")(QUICK))
        )
        await session.commit()
        raise
    with suppress(api.TelegramError):
        await outbox.edit_keyboard(tap.message_id, _keyboard(row))
