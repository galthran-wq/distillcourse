from pydantic_ai import RunContext, ToolFailed

from app.harness.deps import HarnessDeps
from app.harness.limits import LimitExceeded, spend_memory_write
from app.memory import repository
from app.memory.repository import Content, Description, Recollection, Slug


def _spend_write(ctx: RunContext[HarnessDeps]) -> None:
    try:
        spend_memory_write(ctx.usage)
    except LimitExceeded as exc:
        raise ToolFailed(str(exc)) from exc


async def read_memory(ctx: RunContext[HarnessDeps], slugs: list[str]) -> dict[str, str]:
    """Read what you remember about this learner, by slug.

    Your context lists what there is, as slugs and one-line descriptions; this
    is how you read the memories themselves. A slug that is not remembered is
    absent from the answer.

    Args:
        slugs: the slugs to read, from the index in your context.
    """
    repo = ctx.deps.repo
    rows = await repository.read(repo.session, repo.user_id, slugs)
    return {row.slug: row.content for row in rows}


async def save_memory(
    ctx: RunContext[HarnessDeps],
    slug: Slug,
    description: Description,
    content: Content,
) -> str:
    """Remember something about the learner, in every future chat and medium.

    Writing a slug that already exists replaces it: that is how a fact is
    updated when it changes and how two overlapping memories are merged into
    one. Writes are capped per run.

    Args:
        slug: the handle to remember it under, in kebab-case, naming the fact
            rather than the moment — `background-signal-processing`, not
            `todays-question`. An existing slug is replaced.
        description: one line saying what this memory decides, precise enough
            that you can tell from it alone whether it bears on a question.
        content: the fact and the context that makes it usable later, in a
            sentence or two.
    """
    _spend_write(ctx)
    repo = ctx.deps.repo
    await repository.save(
        repo.session,
        repo.user_id,
        Recollection(slug=slug, description=description, content=content),
        source="agent",
    )
    return f"remembered as {slug}"


async def delete_memory(ctx: RunContext[HarnessDeps], slug: Slug) -> str:
    """Forget a memory that no longer holds or has been merged into another.

    Counts against the same per-run cap as saving.

    Args:
        slug: the memory to drop.
    """
    _spend_write(ctx)
    repo = ctx.deps.repo
    if await repository.remove(repo.session, repo.user_id, slug):
        return f"forgotten: {slug}"
    return "nothing is remembered under that slug"
