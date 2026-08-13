import secrets
import uuid
from collections.abc import Callable
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import delete, func, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.content import search
from app.core.sessions import token_hash
from app.labs import verify
from app.labs.schemas import (
    CheckpointProgress,
    Completion,
    Progress,
    Submission,
    SubmissionResult,
)
from app.models import (
    Document,
    LabChallenge,
    LabCheckpointState,
    LabPairingCode,
    LabSubmission,
    LabToken,
    User,
)
from app.review import repository as review
from app.telemetry import progress
from app.telemetry.ingest import emit_completion

# Short enough to be spent in one sitting: whoever holds the string can mint a
# token that speaks for the learner it was issued for.
CODE_TTL = timedelta(minutes=10)
CODE_BYTES = 16
TOKEN_BYTES = 32
# The token outlives every notebook session, so the row is stamped for the
# operator rather than for expiry — and a checkpoint call must not cost an
# UPDATE, which is the same bargain `core/sessions.py` strikes.
USE_INTERVAL = timedelta(days=1)


class PairingRejected(Exception):
    """Why a code did not become a token, in words the learner is told."""


async def issue_code(
    session: AsyncSession, user_id: uuid.UUID, *, now: datetime
) -> LabPairingCode:
    code = LabPairingCode(
        code=secrets.token_urlsafe(CODE_BYTES),
        user_id=user_id,
        expires_at=now + CODE_TTL,
    )
    session.add(code)
    await session.commit()
    return code


async def redeem(session: AsyncSession, code: str, *, now: datetime) -> str:
    """Spend a pairing code and mint the token the notebook keeps.

    The code is the credential, so the checks are on the code itself — that it
    exists, has not been spent, and has not aged out. The row is locked for the
    length of that, so two notebooks redeeming the same code at the same moment
    mint one token: the loser skips the locked row and is told the code is not
    one of ours.

    The raw token is returned here and nowhere else; only its hash is stored.
    """
    row = await session.scalar(
        select(LabPairingCode)
        .where(LabPairingCode.code == code)
        .with_for_update(skip_locked=True)
    )
    if row is None:
        raise PairingRejected("that code is not one of ours")
    if row.used_at is not None:
        raise PairingRejected("that code has already been used")
    if row.expires_at <= now:
        raise PairingRejected("that code has expired")
    row.used_at = now
    token = secrets.token_urlsafe(TOKEN_BYTES)
    session.add(LabToken(token_hash=token_hash(token), user_id=row.user_id))
    await session.commit()
    return token


async def authenticate(
    session: AsyncSession, token: str, *, now: datetime
) -> User | None:
    row = await session.scalar(
        select(LabToken)
        .options(joinedload(LabToken.user))
        .where(
            LabToken.token_hash == token_hash(token),
            LabToken.revoked_at.is_(None),
        )
    )
    if row is None:
        return None
    if row.last_used_at is None or now - row.last_used_at >= USE_INTERVAL:
        row.last_used_at = now
        await session.commit()
    return row.user


async def revoke_all(
    session: AsyncSession, user_id: uuid.UUID, *, now: datetime
) -> None:
    """Uncommitted, like the `sessions.revoke_user` it stands beside: ending an
    account's credentials ends the browser's and the notebook's together or
    neither, in the caller's transaction."""
    await session.execute(
        update(LabToken)
        .where(LabToken.user_id == user_id, LabToken.revoked_at.is_(None))
        .values(revoked_at=now)
    )


async def prune(session: AsyncSession, now: datetime) -> None:
    """Codes nothing will read again. Uncommitted: this is one sweep of the
    poller's housekeeping pass, which commits them together."""
    await session.execute(delete(LabPairingCode).where(LabPairingCode.expires_at < now))


class UnknownCheckpoint(Exception):
    """No challenge is stored for what the submission names."""


class VersionMismatch(Exception):
    """The notebook was generated from a build the answer key has outlived."""


class IdReused(Exception):
    """A submission id that already answered a different checkpoint."""


@dataclass(frozen=True)
class Checkpoint:
    """One checkpoint as the content index carries it: the wording the page
    and the notebook show, and whether completion waits for it."""

    id: str
    kind: str
    text: str
    required: bool


@dataclass(frozen=True)
class Lab:
    checkpoints: list[Checkpoint]
    data_files: list[str]


async def lab(session: AsyncSession, lesson: str) -> Lab | None:
    """What the index says this lab asks for, in display order.

    The lesson's whole `lab` block is mirrored onto each of its chunks, so the
    first chunk answers for the lesson — the same read `telemetry/progress.py`
    makes for the word count.
    """
    meta: dict[str, Any] | None = await session.scalar(
        select(Document.meta)
        .where(search.chunks_of(lesson))
        .order_by(Document.position)
        .limit(1)
    )
    declared = (meta or {}).get("lab")
    if declared is None:
        return None
    return Lab(
        checkpoints=[
            Checkpoint(
                id=entry["id"],
                kind=entry["kind"],
                text=entry["text"],
                required=entry["required"],
            )
            for entry in sorted(declared["checkpoints"], key=lambda e: e["order"])
        ],
        # A lesson indexed before the field existed lists none rather than
        # costing the whole lab its manifest.
        data_files=declared.get("data_files", []),
    )


async def challenges(session: AsyncSession, lesson: str) -> dict[str, LabChallenge]:
    rows = await session.scalars(
        select(LabChallenge).where(LabChallenge.lesson == lesson)
    )
    return {row.checkpoint: row for row in rows}


async def states(
    session: AsyncSession, user_id: uuid.UUID, lesson: str
) -> dict[str, LabCheckpointState]:
    rows = await session.scalars(
        select(LabCheckpointState).where(
            LabCheckpointState.user_id == user_id, LabCheckpointState.lesson == lesson
        )
    )
    return {row.checkpoint: row for row in rows}


async def standing(
    session: AsyncSession, user_id: uuid.UUID, lesson: str
) -> Progress | None:
    """Every checkpoint the index declares, and where this learner stands on it.

    Declared rather than stored: a checkpoint nobody has attempted is part of
    the lab and shows on the page, with the zeroes that says.
    """
    declared = await lab(session, lesson)
    if declared is None:
        return None
    stored = await states(session, user_id, lesson)
    checkpoints = []
    for entry in declared.checkpoints:
        state = stored.get(entry.id)
        checkpoints.append(
            CheckpointProgress(
                id=entry.id,
                kind=entry.kind,
                required=entry.required,
                attempts=state.attempts if state else 0,
                passed_at=state.passed_at if state else None,
                best_score=state.best_score if state else None,
                feedback=state.feedback if state else None,
            )
        )
    return Progress(checkpoints=checkpoints)


async def submit(
    session: AsyncSession,
    user_id: uuid.UUID,
    posted: Submission,
    *,
    now: datetime,
    spend: Callable[[str], None] | None = None,
) -> SubmissionResult:
    """Grade one posted checkpoint and record what it changed, in one transaction.

    The lock is telemetry's, on the same (learner, lesson) key. It is what makes
    the duplicate check below a real one — a retry of a submission still in
    flight waits for it rather than grading the same id twice — and what lets
    `emit_completion` decide about the completion event alone.

    `spend` is what the checkpoint's kind costs the caller's budget, called
    once for a submission that is about to be graded and never for one this
    function answers from the log or turns away.
    """
    await progress.lock(session, user_id, posted.lesson)
    stored = await session.get(LabSubmission, posted.id)
    if stored is not None:
        if (stored.user_id, stored.lesson, stored.checkpoint) != (
            user_id,
            posted.lesson,
            posted.checkpoint,
        ):
            raise IdReused("that submission id already answered another checkpoint")
        return SubmissionResult(
            **stored.verdict,
            progress=await _completion(session, user_id, posted.lesson),
        )

    challenge = await session.get(LabChallenge, (posted.lesson, posted.checkpoint))
    if challenge is None:
        raise UnknownCheckpoint("this lab has no such checkpoint")
    if challenge.content_version != bytes.fromhex(posted.content_version):
        raise VersionMismatch(
            "this lab has been rebuilt since your notebook was generated"
        )

    if spend is not None:
        spend(challenge.kind)
    verdict = verify.verify(challenge.kind, challenge.spec["private"], posted.payload)
    session.add(
        LabSubmission(
            id=posted.id,
            user_id=user_id,
            lesson=posted.lesson,
            checkpoint=posted.checkpoint,
            verdict=asdict(verdict),
        )
    )
    await _record_attempt(session, user_id, posted, verdict, now)
    completion = await _completion(session, user_id, posted.lesson)
    if verdict.passed and completion.passed_required == completion.total_required > 0:
        # A lab is a lesson, so finishing one is the completion the rest of the
        # platform already knows: the `lesson_completed` event and the review
        # ladder that subscribes to it. The absence of that event is what makes
        # it fire once, read under the lock above.
        await emit_completion(session, user_id, posted.lesson, now)
        # And the projection everything outside telemetry reads completion from
        # (the tutor, the profile): it is derived from the events, so the event
        # above only counts once it has been re-derived. Here rather than in a
        # later flush, because a lab nobody read has no later flush.
        await progress.recompute(session, user_id, posted.lesson)
        await review.start(session, user_id, posted.lesson, now)
    await session.commit()
    return SubmissionResult(**asdict(verdict), progress=completion)


async def _record_attempt(
    session: AsyncSession,
    user_id: uuid.UUID,
    posted: Submission,
    verdict: verify.Verdict,
    now: datetime,
) -> None:
    statement = insert(LabCheckpointState).values(
        user_id=user_id,
        lesson=posted.lesson,
        checkpoint=posted.checkpoint,
        attempts=1,
        passed_at=now if verdict.passed else None,
        best_score=verdict.score,
        feedback=verdict.hint,
    )
    await session.execute(
        statement.on_conflict_do_update(
            index_elements=["user_id", "lesson", "checkpoint"],
            set_={
                "attempts": LabCheckpointState.attempts + 1,
                # The first pass is the one that counts: a later attempt cannot
                # un-pass a checkpoint, and the ladder opens from the instant
                # the lab was actually finished.
                "passed_at": func.coalesce(
                    LabCheckpointState.passed_at, statement.excluded.passed_at
                ),
                # greatest() ignores nulls in Postgres, so a first score sets it
                # and a worse later one leaves it alone.
                "best_score": func.greatest(
                    LabCheckpointState.best_score, statement.excluded.best_score
                ),
                "feedback": statement.excluded.feedback,
            },
        )
    )


async def _completion(
    session: AsyncSession, user_id: uuid.UUID, lesson: str
) -> Completion:
    declared = await lab(session, lesson)
    required = (
        {entry.id for entry in declared.checkpoints if entry.required}
        if declared is not None
        else set()
    )
    passed = await states(session, user_id, lesson)
    return Completion(
        passed_required=sum(
            1
            for checkpoint in required
            if checkpoint in passed and passed[checkpoint].passed_at is not None
        ),
        total_required=len(required),
    )
