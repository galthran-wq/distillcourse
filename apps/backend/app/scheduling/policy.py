from collections.abc import Sequence
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from typing import Self
from zoneinfo import ZoneInfo

from app.core.clock import zone
from app.models import Schedule, User

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


@dataclass(frozen=True)
class Hours:
    """The learner's waking day: their clock and the two ends of the window.

    Every decision about *when* is made in these terms, and both ends are the
    learner's to move. The window is also the clock the slot timeout runs on,
    so a message sent late in the evening is not counted as ignored while they
    sleep.
    """

    tz: ZoneInfo
    opens: time
    closes: time

    @classmethod
    def of(cls, user: User) -> Self:
        return cls(zone(user.timezone), user.quiet_start, user.quiet_end)

    def open_at(self, day: date) -> datetime:
        return datetime.combine(day, self.opens, self.tz)

    def close_at(self, day: date) -> datetime:
        return datetime.combine(day, self.closes, self.tz)


def in_window(moment: datetime, hours: Hours) -> bool:
    return hours.opens <= moment.astimezone(hours.tz).time() < hours.closes


def next_open(moment: datetime, hours: Hours) -> datetime:
    """The first moment from `moment` on at which the window is open."""
    local = moment.astimezone(hours.tz)
    if local.time() < hours.opens:
        return hours.open_at(local.date())
    if local.time() >= hours.closes:
        return hours.open_at(local.date() + timedelta(days=1))
    return moment


def tomorrow_open(moment: datetime, hours: Hours) -> datetime:
    """When work that has no room left today is offered again."""
    return hours.open_at(moment.astimezone(hours.tz).date() + timedelta(days=1))


def day_start(moment: datetime, hours: Hours) -> datetime:
    """Local midnight — the daily budget is spent on the learner's calendar."""
    return datetime.combine(moment.astimezone(hours.tz).date(), time(), hours.tz)


def slot_deadline(sent_at: datetime, hours: Hours) -> datetime:
    """When an unanswered message counts as ignored: `SLOT_TIMEOUT` of waking
    hours after it was sent, carried over the night if it runs out of day."""
    remaining = SLOT_TIMEOUT
    cursor = next_open(sent_at, hours)
    while True:
        closes = hours.close_at(cursor.astimezone(hours.tz).date())
        if closes - cursor >= remaining:
            return cursor + remaining
        remaining -= closes - cursor
        cursor = next_open(closes, hours)


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
