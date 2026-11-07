import asyncio
from html import escape
from typing import Annotated

from pydantic import Field
from pydantic_ai import FunctionToolset, RunContext

from app.content.search import figure_url, figures, passage, sections
from app.harness.deps import HarnessDeps
from app.telegram import api, formula
from app.telegram.outbox import Outbox

# Handed only to a run that has an outbox (`app/harness/runner.py`): an image
# the learner cannot be sent is not a tool the tutor should be offered.
toolset = FunctionToolset[HarnessDeps]()


async def send_message(ctx: RunContext[HarnessDeps], html: str) -> str:
    """Send the learner a message now, before the answer is finished.

    Use it to split a long answer into several messages, or to say something
    before a slow piece of work. Once you have sent anything this way, your
    final answer is not delivered on top of it — say everything through this
    tool or say it all in the final answer.

    Args:
        html: the message, in the Telegram HTML the medium section describes.
    """
    outbox = ctx.deps.outbox
    if outbox is None:
        return (
            "this conversation is not the Telegram thread; the learner reads "
            "the final answer, so there is nothing to send separately"
        )
    await outbox.send(html)
    return "sent"


def _outbox(ctx: RunContext[HarnessDeps]) -> Outbox:
    outbox = ctx.deps.outbox
    assert outbox is not None, "the telegram toolset is handed only to runs with one"
    return outbox


async def _photo(
    ctx: RunContext[HarnessDeps], photo: str | bytes, caption: str | None
) -> str:
    try:
        await _outbox(ctx).send_photo(photo, caption=caption)
    except api.BotBlocked:
        raise
    # A figure is fetched by Telegram from the site, which can fail where a
    # text message would not; the answer can still be given in words.
    except api.TelegramError as exc:
        return f"telegram did not take the image: {exc}"
    return "sent"


@toolset.tool(sequential=True)
async def send_figure(
    ctx: RunContext[HarnessDeps], locator: str, src: str, caption: str | None = None
) -> str:
    """Send the learner a figure from the course, as an image.

    Only a figure `fetch_content` lists under `figures` for that passage can be
    sent. The image is not your answer: what you say about it still follows.

    Args:
        locator: the passage the figure is in, as `fetch_content` takes it.
        src: the figure's `src`, exactly as that passage lists it.
        caption: a line under the image, in the medium's Telegram HTML; the
            figure's own caption when omitted.
    """
    chunks = await sections(ctx.deps.repo.session, locator.partition("#")[0])
    named = passage(chunks, locator)
    figure = next((found for found in figures(named) if found.src == src), None)
    if figure is None:
        return (
            f"{src} is not a figure of {locator}; send one that fetch_content "
            "lists for that passage"
        )
    if caption is None and figure.caption is not None:
        caption = escape(figure.caption, quote=False)
    return await _photo(ctx, figure_url(figure.src), caption)


@toolset.tool(sequential=True)
async def send_formula(
    ctx: RunContext[HarnessDeps],
    lines: Annotated[list[str], Field(min_length=1, max_length=formula.MAX_LINES)],
    caption: str | None = None,
) -> str:
    """Send the learner a formula typeset as an image.

    For a formula whose shape matters; a short inline one reads fine as plain
    unicode. The image is not your answer: what you say about it still follows.

    Args:
        lines: the formula in LaTeX math, one line per item, without `$`. An
            aligned derivation is one item per step; there are no
            environments — no `aligned`, no `pmatrix`.
        caption: a line under the image, in the medium's Telegram HTML.
    """
    try:
        png = await asyncio.to_thread(formula.render, lines)
    except formula.FormulaError as exc:
        return f"the formula did not render, nothing was sent: {exc}"
    return await _photo(ctx, png, caption)
