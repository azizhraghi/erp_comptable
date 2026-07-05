---
name: agent-ide-antigravity
description: >
  Protocole opérationnel complet pour l'agent de développement Antigravity/Antigraviton.
  Gère SIX fichiers de suivi simultanément après chaque code livré :
  HISTORIQUE_VERSIONS (journal chronologique des versions),
  PLAN_MODIFICATIONS_PAR_MENU (vue par menu/module),
  CHRONO_DEVELOPPEMENT (suivi du temps de développement),
  ARCHITECTURE (documentation vivante par module),
  JOURNAL_CONVERSATIONS (traçabilité exhaustive des échanges et décisions),
  DESCRIPTIF_FONCTIONNEL (description exhaustive sans code — recréation totale du programme).

  DÉCLENCHER CE SKILL systématiquement dès qu'un projet utilise Antigravity ou
  Antigraviton comme IDE, ou dès qu'un fichier CONSIGNES_AGENT_ANTIGRAVITY.md
  est présent à la racine du projet. S'applique à tout projet de développement
  nécessitant une traçabilité complète : code livré, décisions architecturales,
  échanges validés, gestion des versions, et documentation fonctionnelle accessible.

  Règles absolues :
  - Tri VERSION DÉCROISSANT dans les 6 fichiers (V(N) toujours en premier).
  - Date et heure = horodatage système du fichier source livré (HTML, Python, etc.).
  - Jamais écraser l'historique existant — mode APPEND obligatoire.
  - Contrôle d'intégrité transversal avant toute confirmation (6 fichiers).
  - Aucun code généré sans validation explicite (plan → feu vert → exécution).
  - Nommer dynamiquement les fichiers selon le nom du projet racine.
  - ZÉRO terme technique de code dans le contenu du DESCRIPTIF_FONCTIONNEL.
---

# Agent IDE Antigravity — Protocole Opérationnel Complet

## 🎯 Objectif de ce skill

Assurer la **qualité du code**, la **sécurité des modifications**, la
**traçabilité exhaustive** et la **documentation fonctionnelle accessible**
de tout projet développé sous Antigravity/Antigraviton, via six fichiers de
suivi maintenus en permanence, cohérents et jamais écrasés.

---

## 📁 Six fichiers de suivi — Vue d'ensemble

| #  | Fichier                                      | Rôle                                                   |
|----|----------------------------------------------|--------------------------------------------------------|
| 1  | `HISTORIQUE_VERSIONS_[PROJET].txt`           | Journal chronologique des versions (ce qui a changé)  |
| 2  | `PLAN_MODIFICATIONS_PAR_MENU_[PROJET].txt`   | Vue par menu/module (qui a changé quoi)               |
| 3  | `CHRONO_DEVELOPPEMENT_[PROJET].txt`          | Temps réel de développement par session               |
| 4  | `ARCHITECTURE_[PROJET].txt`                  | Documentation vivante de l'architecture applicative   |
| 5  | `JOURNAL_CONVERSATIONS_[PROJET].txt`         | Traçabilité des échanges, décisions et validations    |
| 6  | `DESCRIPTIF_FONCTIONNEL_[PROJET].txt`        | Description exhaustive sans code — recréation totale  |

**Conventions de nommage :** inférer `[PROJET]` depuis le dossier racine ou
`instructions.md`. Si ambiguïté → demander avant de créer.

---

## ════════════════════════════════════════════════════════════════════════
## PARTIE A — PROTOCOLE OPÉRATIONNEL DE L'AGENT
## ════════════════════════════════════════════════════════════════════════

### A.1 🧠 Phase d'Initialisation — AU DÉBUT DE CHAQUE SESSION

Avant toute action ou réponse technique, exécuter **dans cet ordre** :

```
ÉTAPE 1 — Localiser le Journal
  → Identifier JOURNAL_CONVERSATIONS_[NOM_PROJET].txt à la racine.

ÉTAPE 2 — Lire l'historique
  → Lire l'intégralité du fichier, du plus récent au plus ancien.
  → Identifier : évolution logique du projet, erreurs passées,
    solutions rejetées, décisions architecturales critiques.

ÉTAPE 3 — Lire les cinq autres fichiers de suivi
  → HISTORIQUE_VERSIONS   : identifier la dernière version V(N)
  → PLAN_PAR_MENU         : identifier les sections et modules existants
  → CHRONO_DEVELOPPEMENT  : lire le total heures accumulées
  → ARCHITECTURE          : lire l'état courant de l'architecture
  → DESCRIPTIF_FONCTIONNEL: lire l'état courant du descriptif et les [À COMPLÉTER]

ÉTAPE 4 — Synthèse de contexte
  → Formuler mentalement : "Le projet en est à V(N), le dernier travail
    portait sur [modules], les points d'attention sont [anomalies 1.6]."
  → Objectif : ne jamais répéter une erreur connue,
    assurer la cohérence avec les choix précédents.
```

⚠️ **Si les fichiers n'existent pas** : Considérer comme initialisation
"Zero-Day". Déclencher le **Workflow A (CRÉATION)** ci-dessous. Être
extra-vigilant sur les clarifications avant tout code.

---

### A.2 💬 Phase de Communication & Clarification

**Règle absolue : ne jamais supposer.**

- **Détection d'ambiguïté** : si une demande contient des zones d'ombre,
  des termes vagues ou plusieurs interprétations possibles → poser des
  questions précises **avant** de proposer du code. Maximum 3 questions
  à la fois, formulées avec des options concrètes :

```
❓ Je ne suis pas sûr de comprendre. Tu veux :
   A) [Option A]
   B) [Option B]
   C) Autre chose ? (précise)
```

- **Nouvelles informations** : à chaque nouvelle contrainte ou information :
  1. Vérifier sa cohérence avec le code existant et l'historique.
  2. Si un doute subsiste → stopper et demander confirmation.
  3. Attendre la réponse avant d'orienter la solution.

---

### A.3 🛡️ Phase de Validation Préalable — BEFORE-CODE

**Interdiction formelle de générer ou modifier du code sans validation explicite.**

Pour chaque tâche demandée, suivre ce cycle sans exception :

```
CYCLE BEFORE-CODE
─────────────────────────────────────────────────────────────
ÉTAPE 1 — EXPOSÉ DU PLAN
  Décrire clairement :
  · Fichiers qui seront touchés
  · Logique qui sera implémentée
  · Impacts potentiels sur le code existant
  · Risques identifiés

ÉTAPE 2 — DEMANDE DE VALIDATION
  Terminer le message par :
  "Est-ce que ce plan te convient ?
   Souhaites-tu des ajustements avant que je n'écrive le code ?"

ÉTAPE 3 — ATTENTE
  Attendre un feu vert explicite : "Go", "Valide", "Oui", "OK",
  ou une correction de l'utilisateur.

ÉTAPE 4 — EXÉCUTION
  Seulement après validation → générer / modifier les fichiers.
─────────────────────────────────────────────────────────────
```

**Amélioration demandée sur projet existant — format obligatoire :**

```
## ✨ Modification proposée : [Titre]

Version cible   : V[N+1]
Quoi            : [Ce qui va changer]
Pourquoi        : [Raison / problème résolu]
Fichiers touchés: [Liste]
Risques         : [Ce qui pourrait casser]
Rollback        : [Comment revenir en arrière]

✅ Je valide ce plan avant de coder quoi que ce soit.
```

---

### A.3bis 📜 Règle d'Or : Orthographe et Typographie Française (CRITIQUE)

Tout texte rédigé et inséré par l'agent dans le contenu des 5 fichiers `.txt` **DOIT** respecter strictement l'orthographe et la grammaire françaises.

1. **Accents et signes diacritiques OBLIGATOIRES** : 
   - Utiliser systématiquement les accents (é, è, ê, à, ù, ô, î, ï, etc.) et la cédille (ç).
   - ✅ EXEMPLES CORRECTS : "création", "développement", "récent", "schéma", "modèle", "données", "détaillé", "intégration", "prévue", "échéance".
   - ❌ INTERDICTION FORMELLE d'écrire : "creation", "developpement", "recent", "schema", "modele", "donnees", "detaille", "integration", "prevue".

2. **Grammaire et conjugaison** : 
   - Accorder systématiquement les adjectifs, les participes passés et les noms. 
   - Relire mentalement chaque phrase générée pour détecter les fautes avant de l'écrire dans le fichier.

3. **Encodage des fichiers** : 
   - S'assurer que les 5 fichiers `.txt` sont créés et mis à jour avec l'encodage **UTF-8** pour garantir l'affichage correct des caractères accentués (pas d'encodage ASCII brut ou ANSI).

4. **Vérification des templates** : 
   - Lorsque l'agent remplit les templates (ex: `[Description de l'ajout]`), il doit remplacer ce texte par des phrases complètes et correctement orthographiées, jamais par des mots tronqués ou sans accents.
```

---

### A.4 📝 Phase de Journalisation — FIN DE TÂCHE

Une fois la tâche validée et le code appliqué, **mettre à jour les cinq
fichiers simultanément** (voir Partie B — Workflows).

**Confirmation finale obligatoire** à chaque fin de tâche :

```
✅ Les cinq fichiers de suivi ont été mis à jour — V[N]
   · HISTORIQUE_VERSIONS         → entrée V[N] insérée en tête
   · PLAN_MODIFICATIONS_PAR_MENU → [N] section(s) mise(s) à jour : [liste]
   · CHRONO_DEVELOPPEMENT        → session [N°], durée [H]h [M]min
                                    Total projet : [H]h [M]min
   · ARCHITECTURE                → [N] section(s) mise(s) à jour : [liste]
   · JOURNAL_CONVERSATIONS       → session [N°] ajoutée en tête
   ──────────────────────────────────────────────────────────────────────
   Date/heure source : horodatage [NOM_FICHIER] — [JJ/MM/AAAA à HH:MM]
   Contrôle intégrité : ✔ versions homogènes ✔ tri décroissant ✔ dates identiques
```

---

## ════════════════════════════════════════════════════════════════════════
## PARTIE B — GESTION DES CINQ FICHIERS
## ════════════════════════════════════════════════════════════════════════

### B.0 Source de la date et heure — RÈGLE ABSOLUE

```
DATE ET HEURE = date de dernière modification du fichier livré
                (horodatage système du fichier source, pas l'heure courante)

Priorité de lecture :
  1. Métadonnée système du fichier livré (.html, .py, etc.)  ← SOURCE PRINCIPALE
  2. Commentaire <!-- Version : Vxx — JJ/MM/AAAA HH:MM --> dans le fichier
  3. Horodatage système courant                              ← UNIQUEMENT si fichier absent

Cette date/heure est appliquée de manière IDENTIQUE dans les 5 fichiers.
```

---

### B.0bis Ordre de tri — RÈGLE ABSOLUE

```
DANS LES 5 FICHIERS : tri par version DÉCROISSANT — V(N) toujours en premier.

  Correct  : V05 → V04 → V03 → V02 → V01   (du plus récent au plus ancien)
  INTERDIT : V01 → V02 → V03 → V04 → V05   (ordre croissant = ERREUR)

S'applique à :
  - Chaque entrée de version dans HISTORIQUE_VERSIONS
  - Chaque entrée par section dans PLAN_MODIFICATIONS_PAR_MENU
  - Chaque session dans CHRONO_DEVELOPPEMENT
  - Chaque ligne du CHANGELOG dans ARCHITECTURE
  - Chaque session dans JOURNAL_CONVERSATIONS
```

---

### B.0ter Contrôle d'intégrité transversal — OBLIGATOIRE à chaque MAJ

Avant de confirmer toute mise à jour, vérifier les 3 points :

**Point 1 — Présence de toutes les versions dans les 6 fichiers**
```
Extraire la liste des versions de chaque fichier :
  HISTORIQUE      → [V01, V02, V03, ...]
  PLAN            → [V01, V02, V03, ...]   (union de toutes les sections)
  CHRONO          → [V01, V02, V03, ...]   (depuis les entrées SESSION)
  ARCHITECTURE    → [V01, V02, V03, ...]   (depuis le CHANGELOG)
  JOURNAL         → [V01, V02, V03, ...]   (depuis les entrées SESSION)
  DESCRIPTIF      → [V01, V02, V03, ...]   (depuis les blocs VERSION)

Règle : les 6 listes doivent contenir les mêmes versions.
Si une version manque dans un fichier → la créer avant de confirmer.
```

**Point 2 — Homogénéité des données entre les 6 fichiers**
```
Pour chaque version V(N), vérifier que dans les 6 fichiers :
  ✔ Numéro de version identique          ex : V03 partout, pas V3 ou v03
  ✔ Date identique                       ex : 19/05/2026 partout
  ✔ Modules impactés cohérents           les mêmes modules cités dans les 6
  ✔ Aucune contradiction de contenu

Si incohérence → signaler avec [⚠] avant de clore.
```

**Point 3 — Tri décroissant respecté dans les 6 fichiers**
```
Après chaque insertion, relire l'ordre des entrées dans les 6 fichiers.
Si une entrée est hors ordre → la replacer à sa position correcte.
Un fichier mal trié est considéré comme corrompu.
```

---

### B.1 Workflow — Décision initiale obligatoire

```
Les six fichiers existent-ils dans le projet ?
         |                    |
        OUI                  NON
         |                    |
  → Workflow B (MAJ)   → Workflow A (CRÉATION)
```

---

### B.2 Workflow A — Première version (fichiers inexistants)

- [ ] 1. Identifier le nom du projet (dossier racine ou `instructions.md`)
- [ ] 2. Identifier la version initiale : V01 par défaut
- [ ] 3. Lire la date/heure de dernière modification du fichier livré
- [ ] 4. Classifier les changements : `AJOUTÉ` `MODIFIÉ` `CORRIGÉ` `SUPPRIMÉ`
- [ ] 5. Identifier les menus/modules couverts
- [ ] 6. Créer `HISTORIQUE_VERSIONS_[PROJET].txt`
- [ ] 7. Créer `PLAN_MODIFICATIONS_PAR_MENU_[PROJET].txt`
- [ ] 8. Créer `CHRONO_DEVELOPPEMENT_[PROJET].txt`
- [ ] 9. Créer `ARCHITECTURE_[PROJET].txt`
- [ ] 10. Créer `JOURNAL_CONVERSATIONS_[PROJET].txt`
- [ ] 11. Créer `DESCRIPTIF_FONCTIONNEL_[PROJET].txt` (voir Partie F)
- [ ] 12. Contrôle d'intégrité transversal (B.0ter — 6 fichiers)
- [ ] 13. Confirmer la création des six fichiers

---

### B.3 Workflow B — Mise à jour (fichiers existants)

- [ ] 1. **LIRE les six fichiers en intégralité** avant d'écrire quoi que ce soit
- [ ] 2. Lire la date/heure de dernière modification du fichier livré
- [ ] 3. Déterminer V(N) : incrémenter ou utiliser le numéro fourni
- [ ] 4. Classifier les changements : `AJOUTÉ` `MODIFIÉ` `CORRIGÉ` `SUPPRIMÉ`
- [ ] 5. Identifier les menus/modules impactés
- [ ] 6. Calculer la durée de la session courante
- [ ] 7. Mettre à jour HISTORIQUE_VERSIONS — V(N) en tête
- [ ] 8. Mettre à jour PLAN_MODIFICATIONS_PAR_MENU — sections impactées uniquement
- [ ] 9. Mettre à jour CHRONO_DEVELOPPEMENT — nouvelle session en tête + recalcul total
- [ ] 10. Mettre à jour ARCHITECTURE — chirurgie uniquement sur les sections impactées
- [ ] 11. Mettre à jour JOURNAL_CONVERSATIONS — nouvelle session en tête (append)
- [ ] 12. Mettre à jour DESCRIPTIF_FONCTIONNEL — bloc V(N) en tête + journal des delta (voir Partie F)
- [ ] 13. **Contrôle d'intégrité transversal (B.0ter — 6 fichiers)**
- [ ] 14. Confirmer la mise à jour des six fichiers

---

### B.4 Règle d'or — Lecture avant écriture

```
INTERDIT   : Réécrire un fichier entier ou une section entière à chaque version.
OBLIGATOIRE: Lire → identifier la position → insérer/modifier uniquement le nouveau bloc.
```

Tout ce qui n'est pas explicitement modifié par la livraison de code **reste
identique, mot pour mot**. Ne jamais reformuler, restructurer ou "améliorer"
les sections non impactées.

**Pour le JOURNAL uniquement** : mode `append` strict — ajouter en tête
(tri décroissant), ne jamais écraser ni modifier les entrées existantes.

---

### B.5 Exceptions autorisées — Corrections

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

---

## ════════════════════════════════════════════════════════════════════════
## PARTIE C — TEMPLATES DES CINQ FICHIERS
## ════════════════════════════════════════════════════════════════════════

### C.1 FICHIER 1 — HISTORIQUE_VERSIONS_[PROJET].txt

**En-tête du fichier**

```
====================================================================================================================================
                              HISTORIQUE DÉTAILLÉ DES VERSIONS — [NOM PROJET EN MAJUSCULES]
====================================================================================================================================
```

**Template d'entrée — strict**

```
************************************************************************************************************************************
VERSION : V[Numéro]
DATE : [JJ/MM/AAAA à HH:MM]        ← date/heure de dernière modif du fichier livré
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

**Règles critiques**

1. Tri décroissant : V(N) toujours au-dessus de V(N-1), juste sous l'en-tête.
2. Préfixe module : chaque ligne commence par le nom du module affecté.
3. Insertion uniquement : tout ce qui existait reste identique, mot pour mot.
4. Pas de markdown : `.txt` pur, ASCII uniquement.
5. CORRIGÉ ≠ MODIFIÉ : un correctif répare, une modification fait évoluer.
6. Date = horodatage fichier livré : jamais l'heure courante sauf absence de fichier.

---

### C.2 FICHIER 2 — PLAN_MODIFICATIONS_PAR_MENU_[PROJET].txt

**En-tête du fichier**

```
====================================================================================================================================
                    PLAN PAR MENU — MODIFICATIONS [NOM PROJET] (V01 → V[N_ACTUEL])
                              Du plus récent au moins récent par thème
====================================================================================================================================
```

**Structure par section de menu**

```
════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
[EMOJI] [NUMÉRO]. [NOM DU MENU EN MAJUSCULES]
════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
```

**Template d'entrée par section**

```
V[Numéro] — [JJ/MM/AAAA à HH:MM]       ← date/heure de dernière modif du fichier livré
  [+] [Module/Composant] : Description de l'ajout.
  [~] [Module/Composant] : Description de la modification.
  [✓] [Module/Composant] : Description du correctif.
  [-] [Module/Composant] : Description de la suppression.
```

**Légende (toujours en bas du fichier)**

```
====================================================================================================================================
LÉGENDE :
  [+] = Ajouté    [~] = Modifié    [✓] = Corrigé    [-] = Supprimé
====================================================================================================================================
```

**Règles critiques**

1. Tri décroissant par section — version la plus récente en premier.
2. Sélectivité — entrée V(N) uniquement dans les sections impactées.
3. Insertion uniquement — entrées existantes restent intactes.
4. Sections non impactées = non touchées.
5. En-tête à jour — mettre à jour `(V01 → V[N_ACTUEL])` à chaque version.
6. Nouvelle section — créer si nouveau menu, juste avant la légende.
7. Pas de markdown — `.txt` pur, ASCII uniquement.
8. Date = horodatage fichier livré : identique à HISTORIQUE_VERSIONS.

---

### C.3 FICHIER 3 — CHRONO_DEVELOPPEMENT_[PROJET].txt

**En-tête du fichier (récapitulatif global — toujours en haut)**

```
====================================================================================================================================
                              CHRONO DÉVELOPPEMENT — [NOM PROJET EN MAJUSCULES]
====================================================================================================================================
TEMPS TOTAL DÉVELOPPEMENT  : [H]h [M]min
NOMBRE DE VERSIONS         : [N]
NOMBRE DE SESSIONS         : [N]
PREMIÈRE SESSION           : [JJ/MM/AAAA]
DERNIÈRE SESSION           : [JJ/MM/AAAA]      ← date horodatage du dernier fichier livré
====================================================================================================================================
```

**Template d'entrée de session**

```
-----------------------------------------------------------------------------------------------------------------------------------
SESSION [N°SESSION] — VERSION V[N]
-----------------------------------------------------------------------------------------------------------------------------------
Début       : [JJ/MM/AAAA à HH:MM]
Fin         : [JJ/MM/AAAA à HH:MM]      ← horodatage du fichier livré
Durée       : [H]h [M]min
-----------------------------------------------------------------------------------------------------------------------------------
Travaux effectués :
  [+] [description courte de ce qui a été ajouté]
  [~] [description courte de ce qui a été modifié]
  [✓] [description courte de ce qui a été corrigé]
  [-] [description courte de ce qui a été supprimé]
-----------------------------------------------------------------------------------------------------------------------------------

```

**Règle de calcul du temps**

```
Durée session = Heure_Fin (horodatage fichier) − Heure_Début (début de la session)

INTERDIT de comptabiliser :
  - Le temps entre deux sessions distinctes (même pour la même version)
  - Les pauses > 30 minutes dans une session
  - Le temps de relecture passive sans modification de code

Total projet = Somme de toutes les durées de sessions individuelles
```

**Règles critiques**

1. Tri décroissant — SESSION la plus récente en premier, juste après l'en-tête.
2. Une entrée par session continue — si reprise le lendemain = nouvelle entrée.
3. Durée arrondie à la minute — pas de secondes.
4. Pas de markdown — `.txt` pur, ASCII uniquement.
5. En-tête recalculé à chaque nouvelle session (seule exception à la règle d'insertion).
6. Fin de session = horodatage fichier livré — jamais l'heure courante sauf absence de fichier.

---

### C.4 FICHIER 4 — ARCHITECTURE_[PROJET].txt

**En-tête + métadonnées du fichier**

```
====================================================================================================================================
                              ARCHITECTURE APPLICATIVE — [NOM PROJET EN MAJUSCULES]
====================================================================================================================================
Version courante    : V[N]
Dernière mise à jour: [JJ/MM/AAAA à HH:MM]      ← horodatage du fichier livré
Nombre de modules   : [N]
====================================================================================================================================
```

**CHANGELOG Architecture (juste après l'en-tête — tri décroissant)**

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
- Tri décroissant strict : V(N) toujours au-dessus de V(N-1).
- Une ligne par version — plusieurs modules séparés par " | ".
- Maximum 120 caractères par ligne.
- Insertion uniquement — les lignes existantes ne sont jamais modifiées.
- Date = horodatage fichier livré : identique aux 4 autres fichiers.

**Mise à jour ARCHITECTURE — chirurgie uniquement**

Identifier quelle(s) section(s) sont impactées par le code livré :
- Nouvelle fonctionnalité → PARTIE 2, module concerné, sous-sections impactées
- Nouveau module → créer un bloc MODULE complet en PARTIE 2
- Changement de liaison → section 3 du module + schéma global si nécessaire
- Changement de flux → section 4 ou 5 du module
- Nouvelle anomalie → section ANOMALIES de la PARTIE 1 (1.6)
- Changement couleur/style → section 6 du module
- Planification future → section 7 du module

**Règles critiques ARCHITECTURE**

1. Lecture avant écriture : lire le fichier entier avant toute modification.
2. Chirurgie uniquement : modifier seulement les blocs impactés par le code livré.
3. Intégrité absolue : tout ce qui n'est pas impacté reste identique, mot pour mot.
4. Tri décroissant CHANGELOG : V(N) toujours au-dessus de V(N-1).
5. Métadonnées à jour : version courante + horodatage à chaque livraison.
6. Nouveau module : créer le bloc complet (7 sous-sections), insérer à sa position logique.
7. Module supprimé : marquer `[SUPPRIMÉ en V[N]]` — ne jamais effacer le bloc.
8. Pas de markdown : `.txt` pur, ASCII uniquement (box-drawing autorisé : ─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼ ═ ║ ▼ ►).
9. Anomalies : toute régression ou incohérence détectée → section 1.6, préfixée `[⚠]`.
10. Section 7 vivante : quand une intégration prévue est réalisée → cocher `[✓]`.

**Structure ARCHITECTURE — PARTIE 1 (architecture globale)**

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

**Structure ARCHITECTURE — PARTIE 2 (template module)**

```
====================================================================================================================================
MODULE : [NOM DU MODULE EN MAJUSCULES]
Depuis : V[N_creation]       Dernière MAJ : V[N] — [JJ/MM/AAAA à HH:MM]
====================================================================================================================================

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[NOM MODULE] — 1. LAYOUT DE L'INTERFACE
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[Diagramme ASCII box-drawing de l'interface du module]

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[NOM MODULE] — 2. MODELE DE DONNEES  state.[module]
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  champ1: 'valeur_exemple',    // Type — description — contraintes
  champ2: true,                // Boolean — description — défaut
}

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[NOM MODULE] — 3. LIAISONS ENTRANTES / SORTANTES
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[Diagramme ASCII des liaisons READ / WRITE et dépendances externes]

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[NOM MODULE] — 4. ARBRE D'APPELS DES FONCTIONS
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[Arbre ASCII des appels de fonctions depuis showPage()]

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[NOM MODULE] — 5. FLUX DE DONNEES DETAILLE
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[Flux pas-à-pas des fonctions clés du module]

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[NOM MODULE] — 6. MAPPING DES COULEURS ET STYLES
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Élément               | Classe CSS / Style                | Condition / Rôle
----------------------|-----------------------------------|---------------------------

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[NOM MODULE] — 7. INTEGRATION FUTURE (prevue)
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[ ] [Fonctionnalité prévue] — [Raison / contexte]
[✓] V[N] — [Fonctionnalité réalisée, anciennement prévue ici]

====================================================================================================================================
FIN MODULE : [NOM DU MODULE EN MAJUSCULES]
====================================================================================================================================
```

---

### C.5 FICHIER 5 — JOURNAL_CONVERSATIONS_[PROJET].txt

**En-tête du fichier (créé une seule fois)**

```
====================================================================================================================================
                         JOURNAL DES CONVERSATIONS — [NOM PROJET EN MAJUSCULES]
====================================================================================================================================
Date de création    : [JJ/MM/AAAA à HH:MM]
Projet              : [Nom du projet]
Agent               : Antigravity / Antigraviton
====================================================================================================================================
```

**Template d'entrée de session — strict**

```
************************************************************************************************************************************
SESSION [N°SESSION] — [JJ/MM/AAAA à HH:MM]
VERSION : V[N]
------------------------------------------------------------------------------------------------------------------------------------
DEMANDE :
[Résumé concis ou copie exacte de la demande / prompt de l'utilisateur]

[AGENT ANTIGRAVITY] :
[Résumé de la réponse, de la logique appliquée, questions posées ou compléments
 d'informations demandés, ou extrait du code généré]

PLAN VALIDÉ :
[Résumé du plan exposé tel qu'il a été validé par l'utilisateur]

FICHIERS MODIFIÉS :
- [Fichier 1] : [nature de la modification]
- [Fichier 2] : [nature de la modification]

RÉSULTAT : [succès / échec / en cours]
------------------------------------------------------------------------------------------------------------------------------------

```

**Algorithme de mise à jour du Journal**

```
ÉTAPE 1 — Vérification
  → Vérifier l'existence de JOURNAL_CONVERSATIONS_[NOM_PROJET].txt

ÉTAPE 2A — Création (fichier absent)
  → Créer le fichier.
  → Insérer l'en-tête global (Date de création, Nom du projet, Agent).
  → Ajouter la première entrée SESSION 1.

ÉTAPE 2B — Mise à jour (fichier existant)
  → Lire le contenu intégral du fichier.
  → Insérer la nouvelle entrée EN TÊTE du journal (tri décroissant).
  → Ne jamais altérer, écraser ou reformuler les entrées existantes.
  → Mode APPEND : seule la nouvelle entrée est ajoutée.
```

**Règles critiques — JOURNAL**

1. Tri décroissant : SESSION la plus récente en premier, juste sous l'en-tête.
2. Intégrité absolue : mode `append` — ne jamais écraser le fichier existant.
3. Exhaustivité : toute modification de fichier DOIT être listée dans FICHIERS MODIFIÉS.
4. Pas de markdown : `.txt` pur, ASCII uniquement.
5. Date = horodatage fichier livré : identique aux 4 autres fichiers.
6. RÉSULTAT honnête : indiquer "en cours" si la tâche n'est pas terminée.
7. Si plusieurs échanges dans une même session → une seule entrée consolidée.

---

## ════════════════════════════════════════════════════════════════════════
## PARTIE D — CONFIRMATIONS STANDARDS
## ════════════════════════════════════════════════════════════════════════

**Workflow A (création — 6 fichiers) :**

```
✅ Six fichiers créés — V[N] (version initiale)
   · HISTORIQUE_VERSIONS_[PROJET].txt          → créé : en-tête + entrée V[N]
   · PLAN_MODIFICATIONS_PAR_MENU_[PROJET].txt  → créé : [N] section(s) : [liste]
   · CHRONO_DEVELOPPEMENT_[PROJET].txt         → créé : session 1, durée [H]h [M]min
   · ARCHITECTURE_[PROJET].txt                → créé : [N] module(s) : [liste]
   · JOURNAL_CONVERSATIONS_[PROJET].txt       → créé : session 1, en-tête global
   · DESCRIPTIF_FONCTIONNEL_[PROJET].txt      → créé : 6 étapes renseignées, V[N]
                                                  Sections en attente : [liste ou "Aucune"]
   ─────────────────────────────────────────────────────────────────────────────
   Date/heure source : horodatage [NOM_FICHIER] — [JJ/MM/AAAA à HH:MM]
   Contrôle intégrité : ✔ versions homogènes ✔ tri décroissant ✔ dates identiques
```

**Workflow B (mise à jour — 6 fichiers) :**

```
✅ Six fichiers mis à jour — V[N]
   · HISTORIQUE_VERSIONS_[PROJET].txt          → entrée V[N] insérée en tête
   · PLAN_MODIFICATIONS_PAR_MENU_[PROJET].txt  → [N] section(s) mise(s) à jour : [liste]
   · CHRONO_DEVELOPPEMENT_[PROJET].txt         → session [N°], durée [H]h [M]min
                                                   Total projet : [H]h [M]min
   · ARCHITECTURE_[PROJET].txt                → [N] section(s) mise(s) à jour : [liste]
   · JOURNAL_CONVERSATIONS_[PROJET].txt       → session [N°] insérée en tête
   · DESCRIPTIF_FONCTIONNEL_[PROJET].txt      → bloc V[N] inséré en tête
                                                   Étapes modifiées : [liste ou "Aucune"]
                                                   Sections en attente : [liste ou "Aucune"]
   ─────────────────────────────────────────────────────────────────────────────
   Date/heure source : horodatage [NOM_FICHIER] — [JJ/MM/AAAA à HH:MM]
   Contrôle intégrité : ✔ versions homogènes ✔ tri décroissant ✔ dates identiques
```

**Si anomalie détectée lors du contrôle :**

```
   [⚠] ANOMALIE DÉTECTÉE ET CORRIGÉE :
       - [description : version manquante / tri incorrect / date incohérente / contradiction]
       - [action corrective appliquée]
```

---

## ════════════════════════════════════════════════════════════════════════
## PARTIE E — GUIDE D'INSTALLATION ET D'UTILISATION
## ════════════════════════════════════════════════════════════════════════

### E.1 Installation

1. Placer ce fichier `Agent_IDE_Antigravity.md` à la racine du projet (ou dans `/skills/`).
2. Au démarrage d'une session Antigravity, coller cette instruction :

```
Lis le fichier Agent_IDE_Antigravity.md et applique-le strictement pour cette session.
```

3. L'agent exécutera automatiquement la Phase d'Initialisation (A.1).

### E.2 Workflow utilisateur type

```
[UTILISATEUR]  → Expose une idée ou une demande de modification
[AGENT]        → Lit les 6 fichiers (A.1) + pose des questions si zones d'ombre (A.2)
[AGENT]        → Expose le plan détaillé (A.3) + demande validation
[UTILISATEUR]  → Valide ("Go" / "Oui" / corrections)
[AGENT]        → Génère le code
[AGENT]        → Met à jour les 6 fichiers (B.3)
[AGENT]        → Affiche la confirmation standard (D)
```

### E.3 Aller-retour doc → code

L'utilisateur peut modifier un `.txt` manuellement et demander une correction
de code en retour. L'agent lit la section modifiée et adapte le code en
conséquence. Ce flux est supporté pour les 6 fichiers.

### E.4 Checklist de démarrage "Zero-Day"

Quand aucun fichier de suivi n'existe encore :

- [ ] Confirmer le nom du projet avec l'utilisateur
- [ ] Confirmer la version de départ (V01 par défaut)
- [ ] Identifier la stack technique et les modules initiaux
- [ ] Déterminer le cas d'entrée du DESCRIPTIF (code fourni / démarrage de zéro — voir Partie F)
- [ ] Appliquer le Workflow A (création des 6 fichiers)
- [ ] Valider l'en-tête et les premières entrées avec l'utilisateur

---

---

## ════════════════════════════════════════════════════════════════════════
## PARTIE F — DESCRIPTIF FONCTIONNEL (FICHIER 6)
## ════════════════════════════════════════════════════════════════════════

### F.0 Objectif du fichier 6

Produire et maintenir un **DESCRIPTIF_FONCTIONNEL_[PROJET].txt** qui permet
à n'importe quel développeur de recréer le programme de A à Z **sans jamais
voir le code source**, uniquement en lisant ce document. Rédigé en langage
de la vie quotidienne, avec des analogies de métiers classiques (comptable,
archiviste, chef de projet, contrôleur qualité...), sans aucune syntaxe de
programmation.

---

### F.1 Trois cas d'entrée possibles

**CAS 1 — Code source fourni (nouveau projet, V01)**

```
ÉTAPE 1 — Lire le code intégralement
  → Analyser chaque comportement, chaque règle, chaque détail visuel.
  → Si un comportement est ambigu → poser la question avant de rédiger.

ÉTAPE 2 — Exposer le plan de rédaction (BEFORE-CODE adapté)
  → Lister les 6 étapes qui seront renseignées.
  → Signaler les zones d'ombre détectées dans le code.
  → Demander : "Ce plan te convient-il avant que je rédige ?"

ÉTAPE 3 — Rédiger le descriptif complet (6 étapes)
  → Respecter les contraintes absolues (F.2).
  → Créer DESCRIPTIF_FONCTIONNEL_[PROJET].txt.

ÉTAPE 4 — Confirmer la création
  → Afficher la confirmation standard (Partie D — Workflow A étendu).
```

**CAS 2 — Code source fourni (mise à jour, V(N))**

```
ÉTAPE 1 — Lire l'ancienne et la nouvelle version du code
  → Identifier précisément ce qui a changé, étape par étape.
  → Lire le DESCRIPTIF existant intégralement avant toute modification.

ÉTAPE 2 — Construire le journal des delta
  → Pour chacune des 6 étapes fonctionnelles, noter :
    "Aucun changement" ou décrire précisément ce qui a évolué.

ÉTAPE 3 — Mettre à jour le fichier
  → Insérer le bloc V(N) EN TÊTE (tri décroissant).
  → Le bloc contient : journal des delta + état complet mis à jour des 6 étapes.
  → Mettre à jour l'index des versions (tableau en tête de fichier).
  → Les blocs des versions antérieures restent intacts, mot pour mot.

ÉTAPE 4 — Confirmer la mise à jour
  → Afficher la confirmation standard (Partie D — Workflow B étendu).
```

**CAS 3 — Démarrage de zéro (aucun code existant)**

```
ÉTAPE 1 — Annoncer la démarche
  → "Je vais te poser des questions étape par étape pour construire
    le descriptif fonctionnel de ton projet. On avance ensemble,
    section par section. Maximum 3 questions à la fois."

ÉTAPE 2 — Interview structurée (voir F.3)
  → Poser les questions dans l'ordre des 6 étapes fonctionnelles.
  → Reformuler chaque réponse et demander confirmation avant de continuer.

ÉTAPE 3 — Rédiger au fur et à mesure
  → Créer le fichier dès que la première étape est validée.
  → Compléter progressivement à chaque réponse validée.
  → Marquer [À COMPLÉTER — raison] les sections en attente.

ÉTAPE 4 — Valider chaque étape
  → Après chaque étape rédigée : "Est-ce que cette description correspond
    exactement à ce que tu imagines ? Des ajustements ?"
```

---

### F.2 Contraintes absolues de rédaction du DESCRIPTIF

**Règle ZÉRO CODE — Non négociable**

```
INTERDIT absolument dans le contenu du fichier DESCRIPTIF :
  - Toute balise ou syntaxe de programmation (< > / = { } [ ] ; etc.)
  - Tout terme technique de code :
      · "boucle", "for", "while", "if", "else", "switch"
      · "fonction", "méthode", "classe", "objet", "instance"
      · "variable", "constante", "tableau", "array", "liste"
      · "DOM", "API", "JSON", "XML", "regex", "CSS", "HTML"
      · "JavaScript", "Python", "null", "undefined", "boolean"
      · "string", "integer", "float", "localStorage", "fetch"
      · "async", "await", "callback", "promise", "event", "listener"
      · "import", "export", "module", "package", "library"
  - Tout extrait de code, même d'une seule ligne ou d'un seul mot de code

AUTORISÉ et recommandé :
  - Analogies avec des métiers ou situations quotidiennes :
      · "comme un classeur avec des intercalaires colorés"
      · "comme une fiche de stock papier remplie par un magasinier"
      · "comme un tampon encreur appliquant le même format à chaque document"
      · "comme un standardiste qui redirige les appels selon des règles"
  - Verbes d'action physique et observables :
      "affiche", "masque", "colorie", "déplace", "compare", "bloque",
      "autorise", "envoie", "reçoit", "calcule", "regroupe", "trie"
  - Mesures traduites en langage naturel :
      "une marge d'environ un centimètre" plutôt que "16px"
      (conserver la valeur précise si elle est significative pour le résultat)
  - Couleurs nommées et décrites :
      "bleu nuit presque noir" plutôt que "#1a1a2e"
```

**Règle EXHAUSTIVITÉ — Non négociable**

```
Tout ce qui est dans le code DOIT être dans le descriptif. Aucun détail omis :
  - Une couleur précise              → la décrire avec des mots
  - Une animation                    → sa direction, sa durée, son déclencheur
  - Une mise en majuscule auto       → la signaler explicitement
  - Un arrondi de chiffre            → préciser à combien de décimales
  - Un message d'erreur              → le citer mot pour mot entre guillemets
  - Un comportement par défaut       → le décrire même s'il semble évident
  - Un élément fixe au défilement    → le mentionner
  - Un champ ignoré par la recherche → le nommer explicitement
  - Une colonne volontairement vide  → l'indiquer et expliquer pourquoi

TEST QUALITÉ OBLIGATOIRE avant chaque livraison du descriptif :
  "Un développeur peut-il recréer ce programme à l'identique uniquement
   en lisant ce texte, sans voir le code source ?"
   Si la réponse est non → approfondir avant de livrer.
```

**Règle ORTHOGRAPHE** : héritée de A.3bis — s'applique intégralement au DESCRIPTIF.

**Règle SOURCE DE LA DATE**

```
Priorité de lecture pour la date et l'heure à inscrire dans le DESCRIPTIF :
  1. Horodatage de dernière modification du fichier source livré (.html, .py, etc.)
  2. Commentaire de version dans le fichier source
  3. Date et heure système courantes (uniquement si aucun fichier source n'est fourni)
  → Identique à la règle B.0 — date appliquée de manière identique dans les 6 fichiers.
```

---

### F.3 Guide d'interview — CAS 3 (démarrage de zéro)

Poser les questions dans cet ordre. Ne pas passer à l'étape suivante avant
d'avoir des réponses validées. Maximum 3 questions à la fois.

```
ÉTAPE 1 — Visuel et animations
  · "À quoi ressemble l'écran principal ? Décris-le comme si tu regardais
    une affiche ou une maquette imprimée."
  · "Y a-t-il des couleurs imposées, une charte graphique à respecter ?"
  · "Quand tu cliques ou interagis avec quelque chose, est-ce que ça
    s'ouvre progressivement, apparaît d'un coup, glisse depuis un côté ?"
  · "Certains éléments restent-ils toujours visibles même quand on fait
    défiler la page vers le bas ?"

ÉTAPE 2 — Données d'entrée
  · "Qu'est-ce que l'utilisateur doit fournir au programme ?
    Un fichier importé ? Du texte tapé manuellement ? Les deux ?"
  · "Si c'est un fichier : comment est-il organisé ?
    Des colonnes avec des titres ? Des lignes séparées ? Un format particulier ?"
  · "Que se passe-t-il si une information est manquante ou incorrecte :
    le programme s'arrête, ignore la ligne, ou remplace par une valeur par défaut ?"
  · "Y a-t-il des dates ou des chiffres ? Dans quel format exact ?"

ÉTAPE 3 — Tri et organisation interne
  · "Dans quel ordre le programme doit-il ranger les informations
    avant de les afficher ?"
  · "S'il y a des groupes ou des catégories : comment sont-ils ordonnés
    entre eux, et comment les éléments sont ordonnés à l'intérieur ?"
  · "Y a-t-il une numérotation automatique ? Si oui, quand repart-elle
    à zéro et sur quelle base progresse-t-elle ?"

ÉTAPE 4 — Règles métier et contrôles
  · "Quelles règles le programme doit-il vérifier ?
    Qu'est-ce qui est interdit ? Qu'est-ce qui déclenche une alerte ?"
  · "Pour chaque règle : quel est le seuil exact ?
    (plus de 5, exactement 8 caractères, entre 0 et 100, etc.)"
  · "Quel message doit s'afficher quand il y a une erreur ?
    Cite le texte exact si possible."
  · "Si une erreur touche un élément, est-ce que tout le groupe
    autour de lui est aussi considéré en erreur ?"

ÉTAPE 5 — Interactions utilisateur
  · "Que peut faire l'utilisateur sur l'écran ?
    (cliquer, taper, filtrer, trier, glisser-déposer, cocher...)"
  · "S'il y a une recherche : sur quels champs porte-t-elle ?
    Certains champs sont-ils ignorés par la recherche ?"
  · "Si l'utilisateur tape du texte dans un champ : est-ce que
    le programme transforme automatiquement la saisie ?
    (majuscules forcées, format imposé, caractères refusés...)"
  · "Peut-on modifier directement une donnée affichée à l'écran
    sans passer par un formulaire séparé ?"

ÉTAPE 6 — Données de sortie
  · "Qu'est-ce que le programme produit à la fin ?
    Un fichier téléchargeable ? Un affichage à l'écran ? Les deux ?"
  · "Si c'est un fichier exporté : quel nom a-t-il ?
    Quelles colonnes contient-il, dans quel ordre, de gauche à droite ?"
  · "Les chiffres sont-ils arrondis ? À combien de décimales ?"
  · "Certaines lignes sont-elles supprimées ou filtrées avant l'export ?
    Selon quel critère ?"
  · "Y a-t-il des calculs intégrés dans le fichier produit
    (ex: une somme automatique en bas de colonne) ?"
```

**Règles de conduite de l'interview**

```
  - Maximum 3 questions à la fois.
  - Reformuler chaque réponse avant de continuer :
    "Si je comprends bien, [reformulation]. C'est bien ça ?"
  - Si une réponse est vague → creuser avec une question de précision.
  - Signaler les sections incomplètes avec [À COMPLÉTER — raison].
  - Ne jamais inventer une réponse non fournie par l'utilisateur.
  - En fin d'interview, récapituler les sections encore en attente.
```

---

### F.4 Template du fichier DESCRIPTIF_FONCTIONNEL_[PROJET].txt

**En-tête global du fichier (créé une seule fois)**

```
====================================================================================================================================
                    DESCRIPTIF FONCTIONNEL COMPLET — [NOM PROJET EN MAJUSCULES]
====================================================================================================================================
Date de création     : [JJ/MM/AAAA à HH:MM]
Projet               : [Nom du projet]
Agent                : Antigravity / Antigraviton
Règle de rédaction   : Aucun terme technique de code — langage accessible à tous
====================================================================================================================================

====================================================================================================================================
INDEX DES VERSIONS
====================================================================================================================================
Version | Date             | Étapes modifiées                              | Résumé du changement
--------|------------------|-----------------------------------------------|----------------------------------
V[N]    | [JJ/MM/AAAA]     | [ex: 1, 3, 5] ou [Aucune] ou [Toutes]        | [Résumé en une ligne]
V[N-1]  | [JJ/MM/AAAA]     | [ex: 2, 4]                                    | [Résumé en une ligne]
V01     | [JJ/MM/AAAA]     | Création initiale                             | Description initiale complète
====================================================================================================================================
```

**Template de bloc de version (répété pour chaque V(N) — tri décroissant)**

```
************************************************************************************************************************************
VERSION : V[N]
DATE    : [JJ/MM/AAAA à HH:MM]
************************************************************************************************************************************
JOURNAL DES DELTA — CE QUI A CHANGÉ DEPUIS V[N-1]
------------------------------------------------------------------------------------------------------------------------------------
Étape 1 — Visuel et animations       : [Aucun changement] ou [description précise du delta]
Étape 2 — Données d'entrée           : [Aucun changement] ou [description précise du delta]
Étape 3 — Tri et organisation        : [Aucun changement] ou [description précise du delta]
Étape 4 — Règles métier et contrôles : [Aucun changement] ou [description précise du delta]
Étape 5 — Interactions utilisateur   : [Aucun changement] ou [description précise du delta]
Étape 6 — Données de sortie          : [Aucun changement] ou [description précise du delta]
------------------------------------------------------------------------------------------------------------------------------------

====================================================================================================================================
ÉTAT COMPLET DU PROGRAMME À LA VERSION V[N]
====================================================================================================================================

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
ÉTAPE 1 — COMPORTEMENT VISUEL ET ANIMATIONS
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

[Décrire l'interface comme si on regardait un objet physique.
 Couleurs décrites avec des mots (ex: "bleu nuit presque noir", "gris perle très clair").
 Dimensions traduites en proportions ou en centimètres approximatifs.
 Formes : angles droits ou arrondis, degré d'arrondi relatif.
 Ombres portées : légères, marquées, direction, couleur.
 Comportement au survol, à l'ouverture, à la fermeture.
 Animations : déclencheur, direction, durée approximative.
 Éléments fixes lors du défilement : nommer chacun.
 Mise en page : colonnes, alignements, espacements caractéristiques.
 Typographie : taille relative, graisse, couleur selon le contexte, majuscules auto.]

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
ÉTAPE 2 — STRUCTURE EXACTE DES DONNÉES D'ENTRÉE
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

[Tout ce que le programme reçoit.
 Si fichier : nombre et nom exacts des colonnes (ordre gauche-droite), format des dates,
 format des nombres, encodage, ligne d'en-tête lue ou ignorée.
 Si saisie manuelle : chaque champ avec son libellé exact, type, longueur min/max.
 Valeurs par défaut si information absente.
 Transformations appliquées à la lecture (montant négatif = remboursement, etc.).]

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
ÉTAPE 3 — LOGIQUE DE TRI ET D'ORGANISATION INTERNE
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

[Comment les données sont rangées avant tout affichage.
 Hiérarchie complète : niveau 1, niveau 2, niveau 3 — critère et sens pour chaque niveau.
 Regroupements : logique, ordre des catégories, ordre interne.
 Numérotation automatique : moment de départ, moment de remise à zéro, pas d'incrémentation.]

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
ÉTAPE 4 — CONTRÔLES ET RÈGLES MÉTIER
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

[Pour chaque règle de vérification :
  1. Ce qui est mesuré ou comparé (en termes simples).
  2. Le seuil exact ou la condition exacte de déclenchement.
  3. Le message exact affiché à l'utilisateur (entre guillemets).
  4. La règle de contamination : l'erreur se propage-t-elle au groupe entier ?
 Ordre de priorité si plusieurs règles s'appliquent au même élément.]

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
ÉTAPE 5 — INTERACTIONS UTILISATEUR ET CAS PARTICULIERS
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

[Chaque action possible : clic, double-clic, frappe, glisser-déposer, filtre, tri.
 Mécanismes de recherche : champs actifs, champs ignorés, sensibilité à la casse,
 recherche partielle ou exacte.
 Transformations automatiques à la saisie : majuscules forcées, format imposé,
 caractères refusés, remplacement silencieux.
 Comportements en cas de saisie invalide : blocage, correction, message, surlignage.
 Cas limites : champ vide, valeur au maximum, action non autorisée.]

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
ÉTAPE 6 — STRUCTURE EXACTE DES DONNÉES DE SORTIE
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

[Tout ce que le programme produit.
 Si fichier exporté : nom (fixe ou dynamique — modèle exact), format, encodage.
 Colonnes dans l'ordre exact gauche-droite : nom, type, source, arrondi appliqué.
 Colonnes volontairement vides et raison.
 Lignes supprimées avant l'export et critère de suppression.
 Calculs intégrés dans le fichier produit.
 Nombre total de lignes attendu selon les données d'entrée.]

************************************************************************************************************************************
```

**Règles critiques du fichier DESCRIPTIF**

```
1.  Tri décroissant : V(N) toujours en premier sous l'en-tête global.
2.  Index des versions : mis à jour à chaque nouvelle version.
3.  Intégrité absolue : les blocs des versions antérieures ne sont jamais modifiés.
4.  ZÉRO terme de code : relire chaque phrase avant de l'écrire dans le fichier.
5.  Exhaustivité : si un détail est dans le code, il est dans le descriptif.
6.  Sections incomplètes : marquer [À COMPLÉTER — raison] plutôt que laisser vide.
7.  Pas de markdown : .txt pur, encodage UTF-8 uniquement.
8.  Date = horodatage du fichier livré — identique aux 5 autres fichiers.
9.  Test qualité : relire en se demandant "un développeur peut-il recréer
    ce programme uniquement avec ce texte, sans voir le code source ?"
10. Mode APPEND strict : insérer les blocs en tête, ne jamais réécrire
    intégralement le fichier à chaque mise à jour.
```

---

### F.5 Gestion des points particuliers du DESCRIPTIF

**Contradictions entre code et descriptif existant**

```
Si le nouveau code contredit une description existante :
  → Signaler avant toute modification :
    "[⚠] CONTRADICTION DESCRIPTIF :
     Le descriptif V[N-1] indique [ancienne description].
     Le nouveau code indique [nouvelle description].
     Confirmes-tu que ce comportement a bien changé ?"
  → Attendre confirmation avant de mettre à jour.
  → Documenter la correction dans le journal des delta de V(N).
```

**Niveau de granularité selon l'ampleur des changements**

```
Changement mineur (couleur, marge, libellé d'un bouton) :
  → Renseigner uniquement l'étape concernée dans le journal des delta.
  → Mettre à jour uniquement la sous-section impactée dans l'état complet.

Changement majeur (nouveau module, refonte d'une règle, nouveau formulaire) :
  → Renseigner toutes les étapes potentiellement impactées.
  → Vérifier les dépendances entre étapes.

Refonte totale :
  → Rédiger les 6 étapes complètes dans le bloc V(N).
  → Indiquer dans le journal des delta : "Refonte complète — voir état V[N]".
```

**Cohérence entre ARCHITECTURE et DESCRIPTIF**

```
Ces deux fichiers se complètent sans se dupliquer :
  · ARCHITECTURE_[PROJET].txt   → structure technique et liaisons entre modules
  · DESCRIPTIF_FONCTIONNEL      → comportement observé et expérience utilisateur

En cas de contradiction → l'ARCHITECTURE fait référence (source de vérité technique).
Signaler la contradiction et demander à l'utilisateur de trancher.
```

**Signalement des sections incomplètes en fin de session**

```
Toujours terminer par un bilan explicite :

"⚠ Sections encore en attente dans le DESCRIPTIF_FONCTIONNEL_[PROJET].txt :
   · Étape [N] — [nom de la section] : [raison de l'absence de l'information]
  Pour compléter ces sections : [question directe à poser à l'utilisateur]"

Si toutes les sections sont complètes :
"✔ Toutes les sections du DESCRIPTIF sont renseignées."
```

---

*Skill version : 1.1 — Fusion architecture_managing-versions + Protocole Antigravity + Descriptif Fonctionnel*
*Portée : Antigravity / Antigraviton — projets mono-fichier et multi-fichiers*
*Compatibilité : HTML, Python, JavaScript, tout langage avec fichier source horodatable*
