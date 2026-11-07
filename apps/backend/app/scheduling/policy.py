from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from typing import Self
from zoneinfo import ZoneInfo

from app.core.clock import zone
from app.models import User

# A card nobody has answered a day after it was sent is ignored. A day rather
# than waking hours: a card asks for a tap, whenever the learner next picks the
# phone up.
IGNORED_AFTER = timedelta(hours=24)
# Per user per day: how many times the platform may open the conversation.
DAILY_INITIATIONS = 1
# How long the platform waits after its last message, by how many in a row went
# unanswered. The last entry repeats for ever rather than ending in silence:
# stopping is useless at exactly the moment a learner has drifted away.
SILENCE_WAITS = (
    timedelta(days=1),
    timedelta(days=2),
    timedelta(days=4),
    timedelta(days=7),
)
MAX_ATTEMPTS = 3
RETRY_DELAY = timedelta(minutes=5)
# A mute with no end date. Keeping it a distant moment rather than a second
# column means one nullable timestamp answers "is this user muted".
INDEFINITE = datetime(9999, 12, 31, tzinfo=UTC)


@dataclass(frozen=True)
class Hours:
    """The learner's waking day: their clock and the two ends of the window.

    Every decision about *when* is made in these terms, and both ends are the
    learner's to move.
    """

    tz: ZoneInfo
    opens: time
    closes: time

    @classmethod
    def of(cls, user: User) -> Self:
        return cls(zone(user.timezone), user.quiet_start, user.quiet_end)

    def open_at(self, day: date) -> datetime:
        return datetime.combine(day, self.opens, self.tz)


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


def silence_wait(silence: int) -> timedelta:
    if silence == 0:
        return timedelta(0)
    return SILENCE_WAITS[min(silence, len(SILENCE_WAITS)) - 1]


def retry_at(moment: datetime, attempts: int) -> datetime:
    doubling: int = 2 ** (attempts - 1)
    return moment + RETRY_DELAY * doubling
