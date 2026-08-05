"""quiet hours become a per-user window

Revision ID: 0009
Revises: 0008
Create Date: 2026-08-05

"""

import sqlalchemy as sa
from alembic import op

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # The window every existing row already lived under, now written down where
    # the learner can move it.
    op.add_column(
        "users",
        sa.Column("quiet_start", sa.Time(), server_default="09:00", nullable=False),
    )
    op.add_column(
        "users",
        sa.Column("quiet_end", sa.Time(), server_default="22:00", nullable=False),
    )
    # The window is read as `opens <= t < closes`, which says nothing at all
    # when the two are the wrong way round.
    op.create_check_constraint(
        "ck_users_quiet_hours", "users", "quiet_start < quiet_end"
    )


def downgrade() -> None:
    op.drop_constraint("ck_users_quiet_hours", "users", type_="check")
    op.drop_column("users", "quiet_end")
    op.drop_column("users", "quiet_start")
