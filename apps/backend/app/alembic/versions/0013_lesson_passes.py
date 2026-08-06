"""reading days: one row per lesson passed per calendar day

Revision ID: 0013
Revises: 0012
Create Date: 2026-08-06

"""

import sqlalchemy as sa
from alembic import op

revision = "0013"
down_revision = "0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "lesson_passes",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        # Mirrors LESSON_LENGTH in app.content.locators.
        sa.Column("lesson", sa.String(length=168), nullable=False),
        sa.Column("day", sa.Date(), nullable=False),
        sa.Column("passed_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        # At most one pass per lesson per day, which is what makes re-reading
        # the same lesson twice in one evening one square and not two — while
        # the same lesson tomorrow is a square of its own.
        sa.PrimaryKeyConstraint("user_id", "lesson", "day"),
    )


def downgrade() -> None:
    op.drop_table("lesson_passes")
