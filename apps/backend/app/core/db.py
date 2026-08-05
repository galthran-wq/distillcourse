from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings

engine = create_async_engine(str(settings.database_uri), pool_pre_ping=True)

# expire_on_commit=False: an expired attribute reloads itself on access, which
# under asyncio raises instead of doing IO. Objects stay usable after commit.
session_factory = async_sessionmaker(engine, expire_on_commit=False)
