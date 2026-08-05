from fastapi import APIRouter, status

from app.api.deps import CurrentUser, SessionDep
from app.core.rate_limit import FixedWindow
from app.telemetry import ingest
from app.telemetry.schemas import MAX_BATCHES_PER_MINUTE, EventBatch

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

# Keyed by user, not by address: a household behind one address reads several
# lessons at once, and it is an account that could flood the table.
_flushes = FixedWindow(MAX_BATCHES_PER_MINUTE)


# Only signed-in readers are tracked, which the dependency states: an anonymous
# visitor gets 401 and leaves no row anywhere.
@router.post("/events", status_code=status.HTTP_204_NO_CONTENT)
async def events(batch: EventBatch, user: CurrentUser, session: SessionDep) -> None:
    _flushes.check(str(user.id))
    await ingest.record(session, user.id, batch)
