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
    "compact": ("compact.md",),
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


def _render(block: ContextBlock) -> str:
    if block.untrusted_source is None:
        return f"## {block.title}\n\n{block.body}"
    return (
        f"## {block.title}\n\n"
        f'<untrusted source="{block.untrusted_source}">\n'
        f"{block.body}\n"
        "</untrusted>"
    )


def assemble(
    medium: Medium, run_kind: RunKind, blocks: tuple[ContextBlock, ...] = ()
) -> str:
    modules = ["base.md", f"medium/{medium}.md", *_MODULES[run_kind]]
    return "\n\n".join([*(_module(name) for name in modules), *map(_render, blocks)])
