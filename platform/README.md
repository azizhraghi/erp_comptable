# ComptaExpert — plateforme de cabinet

Socle de la refonte AI-native. Ce dossier remplace progressivement les sept
projets HTML de l'atelier ; rien n'est supprimé tant que la parité n'est pas
atteinte.

## Décision de pile

| Couche | Choix | Motif |
|---|---|---|
| Base | **PostgreSQL via Supabase Cloud** | Sauvegardes automatiques et disponibilité gérées : plus sûr pour un cabinet sans exploitation dédiée qu'un serveur que personne n'aura le temps de surveiller. |
| Isolation | **Row-Level Security** | Arbitrage A. L'isolation entre dossiers est appliquée en base, pas dans le code applicatif. |
| Auth | GoTrue (Supabase) | `collaborateur.id` référence `auth.users(id)`. |
| Stockage | Supabase Storage | Pièces justificatives ; la table `document` ne garde que le pointeur et le hash. |
| Recherche vectorielle | pgvector | Mémoire d'imputation de l'agent IMP. Index HNSW. |

> **Ce choix révise l'arbitrage B (souverain).** Les données comptables des
> clients résideront sur l'infrastructure AWS de Supabase, hors de Tunisie.
> Deux conséquences à ne pas perdre de vue :
>
> 1. **Secret professionnel et INPDP** — le transfert de données personnelles
>    hors de Tunisie doit être réglé **avant** l'entrée du premier dossier
>    client réel en base, pas après.
> 2. **La contrainte souveraine sur les modèles d'IA tombe avec elle.** Si les
>    données sont déjà dans le cloud, l'agent SCR peut utiliser un modèle de
>    vision de pointe pour les factures fournisseurs, et la ligne budgétaire
>    GPU disparaît.
>
> Le choix reste réversible : Cloud et auto-hébergé font tourner le même
> logiciel et les mêmes migrations. Passer de l'un à l'autre est un `pg_dump`
> suivi d'un restore.

## Ordre des migrations

Elles sont dépendantes et s'appliquent dans l'ordre. Ne pas réordonner.

| Fichier | Contenu |
|---|---|
| `20260822090001_fondations.sql` | Cabinet, collaborateurs, dossiers, affectations, helpers d'isolation |
| `20260822090002_referentiel.sql` | Exercices, périodes, journaux, plan comptable, tiers |
| `20260822090003_grand_livre.sql` | Pièces, écritures, lettrage, rapprochement, immuabilité |
| `20260822090004_controles.sql` | **Les 21 contrôles** et la barrière de validation |
| `20260822090005_modules.sql` | Immobilisations, échéances déclaratives, temps passé |
| `20260822090006_agents_audit.sql` | Documents, propositions, corrections, mémoire, piste d'audit |
| `20260822090007_rls.sql` | Policies d'isolation |
| `20260822090008_rpc.sql` | Couche d'appel : contrôles exposés, `enregistrer_piece()`, numérotation serveur |
| `20260822090009_editions.sql` | Vues BG, BA, GLG, GLA, balance âgée, fonctions de solde |

Application :

```bash
cd platform
npm install
npx supabase login
npx supabase link --project-ref <ref-du-projet>
npm run push
```

Guide pas à pas complet : [docs/mise-en-route-supabase.md](docs/mise-en-route-supabase.md)

## Ce que le schéma garantit

**Les agents ne peuvent pas écrire dans le grand livre.** Une proposition
d'agent vit dans `proposition`. Pour devenir une écriture, elle doit être
promue en `piece` et franchir `app.controler_piece()` comme n'importe quelle
saisie manuelle. Il n'existe aucun chemin d'écriture réservé à l'IA.

**Une écriture validée est immuable.** Le trigger `app.ecriture_immuable()`
refuse tout UPDATE ou DELETE dès que la pièce quitte le brouillon. La seule
correction possible est la contre-passation.

**La piste d'audit ne se falsifie pas.** `audit_log` est alimentée par
trigger en `SECURITY DEFINER`, n'a aucune policy d'insertion côté client, et
un trigger d'ajout seul rejette UPDATE et DELETE.

**Un collaborateur ne voit que ses dossiers.** Toutes les tables métier sont
en `FORCE ROW LEVEL SECURITY`, y compris pour le propriétaire des tables.

## Les 21 contrôles

Extraits de `Editions GL et BG/V3.2.15.html` (E1–E8) et de
`Générateur Ecritures comptables/V26/…V26.html` (C1–C13).

Quatre sont devenus des contraintes plutôt que des fonctions — un contrôle
qu'on ne peut pas oublier d'exécuter vaut mieux qu'un contrôle qu'il faut
penser à appeler :

| Contrôle | Devenu |
|---|---|
| E1a lignes vides | `ecriture_non_vide` |
| E8 nom de société | `NOT NULL` sur `dossier.raison_sociale` |
| C8 montant négatif converti | `ecriture_montants_positifs` |
| C10 valeur négative | idem |

Les autres sont regroupés en trois fonctions :

- `app.controler_piece(uuid)` — E2 E3 E4 E5 E6 C1 C2 C7 C11 C13
- `app.controler_lettrage(uuid)` — C3 C4 C5 C6
- `app.controler_dossier(uuid, uuid)` — E1 C9 C12, audit préalable aux éditions

**E7 a changé de nature.** Le contrôle « conformité des soldes grand livre
contre balance » existait parce que l'outil d'éditions travaillait sur un
fichier plat importé où les deux états pouvaient diverger. Ici, balance et
grand livre sont deux agrégations de la même table `ecriture` : la divergence
est structurellement impossible. E7 devient un test de non-régression entre
les vues d'édition, pas un contrôle de données.

## État de vérification

```bash
npm test
```

Les migrations s'appliquent sur un **PostgreSQL 18 réel**, via PGlite — le
moteur compilé en WebAssembly. Aucun Docker, aucun service à installer : la
base tourne dans le processus Node.

**Résultat : 9 migrations appliquées, 63 tests de comportement, 0 échec.**

| Vérifié | Comment |
|---|---|
| Les 9 migrations s'appliquent | Exécution réelle sur PostgreSQL 18.3 |
| 34 tables, 6 vues, 88 policies, 19 fonctions `app.` | Comptage après migration |
| Aucune table métier sans RLS | `pg_tables.rowsecurity` |
| Les 21 contrôles refusent ce qu'ils doivent refuser | `tests/controles.test.mjs` |
| L'immuabilité tient après visa | Test UPDATE et DELETE |
| Le journal d'audit est en ajout seul | Test UPDATE et DELETE |
| Un junior ne peut pas superviser | Test de transition de statut |
| Un visa refusé ne laisse aucun brouillon orphelin | `tests/rpc-editions.test.mjs` |
| Un échec ne consomme pas de numéro de pièce | Le compteur se rembobine avec la transaction |
| Le dossier d'une écriture ne peut pas diverger de sa pièce | Injection refusée par trigger |
| **E7** — balance et grand livre concordent, compte par compte | Test de non-régression |
| Toutes les vues portent `security_invoker` | Sans quoi elles contourneraient la RLS |

### Ce qui reste non vérifié

- **pgvector.** PGlite ne l'embarque pas : la colonne `vector(1024)` et
  l'index HNSW de `memoire_imputation` sont neutralisés dans le harnais. Ces
  deux lignes seront vérifiées à la première application sur Supabase.
- **Le comportement des policies RLS.** Les tests tournent en
  superutilisateur, qui contourne la RLS. Leur syntaxe est validée et leur
  présence vérifiée, mais l'isolation effective se teste avec de vrais JWT :
  voir [`docs/tests-isolation.md`](docs/tests-isolation.md).

### Défauts trouvés et corrigés avant cette campagne

- `%s` au lieu de `%` dans un `raise exception` plpgsql
- référence à `OLD` dans la clause `WHEN` d'un trigger `AFTER INSERT`
- `%1$I_select` produisant l'identifiant invalide `"exercice"_select`, ce qui
  aurait fait échouer **toutes** les policies de la boucle
- littéraux non typés dans les `return query` de fonctions `setof`
- `regle_imputation` traitée comme table de cabinet, ce qui exposait les
  règles d'un dossier à des collaborateurs non affectés

## Deux modes de fonctionnement

L'application web sait tourner sans Supabase, sur une base locale.

| | Mode `local` (défaut) | Mode `supabase` |
|---|---|---|
| Base | PGlite dans le navigateur, IndexedDB | Supabase Cloud |
| Schéma | Les mêmes 9 migrations | Les mêmes 9 migrations |
| Installation | Aucune | Projet Supabase |
| Authentification | Session ouverte, utilisateur de démonstration | GoTrue |
| **Isolation RLS** | **Non exercée** — on est propriétaire de la base | Appliquée |
| Données | Sur ce poste uniquement | Partagées par l'équipe |

Le choix se fait par `VITE_MODE_DONNEES` dans `web/.env`. La couture est
`web/src/data/depot.ts` : une douzaine d'opérations, deux implémentations.
Passer de l'une à l'autre ne touche aucun écran.

Le mode local sert à avancer sans attendre le projet Supabase — et restera
ensuite le mode démonstration, hors ligne et instantané.

## Suite

1. Tranche verticale Saisie → 21 contrôles → Grand livre dans `web/`
2. Portage du moteur d'éditions (BG, BA, GLG, GLA) sur des vues SQL
3. Appliquer sur Supabase Cloud — guide : [`docs/mise-en-route-supabase.md`](docs/mise-en-route-supabase.md)
4. Tests d'isolation RLS avec de vrais JWT
5. Import des 16 déclarations et des jours fériés depuis
   `EcheancesExpert_Cabinet_2026.05.07.json`
