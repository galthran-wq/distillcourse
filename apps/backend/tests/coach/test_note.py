"""The weekly note: what code writes in it, when it is refused, and its Send it
button."""

from datetime import timedelta

import pytest
from httpx import AsyncClient
from pydantic_ai.messages import ModelMessage
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.content.locators import lesson_url
from app.core.config import settings
from app.models import CardDelivery, CoachNote, LessonProgress, ReviewCard, TgLink, User
from app.review import controls
from app.review import repository as review
from app.scheduling import gates, policy
from app.scheduling import repository as scheduling
from tests.coach.conftest import run
from tests.conftest import Bot
from tests.content.conftest import corpus_index  # noqa: F401  (a shared fixture)
from tests.harness.conftest import returns
from tests.review.conftest import (  # noqa: F401  (a shared fixture)
    LESSON,
    indexed_course,
    ladder,
    no_model,
    prompt_of,
    stored_card,
)
from tests.scheduling.conftest import NOON, thread  # noqa: F401  (a shared fixture)
from tests.telegram.conftest import (  # noqa: F401  (a shared fixture)
    configured_bot,
    deliver,
    tap,
)

pytestmark = pytest.mark.usefixtures("thread", "indexed_course", "configured_bot")

SURPRISE = "lesson:information-theory/what-is-surprise"
CODES = "lesson:information-theory/prefix-codes"
# A course the index does not carry: named by its slug.
ELSEWHERE = "lesson:fraud-ml/undersampling"
NEXT = {"next_step": "one card on it."}


async def standing(session: AsyncSession, user: User) -> ReviewCard:
    """Entropy slipping, Surprisal holding, Prefix codes started, one lesson of
    an unindexed course holding; a card on entropy answered yesterday. The
    card returned is a second one on entropy, not yet seen."""
    for lesson, step, last in (
        (LESSON, 3, "failed"),
        (SURPRISE, 2, "correct"),
        (CODES, 0, None),
        (ELSEWHERE, 3, "correct"),
    ):
        state = await ladder(session, user, lesson=lesson, step=step)
        state.last_outcome = last
    seen = await stored_card(session)
    session.add(
        CardDelivery(
            user_id=user.id,
            card_id=seen.id,
            tg_message_id=1,
            sent_at=NOON - timedelta(days=1),
            answered_at=NOON - timedelta(days=1),
            chosen=1,
            outcome="wrong",
        )
    )
    await session.commit()
    return await stored_card(session, prompt="A fresh one: ____")


def sent_back(messages: list[ModelMessage]) -> list[str]:
    return [str(text) for text in returns(messages, "send_weekly_note")]


async def note(session: AsyncSession, user: User, link: TgLink) -> list[ModelMessage]:
    return await run(session, user, link, NEXT, tool="send_weekly_note")


async def test_code_writes_the_numbers_and_the_model_only_the_next_step(
    session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    await standing(session, user)
    asked: list[list[ModelMessage]] = []

    await run(session, user, link, NEXT, tool="send_weekly_note", asked=asked)

    assert sent_back(asked[-1]) == ["Sent the weekly note."]
    [sent] = bot.sent
    assert sent.text == (
        "fraud-ml: 1/1 holding\n"
        "Information Theory: 1/3 holding\n"
        "Slipping: Entropy\n"
        "Next: one card on it."
    )
    stored = await session.scalar(select(CoachNote))
    assert stored is not None and stored.lesson == LESSON
    assert sent.keyboard == [[{"text": "Send it", "callback_data": f"s:{stored.id}"}]]
    # The run was told what code would write before it chose to send.
    summary = prompt_of(asked[0])
    assert "## Weekly note" in summary
    assert "Information Theory: 1/3 holding" in summary
    assert f"a Send it button for a card on `{LESSON}`" in summary


async def test_a_note_spends_the_days_message(
    session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    await standing(session, user)

    await note(session, user, link)

    since = policy.day_start(NOON, policy.Hours.of(user))
    assert await scheduling.initiations_today(session, user.id, since) == 1
    assert await gates.refusal(session, user, NOON) == (
        "Not sent: today's message has already gone out."
    )
    assert len(bot.sent) == 1


async def test_a_second_note_within_seven_days_is_refused(
    session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    await standing(session, user)
    session.add(
        CoachNote(user_id=user.id, sent_at=NOON - timedelta(days=6), tg_message_id=1)
    )
    await session.commit()

    messages = await note(session, user, link)

    assert sent_back(messages) == [
        "Not sent: a weekly note went out 6 days ago, one a week."
    ]
    assert "Not available: a weekly note went out 6 days ago" in prompt_of(messages)
    assert bot.sent == []


async def test_no_answer_in_fourteen_days_is_refused(
    session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    await standing(session, user)
    old = await session.scalar(select(CardDelivery))
    assert old is not None
    old.answered_at = NOON - timedelta(days=15)
    await session.commit()

    messages = await note(session, user, link)

    assert sent_back(messages) == [
        "Not sent: no card answered in two weeks; a quiet learner gets a card."
    ]
    assert bot.sent == []


async def test_a_note_on_a_day_a_card_went_out_is_refused(
    session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    card = await standing(session, user)
    session.add(
        CardDelivery(
            user_id=user.id,
            card_id=card.id,
            tg_message_id=2,
            sent_at=NOON - timedelta(hours=1),
            initiated=True,
        )
    )
    await session.commit()

    messages = await note(session, user, link)

    assert sent_back(messages) == ["Not sent: today's message has already gone out."]
    assert bot.sent == []


async def test_with_nothing_slipping_the_next_step_links_the_lesson_left_unfinished(
    session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    await standing(session, user)
    entropy = await review.state_of(session, user.id, LESSON)
    assert entropy is not None
    entropy.last_outcome = "correct"
    await session.execute(update(CardDelivery).values(outcome="correct"))
    session.add(
        LessonProgress(
            user_id=user.id,
            lesson=CODES,
            active_seconds=60,
            max_scroll_pct=40,
            proofs_opened=0,
            solutions_opened=0,
            demos_touched=0,
            first_seen=NOON - timedelta(days=2),
            last_seen=NOON - timedelta(days=1),
        )
    )
    await session.commit()

    await run(session, user, link, {"next_step": "finish it."}, tool="send_weekly_note")

    [sent] = bot.sent
    assert sent.keyboard is None
    assert "Slipping" not in sent.text
    assert sent.text.endswith(
        f'Next: finish it. <a href="{lesson_url(CODES)}">Prefix codes and code trees</a>'
    )


async def test_send_it_puts_one_card_on_the_slipping_lesson(
    client: AsyncClient, session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    fresh = await standing(session, user)
    await note(session, user, link)
    stored = await session.scalar(select(CoachNote))
    assert stored is not None and stored.tg_message_id is not None

    with no_model():
        for update_id in (401, 402):
            await deliver(
                client,
                tap(
                    f"s:{stored.id}",
                    update_id=update_id,
                    message_id=stored.tg_message_id,
                ),
            )

    out = (
        await session.scalars(
            select(CardDelivery).where(CardDelivery.card_id == fresh.id)
        )
    ).all()
    assert len(out) == 1 and not out[0].initiated
    assert len(bot.sent) == 2
    assert (stored.tg_message_id, None) in bot.rekeyed


async def test_a_press_that_sends_no_card_gives_send_it_back(
    client: AsyncClient,
    session: AsyncSession,
    user: User,
    link: TgLink,
    bot: Bot,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fresh = await standing(session, user)
    await note(session, user, link)
    stored = await session.scalar(select(CoachNote))
    assert stored is not None and stored.tg_message_id is not None

    monkeypatch.setattr(settings, "CARDS_PER_DAY", 0)
    with no_model():
        await deliver(
            client,
            tap(f"s:{stored.id}", update_id=411, message_id=stored.tg_message_id),
        )

    assert bot.texts[-1] == controls.TODAYS
    await session.refresh(stored)
    assert stored.pressed_at is None
    assert (stored.tg_message_id, None) not in bot.rekeyed

    monkeypatch.setattr(settings, "CARDS_PER_DAY", 5)
    with no_model():
        await deliver(
            client,
            tap(f"s:{stored.id}", update_id=412, message_id=stored.tg_message_id),
        )

    assert await session.scalar(
        select(CardDelivery).where(CardDelivery.card_id == fresh.id)
    )
    assert (stored.tg_message_id, None) in bot.rekeyed
