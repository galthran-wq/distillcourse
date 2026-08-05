from fastapi import APIRouter

from app.api.routes import auth, chats, health, lessons, profile, telemetry

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(chats.router)
api_router.include_router(telemetry.router)
api_router.include_router(lessons.router)
api_router.include_router(profile.router)
