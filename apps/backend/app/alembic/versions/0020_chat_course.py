"""the course a chat is filed under

Revision ID: 0020
Revises: 0019
Create Date: 2026-10-28

"""

import sqlalchemy as sa
from alembic import op

revision = "0020"
down_revision = "0019"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # No backfill here: which course an existing chat is about is read out of
    # the conversation and checked by a person (`app.cli propose-chat-courses`),
    # which is neither deterministic nor something a downgrade could undo.
    op.add_column("chats", sa.Column("course", sa.String(length=80), nullable=True))
    op.create_index(
        "ix_chats_user_id_course_created_at",
        "chats",
        ["user_id", "course", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_chats_user_id_course_created_at", table_name="chats")
    op.drop_column("chats", "course")
