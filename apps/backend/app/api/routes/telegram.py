import secrets
from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, status

from app.api.deps import SessionDep, SessionFactoryDep
from app.core.config import settings
from app.telegram import api, repository, updates

# Outside the versioned API on purpose: this URL is registered with Telegram
# once and answers to Telegram alone. Nothing a browser calls lives here.
router = APIRouter(prefix="/tg", tags=["telegram"])


@router.post("/webhook")
async def webhook(
    request: Request,
    session: SessionDep,
    session_factory: SessionFactoryDep,
    background: BackgroundTasks,
) -> dict[str, bool]:
    """Take one update and answer immediately.

    Telegram redelivers anything it does not get a prompt 200 for, and a run
    takes as long as a model does, so the work happens after the response. The
    update id is recorded first: a redelivery that arrives mid-run is dropped
    here rather than starting a second run over the same message.
    """
    if settings.TELEGRAM_WEBHOOK_SECRET is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "telegram is not configured")
    presented = request.headers.get(api.SECRET_HEADER, "")
    if not secrets.compare_digest(
        presented.encode(), settings.TELEGRAM_WEBHOOK_SECRET.encode()
    ):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "bad secret token")
    try:
        payload: dict[str, Any] = await request.json()
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "not json")
    update = updates.parse(payload)
    if update is None:
        return {"ok": True}
    if await repository.first_sighting(session, update.update_id):
        background.add_task(updates.handle, session_factory, update)
    return {"ok": True}
