import asyncio
from typing import Any

import httpx

from app.core.config import Settings
from app.core.security import AuthenticatedUser


class SupabaseRlsError(RuntimeError):
    """Erreur volontairement générique pour ne pas exposer les détails Supabase."""


class SupabaseRlsClient:
    """Client REST Supabase qui propage le JWT utilisateur et respecte donc la RLS."""

    def __init__(self, settings: Settings, user: AuthenticatedUser) -> None:
        self._base_url = settings.supabase_url.rstrip("/")
        self._headers = {
            "apikey": settings.supabase_publishable_key,
            "Authorization": f"Bearer {user.access_token}",
            "Content-Type": "application/json",
        }

    async def financial_context(self, dossier_id: str, exercice_id: str) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=20) as client:
            dossier_response, exercice_response = await self._get_dossier_and_exercice(client, dossier_id, exercice_id)
            dossier = self._single(dossier_response, "Dossier inaccessible.")
            exercice = self._single(exercice_response, "Exercice inaccessible.")
            if exercice["dossier_id"] != dossier["id"]:
                raise SupabaseRlsError("Exercice inaccessible pour ce dossier.")

            balance_response, resultat_response = await self._get_balance_and_resultat(client, exercice_id)
            self._raise_if_error(balance_response)
            self._raise_if_error(resultat_response)
            return {
                "dossier": dossier,
                "exercice": {"id": exercice["id"], "annee": exercice["annee"]},
                "resultat": float(resultat_response.json() or 0),
                "balance": balance_response.json(),
            }

    async def log_agent_execution(self, dossier_id: str, trace: dict[str, Any]) -> None:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(f"{self._base_url}/rest/v1/agent_execution", headers=self._headers, json={"dossier_id": dossier_id, **trace})
        self._raise_if_error(response)

    async def _get_dossier_and_exercice(self, client: httpx.AsyncClient, dossier_id: str, exercice_id: str) -> tuple[httpx.Response, httpx.Response]:
        return tuple(await asyncio.gather(
            client.get(f"{self._base_url}/rest/v1/dossier", headers=self._headers, params={"select": "id,code,raison_sociale,devise_base", "id": f"eq.{dossier_id}"}),
            client.get(f"{self._base_url}/rest/v1/exercice", headers=self._headers, params={"select": "id,dossier_id,annee", "id": f"eq.{exercice_id}"}),
        ))  # type: ignore[return-value]

    async def _get_balance_and_resultat(self, client: httpx.AsyncClient, exercice_id: str) -> tuple[httpx.Response, httpx.Response]:
        return tuple(await asyncio.gather(
            client.get(f"{self._base_url}/rest/v1/v_balance_generale", headers=self._headers, params={"select": "compte_numero,compte_libelle,compte_classe,debit,credit,solde,nb_mouvements", "exercice_id": f"eq.{exercice_id}", "order": "compte_numero"}),
            client.post(f"{self._base_url}/rest/v1/rpc/resultat_exercice", headers=self._headers, json={"p_exercice_id": exercice_id}),
        ))  # type: ignore[return-value]

    @staticmethod
    def _raise_if_error(response: httpx.Response) -> None:
        if response.is_error:
            raise SupabaseRlsError("Lecture ou journalisation Supabase refusée.")

    def _single(self, response: httpx.Response, message: str) -> dict[str, Any]:
        self._raise_if_error(response)
        rows = response.json()
        if len(rows) != 1:
            raise SupabaseRlsError(message)
        return rows[0]
