"""lab challenges, per-learner checkpoint state and the submission log

Revision ID: 0017
Revises: 0016
Create Date: 2026-08-13

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0017"
down_revision = "0016"
branch_labels = None
depends_on = None

LESSON = sa.String(length=168)
CHECKPOINT = sa.String(length=64)


def upgrade() -> None:
    op.create_table(
        "lab_challenges",
        sa.Column("lesson", LESSON, nullable=False),
        sa.Column("checkpoint", CHECKPOINT, nullable=False),
        sa.Column("kind", sa.String(length=16), nullable=False),
        sa.Column("spec", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("content_version", sa.LargeBinary(), nullable=False),
        sa.PrimaryKeyConstraint("lesson", "checkpoint"),
    )
    op.create_table(
        "lab_checkpoint_state",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("lesson", LESSON, nullable=False),
        sa.Column("checkpoint", CHECKPOINT, nullable=False),
        sa.Column("attempts", sa.Integer(), server_default="0", nullable=False),
        sa.Column("passed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("best_score", sa.Numeric(), nullable=True),
        sa.Column("feedback", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "lesson", "checkpoint"),
    )
    op.create_table(
        "lab_submissions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("lesson", LESSON, nullable=False),
        sa.Column("checkpoint", CHECKPOINT, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("verdict", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_lab_submissions_user_id"), "lab_submissions", ["user_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_lab_submissions_user_id"), table_name="lab_submissions")
    op.drop_table("lab_submissions")
    op.drop_table("lab_checkpoint_state")
    op.drop_table("lab_challenges")
