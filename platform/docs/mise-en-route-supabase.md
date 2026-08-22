# Mise en route Supabase — de zéro à l'application qui tourne

Treize étapes. Comptez trente à quarante minutes la première fois, dont
l'essentiel en attente de la création du projet.

À la fin, vous aurez : une base contenant les 33 tables et les 21 contrôles,
un cabinet, un dossier de démonstration avec son plan comptable, et
l'application web connectée dessus.

---

## Étape 1 — Créer le compte

1. Allez sur **supabase.com** → `Start your project`
2. Connectez-vous avec GitHub, ou par e-mail

Rien à configurer à cette étape.

---

## Étape 2 — Créer le projet

`New project`, puis quatre champs :

| Champ | Valeur | Pourquoi |
|---|---|---|
| **Name** | `comptaexpert` | Correspond au `project_id` de `config.toml` |
| **Database Password** | *généré, puis sauvegardé* | Voir l'avertissement ci-dessous |
| **Region** | **Frankfurt (eu-central-1)** | La plus proche de la Tunisie, donc la latence la plus basse |
| **Plan** | `Free` pour commencer | Suffit pour valider. Voir l'étape 13 pour le passage en Pro |

> ⚠️ **Le mot de passe de la base n'est affiché qu'une fois.**
> Cliquez sur `Generate a password`, puis **copiez-le immédiatement dans votre
> gestionnaire de mots de passe**. Il vous sera redemandé à l'étape 5, et il
> ne peut pas être relu ensuite — seulement réinitialisé.

La création prend deux à trois minutes. Laissez l'onglet ouvert.

---

## Étape 3 — Récupérer les trois identifiants

Dans le dashboard du projet, allez dans **Project Settings** (roue dentée).

**Onglet `General`** → notez la **Reference ID**
Une chaîne de vingt lettres, par exemple `abcdefghijklmnopqrst`. C'est elle
qui sert à lier le CLI.

**Onglet `API`** → notez deux valeurs :

| Valeur | Ressemble à | Va où |
|---|---|---|
| **Project URL** | `https://abcdefghij.supabase.co` | Dans le `.env` du front |
| **anon public** | `eyJhbGciOiJIUzI1NiIs...` | Dans le `.env` du front |
| **service_role** | `eyJhbGciOiJIUzI1NiIs...` | **Nulle part.** Ne la copiez pas |

> ⚠️ **La clé `service_role` ne doit jamais entrer dans le projet web.**
> Elle porte l'attribut `BYPASSRLS` : elle ignore toutes les policies et
> verrait l'intégralité des dossiers du cabinet, y compris ceux où un
> collaborateur n'est pas affecté. La clé `anon` est publique par
> conception — c'est la RLS qui protège, pas le secret de cette clé.

---

## Étape 4 — Connecter le CLI

Dans un terminal, à la racine du projet :

```bash
cd platform
npm install
npx supabase login
```

Un navigateur s'ouvre et vous demande d'autoriser le CLI. Si le navigateur ne
s'ouvre pas, le terminal affiche une URL à coller manuellement.

Vérification :

```bash
npx supabase projects list
```

Votre projet `comptaexpert` doit apparaître dans la liste.

---

## Étape 5 — Lier le projet local au projet distant

```bash
npx supabase link --project-ref VOTRE_REFERENCE_ID
```

Le CLI demande le **mot de passe de la base** — celui de l'étape 2.

En cas d'erreur `Wrong password`, vous pouvez le réinitialiser dans
**Project Settings → Database → Reset database password**.

---

## Étape 6 — Appliquer les sept migrations

C'est l'étape décisive : elle crée les 33 tables, les 21 contrôles et les
policies d'isolation.

```bash
npm run push
```

Le CLI liste les migrations à appliquer et demande confirmation.

**Résultat attendu :** `Finished supabase db push.`

---

## Étape 7 — Si une migration échoue

C'est possible : ce SQL n'a jamais été exécuté sur une vraie base. Si une
erreur apparaît, **copiez-la telle quelle et envoyez-la moi** — le message
PostgreSQL indique le fichier et la ligne, je corrige et vous relancez.

Ne modifiez pas les fichiers vous-même : la moindre divergence entre ce que
vous avez appliqué et ce que contient le dépôt rendra la suite difficile à
diagnostiquer.

Pour repartir d'une base vide en cas de besoin :

```bash
npx supabase db reset --linked
```

> ⚠️ `db reset` **efface toutes les données** de la base distante. C'est sans
> risque maintenant, tant qu'elle est vide. Ne le tapez plus jamais une fois
> qu'un dossier client réel y sera entré.

---

## Étape 8 — Vérifier ce qui a été créé

Dans le dashboard : **Table Editor**. Vous devez voir les tables `cabinet`,
`dossier`, `piece`, `ecriture`, `immobilisation`, `echeance`, etc.

Vérification plus sérieuse, dans **SQL Editor** :

```sql
-- Doit renvoyer 33
select count(*) from information_schema.tables
 where table_schema = 'public';

-- Les trois fonctions de contrôle doivent être là
select routine_name from information_schema.routines
 where routine_schema = 'app' order by routine_name;

-- Aucune table métier ne doit avoir rowsecurity = false
select tablename, rowsecurity from pg_tables
 where schemaname = 'public' order by rowsecurity, tablename;
```

Si une table métier ressort avec `rowsecurity = false`, arrêtez-vous et
dites-le moi : cela signifie qu'un dossier serait lisible par n'importe qui.

---

## Étape 9 — Créer votre utilisateur

**Authentication → Users → Add user → Create new user**

| Champ | Valeur |
|---|---|
| Email | votre adresse professionnelle |
| Password | celui que vous utiliserez pour vous connecter à l'application |
| **Auto Confirm User** | ✅ **à cocher** |

> Si vous ne cochez pas `Auto Confirm User`, Supabase attend une confirmation
> par e-mail et la connexion sera refusée sans message clair.

---

## Étape 10 — Amorcer les données

Sans cette étape, la RLS fait son travail et vous ne verrez rien : pas de
cabinet, pas de collaborateur, donc aucun dossier autorisé. L'application
affichera « Aucun dossier accessible », ce qui est le comportement correct.

1. Ouvrez `platform/supabase/seed.sql`
2. **Remplacez l'e-mail** de la variable `v_email` par le vôtre — c'est la
   seule ligne à modifier
3. Copiez tout le fichier dans **SQL Editor** et exécutez

Le script crée le cabinet, votre compte administrateur, un dossier `SOC001`,
son exercice courant avec ses douze périodes, les six journaux, dix comptes du
PCE et deux tiers.

Message attendu : `Amorçage terminé. Cabinet …, dossier SOC001, exercice ….`

---

## Étape 11 — Générer les types TypeScript

```bash
cd platform
npm run types
```

Cela écrase `web/src/lib/database.types.ts` — actuellement un stub écrit à la
main — par les types réels issus de la base.

> À partir de maintenant, ce fichier ne se modifie plus jamais à la main. La
> source de vérité est le schéma SQL ; toute correction se fait dans une
> migration, puis on régénère.

---

## Étape 12 — Connecter et lancer l'application

```bash
cd web
cp .env.example .env
```

Ouvrez `.env` et renseignez les deux valeurs de l'étape 3 :

```
VITE_SUPABASE_URL=https://VOTRE-REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Puis :

```bash
npm run dev
```

Ouvrez http://localhost:5173, connectez-vous avec l'e-mail et le mot de passe
de l'étape 9.

**Résultat attendu :** le bandeau affiche `SOC001 — Société de démonstration
SARL`, le sélecteur d'exercice montre l'année courante, et votre nom apparaît
à droite avec le badge `administrateur`.

Si vous voyez « Aucun dossier accessible », c'est que l'étape 10 n'a pas été
exécutée, ou que l'e-mail du seed ne correspond pas à celui de connexion.

---

## Étape 13 — Deux choses à régler avant les vrais dossiers

Tout fonctionne maintenant, mais la base contient des données de
démonstration. Avant d'y mettre un dossier client réel :

**Passez en plan Pro (25 $/mois).** Le plan Free met le projet en pause après
une semaine d'inactivité et ne conserve pas de sauvegardes exploitables. Pour
des grands livres clients, ce n'est pas acceptable.

**Réglez la question du secret professionnel.** Les données partiront sur
l'infrastructure AWS de Supabase, hors de Tunisie. Le transfert de données
personnelles hors du pays relève de l'INPDP, et vous êtes tenu au secret
professionnel. Ce n'est pas une question technique et je ne peux pas la
trancher — mais elle doit être réglée avant le premier dossier réel, pas
après.

---

## Aide-mémoire des commandes

| Besoin | Commande | Depuis |
|---|---|---|
| Appliquer les migrations | `npm run push` | `platform/` |
| Régénérer les types | `npm run types` | `platform/` |
| Voir l'écart local / distant | `npm run diff` | `platform/` |
| Lancer l'application | `npm run dev` | `platform/web/` |
| Vérifier que tout compile | `npm run lint` | `platform/web/` |

## Si ça coince

| Symptôme | Cause probable |
|---|---|
| `Access token not provided` | `npx supabase login` non fait (étape 4) |
| `Wrong password` au link | Mot de passe de base — le réinitialiser dans Settings → Database |
| `Configuration Supabase absente` | `.env` manquant ou vide (étape 12) |
| `Invalid login credentials` | `Auto Confirm User` non coché (étape 9) |
| « Aucun dossier accessible » | Seed non exécuté, ou e-mail différent (étape 10) |
| Les requêtes renvoient `never[]` | Types non régénérés (étape 11) |
