"""Order cards: steps listed shuffled, numbers tapped in sequence, the order so
far kept on the delivery, graded whole on the last tap."""

from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from httpx import AsyncClient
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CardDelivery, ReviewCard, ReviewState, User
from app.review import cards, ladder, subject, writer
from app.scheduling import policy, worker
from tests.conftest import Bot
from tests.review.conftest import (
    LESSON,
    SECTION,
    card_models,
    draft,
    no_model,
    section_hash,
    writing,
)
from tests.review.conftest import ladder as ladder_row
from tests.scheduling.conftest import NOON
from tests.telegram.conftest import deliver, tap

pytestmark = pytest.mark.usefixtures("link", "indexed_section")

STEPS = [
    "Write the surprisal of each outcome",
    "Weight each surprisal by its probability",
    "Sum the weighted surprisals",
    "Read the sum as the entropy",
]
# Shown as 1. Sum, 2. Write, 3. Read, 4. Weight: the right order is 2, 4, 1, 3.
SHOWN = [STEPS[2], STEPS[0], STEPS[3], STEPS[1]]
RIGHT = [1, 3, 0, 2]


def order_draft(**overrides: Any) -> dict[str, Any]:
    return (
        draft(
            kind="order",
            prompt="Put the steps of computing entropy in order.",
            options=STEPS,
            answer=[0, 1, 2, 3],
            explanation="Each step works on what the one before it produced.",
        )
        | overrides
    )


async def order_card(session: AsyncSession) -> ReviewCard:
    card = ReviewCard(
        lesson=LESSON,
        anchor=SECTION,
        kind="order",
        level=3,
        prompt="Put the steps of computing entropy in order.",
        options=SHOWN,
        answer=RIGHT,
        explanation="Each step works on what the one before it produced.",
        content_hash=await section_hash(session),
    )
    session.add(card)
    await session.commit()
    return card


class Taps:
    """The learner's thumb on one delivered card. Every tap is its own update,
    handled in its own session: nothing carries over between two of them but
    the database, as across a restart."""

    def __init__(self, client: AsyncClient, sent: CardDelivery) -> None:
        self.client = client
        self.sent = sent
        self.update_id = 100

    async def press(self, *steps: int | str) -> None:
        for step in steps:
            self.update_id += 1
            await deliver(
                self.client,
                tap(
                    f"o:{self.sent.id}:{step}",
                    update_id=self.update_id,
                    message_id=self.sent.tg_message_id,
                ),
            )


async def delivered(
    session: AsyncSession, user: User, *, step: int = 0, level: int = 3
) -> tuple[ReviewState, CardDelivery]:
    state = await ladder_row(session, user, step=step, level=level)
    await order_card(session)
    with no_model():
        await worker.cycle(session, NOON)
    sent = await session.scalar(
        select(CardDelivery).where(CardDelivery.user_id == user.id)
    )
    assert sent is not None
    return state, sent


def numbers(sent: CardDelivery, *left: int, reset: bool = False) -> list[Any]:
    row = [
        {"text": str(step + 1), "callback_data": f"o:{sent.id}:{step}"} for step in left
    ]
    controls = [
        [
            {"text": "Another question", "callback_data": f"a:{sent.id}"},
            {"text": "Not today", "callback_data": f"n:{sent.id}"},
        ],
        [{"text": "This card is wrong", "callback_data": f"w:{sent.id}"}],
    ]
    if not reset:
        return [row, *controls]
    return [row, [{"text": "Reset", "callback_data": f"o:{sent.id}:r"}], *controls]


def edits(bot: Bot) -> list[tuple[int, str, Any]]:
    """Every text edit with the keyboard it left."""
    return [
        (message_id, text, keyboard)
        for (message_id, text), (_, keyboard) in zip(
            bot.edited, bot.rekeyed, strict=True
        )
    ]


def test_an_order_card_is_never_shown_in_its_answer() -> None:
    card = writer.Draft.model_validate(order_draft())
    for _ in range(200):
        shown = writer.shuffled(card)
        assert shown.answer != list(range(len(STEPS)))
        assert isinstance(shown.answer, list)
        assert [shown.options[step] for step in shown.answer] == STEPS


@pytest.mark.parametrize(
    "overrides",
    [
        {"answer": [0, 1, 1, 3]},
        {"answer": [0, 1, 2]},
        {"answer": 0},
        {"options": STEPS[:2], "answer": [0, 1]},
        {"options": [*STEPS, "a", "b"], "answer": list(range(6))},
    ],
)
def test_an_order_card_answers_with_every_step_once(
    overrides: dict[str, Any],
) -> None:
    with pytest.raises(ValidationError):
        writer.Draft.model_validate(order_draft(**overrides))


def test_steps_may_be_long_but_options_may_not() -> None:
    long = "x" * (writer.OPTION_CHARS + 1)
    writer.Draft.model_validate(order_draft(options=[long, *STEPS[1:]]))
    with pytest.raises(ValidationError):
        writer.Draft.model_validate(draft(options=[long, "maximum"]))


@pytest.mark.parametrize("kind", ["gap", "choice", "tell_apart"])
def test_a_card_that_is_not_an_order_card_answers_with_one_index(kind: str) -> None:
    with pytest.raises(ValidationError):
        writer.Draft.model_validate(draft(kind=kind, answer=[0]))


async def test_a_written_order_card_is_stored_shuffled(
    session: AsyncSession, user: User
) -> None:
    with card_models(write=writing(order_draft())):
        [card] = await cards.write(session, user.id, LESSON, 3)

    assert isinstance(card.answer, list)
    assert card.answer != [0, 1, 2, 3]
    assert [card.options[step] for step in card.answer] == STEPS


async def test_an_order_card_lists_its_steps_and_its_buttons_are_numbers(
    session: AsyncSession, user: User, bot: Bot
) -> None:
    _, sent = await delivered(session, user)

    [message] = bot.sent
    assert "1. Sum the weighted surprisals\n2. Write the surprisal" in message.text
    assert "4. Weight each surprisal by its probability" in message.text
    assert message.keyboard == numbers(sent, 0, 1, 2, 3)


async def test_each_tap_shows_the_order_so_far_and_is_kept_on_the_row(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    _, sent = await delivered(session, user)
    taps = Taps(client, sent)

    with no_model():
        await taps.press(1)
        await session.refresh(sent)
        assert (sent.chosen, sent.outcome, sent.answered_at) == ([1], None, None)
        await taps.press(3)

    await session.refresh(sent)
    assert sent.chosen == [1, 3]
    assert sent.outcome is None
    [(_, first, after_one), (_, second, after_two)] = edits(bot)
    assert "Your order: 2" in first
    assert after_one == numbers(sent, 0, 2, 3, reset=True)
    assert "Your order: 2 → 4" in second
    assert after_two == numbers(sent, 0, 2, reset=True)


@pytest.mark.parametrize(
    ("taps", "outcome"),
    [(RIGHT, "correct"), ([1, 3, 2, 0], "wrong")],
)
async def test_the_last_tap_grades_the_whole_order_as_any_card_is_graded(
    client: AsyncClient,
    session: AsyncSession,
    user: User,
    bot: Bot,
    taps: list[int],
    outcome: ladder.CardOutcome,
) -> None:
    state, sent = await delivered(session, user, step=1, level=3)
    before = ladder.Rung(step=state.step, next_due_at=state.next_due_at)

    with no_model():
        await Taps(client, sent).press(*taps)

    await session.refresh(sent)
    await session.refresh(state)
    assert (sent.outcome, sent.chosen) == (outcome, taps)
    assert sent.answered_at is not None
    assert (state.level, state.level_run) == ladder.next_level(3, 0, outcome)
    assert state.step == ladder.after_card(before, 3, outcome, NOON).step
    assert state.last_outcome == outcome
    feedback, keyboard = edits(bot)[-1][1:]
    # Level 3 has no harder card.
    assert keyboard is not None
    assert [b["text"] for row in keyboard for b in row] == [
        "Next",
        "Explain",
        "In my own words",
    ]
    mark = "✓" if outcome == "correct" else "✗"
    assert f"{mark} 2 → 4 → 1 → 3." in feedback
    assert "Each step works on what the one before it produced." in feedback


async def test_reset_clears_the_order_and_brings_every_number_back(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    _, sent = await delivered(session, user)
    taps = Taps(client, sent)

    with no_model():
        await taps.press(1, 3, "r")

    await session.refresh(sent)
    assert sent.chosen is None
    _, text, keyboard = edits(bot)[-1]
    assert "Your order" not in text
    assert keyboard == numbers(sent, 0, 1, 2, 3)

    with no_model():
        await taps.press(*RIGHT)
    await session.refresh(sent)
    assert sent.outcome == "correct"


async def test_a_repeated_number_a_reset_with_nothing_placed_and_a_stray_tap_are_ignored(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    _, sent = await delivered(session, user)
    taps = Taps(client, sent)

    with no_model():
        await taps.press("r", 1, 1, 9, "x")
        # An answer button's prefix on an order card is not an answer to it.
        await deliver(client, tap(f"k:{sent.id}:1", update_id=1))

    await session.refresh(sent)
    assert (sent.chosen, sent.outcome) == ([1], None)
    assert len(bot.edited) == 1


async def test_a_tap_on_a_finished_order_card_changes_nothing(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    state, sent = await delivered(session, user)
    taps = Taps(client, sent)

    with no_model():
        await taps.press(*RIGHT)
        await session.refresh(state)
        graded = (state.step, state.level, state.level_run)
        await taps.press("r", 0)

    await session.refresh(sent)
    await session.refresh(state)
    assert (sent.outcome, sent.chosen) == ("correct", RIGHT)
    assert (state.step, state.level, state.level_run) == graded
    assert len(bot.edited) == len(RIGHT)


async def test_a_half_answered_card_is_still_an_unanswered_one(
    client: AsyncClient, session: AsyncSession, user: User
) -> None:
    """What the card controls and the tidy rule go by: an order card halfway
    through is as open as one nobody touched, and lapses the same way."""
    _, sent = await delivered(session, user)

    with no_model():
        await Taps(client, sent).press(1, 3)

    open_cards = await cards.recent(session, user.id, NOON - timedelta(days=1))
    [block] = await subject.open_block(session, open_cards)
    assert "not answered yet" in block.body
    assert (
        "Right answer: 'Write the surprisal of each outcome' then "
        "'Weight each surprisal by its probability'" in block.body
    )

    await cards.expire(session, datetime.now(UTC) + policy.IGNORED_AFTER)
    await session.refresh(sent)
    assert (sent.outcome, sent.chosen, sent.answered_at) == ("ignored", [1, 3], None)


async def test_a_lapsed_half_answered_card_cannot_be_finished(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    """Closed as silence is closed: the last step placed a day late must not
    grade it and move the ladder."""
    _, sent = await delivered(session, user)
    taps = Taps(client, sent)
    with no_model():
        await taps.press(1, 3)
    await cards.expire(session, datetime.now(UTC) + policy.IGNORED_AFTER)
    edits = len(bot.edited)

    with no_model():
        await taps.press(0, 2)

    await session.refresh(sent)
    assert (sent.outcome, sent.chosen, sent.answered_at) == ("ignored", [1, 3], None)
    assert len(bot.edited) == edits
