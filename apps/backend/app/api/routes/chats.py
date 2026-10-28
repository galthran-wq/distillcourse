import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, ConfigDict, ValidationError
from pydantic_ai.ui.vercel_ai import VercelAIAdapter
from pydantic_ai.ui.vercel_ai.request_types import RequestData, UIMessage

from app.api.deps import RepositoryDep, SessionFactoryDep, get_current_user
from app.content import locators
from app.core.config import ChatModel, settings
from app.harness import prompts, runner
from app.harness.agent import tutor
from app.harness.deps import HarnessDeps
from app.harness.limits import LimitExceeded
from app.harness.repository import HarnessRepository
from app.models import Chat

router = APIRouter(prefix="/chats", tags=["chats"])


class ChatSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: str
    # The lab a lab chat belongs to, as its lesson locator: the page the site
    # opens it on.
    lab_lesson: str | None = None
    model: str
    title: str | None
    created_at: datetime
    # When the chat was last written in — null for one nobody has said anything
    # in yet, which a chat this API has only just created never has.
    last_message_at: datetime | None = None


class NewChat(BaseModel):
    # No kind: this API opens web chats and nothing else. The Telegram thread is
    # the backend's to create (`app.telegram.thread.of`), there is exactly one
    # of it per learner (#16), and the poller reads their replies out of it —
    # a second one, or a run started into it from the browser, would be counted
    # as an answer to a review nobody was asked.
    model: str | None = None


class ChatModelUpdate(BaseModel):
    model: str


class Summary(BaseModel):
    summary: str


def _current_locator(run_input: RequestData) -> str | None:
    """The reader's position, sent by the widget alongside the messages.

    The block it feeds is a platform statement about the learner rather than
    quoted content, so anything that is not a locator is dropped, not fenced.
    """
    locator = (run_input.model_extra or {}).get("currentLocator")
    if not isinstance(locator, str):
        return None
    if locators.LESSON_SECTION.fullmatch(locator):
        return locator
    # An anchor this pattern will not admit still hangs off a lesson the tutor
    # should know the reader is on: drop the anchor, not the lesson.
    lesson = locator.split("#")[0]
    return lesson if locators.LESSON.fullmatch(lesson) else None


def _passage(quote: object) -> tuple[str, str] | None:
    """One entry of that field, or nothing if it is not a passage of a lesson."""
    if not isinstance(quote, dict):
        return None
    text, locator = quote.get("text"), quote.get("locator")
    if not isinstance(text, str) or not isinstance(locator, str) or not text.strip():
        return None
    if not locators.LESSON_SECTION.fullmatch(locator):
        return None
    return text, locator


def _quotes(run_input: RequestData) -> str | None:
    """The passages the reader referenced, each fenced before it is stored.

    Sent as a field of their own rather than pasted into the message by the
    client: the provenance marker `base.md` promises around quoted material is
    written here, where the client cannot leave it off or close it early. One
    unusable entry drops itself and not the rest — the others are still
    passages the question is about.
    """
    quotes = (run_input.model_extra or {}).get("quotes")
    if not isinstance(quotes, list):
        return None
    # Bounded before anything in it is looked at: a client is free to send ten
    # thousand entries, and none of them is worth a pass of the locator
    # pattern. The tail, because the composer's cap evicts the oldest — what a
    # reader who went past it still has attached is the end of their list.
    passages = [
        found
        for quote in quotes[-prompts.QUOTE_COUNT :]
        if (found := _passage(quote)) is not None
    ]
    return prompts.learner_quotes(passages)


async def _owned_chat(repo: HarnessRepository, chat_id: uuid.UUID) -> Chat:
    chat = await repo.get_chat(chat_id)
    if chat is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "no such chat")
    return chat


async def _web_chat(repo: HarnessRepository, chat_id: uuid.UUID) -> Chat:
    """A chat this API may run in, switch models on, or compact: a web chat,
    or a lab chat continued on the site.

    The Telegram thread is none of those: its model is the platform's (system
    runs bill the instance), and a run started into it from the browser closes
    review slots the learner never answered.
    """
    chat = await _owned_chat(repo, chat_id)
    if chat.kind == "telegram":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "the Telegram thread is driven from Telegram"
        )
    return chat


@router.get("/models", dependencies=[Depends(get_current_user)])
async def models() -> list[ChatModel]:
    return settings.CHAT_MODELS


@router.get("")
async def index(repo: RepositoryDep) -> list[ChatSummary]:
    """The reader's chats, most recently spoken in first — a column of dates
    that does not descend is one nobody can read down. It is also the order
    the panel resumes from when the chat it had is gone."""
    return [
        ChatSummary.model_validate(chat).model_copy(update={"last_message_at": last})
        for chat, last in await repo.list_chats()
    ]


@router.post("")
async def create(new: NewChat, repo: RepositoryDep) -> ChatSummary:
    if new.model is not None and new.model not in settings.chat_model_pool:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "unknown model")
    chat = await repo.create_chat(kind="web", model=new.model)
    return ChatSummary.model_validate(chat)


@router.patch("/{chat_id}")
async def set_model(
    chat_id: uuid.UUID, update: ChatModelUpdate, repo: RepositoryDep
) -> ChatSummary:
    if update.model not in settings.chat_model_pool:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "unknown model")
    chat = await _web_chat(repo, chat_id)
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
    chat = await _web_chat(repo, chat_id)
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
    chat = await _web_chat(repo, chat_id)
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
            attached=_quotes(adapter.run_input),
        )
    except LimitExceeded as exc:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, str(exc))
    except runner.RunBusy:
        raise HTTPException(status.HTTP_409_CONFLICT, "this chat has a run in flight")
    return adapter.streaming_response(chunks)
