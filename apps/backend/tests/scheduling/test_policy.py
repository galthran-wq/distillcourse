import uuid
from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from app.models import Schedule
from app.scheduling import policy

MOSCOW = ZoneInfo("Europe/Moscow")


def moment(hour: int, minute: int = 0, *, day: int = 5) -> datetime:
    """A moment written on the learner's clock, stored as the poller sees it."""
    return datetime(2026, 8, day, hour, minute, tzinfo=MOSCOW).astimezone(UTC)


def schedule(
    *, kind: str = "review", topic: str | None = None, due_hour: int = 9
) -> Schedule:
    return Schedule(
        id=uuid.uuid4(),
        kind=kind,
        due_at=moment(due_hour),
        payload={"note": "a note"} | ({"topic": topic} if topic else {}),
    )


def test_the_window_is_the_learners_waking_day() -> None:
    assert policy.in_window(moment(9), MOSCOW)
    assert policy.in_window(moment(21, 59), MOSCOW)
    assert not policy.in_window(moment(8, 59), MOSCOW)
    assert not policy.in_window(moment(22), MOSCOW)


def test_the_window_follows_the_learner_not_the_server() -> None:
    """22:00 in Moscow is 19:00 in UTC: the same instant is quiet hours for one
    learner and not for the other."""
    late = moment(22)

    assert not policy.in_window(late, MOSCOW)
    assert policy.in_window(late, ZoneInfo("UTC"))


def test_work_that_arrives_at_night_waits_for_the_morning() -> None:
    assert policy.next_open(moment(3), MOSCOW) == moment(9)
    assert policy.next_open(moment(23), MOSCOW) == moment(9, day=6)


def test_work_inside_the_window_is_not_postponed() -> None:
    assert policy.next_open(moment(14), MOSCOW) == moment(14)


def test_tomorrow_is_the_next_morning_wherever_the_learner_is() -> None:
    assert policy.tomorrow_open(moment(23), MOSCOW) == moment(9, day=6)
    assert policy.day_start(moment(23), MOSCOW) == moment(0)


def test_the_slot_times_out_after_four_waking_hours() -> None:
    assert policy.slot_deadline(moment(10), MOSCOW) == moment(14)


def test_the_night_does_not_count_against_the_slot() -> None:
    """Sent at 21:00, one hour of the day is left; the other three are the next
    morning's, so an unanswered message is not ignored at 01:00."""
    assert policy.slot_deadline(moment(21), MOSCOW) == moment(12, day=6)


def test_retries_back_off() -> None:
    start = moment(10)

    assert policy.retry_at(start, 1) == start + timedelta(minutes=5)
    assert policy.retry_at(start, 2) == start + timedelta(minutes=10)


def test_an_unreadable_timezone_falls_back_to_utc() -> None:
    assert policy.zone("Mars/Olympus") == ZoneInfo("UTC")
    assert policy.zone("Europe/Moscow") == MOSCOW


def test_one_message_carries_three_items_and_the_rest_wait() -> None:
    due = [schedule(topic=f"course-{index}") for index in range(5)]

    now, later = policy.session_items(due, avoid=None)

    assert len(now) == policy.SESSION_ITEMS
    assert len(later) == 2
    assert not set(now) & set(later)


def test_a_reminder_is_delivered_before_a_review() -> None:
    due = [schedule(due_hour=9), schedule(kind="reminder", due_hour=10)]

    now, _ = policy.session_items(due, avoid=None)

    assert now[0].kind == "reminder"


def test_after_an_ignored_message_another_topic_leads() -> None:
    ignored = schedule(topic="information-theory", due_hour=9)
    other = schedule(topic="classical-ml", due_hour=10)

    now, _ = policy.session_items([ignored, other], avoid="information-theory")

    assert [policy.topic(row) for row in now] == ["classical-ml", "information-theory"]
