from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Literal

PROMPTS_DIR = Path(__file__).parent / "prompts"

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
def _module(name: str) -> str:
    return (PROMPTS_DIR / name).read_text(encoding="utf-8").strip()


def untrusted(source: str, body: str) -> str:
    """Fence text that came from outside the platform, naming where it came
    from. `base.md` is where the tutor is told that what is inside a fence is
    data — so anything reaching the model from the open web goes through here,
    whether it arrives as a context block or as a tool result."""
    return f'<untrusted source="{source}">\n{body}\n</untrusted>'


def _render(block: ContextBlock) -> str:
    if block.untrusted_source is None:
        return f"## {block.title}\n\n{block.body}"
    return f"## {block.title}\n\n{untrusted(block.untrusted_source, block.body)}"


def assemble(
    medium: Medium, run_kind: RunKind, blocks: tuple[ContextBlock, ...] = ()
) -> str:
    modules = ["base.md", f"medium/{medium}.md", *_MODULES[run_kind]]
    return "\n\n".join([*(_module(name) for name in modules), *map(_render, blocks)])
