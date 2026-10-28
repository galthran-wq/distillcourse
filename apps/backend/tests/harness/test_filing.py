import io

import pytest
from pydantic_ai.messages import ModelRequest, UserPromptPart
from sqlalchemy.ext.asyncio import AsyncSession

from app import cli
from app.content.ingest import ingest
from app.harness import filing
from app.harness.repository import HarnessRepository
from app.models import Chat
from tests.content.conftest import document, index
from tests.harness.conftest import call


@pytest.fixture(autouse=True)
async def courses(session: AsyncSession) -> None:
    await ingest(
        session,
        index(
            *(
                document(
                    f"course:{slug}",
                    course_slug=slug,
                    metadata={"tagline": "t", "modules": []},
                )
                for slug in ("fraud-ml", "quant")
            )
        ),
    )


def asked(question: str, *, reading: str | None = None) -> ModelRequest:
    return ModelRequest(
        parts=[UserPromptPart(content=question)],
        instructions=None if reading is None else f"They are reading `{reading}`.",
    )


async def proposed(session: AsyncSession, chat: Chat) -> filing.Proposal:
    return next(p for p in await filing.propose(session) if p.chat_id == chat.id)


async def test_a_chat_whose_pointers_agree_is_proposed_for_that_course(
    session: AsyncSession, repo: HarnessRepository, chat: Chat
) -> None:
    await repo.add_messages(
        chat,
        [
            asked(
                "> a passage\n>\n> — [[lesson:fraud-ml/isolation-forest#paths]]\nwhy?",
                reading="lesson:fraud-ml/isolation-forest#paths",
            )
        ],
        role="user",
    )
    await repo.add_messages(
        chat,
        [call("fetch_content", locator="lesson:fraud-ml/one-class#svm")],
        role="agent",
    )

    proposal = await proposed(session, chat)

    assert proposal.course == "fraud-ml"
    assert proposal.evidence == {
        ("reading", "fraud-ml"): 1,
        ("quoted", "fraud-ml"): 1,
        ("fetched", "fraud-ml"): 1,
    }
    assert proposal.subject.endswith("why?")


async def test_disagreeing_or_absent_pointers_are_left_for_the_person(
    session: AsyncSession, repo: HarnessRepository, chat: Chat
) -> None:
    await repo.add_messages(
        chat, [asked("hm", reading="lesson:fraud-ml/isolation-forest")], role="user"
    )
    await repo.add_messages(
        chat, [call("search_content", query="sharpe", course="quant")], role="agent"
    )
    silent = await repo.create_chat(kind="web")
    await repo.add_messages(silent, [asked("what should I read?")], role="user")

    assert (await proposed(session, chat)).course == filing.UNDECIDED
    assert (await proposed(session, silent)).course == filing.UNDECIDED


async def test_a_course_no_longer_in_the_index_is_not_proposed(
    session: AsyncSession, repo: HarnessRepository, chat: Chat
) -> None:
    await repo.add_messages(
        chat, [asked("?", reading="lesson:retired-course/a-lesson")], role="user"
    )

    assert (await proposed(session, chat)).course == filing.UNDECIDED


async def test_the_reviewed_list_files_every_chat_it_names(
    session: AsyncSession, repo: HarnessRepository, chat: Chat
) -> None:
    general = await repo.create_chat(kind="web", course="quant")
    reviewed = io.StringIO(
        f"{chat.id}\ttitle\tfraud-ml\tevidence\tsubject\n\n"
        f"{general.id}\t\tgeneral\t\t\n"
    )

    counts = await filing.apply(session, filing.parse(reviewed))

    await session.refresh(chat)
    await session.refresh(general)
    assert (chat.course, general.course) == ("fraud-ml", None)
    assert counts == {"fraud-ml": 1, "general": 1}


def test_a_row_nobody_decided_refuses_the_whole_list(chat: Chat) -> None:
    with pytest.raises(ValueError, match="line 2"):
        filing.parse([f"{chat.id}\tt\tquant\t\t\n", f"{chat.id}\tt\t?\t\t\n"])


async def test_a_course_the_index_does_not_carry_files_nothing(
    session: AsyncSession, chat: Chat
) -> None:
    with pytest.raises(ValueError, match="astrology"):
        await filing.apply(session, {chat.id: "astrology"})

    await session.refresh(chat)
    assert chat.course is None


async def test_the_proposal_prints_one_tab_separated_row_per_chat(
    session: AsyncSession,
    repo: HarnessRepository,
    chat: Chat,
    capsys: pytest.CaptureFixture[str],
) -> None:
    await repo.add_messages(chat, [asked("line one\nline\ttwo")], role="user")

    await cli.propose_chat_courses(session)

    rows = [line.split("\t") for line in capsys.readouterr().out.splitlines()]
    assert [str(chat.id), "", "?", "", "line one line two"] in rows
