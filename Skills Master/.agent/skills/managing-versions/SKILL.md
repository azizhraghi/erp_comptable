---
name: managing-versions
description: >
  Maintient à jour les TROIS fichiers de suivi après chaque code livré :
  HISTORIQUE_VERSIONS (journal chronologique), PLAN_MODIFICATIONS_PAR_MENU
  (vue par menu/module), et CHRONO_DEVELOPPEMENT (suivi du temps de
  développement par version et total projet). Déclencher SYSTÉMATIQUEMENT
  après toute livraison de code, même mineure. Nommer dynamiquement les
  fichiers selon le nom du projet racine.
---

# Managing Versions — Triple fichier de suivi

Après chaque code fourni, mettre à jour **les trois fichiers** simultanément :
- `HISTORIQUE_VERSIONS_[PROJET].txt`
- `PLAN_MODIFICATIONS_PAR_MENU_[PROJET].txt`
- `CHRONO_DEVELOPPEMENT_[PROJET].txt`

---

## Conventions de nommage

| Fichier | Nom attendu |
|---|---|
| Historique chronologique | `HISTORIQUE_VERSIONS_[NOM_PROJET].txt` |
| Plan par menu | `PLAN_MODIFICATIONS_PAR_MENU_[NOM_PROJET].txt` |
| Chrono développement | `CHRONO_DEVELOPPEMENT_[NOM_PROJET].txt` |

Règle : inférer le nom depuis le dossier racine ou `instructions.md`.
Si ambiguïté → demander avant de créer.

---

## Workflow — Décision initiale obligatoire

```
Les trois fichiers existent-ils dans le projet ?
         |                    |
        OUI                  NON
         |                    |
  → Workflow B (MAJ)   → Workflow A (CRÉATION)
```

---

## Workflow A — Première version (fichiers inexistants)

- [ ] 1. Identifier le nom du projet (dossier racine ou `instructions.md`)
- [ ] 2. Identifier la version initiale : V01 par défaut
- [ ] 3. Noter l'heure de début de session (horodatage système)
- [ ] 4. Classifier les changements : `AJOUTÉ` `MODIFIÉ` `CORRIGÉ` `SUPPRIMÉ`
- [ ] 5. Identifier les menus/modules couverts
- [ ] 6. Créer `HISTORIQUE_VERSIONS_[PROJET].txt` :
     - Écrire l'en-tête complet
     - Ajouter l'entrée V01
- [ ] 7. Créer `PLAN_MODIFICATIONS_PAR_MENU_[PROJET].txt` :
     - Écrire l'en-tête complet
     - Créer les sections de menu présentes
     - Ajouter l'entrée V01 dans chaque section concernée
     - Ajouter la légende en bas
- [ ] 8. Créer `CHRONO_DEVELOPPEMENT_[PROJET].txt` :
     - Écrire l'en-tête avec totaux à zéro
     - Ajouter l'entrée de session V01
- [ ] 9. Confirmer la création des trois fichiers

---

## Workflow B — Mise à jour (fichiers existants)

- [ ] 1. **LIRE les trois fichiers en intégralité** avant d'écrire quoi que ce soit
     - Dernière version dans HISTORIQUE_VERSIONS
     - Sections dans PLAN_MODIFICATIONS_PAR_MENU
     - Total heures accumulées dans CHRONO_DEVELOPPEMENT
- [ ] 2. Déterminer V(N) : incrémenter ou utiliser le numéro fourni
- [ ] 3. Classifier les changements : `AJOUTÉ` `MODIFIÉ` `CORRIGÉ` `SUPPRIMÉ`
- [ ] 4. Identifier les menus/modules impactés
- [ ] 5. Calculer la durée de la session courante :
     - Heure de fin − Heure de début de cette session de travail
     - Ne jamais comptabiliser les pauses ou interruptions inter-sessions
     - Si reprise le lendemain = nouvelle session distincte
- [ ] 6. Mettre à jour HISTORIQUE_VERSIONS — insertion stricte en tête
- [ ] 7. Mettre à jour PLAN_MODIFICATIONS_PAR_MENU — insertion en tête des sections impactées
- [ ] 8. Mettre à jour CHRONO_DEVELOPPEMENT :
     - Insérer la nouvelle session en haut du journal
     - Recalculer le total général en haut du fichier
- [ ] 9. Confirmer la mise à jour des trois fichiers

---

## Règle d'or — Lecture avant écriture

```
INTERDIT  : Réécrire un fichier entier à chaque version.
OBLIGATOIRE : Lire → identifier la position → insérer uniquement le nouveau bloc.
```

---

## Exceptions autorisées — Correction de l'historique

| Situation | Action autorisée |
|---|---|
| Erreur factuelle (mauvaise date, mauvais numéro) | Corriger uniquement la ligne fautive |
| Oubli dans la dernière version déjà écrite | Ajouter la ligne manquante dans le bon bloc |
| Faute de frappe | Corriger la ligne concernée uniquement |
| Demande explicite de l'utilisateur | Appliquer la correction ciblée demandée |

Correction toujours chirurgicale — jamais de réécriture de section.

---

## Fichier 1 — HISTORIQUE_VERSIONS_[PROJET].txt

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
DATE : [JJ/MM/AAAA à HH:MM]
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

1. **Antichronologie** : V(N) toujours au-dessus de V(N-1), juste sous l'en-tête.
2. **Préfixe module** : chaque ligne commence par le nom du module affecté.
3. **Insertion uniquement** : tout ce qui existait reste identique, mot pour mot.
4. **Pas de markdown** : `.txt` pur, ASCII uniquement.
5. **CORRIGÉ ≠ MODIFIÉ** : un correctif répare, une modification fait évoluer.

---

## Fichier 2 — PLAN_MODIFICATIONS_PAR_MENU_[PROJET].txt

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
V[Numéro] — [JJ/MM/AAAA à HH:MM]
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

1. Antichronologie par section — version la plus récente en premier.
2. Sélectivité — entrée V(N) uniquement dans les sections impactées.
3. Insertion uniquement — entrées existantes restent intactes.
4. Sections non impactées = non touchées.
5. En-tête à jour — mettre à jour `(V01 → V[N_ACTUEL])` à chaque version.
6. Nouvelle section — créer si nouveau menu, juste avant la légende.
7. Pas de markdown — `.txt` pur, ASCII uniquement.

---

## Fichier 3 — CHRONO_DEVELOPPEMENT_[PROJET].txt

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
DERNIÈRE SESSION           : [JJ/MM/AAAA]
====================================================================================================================================
```

### Template d'entrée de session

Chaque session de travail (même partielle sur une version) génère une entrée :

```
-----------------------------------------------------------------------------------------------------------------------------------
SESSION [N°SESSION] — VERSION V[N]
-----------------------------------------------------------------------------------------------------------------------------------
Début       : [JJ/MM/AAAA à HH:MM]
Fin         : [JJ/MM/AAAA à HH:MM]
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
Durée session = Heure_Fin − Heure_Début   (dans la même session continue)

INTERDIT de comptabiliser :
  - Le temps entre deux sessions distinctes (même pour la même version)
  - Les pauses > 30 minutes dans une session
  - Le temps de relecture passive sans modification de code

Total projet = Somme de toutes les durées de sessions individuelles
```

### Règle de mise à jour de l'en-tête

À chaque nouvelle session :
1. Insérer la nouvelle entrée **juste après l'en-tête** (ordre antichronologique)
2. Recalculer et mettre à jour le bloc d'en-tête :
   - `TEMPS TOTAL` = somme de toutes les durées
   - `NOMBRE DE VERSIONS` = dernière version V(N)
   - `NOMBRE DE SESSIONS` = incrémenter de 1
   - `DERNIÈRE SESSION` = date du jour

### Règles critiques — CHRONO

1. **Insertion uniquement** — ne jamais réécrire les sessions existantes.
2. **Une entrée par session continue** — si reprise le lendemain = nouvelle entrée.
3. **Durée arrondie à la minute** — pas de secondes.
4. **Pas de markdown** — `.txt` pur, ASCII uniquement.
5. **En-tête recalculé** à chaque nouvelle session (seule exception à la règle d'insertion).

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
Fin         : 19/05/2026 à 10:50
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
Fin         : 16/05/2026 à 15:45
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
Fin         : 15/05/2026 à 11:00
Durée       : 1h 00min
-----------------------------------------------------------------------------------------------------------------------------------
Travaux effectués :
  [+] Structure HTML de base, navigation, thème clair/sombre
  [+] Module Dashboard : squelette initial
-----------------------------------------------------------------------------------------------------------------------------------
```

---

## Confirmations

**Workflow A (création) :**
```
✅ Trois fichiers créés — V[N] (version initiale)
   • HISTORIQUE_VERSIONS_[PROJET].txt         → créé : en-tête + entrée V[N]
   • PLAN_MODIFICATIONS_PAR_MENU_[PROJET].txt → créé : [N] section(s) : [liste]
   • CHRONO_DEVELOPPEMENT_[PROJET].txt        → créé : session 1, durée [H]h [M]min
```

**Workflow B (mise à jour) :**
```
✅ Trois fichiers mis à jour — V[N]
   • HISTORIQUE_VERSIONS_[PROJET].txt         → entrée V[N] insérée en tête
   • PLAN_MODIFICATIONS_PAR_MENU_[PROJET].txt → [N] section(s) mise(s) à jour : [liste]
   • CHRONO_DEVELOPPEMENT_[PROJET].txt        → session [N°], durée [H]h [M]min
                                                 Total projet : [H]h [M]min
```
