import logfire
from fastapi import FastAPI

from app.core.config import settings
from app.core.db import engine


def instrument(app: FastAPI) -> None:
    logfire.configure(
        service_name=settings.PROJECT_NAME,
        environment=settings.ENVIRONMENT,
        # Without a token logfire stays a local no-op instead of failing to start.
        send_to_logfire="if-token-present",
    )
    logfire.instrument_fastapi(app)
    # The asyncio engine wraps a sync one; the instrumentation hooks the latter.
    logfire.instrument_sqlalchemy(engine=engine.sync_engine)
    logfire.instrument_httpx()
