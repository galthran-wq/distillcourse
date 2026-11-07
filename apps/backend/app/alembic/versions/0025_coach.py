"""coach: one live wake-up row per learner, the cards it sent on its own
account, and no more review rows

Revision ID: 0025
Revises: 0024
Create Date: 2026-11-07

"""

import sqlalchemy as sa
from alembic import op

revision = "0025"
down_revision = "0024"
branch_labels = None
depends_on = None

LIVE = sa.text("kind = 'coach' AND status IN ('pending', 'deferred')")


def upgrade() -> None:
    # The ladder is advice now: nothing materialises a review into the queue,
    # and a row left behind would be claimed by a poller that no longer knows
    # the kind. `review_state` is untouched; the coach reads it.
    op.execute("DELETE FROM schedules WHERE kind = 'review'")
    op.create_index(
        "uq_schedules_live_coach",
        "schedules",
        ["user_id"],
        unique=True,
        postgresql_where=LIVE,
    )
    op.add_column(
        "card_deliveries",
        sa.Column("initiated", sa.Boolean(), server_default="false", nullable=False),
    )
    # Every card sent before this was the poller's except a harder one, which
    # the learner asked for; Next sent the rest it cannot be told apart from.
    # Counted as the platform's, a card errs towards one message too few.
    op.execute("UPDATE card_deliveries SET initiated = NOT harder")


def downgrade() -> None:
    # The deleted review rows are not restored: the poller that made them
    # materialises them again from `review_state` on its first cycle.
    op.drop_column("card_deliveries", "initiated")
    op.drop_index("uq_schedules_live_coach", table_name="schedules")
    op.execute("DELETE FROM schedules WHERE kind = 'coach'")
