import uuid
from datetime import UTC, datetime, time, timedelta
from zoneinfo import ZoneInfo

from app.models import Schedule
from app.scheduling import policy

MOSCOW = ZoneInfo("Europe/Moscow")
WAKING = policy.Hours(MOSCOW, time(9), time(22))


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


def test_the_slot_times_out_after_four_waking_hours() -> None:
    assert policy.slot_deadline(moment(10), WAKING) == moment(14)


def test_the_night_does_not_count_against_the_slot() -> None:
    """Sent at 21:00, one hour of the day is left; the other three are the next
    morning's, so an unanswered message is not ignored at 01:00."""
    assert policy.slot_deadline(moment(21), WAKING) == moment(12, day=6)


def test_retries_back_off() -> None:
    start = moment(10)

    assert policy.retry_at(start, 1) == start + timedelta(minutes=5)
    assert policy.retry_at(start, 2) == start + timedelta(minutes=10)


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
