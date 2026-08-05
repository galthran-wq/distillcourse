from pydantic_ai import RunContext

from app.harness.deps import HarnessDeps


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
