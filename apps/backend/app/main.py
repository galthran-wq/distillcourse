from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware

from app.api.main import api_router
from app.api.routes import telegram
from app.core.config import settings
from app.core.observability import instrument


# Operation ids drive the names in the generated TypeScript client.
def route_operation_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=route_operation_id,
)
instrument(app)

if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)
# Telegram's webhook is registered with Telegram once and outlives the site's
# API versions, so it hangs off /api directly rather than off /api/v1.
app.include_router(telegram.router, prefix="/api")
