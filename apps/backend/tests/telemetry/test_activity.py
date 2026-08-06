from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from tests.telemetry.conftest import HEARTBEATS_TO_COMPLETE, read

pytestmark = pytest.mark.usefixtures("indexed_lesson")

ACTIVITY = f"{settings.API_V1_STR}/telemetry/activity"


async def test_an_anonymous_visitor_is_refused(client: AsyncClient) -> None:
    assert (await client.get(ACTIVITY)).status_code == 401


async def test_a_reader_who_has_read_nothing_gets_an_empty_grid(
    signed_in: AsyncClient,
) -> None:
    assert (await signed_in.get(ACTIVITY)).json() == {"days": []}


async def test_a_day_read_is_a_square_on_the_readers_calendar(
    signed_in: AsyncClient, session: AsyncSession
) -> None:
    await read(signed_in, session, heartbeats=HEARTBEATS_TO_COMPLETE, depth=90)

    body = (await signed_in.get(ACTIVITY)).json()

    assert body == {
        "days": [{"date": datetime.now(UTC).date().isoformat(), "count": 1}]
    }


async def test_a_day_under_the_bar_is_no_square(
    signed_in: AsyncClient, session: AsyncSession
) -> None:
    # Forty seconds, halfway down the page: the grid answers a question about
    # reading days, and this is not one.
    await read(signed_in, session, heartbeats=4, depth=50)

    assert (await signed_in.get(ACTIVITY)).json() == {"days": []}
