import asyncio
import logging

from sqlalchemy import text
from tenacity import after_log, before_log, retry, stop_after_attempt, wait_fixed

from app.core.db import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAX_TRIES = 60 * 5
WAIT_SECONDS = 1


@retry(
    stop=stop_after_attempt(MAX_TRIES),
    wait=wait_fixed(WAIT_SECONDS),
    before=before_log(logger, logging.INFO),
    after=after_log(logger, logging.WARN),
)
async def wait_for_database() -> None:
    async with engine.connect() as connection:
        await connection.execute(text("SELECT 1"))


async def main() -> None:
    await wait_for_database()
    await engine.dispose()
    logger.info("database reachable")


if __name__ == "__main__":
    asyncio.run(main())
