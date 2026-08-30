from dataclasses import dataclass

import httpx
from fastapi import Header, HTTPException, status

from app.core.config import get_settings


@dataclass(frozen=True)
class AuthenticatedUser:
    id: str
    email: str | None
    access_token: str


async def get_current_user(authorization: str | None = Header(default=None)) -> AuthenticatedUser:
    """Valide la session auprès de Supabase avant toute lecture métier."""
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_publishable_key:
        raise HTTPException(status_code=503, detail="Supabase n’est pas configuré côté API.")
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session requise.")

    access_token = authorization.split(" ", 1)[1].strip()
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"{settings.supabase_url.rstrip('/')}/auth/v1/user",
                headers={"apikey": settings.supabase_publishable_key, "Authorization": f"Bearer {access_token}"},
            )
    except httpx.HTTPError as error:
        raise HTTPException(status_code=503, detail="Validation de session temporairement indisponible.") from error

    if response.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session invalide ou expirée.")
    payload = response.json()
    return AuthenticatedUser(id=payload["id"], email=payload.get("email"), access_token=access_token)
