"""schedules and the proactive mute

Revision ID: 0008
Revises: 0007
Create Date: 2026-08-05

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users", sa.Column("muted_until", sa.DateTime(timezone=True), nullable=True)
    )
    op.create_table(
        "schedules",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("kind", sa.String(length=16), nullable=False),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("payload", postgresql.JSONB(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("claimed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("lease_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.String(length=8), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("outcome", sa.String(length=16), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_schedules_user_id"), "schedules", ["user_id"])
    # Every cycle of the poller asks the same question: what is due now.
    op.create_index("ix_schedules_status_due_at", "schedules", ["status", "due_at"])


def downgrade() -> None:
    op.drop_index("ix_schedules_status_due_at", table_name="schedules")
    op.drop_index(op.f("ix_schedules_user_id"), table_name="schedules")
    op.drop_table("schedules")
    op.drop_column("users", "muted_until")
