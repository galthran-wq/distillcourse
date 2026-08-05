"""lesson ratings and bookmarks

Revision ID: 0006
Revises: 0005
Create Date: 2026-08-05

"""

import sqlalchemy as sa
from alembic import op

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None

# The index's `lesson:<course>/<lesson>`, the same string 0005 gave `events`
# and `lesson_progress` — mirrors LESSON_LENGTH in app.content.locators.
LESSON_KEY = sa.String(length=168)
NOW = sa.text("now()")


def upgrade() -> None:
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
    # 0004 sized this at 64 while the locator grammar has always allowed 80, so
    # a long course slug was ratable and bookmarkable but not indexable. One
    # bound now (locators.SLUG_LENGTH); widening a varchar rewrites no rows.
    op.alter_column(
        "documents", "course_slug", type_=sa.String(length=80), existing_nullable=True
    )


def downgrade() -> None:
    op.alter_column(
        "documents", "course_slug", type_=sa.String(length=64), existing_nullable=True
    )
    op.drop_table("bookmarks")
    op.drop_table("lesson_ratings")
