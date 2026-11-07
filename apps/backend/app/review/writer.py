"""The two calls a batch of cards costs: one writes it, one checks it.

Both are toolless and deps-less, for the reason `labs/judge.py` gives: each is
one question about one text, and an agent that could reach a tool could act on
a learner's data while answering it. Reading before writing is the caller's
doing — the lesson is handed over whole — so it does not depend on a model
choosing to look.

The check is the only thing between a bad card and the learner: it asks of
every card what a careful reader of the same text would, and a card that fails
any of it is dropped.
"""

import asyncio
import random
import uuid
from dataclasses import dataclass
from typing import Annotated, Literal, Self

from pydantic import BaseModel, Field, field_validator, model_validator
from pydantic_ai import Agent
from pydantic_ai.usage import RunUsage
from sqlalchemy.ext.asyncio import AsyncSession

from app.content.search import Figure
from app.core.config import settings
from app.harness.agent import model_for
from app.harness.limits import check_cost_ceiling
from app.harness.prompts import module, untrusted
from app.harness.usage import charge_background
from app.review import subject

BATCH = 3
PROMPT_CHARS = 900
# A card with an image goes out as a photo, its prompt as the caption, and the
# feedback is the caption again with the verdict and the explanation added:
# all of it has to fit Telegram's 1024 characters.
CAPTION_PROMPT_CHARS = 400
# What fits on a phone-width button without being cut.
OPTION_CHARS = 40
# An `order` card's steps are listed in the message, not on its buttons, and a
# step of a derivation needs a line of its own.
STEP_CHARS = 200
STEPS = (3, 5)
EXPLANATION_CHARS = 400
# A batch is a few thousand tokens out; past this the writer is not coming, and
# the poller has other learners to serve.
TIMEOUT_SECONDS = 180
FOCUS_SOURCE = "review-focus"

Kind = Literal["gap", "choice", "tell_apart", "spot_error", "order"]
KINDS: dict[int, tuple[Kind, ...]] = {
    1: ("gap", "choice"),
    2: ("tell_apart",),
    3: ("spot_error", "order"),
}

writer = Agent(name="card-writer")
checker = Agent(name="card-checker")


@dataclass(frozen=True)
class Section:
    """One chunk of a lesson as the index holds it. `anchor` is None for a
    lesson indexed as one chunk."""

    anchor: str | None
    title: str
    text: str
    content_hash: str
    figures: list[Figure]


class Draft(BaseModel):
    kind: Kind
    # The anchor of the section the card tests, as the request lists it.
    section: str
    prompt: Annotated[str, Field(min_length=1, max_length=PROMPT_CHARS)]
    options: list[Annotated[str, Field(min_length=1, max_length=STEP_CHARS)]]
    answer: int | list[int]
    explanation: Annotated[str, Field(min_length=1, max_length=EXPLANATION_CHARS)]
    # The `src` of one of its section's figures, or one line of LaTeX math.
    figure: str | None = None
    formula: str | None = None

    # A structured-output model fills a field it does not use with "" as often
    # as it leaves it out.
    @field_validator("figure", "formula", mode="before")
    @classmethod
    def _blank_is_none(cls, value: object) -> object:
        return None if isinstance(value, str) and not value.strip() else value

    @model_validator(mode="after")
    def _answerable(self) -> Self:
        if self.kind == "order":
            return self._ordered()
        if not 2 <= len(self.options) <= 4:
            raise ValueError("a card has two to four options")
        if any(len(option) > OPTION_CHARS for option in self.options):
            raise ValueError(f"an option is at most {OPTION_CHARS} characters")
        if not isinstance(self.answer, int):
            raise ValueError("answer is the index of one option")
        if not 0 <= self.answer < len(self.options):
            raise ValueError("answer is not the index of an option")
        if self.figure is not None and self.formula is not None:
            raise ValueError("a card shows a figure or a formula, not both")
        if (self.figure or self.formula) and len(self.prompt) > CAPTION_PROMPT_CHARS:
            raise ValueError(
                f"a card with an image has a prompt of at most {CAPTION_PROMPT_CHARS} characters"
            )
        if self.kind == "spot_error" and self.options != [
            str(line) for line in range(1, len(self.options) + 1)
        ]:
            raise ValueError("a spot_error card's options are its line numbers")
        return self

    def _ordered(self) -> Self:
        low, high = STEPS
        if not low <= len(self.options) <= high:
            raise ValueError(f"an order card has {low} to {high} steps")
        if not isinstance(self.answer, list) or sorted(self.answer) != list(
            range(len(self.options))
        ):
            raise ValueError("answer is every step's index, once, in the right order")
        return self


def shuffled(draft: Draft) -> Draft:
    """An `order` card with its steps in an order that is not the answer.

    Code shuffles rather than trusting the writer to: a writer lists steps in
    the order it thought of them, which is the right one, and a card shown in
    its answer is answered by tapping down the list.
    """
    assert isinstance(draft.answer, list)
    count = len(draft.options)
    shown = draft.answer
    while shown == draft.answer:
        shown = random.sample(range(count), count)
    return draft.model_copy(
        update={
            "options": [draft.options[index] for index in shown],
            "answer": [shown.index(index) for index in draft.answer],
        }
    )


class Batch(BaseModel):
    cards: list[Draft]


class Check(BaseModel):
    card: int
    answer_right: bool
    others_wrong: bool
    one_answer: bool
    main_point: bool

    @property
    def passed(self) -> bool:
        return (
            self.answer_right
            and self.others_wrong
            and self.one_answer
            and self.main_point
        )


class Checks(BaseModel):
    checks: list[Check]


def _text(material: subject.Material, sections: list[Section]) -> str:
    parts = [f"# {material.title}", "\n".join(subject.concepts(material))]
    parts += [
        f"## {section.title} — anchor `{section.anchor or ''}`\n\n{section.text}"
        + _figures(section.figures)
        for section in sections
    ]
    return "\n\n".join(part for part in parts if part)


def _figures(figures: list[Figure]) -> str:
    if not figures:
        return ""
    listed = "\n".join(
        f"- `{figure.src}`: {figure.alt} {figure.caption or ''}".rstrip()
        for figure in figures
    )
    return f"\n\nFigures:\n{listed}"


def _card(index: int, draft: Draft) -> str:
    options = "\n".join(
        f"{position}. {option}" for position, option in enumerate(draft.options)
    )
    shown = ""
    if draft.figure is not None:
        shown = f"Shown with the figure `{draft.figure}`\n\n"
    if draft.formula is not None:
        shown = f"Shown with the formula `{draft.formula}`\n\n"
    return (
        f"### Card {index}\n\nSection: `{draft.section}`\n\n{shown}{draft.prompt}\n\n"
        f"{options}\n\nMarked answer: {draft.answer}\n\n{draft.explanation}"
    )


async def _ask[T: BaseModel](
    session: AsyncSession,
    user_id: uuid.UUID,
    agent: Agent,
    kind: Literal["card_writer", "card_check"],
    question: str,
    output_type: type[T],
) -> T:
    """One call, charged to `background_runs` whether or not it answers.

    Commits before it calls: nothing that waits on a model may hold a pooled
    connection while it does.
    """
    await check_cost_ceiling(session)
    await session.commit()
    usage = RunUsage()
    try:
        async with asyncio.timeout(TIMEOUT_SECONDS):
            result = await agent.run(
                question,
                model=model_for(settings.CARD_MODEL),
                instructions=module(f"{kind}.md"),
                output_type=output_type,
                usage=usage,
                retries=2,
            )
    finally:
        if usage.requests:
            await charge_background(session, user_id, kind, usage)
            await session.commit()
    return result.output


async def draft(
    session: AsyncSession,
    user_id: uuid.UUID,
    material: subject.Material,
    sections: list[Section],
    level: int,
    focus: str | None,
) -> list[Draft]:
    request = [
        f"Write {BATCH} cards at level {level}, of the kinds "
        + ", ".join(f"`{kind}`" for kind in KINDS[level])
        + ".",
        module("review.md"),
        _text(material, sections),
    ]
    if focus is not None:
        request.append(
            "Aim the cards at this confusion of the learner's:\n\n"
            + untrusted(FOCUS_SOURCE, focus)
        )
    batch = await _ask(
        session, user_id, writer, "card_writer", "\n\n".join(request), Batch
    )
    return batch.cards


async def check(
    session: AsyncSession,
    user_id: uuid.UUID,
    material: subject.Material,
    sections: list[Section],
    drafts: list[Draft],
) -> list[Draft]:
    """The drafts that pass every question the check asks."""
    question = "\n\n".join(
        [
            _text(material, sections),
            "# The cards",
            *(_card(index, card) for index, card in enumerate(drafts)),
        ]
    )
    checks = await _ask(session, user_id, checker, "card_check", question, Checks)
    # A card the check said nothing about, or said two things about, is not a
    # card it passed.
    passed = {verdict.card for verdict in checks.checks if verdict.passed}
    failed = {verdict.card for verdict in checks.checks if not verdict.passed}
    return [card for index, card in enumerate(drafts) if index in passed - failed]
