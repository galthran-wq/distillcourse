"""Cards shown with a lesson figure or a formula: written only with an image
that can be sent, sent as a photo, and answered in its caption."""

import re

import pytest
from httpx import AsyncClient
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import CardDelivery, Document, ReviewCard, User
from app.review import cards, writer
from app.telegram import api
from tests.conftest import Bot
from tests.review.conftest import (
    LESSON,
    SECTION,
    card_models,
    draft,
    no_model,
    send_due,
    stored_card,
    writing,
)
from tests.review.conftest import ladder as ladder_row
from tests.telegram.conftest import deliver, tap

pytestmark = pytest.mark.usefixtures("link", "indexed_section")

FIGURE = "/course-assets/information-theory/entropy-as-average-surprise/average.svg"
FORMULA = r"H(X) = -\sum_x p(x) \log p(x)"


async def with_figure(session: AsyncSession) -> None:
    section = await session.scalar(
        select(Document).where(Document.locator == f"{LESSON}#{SECTION}")
    )
    assert section is not None
    section.meta = section.meta | {
        "figures": [{"src": FIGURE, "alt": "bars", "caption": "The average."}]
    }
    await session.commit()


async def delivered(session: AsyncSession, user: User) -> CardDelivery:
    found = await session.scalar(
        select(CardDelivery).where(CardDelivery.user_id == user.id)
    )
    assert found is not None
    return found


async def test_the_writer_is_given_the_figures_and_a_card_keeps_one_it_can_send(
    session: AsyncSession, user: User
) -> None:
    await with_figure(session)
    await ladder_row(session, user)
    asked: list[str] = []
    batch = writing(
        draft(prompt="Which bar is tallest?", figure=FIGURE),
        draft(prompt="Which curve?", figure="/course-assets/elsewhere/x/y.svg"),
        draft(prompt="Which term?", formula=r"\begin{pmatrix} a \end{pmatrix}"),
        asked=asked,
    )

    with card_models(write=batch):
        await send_due(session, user)

    assert f"`{FIGURE}`: bars The average." in asked[0]
    kept = list(await session.scalars(select(ReviewCard)))
    assert [(card.prompt, card.figure, card.formula) for card in kept] == [
        ("Which bar is tallest?", FIGURE, None)
    ]


def test_a_blank_image_field_is_no_image() -> None:
    card = writer.Draft.model_validate(draft(figure="", formula=" "))
    assert (card.figure, card.formula) == (None, None)


def test_a_card_shows_a_figure_or_a_formula_not_both() -> None:
    with pytest.raises(ValidationError, match="not both"):
        writer.Draft.model_validate(draft(figure=FIGURE, formula=FORMULA))
    with pytest.raises(ValidationError, match="at most 400"):
        writer.Draft.model_validate(draft(prompt="x" * 401, formula=FORMULA))


async def test_a_figure_card_is_a_photo_whose_caption_the_tap_answers_in(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    await ladder_row(session, user, level=2)
    card = await stored_card(session, level=2, figure=FIGURE)

    with no_model():
        await send_due(session, user)
        sent = await delivered(session, user)
        await deliver(client, tap(f"k:{sent.id}:0", message_id=sent.tg_message_id))

    [photo] = bot.photos
    assert photo.photo == (
        f"{settings.FRONTEND_HOST}/course-assets-png/information-theory/"
        "entropy-as-average-surprise/average.svg"
    )
    assert photo.caption is not None and card.prompt in photo.caption
    assert photo.keyboard is not None
    assert [row[0]["text"] for row in photo.keyboard][: len(card.options)] == (
        card.options
    )
    assert bot.sent == [] and bot.edited == []
    [(message_id, feedback)] = bot.captioned
    assert message_id == sent.tg_message_id
    assert card.prompt in feedback and "✓ average." in feedback
    # The answer buttons came off with the caption edit; the feedback's own
    # went on.
    [(rekeyed, keyboard)] = bot.rekeyed
    assert rekeyed == sent.tg_message_id
    assert keyboard is not None and f"k:{sent.id}" not in str(keyboard)
    assert f"x:{sent.id}" in str(keyboard)


async def test_a_formula_card_is_sent_typeset(
    session: AsyncSession, user: User, bot: Bot
) -> None:
    await ladder_row(session, user)
    await stored_card(session, formula=FORMULA)

    with no_model():
        await send_due(session, user)

    [photo] = bot.photos
    assert isinstance(photo.photo, bytes) and photo.photo.startswith(b"\x89PNG")


async def test_a_card_whose_image_telegram_refuses_is_retired_for_the_next(
    session: AsyncSession, user: User, bot: Bot
) -> None:
    await ladder_row(session, user)
    refused = await stored_card(session, figure=FIGURE)
    await stored_card(session, prompt="Plain: ____")
    bot.refuse = api.TelegramError("Bad Request: wrong file identifier/HTTP URL")

    with no_model():
        await send_due(session, user)

    await session.refresh(refused)
    assert refused.status == "retired"
    [sent] = bot.sent
    assert "Plain: ____" in sent.text


async def test_a_photo_cards_feedback_fits_a_caption(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    await ladder_row(session, user)
    card = await stored_card(session, prompt="p" * 400, formula=FORMULA)
    card.explanation = "e" * 1000
    await session.commit()

    with no_model():
        await send_due(session, user)
        sent = await delivered(session, user)
        await deliver(client, tap(f"k:{sent.id}:0", message_id=sent.tg_message_id))

    [(_, feedback)] = bot.captioned
    assert len(re.sub(r"<[^>]*>", "", feedback)) == cards.CAPTION_CHARS
    assert "e…" in feedback
