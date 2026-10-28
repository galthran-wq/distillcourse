"""lab chats: a chat per lab, and the reference solutions the tutor reads

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

LESSON = sa.String(length=168)


def upgrade() -> None:
    op.add_column("chats", sa.Column("lab_lesson", LESSON, nullable=True))
    op.create_index(
        "ix_chats_user_id_lab_lesson_created_at",
        "chats",
        ["user_id", "lab_lesson", "created_at"],
        postgresql_where=sa.text("kind = 'lab'"),
    )
    op.create_table(
        "lab_solutions",
        sa.Column("lesson", LESSON, nullable=False),
        sa.Column("source", sa.Text(), nullable=False),
        sa.Column("content_version", sa.LargeBinary(), nullable=False),
        sa.PrimaryKeyConstraint("lesson"),
    )


def downgrade() -> None:
    op.drop_table("lab_solutions")
    op.drop_index("ix_chats_user_id_lab_lesson_created_at", table_name="chats")
    op.drop_column("chats", "lab_lesson")
