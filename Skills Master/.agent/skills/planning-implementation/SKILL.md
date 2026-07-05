---
name: planning-implementation
description: >
  Crée un plan d'implémentation détaillé depuis une spécification approuvée.
  Décompose le travail en étapes atomiques pour garantir une exécution sans
  régression. Déclencher uniquement APRÈS validation de la spec via
  brainstorming-ideas. Lit instructions.md pour respecter les contraintes.
---

# Planning — Du "quoi" au "comment"

Une fois le "quoi" validé (via brainstorming-ideas), ce skill définit le
"comment", étape par étape, avec critères de vérification explicites.

---

## Prérequis obligatoires

- [ ] Une spécification approuvée existe dans `docs/specs/`.
  Sinon → invoquer `Skills/brainstorming-ideas.md` d'abord.
- [ ] Lire `instructions.md` — contraintes techniques (HTML unique, localStorage, responsive...).
- [ ] Lire `brand-guidelines.md` — contraintes visuelles à respecter.
- [ ] Identifier la **dernière version** en lisant `HISTORIQUE_VERSIONS_[PROJET].txt`.

---

## Règle de versionnement dans le plan

- **Nouvelle version** = copie de la version précédente + modifications ciblées.
- **V01** : créer `[NOM_PROJET]_V01.html` depuis zéro.
- **V(N)** : copier `[NOM_PROJET]_V(N-1).html` → renommer → appliquer les modifs.
- **JAMAIS** revenir à une version antérieure sauf demande explicite.

---

## Workflow

- [ ] 1. Lire la spécification : `docs/specs/YYYY-MM-DD-[sujet]-design.md`
- [ ] 2. Identifier la version de départ : V(N-1) ou V01 si nouveau projet
- [ ] 3. Décomposer en étapes atomiques (chaque étape < 50 lignes de code)
- [ ] 4. Créer le fichier plan : `docs/plans/YYYY-MM-DD-[sujet].md`
- [ ] 5. Auto-vérification :
    - Étapes dans le bon ordre ?
    - Chaque étape vérifiable indépendamment ?
    - Noms de fichiers et fonctions explicites ?
    - Contraintes de `instructions.md` respectées ?
- [ ] 6. Soumettre à l'utilisateur pour validation avant exécution

---

## Template du plan

```markdown
# Plan d'implémentation — [Nom]
Date           : [JJ/MM/AAAA]
Projet         : [Nom]
Version départ : V[N-1]
Version cible  : V[N]
Spécification  : docs/specs/[fichier]-design.md

## Résumé
[Description courte des changements prévus.]

## Fichiers concernés
- Copié   : [NOM_PROJET]_V[N-1].html → [NOM_PROJET]_V[N].html
- Créés   : [autres fichiers si besoin]
- Modifiés: [liste]

## Étapes

### Étape 1 — [Titre court]
- Action       : [description précise]
- Fichier      : [NOM_PROJET]_V[N].html — section [HTML/CSS/JS], ligne ~[X]
- Vérification : [comment confirmer visuellement ou en console]

### Étape 2 — [Titre court]
- Action       : ...
- Fichier      : ...
- Vérification : ...

[Répéter pour chaque étape]

## Vérification finale
- [ ] [Test fonctionnel 1]
- [ ] [Test visuel 2]
- [ ] Invoquer Skills/audit-workflow.md sur V[N]
- [ ] Invoquer Skills/managing-versions.md pour clôturer la version
```

---

## Règles des étapes atomiques

Chaque étape doit être :
- **Indépendante** : réalisable et testable seule
- **Précise** : nom du fichier, de la fonction, de la balise concernée
- **Vérifiable** : résultat attendu décrit explicitement
- **Limitée** : idéalement < 50 lignes modifiées

---

## Après chaque étape codée

Invoquer **immédiatement** `Skills/managing-versions.md` — ne pas accumuler
plusieurs étapes sans mise à jour du suivi.

---

## Confirmation de fin

```
✅ Plan validé — V[N]
   Fichier  : docs/plans/YYYY-MM-DD-[sujet].md
   Base     : [NOM_PROJET]_V[N-1].html
   → Exécution étape par étape
   → Skills/managing-versions.md invoqué après chaque étape
```
