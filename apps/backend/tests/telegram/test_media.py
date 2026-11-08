"""Figures and formulas the tutor sends as images, in Telegram and nowhere else."""

import pytest
from httpx import AsyncClient
from pydantic_ai.messages import ModelMessage, ModelResponse, TextPart
from pydantic_ai.models.function import AgentInfo, FunctionModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.harness import runner
from app.harness.agent import tutor
from app.harness.repository import HarnessRepository
from app.models import Document, User
from tests.conftest import Bot, settled
from tests.harness.conftest import call, returns
from tests.labs.test_chat import listing, streamed
from tests.telegram.conftest import deliver, message

LESSON = "lesson:information-theory/entropy"
SECTION = f"{LESSON}#the-average"
DRAWN = "/course-assets/information-theory/entropy/average.svg"
PHOTO = "/course-assets/information-theory/entropy/plate.jpg"
MEDIA_TOOLS = {"send_figure", "send_formula"}
BIAS_VARIANCE = (
    r"\mathbb{E}[(y-\hat f)^2]=\mathrm{Bias}[\hat f]^2+\mathrm{Var}[\hat f]+\sigma^2"
)


@pytest.fixture
async def figured(session: AsyncSession) -> None:
    """A lesson of two sections, the second showing two figures."""
    for position, (anchor, figures) in enumerate(
        [
            ("", []),
            (
                "the-average",
                [
                    {
                        "src": DRAWN,
                        "alt": "bars",
                        "caption": "Surprisal, weighted & summed.",
                    },
                    {"src": PHOTO, "alt": "a plate", "caption": None},
                ],
            ),
        ]
    ):
        session.add(
            Document(
                corpus="lesson",
                course_slug="information-theory",
                locator=f"{LESSON}#{anchor}" if anchor else LESSON,
                title=anchor or "Entropy",
                breadcrumb="Information Theory › Entropy",
                text="Entropy is the average surprisal.",
                anchors=[anchor] if anchor else [],
                position=position,
                meta={"word_count": 5, "figures": figures},
                content_hash=str(position) * 64,
            )
        )
    await session.commit()


def using(
    tool: str,
    seen: list[object],
    answer: str = "that is the decomposition",
    **args: object,
) -> FunctionModel:
    """A model that calls one tool, keeps what it returned, and then answers."""

    def turn(messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        returned = returns(messages, tool)
        if not returned:
            return call(tool, **args)
        seen.extend(returned)
        return ModelResponse(parts=[TextPart(content=answer)])

    return FunctionModel(turn)


@pytest.mark.usefixtures("link")
async def test_a_formula_arrives_as_an_image_and_the_sentence_follows(
    client: AsyncClient, bot: Bot
) -> None:
    seen: list[object] = []
    with tutor.override(model=using("send_formula", seen, lines=[BIAS_VARIANCE])):
        await deliver(client, message("what does the decomposition look like?"))

    [photo] = bot.photos
    assert isinstance(photo.photo, bytes)
    assert photo.photo.startswith(b"\x89PNG")
    assert seen == ["sent"]
    # The image is not the answer: the sentence after it is still delivered.
    assert bot.texts == ["that is the decomposition"]


@pytest.mark.usefixtures("link")
async def test_a_formula_the_parser_refuses_goes_back_to_the_model(
    client: AsyncClient, bot: Bot
) -> None:
    seen: list[object] = []
    matrix = r"\begin{pmatrix} a & b \end{pmatrix}"
    with tutor.override(
        model=using("send_formula", seen, answer="in words, then", lines=[matrix])
    ):
        await deliver(client, message("show me the matrix"))

    assert bot.photos == []
    [refusal] = seen
    assert isinstance(refusal, str)
    assert "did not render" in refusal and "Unknown symbol" in refusal
    assert bot.texts == ["in words, then"]


@pytest.mark.usefixtures("link", "figured")
@pytest.mark.parametrize(
    ("locator", "src", "url", "caption"),
    [
        (
            SECTION,
            DRAWN,
            "/course-assets-png/information-theory/entropy/average.svg",
            "Surprisal, weighted &amp; summed.",
        ),
        # The whole lesson lists every section's figures; a raster goes as served.
        (LESSON, PHOTO, PHOTO, None),
    ],
)
async def test_a_listed_figure_is_sent_from_the_site(
    client: AsyncClient,
    bot: Bot,
    locator: str,
    src: str,
    url: str,
    caption: str | None,
) -> None:
    seen: list[object] = []
    with tutor.override(model=using("send_figure", seen, locator=locator, src=src)):
        await deliver(client, message("show me the figure"))

    assert [(photo.photo, photo.caption) for photo in bot.photos] == [
        (f"{settings.FRONTEND_HOST}{url}", caption)
    ]
    assert seen == ["sent"]


@pytest.mark.usefixtures("link", "figured")
@pytest.mark.parametrize(
    ("locator", "src"),
    [
        (SECTION, "/course-assets/information-theory/entropy/elsewhere.svg"),
        # Listed for the lesson, but the section named is not one it has.
        (f"{LESSON}#nowhere", DRAWN),
        ("lesson:information-theory/missing", DRAWN),
    ],
)
async def test_a_figure_the_passage_does_not_list_is_refused(
    client: AsyncClient, bot: Bot, locator: str, src: str
) -> None:
    seen: list[object] = []
    with tutor.override(model=using("send_figure", seen, locator=locator, src=src)):
        await deliver(client, message("show me the figure"))

    assert bot.photos == []
    [refusal] = seen
    assert isinstance(refusal, str) and "is not a figure of" in refusal


@pytest.mark.usefixtures("link")
async def test_the_image_tools_are_offered_in_telegram_only(
    client: AsyncClient,
    signed_in: AsyncClient,
    session: AsyncSession,
    user: User,
) -> None:
    offered: list[set[str]] = []
    repo = HarnessRepository(session, user.id)
    web = await repo.create_chat(kind="web")
    later = await repo.create_chat(kind="web")
    with tutor.override(model=streamed(listing(offered))):
        await deliver(client, message("a question"))
        await signed_in.post(
            f"/api/v1/chats/{web.id}/stream",
            json={
                "id": str(web.id),
                "trigger": "submit-message",
                "messages": [
                    {
                        "id": "m",
                        "role": "user",
                        "parts": [{"type": "text", "text": "q"}],
                    }
                ],
            },
        )
        await settled()
        # A run with nowhere to send an image, as scheduled work is.
        await runner.run(repo, later, "a question", medium="web")

    in_telegram, on_the_web, without_outbox = offered
    assert MEDIA_TOOLS <= in_telegram
    assert not MEDIA_TOOLS & on_the_web
    assert not MEDIA_TOOLS & without_outbox


@pytest.mark.usefixtures("link", "figured")
async def test_a_passage_lists_the_figures_it_may_show(client: AsyncClient) -> None:
    seen: list[object] = []
    with tutor.override(model=using("fetch_content", seen, locator=SECTION)):
        await deliver(client, message("what is in that section?"))

    [passage] = seen
    assert isinstance(passage, dict)
    assert [figure["src"] for figure in passage["figures"]] == [DRAWN, PHOTO]
