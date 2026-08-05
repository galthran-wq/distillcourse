from dataclasses import dataclass, field

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import TgLink
from app.telegram import api, repository


def split(text: str) -> list[str]:
    """Cut a message Telegram would refuse into ones it accepts.

    A safety net, not a layout tool: the tutor is told to keep its own messages
    short (`prompts/medium/telegram.md`), and this is what happens when it does
    not. The cut prefers a line break, which is also the least likely place to
    be inside a tag.
    """
    parts: list[str] = []
    rest = text
    while len(rest) > api.MESSAGE_LIMIT:
        cut = rest.rfind("\n", 0, api.MESSAGE_LIMIT)
        if cut <= 0:
            cut = api.MESSAGE_LIMIT
        parts.append(rest[:cut].strip())
        rest = rest[cut:].lstrip("\n")
    parts.append(rest)
    return [part for part in parts if part]


@dataclass
class Outbox:
    """Where a run's messages to the learner go.

    It counts what it sent because delivery is hybrid: the tutor sends with the
    `send_message` tool when it wants to, and a run that ends without having
    sent anything has its final answer delivered for it — a silent bot is worse
    than a badly formatted one.
    """

    session: AsyncSession
    link: TgLink
    sent: int = field(default=0, init=False)

    async def send(self, html: str) -> None:
        for part in split(html):
            try:
                await api.send_message(self.link.tg_chat_id, part)
            except api.MarkupRejected:
                # Telegram refuses the whole message over one unclosed tag, so
                # the choice is unformatted text or nothing at all.
                await api.send_message(self.link.tg_chat_id, part, html=False)
            except api.BotBlocked:
                await repository.set_status(self.session, self.link, "broken")
                raise
        self.sent += 1
