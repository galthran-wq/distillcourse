"""sessions, user timezone, citext email

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-05

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import CITEXT

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS citext")
    op.alter_column(
        "users",
        "email",
        existing_type=sa.String(length=255),
        type_=CITEXT(),
        postgresql_using="email::citext",
    )
    op.add_column(
        "users",
        sa.Column("timezone", sa.Text(), server_default="UTC", nullable=False),
    )
    op.create_table(
        "sessions",
        sa.Column("token_hash", sa.LargeBinary(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("user_agent", sa.String(length=400), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("token_hash"),
    )
    op.create_index(op.f("ix_sessions_user_id"), "sessions", ["user_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_sessions_user_id"), table_name="sessions")
    op.drop_table("sessions")
    op.drop_column("users", "timezone")
    op.alter_column(
        "users",
        "email",
        existing_type=CITEXT(),
        type_=sa.String(length=255),
        postgresql_using="email::varchar(255)",
    )
    op.execute("DROP EXTENSION IF EXISTS citext")
