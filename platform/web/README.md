# ComptaExpert — application web

React 19 + Vite 6 + TypeScript 5.8 + Tailwind 4, sur Supabase.

## Démarrer

```bash
npm install
cp .env.example .env      # renseigner l'URL et la clé anon du projet Supabase
npm run dev
```

## Où va quoi

```
src/
  lib/supabase.ts          client unique + traduction des erreurs PostgreSQL
  lib/database.types.ts    types générés depuis la base — NE PAS éditer
  auth/AuthProvider.tsx    session GoTrue + profil collaborateur
  dossier/DossierProvider  dossier et exercice actifs — contexte de tout écran
  components/layout/       cadre applicatif
  routes/                  un fichier par écran
```

## Deux règles à ne pas enfreindre

**La clé `service_role` ne doit jamais entrer dans ce projet.** Elle porte
`BYPASSRLS` : elle verrait tous les dossiers du cabinet, y compris ceux où le
collaborateur n'est pas affecté. Seule la clé `anon` a sa place ici — elle est
publique par conception, c'est la RLS qui protège.

**`database.types.ts` ne se modifie pas à la main.** La source de vérité est
le schéma SQL. Le fichier actuel est un stub provisoire ; dès que le projet
Supabase est lié :

```bash
npx supabase link --project-ref <ref>
npm run types
```

Il est alors régénéré depuis la base réelle et tout écart disparaît.

## Un piège TypeScript à connaître

Dans `database.types.ts`, les types de `Row` sont des **alias** (`type`), pas
des interfaces. supabase-js exige que `Row` soit assignable à
`Record<string, unknown>` ; une interface n'obtient pas d'index signature
implicite, et l'inférence retombe alors silencieusement sur `never` — toutes
les requêtes renvoient `never[]` sans le moindre message d'erreur à l'endroit
du problème. Le générateur officiel émet des alias pour cette raison.

## État

Le shell fonctionne : connexion, sélecteur de dossier, sélecteur d'exercice,
profil du collaborateur. `npm run lint` et `npm run build` passent.

Aucun écran métier n'est encore porté. Les douze vues du portage React actuel
se remontent une par une, contre la base plutôt que contre le localStorage.
La première tranche prévue est **Saisie → les 21 contrôles → Grand livre** :
elle traverse toute la barrière du noyau et prouve l'architecture de bout en
bout.
