# ComptaExpert API

Backend FastAPI qui orchestre les agents LangGraph. Supabase reste le système
de référence pour PostgreSQL, Auth, Storage et RLS ; ce service ne possède pas
de base de données métier séparée.

## Garde-fous

- Le JWT Supabase reçu du frontend est validé avant tout appel métier.
- Toutes les lectures et traces sont réalisées avec ce JWT : les policies RLS
  continuent donc de protéger les dossiers.
- Aucune clé `service_role` n'est utilisée par l'API.
- ANA est un workflow LangGraph en lecture seule : `charger_contexte` →
  `analyser` → `tracer`. Il ne peut ni créer ni valider une écriture.
- `MISTRAL_API_KEY` reste dans `backend/.env` localement, puis dans les secrets
  de l’hébergeur en production. Elle ne doit jamais être préfixée par `VITE_`.

## Démarrage local

```powershell
cd backend
Copy-Item .env.example .env
# Compléter .env avec l’URL Supabase, sa clé publishable et la clé Mistral.
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8001
```

L’API répond ensuite sur `http://127.0.0.1:8001` :

- `GET /health`
- `POST /api/v1/agents/ana/analyse`

Le frontend n’est pas encore redirigé vers cette API. Cette séparation permet
de tester et sécuriser le backend avant de remplacer l’appel Edge Function.
