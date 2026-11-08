"""coach nudges: the section a reader was last in

Revision ID: 0026
Revises: 0025
Create Date: 2026-11-07

"""

import sqlalchemy as sa
from alembic import op

revision = "0026"
down_revision = "0025"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Left empty on existing rows: `rebuild-progress` fills it from the
    # heartbeats that carry an anchor, and none sent before this did.
    op.add_column("lesson_progress", sa.Column("last_anchor", sa.Text()))


def downgrade() -> None:
    # A nudge row is a record and nothing more; the code before this reads no
    # such kind, and would not count it as the day's message.
    op.execute("DELETE FROM schedules WHERE kind = 'nudge'")
    op.drop_column("lesson_progress", "last_anchor")
