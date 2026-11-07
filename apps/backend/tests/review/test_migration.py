"""0023 and 0025 against a database that still holds the old review rows.

Alembic runs in a subprocess: `env.py` drives its own event loop and disposes
the engine the rest of the suite shares. The rows are written on an engine of
this test's own, outside the per-test transaction, because the migration has
to see them.
"""

import json
import os
import subprocess
import uuid
from collections.abc import AsyncIterator
from datetime import UTC, datetime

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.core.config import settings
from tests.conftest import BACKEND_ROOT

BEFORE = "0022"


def alembic(*args: str) -> None:
    subprocess.run(
        ["uv", "run", "alembic", *args],
        cwd=BACKEND_ROOT,
        env=os.environ | {"POSTGRES_DB": settings.POSTGRES_DB},
        check=True,
        capture_output=True,
    )


@pytest.fixture
async def own_engine() -> AsyncIterator[AsyncEngine]:
    engine = create_async_engine(str(settings.database_uri))
    yield engine
    await engine.dispose()


async def statuses(
    engine: AsyncEngine, user_id: uuid.UUID
) -> dict[str, tuple[str, str | None]]:
    async with engine.connect() as connection:
        rows = await connection.execute(
            text(
                "SELECT payload->>'name', status, outcome FROM schedules "
                "WHERE user_id = :user_id"
            ),
            {"user_id": user_id},
        )
        return {name: (status, outcome) for name, status, outcome in rows}


async def has_table(engine: AsyncEngine, name: str) -> bool:
    async with engine.connect() as connection:
        found = await connection.scalar(
            text("SELECT to_regclass(:name)"), {"name": name}
        )
    return found is not None


async def test_the_upgrade_closes_open_review_runs_and_the_downgrade_restores_the_schema(
    own_engine: AsyncEngine,
) -> None:
    user_id = uuid.uuid4()
    now = datetime.now(UTC)
    alembic("downgrade", BEFORE)
    try:
        async with own_engine.begin() as connection:
            await connection.execute(
                text(
                    "INSERT INTO users (id, email, hashed_password, is_active) "
                    "VALUES (:id, 'migrated@test', 'x', true)"
                ),
                {"id": user_id},
            )
            for name, kind, status, outcome in (
                ("open", "review", "awaiting_reply", None),
                ("queued", "review", "pending", None),
                ("held", "review", "deferred", None),
                ("answered", "review", "done", "answered"),
                ("reminder", "reminder", "pending", None),
            ):
                await connection.execute(
                    text(
                        "INSERT INTO schedules (id, user_id, kind, due_at, payload, "
                        "status, created_by, attempts, outcome) VALUES (:id, "
                        ":user_id, :kind, :now, CAST(:payload AS jsonb), :status, "
                        "'system', 0, :outcome)"
                    ),
                    {
                        "id": uuid.uuid4(),
                        "user_id": user_id,
                        "kind": kind,
                        "now": now,
                        "payload": json.dumps({"name": name}),
                        "status": status,
                        "outcome": outcome,
                    },
                )

        alembic("upgrade", "0023")

        assert await statuses(own_engine, user_id) == {
            "open": ("done", "ignored"),
            "queued": ("cancelled", None),
            "held": ("cancelled", None),
            "answered": ("done", "answered"),
            "reminder": ("pending", None),
        }
        assert await has_table(own_engine, "review_cards")

        alembic("downgrade", BEFORE)

        for table in ("review_cards", "card_deliveries", "background_runs"):
            assert not await has_table(own_engine, table)
        assert (await statuses(own_engine, user_id))["open"] == ("done", "ignored")
    finally:
        alembic("upgrade", "head")
        async with own_engine.begin() as connection:
            await connection.execute(
                text("DELETE FROM users WHERE id = :id"), {"id": user_id}
            )


async def test_the_coach_upgrade_drops_review_rows_and_marks_what_the_poller_sent(
    own_engine: AsyncEngine,
) -> None:
    user_id = uuid.uuid4()
    now = datetime.now(UTC)
    alembic("downgrade", "0024")
    try:
        async with own_engine.begin() as connection:
            await connection.execute(
                text(
                    "INSERT INTO users (id, email, hashed_password, is_active) "
                    "VALUES (:id, 'migrated@test', 'x', true)"
                ),
                {"id": user_id},
            )
            for name, kind in (("review", "review"), ("reminder", "reminder")):
                await connection.execute(
                    text(
                        "INSERT INTO schedules (id, user_id, kind, due_at, payload, "
                        "status, created_by, attempts) VALUES (:id, :user_id, "
                        ":kind, :now, CAST(:payload AS jsonb), 'pending', 'system', 0)"
                    ),
                    {
                        "id": uuid.uuid4(),
                        "user_id": user_id,
                        "kind": kind,
                        "now": now,
                        "payload": json.dumps({"name": name}),
                    },
                )
            card_id = uuid.uuid4()
            await connection.execute(
                text(
                    "INSERT INTO review_cards (id, lesson, kind, level, prompt, "
                    "options, answer, explanation, content_hash) VALUES (:id, "
                    "'lesson:c/l', 'gap', 1, 'p', '[]', '0', 'e', 'h')"
                ),
                {"id": card_id},
            )
            for harder in (False, True):
                await connection.execute(
                    text(
                        "INSERT INTO card_deliveries (id, user_id, card_id, "
                        "tg_message_id, sent_at, harder) VALUES (:id, :user_id, "
                        ":card_id, 1, :now, :harder)"
                    ),
                    {
                        "id": uuid.uuid4(),
                        "user_id": user_id,
                        "card_id": card_id,
                        "now": now,
                        "harder": harder,
                    },
                )

        alembic("upgrade", "head")

        assert await statuses(own_engine, user_id) == {"reminder": ("pending", None)}
        async with own_engine.connect() as connection:
            marked = await connection.execute(
                text(
                    "SELECT harder, initiated FROM card_deliveries "
                    "WHERE user_id = :user_id"
                ),
                {"user_id": user_id},
            )
            assert sorted(marked.tuples()) == [(False, True), (True, False)]

        alembic("downgrade", "0024")
        assert await statuses(own_engine, user_id) == {"reminder": ("pending", None)}
    finally:
        alembic("upgrade", "head")
        async with own_engine.begin() as connection:
            await connection.execute(
                text("DELETE FROM review_cards WHERE lesson = 'lesson:c/l'")
            )
            await connection.execute(
                text("DELETE FROM users WHERE id = :id"), {"id": user_id}
            )
