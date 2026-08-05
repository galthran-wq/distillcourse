from collections.abc import Sequence
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from app.models import Schedule

# Quiet hours, on the learner's own clock. The window is also the clock the
# slot timeout runs on, so a message sent late in the evening is not counted
# as ignored while they sleep.
WINDOW_OPEN = time(9)
WINDOW_CLOSE = time(22)
SLOT_TIMEOUT = timedelta(hours=4)
# Per user per day: how many times the platform may open the conversation, and
# how many items one of those messages may carry.
DAILY_INITIATIONS = 3
SESSION_ITEMS = 3
MAX_ATTEMPTS = 3
RETRY_DELAY = timedelta(minutes=5)
# A mute with no end date. Keeping it a distant moment rather than a second
# column means one nullable timestamp answers "is this user muted".
INDEFINITE = datetime(9999, 12, 31, tzinfo=UTC)


def _open_at(day: date, tz: ZoneInfo) -> datetime:
    return datetime.combine(day, WINDOW_OPEN, tz)


def _close_at(day: date, tz: ZoneInfo) -> datetime:
    return datetime.combine(day, WINDOW_CLOSE, tz)


def in_window(moment: datetime, tz: ZoneInfo) -> bool:
    return WINDOW_OPEN <= moment.astimezone(tz).time() < WINDOW_CLOSE


def next_open(moment: datetime, tz: ZoneInfo) -> datetime:
    """The first moment from `moment` on at which the window is open."""
    local = moment.astimezone(tz)
    if local.time() < WINDOW_OPEN:
        return _open_at(local.date(), tz)
    if local.time() >= WINDOW_CLOSE:
        return _open_at(local.date() + timedelta(days=1), tz)
    return moment


def tomorrow_open(moment: datetime, tz: ZoneInfo) -> datetime:
    """When work that has no room left today is offered again."""
    return _open_at(moment.astimezone(tz).date() + timedelta(days=1), tz)


def day_start(moment: datetime, tz: ZoneInfo) -> datetime:
    """Local midnight — the daily budget is spent on the learner's calendar."""
    return datetime.combine(moment.astimezone(tz).date(), time(), tz)


def slot_deadline(sent_at: datetime, tz: ZoneInfo) -> datetime:
    """When an unanswered message counts as ignored: `SLOT_TIMEOUT` of waking
    hours after it was sent, carried over the night if it runs out of day."""
    remaining = SLOT_TIMEOUT
    cursor = next_open(sent_at, tz)
    while True:
        closes = _close_at(cursor.astimezone(tz).date(), tz)
        if closes - cursor >= remaining:
            return cursor + remaining
        remaining -= closes - cursor
        cursor = next_open(closes, tz)


def retry_at(moment: datetime, attempts: int) -> datetime:
    doubling: int = 2 ** (attempts - 1)
    return moment + RETRY_DELAY * doubling


def topic(row: Schedule) -> str | None:
    subject = row.payload.get("topic")
    return subject if isinstance(subject, str) else None


def session_items(
    due: Sequence[Schedule], *, avoid: str | None
) -> tuple[list[Schedule], list[Schedule]]:
    """Split what is due into the one message that goes out now and the rest.

    Reminders lead: the learner asked for those by name and by time. After an
    ignored message, whatever shares its topic goes to the back.
    """
    ordered = sorted(
        due,
        key=lambda row: (
            row.kind != "reminder",
            avoid is not None and topic(row) == avoid,
            row.due_at,
        ),
    )
    return ordered[:SESSION_ITEMS], ordered[SESSION_ITEMS:]
