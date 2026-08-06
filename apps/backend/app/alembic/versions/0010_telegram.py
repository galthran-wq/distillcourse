"""the telegram channel: links, pairing codes, update dedup

Revision ID: 0010
Revises: 0009
Create Date: 2026-08-05

"""

import sqlalchemy as sa
from alembic import op

revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tg_links",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("tg_chat_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "status", sa.String(length=8), server_default="active", nullable=False
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
        sa.UniqueConstraint("tg_chat_id"),
    )
    op.create_table(
        "tg_pairing_codes",
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("code"),
    )
    op.create_index(
        op.f("ix_tg_pairing_codes_user_id"), "tg_pairing_codes", ["user_id"]
    )
    op.create_table(
        "tg_updates_seen",
        sa.Column("update_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "received_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("update_id"),
    )


def downgrade() -> None:
    op.drop_table("tg_updates_seen")
    op.drop_index(op.f("ix_tg_pairing_codes_user_id"), table_name="tg_pairing_codes")
    op.drop_table("tg_pairing_codes")
    op.drop_table("tg_links")
