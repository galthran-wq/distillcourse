import uuid
from datetime import datetime
from typing import Any, Literal

from fastapi import APIRouter, HTTPException, Request, Response, status
from pydantic import BaseModel, ValidationError
from pydantic_ai.ui.vercel_ai import VercelAIAdapter
from pydantic_ai.ui.vercel_ai.request_types import RequestData

from app.api.deps import CurrentUser, SessionDep, SessionFactoryDep
from app.core.config import ChatModel, settings
from app.harness import runner
from app.harness.agent import tutor
from app.harness.deps import HarnessDeps
from app.harness.limits import LimitExceeded, check_run_allowed
from app.harness.repository import HarnessRepository
from app.models import Chat

router = APIRouter(prefix="/chats", tags=["chats"])

LOCATOR_LENGTH = 200


class ChatSummary(BaseModel):
    id: uuid.UUID
    kind: str
    model: str
    title: str | None
    created_at: datetime


class NewChat(BaseModel):
    kind: Literal["web", "telegram"] = "web"
    model: str | None = None


class ChatModelUpdate(BaseModel):
    model: str


class Summary(BaseModel):
    summary: str


def _summary(chat: Chat) -> ChatSummary:
    return ChatSummary(
        id=chat.id,
        kind=chat.kind,
        model=chat.model,
        title=chat.title,
        created_at=chat.created_at,
    )


def _current_locator(run_input: RequestData) -> str | None:
    """The reader's position, sent by the widget alongside the messages."""
    locator = (run_input.model_extra or {}).get("currentLocator")
    return locator[:LOCATOR_LENGTH] if isinstance(locator, str) else None


async def _owned_chat(repo: HarnessRepository, chat_id: uuid.UUID) -> Chat:
    chat = await repo.get_chat(chat_id)
    if chat is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "no such chat")
    return chat


@router.get("/models")
async def models() -> list[ChatModel]:
    return settings.CHAT_MODELS


@router.get("")
async def index(session: SessionDep, user: CurrentUser) -> list[ChatSummary]:
    repo = HarnessRepository(session, user.id)
    return [_summary(chat) for chat in await repo.list_chats()]


@router.post("")
async def create(
    new: NewChat, session: SessionDep, user: CurrentUser
) -> ChatSummary:
    if new.model is not None and new.model not in settings.chat_model_pool:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "unknown model")
    repo = HarnessRepository(session, user.id)
    return _summary(await repo.create_chat(kind=new.kind, model=new.model))


@router.patch("/{chat_id}")
async def set_model(
    chat_id: uuid.UUID,
    update: ChatModelUpdate,
    session: SessionDep,
    user: CurrentUser,
) -> ChatSummary:
    if update.model not in settings.chat_model_pool:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "unknown model")
    repo = HarnessRepository(session, user.id)
    chat = await _owned_chat(repo, chat_id)
    await repo.set_model(chat, update.model)
    return _summary(chat)


@router.get("/{chat_id}/messages")
async def messages(
    chat_id: uuid.UUID, session: SessionDep, user: CurrentUser
) -> list[dict[str, Any]]:
    repo = HarnessRepository(session, user.id)
    chat = await _owned_chat(repo, chat_id)
    return [ui for row in await repo.rows(chat) for ui in row.projection]


@router.post("/{chat_id}/compact")
async def compact(
    chat_id: uuid.UUID, session: SessionDep, user: CurrentUser
) -> Summary:
    repo = HarnessRepository(session, user.id)
    chat = await _owned_chat(repo, chat_id)
    try:
        return Summary(summary=await runner.compact(repo, chat))
    except runner.RunBusy:
        raise HTTPException(status.HTTP_409_CONFLICT, "this chat has a run in flight")


@router.post("/{chat_id}/stream")
async def stream(
    chat_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    user: CurrentUser,
    session_factory: SessionFactoryDep,
) -> Response:
    repo = HarnessRepository(session, user.id)
    chat = await _owned_chat(repo, chat_id)
    try:
        await check_run_allowed(repo)
    except LimitExceeded as exc:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, str(exc))
    try:
        adapter = await VercelAIAdapter[HarnessDeps, str].from_request(
            request, agent=tutor
        )
    except ValidationError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc))
    try:
        chunks = await runner.start_stream(
            session_factory=session_factory,
            repo=repo,
            chat=chat,
            adapter=adapter,
            current_locator=_current_locator(adapter.run_input),
        )
    except runner.RunBusy:
        raise HTTPException(status.HTTP_409_CONFLICT, "this chat has a run in flight")
    return adapter.streaming_response(chunks)
