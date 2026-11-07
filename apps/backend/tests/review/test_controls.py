"""The buttons under a card: put it aside, flag it, and what a learner may ask
for once they have answered it. Every press goes through the webhook, as
Telegram sends it, and every button is pressed twice."""

import itertools
import uuid
from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from pydantic_ai.messages import ModelMessage, ModelResponse, TextPart
from pydantic_ai.models.function import AgentInfo, FunctionModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.content.locators import LESSON_SECTION
from app.core.config import settings
from app.harness.agent import tutor
from app.harness.repository import HarnessRepository
from app.models import (
    CardDelivery,
    Document,
    Incident,
    ReviewCard,
    ReviewState,
    Schedule,
    TgLink,
    User,
)
from app.review import cards, controls, ladder
from app.review import repository as review
from app.scheduling import policy, worker
from app.scheduling import repository as scheduling
from app.telegram import thread
from app.telegram.outbox import Outbox
from app.telegram.updates import TAP_BUSY
from tests.conftest import Bot
from tests.harness.conftest import echoing
from tests.review.conftest import (
    LESSON,
    card_models,
    draft,
    echoed,
    grading,
    no_model,
    stored_card,
    writing,
)
from tests.review.conftest import ladder as ladder_row
from tests.scheduling.conftest import NOON
from tests.telegram.conftest import deliver, message, tap

pytestmark = pytest.mark.usefixtures("thread", "indexed_section")

# A second lesson with a card of its own: where "the next due lesson" goes.
OTHER = "lesson:information-theory/kl-divergence"
OTHER_SECTION = "asymmetry"
UPDATES = itertools.count(100)


async def press(client: AsyncClient, data: str, sent: CardDelivery) -> None:
    await deliver(
        client, tap(data, update_id=next(UPDATES), message_id=sent.tg_message_id)
    )


async def say(client: AsyncClient, text: str) -> None:
    await deliver(client, message(text, update_id=next(UPDATES)))


async def deliveries(session: AsyncSession, user: User) -> list[CardDelivery]:
    rows = await session.scalars(
        select(CardDelivery)
        .where(CardDelivery.user_id == user.id)
        .order_by(CardDelivery.sent_at)
    )
    found = list(rows)
    for row in found:
        await session.refresh(row)
    return found


async def state_of(session: AsyncSession, user: User, lesson: str) -> ReviewState:
    state = await review.state_of(session, user.id, lesson)
    assert state is not None
    await session.refresh(state)
    return state


async def card_out(session: AsyncSession, user: User) -> CardDelivery:
    """One poller cycle, and the card it sent."""
    with no_model():
        await worker.cycle(session, NOON)
    return (await deliveries(session, user))[-1]


async def tapped(
    client: AsyncClient, session: AsyncSession, user: User, option: int = 0
) -> CardDelivery:
    """A card out and answered with a tap."""
    sent = await card_out(session, user)
    with no_model():
        await press(client, f"k:{sent.id}:{option}", sent)
    await session.refresh(sent)
    return sent


async def other_lesson(session: AsyncSession, user: User) -> None:
    """A second lesson indexed, due, and with a card already written. Added
    after the first card is out, so that card is the first lesson's: due an
    hour back on both clocks, the poller's and the one a press reads."""
    session.add(
        Document(
            corpus="lesson",
            course_slug="information-theory",
            locator=f"{OTHER}#{OTHER_SECTION}",
            title="Asymmetry",
            breadcrumb="Information Theory › KL › Asymmetry",
            text="KL divergence is not symmetric.",
            anchors=[OTHER_SECTION],
            position=0,
            meta={"word_count": 5},
            content_hash="c" * 64,
        )
    )
    session.add(
        ReviewCard(
            lesson=OTHER,
            anchor=OTHER_SECTION,
            kind="choice",
            level=1,
            prompt="Is KL divergence symmetric?",
            options=["no", "yes"],
            answer=0,
            explanation="Swapping the arguments changes the value.",
            content_hash="c" * 64,
        )
    )
    await session.commit()
    await ladder_row(
        session,
        user,
        lesson=OTHER,
        due_at=min(NOON, datetime.now(UTC)) - timedelta(hours=1),
    )


def asking(text: str) -> FunctionModel:
    def turn(_messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        return ModelResponse(parts=[TextPart(content=text)])

    return FunctionModel(turn)


# Another question


async def test_another_question_is_a_lower_card_in_the_same_message(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    """The scenario: a level 2 card on the train, Another question, a level 1
    card in its place, answered — and no model anywhere near it."""
    state = await ladder_row(session, user, step=1, level=2)
    await stored_card(session, level=2, prompt="Level two: ____")
    easier = await stored_card(session, level=1)
    sent = await card_out(session, user)
    before = (state.step, state.next_due_at, state.level, state.level_run)

    with no_model():
        await press(client, f"a:{sent.id}", sent)
        await press(client, f"a:{sent.id}", sent)

    first, swapped = await deliveries(session, user)
    assert (first.outcome, swapped.outcome) == ("skipped", None)
    assert swapped.card_id == easier.id
    assert swapped.tg_message_id == sent.tg_message_id
    [(message_id, text)] = bot.edited
    assert message_id == sent.tg_message_id
    assert easier.prompt in text
    assert len(bot.sent) == 1
    state = await state_of(session, user, LESSON)
    assert (state.step, state.next_due_at, state.level, state.level_run) == before

    # A swap reuses the message: one card sent today, not two.
    since = sent.sent_at - timedelta(minutes=1)
    assert await review.cards_today(session, user.id, since) == 1

    with no_model():
        await press(client, f"k:{swapped.id}:0", swapped)
    await session.refresh(swapped)
    assert swapped.outcome == "correct"


async def test_another_question_falls_back_to_the_next_due_lesson(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    await ladder_row(session, user)
    await stored_card(session)
    sent = await card_out(session, user)
    await other_lesson(session, user)
    queued = await scheduling.create(
        session,
        user_id=user.id,
        kind="review",
        due_at=NOON + timedelta(hours=1),
        payload={"lesson": OTHER, "completed_at": None},
        created_by="system",
    )

    with no_model():
        await press(client, f"a:{sent.id}", sent)

    _, swapped = await deliveries(session, user)
    other = await session.get(ReviewCard, swapped.card_id)
    assert other is not None and other.lesson == OTHER
    assert "Is KL divergence symmetric?" in bot.edited[-1][1]
    # The poller's row for that lesson goes with it, or it would come twice.
    await session.refresh(queued)
    assert queued.status == "cancelled"


async def test_another_question_with_nothing_written_says_so_and_writes_nothing(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    await ladder_row(session, user)
    await stored_card(session)
    sent = await card_out(session, user)

    with no_model():
        await press(client, f"a:{sent.id}", sent)

    assert controls.NOTHING_ELSE in bot.edited[-1][1]
    assert bot.rekeyed[-1] == (sent.tg_message_id, None)
    assert len(await deliveries(session, user)) == 1


# Not today


async def test_not_today_holds_cards_until_tomorrow_and_lets_a_reminder_through(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    await ladder_row(session, user)
    await stored_card(session)
    sent = await card_out(session, user)

    with no_model():
        await press(client, f"n:{sent.id}", sent)
        await press(client, f"n:{sent.id}", sent)

    await session.refresh(sent)
    await session.refresh(user)
    assert sent.outcome == "skipped"
    tomorrow = policy.tomorrow_open(datetime.now(UTC), policy.Hours.of(user))
    assert user.cards_paused_until == tomorrow
    assert user.muted_until is None
    assert bot.rekeyed == [(sent.tg_message_id, None)]

    await other_lesson(session, user)
    reminder = await scheduling.create(
        session,
        user_id=user.id,
        kind="reminder",
        due_at=NOON - timedelta(minutes=1),
        payload={"note": "the exam on Friday"},
        created_by="user",
    )
    bot.sent.clear()
    with tutor.override(model=echoing()):
        await worker.cycle(session, NOON + timedelta(minutes=1))

    await session.refresh(reminder)
    assert reminder.status == "done"
    assert bot.sent and all(item.keyboard is None for item in bot.sent)
    assert len(await deliveries(session, user)) == 1
    held = await session.scalar(
        select(Schedule).where(Schedule.kind == "review", Schedule.status == "deferred")
    )
    assert held is not None and held.due_at == tomorrow


# This card is wrong


async def test_a_wrong_card_is_retired_filed_and_swapped(
    client: AsyncClient, session: AsyncSession, user: User
) -> None:
    await ladder_row(session, user, level=2)
    wrong = await stored_card(session, level=2, prompt="A broken card: ____")
    easier = await stored_card(session, level=1)
    sent = await card_out(session, user)

    with no_model():
        await press(client, f"w:{sent.id}", sent)
        await press(client, f"w:{sent.id}", sent)

    await session.refresh(wrong)
    assert wrong.status == "retired"
    [incident] = (await session.scalars(select(Incident))).all()
    assert LESSON_SECTION.fullmatch(incident.locator)
    assert incident.locator == cards.locator(wrong)
    assert incident.kind == "error"
    assert str(wrong.id) in incident.summary
    assert wrong.prompt in incident.summary
    first, swapped = await deliveries(session, user)
    assert first.outcome == "skipped"
    assert swapped.card_id == easier.id
    with no_model():
        assert await cards.existing(session, user.id, LESSON, 2) is None


async def test_a_retired_card_is_never_served_again(
    client: AsyncClient, session: AsyncSession, user: User
) -> None:
    await ladder_row(session, user)
    wrong = await stored_card(session)
    sent = await card_out(session, user)
    with no_model():
        await press(client, f"w:{sent.id}", sent)

    # Long enough ago that, retired or not, it would be due to be seen again.
    sent.sent_at = datetime.now(UTC) - cards.UNSEEN_FOR - timedelta(days=1)
    await session.commit()
    with card_models():
        picked = await cards.pick(session, user.id, LESSON, 1)

    assert picked is not None and picked.id != wrong.id


# Next


async def test_next_sends_the_next_due_card_and_spends_no_initiation(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    await ladder_row(session, user)
    await stored_card(session)
    sent = await tapped(client, session, user)
    await other_lesson(session, user)
    since = policy.day_start(NOON, policy.Hours.of(user))
    spent = await scheduling.initiations_today(session, user.id, since)

    with no_model():
        await press(client, f"x:{sent.id}", sent)
        await press(client, f"x:{sent.id}", sent)

    _, following = await deliveries(session, user)
    card = await session.get(ReviewCard, following.card_id)
    assert card is not None and card.lesson == OTHER
    assert len(bot.sent) == 2
    assert await scheduling.initiations_today(session, user.id, since) == spent
    # The pressed button leaves the feedback; the rest stay.
    message_id, keyboard = bot.rekeyed[-1]
    assert message_id == sent.tg_message_id
    assert keyboard is not None
    assert "x:" not in str(keyboard) and f"e:{sent.id}" in str(keyboard)


async def test_next_stops_at_the_daily_cap(
    client: AsyncClient,
    session: AsyncSession,
    user: User,
    bot: Bot,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "CARDS_PER_DAY", 1)
    await ladder_row(session, user)
    await stored_card(session)
    sent = await tapped(client, session, user)
    await other_lesson(session, user)

    with no_model():
        await press(client, f"x:{sent.id}", sent)
        await press(client, f"x:{sent.id}", sent)

    assert bot.texts[-1] == controls.TODAYS
    assert bot.texts.count(controls.TODAYS) == 1
    assert len(await deliveries(session, user)) == 1


# Harder one


async def test_a_harder_card_is_written_and_a_right_answer_raises_the_level(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    await ladder_row(session, user)
    await stored_card(session)
    sent = await tapped(client, session, user)
    state = await state_of(session, user, LESSON)
    rung = (state.step, state.next_due_at)

    harder_batch = [draft(kind="tell_apart", prompt=f"Harder {i}") for i in range(3)]
    with card_models(write=writing(*harder_batch)):
        await press(client, f"h:{sent.id}", sent)
    with no_model():
        await press(client, f"h:{sent.id}", sent)

    _, up = await deliveries(session, user)
    card = await session.get(ReviewCard, up.card_id)
    assert card is not None and card.level == 2
    assert up.harder
    assert len(bot.sent) == 2

    with no_model():
        await press(client, f"k:{up.id}:0", up)

    state = await state_of(session, user, LESSON)
    assert (state.level, state.level_run) == (2, 0)
    assert (state.step, state.next_due_at) == rung


async def test_a_harder_card_at_the_level_already_held_keeps_the_run(
    client: AsyncClient, session: AsyncSession, user: User
) -> None:
    """A level 1 card served under a level 2 ladder (the hold, an Another):
    Harder and right is no reason to lose the run of two."""
    await ladder_row(session, user)
    await stored_card(session)
    await stored_card(session, level=2, prompt="Harder: ____")
    sent = await tapped(client, session, user)
    state = await state_of(session, user, LESSON)
    state.level, state.level_run = 2, 2
    await session.commit()

    with no_model():
        await press(client, f"h:{sent.id}", sent)
        _, up = await deliveries(session, user)
        await press(client, f"k:{up.id}:0", up)

    state = await state_of(session, user, LESSON)
    assert (state.level, state.level_run) == (2, 2)


async def test_a_wrong_answer_to_a_harder_card_changes_nothing(
    client: AsyncClient, session: AsyncSession, user: User
) -> None:
    await ladder_row(session, user)
    await stored_card(session)
    await stored_card(session, level=2, prompt="Harder: ____")
    sent = await tapped(client, session, user)
    state = await state_of(session, user, LESSON)
    before = (state.step, state.next_due_at, state.level, state.level_run)

    with no_model():
        await press(client, f"h:{sent.id}", sent)
        _, up = await deliveries(session, user)
        await press(client, f"k:{up.id}:1", up)

    await session.refresh(up)
    assert up.outcome == "wrong"
    state = await state_of(session, user, LESSON)
    assert (state.step, state.next_due_at, state.level, state.level_run) == before


async def test_there_is_no_harder_card_than_level_3(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    await ladder_row(session, user, step=2, level=3)
    await stored_card(session, level=3)
    sent = await tapped(client, session, user)

    feedback = str(bot.rekeyed[-1][1])
    assert f"x:{sent.id}" in feedback and f"h:{sent.id}" not in feedback

    with no_model():
        await press(client, f"h:{sent.id}", sent)
    assert len(await deliveries(session, user)) == 1


# Explain


async def test_explain_runs_the_tutor_on_the_card_and_the_choice(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    await ladder_row(session, user)
    card = await stored_card(session)
    sent = await tapped(client, session, user, option=1)
    bot.sent.clear()

    with tutor.override(model=echoing()):
        await press(client, f"e:{sent.id}", sent)
    explained = echoed(bot)
    bot.sent.clear()
    with no_model():
        await press(client, f"e:{sent.id}", sent)

    assert card.prompt in explained
    assert "tapped 'maximum': wrong" in explained
    assert "Right answer: average" in explained
    assert bot.sent == []


async def test_a_busy_thread_gives_the_button_back(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    """Told to press again, the learner must find the button still there."""
    await ladder_row(session, user)
    await stored_card(session)
    sent = await tapped(client, session, user)
    chat = await thread.of(session, user.id)
    assert await HarnessRepository(session, user.id).claim_run(chat, uuid.uuid4())

    with no_model():
        await press(client, f"e:{sent.id}", sent)

    await session.refresh(sent)
    assert sent.follow_ups == {}
    assert bot.texts[-1] == TAP_BUSY


# In my own words


async def test_own_words_passed_climbs_past_the_cap_and_grades_once(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    """A tap at level 1 stops at rung 1; recall in their own words does not."""
    await ladder_row(session, user, step=ladder.STEP_CAP[1])
    await stored_card(session)
    sent = await tapped(client, session, user)
    state = await state_of(session, user, LESSON)
    assert (state.step, state.level_run) == (ladder.STEP_CAP[1], 1)

    with tutor.override(model=asking("In one line: what is entropy?")):
        await press(client, f"m:{sent.id}", sent)
    with no_model():
        await press(client, f"m:{sent.id}", sent)
    await session.refresh(sent)
    assert sent.follow_ups == {review.OWN_WORDS: review.ASKED}
    assert bot.texts[-1] == "In one line: what is entropy?"

    with tutor.override(model=grading("passed")):
        await say(client, "the average surprisal, weighted by probability")
    state = await state_of(session, user, LESSON)
    assert (state.step, state.level_run) == (ladder.STEP_CAP[1] + 1, 2)

    with tutor.override(model=grading("passed")):
        await say(client, "and once more")
    await session.refresh(sent)
    assert sent.follow_ups == {review.OWN_WORDS: "passed"}
    assert sent.outcome == "correct"
    state = await state_of(session, user, LESSON)
    assert (state.step, state.level_run) == (ladder.STEP_CAP[1] + 1, 2)


# Two harder cards skipped


async def skipped_at(
    session: AsyncSession, user: User, card: ReviewCard, moment: datetime
) -> None:
    session.add(
        CardDelivery(
            user_id=user.id,
            card_id=card.id,
            tg_message_id=1,
            sent_at=moment,
            answered_at=moment,
            outcome="skipped",
        )
    )
    await session.commit()


async def test_two_harder_cards_skipped_serve_only_level_1_for_a_week(
    session: AsyncSession, user: User
) -> None:
    await ladder_row(session, user, level=2)
    harder = await stored_card(session, level=2, prompt="Harder: ____")
    easy = await stored_card(session, level=1)
    now = datetime.now(UTC)
    # Older than the lesson's rest, so the poller sends it a card at all.
    await skipped_at(session, user, harder, now - timedelta(days=5))
    await skipped_at(session, user, harder, now - timedelta(days=4))

    assert await review.level_one_only(session, user.id, now)
    assert not await review.level_one_only(session, user.id, now + review.SKIP_HOLD)
    sent = await card_out(session, user)
    assert sent.card_id == easy.id


async def test_a_first_skip_older_than_a_week_does_not_hold_the_level(
    session: AsyncSession, user: User
) -> None:
    await ladder_row(session, user, level=2)
    harder = await stored_card(session, level=2, prompt="Harder: ____")
    now = datetime.now(UTC)
    await skipped_at(session, user, harder, now - timedelta(days=10))
    await skipped_at(session, user, harder, now - timedelta(days=1))

    assert not await review.level_one_only(session, user.id, now)


async def test_a_harder_card_answered_between_two_skips_breaks_the_run(
    session: AsyncSession, user: User
) -> None:
    harder = await stored_card(session, level=2, prompt="Harder: ____")
    now = datetime.now(UTC)
    await skipped_at(session, user, harder, now - timedelta(days=2))
    session.add(
        CardDelivery(
            user_id=user.id,
            card_id=harder.id,
            tg_message_id=2,
            sent_at=now - timedelta(days=1, hours=12),
            answered_at=now - timedelta(days=1, hours=12),
            outcome="correct",
        )
    )
    await session.commit()
    await skipped_at(session, user, harder, now - timedelta(days=1))

    assert not await review.level_one_only(session, user.id, now)


# Tidy chat


async def test_a_new_card_folds_an_open_one_and_leaves_an_answered_one(
    client: AsyncClient, session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    await ladder_row(session, user)
    card = await stored_card(session)
    answered = await tapped(client, session, user)
    outbox = Outbox(session=session, link=link)
    open_one = await cards.deliver(session, outbox, user.id, card)
    edits = len(bot.edited)

    await cards.deliver(session, outbox, user.id, card)

    folded = bot.edited[edits:]
    assert [message_id for message_id, _ in folded] == [open_one.tg_message_id]
    assert folded[0][1] == cards.skipped(await cards.title_of(session, card))
    assert bot.rekeyed[-1] == (open_one.tg_message_id, None)
    assert answered.tg_message_id not in [message_id for message_id, _ in folded]
    await session.refresh(open_one)
    assert open_one.outcome == "skipped"

    # Folded once: the next card leaves it alone.
    edits = len(bot.edited)
    await cards.deliver(session, outbox, user.id, card)
    assert open_one.tg_message_id not in [m for m, _ in bot.edited[edits:]]
