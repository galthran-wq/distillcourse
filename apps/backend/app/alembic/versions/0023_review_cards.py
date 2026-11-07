"""review cards: tap questions written on first need, their deliveries, levels
per lesson, and the model spend with no message to hang it on

Revision ID: 0023
Revises: 0022
Create Date: 2026-11-07

"""

from datetime import datetime

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0023"
down_revision = "0022"
branch_labels = None
depends_on = None

LESSON = sa.String(length=168)


def _created_at() -> sa.Column[datetime]:
    return sa.Column(
        "created_at",
        sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        nullable=False,
    )


def upgrade() -> None:
    op.create_table(
        "review_cards",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("lesson", LESSON, nullable=False),
        sa.Column("anchor", sa.Text(), nullable=True),
        sa.Column("kind", sa.String(length=16), nullable=False),
        sa.Column("level", sa.SmallInteger(), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("options", postgresql.JSONB(), nullable=False),
        sa.Column("answer", postgresql.JSONB(), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.Column("figure", sa.Text(), nullable=True),
        sa.Column("formula", sa.Text(), nullable=True),
        sa.Column("owner_id", sa.Uuid(), nullable=True),
        sa.Column("content_hash", sa.String(length=64), nullable=False),
        sa.Column(
            "status",
            sa.String(length=16),
            server_default="active",
            nullable=False,
        ),
        _created_at(),
        sa.CheckConstraint("level BETWEEN 1 AND 3", name="ck_review_cards_level"),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_review_cards_lesson_level", "review_cards", ["lesson", "level", "status"]
    )
    op.create_table(
        "card_deliveries",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("card_id", sa.Uuid(), nullable=False),
        sa.Column("tg_message_id", sa.BigInteger(), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("answered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("chosen", postgresql.JSONB(), nullable=True),
        sa.Column("outcome", sa.String(length=16), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["card_id"], ["review_cards.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_card_deliveries_user_sent", "card_deliveries", ["user_id", "sent_at"]
    )
    op.create_index(
        "ix_card_deliveries_open",
        "card_deliveries",
        ["sent_at"],
        postgresql_where=sa.text("outcome IS NULL"),
    )
    op.add_column(
        "review_state",
        sa.Column("level", sa.SmallInteger(), server_default="1", nullable=False),
    )
    op.add_column(
        "review_state",
        sa.Column("level_run", sa.SmallInteger(), server_default="0", nullable=False),
    )
    op.create_table(
        "background_runs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("kind", sa.String(length=16), nullable=False),
        sa.Column("usage", postgresql.JSONB(), nullable=False),
        _created_at(),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    # A review is a card from here on, and a card is answered with a tap rather
    # than in the thread: a slot still open on an old review run would wait for
    # a reply nothing reads any more, and a queued one would be delivered as a
    # card of a ladder that is still due anyway.
    op.execute(
        "UPDATE schedules SET status = 'done', outcome = 'ignored' "
        "WHERE kind = 'review' AND status = 'awaiting_reply'"
    )
    op.execute(
        "UPDATE schedules SET status = 'cancelled', claimed_at = NULL, "
        "lease_until = NULL "
        "WHERE kind = 'review' AND status IN ('pending', 'deferred')"
    )


def downgrade() -> None:
    op.drop_table("background_runs")
    op.drop_column("review_state", "level_run")
    op.drop_column("review_state", "level")
    op.drop_index("ix_card_deliveries_open", table_name="card_deliveries")
    op.drop_index("ix_card_deliveries_user_sent", table_name="card_deliveries")
    op.drop_table("card_deliveries")
    op.drop_index("ix_review_cards_lesson_level", table_name="review_cards")
    op.drop_table("review_cards")
