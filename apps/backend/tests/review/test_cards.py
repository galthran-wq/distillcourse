"""Cards: written on first need, checked before they are kept, sent by the
poller, and graded by a tap with no model anywhere near it."""

from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.harness.limits import LimitExceeded
from app.harness.usage import COST_USD
from app.models import (
    BackgroundRun,
    CardDelivery,
    Message,
    ReviewCard,
    ReviewState,
    User,
)
from app.review import cards, ladder
from app.scheduling import policy, worker
from tests.conftest import TG_CHAT_ID, Bot
from tests.review.conftest import (
    LESSON,
    SECTION,
    card_models,
    checking,
    draft,
    no_model,
    reviews,
    section_hash,
    stored_card,
    writing,
)
from tests.review.conftest import ladder as ladder_row
from tests.scheduling.conftest import NOON
from tests.telegram.conftest import deliver, tap

pytestmark = pytest.mark.usefixtures("link", "indexed_section")


async def all_cards(session: AsyncSession) -> list[ReviewCard]:
    return list(await session.scalars(select(ReviewCard).order_by(ReviewCard.id)))


async def deliveries(session: AsyncSession, user: User) -> list[CardDelivery]:
    return list(
        await session.scalars(
            select(CardDelivery)
            .where(CardDelivery.user_id == user.id)
            .order_by(CardDelivery.sent_at)
        )
    )


async def refreshed(session: AsyncSession, state: ReviewState) -> ReviewState:
    await session.refresh(state)
    return state


async def sent_before(
    session: AsyncSession, user: User, card: ReviewCard, ago: timedelta
) -> CardDelivery:
    row = CardDelivery(
        user_id=user.id,
        card_id=card.id,
        tg_message_id=1,
        sent_at=datetime.now(UTC) - ago,
    )
    session.add(row)
    await session.commit()
    return row


async def test_a_due_review_is_a_card_with_no_tutor_run(
    session: AsyncSession, user: User, bot: Bot
) -> None:
    await ladder_row(session, user)
    card = await stored_card(session)

    with no_model():
        await worker.cycle(session, NOON)

    [sent] = await deliveries(session, user)
    assert sent.card_id == card.id
    assert bot.sent[0].tg_chat_id == TG_CHAT_ID
    assert "Entropy is the ____ of surprisal." in bot.texts[0]
    assert bot.sent[0].keyboard == [
        [{"text": option, "callback_data": f"k:{sent.id}:{index}"}]
        for index, option in enumerate(card.options)
    ]
    assert await session.scalar(select(func.count()).select_from(Message)) == 0
    assert [row.status for row in await reviews(session, user)] == ["done"]


async def test_a_first_review_writes_a_checked_batch_and_sends_one_of_it(
    session: AsyncSession, user: User
) -> None:
    await ladder_row(session, user)

    with card_models():
        await worker.cycle(session, NOON)

    written = await all_cards(session)
    assert len(written) == 3
    assert {(card.level, card.anchor, card.owner_id) for card in written} == {
        (1, SECTION, None)
    }
    assert {card.content_hash for card in written} == {await section_hash(session)}
    assert len(await deliveries(session, user)) == 1


async def test_the_writer_is_handed_the_lesson_rather_than_asked_to_find_it(
    session: AsyncSession, user: User
) -> None:
    asked: list[str] = []

    with card_models(write=writing(asked=asked)):
        await cards.write(session, user.id, LESSON, 2)

    assert "Entropy is the probability-weighted average of surprisal." in asked[0]
    assert f"anchor `{SECTION}`" in asked[0]
    assert "level 2" in asked[0]


async def test_a_card_the_check_rejects_is_dropped(
    session: AsyncSession, user: User
) -> None:
    with card_models(check=checking(True, False, True)):
        written = await cards.write(session, user.id, LESSON, 1)

    assert [card.prompt for card in written] == ["Card 0: ____", "Card 2: ____"]
    assert len(await all_cards(session)) == 2


async def test_a_card_of_the_wrong_kind_or_section_never_reaches_the_check(
    session: AsyncSession, user: User
) -> None:
    with card_models(
        write=writing(draft(kind="tell_apart"), draft(section="nowhere")),
        check=checking(),
    ):
        assert await cards.write(session, user.id, LESSON, 1) == []


async def test_when_every_card_is_rejected_nothing_is_sent_and_the_review_waits_a_day(
    session: AsyncSession, user: User, bot: Bot
) -> None:
    state = await ladder_row(session, user)

    with card_models(check=checking(False, False, False)):
        await worker.cycle(session, NOON)

    assert bot.sent == []
    assert await all_cards(session) == []
    state = await refreshed(session, state)
    assert (state.step, state.last_outcome) == (0, "deferred")
    assert state.next_due_at == NOON + ladder.DEFERRAL
    assert [row.status for row in await reviews(session, user)] == ["cancelled"]

    # Not tried again until then: the ladder is no longer due.
    with no_model():
        await worker.cycle(session, NOON + timedelta(minutes=1))
    assert bot.sent == []


async def test_a_card_whose_section_changed_is_not_served(
    session: AsyncSession, user: User
) -> None:
    stale = await stored_card(session, content_hash="b" * 64)

    with card_models():
        picked = await cards.pick(session, user.id, LESSON, 1)

    assert picked is not None
    assert picked.id != stale.id
    assert picked.content_hash == await section_hash(session)


async def test_a_card_seen_in_the_last_14_days_is_not_sent_again(
    session: AsyncSession, user: User
) -> None:
    card = await stored_card(session)
    await sent_before(session, user, card, cards.UNSEEN_FOR - timedelta(days=1))

    with card_models():
        picked = await cards.pick(session, user.id, LESSON, 1)

    assert picked is not None
    assert picked.id != card.id


async def test_a_card_seen_long_ago_is_served_again_for_free(
    session: AsyncSession, user: User
) -> None:
    card = await stored_card(session)
    await sent_before(session, user, card, cards.UNSEEN_FOR + timedelta(days=1))

    with no_model():
        picked = await cards.pick(session, user.id, LESSON, 1)

    assert picked is not None
    assert picked.id == card.id


async def test_cards_are_shared_unless_aimed_at_one_learner(
    session: AsyncSession, user: User, other_user: User
) -> None:
    shared = await stored_card(session)
    theirs = await stored_card(session, prompt="Theirs: ____", owner=other_user)

    with no_model():
        picked = await cards.pick(session, user.id, LESSON, 1)
    with card_models():
        aimed = await cards.write(
            session, user.id, LESSON, 1, focus="reads entropy as a maximum"
        )

    assert picked is not None
    assert picked.id == shared.id != theirs.id
    assert {card.owner_id for card in aimed} == {user.id}


async def test_a_tap_grades_with_no_model_and_a_second_tap_changes_nothing(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    state = await ladder_row(session, user)
    await stored_card(session)

    with no_model():
        await worker.cycle(session, NOON)
        [sent] = await deliveries(session, user)
        await deliver(
            client,
            tap(f"k:{sent.id}:0", update_id=1, message_id=sent.tg_message_id),
        )
        await deliver(
            client,
            tap(f"k:{sent.id}:1", update_id=2, message_id=sent.tg_message_id),
        )

    await session.refresh(sent)
    state = await refreshed(session, state)
    assert (sent.outcome, sent.chosen) == ("correct", 0)
    assert sent.answered_at is not None
    assert (state.step, state.level, state.level_run) == (1, 1, 1)
    assert state.last_outcome == "correct"
    [(message_id, feedback)] = bot.edited
    assert message_id == sent.tg_message_id
    assert "✓ average. Each outcome's surprisal" in feedback
    link = (
        f"{settings.FRONTEND_HOST}/courses/information-theory/lessons/"
        f"entropy-as-average-surprise#{SECTION}"
    )
    assert f'<a href="{link}">The probability-weighted average' in feedback


async def test_a_wrong_tap_shows_the_right_answer_and_eases_the_next_card(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    state = await ladder_row(session, user, step=1, level=2)
    await stored_card(session, level=2)

    with no_model():
        await worker.cycle(session, NOON)
        [sent] = await deliveries(session, user)
        await deliver(client, tap(f"k:{sent.id}:2"))

    state = await refreshed(session, state)
    assert (state.step, state.level, state.level_run) == (0, 1, 0)
    assert "✗ average." in bot.edited[0][1]


async def test_a_tap_on_a_card_sent_to_someone_else_does_nothing(
    client: AsyncClient, session: AsyncSession, other_user: User, bot: Bot
) -> None:
    card = await stored_card(session)
    theirs = await sent_before(session, other_user, card, timedelta(hours=1))

    with no_model():
        await deliver(client, tap(f"k:{theirs.id}:0"))

    await session.refresh(theirs)
    assert theirs.outcome is None
    assert bot.edited == []


async def test_writing_is_charged_to_background_runs_and_counts_toward_the_ceiling(
    session: AsyncSession, user: User
) -> None:
    with card_models():
        await cards.write(session, user.id, LESSON, 1)

    runs = (
        await session.scalars(select(BackgroundRun).order_by(BackgroundRun.id))
    ).all()
    assert [(run.kind, run.user_id) for run in runs] == [
        ("card_writer", user.id),
        ("card_check", user.id),
    ]

    session.add(
        BackgroundRun(
            user_id=None,
            kind="card_writer",
            usage={COST_USD: settings.MONTHLY_COST_CEILING_USD},
        )
    )
    await session.commit()
    with no_model(), pytest.raises(LimitExceeded):
        await cards.write(session, user.id, LESSON, 1)


async def test_a_spent_budget_holds_a_review_that_needs_a_new_card(
    session: AsyncSession, user: User, bot: Bot
) -> None:
    await ladder_row(session, user)
    session.add(
        BackgroundRun(
            user_id=user.id,
            kind="card_writer",
            usage={COST_USD: settings.MONTHLY_COST_CEILING_USD},
        )
    )
    await session.commit()

    with no_model():
        await worker.cycle(session, NOON)

    [row] = await reviews(session, user)
    assert (row.status, row.attempts) == ("deferred", 0)
    assert row.due_at == policy.tomorrow_open(NOON, policy.Hours.of(user))
    assert bot.sent == []


async def test_a_card_unanswered_for_a_day_is_ignored_and_the_ladder_stays(
    session: AsyncSession, user: User
) -> None:
    state = await ladder_row(session, user, step=1)
    card = await stored_card(session)
    stale = await sent_before(session, user, card, policy.IGNORED_AFTER)
    fresh = await sent_before(session, user, card, timedelta(hours=23))

    await cards.expire(session, datetime.now(UTC))

    await session.refresh(stale)
    await session.refresh(fresh)
    assert (stale.outcome, fresh.outcome) == ("ignored", None)
    state = await refreshed(session, state)
    assert (state.step, state.last_outcome) == (1, None)
