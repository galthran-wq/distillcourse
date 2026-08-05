"""telemetry events and the lesson progress aggregate

Revision ID: 0005
Revises: 0004
Create Date: 2026-08-05

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None

# Retention: the table is unpartitioned on purpose. Monthly partitioning
# (pg_partman) is the answer when the volume asks for it, and nothing about
# this shape has to change to adopt it.


def upgrade() -> None:
    op.create_table(
        "events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("lesson", sa.String(length=168), nullable=False),
        sa.Column("type", sa.String(length=24), nullable=False),
        sa.Column("payload", postgresql.JSONB(), nullable=False),
        sa.Column("client_ts", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "server_ts",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    # The one access path there is: every recompute reads a reader's events for
    # one lesson in server order.
    op.create_index(
        "ix_events_user_lesson_ts", "events", ["user_id", "lesson", "server_ts"]
    )
    op.create_table(
        "lesson_progress",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("lesson", sa.String(length=168), nullable=False),
        sa.Column("active_seconds", sa.Integer(), nullable=False),
        sa.Column("max_scroll_pct", sa.Integer(), nullable=False),
        sa.Column("proofs_opened", sa.Integer(), nullable=False),
        sa.Column("solutions_opened", sa.Integer(), nullable=False),
        sa.Column("demos_touched", sa.Integer(), nullable=False),
        sa.Column("first_seen", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "lesson"),
    )


def downgrade() -> None:
    op.drop_table("lesson_progress")
    op.drop_index("ix_events_user_lesson_ts", table_name="events")
    op.drop_table("events")
