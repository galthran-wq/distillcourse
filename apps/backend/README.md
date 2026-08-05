# apps/backend

Placeholder. The FastAPI backend lands here in #6 (fastapi-template fork,
async SQLAlchemy + Postgres, alembic, docker-compose, CI).

The pydantic-ai tutor harness is a **module inside this backend** (#10), not a
separate app — isolation comes from user-scoped dependencies, not from a
separate process.
