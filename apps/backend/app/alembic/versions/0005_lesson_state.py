"""lesson state: progress aggregate, ratings, bookmarks

Revision ID: 0005
Revises: 0004
Create Date: 2026-08-05

"""

import sqlalchemy as sa
from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None

# Mirrors LESSON_KEY_MAX_LENGTH in app.models: two slugs and the slash between.
LESSON_KEY = sa.String(length=161)
NOW = sa.text("now()")


def upgrade() -> None:
    op.create_table(
        "lesson_progress",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("lesson", LESSON_KEY, nullable=False),
        sa.Column("active_seconds", sa.Integer(), server_default="0", nullable=False),
        sa.Column("max_scroll_pct", sa.Integer(), server_default="0", nullable=False),
        sa.Column("proofs_opened", sa.Integer(), server_default="0", nullable=False),
        sa.Column("solutions_opened", sa.Integer(), server_default="0", nullable=False),
        sa.Column("demos_touched", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "first_seen", sa.DateTime(timezone=True), server_default=NOW, nullable=False
        ),
        sa.Column(
            "last_seen", sa.DateTime(timezone=True), server_default=NOW, nullable=False
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "lesson"),
    )
    op.create_table(
        "lesson_ratings",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("lesson", LESSON_KEY, nullable=False),
        sa.Column("value", sa.SmallInteger(), nullable=False),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=NOW, nullable=False
        ),
        sa.CheckConstraint("value IN (-1, 1)", name="ck_rating_value"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "lesson"),
    )
    op.create_table(
        "bookmarks",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("lesson", LESSON_KEY, nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=NOW, nullable=False
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "lesson"),
    )


def downgrade() -> None:
    op.drop_table("bookmarks")
    op.drop_table("lesson_ratings")
    op.drop_table("lesson_progress")
