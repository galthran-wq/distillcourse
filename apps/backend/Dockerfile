# Build context is the REPO ROOT, matching apps/frontend/Dockerfile:
#   docker build -f apps/backend/Dockerfile .
FROM python:3.14-slim
ENV PYTHONUNBUFFERED=1
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV PATH="/app/.venv/bin:$PATH"

COPY --from=ghcr.io/astral-sh/uv:0.9.26 /uv /uvx /bin/

# curl is the compose healthcheck's only requirement.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=apps/backend/uv.lock,target=uv.lock \
    --mount=type=bind,source=apps/backend/pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-dev

COPY apps/backend /app

EXPOSE 8000
CMD ["fastapi", "run", "app/main.py", "--workers", "4"]
