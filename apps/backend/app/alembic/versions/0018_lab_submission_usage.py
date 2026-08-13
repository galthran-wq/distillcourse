"""what judging a lab review submission cost

Revision ID: 0018
Revises: 0017
Create Date: 2026-08-13

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0018"
down_revision = "0017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "lab_submissions",
        sa.Column("usage", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("lab_submissions", "usage")
