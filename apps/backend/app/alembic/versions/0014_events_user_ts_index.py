"""events by reader and time, for the activity grid across every lesson

Revision ID: 0014
Revises: 0013
Create Date: 2026-08-06

"""

from alembic import op

revision = "0014"
down_revision = "0013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # The grid and its feed window a reader's events by time alone;
    # ix_events_user_lesson_ts has `lesson` in front of `server_ts` and cannot
    # serve them without reading everything that reader ever produced.
    op.create_index("ix_events_user_ts", "events", ["user_id", "server_ts"])


def downgrade() -> None:
    op.drop_index("ix_events_user_ts", table_name="events")
