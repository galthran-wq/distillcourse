from collections.abc import Sequence
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Literal

from app.core.config import settings

PROMPTS_DIR = Path(__file__).parent / "prompts"

# How much of a selection travels with the question. A reader who selects a
# whole lesson is not quoting it; past this the tutor has the locator.
QUOTE_LENGTH = 2000
# How many selections one question may carry, matching the composer's own cap
# (`lib/chat/quote.MAX_QUOTES`): a cap only a client keeps is not a cap.
QUOTE_COUNT = 8
QUOTE_SOURCE = "learner-quote"

Medium = Literal["web", "telegram"]
RunKind = Literal["chat", "review", "proactive", "compact"]

_MODULES: dict[RunKind, tuple[str, ...]] = {
    "chat": ("memory.md", "courses.md"),
    "review": ("memory.md", "courses.md", "review.md"),
    "proactive": ("memory.md", "courses.md", "proactive.md"),
    # A compaction returns memory candidates, so it is held to the same rules
    # about them as a dialogue is.
    "compact": ("memory.md", "compact.md"),
}


@dataclass(frozen=True)
class ContextBlock:
    title: str
    body: str
    # Naming a provenance is what marks a block as data rather than as
    # something the platform vouches for; see the untrusted rule in base.md.
    untrusted_source: str | None = None


@lru_cache
def module(name: str) -> str:
    """One prompt module's text. Public because a run whose kind does not carry
    a module may still need it: a context block can hand it over instead.

    `{{site}}` becomes the public origin, so a module can spell out absolute
    links without hard-coding a domain the deployment already configures."""
    text = (PROMPTS_DIR / name).read_text(encoding="utf-8").strip()
    return text.replace("{{site}}", settings.FRONTEND_HOST)


def untrusted(source: str, body: str) -> str:
    """Fence text that came from outside the platform, naming where it came
    from. `base.md` is where the tutor is told that what is inside a fence is
    data — so anything reaching the model from the open web goes through here,
    whether it arrives as a context block or as a tool result."""
    return f'<untrusted source="{source}">\n{body}\n</untrusted>'


def learner_quote(text: str, locator: str) -> str:
    """A passage the reader selected on the page, as it enters their message.

    Fenced like any other quoted material: the selection is lesson prose, or
    something they pasted into the page, and an instruction found in it is
    still data. The tags are escaped out of the text itself — an unescaped
    `</untrusted>` in the selection would close the fence and put the rest of
    it back in the learner's own voice.
    """
    quoted = "\n".join(f"> {line}" for line in text[:QUOTE_LENGTH].splitlines())
    fenced = quoted.replace("<untrusted", "&lt;untrusted").replace(
        "</untrusted", "&lt;/untrusted"
    )
    return untrusted(QUOTE_SOURCE, f"{fenced}\n>\n> — [[{locator}]]")


def learner_quotes(quotes: Sequence[tuple[str, str]]) -> str | None:
    """Every passage attached to one question, as the block that goes above it.

    A fence each, rather than one fence around all of them: the mitigation is
    per passage — a run of them is a run of separately marked quotations, and
    two passages from different sections are two references, not one long one.
    Nothing to say when nothing was attached.
    """
    if not quotes:
        return None
    return "\n\n".join(
        learner_quote(text, locator) for text, locator in quotes[:QUOTE_COUNT]
    )


def _render(block: ContextBlock) -> str:
    if block.untrusted_source is None:
        return f"## {block.title}\n\n{block.body}"
    return f"## {block.title}\n\n{untrusted(block.untrusted_source, block.body)}"


def assemble(
    medium: Medium, run_kind: RunKind, blocks: tuple[ContextBlock, ...] = ()
) -> str:
    modules = ["base.md", f"medium/{medium}.md", *_MODULES[run_kind]]
    return "\n\n".join([*(module(name) for name in modules), *map(_render, blocks)])
