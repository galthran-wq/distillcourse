import uuid
from datetime import UTC, datetime
from typing import Any

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.routes.labs import DAY, _daily_budgets
from app.core.rate_limit import FixedWindow
from app.labs import judge, repository
from app.models import (
    LabChallenge,
    LabCheckpointState,
    LessonProgress,
    ReviewState,
    User,
)
from tests.labs.conftest import (
    DIGEST,
    FAILING,
    LABS,
    LESSON,
    MANIFEST,
    PASSING,
    PROGRESS,
    SPECS,
    SURPRISAL,
    VERSION,
    completions,
    post,
    refusing,
)

# Every test here is about a lab that exists.
pytestmark = pytest.mark.usefixtures("lab")


async def state(
    session: AsyncSession, user: User, checkpoint: str
) -> LabCheckpointState:
    row = await session.get(
        LabCheckpointState, (user.id, LESSON, checkpoint), populate_existing=True
    )
    assert row is not None
    return row


async def pass_all_required(client: AsyncClient) -> Any:
    """Everything the lab gates completion on, in order."""
    await post(client, "surprisal", SURPRISAL)
    await post(client, "entropy-terms", {"digest": DIGEST})
    return await post(client, "beat-baseline", PASSING)


async def test_a_correct_answer_passes_and_counts_towards_the_lab(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    answered = await post(notebook, "surprisal", SURPRISAL)

    assert answered.status_code == 200
    assert answered.json() == {
        "passed": True,
        "hint": None,
        "score": None,
        "pending": False,
        "progress": {"passed_required": 1, "total_required": 3},
    }
    assert (await state(session, user, "surprisal")).attempts == 1


async def test_a_declared_mistake_is_named_and_kept_for_the_page(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    answered = await post(notebook, "surprisal", {"values": [[0.6931, 1.3863]]})

    assert answered.json()["passed"] is False
    assert answered.json()["hint"] == "Natural log, not base two."
    stored = await state(session, user, "surprisal")
    assert (stored.attempts, stored.passed_at, stored.feedback) == (
        1,
        None,
        "Natural log, not base two.",
    )


async def test_a_large_output_is_compared_by_digest(notebook: AsyncClient) -> None:
    passed = await post(notebook, "entropy-terms", {"digest": DIGEST})
    failed = await post(notebook, "entropy-terms", {"digest": "c3" * 32})

    assert passed.json()["passed"] is True
    assert failed.json()["passed"] is False


async def test_a_payload_the_checkpoint_cannot_take_is_a_400(
    notebook: AsyncClient,
) -> None:
    refused = await post(notebook, "surprisal", "not an output")

    assert refused.status_code == 400


async def test_a_hold_out_the_size_of_the_largest_lab_s_gets_past_the_size_gate(
    notebook: AsyncClient,
) -> None:
    """fraud-ml's cost-aware lab posts 23,108 scores, about 457 KiB of JSON;
    this one is refused for its length, not for its size."""
    refused = await post(notebook, "beat-baseline", [0.123456789012345] * 30_000)

    assert refused.status_code == 400


async def test_a_metric_keeps_the_best_score_it_has_ever_seen(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    """A learner who tries a worse model after passing has still passed, and
    the number the page shows is the best one they reached."""
    short = await post(notebook, "beat-baseline", FAILING)
    good = await post(notebook, "beat-baseline", PASSING)
    await post(notebook, "beat-baseline", FAILING)

    assert (short.json()["passed"], short.json()["score"]) == (False, 0.8125)
    assert (good.json()["passed"], good.json()["score"]) == (True, 1.0)
    stored = await state(session, user, "beat-baseline")
    assert (stored.attempts, stored.best_score) == (3, 1.0)
    assert stored.passed_at is not None


async def test_a_review_is_answered_by_the_judge(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    """What the judge decides and how it decides it is `test_judge.py`; here it
    is that the same endpoint grades the third kind at all."""
    answered = await post(notebook, "why-uniform", "Because it spreads the mass.")

    assert answered.json()["passed"] is True
    assert answered.json()["pending"] is False
    assert (await state(session, user, "why-uniform")).passed_at is not None


async def test_a_retried_submission_is_answered_with_its_stored_verdict(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    """The notebook mints the id, so a post retried over a dropped connection
    must not spend a second attempt."""
    once = uuid.uuid4()

    first = await post(notebook, "surprisal", SURPRISAL, id=once)
    again = await post(notebook, "surprisal", {"values": [[9.0]]}, id=once)

    assert first.json() == again.json()
    assert (await state(session, user, "surprisal")).attempts == 1


async def test_an_id_that_answered_another_checkpoint_is_refused(
    notebook: AsyncClient,
) -> None:
    once = uuid.uuid4()
    await post(notebook, "surprisal", SURPRISAL, id=once)

    reused = await post(notebook, "entropy-terms", {"digest": DIGEST}, id=once)

    assert reused.status_code == 409


async def test_only_a_graded_submission_costs_a_day_s_attempt(
    notebook: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The daily budget pays for the work a checkpoint makes the server do, so
    what the server never grades is free: a notebook from an older build, a
    checkpoint nobody built, a payload the checkpoint refuses, a judging the
    platform could not do, and a retry of an id already answered."""
    monkeypatch.setitem(_daily_budgets, "review", FixedWindow(1, window=DAY))
    once = uuid.uuid4()

    stale = await post(notebook, "why-uniform", "Because.", content_version="f0" * 32)
    unbuilt = await post(notebook, "made-up", "Because.")
    refused = await post(notebook, "why-uniform", "   ")
    with judge.agent.override(model=refusing(RuntimeError("openrouter is down"))):
        pending = await post(notebook, "why-uniform", "Because it is flat.")
    first = await post(notebook, "why-uniform", "Because it spreads the mass.", id=once)
    retried = await post(notebook, "why-uniform", "Because it is flat.", id=once)
    spent = await post(notebook, "why-uniform", "Because entropy is concave.")

    assert [r.status_code for r in (stale, unbuilt, refused)] == [409, 404, 400]
    assert pending.json()["pending"] is True
    assert [first.status_code, retried.status_code] == [200, 200]
    assert spent.status_code == 429
    # The budget is a day's, so the refusal has to say a day: the notebook
    # client turns this header into the wait it prints, and without it a
    # learner is told to try "later" with no idea that later means tomorrow.
    assert spent.headers["retry-after"] == str(int(DAY.total_seconds()))


async def test_a_notebook_from_an_older_build_is_turned_away(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    """The lab was rebuilt: the inputs the learner computed on are not the ones
    the stored outputs came from, so a comparison would be meaningless."""
    stale = await post(notebook, "surprisal", SURPRISAL, content_version="f0" * 32)

    assert stale.status_code == 409
    assert await session.get(LabCheckpointState, (user.id, LESSON, "surprisal")) is None


async def test_a_checkpoint_nobody_built_is_a_404(notebook: AsyncClient) -> None:
    assert (await post(notebook, "made-up", SURPRISAL)).status_code == 404


async def test_an_unpaired_notebook_is_refused(client: AsyncClient) -> None:
    assert (await post(client, "surprisal", SURPRISAL)).status_code == 401


async def test_the_required_checkpoints_finish_the_lesson_exactly_once(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    """A lab is a lesson: passing what it gates on is the same completion
    reading one is, and opens the same review ladder."""
    finished = await pass_all_required(notebook)

    assert finished.json()["progress"] == {"passed_required": 3, "total_required": 3}
    assert await completions(session, user) == 1
    assert await session.get(ReviewState, (user.id, LESSON)) is not None

    await post(notebook, "surprisal", SURPRISAL)

    assert await completions(session, user) == 1


async def test_a_lab_finished_by_its_checkpoints_reads_as_a_finished_lesson(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    """Everything outside telemetry — the tutor, the profile — asks
    `lesson_progress` whether a lesson is finished, and a lab is finished
    without a single heartbeat to derive that from."""
    await pass_all_required(notebook)

    reading = await session.get(
        LessonProgress, (user.id, LESSON), populate_existing=True
    )

    assert reading is not None
    assert reading.completed_at is not None


async def test_the_optional_checkpoints_gate_nothing(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    await post(notebook, "surprisal", SURPRISAL)
    await post(notebook, "entropy-terms", {"digest": DIGEST})

    assert await completions(session, user) == 0

    await post(notebook, "beat-baseline", PASSING)

    assert await completions(session, user) == 1


async def test_the_manifest_hands_out_the_inputs_and_nothing_else(
    client: AsyncClient,
) -> None:
    """Public, and public by construction: the answer key lives under a key the
    manifest never reads."""
    published = await client.get(MANIFEST)

    assert published.status_code == 200
    body = published.json()
    assert body["lesson"] == LESSON
    assert body["content_version"] == VERSION
    assert body["data_files"] == [
        "https://raw.githubusercontent.com/galthran-wq/distillcourse-labs/main/labs"
        "/information-theory/surprisal-lab/data/holdout.csv"
    ]
    assert [c["id"] for c in body["checkpoints"]] == [
        "surprisal",
        "entropy-terms",
        "beat-baseline",
        "why-uniform",
    ]
    assert body["checkpoints"][0] == {
        "id": "surprisal",
        "kind": "exact",
        "text": "Return the surprisal of each probability.",
        "required": True,
        "spec": SPECS["surprisal"]["public"],
    }
    served = published.text
    for secret in ("expected", "labels", "rubric", "wrong", DIGEST, "Natural log"):
        assert secret not in served


async def test_the_manifest_names_the_kind_that_will_grade_the_answer(
    client: AsyncClient, session: AsyncSession
) -> None:
    """The index and the answer key are two ingests and only one of them
    grades: after a reindex that carried no lab build, the notebook is still
    told to post what the stored challenge takes."""
    challenge = await session.get(LabChallenge, (LESSON, "surprisal"))
    assert challenge is not None
    challenge.kind = "metric"
    await session.commit()

    body = (await client.get(MANIFEST)).json()

    assert body["checkpoints"][0]["kind"] == "metric"


async def test_a_lesson_that_is_not_a_lab_has_no_manifest(client: AsyncClient) -> None:
    assert (
        await client.get(f"{LABS}/information-theory/entropy/manifest")
    ).status_code == 404


async def test_the_page_sees_every_checkpoint_and_where_the_learner_stands(
    signed_in: AsyncClient, notebook: AsyncClient
) -> None:
    """Declared rather than attempted: a checkpoint nobody has touched is part
    of the lab, with the zeroes that says."""
    await post(notebook, "beat-baseline", FAILING)

    standing = await signed_in.get(PROGRESS)

    assert standing.status_code == 200
    checkpoints = standing.json()["checkpoints"]
    assert [c["id"] for c in checkpoints] == [
        "surprisal",
        "entropy-terms",
        "beat-baseline",
        "why-uniform",
    ]
    assert checkpoints[0]["attempts"] == 0
    assert checkpoints[2]["best_score"] == 0.8125
    assert checkpoints[2]["passed_at"] is None
    # State and nothing else: what a checkpoint IS — its kind, wording and
    # required flag — is content, which the page reads from the lesson's own
    # `lab` block rather than from a second copy here.
    assert set(checkpoints[0]) == {
        "id",
        "attempts",
        "passed_at",
        "best_score",
        "feedback",
    }


async def test_the_page_sees_no_notebook_paired_before_one_is(
    signed_in: AsyncClient,
) -> None:
    assert (await signed_in.get(PROGRESS)).json()["paired"] is False


@pytest.mark.usefixtures("notebook")
async def test_the_page_sees_a_paired_notebook_until_it_is_revoked(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    assert (await signed_in.get(PROGRESS)).json()["paired"] is True

    await repository.revoke_all(session, user.id, now=datetime.now(UTC))
    await session.commit()

    assert (await signed_in.get(PROGRESS)).json()["paired"] is False


async def test_the_page_needs_a_session(client: AsyncClient) -> None:
    assert (await client.get(PROGRESS)).status_code == 401
