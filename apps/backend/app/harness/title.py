import uuid
from collections.abc import Sequence

from pydantic_ai.messages import ModelMessagesTypeAdapter, TextPart, UserPromptPart
from pydantic_ai.usage import RunUsage

from app.core.config import settings
from app.harness.agent import model_for, namer
from app.harness.prompts import module, untrusted
from app.harness.repository import HarnessRepository
from app.harness.usage import usage_row
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


async def retitle(
    repo: HarnessRepository, chat: Chat, run_id: uuid.UUID, usage: RunUsage
) -> None:
    """Name a chat again once it has moved past the question it was named for.

    Not the Telegram thread: it is one eternal conversation that no rail
    lists, so a name for it is a completion nobody reads.

    The platform's own bookkeeping, on the footing `summarize()` stands on — it
    spends the instance's budget and not the learner's daily allowance, which
    is what writing no message of theirs makes true. It runs once the stream is
    closed and the turn is stored, so what it costs is added to the run's usage
    row rather than written with it; there is no turn of its own to hang a row
    on, and an invented one would be a message the next run reads.
    """
    if chat.kind == "telegram":
        return
    # The chat was loaded before the run began and this session does not expire
    # what it holds on commit, so the stamp on it is minutes old by here. A
    # stamp older than the naming it describes buys a completion for a name
    # that is already current.
    await repo.session.refresh(chat)
    if chat.titled_at is None:
        return
    # Counted rather than read: only about one run in four goes on to want the
    # rows, and a chat far past its last compaction is a lot of jsonb to load
    # for a number. The count does not see that cut, so a compaction since the
    # last naming brings the next one forward — never past it.
    if (
        await repo.messages_since(chat, chat.titled_at)
        < settings.TITLE_REFRESH_MESSAGES
    ):
        return
    rows = await repo.live_rows(chat)
    named = await namer.run(
        untrusted(TITLE_SOURCE, _transcript(rows[-TITLE_WINDOW:])),
        model=model_for(settings.DEFAULT_CHAT_MODEL),
        instructions=module("title.md"),
        usage=usage,
    )
    # Stamped whatever came back. A pass that wrote nothing keeps the old name,
    # but it has run: without the stamp the count that triggered it stands, and
    # every following run pays for another one that says nothing again.
    await repo.set_title(chat, named.output.strip() or None)
    await repo.set_usage(chat, run_id, usage_row(usage))
