"""the spaced-repetition ladder

Revision ID: 0012
Revises: 0011
Create Date: 2026-08-06

"""

import sqlalchemy as sa
from alembic import op

revision = "0012"
down_revision = "0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "review_state",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        # Mirrors LESSON_LENGTH in app.content.locators.
        sa.Column("lesson", sa.String(length=168), nullable=False),
        sa.Column("step", sa.SmallInteger(), nullable=False),
        sa.Column("last_outcome", sa.String(length=16), nullable=True),
        sa.Column("next_due_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        # One ladder per learner and lesson: finishing the same lesson twice,
        # or replaying the completion out of the event log, lands on the row
        # that is already there.
        sa.PrimaryKeyConstraint("user_id", "lesson"),
    )
    # Every cycle of the poller asks which ladders have come due.
    op.create_index("ix_review_state_next_due_at", "review_state", ["next_due_at"])


def downgrade() -> None:
    op.drop_index("ix_review_state_next_due_at", table_name="review_state")
    op.drop_table("review_state")
