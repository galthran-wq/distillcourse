"""coach notes: the weekly note, which spends the day's initiation and may
carry a button that puts a card on a lesson

Revision ID: 0026
Revises: 0025
Create Date: 2026-11-07

"""

import sqlalchemy as sa
from alembic import op

revision = "0026"
down_revision = "0025"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "coach_notes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("tg_message_id", sa.BigInteger(), nullable=False),
        sa.Column("lesson", sa.String(length=168), nullable=True),
        sa.Column("pressed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_coach_notes_user_sent", "coach_notes", ["user_id", "sent_at"])


def downgrade() -> None:
    op.drop_index("ix_coach_notes_user_sent", table_name="coach_notes")
    op.drop_table("coach_notes")
