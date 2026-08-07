"""when a chat was last named

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


def downgrade() -> None:
    op.drop_column("chats", "titled_at")
