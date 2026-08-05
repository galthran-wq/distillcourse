"""the tutor's memory of a learner

Revision ID: 0011
Revises: 0008
Create Date: 2026-08-05

"""

import sqlalchemy as sa
from alembic import op

# 0009 and 0010 belong to migrations written in parallel with this one. A
# revision id is never reused, so the gap stays: two files claiming one id do
# not conflict in git and surface only as a duplicate revision at upgrade.
revision = "0011"
down_revision = "0008"
branch_labels = None
depends_on = None

NOW = sa.text("now()")


def upgrade() -> None:
    op.create_table(
        "memories",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        # Mirrors MEMORY_SLUG_LENGTH in app.models.
        sa.Column("slug", sa.String(length=64), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("source", sa.String(length=8), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=NOW, nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=NOW, nullable=False
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        # The slug is the identity of a fact within one learner's profile:
        # writing it again replaces what was there, which is the merge that
        # keeps the profile from accumulating near-duplicates.
        sa.PrimaryKeyConstraint("user_id", "slug"),
    )


def downgrade() -> None:
    op.drop_table("memories")
