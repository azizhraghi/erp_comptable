import json
from typing import Any

import httpx

from app.core.config import Settings


class MistralError(RuntimeError):
    """Erreur contrôlée d'appel au fournisseur IA."""


class MistralClient:
    def __init__(self, settings: Settings) -> None:
        self._api_key = settings.mistral_api_key.get_secret_value() if settings.mistral_api_key else ""
        self._model = settings.mistral_model

    async def analyse_financiere(self, question: str, contexte: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
        if not self._api_key:
            raise MistralError("MISTRAL_API_KEY n’est pas configurée côté serveur.")
        prompt = "\n\n".join([
            "Tu es ANA, analyste financier assistant un cabinet comptable tunisien.",
            "Réponds en français. Ne crée, ne modifie et ne valide jamais une écriture. N’invente aucun chiffre et ne donne pas de conseil fiscal ou juridique définitif.",
            "Distingue faits, hypothèses et points à vérifier. Réponds uniquement en JSON strict : {\\\"reponse\\\":\\\"...\\\",\\\"observations\\\":[\\\"...\\\"],\\\"points_a_verifier\\\":[\\\"...\\\"]}.",
            f"Contexte comptable : {json.dumps(contexte, ensure_ascii=False)}",
            f"Question du collaborateur : {question}",
        ])
        try:
            async with httpx.AsyncClient(timeout=45) as client:
                response = await client.post(
                    "https://api.mistral.ai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self._api_key}"},
                    json={"model": self._model, "temperature": 0.1, "max_tokens": 900, "messages": [{"role": "user", "content": prompt}]},
                )
        except httpx.HTTPError as error:
            raise MistralError("Mistral est temporairement indisponible.") from error
        if response.is_error:
            raise MistralError("Mistral a refusé l’analyse demandée.")

        payload = response.json()
        content = payload.get("choices", [{}])[0].get("message", {}).get("content", "")
        if isinstance(content, list):
            content = "".join(part.get("text", "") for part in content if isinstance(part, dict))
        return self._parse_response(str(content)), payload

    @staticmethod
    def _parse_response(content: str) -> dict[str, Any]:
        cleaned = content.removeprefix("```json").removesuffix("```").strip()
        try:
            result = json.loads(cleaned)
        except json.JSONDecodeError:
            return {"reponse": cleaned or "Analyse indisponible.", "observations": [], "points_a_verifier": ["Relire la réponse IA avant utilisation."]}
        return {
            "reponse": result.get("reponse") if isinstance(result.get("reponse"), str) else "Analyse indisponible.",
            "observations": [item for item in result.get("observations", []) if isinstance(item, str)][:10],
            "points_a_verifier": [item for item in result.get("points_a_verifier", []) if isinstance(item, str)][:10],
        }
