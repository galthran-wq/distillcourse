"""The streak: days on the learner's calendar with a card answered, in a run.

Derived from `card_deliveries` every time it is shown, never stored, so it
cannot drift from them. A skip is not an answer. One missed day is forgiven;
two in a row end it. It is shown on the first line of a card and of its
feedback and nowhere else — nothing is ever sent about it, least of all its
end: a streak-loss push is what teaches a learner to ignore the bot.
"""

from collections.abc import Iterable, Sequence
from datetime import date, datetime, timedelta, tzinfo

# Two answered days this far apart have one missed day between them, which is
# forgiven; today, not over yet, is never a missed day.
GAP = timedelta(days=2)
# A streak of one day is no streak yet.
SHOWN_FROM = 2


def local_days(moments: Iterable[datetime], tz: tzinfo) -> list[date]:
    return [moment.astimezone(tz).date() for moment in moments]


def streak(answer_days: Sequence[date], today: date) -> int:
    """Calendar days from the run's first answered day to its last: a forgiven
    day is still a day of the streak, so answering every other day counts
    every day."""
    days = sorted({day for day in answer_days if day <= today}, reverse=True)
    if not days or today - days[0] > GAP:
        return 0
    first = days[0]
    for day in days[1:]:
        if first - day > GAP:
            break
        first = day
    return (days[0] - first).days + 1


def line(count: int, title: str) -> str:
    return f"Day {count} · {title}" if count >= SHOWN_FROM else title
