import asyncio
import uuid
from collections.abc import Callable
from dataclasses import dataclass, field

from pydantic_ai.messages import ModelMessage, ModelRequest, UserPromptPart

# The key a steer is marked with on its request. It is stored with the message,
# which is how the turn's rows tell a steer, which is the learner's, from the
# tool returns around it, which are the run's.
STEER = "steer"


@dataclass(frozen=True)
class SteerMessage:
    id: uuid.UUID
    text: str


def is_steer(message: ModelMessage) -> bool:
    return isinstance(message, ModelRequest) and STEER in (message.metadata or {})


@dataclass
class Steering:
    """What the learner sends while a web run answers them: held until the
    run's next model request and handed to it there, between the tool call in
    flight and whatever the model says next."""

    # Told about each steer as the run takes it: the client marks it queued
    # until then.
    announce: Callable[[SteerMessage], None]
    inbox: asyncio.Queue[SteerMessage] = field(default_factory=asyncio.Queue)
    closed: bool = False

    def offer(self, message: SteerMessage) -> bool:
        """Queue a steer, or refuse it once the run has made its last request
        — the learner's message is then a turn of its own."""
        if self.closed:
            return False
        self.inbox.put_nowait(message)
        return True

    def take(
        self, run_id: str | None, messages: list[ModelMessage]
    ) -> list[ModelMessage]:
        while not self.inbox.empty():
            steer = self.inbox.get_nowait()
            messages.append(
                ModelRequest(
                    parts=[UserPromptPart(content=steer.text)],
                    # Stamped here: the agent fills in the run only on the last
                    # request, and two steers taken at once are two requests.
                    run_id=run_id,
                    metadata={STEER: str(steer.id)},
                )
            )
            self.announce(steer)
        return messages

    def close(self) -> list[SteerMessage]:
        """Refuse every later steer and hand back the ones the run never took."""
        self.closed = True
        unused: list[SteerMessage] = []
        while not self.inbox.empty():
            unused.append(self.inbox.get_nowait())
        return unused
