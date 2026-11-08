"""0026 both ways, against rows the downgrade has to deal with."""

import json
import uuid
from datetime import UTC, datetime

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from tests.review.test_migration import (  # noqa: F401  (a shared fixture)
    alembic,
    own_engine,
    statuses,
)


async def has_last_anchor(engine: AsyncEngine) -> bool:
    async with engine.connect() as connection:
        found = await connection.scalar(
            text(
                "SELECT count(*) FROM information_schema.columns WHERE "
                "table_name = 'lesson_progress' AND column_name = 'last_anchor'"
            )
        )
    return bool(found)


async def test_the_last_anchor_comes_and_goes_and_nudges_go_with_it(
    own_engine: AsyncEngine,  # noqa: F811
) -> None:
    user_id = uuid.uuid4()
    try:
        async with own_engine.begin() as connection:
            await connection.execute(
                text(
                    "INSERT INTO users (id, email, hashed_password, is_active) "
                    "VALUES (:id, 'migrated@test', 'x', true)"
                ),
                {"id": user_id},
            )
            for name, kind in (("nudge", "nudge"), ("reminder", "reminder")):
                await connection.execute(
                    text(
                        "INSERT INTO schedules (id, user_id, kind, due_at, payload, "
                        "status, created_by, attempts) VALUES (:id, :user_id, "
                        ":kind, :now, CAST(:payload AS jsonb), 'done', 'system', 0)"
                    ),
                    {
                        "id": uuid.uuid4(),
                        "user_id": user_id,
                        "kind": kind,
                        "now": datetime.now(UTC),
                        "payload": json.dumps({"name": name}),
                    },
                )
        assert await has_last_anchor(own_engine)

        alembic("downgrade", "0025")

        assert not await has_last_anchor(own_engine)
        assert await statuses(own_engine, user_id) == {"reminder": ("done", None)}

        alembic("upgrade", "head")

        assert await has_last_anchor(own_engine)
    finally:
        alembic("upgrade", "head")
        async with own_engine.begin() as connection:
            await connection.execute(
                text("DELETE FROM users WHERE id = :id"), {"id": user_id}
            )
