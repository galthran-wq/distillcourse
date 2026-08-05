import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    Computed,
    DateTime,
    ForeignKey,
    Index,
    LargeBinary,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, CITEXT, JSONB, TSVECTOR
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from app.content.locators import LESSON_LENGTH


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    # citext: "Ann@x.com" and "ann@x.com" are one account and one login.
    email: Mapped[str] = mapped_column(CITEXT, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str | None] = mapped_column(String(255), default=None)
    # Re-read from the browser at every login: a user who relocates must not
    # keep getting proactive messages on their old clock.
    timezone: Mapped[str] = mapped_column(Text, server_default="UTC")
    is_active: Mapped[bool] = mapped_column(default=True)
    is_superuser: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class UserSession(Base):
    __tablename__ = "sessions"

    # The raw token exists only in the browser cookie, so a database dump
    # carries nothing that can be replayed as a session.
    token_hash: Mapped[bytes] = mapped_column(LargeBinary, primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    last_used_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    user_agent: Mapped[str | None] = mapped_column(String(400), default=None)

    user: Mapped[User] = relationship()


class Chat(Base):
    __tablename__ = "chats"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    kind: Mapped[str] = mapped_column(String(16))
    model: Mapped[str] = mapped_column(String(128))
    title: Mapped[str | None] = mapped_column(String(60), default=None)
    # A run holds the chat for as long as the claim is fresh; the deadline is
    # what releases a chat whose worker died mid-stream.
    active_run_id: Mapped[uuid.UUID | None] = mapped_column(default=None)
    claimed_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class Message(Base):
    __tablename__ = "messages"

    # uuid7 is time-ordered, so `ORDER BY id` is the chat's message order and
    # no separate sequence column is needed.
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid7)
    chat_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("chats.id", ondelete="CASCADE"), index=True
    )
    run_id: Mapped[uuid.UUID | None] = mapped_column(default=None)
    role: Mapped[str] = mapped_column(String(16))
    pydantic_ai: Mapped[dict[str, Any]] = mapped_column(JSONB)
    projection: Mapped[list[dict[str, Any]]] = mapped_column(JSONB)
    usage: Mapped[dict[str, Any] | None] = mapped_column(JSONB, default=None)
    # Set when the run this row belongs to failed; errored rows stay visible in
    # the UI but are kept out of the model's context.
    error: Mapped[str | None] = mapped_column(default=None)
    marker: Mapped[str | None] = mapped_column(String(16), default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class Event(Base):
    """One thing a signed-in reader did on a lesson page.

    Append-only and the source of truth for everything derived from reading:
    the aggregate below is a projection that `rebuild-progress` recomputes from
    these rows whenever the heuristics change.
    """

    __tablename__ = "events"
    __table_args__ = (
        Index("ix_events_user_lesson_ts", "user_id", "lesson", "server_ts"),
    )

    # Minted by the browser, which is what makes a retried flush a no-op
    # instead of a second reading of the same ten seconds.
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE")
    )
    lesson: Mapped[str] = mapped_column(String(LESSON_LENGTH))
    type: Mapped[str] = mapped_column(String(24))
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB)
    # Both clocks are kept: the client's says when the reader did it, the
    # server's is the one every derivation orders by, because a browser clock
    # can be wrong by hours or forged outright.
    client_ts: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    server_ts: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class LessonProgress(Base):
    """What the events add up to, per reader and lesson."""

    __tablename__ = "lesson_progress"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    lesson: Mapped[str] = mapped_column(String(LESSON_LENGTH), primary_key=True)
    active_seconds: Mapped[int]
    max_scroll_pct: Mapped[int]
    proofs_opened: Mapped[int]
    solutions_opened: Mapped[int]
    demos_touched: Mapped[int]
    first_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    last_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )


# Title over body, and the config is spelled out: a generated column may only
# call immutable functions, which to_tsvector is exactly when given one.
# Migrations carry their own frozen copy (0004_documents.py); changing this
# expression means writing a migration that alters the column to match.
DOCUMENT_TSV = (
    "setweight(to_tsvector('english', coalesce(title, '')), 'A') || "
    "setweight(to_tsvector('english', coalesce(text, '')), 'B')"
)


class Document(Base):
    """One chunk of indexed content — the harness's only route to the corpus.

    Rows are written by `app.content.ingest` from the frontend's export and
    are otherwise read-only; `locator` (`<corpus>:<path>[#<anchor>]`) is the
    identity a consumer quotes back.
    """

    __tablename__ = "documents"
    __table_args__ = (Index("ix_documents_tsv", "tsv", postgresql_using="gin"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    corpus: Mapped[str] = mapped_column(String(16), index=True)
    course_slug: Mapped[str | None] = mapped_column(String(64), index=True)
    locator: Mapped[str] = mapped_column(String(512), unique=True)
    title: Mapped[str] = mapped_column(Text)
    breadcrumb: Mapped[str] = mapped_column(Text)
    text: Mapped[str] = mapped_column(Text)
    anchors: Mapped[list[str]] = mapped_column(ARRAY(Text))
    position: Mapped[int]
    # `metadata` is taken by Declarative, so the attribute is `meta`.
    meta: Mapped[dict[str, Any]] = mapped_column("metadata", JSONB)
    content_hash: Mapped[str] = mapped_column(String(64))
    tsv: Mapped[str] = mapped_column(TSVECTOR, Computed(DOCUMENT_TSV, persisted=True))
