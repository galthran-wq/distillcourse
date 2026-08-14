"""lab pairing codes and the bearer tokens they mint

Revision ID: 0016
Revises: 0015
Create Date: 2026-08-13

"""

import sqlalchemy as sa
from alembic import op

revision = "0016"
down_revision = "0015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "lab_pairing_codes",
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("code"),
    )
    op.create_index(
        op.f("ix_lab_pairing_codes_user_id"), "lab_pairing_codes", ["user_id"]
    )
    op.create_table(
        "lab_tokens",
        sa.Column("token_hash", sa.LargeBinary(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("token_hash"),
    )
    op.create_index(op.f("ix_lab_tokens_user_id"), "lab_tokens", ["user_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_lab_tokens_user_id"), table_name="lab_tokens")
    op.drop_table("lab_tokens")
    op.drop_index(op.f("ix_lab_pairing_codes_user_id"), table_name="lab_pairing_codes")
    op.drop_table("lab_pairing_codes")
