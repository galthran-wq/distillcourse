import secrets
import uuid
from collections.abc import Callable, Collection
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import delete, func, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.content import search
from app.core.sessions import token_hash
from app.labs import judge, verify
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
    LabDeviceCode,
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


class DevicePending(Exception):
    """The learner has not clicked Approve yet; the notebook asks again."""


class DeviceGone(Exception):
    """Nothing more will come of this code, in words the learner is told."""


async def issue_device(session: AsyncSession, *, now: datetime) -> LabDeviceCode:
    """A pairing the notebook starts, before anyone has signed in for it.

    Unauthenticated on purpose — the caller is a kernel with no session — so
    the row binds nobody until an approval does. Whoever holds the string can
    only ever approve it onto their own account, which is why creating one is
    rate-limited rather than guarded.
    """
    row = LabDeviceCode(
        code=secrets.token_urlsafe(CODE_BYTES), expires_at=now + CODE_TTL
    )
    session.add(row)
    await session.commit()
    return row


async def approve_device(
    session: AsyncSession, code: str, user_id: uuid.UUID, *, now: datetime
) -> None:
    """Bind the signed-in learner to a pairing their notebook started.

    First approval wins and is the only one: a code that already names an
    account is refused whoever asks — including that same account — so a spent
    code cannot be re-pointed while the notebook is still polling for it.
    """
    row = await session.scalar(
        select(LabDeviceCode).where(LabDeviceCode.code == code).with_for_update()
    )
    if row is None:
        raise PairingRejected("that code is not one of ours")
    if row.expires_at <= now:
        raise PairingRejected("that code has expired")
    if row.user_id is not None:
        raise PairingRejected("that code has already been approved")
    row.user_id = user_id
    await session.commit()


async def poll_device(session: AsyncSession, code: str, *, now: datetime) -> str:
    """The notebook asking whether its approval has happened yet.

    The token is minted here, in the request that carries it away, rather than
    at approval: the raw string has to reach the notebook in some response, and
    minting it in that one is what keeps it out of the database. What approval
    left behind is `user_id`; what the release leaves behind is the token's
    hash, which is also the mark that makes this a one-time answer.

    The row is locked without `skip_locked`, unlike `redeem`: the only
    contender is the same code polled or approved twice at once, and the loser
    must see what the winner wrote — a released code, an approval — rather than
    be told the code does not exist.
    """
    row = await session.scalar(
        select(LabDeviceCode).where(LabDeviceCode.code == code).with_for_update()
    )
    if row is None:
        raise PairingRejected("that code is not one of ours")
    if row.approved_token_hash is not None:
        raise DeviceGone("that code has already delivered its token")
    if row.expires_at <= now:
        raise DeviceGone("the approval expired — run distill.login() again")
    if row.user_id is None:
        raise DevicePending
    token = secrets.token_urlsafe(TOKEN_BYTES)
    hashed = token_hash(token)
    session.add(LabToken(token_hash=hashed, user_id=row.user_id))
    row.approved_token_hash = hashed
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
    await session.execute(delete(LabDeviceCode).where(LabDeviceCode.expires_at < now))


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

    @property
    def required(self) -> set[str]:
        return {entry.id for entry in self.checkpoints if entry.required}


def _declared(block: dict[str, Any]) -> Lab:
    return Lab(
        checkpoints=[
            Checkpoint(
                id=entry["id"],
                kind=entry["kind"],
                text=entry["text"],
                required=entry["required"],
            )
            for entry in sorted(block["checkpoints"], key=lambda e: e["order"])
        ],
        # A lesson indexed before the field existed lists none rather than
        # costing the whole lab its manifest.
        data_files=block.get("data_files", []),
    )


async def lab(session: AsyncSession, lesson: str) -> Lab | None:
    """What the index says this lab asks for, in display order.

    The lesson's whole `lab` block is mirrored onto each of its chunks, so the
    first chunk answers for the lesson — the same read `telemetry/progress.py`
    makes for the word count.
    """
    block: dict[str, Any] | None = await session.scalar(
        select(Document.meta["lab"])
        .where(search.chunks_of(lesson))
        .order_by(Document.position)
        .limit(1)
    )
    return None if block is None else _declared(block)


async def finished(
    session: AsyncSession, user_id: uuid.UUID, lessons: Collection[str]
) -> dict[str, bool]:
    """Which of these lessons are labs, and whether this learner has finished
    each — `lab` and `_completion` for many lessons at once."""
    # Grouped by the document a chunk belongs to, as `_solutions_total` in
    # telemetry/progress.py does, with the first chunk answering for each.
    document = func.split_part(Document.locator, "#", 1)
    rows = await session.execute(
        select(document, Document.meta["lab"])
        .where(document.in_(lessons))
        .distinct(document)
        .order_by(document, Document.position)
    )
    required = {
        lesson: _declared(block).required for lesson, block in rows if block is not None
    }
    if not required:
        return {}
    passed: dict[str, set[str]] = {lesson: set() for lesson in required}
    for lesson, checkpoint in await session.execute(
        select(LabCheckpointState.lesson, LabCheckpointState.checkpoint).where(
            LabCheckpointState.user_id == user_id,
            LabCheckpointState.lesson.in_(required),
            LabCheckpointState.passed_at.is_not(None),
        )
    ):
        passed[lesson].add(checkpoint)
    return {
        lesson: _tally(ids, passed[lesson]).done for lesson, ids in required.items()
    }


async def submitted(
    session: AsyncSession, user_id: uuid.UUID, *, course: str | None = None
) -> dict[str, datetime]:
    """Every lab this learner has submitted to, with when they last did — a
    notebook is worked in without the lesson page open, so the page's events
    alone would not know the lab was started."""
    statement = select(LabSubmission.lesson, func.max(LabSubmission.created_at)).where(
        LabSubmission.user_id == user_id
    )
    if course is not None:
        statement = statement.where(progress.in_course(LabSubmission.lesson, course))
    rows = await session.execute(statement.group_by(LabSubmission.lesson))
    return dict(rows.tuples().all())


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
                attempts=state.attempts if state else 0,
                passed_at=state.passed_at if state else None,
                best_score=state.best_score if state else None,
                feedback=state.feedback if state else None,
            )
        )
    return Progress(checkpoints=checkpoints)


@dataclass(frozen=True)
class Budget:
    """A day's attempts at one checkpoint, as the caller counts them.

    Two calls rather than one because grading a `review` checkpoint is a model
    call: what bounds a model call has to be spent before it is made, and given
    back when it turns out nothing was graded.
    """

    spend: Callable[[str], None]
    refund: Callable[[str], None]


async def submit(
    session: AsyncSession,
    user_id: uuid.UUID,
    posted: Submission,
    *,
    now: datetime,
    budget: Budget | None = None,
) -> SubmissionResult:
    """Grade one posted checkpoint and record what it changed.

    The lock is telemetry's, on the same (learner, lesson) key. It is what makes
    the duplicate check a real one — a retry of a submission still in flight
    waits for it rather than grading the same id twice — and what lets
    `emit_completion` decide about the completion event alone.

    A `review` checkpoint is decided by a model, and nothing that waits on a
    model may hold that lock or a pooled connection while it does — the harness
    claims its chat and commits for the same reason. So that one kind is graded
    between two transactions rather than inside one: the checks below, then the
    judging with nothing held, then the writing half under the lock again, with
    the duplicate check asked a second time under it.

    `budget` is what the checkpoint's kind costs the caller, spent before the
    grading it bounds and given back when nothing was graded.
    """
    await progress.lock(session, user_id, posted.lesson)
    answered = await _answered(session, user_id, posted)
    if answered is not None:
        return answered

    challenge = await session.get(LabChallenge, (posted.lesson, posted.checkpoint))
    if challenge is None:
        raise UnknownCheckpoint("this lab has no such checkpoint")
    if challenge.content_version != bytes.fromhex(posted.content_version):
        raise VersionMismatch(
            "this lab has been rebuilt since your notebook was generated"
        )

    kind, private = challenge.kind, challenge.spec["private"]
    if budget is not None:
        budget.spend(kind)
    # A `review` checkpoint is the only kind a comparison cannot answer and the
    # only one that costs the deployment a model call, which is why it is also
    # the only one with anything to record about what answering it spent.
    usage: dict[str, Any] | None = None
    graded = False
    try:
        if kind == "review":
            verdict, usage = await judge.grade(session, private, posted)
            # `grade` let the lock go to make its call, so this is the second
            # time of asking: a retry of this id may have been answered whole
            # while the model was thinking, and that verdict is the one that
            # stands.
            await progress.lock(session, user_id, posted.lesson)
            answered = await _answered(session, user_id, posted)
            if answered is not None:
                return answered
        else:
            verdict = verify.verify(kind, private, posted.payload)
        graded = not verdict.pending
    finally:
        # The day's attempt buys a judgement, not an attempt at one: a payload
        # the checkpoint refuses, an outage, a ceiling the deployment has spent
        # — none of it is the learner's doing, and none of it costs them a
        # checkpoint they can no longer answer today.
        if budget is not None and not graded:
            budget.refund(kind)
    session.add(
        LabSubmission(
            id=posted.id,
            user_id=user_id,
            lesson=posted.lesson,
            checkpoint=posted.checkpoint,
            verdict=asdict(verdict),
            usage=usage,
        )
    )
    await _record_attempt(session, user_id, posted, verdict, now)
    completion = await _completion(session, user_id, posted.lesson)
    if verdict.passed and completion.done:
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


async def _answered(
    session: AsyncSession, user_id: uuid.UUID, posted: Submission
) -> SubmissionResult | None:
    """The verdict this submission id already earned, if it has one.

    The notebook mints the id, so this is an idempotency key: a post retried
    over a dropped connection is told what the first one decided, and the same
    id answering a second checkpoint is a client bug rather than a retry.
    """
    stored = await session.get(LabSubmission, posted.id)
    if stored is None:
        return None
    if (stored.user_id, stored.lesson, stored.checkpoint) != (
        user_id,
        posted.lesson,
        posted.checkpoint,
    ):
        raise IdReused("that submission id already answered another checkpoint")
    return SubmissionResult(
        **stored.verdict, progress=await _completion(session, user_id, posted.lesson)
    )


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
        # A judging that never happened has nothing to say — the same rule the
        # conflict branch below states, on the first attempt: a pending
        # verdict's hint is about the platform, and the page shows what is
        # stored here as the judge's feedback.
        feedback=None if verdict.pending else verdict.hint,
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
                # A judging that never happened has nothing to say, and what
                # the page shows is the last thing that was actually decided.
                "feedback": (
                    LabCheckpointState.feedback
                    if verdict.pending
                    else statement.excluded.feedback
                ),
            },
        )
    )


async def _completion(
    session: AsyncSession, user_id: uuid.UUID, lesson: str
) -> Completion:
    declared = await lab(session, lesson)
    stored = await states(session, user_id, lesson)
    return _tally(
        declared.required if declared is not None else set(),
        {checkpoint for checkpoint, state in stored.items() if state.passed_at},
    )


def _tally(required: set[str], passed: set[str]) -> Completion:
    return Completion(
        passed_required=len(required & passed), total_required=len(required)
    )
