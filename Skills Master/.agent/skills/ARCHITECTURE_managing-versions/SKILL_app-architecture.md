---
name: ARCHITECTURE_managing-versions
description: >
  Maintient à jour le fichier ARCHITECTURE_[PROJET].txt après chaque livraison
  de code, en complément du skill managing-versions (4 fichiers au total).
  Couvre : architecture globale, cartographie des modules, flux de navigation,
  fonctions transverses, anomalies, et pour chaque module : layout, modèle de
  données, liaisons entrantes/sortantes, arbre d'appels, flux de données,
  mapping des couleurs, intégration future. Déclencher SYSTÉMATIQUEMENT après
  toute livraison de code, en même temps que managing-versions. Mise à jour
  CHIRURGICALE : seule(s) la ou les section(s) impactée(s) sont modifiées.
  Nommer dynamiquement selon le nom du projet racine.
---

# ARCHITECTURE_managing-versions — Fichier d'architecture vivant

Après chaque code livré, mettre à jour **ARCHITECTURE_[PROJET].txt**
en parallèle des trois fichiers managing-versions.

Le fichier architecture est le **quatrième fichier** du système de suivi.

---

## Convention de nommage

| Fichier          | Nom attendu                        |
|------------------|------------------------------------|
| Architecture     | `ARCHITECTURE_[NOM_PROJET].txt`    |

Règle : inférer le nom depuis le dossier racine ou `instructions.md`.
Si ambiguïté → demander avant de créer.

---

## Couplage avec managing-versions

À chaque livraison de code, les **4 fichiers** sont mis à jour ensemble :

```
HISTORIQUE_VERSIONS_[PROJET].txt          ← managing-versions
PLAN_MODIFICATIONS_PAR_MENU_[PROJET].txt  ← managing-versions
CHRONO_DEVELOPPEMENT_[PROJET].txt         ← managing-versions
ARCHITECTURE_[PROJET].txt                 ← app-architecture  (ce skill)
```

Confirmation finale (4 fichiers) :
```
✅ Quatre fichiers mis à jour — V[N]
   • HISTORIQUE_VERSIONS_[PROJET].txt         → entrée V[N] insérée en tête
   • PLAN_MODIFICATIONS_PAR_MENU_[PROJET].txt → [N] section(s) mise(s) à jour
   • CHRONO_DEVELOPPEMENT_[PROJET].txt        → session [N°], durée [H]h [M]min
   • ARCHITECTURE_[PROJET].txt               → [N] section(s) mise(s) à jour : [liste]
```

---

## Workflow — Décision initiale obligatoire

```
ARCHITECTURE_[PROJET].txt existe-t-il ?
         |                    |
        OUI                  NON
         |                    |
  → Workflow B (MAJ)   → Workflow A (CRÉATION)
```

---

## Workflow A — Première création

- [ ] 1. Identifier le nom du projet (dossier racine ou `instructions.md`)
- [ ] 2. Recenser tous les modules présents dans le code livré
- [ ] 3. Identifier la version courante (depuis HISTORIQUE_VERSIONS ou V01 par défaut)
- [ ] 4. Créer `ARCHITECTURE_[PROJET].txt` avec la structure complète :
       - En-tête + métadonnées
       - CHANGELOG (entrée initiale V01)
       - PARTIE 1 : Architecture globale (7 sections)
       - PARTIE 2 : Un bloc MODULE par module détecté (7 sous-sections chacun)
- [ ] 5. Confirmer la création

---

## Workflow B — Mise à jour chirurgicale

```
INTERDIT  : Réécrire le fichier entier ou une partie entière.
OBLIGATOIRE : Lire → identifier la section impactée → modifier uniquement ce bloc.
```

- [ ] 1. **LIRE le fichier ARCHITECTURE en intégralité** avant d'écrire quoi que ce soit
- [ ] 2. Identifier quelle(s) section(s) sont impactées par le code livré :
       - Nouvelle fonctionnalité → PARTIE 2, module concerné, sous-sections impactées
       - Nouveau module → créer un bloc MODULE complet en PARTIE 2
       - Changement de liaison → section 3 du module + schéma global si nécessaire
       - Changement de flux → section 4 ou 5 du module
       - Nouvelle anomalie → section ANOMALIES de la PARTIE 1
       - Changement de couleur/style → section 6 du module
       - Planification future → section 7 du module
- [ ] 3. Modifier **uniquement** les blocs identifiés, mot pour mot pour le reste
- [ ] 4. Mettre à jour le CHANGELOG (insertion en tête, une ligne par module impacté)
- [ ] 5. Mettre à jour les MÉTADONNÉES (version courante + date + heure)
- [ ] 6. Confirmer la mise à jour avec la liste des sections modifiées

---

## Règle d'or — Lecture avant écriture

Tout ce qui n'est pas explicitement modifié par la livraison de code **reste
identique, mot pour mot**. Ne jamais reformuler, restructurer ou "améliorer"
les sections non impactées.

---

## Structure du fichier ARCHITECTURE_[PROJET].txt

### En-tête et métadonnées

```
====================================================================================================================================
                              ARCHITECTURE APPLICATIVE — [NOM PROJET EN MAJUSCULES]
====================================================================================================================================
Version courante    : V[N]
Dernière mise à jour: [JJ/MM/AAAA à HH:MM]
Nombre de modules   : [N]
====================================================================================================================================
```

### CHANGELOG — Architecture (toujours en tête, après l'en-tête)

```
====================================================================================================================================
CHANGELOG ARCHITECTURE
====================================================================================================================================
V[N] — [JJ/MM/AAAA] : [Module(s)] — [courte description de ce qui a changé]
V[N-1] — [JJ/MM/AAAA] : [Module(s)] — [courte description]
...
====================================================================================================================================
```

Règles CHANGELOG :
- Antichronologie stricte : V(N) toujours au-dessus de V(N-1)
- Une ligne par version (plusieurs modules séparés par " | ")
- Maximum 120 caractères par ligne
- Insertion uniquement — les lignes existantes ne sont jamais modifiées

---

### PARTIE 1 — ARCHITECTURE GLOBALE

Structure fixe, 7 sections numérotées :

```
====================================================================================================================================
PARTIE 1 — ARCHITECTURE GLOBALE
====================================================================================================================================

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
1.1 CARTOGRAPHIE DES MODULES ET LEURS LIAISONS
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[Diagramme ASCII des modules et leurs connexions]

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
1.2 CARTOGRAPHIE DES LIAISONS ENTRE ONGLETS / PAGES
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[Tableau ou diagramme ASCII des liaisons onglet → onglet]

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
1.3 SCHEMA DES FLUX DE DONNEES ENTRE MODULES
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[Diagramme ASCII des flux : state.[module] → fonctions → modules consommateurs]

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
1.4 FONCTIONS TRANSVERSES (CROSS-CUTTING)
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[Liste des fonctions utilisées par plusieurs modules]
Nom fonction        | Modules appelants            | Rôle
--------------------|------------------------------|-----------------------------
saveToStorage()     | Tous                         | Persistance localStorage
addAuditLog()       | Tous                         | Traçabilité des actions
showToast()         | Tous                         | Notifications UI
showPage()          | Navigation                   | Routeur principal
...

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
1.5 FLUX DE NAVIGATION
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[Diagramme ASCII du flux de navigation entre pages/onglets]

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
1.6 ANOMALIES / POINTS D'ATTENTION
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[⚠] [Module] : Description de l'anomalie ou du point de vigilance.
[✓] [Module] : Anomalie résolue en V[N] — description.

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
1.7 DIAGRAMME D'ARCHITECTURE DETAILLE (vue d'ensemble)
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[Grand diagramme ASCII montrant l'ensemble de l'application : UI, state,
 localStorage, modules, dépendances externes (CDN, API)]
```

---

### PARTIE 2 — MODULES (un bloc par module)

Chaque module suit **exactement** ce template à 7 sous-sections.
Les modules sont classés dans l'ordre alphabétique ou logique défini à la V01.
Un nouveau module est inséré à sa position alphabétique/logique sans déplacer les autres.

```
====================================================================================================================================
MODULE : [NOM DU MODULE EN MAJUSCULES]
Depuis : V[N_creation]       Dernière MAJ : V[N] — [JJ/MM/AAAA]
====================================================================================================================================

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[NOM MODULE] — 1. LAYOUT DE L'INTERFACE
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[Diagramme ASCII box-drawing de l'interface du module]
[Annotations des zones : panneaux, boutons, champs, filtres]

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[NOM MODULE] — 2. MODELE DE DONNEES  state.[module]
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Objet [NomObjet]
═══════════════════════════════════════════
{
  champ1: 'valeur_exemple',    // Type — description — contraintes
  champ2: true,                // Boolean — description — défaut
  ...
}

Valeurs autorisées :
  champ_enum : valeur1 | valeur2 | valeur3

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[NOM MODULE] — 3. LIAISONS ENTRANTES / SORTANTES
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
                          ┌──────────────────────┐
                          │   state.[module]     │
                          └──────┬──────┬────────┘
                                 │      │
                    ┌────────────┘      └────────────┐
                    ▼                                 ▼
┌────────────────────────────┐    ┌────────────────────────────┐
│       LECTURE (read)       │    │      ECRITURE (write)      │
├────────────────────────────┤    ├────────────────────────────┤
│ fonction1()                │    │ fonction2()                │
│ fonction3()                │    │ fonction4()                │
└────────────────────────────┘    └────────────────────────────┘

DEPENDANCES EXTERNES DU MODULE [NOM]
═══════════════════════════════════════
┌──────────────┐    [donnée consommée]     ┌──────────────────┐
│  MODULE X    │ ─────────────────────►   │  MODULE [NOM]    │
└──────────────┘                           └──────────────────┘

┌──────────────┐                           ┌──────────────────┐
│  MODULE [NOM]│ ─── fonction() ─────────► │  AUDIT LOG       │
└──────────────┘                           └──────────────────┘

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[NOM MODULE] — 4. ARBRE D'APPELS DES FONCTIONS
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
showPage('[module]')
  └── render[Module]()
        ├── filtre1 (global)
        ├── filtre2 (global)
        └── fonction auxiliaire()
              └── ...

action[Module](id)         [déclencheur utilisateur]
  ├── validation()
  ├── state.update
  ├── addAuditLog()
  ├── saveToStorage()
  └── render[Module]()

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[NOM MODULE] — 5. FLUX DE DONNEES DETAILLE
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
fonctionCle(param)
  │
  ├── 1. [Description étape 1]          ex: 'valeur_exemple'
  │
  ├── 2. fonctionAuxiliaire(x)
  │      └── state.[autre].filter(...)
  │             → [résultat intermédiaire]
  │
  ├── 3. state.[module].some(e => {
  │         condition1
  │         && condition2
  │     })
  │
  └── 4. Retourne [type] / [valeurs possibles]

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[NOM MODULE] — 6. MAPPING DES COULEURS ET STYLES
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Élément               | Classe CSS / Style                | Condition / Rôle
----------------------|-----------------------------------|---------------------------
[élément1]            | [classe ou variable CSS]          | [quand / pourquoi]
[élément2]            | [classe ou variable CSS]          | [quand / pourquoi]

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[NOM MODULE] — 7. INTEGRATION FUTURE (prevue)
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[ ] [Fonctionnalité prévue] — [Raison / contexte]
[ ] [Fonctionnalité prévue] — [Raison / contexte]
[✓] V[N] — [Fonctionnalité réalisée, anciennement prévue ici]

====================================================================================================================================
FIN MODULE : [NOM DU MODULE EN MAJUSCULES]
====================================================================================================================================
```

---

## Règles critiques — ARCHITECTURE

1. **Lecture avant écriture** : lire le fichier entier avant toute modification.
2. **Chirurgie uniquement** : modifier seulement les blocs impactés par le code livré.
3. **Intégrité absolue** : tout ce qui n'est pas impacté reste identique, mot pour mot.
4. **CHANGELOG en tête** : chaque version ajoute une ligne en antichronologie.
5. **Métadonnées à jour** : version courante et date de dernière MAJ, toujours mis à jour.
6. **Nouveau module** : créer le bloc complet avec les 7 sous-sections, insérer à sa position logique.
7. **Module supprimé** : marquer `[SUPPRIMÉ en V[N]]` dans l'en-tête du bloc — ne jamais effacer.
8. **Pas de markdown** : `.txt` pur, ASCII uniquement (box-drawing autorisé : ─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼ ═ ║ ▼ ►).
9. **Anomalies** : toute régression ou incohérence détectée dans le code livré
   doit être signalée dans la section 1.6, préfixée `[⚠]`.
10. **Section 7 vivante** : quand une intégration prévue est réalisée, cocher `[✓]`
    dans section 7 et décrire l'implémentation dans les sections 1 à 5 du module.

---

## Exceptions autorisées — Correction de l'architecture

| Situation                                  | Action autorisée                              |
|--------------------------------------------|-----------------------------------------------|
| Erreur factuelle dans un diagramme         | Corriger uniquement la ligne ou le bloc fautif|
| Oubli d'une liaison dans la dernière MAJ   | Ajouter la ligne manquante dans le bon bloc   |
| Faute de frappe                            | Corriger la ligne concernée uniquement        |
| Demande explicite de l'utilisateur         | Appliquer la correction ciblée demandée       |
| Aller-retour utilisateur (correction code) | Resynchroniser uniquement la section affectée |

L'utilisateur peut modifier le `.txt` manuellement et demander une correction
de code en retour : l'IA lit la section modifiée et adapte le code en conséquence.
Ce flux aller-retour (doc → code) est supporté par ce skill.

---

## Confirmations

**Workflow A (création) :**
```
✅ ARCHITECTURE_[PROJET].txt créé — V[N]
   • En-tête + métadonnées
   • CHANGELOG initialisé
   • Partie 1 : [N] sections globales
   • Partie 2 : [N] module(s) : [liste]
```

**Workflow B (mise à jour) :**
```
✅ ARCHITECTURE_[PROJET].txt mis à jour — V[N]
   • CHANGELOG     → ligne V[N] insérée en tête
   • Métadonnées   → version + date mis à jour
   • Sections MAJ  → [liste des sections modifiées, ex: TIERS/3, TIERS/4, GLOBALE/1.3]
```
