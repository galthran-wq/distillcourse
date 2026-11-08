from datetime import UTC, datetime, time, timedelta
from zoneinfo import ZoneInfo

import pytest

from app.scheduling import policy

MOSCOW = ZoneInfo("Europe/Moscow")
WAKING = policy.Hours(MOSCOW, time(9), time(22))


def moment(hour: int, minute: int = 0, *, day: int = 5) -> datetime:
    """A moment written on the learner's clock, stored as the poller sees it."""
    return datetime(2026, 8, day, hour, minute, tzinfo=MOSCOW).astimezone(UTC)


def test_the_window_is_the_learners_waking_day() -> None:
    assert policy.in_window(moment(9), WAKING)
    assert policy.in_window(moment(21, 59), WAKING)
    assert not policy.in_window(moment(8, 59), WAKING)
    assert not policy.in_window(moment(22), WAKING)


def test_the_window_follows_the_learner_not_the_server() -> None:
    """22:00 in Moscow is 19:00 in UTC: the same instant is quiet hours for one
    learner and not for the other."""
    late = moment(22)

    assert not policy.in_window(late, WAKING)
    assert policy.in_window(late, policy.Hours(ZoneInfo("UTC"), time(9), time(22)))


def test_the_learner_moves_both_ends_of_the_window() -> None:
    """The window is the learner's to set: the same 07:00 is quiet hours under
    the default one and the start of the day under an early riser's."""
    early = policy.Hours(MOSCOW, time(6), time(18))

    assert not policy.in_window(moment(7), WAKING)
    assert policy.in_window(moment(7), early)
    assert not policy.in_window(moment(20), early)
    assert policy.next_open(moment(20), early) == moment(6, day=6)


def test_work_that_arrives_at_night_waits_for_the_morning() -> None:
    assert policy.next_open(moment(3), WAKING) == moment(9)
    assert policy.next_open(moment(23), WAKING) == moment(9, day=6)


def test_work_inside_the_window_is_not_postponed() -> None:
    assert policy.next_open(moment(14), WAKING) == moment(14)


def test_tomorrow_is_the_next_morning_wherever_the_learner_is() -> None:
    assert policy.tomorrow_open(moment(23), WAKING) == moment(9, day=6)
    assert policy.day_start(moment(23), WAKING) == moment(0)


def test_retries_back_off() -> None:
    start = moment(10)

    assert policy.retry_at(start, 1) == start + timedelta(minutes=5)
    assert policy.retry_at(start, 2) == start + timedelta(minutes=10)


@pytest.mark.parametrize(
    ("silence", "days"), [(0, 0), (1, 1), (2, 2), (3, 4), (4, 7), (50, 7)]
)
def test_silence_backs_off_but_never_stops(silence: int, days: int) -> None:
    assert policy.silence_wait(silence) == timedelta(days=days)
