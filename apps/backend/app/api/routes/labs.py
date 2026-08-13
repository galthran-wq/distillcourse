from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.api.deps import CurrentUser, SessionDep
from app.core.rate_limit import FixedWindow, register
from app.labs import repository

router = APIRouter(prefix="/labs", tags=["labs"])

CODES_PER_HOUR = 10
REDEEMS_PER_MINUTE = 30

# Keyed by user: a learner pairs once per runtime, and it is an account that
# could fill the table.
_codes = register(FixedWindow(CODES_PER_HOUR, window=timedelta(hours=1)))
# One counter for everyone, under the empty key: the caller is unauthenticated
# and the code is the only thing it presents. Guessing one is not the concern —
# 128 bits of it — a looping client is.
_redeems = register(FixedWindow(REDEEMS_PER_MINUTE))


class Pairing(BaseModel):
    code: str
    expires_at: datetime


class Redemption(BaseModel):
    code: str


class Token(BaseModel):
    token: str


@router.post("/pairing-code", status_code=status.HTTP_201_CREATED)
async def pairing_code(session: SessionDep, user: CurrentUser) -> Pairing:
    _codes.check(str(user.id))
    code = await repository.issue_code(session, user.id, now=datetime.now(UTC))
    return Pairing(code=code.code, expires_at=code.expires_at)


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
