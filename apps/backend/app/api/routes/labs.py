from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.api.deps import CurrentUser, LessonKey, SessionDep
from app.api.size import size_limited
from app.core.config import settings
from app.core.rate_limit import FixedWindow, register
from app.labs import repository, verify
from app.labs.deps import LabUser
from app.labs.schemas import (
    MAX_SUBMISSION_BYTES,
    Manifest,
    ManifestCheckpoint,
    Progress,
    Submission,
    SubmissionResult,
)

router = APIRouter(
    prefix="/labs", tags=["labs"], route_class=size_limited(MAX_SUBMISSION_BYTES)
)

CODES_PER_HOUR = 10
REDEEMS_PER_MINUTE = 30
SUBMISSIONS_PER_MINUTE = 60
DAY = timedelta(days=1)

# Keyed by user: a learner pairs once per runtime, and it is an account that
# could fill the table.
_codes = register(FixedWindow(CODES_PER_HOUR, window=timedelta(hours=1)))
# One counter for everyone, under the empty key: the caller is unauthenticated
# and the code is the only thing it presents. Guessing one is not the concern —
# 128 bits of it — a looping client is.
_redeems = register(FixedWindow(REDEEMS_PER_MINUTE))
_submissions = register(FixedWindow(SUBMISSIONS_PER_MINUTE))
# The two kinds that cost the server real work, budgeted per checkpoint per
# day. An `exact` checkpoint is a comparison and needs no budget of its own.
_daily_budgets = {
    "metric": register(FixedWindow(settings.LAB_METRIC_ATTEMPTS_PER_DAY, window=DAY)),
    "review": register(FixedWindow(settings.LAB_REVIEW_ATTEMPTS_PER_DAY, window=DAY)),
}


# Not `Pairing`: `routes/settings.py` already publishes one under that name, and
# two same-named models in one app cost both of them their OpenAPI component
# names.
class PairingCode(BaseModel):
    code: str
    expires_at: datetime


class Redemption(BaseModel):
    code: str


class Token(BaseModel):
    token: str


@router.post("/pairing-code", status_code=status.HTTP_201_CREATED)
async def pairing_code(session: SessionDep, user: CurrentUser) -> PairingCode:
    _codes.check(str(user.id))
    code = await repository.issue_code(session, user.id, now=datetime.now(UTC))
    return PairingCode(code=code.code, expires_at=code.expires_at)


@router.post("/pair")
async def pair(body: Redemption, session: SessionDep) -> Token:
    """Exchange a code for the token the notebook holds from here on.

    No auth: the code is the credential, and whoever runs the notebook has no
    session to present.
    """
    _redeems.check("")
    try:
        token = await repository.redeem(session, body.code, now=datetime.now(UTC))
    except repository.PairingRejected as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))
    return Token(token=token)


@router.get("/{course}/{lesson}/manifest")
async def manifest(key: LessonKey, session: SessionDep) -> Manifest:
    """Everything the notebook needs to compute a checkpoint and post it.

    Public, and public by construction rather than by filtering: what it hands
    out of a challenge is the half the build published, served whole. Served
    from here rather than from the mirror so that a manifest and the answer key
    it will be graded against are the same ingest — the learner computes on the
    inputs the expected outputs beside them were captured from.
    """
    declared = await repository.lab(session, key)
    built = await repository.challenges(session, key)
    if declared is None or not built:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "no lab at that lesson")
    return Manifest(
        lesson=key,
        content_version=next(iter(built.values())).content_version.hex(),
        data_files=declared.data_files,
        checkpoints=[
            ManifestCheckpoint(
                id=entry.id,
                kind=entry.kind,
                text=entry.text,
                required=entry.required,
                spec=built[entry.id].spec["public"],
            )
            # A checkpoint the index declares but the build has not produced
            # cannot be verified, so the notebook is not asked to attempt it.
            for entry in declared.checkpoints
            if entry.id in built
        ],
    )


@router.post("/submissions")
async def submissions(
    posted: Submission, user: LabUser, session: SessionDep
) -> SubmissionResult:
    _submissions.check(str(user.id))
    kind = await repository.kind_of(session, posted.lesson, posted.checkpoint)
    budget = _daily_budgets.get(kind) if kind is not None else None
    if budget is not None:
        budget.check(f"{user.id}:{posted.lesson}:{posted.checkpoint}")
    try:
        return await repository.submit(session, user.id, posted, now=datetime.now(UTC))
    except repository.UnknownCheckpoint as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc))
    except (repository.VersionMismatch, repository.IdReused) as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc))
    except verify.Rejected as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))


@router.get("/{course}/{lesson}/progress")
async def progress(key: LessonKey, user: CurrentUser, session: SessionDep) -> Progress:
    """What the lesson page draws: the cookie session answers here, because the
    reader is in a browser rather than in the notebook."""
    standing = await repository.standing(session, user.id, key)
    if standing is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "no lab at that lesson")
    return standing
