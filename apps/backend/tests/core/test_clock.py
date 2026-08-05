from zoneinfo import ZoneInfo

from app.core import clock


def test_an_unreadable_timezone_falls_back_to_utc() -> None:
    assert clock.zone("Mars/Olympus") == ZoneInfo("UTC")
    assert clock.zone("") == ZoneInfo("UTC")
    assert clock.zone("Europe/Moscow") == ZoneInfo("Europe/Moscow")
