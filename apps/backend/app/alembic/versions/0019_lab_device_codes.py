"""device codes: the pairing a notebook starts and a browser approves

Revision ID: 0019
Revises: 0018
Create Date: 2026-08-14

"""

import sqlalchemy as sa
from alembic import op

revision = "0019"
down_revision = "0018"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "lab_device_codes",
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("approved_token_hash", sa.LargeBinary(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("code"),
    )
    op.create_index(
        op.f("ix_lab_device_codes_user_id"), "lab_device_codes", ["user_id"]
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_lab_device_codes_user_id"), table_name="lab_device_codes")
    op.drop_table("lab_device_codes")
