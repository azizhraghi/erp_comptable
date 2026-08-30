# ComptaExpert

Plateforme comptable de cabinet, modernisée progressivement depuis le projet
HTML historique. Le projet est organisé autour de trois couches complémentaires :

```text
platform/web  React + TypeScript : interface des collaborateurs
        │
        ├── Supabase : authentification, PostgreSQL, RLS et stockage
        │
        └── backend  FastAPI + LangGraph : orchestration IA et intégrations
```

## Où travailler

| Dossier | Rôle |
|---|---|
| [`platform/web`](platform/web) | Application React : saisie, PCE, tiers, import, éditions et centre IA. |
| [`platform/supabase`](platform/supabase) | Schéma PostgreSQL, migrations, seed, RLS et tests de base. |
| [`backend`](backend) | API FastAPI : agents LangGraph, Mistral et futurs connecteurs OCR/bancaires. |
| [`docs`](docs) | Documentation de mise en route et de tests. |
| [`COMPTAEXPERT_V61.html`](COMPTAEXPERT_V61.html) | Référence fonctionnelle temporaire pendant la migration des derniers modules. |

## Démarrage du frontend

```powershell
cd platform/web
Copy-Item .env.example .env
# Renseigner Supabase et VITE_API_URL dans .env ; aucune clé IA ici.
npm install
npm run dev
```

## Démarrage du backend

```powershell
cd backend
Copy-Item .env.example .env
# Renseigner Supabase et MISTRAL_API_KEY dans .env.
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
uvicorn app.main:app --host 127.0.0.1 --port 8001
```

La vérification est disponible sur `http://127.0.0.1:8001/health`.

## Règles de sécurité à préserver

- Les clés IA ne doivent jamais être ajoutées au frontend ni à Git.
- FastAPI reçoit le JWT Supabase de l’utilisateur et le propage à Supabase :
  la RLS reste donc la barrière d’accès aux dossiers.
- Les agents ne modifient jamais directement le grand livre. Ils produisent
  des analyses ou des propositions qui restent soumises à validation humaine.
- Les fichiers `.env` sont ignorés par Git ; ne jamais utiliser la clé
  `service_role` dans le navigateur.

## État actuel et suite recommandée

Le socle métier est opérationnel côté frontend pour le PCE, les tiers, la
saisie manuelle, l’import Excel, les éditions et l’agent de révision. ANA
est câblé vers FastAPI mais nécessite l’installation des dépendances Python
et la configuration de `backend/.env` avant son premier lancement.

Les prochaines tranches sont : rapprochement bancaire, lettrage, ingestion
de factures/OCR, puis agents IMP et SCR.
