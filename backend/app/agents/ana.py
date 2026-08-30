from __future__ import annotations

import hashlib
import json
import time
from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph

from app.core.config import Settings
from app.core.security import AuthenticatedUser
from app.services.mistral import MistralClient
from app.services.supabase_rls import SupabaseRlsClient


class AnaState(TypedDict, total=False):
    dossier_id: str
    exercice_id: str
    question: str
    contexte: dict[str, Any]
    analyse: dict[str, Any]
    fournisseur: dict[str, Any]
    debut: float


class AnaWorkflow:
    """Workflow LangGraph ANA : lire → analyser → tracer, sans écriture comptable."""

    def __init__(self, settings: Settings, user: AuthenticatedUser) -> None:
        self._settings = settings
        self._supabase = SupabaseRlsClient(settings, user)
        self._mistral = MistralClient(settings)
        graph = StateGraph(AnaState)
        graph.add_node("charger_contexte", self._charger_contexte)
        graph.add_node("analyser", self._analyser)
        graph.add_node("tracer", self._tracer)
        graph.add_edge(START, "charger_contexte")
        graph.add_edge("charger_contexte", "analyser")
        graph.add_edge("analyser", "tracer")
        graph.add_edge("tracer", END)
        self._graph = graph.compile()

    async def run(self, dossier_id: str, exercice_id: str, question: str) -> dict[str, Any]:
        state = await self._graph.ainvoke({"dossier_id": dossier_id, "exercice_id": exercice_id, "question": question, "debut": time.perf_counter()})
        return {**state["analyse"], "duree_ms": round((time.perf_counter() - state["debut"]) * 1000)}

    async def _charger_contexte(self, state: AnaState) -> AnaState:
        contexte = await self._supabase.financial_context(state["dossier_id"], state["exercice_id"])
        return {"contexte": contexte}

    async def _analyser(self, state: AnaState) -> AnaState:
        analyse, fournisseur = await self._mistral.analyse_financiere(state["question"], state["contexte"])
        return {"analyse": analyse, "fournisseur": fournisseur}

    async def _tracer(self, state: AnaState) -> AnaState:
        prompt_fingerprint = hashlib.sha256(
            json.dumps({"question": state["question"], "exercice": state["exercice_id"]}, sort_keys=True).encode()
        ).hexdigest()
        elapsed = round((time.perf_counter() - state["debut"]) * 1000)
        usage = state["fournisseur"].get("usage", {})
        await self._supabase.log_agent_execution(state["dossier_id"], {
            "agent_code": "ANA", "modele": state["fournisseur"].get("model", self._settings.mistral_model), "modele_version": "api-v1",
            "prompt_hash": prompt_fingerprint, "entree_ref": state["exercice_id"],
            "sources": {"exercice_id": state["exercice_id"], "comptes_transmis": len(state["contexte"].get("balance", []))},
            "confiance": 0.7, "duree_ms": elapsed, "tokens_entree": usage.get("prompt_tokens"),
            "tokens_sortie": usage.get("completion_tokens"), "statut": "succes",
        })
        return {}
