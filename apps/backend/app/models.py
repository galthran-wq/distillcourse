import uuid
from datetime import date, datetime, time
from typing import Any

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Computed,
    Date,
    DateTime,
    ForeignKey,
    Index,
    LargeBinary,
    Numeric,
    SmallInteger,
    String,
    Text,
    Time,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, CITEXT, JSONB, TSVECTOR
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from app.content.locators import CHECKPOINT_LENGTH, LESSON_LENGTH, SLUG_LENGTH


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    # The waking window is same-day: `opens <= t < closes`, so it must open
    # before it closes and 18:00–02:00 cannot be expressed. Everything that
    # counts waking hours reads it as one interval inside a date — the slot
    # timeout that carries over the night, the budget that resets at local
    # midnight — and wrapping the window is a change to all of that rather than
    # to this constraint. The settings page says so where a learner sets it.
    __table_args__ = (
        CheckConstraint("quiet_start < quiet_end", name="ck_users_quiet_hours"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    # citext: "Ann@x.com" and "ann@x.com" are one account and one login.
    email: Mapped[str] = mapped_column(CITEXT, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str | None] = mapped_column(String(255), default=None)
    # Re-read from the browser at every login: a user who relocates must not
    # keep getting proactive messages on their old clock.
    timezone: Mapped[str] = mapped_column(Text, server_default="UTC")
    # The waking window the platform may write in, on the clock above. Stored
    # per learner because it is theirs to set (the settings page), and read by
    # every decision the poller makes about when.
    # The default is stated on both sides: the column answers for rows that
    # already exist, the mapper for a row this process inserts, which must not
    # have to read the value back before the poller can use it.
    quiet_start: Mapped[time] = mapped_column(
        Time, default=time(9), server_default="09:00"
    )
    quiet_end: Mapped[time] = mapped_column(
        Time, default=time(22), server_default="22:00"
    )
    # NULL is "not muted": until this moment the platform answers but never
    # opens the conversation itself.
    muted_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )
    # Set False by `python -m app.cli deactivate-user`: the session check and
    # the login check both read it, so an account can be closed without deleting
    # what it wrote.
    is_active: Mapped[bool] = mapped_column(default=True)
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
    # The panel lists one course's chats of one reader, newest first.
    __table_args__ = (
        Index("ix_chats_user_id_course_created_at", "user_id", "course", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    kind: Mapped[str] = mapped_column(String(16))
    model: Mapped[str] = mapped_column(String(128))
    title: Mapped[str | None] = mapped_column(String(60), default=None)
    # The course whose pages list the chat: the one it was started on, until the
    # reader files it elsewhere by hand. NULL is "General" — started off every
    # course, or the Telegram thread. It only decides where the chat is listed;
    # the tutor's tools still search every course.
    course: Mapped[str | None] = mapped_column(String(SLUG_LENGTH), default=None)
    # When that title was written. Nothing else says how much of the
    # conversation happened after it, which is what decides when the harness
    # writes a new one. NULL until a first message names the chat. The Telegram
    # thread is stamped like any other and then never renamed: it is one
    # eternal conversation and is never listed (`harness/title.py`).
    titled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )
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
    __table_args__ = (
        # The chat rail dates every chat of a reader in one pass — the maximum
        # `created_at` per `chat_id` — which an index on `chat_id` alone can
        # only serve by reading each of those rows, jsonb blobs and all, off
        # the heap. It is the only index on `chat_id` there is: this one is a
        # prefix match for every query a plain one would serve, and `messages`
        # is the table the platform writes to most.
        Index("ix_messages_chat_id_created_at", "chat_id", "created_at"),
    )

    # uuid7 is time-ordered, so `ORDER BY id` is the chat's message order and
    # no separate sequence column is needed.
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid7)
    chat_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("chats.id", ondelete="CASCADE")
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
        # Everything about one lesson reads the index above; the activity grid
        # and its feed ask about a reader's days across every lesson at once,
        # which that index cannot serve without scanning their whole history.
        Index("ix_events_user_ts", "user_id", "server_ts"),
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


class LessonPass(Base):
    """One day on which a reader met the reading bar on one lesson.

    `lesson_progress` answers "has this lesson been read"; this answers "which
    days did they read", which needs a row per day rather than one per lesson:
    coming back to a lesson a month later is reading, and it is what the
    activity grid on the profile counts.
    """

    __tablename__ = "lesson_passes"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    lesson: Mapped[str] = mapped_column(String(LESSON_LENGTH), primary_key=True)
    # The reader's own calendar date (users.timezone), not the server's: an
    # evening in Sydney is one square, and not tomorrow's.
    day: Mapped[date] = mapped_column(Date, primary_key=True)
    # When that day's events met the bar, derived from them rather than from
    # now() — the same rule `lesson_progress.completed_at` is written by.
    passed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Incident(Base):
    """A problem the tutor concluded is in the material, not in the learner.

    Filed by `report_content_incident`; triage is manual (psql) and nothing in
    the application reads this table.
    """

    __tablename__ = "incidents"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    # The report is about the content, so it outlives the conversation that
    # produced it: deleting a chat must not delete the evidence.
    chat_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("chats.id", ondelete="SET NULL"), default=None
    )
    locator: Mapped[str] = mapped_column(String(512))
    kind: Mapped[str] = mapped_column(String(16))
    summary: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(16), server_default="open")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class Schedule(Base):
    """One thing the platform intends to say to a learner on its own.

    `due_at` is when the row next needs attention and its status says what
    that attention is: a `pending` row fires, an `awaiting_reply` row counts
    as ignored. `payload` carries `note` — what the message is about, in
    words the run is given — and `topic`, the course or subject the rotation
    steers away from after an ignored message.
    """

    __tablename__ = "schedules"
    __table_args__ = (Index("ix_schedules_status_due_at", "status", "due_at"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    kind: Mapped[str] = mapped_column(String(16))
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB)
    status: Mapped[str] = mapped_column(String(16), default="pending")
    # Only a row a worker is holding carries a lease, which is what makes an
    # expired one exactly the set a dead worker left behind.
    claimed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )
    lease_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )
    created_by: Mapped[str] = mapped_column(String(8))
    attempts: Mapped[int] = mapped_column(default=0)
    # How a delivered message ended. Kept because the engagement machine that
    # reads it is designed from real ignore data, not guessed at now.
    outcome: Mapped[str | None] = mapped_column(String(16), default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class ReviewState(Base):
    """Where a learner stands on the review ladder of one lesson.

    The ladder is state of its own rather than something read back out of
    `schedules`: a schedule row is one delivery, and deliveries are retried,
    coalesced, cancelled and rebuilt. This row answers "which rung is this
    learner on for this lesson" through all of that, and its primary key is
    what makes a replayed completion start no second ladder.

    `next_due_at` NULL is a finished ladder — the last rung was passed, and
    nothing is scheduled again. The row stays: it is the history, and it is
    what keeps the finished ladder from being started over.
    """

    __tablename__ = "review_state"
    __table_args__ = (Index("ix_review_state_next_due_at", "next_due_at"),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    lesson: Mapped[str] = mapped_column(String(LESSON_LENGTH), primary_key=True)
    step: Mapped[int] = mapped_column(SmallInteger)
    last_outcome: Mapped[str | None] = mapped_column(String(16), default=None)
    next_due_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
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
    course_slug: Mapped[str | None] = mapped_column(String(SLUG_LENGTH), index=True)
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


class TgLink(Base):
    """The learner's Telegram account, and the state of the channel to it.

    One row per learner and one per Telegram chat: a phone that is already
    somebody's cannot become a second learner's. `broken` means the bot was
    blocked — the transport is down, and the poller leaves the learner alone
    until an incoming message proves it is back.
    """

    __tablename__ = "tg_links"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    tg_chat_id: Mapped[int] = mapped_column(BigInteger, unique=True)
    status: Mapped[str] = mapped_column(
        String(8), default="active", server_default="active"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class TgPairingCode(Base):
    """A one-time code behind a `t.me/<bot>?start=<code>` link.

    Whoever holds the string can attach their Telegram account to the learner
    it was issued for, so it is short-lived and spent on first use.
    """

    __tablename__ = "tg_pairing_codes"

    code: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )


class TgUpdateSeen(Base):
    """Update ids Telegram has already delivered.

    Telegram redelivers an update it got no answer to, and answering takes as
    long as a model run: without this table a slow reply is a second run over
    the same message.
    """

    __tablename__ = "tg_updates_seen"

    update_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class LabPairingCode(Base):
    """A one-time code the learner copies from a lab page into their notebook.

    Whoever holds the string can mint a token that speaks for the learner, so
    it is short-lived and spent on first use — the same bargain `tg_pairing_codes`
    strikes, which is why it is stored in the clear.
    """

    __tablename__ = "lab_pairing_codes"

    code: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )


class LabDeviceCode(Base):
    """A pairing the notebook starts: the code names an approval the learner
    clicks through in a signed-in browser, not a string they copy.

    Created unauthenticated, so `user_id` is whoever approved it — NULL until
    someone does. `approved_token_hash` is stamped when the poll that finds the
    approval mints the token: it marks the one release, after which the code
    answers nothing. The raw token exists only in the poll response that
    carries it to the notebook; this row keeps `sha256(token)`, as `lab_tokens`
    does.
    """

    __tablename__ = "lab_device_codes"

    code: Mapped[str] = mapped_column(String(64), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, default=None
    )
    approved_token_hash: Mapped[bytes | None] = mapped_column(LargeBinary, default=None)


class LabToken(Base):
    """What a paired notebook authenticates its checkpoint calls with.

    One token answers for every lab: pairing happens once per runtime session,
    not once per assignment. It never expires — a Colab notebook left open for
    a weekend must still submit — so `revoked_at` is the only way one ends.

    The raw token lives in the learner's notebook and nowhere else; the row
    holds `sha256(token)`, like a browser session's.
    """

    __tablename__ = "lab_tokens"

    token_hash: Mapped[bytes] = mapped_column(LargeBinary, primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    last_used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )

    user: Mapped[User] = relationship()


class LabChallenge(Base):
    """What one checkpoint of one lab is graded against.

    Written by `app.labs.ingest` from the build's private artifact, and
    deliberately not a `documents` row: the tutor quotes documents and search
    returns them, so an expected output, a held-out label or a rubric stored
    there would hand out the answers it exists to keep.

    `spec` is `{"public": ..., "private": ...}` — the manifest serves the
    public half whole and never reads the other, so nothing reaches a learner
    by being forgotten in a whitelist.
    """

    __tablename__ = "lab_challenges"

    lesson: Mapped[str] = mapped_column(String(LESSON_LENGTH), primary_key=True)
    checkpoint: Mapped[str] = mapped_column(String(CHECKPOINT_LENGTH), primary_key=True)
    kind: Mapped[str] = mapped_column(String(16))
    spec: Mapped[dict[str, Any]] = mapped_column(JSONB)
    # sha256 of the lab's sources, per lab and stored per row. A submission
    # carries the version its notebook was generated from, and the two must
    # agree or the reference it would be compared against is not the one the
    # learner computed for.
    content_version: Mapped[bytes] = mapped_column(LargeBinary)


class LabCheckpointState(Base):
    """Where one learner stands on one checkpoint."""

    __tablename__ = "lab_checkpoint_state"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    lesson: Mapped[str] = mapped_column(String(LESSON_LENGTH), primary_key=True)
    checkpoint: Mapped[str] = mapped_column(String(CHECKPOINT_LENGTH), primary_key=True)
    attempts: Mapped[int] = mapped_column(default=0, server_default="0")
    passed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )
    # The best a metric checkpoint has scored, never the last: a learner who
    # tries a worse model after passing has still passed.
    best_score: Mapped[float | None] = mapped_column(
        Numeric(asdecimal=False), default=None
    )
    feedback: Mapped[str | None] = mapped_column(Text, default=None)


class LabSubmission(Base):
    """One posted attempt and the verdict it was answered with.

    Append-only, with the notebook's own id as the key — the bargain `events`
    strikes: a post retried over a dropped connection returns the verdict it
    already earned instead of spending another attempt at it.
    """

    __tablename__ = "lab_submissions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    lesson: Mapped[str] = mapped_column(String(LESSON_LENGTH))
    checkpoint: Mapped[str] = mapped_column(String(CHECKPOINT_LENGTH))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    verdict: Mapped[dict[str, Any]] = mapped_column(JSONB)
    # What the model call cost, for the submissions that took one — the same
    # row `messages.usage` carries, summed by the same monthly ceiling. Null
    # for every checkpoint a comparison answered.
    usage: Mapped[dict[str, Any] | None] = mapped_column(JSONB, default=None)


# Rating and bookmark are keyed by the same `lesson:` locator `events` and
# `lesson_progress` carry, so a reader's votes, their reading and the corpus
# all name a lesson with one string.
class LessonRating(Base):
    __tablename__ = "lesson_ratings"
    # The API rejects anything else already; the constraint is what keeps the
    # column readable as a sum for the curator, who queries it in psql.
    __table_args__ = (CheckConstraint("value IN (-1, 1)", name="ck_rating_value"),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    lesson: Mapped[str] = mapped_column(String(LESSON_LENGTH), primary_key=True)
    value: Mapped[int] = mapped_column(SmallInteger)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class Bookmark(Base):
    __tablename__ = "bookmarks"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    lesson: Mapped[str] = mapped_column(String(LESSON_LENGTH), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# The handle the tutor writes a memory under and asks for it back by; long
# enough to name a fact in words, short enough that an index of them is a few
# lines of prompt. app/memory/repository.py validates the grammar.
MEMORY_SLUG_LENGTH = 64


class Memory(Base):
    """What the tutor knows about a learner, across every chat and medium.

    Only the index — slug and description — is in the system prompt of every
    run; `content` is fetched by `read_memory` when a description says it bears
    on the question. That is what lets a memory be a paragraph of context
    without the profile growing the prompt it rides in.

    Nothing derivable from telemetry belongs here: how far they read and which
    solutions they opened is `lesson_progress`, and the tutor asks for it.
    """

    __tablename__ = "memories"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    slug: Mapped[str] = mapped_column(String(MEMORY_SLUG_LENGTH), primary_key=True)
    description: Mapped[str] = mapped_column(Text)
    content: Mapped[str] = mapped_column(Text)
    # Who last wrote it. A learner who corrects their profile is telling the
    # tutor it got something wrong, and the page shows which lines are theirs.
    source: Mapped[str] = mapped_column(String(8))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
