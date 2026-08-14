from datetime import UTC, datetime, timedelta

import logfire
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel

from app.api.deps import CurrentUser, LessonKey, SessionDep
from app.api.size import size_limited
from app.core.config import settings
from app.core.rate_limit import FixedWindow, client_address, register
from app.labs import repository, verify
from app.labs.deps import LabUser
from app.labs.schemas import (
    MAX_SUBMISSION_BYTES,
    Device,
    Manifest,
    ManifestCheckpoint,
    Progress,
    Redemption,
    Submission,
    SubmissionResult,
    Token,
)

router = APIRouter(
    prefix="/labs", tags=["labs"], route_class=size_limited(MAX_SUBMISSION_BYTES)
)

CODES_PER_HOUR = 10
DEVICE_CODES_PER_HOUR = 10
DEVICE_POLLS_PER_MINUTE = 60
REDEEMS_PER_MINUTE = 30
SUBMISSIONS_PER_MINUTE = 60
DAY = timedelta(days=1)

# Keyed by user: a learner pairs once per runtime, and it is an account that
# could fill the table.
_codes = register(FixedWindow(CODES_PER_HOUR, window=timedelta(hours=1)))
# Keyed by address — issuance is the one unauthenticated way to write a row.
_device_codes = register(FixedWindow(DEVICE_CODES_PER_HOUR, window=timedelta(hours=1)))
# Keyed by code: the client asks every 3 s, so a well-behaved notebook spends a
# third of this, and a looping one is stopped without silencing the rest.
_device_polls = register(FixedWindow(DEVICE_POLLS_PER_MINUTE))
# One counter for everyone, under the empty key: the caller is unauthenticated
# and the code is the only thing it presents. Guessing one is not the concern —
# 128 bits of it — a looping client is.
_redeems = register(FixedWindow(REDEEMS_PER_MINUTE))
_submissions = register(FixedWindow(SUBMISSIONS_PER_MINUTE))
# The two kinds that cost the server real work, budgeted per checkpoint per
# day and charged by `repository.submit` for what it actually grades. An
# `exact` checkpoint is a comparison and needs no budget of its own.
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


@router.post("/pairing-code", status_code=status.HTTP_201_CREATED)
async def pairing_code(session: SessionDep, user: CurrentUser) -> PairingCode:
    _codes.check(str(user.id))
    code = await repository.issue_code(session, user.id, now=datetime.now(UTC))
    return PairingCode(code=code.code, expires_at=code.expires_at)


@router.post("/device", status_code=status.HTTP_201_CREATED)
async def device(request: Request, session: SessionDep) -> Device:
    """Start a pairing from the notebook: no auth, because the whole point is
    that the kernel has none — the learner's browser supplies it at the
    approval URL this hands back."""
    _device_codes.check(client_address(request))
    row = await repository.issue_device(session, now=datetime.now(UTC))
    return Device(
        code=row.code,
        approve_url=f"{settings.FRONTEND_HOST}/labs/pair/{row.code}",
        expires_at=row.expires_at,
    )


@router.post("/device/{code}/approve", status_code=status.HTTP_204_NO_CONTENT)
async def approve_device(code: str, user: CurrentUser, session: SessionDep) -> None:
    """The click on the site that points a waiting notebook at this account."""
    try:
        await repository.approve_device(session, code, user.id, now=datetime.now(UTC))
    except repository.PairingRejected as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))


@router.get("/device/{code}")
async def poll_device(code: str, session: SessionDep) -> Token:
    """The notebook's side of the wait: plain polling, one answer.

    428 while the learner has not approved, the token exactly once when they
    have, 410 from then on and after expiry — the codes the client's loop is
    built against.
    """
    _device_polls.check(code)
    try:
        token = await repository.poll_device(session, code, now=datetime.now(UTC))
    except repository.DevicePending:
        raise HTTPException(status.HTTP_428_PRECONDITION_REQUIRED, "not approved yet")
    except repository.DeviceGone as exc:
        raise HTTPException(status.HTTP_410_GONE, str(exc))
    except repository.PairingRejected as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc))
    return Token(token=token)


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
    unbuilt = [entry.id for entry in declared.checkpoints if entry.id not in built]
    if unbuilt:
        # The two halves came from different builds: `make reindex` runs them
        # together, but the commands are separable and the skew is otherwise
        # silent — the notebook is never asked for these, while the page goes
        # on counting them towards a total the learner cannot reach.
        logfire.error(
            "a lab declares checkpoints the build never produced",
            lesson=key,
            checkpoints=unbuilt,
        )
    return Manifest(
        lesson=key,
        content_version=next(iter(built.values())).content_version.hex(),
        data_files=declared.data_files,
        checkpoints=[
            ManifestCheckpoint(
                id=entry.id,
                # From the row that will grade it, not from the index: the two
                # are separate ingests, and a documents-only reindex would
                # otherwise advertise a kind the grader has never agreed to.
                kind=built[entry.id].kind,
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
    # A day's attempts at this one checkpoint, spent by `submit` before the
    # grading it bounds and given back when nothing was graded: a retry of an
    # id already answered, a payload the checkpoint refuses and a judging the
    # platform could not do all cost the learner nothing.
    key = f"{user.id}:{posted.lesson}:{posted.checkpoint}"

    def spend(kind: str) -> None:
        budget = _daily_budgets.get(kind)
        if budget is not None:
            budget.check(key)

    def refund(kind: str) -> None:
        budget = _daily_budgets.get(kind)
        if budget is not None:
            budget.refund(key)

    try:
        return await repository.submit(
            session,
            user.id,
            posted,
            now=datetime.now(UTC),
            budget=repository.Budget(spend=spend, refund=refund),
        )
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
