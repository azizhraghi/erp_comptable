# [Nom de votre projet]

> Ce fichier est le contrat de travail entre vous et l'IA.
> Remplissez-le progressivement en répondant aux questions posées par l'IA.
> Plus il est précis, moins l'agent fera d'erreurs ou de suppositions.
> L'IA pose des questions une par une — jamais de liste de 10.

---

## Objectif
[Décrivez en 1-2 phrases ce que l'application doit faire et quel problème elle résout.]

---

## Fonctionnalités
- [Fonctionnalité 1 : décrivez ce que l'utilisateur peut faire]
- [Fonctionnalité 2]
- [Fonctionnalité 3]
- [Fonctionnalité 4]

---

## Pages / Écrans
- Page d'accueil : [ce qu'on y voit]
- Page détail  : [ce qu'elle contient]
- [Autres pages si besoin]

---

## Stack technique

> Cocher la stack utilisée pour CE projet. L'IA adapte ses choix en conséquence.

### Option A — HTML fichier unique (projets légers, cabinet)
- [ ] Tout dans un seul fichier HTML (CSS + JS intégrés)
- [ ] Pas de framework — JavaScript vanilla uniquement
- [ ] Persistance : localStorage du navigateur
- [ ] Ouverture directe depuis le PC (protocole `file://`)
- [ ] Export : `window.print()` pour PDF, ou bibliothèque jsPDF si besoin

### Option B — React + Vite + Tailwind + Supabase (projets complexes, multi-utilisateurs)
- [ ] React + Vite (composants, routing React Router)
- [ ] Tailwind CSS (`darkMode: 'class'`) + shadcn/ui si besoin
- [ ] Supabase (base de données PostgreSQL, auth, RLS)
- [ ] Déploiement Vercel ou Netlify
- [ ] Variables d'environnement dans `.env.local` (jamais committer)

### Contraintes communes aux deux stacks
- Design sobre et professionnel
- Responsive : desktop (1280px), tablette (768px), mobile (375px)
- Mode sombre / mode clair avec persistance localStorage
- [Ajouter toute contrainte spécifique au projet]

---

## Modèle de données

> L'IA pose des questions pour compléter ce tableau avant de coder.
> Ne pas laisser de ligne vide — si une entité est incertaine, le noter.

| Entité | Champs principaux | Type | Obligatoire | Stockage |
|---|---|---|---|---|
| [Ex: Client] | nom, matricule, email | texte | Oui | localStorage / Supabase |
| [Ex: Exercice] | année, date_ouverture, statut | date / enum | Oui | localStorage / Supabase |
| [Ajouter...] | | | | |

**Relations entre entités** (à compléter) :
- [Ex : Un Client a plusieurs Exercices]
- [Ex : Un Exercice contient plusieurs Écritures]

---

## Ce que l'app ne fait PAS
- [Précisez les limites pour éviter que l'agent parte dans tous les sens]
- [Ex : pas de backend custom, pas d'authentification multi-utilisateur]
- [Ex : pas de calcul de paie, pas d'édition de liasses fiscales]

---

## Localisation & contexte réglementaire tunisien

> Ces règles s'appliquent à TOUS les projets dans ce contexte.
> L'IA les respecte sans qu'on ait besoin de le répéter.

### Langue
- Interface entièrement en **français**
- Messages d'erreur, labels, placeholders, tooltips : français
- Exports (PDF, Excel, TXT) : français

### Formats obligatoires
- Dates          : **JJ/MM/AAAA** — jamais MM/DD/YYYY ni YYYY-MM-DD en affichage
- Heures         : **HH:MM** (format 24h)
- Nombres        : séparateur décimal = **virgule** `,` — séparateur milliers = **espace** ` `
- Montants dinar : **3 décimales obligatoires** — ex. `1 234 567,890 TND`
- Taux TVA       : 19% (taux normal) — 13% (réduit) — 7% (super-réduit) — 0% (exonéré)
- Exercice fiscal : **01/01 → 31/12** (année civile, régime tunisien général)

### Législation de référence
- Comptabilité    : **Système Comptable des Entreprises (SCE 1997)** — Plan de comptes officiel
- Fiscalité       : **Code de l'IRPP et de l'IS**, **Code de la TVA** (lois tunisiennes en vigueur)
- Social          : **CNSS**, **TFP 1%**, **FOPROLOS 1%**, **TCL 0,2%**
- Normes          : IAS/IFRS applicables par renvoi du SCE pour les points non couverts

---

## Gestion des erreurs et cas limites

L'agent DOIT gérer explicitement les situations suivantes dans chaque fonctionnalité :

### Données manquantes ou invalides
- Champ obligatoire vide → message d'erreur précis sous le champ, pas d'alerte générique
- Format incorrect (date, montant, matricule) → indiquer le format attendu dans le message
- Valeur hors limites (montant négatif, date future sur clôture...) → bloquer avec explication

### Données corrompues ou absentes
- localStorage vide ou corrompu → initialiser avec des données par défaut, ne pas crasher
- Clé localStorage manquante → la recréer silencieusement, logguer en console
- Migration de version (ex. V38 → V39) → script de migration des données automatique

### Cas limites métier
- Division par zéro dans les calculs → afficher "—" ou "N/A", jamais NaN ni Infinity
- Liste vide → afficher un message d'état vide ("Aucun élément trouvé"), jamais une liste blanche
- Export sur données vides → désactiver le bouton export ou afficher un avertissement

### Règle générale
Tout bloc de code qui lit/écrit des données DOIT être encapsulé dans un try/catch.
Les erreurs sont loguées en console avec un message descriptif, jamais silencieuses.

---

## Convention de nommage des fichiers livrés

### Fichier principal de l'application
```
[NOM_PROJET]_V[N].html
```
Exemples :
- `FISCALPRO_V01.html`
- `ERP_COMPTAEXPERT_V39.html`
- `IMMO_TRACKING_V12.html`

### Règles
- `[NOM_PROJET]` : majuscules, underscores à la place des espaces, sans accents
- `[N]` : numéro à 2 chiffres minimum (V01, V02... V10, V11...V99, V100)
- Jamais : `app.html`, `index.html`, `final.html`, `index_final_v2.html`
- Un seul fichier livré par version — jamais plusieurs variantes

### Autres fichiers du projet
```
HISTORIQUE_VERSIONS_[NOM_PROJET].txt
PLAN_MODIFICATIONS_PAR_MENU_[NOM_PROJET].txt
CHRONO_DEVELOPPEMENT_[NOM_PROJET].txt
ARCHITECTURE_[NOM_PROJET].txt
docs/specs/YYYY-MM-DD-[sujet]-design.md
docs/plans/YYYY-MM-DD-[sujet].md
```

---

## Commits Git

Après chaque version livrée, produire un message de commit standardisé.

### Format obligatoire
```
V[N] — [type] : [résumé en une ligne (max 72 caractères)]

[Description optionnelle si besoin de détail]
```

### Types de commit
| Type | Usage |
|---|---|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `refactor` | Restructuration sans changement fonctionnel |
| `style` | Modification visuelle / CSS uniquement |
| `chore` | Maintenance : migration données, renommage, nettoyage |
| `perf` | Optimisation performance |

### Exemples
```
V40 — feat : ajout filtre par journal dans la grille de saisie

V41 — fix : correction débordement colonne Libellé sur mobile

V42 — chore : migration clé localStorage v41 → v42
```

---

## Environnement de déploiement

### Mode actuel : fichier HTML local (protocole file://)

Contraintes spécifiques à respecter :
- **Pas de fetch vers des fichiers locaux** : les appels `fetch('./data.json')` échouent en `file://`
  → Toutes les données sont dans le HTML ou en localStorage, jamais dans des fichiers séparés
- **Pas de module ES natifs** : `type="module"` ne fonctionne pas en `file://` sans serveur
  → Utiliser des scripts classiques ou bundler (si React, toujours builder avec Vite)
- **Chemins relatifs uniquement** : jamais de chemin absolu `/assets/...`
- **Impression / PDF** : utiliser `window.print()` + CSS `@media print` en priorité
  → jsPDF ou html2canvas en secours si la mise en page est complexe
- **Partage du fichier** : le HTML est autonome (tout intégré), envoyable par email ou clé USB

### Si le projet passe en Option B (React + Supabase)
- Variables sensibles dans `.env.local` — jamais dans le code ni dans Git
- Build Vite (`npm run build`) avant déploiement Vercel
- Tester en local avec `npm run dev` (port 5173 par défaut)

---

## Règle de non-régression

### Avant chaque modification
L'IA DOIT, dans cet ordre :
1. **Annoncer ce qu'elle va faire** — décrire les modifications prévues en français clair,
   fichier par fichier, section par section, AVANT de produire le moindre code
2. **Attendre la validation** — si la description semble incorrecte ou incomplète,
   l'utilisateur corrige avant que le code soit écrit
3. **Poser ses questions** — toute zone ambiguë, même mineure, est signalée et clarifiée
   avant de coder, jamais après

### Base de travail
- Toujours copier la **dernière version** (`V(N-1)`) comme point de départ
- Appliquer uniquement les modifications demandées sur cette copie → `V(N)`
- Ne jamais modifier une version antérieure sauf demande explicite
- Si l'utilisateur demande de revenir à une ancienne version → poser des questions
  pour comprendre pourquoi et vérifier qu'il n'y a pas une meilleure alternative

### Vérification après modification
Après chaque livraison de code, vérifier que :
- [ ] Les fonctionnalités existantes non modifiées sont toujours opérationnelles
- [ ] Aucune variable ou fonction n'a été supprimée par inadvertance
- [ ] Le localStorage est correctement migré si la structure a changé
- [ ] L'affichage est intact en desktop et mobile

---

## Priorités — MoSCoW + P1/P2/P3

### MoSCoW (planification du backlog)
| Niveau | Signification | Règle |
|---|---|---|
| **Must** | Indispensable — l'app est inutilisable sans | Coder en priorité absolue |
| **Should** | Important — forte valeur, contournable temporairement | Coder après les Must |
| **Could** | Confort — bonne idée, pas urgent | Coder si le temps le permet |
| **Won't** | Exclu de cette version — peut revenir plus tard | Ne pas coder, documenter |

### P1/P2/P3 (urgence immédiate en cours de session)
| Niveau | Signification |
|---|---|
| **P1** | À faire maintenant, bloque tout le reste |
| **P2** | À faire dans cette session |
| **P3** | Peut attendre la prochaine session |

### Règle d'arbitrage pour l'IA
Si deux tâches sont en conflit ou si le contexte est ambigu :
1. Demander à l'utilisateur de classer en MoSCoW
2. En l'absence de réponse → traiter dans l'ordre : Must → Should → Could
3. Ne jamais coder un "Could" si un "Must" ou "Should" est en attente

---

## Règles de travail — Récapitulatif

| # | Règle | Résumé |
|---|---|---|
| 1 | Questions d'abord | Une question à la fois, attendre la réponse |
| 2 | Lire les 3 fichiers | `instructions.md` + `brand-guidelines.md` + `context.md` avant chaque session |
| 3 | Annoncer avant de coder | Décrire les modifications en français AVANT de produire le code |
| 4 | Copie V(N-1) → V(N) | Jamais partir de zéro ni d'une version antérieure sans demande |
| 5 | Nommage fichiers | `[NOM_PROJET]_V[N].html` obligatoire |
| 6 | architecture_managing-versions | Invoquer après CHAQUE livraison — met à jour les 4 fichiers TXT |
| 7 | Localisation TN | Français, JJ/MM/AAAA, virgule décimale, espace milliers, 3 décimales TND |
| 8 | Erreurs et limites | try/catch partout, messages clairs, jamais de crash silencieux |
| 9 | Non-régression | Vérifier les fonctionnalités existantes après chaque modification |
| 10 | Priorités | MoSCoW pour le backlog, P1/P2/P3 pour l'urgence en session |

### Ordre des phases de développement

| Phase | Skill à invoquer | Déclencheur |
|---|---|---|
| 1. Conception | `.agent/skills/brainstorming-ideas/SKILL.md` | Nouveau projet ou fonctionnalité majeure |
| 2. Plan | `.agent/skills/planning-implementation/SKILL.md` | Après validation de la spec |
| 3. Développement | — | Copie V(N-1) → modifications → V(N) |
| 4. Suivi versions | `.agent/skills/architecture_managing-versions/SKILL.md` | Après chaque livraison de code |
| 5. Audit | `.agent/skills/audit-workflow/SKILL.md` | Sur la DERNIÈRE version uniquement |
| 6. Optimisation | `.agent/skills/optimize-workflow/SKILL.md` | Sur la DERNIÈRE version uniquement |
