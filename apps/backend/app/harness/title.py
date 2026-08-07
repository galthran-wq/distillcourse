import asyncio
from collections.abc import Sequence

from pydantic_ai.messages import ModelMessagesTypeAdapter, TextPart, UserPromptPart
from pydantic_ai.usage import RunUsage

from app.core.config import settings
from app.harness.agent import model_for, namer
from app.harness.prompts import module, untrusted
from app.harness.repository import HarnessRepository
from app.models import Chat, Message

# How much of the conversation one naming pass reads: the last few messages,
# and only the opening of each. Six words are decided by how a turn opens, and
# reading a full context to write them would cost more than the answer being
# named. Its own number rather than TITLE_REFRESH_MESSAGES: that one is how
# often this runs, and an operator raising it to make renames rarer must not
# also make every one of them read four times as much.
TITLE_WINDOW = 8
TITLE_EXCERPT = 500

TITLE_SOURCE = "chat-transcript"

# Who said what, taken from the stored row rather than from the message class.
# The platform stores its own prompts as requests too — a compaction summary, a
# proactive nudge — and a summary read back as the learner's words is the
# platform quoting itself in their voice. Those rows are left out: they are
# already a description of the conversation, and this pass writes its own.
_SPEAKER = {"user": "learner", "agent": "tutor"}


def _transcript(rows: Sequence[Message]) -> str:
    """The conversation as plain text, for a pass that is about what was talked
    about rather than about continuing it.

    Flattened rather than handed over as a message history: a window cut from
    the middle of one can open on a tool result whose call is above the cut,
    which providers reject outright.
    """
    messages = ModelMessagesTypeAdapter.validate_python(
        [row.pydantic_ai for row in rows]
    )
    lines = []
    for row, message in zip(rows, messages, strict=True):
        speaker = _SPEAKER.get(row.role)
        if speaker is None:
            continue
        for part in message.parts:
            if isinstance(part, UserPromptPart | TextPart) and isinstance(
                part.content, str
            ):
                lines.append(f"{speaker}: {part.content[:TITLE_EXCERPT]}")
    return "\n\n".join(lines)


async def retitle(repo: HarnessRepository, chat: Chat, usage: RunUsage) -> None:
    """Name a chat again once it has moved past the question it was named for.

    Web chats only. A name is read in one place — the rail — and the Telegram
    thread is never listed there: it is one eternal conversation, and naming it
    would put a completion on the reply path of every message the learner
    sends, for a name nobody sees.

    The platform's own bookkeeping, on the footing `summarize()` stands on: it
    spends the instance's budget and not the learner's daily allowance, which
    is what writing no message of theirs makes true. What it costs is folded
    into the run's own usage row — there is no turn here to hang a row on, and
    an invented one would be a message the next run reads — which is how the
    monthly ceiling comes to see it.

    The ceiling was checked by the run this follows, and one short completion
    per `TITLE_REFRESH_MESSAGES` messages cannot outrun that check.
    """
    if chat.kind != "web" or chat.titled_at is None:
        return
    rows = await repo.live_rows(chat)
    # Counted over the live rows, so a compaction resets it the way it resets
    # the history: what this pass would be shown is what triggers it.
    since = sum(1 for row in rows if row.created_at > chat.titled_at)
    if since < settings.TITLE_REFRESH_MESSAGES:
        return
    # Bounded, because the caller holds the learner's stream open until this
    # returns: a namer that answers slowly would keep their composer disabled
    # long after the reply finished rendering, and one that never answers would
    # keep it disabled for as long as the browser waits.
    async with asyncio.timeout(settings.TITLE_TIMEOUT_SECONDS):
        named = await namer.run(
            # Fenced like every other text the platform did not write: a line
            # in the conversation asking for a particular name is material to
            # be named, not an instruction.
            untrusted(TITLE_SOURCE, _transcript(rows[-TITLE_WINDOW:])),
            model=model_for(settings.DEFAULT_CHAT_MODEL),
            instructions=module("title.md"),
            usage=usage,
        )
    if title := named.output.strip():
        await repo.set_title(chat, title)
