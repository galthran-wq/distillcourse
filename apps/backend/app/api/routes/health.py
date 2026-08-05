from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import text

from app.api.deps import SessionDep

router = APIRouter(prefix="/health", tags=["health"])


class Health(BaseModel):
    status: Literal["ok"]


# The query is the point: compose gates the backend on this endpoint, and a
# process that cannot reach Postgres is not ready to serve.
@router.get("")
async def health(session: SessionDep) -> Health:
    await session.execute(text("SELECT 1"))
    return Health(status="ok")
