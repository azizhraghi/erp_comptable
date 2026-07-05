---
name: architecture_managing-versions
description: >
  Maintient à jour les QUATRE fichiers de suivi après chaque code livré :
  HISTORIQUE_VERSIONS (journal chronologique), PLAN_MODIFICATIONS_PAR_MENU
  (vue par menu/module), CHRONO_DEVELOPPEMENT (suivi du temps de développement
  par version et total projet), et ARCHITECTURE (documentation vivante de
  l'architecture applicative par module). Déclencher SYSTÉMATIQUEMENT après
  toute livraison de code, même mineure. Mise à jour CHIRURGICALE pour
  ARCHITECTURE : seule(s) la ou les section(s) impactée(s) sont modifiées.
  Tri VERSION DÉCROISSANT obligatoire dans les 4 fichiers. Contrôle
  d'intégrité transversal : toutes les versions doivent être présentes et
  homogènes dans les 4 fichiers. Date et heure = date de dernière modification
  du fichier HTML livré (horodatage système du fichier source).
  Nommer dynamiquement les fichiers selon le nom du projet racine.
---

# architecture_managing-versions — Quatre fichiers de suivi

Après chaque code fourni, mettre à jour **les quatre fichiers** simultanément :
- `HISTORIQUE_VERSIONS_[PROJET].txt`
- `PLAN_MODIFICATIONS_PAR_MENU_[PROJET].txt`
- `CHRONO_DEVELOPPEMENT_[PROJET].txt`
- `ARCHITECTURE_[PROJET].txt`

---

## Conventions de nommage

| Fichier                   | Nom attendu                                    |
|---------------------------|------------------------------------------------|
| Historique chronologique  | `HISTORIQUE_VERSIONS_[NOM_PROJET].txt`         |
| Plan par menu             | `PLAN_MODIFICATIONS_PAR_MENU_[NOM_PROJET].txt` |
| Chrono développement      | `CHRONO_DEVELOPPEMENT_[NOM_PROJET].txt`        |
| Architecture applicative  | `ARCHITECTURE_[NOM_PROJET].txt`                |

Règle : inférer le nom depuis le dossier racine ou `instructions.md`.
Si ambiguïté → demander avant de créer.

---

## Source de la date et heure — RÈGLE ABSOLUE

```
DATE ET HEURE = date de dernière modification du fichier HTML livré
                (horodatage système du fichier source, pas l'heure courante)

Priorité de lecture :
  1. Métadonnée système du fichier .html livré    ← SOURCE PRINCIPALE
  2. Commentaire <!-- Version : Vxx — JJ/MM/AAAA HH:MM --> dans le HTML
  3. Horodatage système courant                   ← UNIQUEMENT si HTML absent

Cette date et heure est appliquée de manière IDENTIQUE dans les 4 fichiers :
  - DATE de l'entrée HISTORIQUE_VERSIONS
  - DATE de l'entrée PLAN_MODIFICATIONS_PAR_MENU
  - Heure de FIN de session dans CHRONO_DEVELOPPEMENT
  - Métadonnée "Dernière mise à jour" de ARCHITECTURE
```

---

## Ordre de tri — RÈGLE ABSOLUE

```
DANS LES 4 FICHIERS : tri par version DÉCROISSANT — V(N) toujours en premier.

  Correct  : V05 → V04 → V03 → V02 → V01   (du plus récent au plus ancien)
  INTERDIT : V01 → V02 → V03 → V04 → V05   (ordre croissant = ERREUR)

S'applique à :
  - Chaque entrée de version dans HISTORIQUE_VERSIONS
  - Chaque entrée par section dans PLAN_MODIFICATIONS_PAR_MENU
  - Chaque session dans CHRONO_DEVELOPPEMENT
  - Chaque ligne du CHANGELOG dans ARCHITECTURE
```

---

## Contrôle d'intégrité transversal — OBLIGATOIRE à chaque MAJ

Avant de confirmer la mise à jour, vérifier les 3 points suivants :

### Point 1 — Présence de toutes les versions dans les 4 fichiers

```
Extraire la liste des versions de chaque fichier :
  HISTORIQUE      → [V01, V02, V03, ...]
  PLAN            → [V01, V02, V03, ...]   (union de toutes les sections)
  CHRONO          → [V01, V02, V03, ...]   (depuis les entrées SESSION)
  ARCHITECTURE    → [V01, V02, V03, ...]   (depuis le CHANGELOG)

Règle : les 4 listes doivent contenir les mêmes versions.
Si une version manque dans un fichier → la créer avant de confirmer.
```

### Point 2 — Homogénéité des données entre les 4 fichiers

```
Pour chaque version V(N), vérifier que dans les 4 fichiers :
  ✔ Numéro de version identique          ex : V03 partout, pas V3 ou v03
  ✔ Date identique                       ex : 19/05/2026 partout
  ✔ Modules impactés cohérents           les mêmes modules cités dans les 4
  ✔ Aucune contradiction de contenu      un ajout dans HISTORIQUE ≠ suppression dans PLAN

Si incohérence détectée → signaler dans la confirmation avec [⚠] avant de clore.
```

### Point 3 — Tri décroissant respecté dans les 4 fichiers

```
Après chaque insertion, relire l'ordre des entrées dans les 4 fichiers.
Si une entrée est hors ordre → la replacer à sa position correcte.
Un fichier mal trié est considéré comme corrompu.
```

---

## Workflow — Décision initiale obligatoire

```
Les quatre fichiers existent-ils dans le projet ?
         |                    |
        OUI                  NON
         |                    |
  → Workflow B (MAJ)   → Workflow A (CRÉATION)
```

---

## Workflow A — Première version (fichiers inexistants)

- [ ] 1. Identifier le nom du projet (dossier racine ou `instructions.md`)
- [ ] 2. Identifier la version initiale : V01 par défaut
- [ ] 3. Lire la date/heure de dernière modification du fichier HTML livré
- [ ] 4. Classifier les changements : `AJOUTÉ` `MODIFIÉ` `CORRIGÉ` `SUPPRIMÉ`
- [ ] 5. Identifier les menus/modules couverts
- [ ] 6. Créer `HISTORIQUE_VERSIONS_[PROJET].txt` :
       - Écrire l'en-tête complet
       - Ajouter l'entrée V01 (date = horodatage HTML)
- [ ] 7. Créer `PLAN_MODIFICATIONS_PAR_MENU_[PROJET].txt` :
       - Écrire l'en-tête complet
       - Créer les sections de menu présentes
       - Ajouter l'entrée V01 dans chaque section concernée (date = horodatage HTML)
       - Ajouter la légende en bas
- [ ] 8. Créer `CHRONO_DEVELOPPEMENT_[PROJET].txt` :
       - Écrire l'en-tête avec totaux à zéro
       - Ajouter l'entrée de session V01 (Fin = horodatage HTML)
- [ ] 9. Créer `ARCHITECTURE_[PROJET].txt` :
       - Écrire l'en-tête + métadonnées (date = horodatage HTML)
       - Initialiser le CHANGELOG architecture (entrée V01)
       - Créer PARTIE 1 — Architecture globale (7 sections)
       - Créer PARTIE 2 — un bloc MODULE complet (7 sous-sections) par module détecté
- [ ] 10. Confirmer la création des quatre fichiers

---

## Workflow B — Mise à jour (fichiers existants)

- [ ] 1. **LIRE les quatre fichiers en intégralité** avant d'écrire quoi que ce soit
       - Dernière version dans HISTORIQUE_VERSIONS
       - Sections dans PLAN_MODIFICATIONS_PAR_MENU
       - Total heures accumulées dans CHRONO_DEVELOPPEMENT
       - État courant de l'architecture dans ARCHITECTURE
- [ ] 2. Lire la date/heure de dernière modification du fichier HTML livré
       → Cette date/heure sera utilisée de manière identique dans les 4 fichiers
- [ ] 3. Déterminer V(N) : incrémenter ou utiliser le numéro fourni
- [ ] 4. Classifier les changements : `AJOUTÉ` `MODIFIÉ` `CORRIGÉ` `SUPPRIMÉ`
- [ ] 5. Identifier les menus/modules impactés
- [ ] 6. Calculer la durée de la session courante :
       - Heure de fin (horodatage HTML) − Heure de début de cette session de travail
       - Ne jamais comptabiliser les pauses ou interruptions inter-sessions
       - Si reprise le lendemain = nouvelle session distincte
- [ ] 7. Mettre à jour HISTORIQUE_VERSIONS :
       - Insérer V(N) en tête — tri décroissant respecté
- [ ] 8. Mettre à jour PLAN_MODIFICATIONS_PAR_MENU :
       - Insérer V(N) en tête des sections impactées — tri décroissant respecté
- [ ] 9. Mettre à jour CHRONO_DEVELOPPEMENT :
       - Insérer la nouvelle session en haut du journal — tri décroissant respecté
       - Recalculer le total général en haut du fichier
- [ ] 10. Mettre à jour ARCHITECTURE — chirurgie uniquement :
       - Identifier quelle(s) section(s) sont impactées par le code livré :
           · Nouvelle fonctionnalité → PARTIE 2, module concerné, sous-sections impactées
           · Nouveau module          → créer un bloc MODULE complet en PARTIE 2
           · Changement de liaison   → section 3 du module + schéma global si nécessaire
           · Changement de flux      → section 4 ou 5 du module
           · Nouvelle anomalie       → section ANOMALIES de la PARTIE 1 (1.6)
           · Changement couleur/style→ section 6 du module
           · Planification future    → section 7 du module
       - Modifier uniquement les blocs identifiés, mot pour mot pour le reste
       - Insérer une ligne dans le CHANGELOG (antichronologie, tri décroissant)
       - Mettre à jour les métadonnées (version courante + date horodatage HTML)
- [ ] 11. **CONTRÔLE D'INTÉGRITÉ TRANSVERSAL** :
       - Vérifier que V(N) est présente dans les 4 fichiers
       - Vérifier que la date est identique dans les 4 fichiers
       - Vérifier que les modules cités sont cohérents dans les 4 fichiers
       - Vérifier que le tri décroissant est respecté dans les 4 fichiers
       - Si anomalie → corriger avant de confirmer, signaler avec [⚠]
- [ ] 12. Confirmer la mise à jour des quatre fichiers

---

## Règle d'or — Lecture avant écriture

```
INTERDIT  : Réécrire un fichier entier ou une section entière à chaque version.
OBLIGATOIRE : Lire → identifier la position → insérer/modifier uniquement le nouveau bloc.
```

Tout ce qui n'est pas explicitement modifié par la livraison de code **reste
identique, mot pour mot**. Ne jamais reformuler, restructurer ou "améliorer"
les sections non impactées.

---

## Exceptions autorisées — Corrections

| Situation                                    | Action autorisée                                |
|----------------------------------------------|-------------------------------------------------|
| Erreur factuelle (mauvaise date, mauvais N°) | Corriger uniquement la ligne fautive            |
| Oubli dans la dernière version déjà écrite   | Ajouter la ligne manquante dans le bon bloc     |
| Faute de frappe                              | Corriger la ligne concernée uniquement          |
| Demande explicite de l'utilisateur           | Appliquer la correction ciblée demandée         |
| Aller-retour utilisateur doc → code          | Resynchroniser uniquement la section affectée   |
| Version manquante détectée (contrôle intég.) | Créer l'entrée manquante à sa position correcte |
| Tri décroissant incorrect détecté            | Replacer l'entrée hors-ordre à sa bonne position|

Correction toujours chirurgicale — jamais de réécriture de section.

L'utilisateur peut modifier un `.txt` manuellement et demander une correction
de code en retour : l'IA lit la section modifiée et adapte le code en conséquence.
Ce flux aller-retour (doc → code) est supporté pour tous les fichiers.

---

## ════════════════════════════════════════════════════════════════════════
## FICHIER 1 — HISTORIQUE_VERSIONS_[PROJET].txt
## ════════════════════════════════════════════════════════════════════════

### En-tête du fichier

```
====================================================================================================================================
                              HISTORIQUE DÉTAILLÉ DES VERSIONS — [NOM PROJET EN MAJUSCULES]
====================================================================================================================================
```

### Template d'entrée — strict

```
************************************************************************************************************************************
VERSION : V[Numéro]
DATE : [JJ/MM/AAAA à HH:MM]        ← date/heure de dernière modif du fichier HTML
------------------------------------------------------------------------------------------------------------------------------------
AJOUTÉ :
- [Module/Composant] : Description détaillée.
MODIFIÉ :
- [Module/Composant] : Nature du changement et impact. (Ou "- (Aucune modification)")
CORRIGÉ :
- [Module/Composant] : Bug corrigé et solution. (Ou "- (Aucun correctif)")
SUPPRIMÉ :
- [Module/Composant] : Raison. (Ou "- (Aucune suppression)")
------------------------------------------------------------------------------------------------------------------------------------

```

### Règles critiques — HISTORIQUE

1. **Tri décroissant** : V(N) toujours au-dessus de V(N-1), juste sous l'en-tête.
2. **Préfixe module** : chaque ligne commence par le nom du module affecté.
3. **Insertion uniquement** : tout ce qui existait reste identique, mot pour mot.
4. **Pas de markdown** : `.txt` pur, ASCII uniquement.
5. **CORRIGÉ ≠ MODIFIÉ** : un correctif répare, une modification fait évoluer.
6. **Date = horodatage HTML** : jamais l'heure courante sauf absence de fichier HTML.

---

## ════════════════════════════════════════════════════════════════════════
## FICHIER 2 — PLAN_MODIFICATIONS_PAR_MENU_[PROJET].txt
## ════════════════════════════════════════════════════════════════════════

### En-tête du fichier

```
====================================================================================================================================
                    PLAN PAR MENU — MODIFICATIONS [NOM PROJET] (V01 → V[N_ACTUEL])
                              Du plus récent au moins récent par thème
====================================================================================================================================
```

### Structure par section de menu

```
════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
[EMOJI] [NUMÉRO]. [NOM DU MENU EN MAJUSCULES]
════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
```

### Template d'entrée par section

```
V[Numéro] — [JJ/MM/AAAA à HH:MM]       ← date/heure de dernière modif du fichier HTML
  [+] [Module/Composant] : Description de l'ajout.
  [~] [Module/Composant] : Description de la modification.
  [✓] [Module/Composant] : Description du correctif.
  [-] [Module/Composant] : Description de la suppression.
```

### Légende (toujours en bas du fichier)

```
====================================================================================================================================
LÉGENDE :
  [+] = Ajouté    [~] = Modifié    [✓] = Corrigé    [-] = Supprimé
====================================================================================================================================
```

### Règles critiques — PLAN

1. **Tri décroissant** par section — version la plus récente en premier.
2. Sélectivité — entrée V(N) uniquement dans les sections impactées.
3. Insertion uniquement — entrées existantes restent intactes.
4. Sections non impactées = non touchées.
5. En-tête à jour — mettre à jour `(V01 → V[N_ACTUEL])` à chaque version.
6. Nouvelle section — créer si nouveau menu, juste avant la légende.
7. Pas de markdown — `.txt` pur, ASCII uniquement.
8. **Date = horodatage HTML** : identique à la date de HISTORIQUE_VERSIONS.

---

## ════════════════════════════════════════════════════════════════════════
## FICHIER 3 — CHRONO_DEVELOPPEMENT_[PROJET].txt
## ════════════════════════════════════════════════════════════════════════

### Objectif

Suivre le temps réel de développement par version et au total.
**Ne jamais comptabiliser** les interruptions entre sessions (pauses, fin de journée,
reprise le lendemain). Seul le temps actif de travail dans une session est compté.

### En-tête du fichier (récapitulatif global — toujours en haut)

```
====================================================================================================================================
                              CHRONO DÉVELOPPEMENT — [NOM PROJET EN MAJUSCULES]
====================================================================================================================================
TEMPS TOTAL DÉVELOPPEMENT  : [H]h [M]min
NOMBRE DE VERSIONS         : [N]
NOMBRE DE SESSIONS         : [N]
PREMIÈRE SESSION           : [JJ/MM/AAAA]
DERNIÈRE SESSION           : [JJ/MM/AAAA]      ← date horodatage HTML de la dernière livraison
====================================================================================================================================
```

### Template d'entrée de session

Chaque session de travail (même partielle sur une version) génère une entrée :

```
-----------------------------------------------------------------------------------------------------------------------------------
SESSION [N°SESSION] — VERSION V[N]
-----------------------------------------------------------------------------------------------------------------------------------
Début       : [JJ/MM/AAAA à HH:MM]
Fin         : [JJ/MM/AAAA à HH:MM]      ← horodatage HTML du fichier livré
Durée       : [H]h [M]min
-----------------------------------------------------------------------------------------------------------------------------------
Travaux effectués :
  [+] [description courte de ce qui a été ajouté]
  [~] [description courte de ce qui a été modifié]
  [✓] [description courte de ce qui a été corrigé]
  [-] [description courte de ce qui a été supprimé]
-----------------------------------------------------------------------------------------------------------------------------------

```

### Règle de calcul du temps

```
Durée session = Heure_Fin (horodatage HTML) − Heure_Début (début de la session)

INTERDIT de comptabiliser :
  - Le temps entre deux sessions distinctes (même pour la même version)
  - Les pauses > 30 minutes dans une session
  - Le temps de relecture passive sans modification de code

Total projet = Somme de toutes les durées de sessions individuelles
```

### Règle de mise à jour de l'en-tête

À chaque nouvelle session :
1. Insérer la nouvelle entrée **juste après l'en-tête** (tri décroissant)
2. Recalculer et mettre à jour le bloc d'en-tête :
   - `TEMPS TOTAL` = somme de toutes les durées
   - `NOMBRE DE VERSIONS` = dernière version V(N)
   - `NOMBRE DE SESSIONS` = incrémenter de 1
   - `DERNIÈRE SESSION` = date horodatage HTML de la livraison courante

### Règles critiques — CHRONO

1. **Tri décroissant** — SESSION la plus récente en premier, juste après l'en-tête.
2. **Une entrée par session continue** — si reprise le lendemain = nouvelle entrée.
3. **Durée arrondie à la minute** — pas de secondes.
4. **Pas de markdown** — `.txt` pur, ASCII uniquement.
5. **En-tête recalculé** à chaque nouvelle session (seule exception à la règle d'insertion).
6. **Fin de session = horodatage HTML** — jamais l'heure courante sauf absence de HTML.

### Exemple — fichier après 3 sessions

```
====================================================================================================================================
                              CHRONO DÉVELOPPEMENT — ERP COMPTAEXPERT
====================================================================================================================================
TEMPS TOTAL DÉVELOPPEMENT  : 4h 35min
NOMBRE DE VERSIONS         : 3
NOMBRE DE SESSIONS         : 3
PREMIÈRE SESSION           : 15/05/2026
DERNIÈRE SESSION           : 19/05/2026
====================================================================================================================================

-----------------------------------------------------------------------------------------------------------------------------------
SESSION 3 — VERSION V03
-----------------------------------------------------------------------------------------------------------------------------------
Début       : 19/05/2026 à 09:00
Fin         : 19/05/2026 à 10:50      ← horodatage du fichier HTML V03
Durée       : 1h 50min
-----------------------------------------------------------------------------------------------------------------------------------
Travaux effectués :
  [+] Module Saisie : filtre par journal dans la grille
  [✓] Module Saisie : débordement colonne Libellé sur mobile
  [~] Clé localStorage : migration v02 → v03
-----------------------------------------------------------------------------------------------------------------------------------

-----------------------------------------------------------------------------------------------------------------------------------
SESSION 2 — VERSION V02
-----------------------------------------------------------------------------------------------------------------------------------
Début       : 16/05/2026 à 14:00
Fin         : 16/05/2026 à 15:45      ← horodatage du fichier HTML V02
Durée       : 1h 45min
-----------------------------------------------------------------------------------------------------------------------------------
Travaux effectués :
  [+] Dashboard : widget récapitulatif des échéances du mois
  [~] Navigation : ajout onglet Révision
-----------------------------------------------------------------------------------------------------------------------------------

-----------------------------------------------------------------------------------------------------------------------------------
SESSION 1 — VERSION V01
-----------------------------------------------------------------------------------------------------------------------------------
Début       : 15/05/2026 à 10:00
Fin         : 15/05/2026 à 11:00      ← horodatage du fichier HTML V01
Durée       : 1h 00min
-----------------------------------------------------------------------------------------------------------------------------------
Travaux effectués :
  [+] Structure HTML de base, navigation, thème clair/sombre
  [+] Module Dashboard : squelette initial
-----------------------------------------------------------------------------------------------------------------------------------
```

---

## ════════════════════════════════════════════════════════════════════════
## FICHIER 4 — ARCHITECTURE_[PROJET].txt
## ════════════════════════════════════════════════════════════════════════

### Objectif

Documenter l'architecture vivante de l'application : vue globale, flux,
liaisons, et détail par module. Mis à jour chirurgicalement à chaque livraison.
Supporte le flux aller-retour : l'utilisateur modifie le `.txt` et demande
à l'IA de corriger le code en conséquence.

### En-tête + métadonnées du fichier

```
====================================================================================================================================
                              ARCHITECTURE APPLICATIVE — [NOM PROJET EN MAJUSCULES]
====================================================================================================================================
Version courante    : V[N]
Dernière mise à jour: [JJ/MM/AAAA à HH:MM]      ← horodatage HTML du fichier livré
Nombre de modules   : [N]
====================================================================================================================================
```

### CHANGELOG Architecture (juste après l'en-tête — tri décroissant)

```
====================================================================================================================================
CHANGELOG ARCHITECTURE
====================================================================================================================================
V[N]   — [JJ/MM/AAAA à HH:MM] : [Module(s)] — [courte description de ce qui a changé]
V[N-1] — [JJ/MM/AAAA à HH:MM] : [Module(s)] — [courte description]
...
====================================================================================================================================
```

Règles CHANGELOG :
- **Tri décroissant strict** : V(N) toujours au-dessus de V(N-1)
- Une ligne par version — plusieurs modules séparés par " | "
- Maximum 120 caractères par ligne
- Insertion uniquement — les lignes existantes ne sont jamais modifiées
- **Date = horodatage HTML** : identique aux 3 autres fichiers

---

### PARTIE 1 — ARCHITECTURE GLOBALE

Structure fixe, 7 sections numérotées. Mise à jour uniquement si le code
livré impacte la structure globale (nouveau module, nouvelle liaison, etc.).

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
Nom fonction        | Modules appelants              | Rôle
--------------------|--------------------------------|------------------------------
saveToStorage()     | Tous                           | Persistance localStorage
addAuditLog()       | Tous                           | Traçabilité des actions
showToast()         | Tous                           | Notifications UI
showPage()          | Navigation                     | Routeur principal
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
[Grand diagramme ASCII : UI, state, localStorage, modules, dépendances externes (CDN, API)]
```

---

### PARTIE 2 — MODULES

Chaque module suit **exactement** ce template à 7 sous-sections.
Les modules sont classés dans l'ordre alphabétique ou logique défini à la V01.
Un nouveau module est inséré à sa position alphabétique/logique sans déplacer les autres.
Module supprimé → marquer `[SUPPRIMÉ en V[N]]` dans l'en-tête du bloc — ne jamais effacer.

```
====================================================================================================================================
MODULE : [NOM DU MODULE EN MAJUSCULES]
Depuis : V[N_creation]       Dernière MAJ : V[N] — [JJ/MM/AAAA à HH:MM]
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
                    ▼                                ▼
┌────────────────────────────┐    ┌────────────────────────────┐
│       LECTURE (read)       │    │      ECRITURE (write)      │
├────────────────────────────┤    ├────────────────────────────┤
│ fonction1()                │    │ fonction2()                │
│ fonction3()                │    │ fonction4()                │
└────────────────────────────┘    └────────────────────────────┘

DEPENDANCES EXTERNES DU MODULE [NOM]
═══════════════════════════════════════
┌──────────────┐    [donnée consommée]      ┌──────────────────┐
│  MODULE X    │ ──────────────────────►    │  MODULE [NOM]    │
└──────────────┘                            └──────────────────┘

┌──────────────────┐                        ┌──────────────────┐
│  MODULE [NOM]    │ ─── fonction() ──────► │  AUDIT LOG       │
└──────────────────┘                        └──────────────────┘

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

### Règles critiques — ARCHITECTURE

1.  **Lecture avant écriture** : lire le fichier entier avant toute modification.
2.  **Chirurgie uniquement** : modifier seulement les blocs impactés par le code livré.
3.  **Intégrité absolue** : tout ce qui n'est pas impacté reste identique, mot pour mot.
4.  **Tri décroissant CHANGELOG** : V(N) toujours au-dessus de V(N-1).
5.  **Métadonnées à jour** : version courante + horodatage HTML à chaque livraison.
6.  **Nouveau module** : créer le bloc complet (7 sous-sections), insérer à sa position logique.
7.  **Module supprimé** : marquer `[SUPPRIMÉ en V[N]]` — ne jamais effacer le bloc.
8.  **Pas de markdown** : `.txt` pur, ASCII uniquement (box-drawing autorisé : ─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼ ═ ║ ▼ ►).
9.  **Anomalies** : toute régression ou incohérence détectée → section 1.6, préfixée `[⚠]`.
10. **Section 7 vivante** : quand une intégration prévue est réalisée → cocher `[✓]`
    et documenter l'implémentation dans les sections 1 à 5 du module.

---

## Confirmations

**Workflow A (création) :**
```
✅ Quatre fichiers créés — V[N] (version initiale)
   • HISTORIQUE_VERSIONS_[PROJET].txt         → créé : en-tête + entrée V[N]
   • PLAN_MODIFICATIONS_PAR_MENU_[PROJET].txt → créé : [N] section(s) : [liste]
   • CHRONO_DEVELOPPEMENT_[PROJET].txt        → créé : session 1, durée [H]h [M]min
   • ARCHITECTURE_[PROJET].txt               → créé : [N] module(s) : [liste]
   ─────────────────────────────────────────────────────────────────────────────
   Date/heure source : horodatage HTML [NOM_FICHIER.html] — [JJ/MM/AAAA à HH:MM]
   Contrôle intégrité : ✔ versions homogènes ✔ tri décroissant ✔ dates identiques
```

**Workflow B (mise à jour) :**
```
✅ Quatre fichiers mis à jour — V[N]
   • HISTORIQUE_VERSIONS_[PROJET].txt         → entrée V[N] insérée en tête
   • PLAN_MODIFICATIONS_PAR_MENU_[PROJET].txt → [N] section(s) mise(s) à jour : [liste]
   • CHRONO_DEVELOPPEMENT_[PROJET].txt        → session [N°], durée [H]h [M]min
                                                 Total projet : [H]h [M]min
   • ARCHITECTURE_[PROJET].txt               → [N] section(s) mise(s) à jour : [liste]
   ─────────────────────────────────────────────────────────────────────────────
   Date/heure source : horodatage HTML [NOM_FICHIER.html] — [JJ/MM/AAAA à HH:MM]
   Contrôle intégrité : ✔ versions homogènes ✔ tri décroissant ✔ dates identiques
```

**Si anomalie détectée lors du contrôle :**
```
   [⚠] ANOMALIE DÉTECTÉE ET CORRIGÉE :
       - [description de l'anomalie : version manquante / tri incorrect / date incohérente]
       - [action corrective appliquée]
```
