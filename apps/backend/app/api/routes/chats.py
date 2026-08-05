import re
import uuid
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, ConfigDict, ValidationError
from pydantic_ai.ui.vercel_ai import VercelAIAdapter
from pydantic_ai.ui.vercel_ai.request_types import RequestData, UIMessage

from app.api.deps import RepositoryDep, SessionFactoryDep, get_current_user
from app.core.config import ChatModel, settings
from app.harness import runner
from app.harness.agent import tutor
from app.harness.deps import HarnessDeps
from app.harness.limits import LimitExceeded
from app.harness.repository import HarnessRepository
from app.models import Chat

router = APIRouter(prefix="/chats", tags=["chats"])

# The widget names a place in the course, and the block it feeds is a platform
# statement about the learner rather than quoted content — so anything that is
# not a locator is dropped instead of fenced.
LOCATOR = re.compile(r"lesson:[a-z0-9-]{1,80}/[a-z0-9-]{1,80}(#[a-z0-9-]{1,80})?")


class ChatSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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


def _current_locator(run_input: RequestData) -> str | None:
    """The reader's position, sent by the widget alongside the messages."""
    locator = (run_input.model_extra or {}).get("currentLocator")
    if isinstance(locator, str) and LOCATOR.fullmatch(locator):
        return locator
    return None


async def _owned_chat(repo: HarnessRepository, chat_id: uuid.UUID) -> Chat:
    chat = await repo.get_chat(chat_id)
    if chat is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "no such chat")
    return chat


@router.get("/models", dependencies=[Depends(get_current_user)])
async def models() -> list[ChatModel]:
    return settings.CHAT_MODELS


@router.get("")
async def index(repo: RepositoryDep) -> list[ChatSummary]:
    return [ChatSummary.model_validate(chat) for chat in await repo.list_chats()]


@router.post("")
async def create(new: NewChat, repo: RepositoryDep) -> ChatSummary:
    if new.model is not None and new.model not in settings.chat_model_pool:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "unknown model")
    chat = await repo.create_chat(kind=new.kind, model=new.model)
    return ChatSummary.model_validate(chat)


@router.patch("/{chat_id}")
async def set_model(
    chat_id: uuid.UUID, update: ChatModelUpdate, repo: RepositoryDep
) -> ChatSummary:
    if update.model not in settings.chat_model_pool:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "unknown model")
    chat = await _owned_chat(repo, chat_id)
    await repo.set_model(chat, update.model)
    return ChatSummary.model_validate(chat)


@router.get("/{chat_id}/messages")
async def messages(chat_id: uuid.UUID, repo: RepositoryDep) -> list[UIMessage]:
    chat = await _owned_chat(repo, chat_id)
    # What the learner and the tutor said to each other. Markers and the
    # prompts the platform writes for itself are how the harness talks to the
    # model, and the conversation never contained them.
    return [
        UIMessage.model_validate(ui)
        for row in await repo.rows(chat)
        if row.marker is None and row.role != "system"
        for ui in row.projection
    ]


@router.post("/{chat_id}/compact")
async def compact(chat_id: uuid.UUID, repo: RepositoryDep) -> Summary:
    chat = await _owned_chat(repo, chat_id)
    try:
        return Summary(summary=await runner.compact(repo, chat))
    except runner.RunBusy:
        raise HTTPException(status.HTTP_409_CONFLICT, "this chat has a run in flight")


@router.post("/{chat_id}/stream")
async def stream(
    chat_id: uuid.UUID,
    request: Request,
    repo: RepositoryDep,
    session_factory: SessionFactoryDep,
) -> Response:
    chat = await _owned_chat(repo, chat_id)
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
    except LimitExceeded as exc:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, str(exc))
    except runner.RunBusy:
        raise HTTPException(status.HTTP_409_CONFLICT, "this chat has a run in flight")
    return adapter.streaming_response(chunks)
