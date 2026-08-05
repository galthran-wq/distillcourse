"""documents

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-05

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

# A frozen copy of DOCUMENT_TSV in app.models as of this revision. It is spelled
# out rather than imported because a migration is a snapshot: re-weighting the
# expression in the model must produce a new migration, or a fresh database and
# an already-migrated one would generate different tsvectors and rank the same
# query differently with nothing to flag it.
DOCUMENT_TSV = (
    "setweight(to_tsvector('english', coalesce(title, '')), 'A') || "
    "setweight(to_tsvector('english', coalesce(text, '')), 'B')"
)


def upgrade() -> None:
    op.create_table(
        "documents",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("corpus", sa.String(length=16), nullable=False),
        sa.Column("course_slug", sa.String(length=64), nullable=True),
        sa.Column("locator", sa.String(length=512), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("breadcrumb", sa.Text(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("anchors", postgresql.ARRAY(sa.Text()), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("metadata", postgresql.JSONB(), nullable=False),
        sa.Column("content_hash", sa.String(length=64), nullable=False),
        sa.Column(
            "tsv",
            postgresql.TSVECTOR(),
            sa.Computed(DOCUMENT_TSV, persisted=True),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_documents_corpus"), "documents", ["corpus"])
    op.create_index(op.f("ix_documents_course_slug"), "documents", ["course_slug"])
    op.create_index(op.f("ix_documents_locator"), "documents", ["locator"], unique=True)
    op.create_index("ix_documents_tsv", "documents", ["tsv"], postgresql_using="gin")


def downgrade() -> None:
    op.drop_index("ix_documents_tsv", table_name="documents")
    op.drop_index(op.f("ix_documents_locator"), table_name="documents")
    op.drop_index(op.f("ix_documents_course_slug"), table_name="documents")
    op.drop_index(op.f("ix_documents_corpus"), table_name="documents")
    op.drop_table("documents")
