from app.services.mistral import MistralClient


def test_parse_structured_analysis() -> None:
    result = MistralClient._parse_response(
        '{"reponse":"Analyse prête.","observations":["Solde à suivre."],"points_a_verifier":["Pièce justificative."]}'
    )

    assert result == {
        "reponse": "Analyse prête.",
        "observations": ["Solde à suivre."],
        "points_a_verifier": ["Pièce justificative."],
    }


def test_parse_unstructured_analysis_requires_review() -> None:
    result = MistralClient._parse_response("Réponse non structurée")

    assert result["reponse"] == "Réponse non structurée"
    assert result["points_a_verifier"] == ["Relire la réponse IA avant utilisation."]
