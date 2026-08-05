from typing import Any

import pytest
from pydantic_ai.messages import (
    ModelMessage,
    ModelRequest,
    ModelResponse,
    TextPart,
    ToolCallPart,
    ToolReturnPart,
)
from pydantic_ai.models.function import AgentInfo, FunctionModel
from pydantic_core import to_jsonable_python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.content.ingest import ingest
from app.content.schemas import ContentIndex
from app.content.search import section_of, sections
from app.core.config import settings
from app.harness import runner, web_search
from app.harness.agent import tutor
from app.harness.repository import HarnessRepository
from app.harness.usage import WEB_SEARCH_CALLS
from app.models import Chat, Incident
from tests.content.conftest import corpus_index  # noqa: F401  (a shared fixture)

KL = "lesson:information-theory/kl-divergence"


def returns(messages: list[ModelMessage], name: str) -> list[Any]:
    """What the named tool has returned so far, as the model sees it.

    Serialized, because the same content is a pydantic model while the run is
    live and plain json once it has been through the database.
    """
    return [
        to_jsonable_python(part.content)
        for message in messages
        if isinstance(message, ModelRequest)
        for part in message.parts
        if isinstance(part, ToolReturnPart) and part.tool_name == name
    ]


def call(name: str, **args: object) -> ModelResponse:
    return ModelResponse(parts=[ToolCallPart(tool_name=name, args=args)])


async def test_a_question_is_answered_from_the_index_with_a_locator_that_resolves(
    repo: HarnessRepository,
    chat: Chat,
    session: AsyncSession,
    corpus_index: ContentIndex,  # noqa: F811
) -> None:
    """The scenario end to end: search the live index, read the section the
    best hit names, answer with a locator the learner can follow."""
    await ingest(session, corpus_index)

    def tutor_turn(messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        hits = returns(messages, "search_content")
        if not hits:
            return call("search_content", query="why is KL divergence never negative")
        passages = returns(messages, "fetch_content")
        if not passages:
            return call("fetch_content", locator=hits[0][0]["locator"])
        return ModelResponse(
            parts=[
                TextPart(
                    content=f"{passages[0]['text'][:60]} [[{passages[0]['locator']}]]"
                )
            ]
        )

    with tutor.override(model=FunctionModel(tutor_turn)):
        answer = await runner.run(repo, chat, "why is KL divergence never negative?")

    quoted = answer.split("[[")[1].removesuffix("]]")
    assert quoted.startswith(KL)
    # The locator the learner is handed is one the platform can serve back.
    chunks = await sections(session, quoted.partition("#")[0])
    assert section_of(chunks, quoted) is not None


async def test_a_mistyped_locator_is_recovered_from_the_suggestions(
    repo: HarnessRepository,
    chat: Chat,
    session: AsyncSession,
    corpus_index: ContentIndex,  # noqa: F811
) -> None:
    await ingest(session, corpus_index)

    def tutor_turn(messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        passages = returns(messages, "fetch_content")
        if not passages:
            return call("fetch_content", locator=f"{KL[:-3]}ance")
        if passages[-1].get("error") == "not_found":
            return call("fetch_content", locator=passages[-1]["did_you_mean"][0])
        return ModelResponse(parts=[TextPart(content=passages[-1]["locator"])])

    with tutor.override(model=FunctionModel(tutor_turn)):
        answer = await runner.run(repo, chat, "explain forward versus reverse KL")

    assert answer.startswith(KL)


async def test_a_lesson_reads_whole_and_a_section_knows_its_neighbours(
    repo: HarnessRepository,
    chat: Chat,
    session: AsyncSession,
    corpus_index: ContentIndex,  # noqa: F811
) -> None:
    await ingest(session, corpus_index)
    # An h3: it resolves to the h2 section that contains it.
    anchored = f"{KL}#not-a-metric-a-divergence"

    def tutor_turn(messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        read = returns(messages, "fetch_content")
        if not read:
            return call("fetch_content", locator=KL)
        if len(read) == 1:
            return call("fetch_content", locator=anchored)
        return ModelResponse(parts=[TextPart(content="read")])

    with tutor.override(model=FunctionModel(tutor_turn)):
        await runner.run(repo, chat, "read me the KL lesson")

    lesson, section = returns(await repo.history(chat), "fetch_content")
    assert lesson["locator"] == KL
    assert (lesson["prev"], lesson["next"]) == (None, None)
    assert len(lesson["text"]) > len(section["text"])
    assert section["locator"] == f"{KL}#asymmetry-it-matters-which-distribution-is-real"
    assert section["prev"].startswith(f"{KL}#")
    assert section["next"].startswith(f"{KL}#")


async def test_the_structure_names_the_modules_lessons_and_concepts_in_order(
    repo: HarnessRepository,
    chat: Chat,
    session: AsyncSession,
    corpus_index: ContentIndex,  # noqa: F811
) -> None:
    await ingest(session, corpus_index)

    def tutor_turn(messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        if not returns(messages, "get_course_structure"):
            return call("get_course_structure", course="information-theory")
        return ModelResponse(parts=[TextPart(content="read")])

    with tutor.override(model=FunctionModel(tutor_turn)):
        await runner.run(repo, chat, "what does this course cover?")

    [course] = returns(await repo.history(chat), "get_course_structure")[0]
    lessons = [lesson for module in course["modules"] for lesson in module["lessons"]]
    assert course["course"] == "information-theory"
    assert KL in [lesson["locator"] for lesson in lessons]
    assert course["concepts"] != []
    # The spine tells the tutor what the learner has been taught by now, so the
    # order it arrives in has to be the order the course is read in.
    assert lessons[0]["slug"] == "what-is-surprise"
    assert lessons[0]["prerequisites"] == []


async def test_a_wrong_formula_is_filed_as_a_content_incident(
    repo: HarnessRepository, chat: Chat, session: AsyncSession
) -> None:
    summary = "The displayed KL formula sums p*log(q/p); the ratio is inverted."

    def tutor_turn(messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        if not returns(messages, "report_content_incident"):
            return call(
                "report_content_incident",
                locator=f"{KL}#zeros-in-the-model-the-infinite-penalty",
                kind="error",
                summary=summary,
            )
        return ModelResponse(parts=[TextPart(content="filed, thank you")])

    with tutor.override(model=FunctionModel(tutor_turn)):
        await runner.run(repo, chat, "the formula in this section is wrong")

    incident = (await session.scalars(select(Incident))).one()
    assert incident.locator == f"{KL}#zeros-in-the-model-the-infinite-penalty"
    assert (incident.kind, incident.summary, incident.status) == (
        "error",
        summary,
        "open",
    )
    assert (incident.user_id, incident.chat_id) == (repo.user_id, chat.id)


async def test_a_locator_longer_than_the_column_is_a_retry_not_a_failed_run(
    repo: HarnessRepository, chat: Chat, session: AsyncSession
) -> None:
    """`incidents.locator` is varchar(512), so an invented locator longer than
    that has to be caught as tool-argument validation. The insert it would
    otherwise fail leaves the session in a failed transaction, and the turn is
    then stored nowhere while the chat stays claimed until its lease expires.
    """

    def tutor_turn(messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        # Counted over the calls made, not the values returned: a rejected
        # argument comes back as a retry prompt and never as a tool return.
        tried = [
            part
            for message in messages
            if isinstance(message, ModelResponse)
            for part in message.parts
            if isinstance(part, ToolCallPart)
        ]
        if not tried:
            return call(
                "report_content_incident",
                locator=f"{KL}#{'x' * 512}",
                kind="error",
                summary="the formula is inverted",
            )
        return ModelResponse(parts=[TextPart(content="noted")])

    with tutor.override(model=FunctionModel(tutor_turn)):
        answer = await runner.run(repo, chat, "the formula in this section is wrong")

    assert answer == "noted"
    assert (await session.scalars(select(Incident))).first() is None
    # The turn was stored, so the session the tool ran in is still usable.
    assert await repo.rows(chat)


def searching(searches: int) -> FunctionModel:
    """A tutor that runs `searches` web searches and then answers."""

    def tutor_turn(messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        if len(returns(messages, "web_search")) < searches:
            return call("web_search", query="what happened today")
        return ModelResponse(parts=[TextPart(content="answered")])

    return FunctionModel(tutor_turn)


@pytest.fixture
def perplexity(monkeypatch: pytest.MonkeyPatch) -> None:
    async def ask(query: str) -> str:
        return f"the web says: {query}\n\nSources:\n- Somewhere: https://example.test"

    monkeypatch.setattr(web_search, "ask", ask)


@pytest.mark.usefixtures("perplexity")
async def test_a_web_result_reaches_the_model_fenced_and_counted_in_usage(
    repo: HarnessRepository, chat: Chat
) -> None:
    with tutor.override(model=searching(1)):
        await runner.run(repo, chat, "what happened in the news today?")

    usage = (await repo.rows(chat))[-1].usage
    result = returns(await repo.history(chat), "web_search")[0]
    assert '<untrusted source="web_search">' in result
    assert "the web says" in result
    assert usage is not None and usage[WEB_SEARCH_CALLS] == 1
    assert await repo.web_searches_today() == 1


@pytest.mark.usefixtures("perplexity")
async def test_the_daily_cap_stops_the_search_and_not_the_run(
    repo: HarnessRepository, chat: Chat
) -> None:
    """The cap is enforcement, and the searches of the run in flight count
    against it — otherwise a single run could spend the day's budget twice."""
    with tutor.override(model=searching(settings.WEB_SEARCH_DAILY_CAP + 1)):
        answer = await runner.run(repo, chat, "keep searching")

    assert answer == "answered"
    assert await repo.web_searches_today() == settings.WEB_SEARCH_DAILY_CAP
    assert "daily web search cap" in returns(await repo.history(chat), "web_search")[-1]


@pytest.mark.usefixtures("perplexity")
async def test_another_users_searches_never_count_against_this_one(
    repo: HarnessRepository, other_repo: HarnessRepository
) -> None:
    theirs = await other_repo.create_chat(kind="web")

    with tutor.override(model=searching(1)):
        await runner.run(other_repo, theirs, "what happened in the news today?")

    assert await other_repo.web_searches_today() == 1
    assert await repo.web_searches_today() == 0


async def test_an_unavailable_provider_is_reported_to_the_model_not_raised(
    monkeypatch: pytest.MonkeyPatch, repo: HarnessRepository, chat: Chat
) -> None:
    monkeypatch.setattr(settings, "PERPLEXITY_API_KEY", None)

    with tutor.override(model=searching(1)):
        answer = await runner.run(repo, chat, "what happened in the news today?")

    assert answer == "answered"
    assert "not configured" in returns(await repo.history(chat), "web_search")[0]
    # The attempt still counted: what the cap bounds is calls made, or a
    # provider having a bad day becomes an unbounded retry loop.
    assert await repo.web_searches_today() == 1


async def test_a_tool_files_against_the_chat_its_deps_were_built_for(
    repo: HarnessRepository, other_repo: HarnessRepository, session: AsyncSession
) -> None:
    """There is no user or chat id in a tool signature: what a tool can touch
    is what the deps it was handed already point at."""
    mine = await repo.create_chat(kind="web")
    theirs = await other_repo.create_chat(kind="web")

    def tutor_turn(messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        if not returns(messages, "report_content_incident"):
            return call(
                "report_content_incident", locator=KL, kind="other", summary="a note"
            )
        return ModelResponse(parts=[TextPart(content="filed")])

    with tutor.override(model=FunctionModel(tutor_turn)):
        await runner.run(repo, mine, "this section is unclear")
        await runner.run(other_repo, theirs, "this section is unclear")

    for owner, chat in ((repo, mine), (other_repo, theirs)):
        filed = (
            await session.scalars(
                select(Incident).where(Incident.user_id == owner.user_id)
            )
        ).all()
        assert [(incident.user_id, incident.chat_id) for incident in filed] == [
            (owner.user_id, chat.id)
        ]
