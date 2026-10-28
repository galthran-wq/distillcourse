"""lab submissions keep the checked function's source, for the review after it

Revision ID: 0021
Revises: 0020
Create Date: 2026-10-28

"""

import sqlalchemy as sa
from alembic import op

revision = "0021"
down_revision = "0020"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("lab_submissions", sa.Column("source", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("lab_submissions", "source")
