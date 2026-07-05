---
name: brainstorming-ideas
description: >
  Explore les intentions, besoins et contraintes avant toute implémentation.
  Transforme une idée vague en spécification validée via dialogue collaboratif.
  Déclencher OBLIGATOIREMENT au démarrage de tout nouveau projet ou nouvelle
  fonctionnalité majeure, avant tout code. Lit instructions.md,
  brand-guidelines.md et context.md pour s'ancrer dans le contexte projet.
---

# Brainstorming — Conception avant implémentation

Ce skill DOIT être utilisé avant tout travail de création ou modification
substantielle. Il garantit que le "quoi" est défini avant de décider du "comment".

---

## Règle absolue

NE PAS écrire de code ni invoquer `planning-implementation` tant que
la spécification n'est pas approuvée explicitement par l'utilisateur.

---

## Étape 1 — Lecture des fichiers projet

Lire les trois fichiers de contexte avant tout dialogue :

- [ ] `instructions.md`     — objectif, fonctionnalités, contraintes, ce que l'app ne fait pas
- [ ] `brand-guidelines.md` — palette, typographie, style visuel attendu
- [ ] `context.md`          — profil utilisateur, contexte métier, réglementation

Si un fichier est vide ou incomplet → poser les questions pour le compléter
AVANT de commencer la conception.

---

## Étape 2 — Dialogue itératif

- Poser les questions de clarification **une par une**.
- Si l'utilisateur est indécis, proposer une recommandation basée sur
  les bonnes pratiques et le contexte du fichier `context.md`.
- Adapter le vocabulaire au domaine métier (comptabilité, fiscal, gestion...).

Questions types à explorer :
- Quel est le flux principal de l'utilisateur (parcours étape par étape) ?
- Quelles données sont saisies / affichées / exportées ?
- Y a-t-il des règles métier précises (calculs, validations, formats réglementaires) ?
- Quelles actions sont irréversibles (suppressions, clôtures, validations) ?
- Export PDF / Excel nécessaire ?
- Mode hors ligne ou toujours connecté ?

---

## Étape 3 — Proposition d'approches

Présenter 2 ou 3 options avec avantages et inconvénients.
Ancrer chaque option dans les contraintes de `instructions.md`.

---

## Étape 4 — Rédaction de la spécification

Créer : `docs/specs/YYYY-MM-DD-[sujet]-design.md`

```markdown
# Spécification — [Nom de la fonctionnalité]
Date    : [JJ/MM/AAAA]
Projet  : [Nom du projet]
Version cible : V[N]

## Objectifs
[Ce que cette fonctionnalité accomplit.]

## Hors périmètre (Non-Goals)
[Ce qui est explicitement exclu.]

## Expérience utilisateur
[Parcours utilisateur pas à pas.]

## Architecture technique
[Composants, structure des données, logique principale.]

## Règles métier
[Calculs, validations, cas limites, formats réglementaires.]

## Plan de vérification
[Comment savoir que c'est correct.]
```

---

## Étape 5 — Auto-vérification + validation

- [ ] Aucune section ne contient "TBD" ou reste vague.
- [ ] Les contraintes de `instructions.md` sont toutes couvertes.
- [ ] Soumettre à l'utilisateur pour approbation explicite.
- [ ] Attendre le "OK" avant de passer à `planning-implementation`.

---

## Confirmation de fin

```
✅ Spécification validée — [Nom de la fonctionnalité]
   Fichier : docs/specs/YYYY-MM-DD-[sujet]-design.md
   → Invoquer Skills/planning-implementation.md pour l'étape suivante
```
