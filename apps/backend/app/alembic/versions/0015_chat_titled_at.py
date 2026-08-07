"""when a chat was last named, and messages by chat and time

Revision ID: 0015
Revises: 0014
Create Date: 2026-08-07

"""

import sqlalchemy as sa
from alembic import op

revision = "0015"
down_revision = "0014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "chats", sa.Column("titled_at", sa.DateTime(timezone=True), nullable=True)
    )
    # A chat that already has a name was named from its first message, so its
    # creation is when that happened. Backfilling it rather than leaving NULL
    # is what makes an old chat with a stale title get a fresh one on its next
    # run — which is the point of the rename.
    op.execute("UPDATE chats SET titled_at = created_at WHERE title IS NOT NULL")
    op.create_index(
        "ix_messages_chat_id_created_at", "messages", ["chat_id", "created_at"]
    )
    # Replaced, not joined: the composite is a prefix match for every query
    # ix_messages_chat_id served, and keeping both would have the busiest table
    # in the schema maintain two btrees on the same leading column.
    op.drop_index(op.f("ix_messages_chat_id"), table_name="messages")


def downgrade() -> None:
    op.create_index(op.f("ix_messages_chat_id"), "messages", ["chat_id"])
    op.drop_index("ix_messages_chat_id_created_at", table_name="messages")
    op.drop_column("chats", "titled_at")
