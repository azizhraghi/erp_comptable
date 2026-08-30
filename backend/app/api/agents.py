from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.agents.ana import AnaWorkflow
from app.core.config import Settings, get_settings
from app.core.security import AuthenticatedUser, get_current_user
from app.services.mistral import MistralError
from app.services.supabase_rls import SupabaseRlsError

router = APIRouter(prefix="/agents", tags=["agents"])


class AnalyseAnaRequest(BaseModel):
    dossier_id: UUID
    exercice_id: UUID
    question: str = Field(min_length=5, max_length=2000)


class AnalyseAnaResponse(BaseModel):
    reponse: str
    observations: list[str]
    points_a_verifier: list[str]
    duree_ms: int


@router.post("/ana/analyse", response_model=AnalyseAnaResponse)
async def analyser_ana(
    request: AnalyseAnaRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> AnalyseAnaResponse:
    """Analyse consultative : aucune écriture comptable n'est créée ou modifiée."""
    try:
        result = await AnaWorkflow(settings, user).run(str(request.dossier_id), str(request.exercice_id), request.question.strip())
        return AnalyseAnaResponse(**result)
    except (SupabaseRlsError, MistralError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
