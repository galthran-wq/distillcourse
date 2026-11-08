"""card controls: cards paused until tomorrow, the buttons pressed under a
card's feedback, and the harder card a learner asked for

Revision ID: 0024
Revises: 0023
Create Date: 2026-11-07

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0024"
down_revision = "0023"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("cards_paused_until", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "card_deliveries",
        sa.Column(
            "follow_ups",
            postgresql.JSONB(),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
    )
    op.add_column(
        "card_deliveries",
        sa.Column("harder", sa.Boolean(), server_default="false", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("card_deliveries", "harder")
    op.drop_column("card_deliveries", "follow_ups")
    op.drop_column("users", "cards_paused_until")
