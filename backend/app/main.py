from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.agents import router as agents_router
from app.core.config import get_settings

settings = get_settings()
app = FastAPI(title=settings.app_name, version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/health", tags=["système"])
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "comptaexpert-api", "environment": settings.environment}


app.include_router(agents_router, prefix=settings.api_v1_prefix)
