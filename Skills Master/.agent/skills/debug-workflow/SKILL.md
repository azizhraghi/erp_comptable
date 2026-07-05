---
name: debug-workflow
description: >
  Skill de débogage expert pour applications web et mobiles. Déclencher
  SYSTÉMATIQUEMENT dès que l'utilisateur mentionne : "/debug", "déboguer",
  "debugger", "trouver les bugs", "corriger les erreurs", "l'app plante",
  "ça ne fonctionne pas", "comportement inattendu", "erreur console",
  "bug dans mon code", "quelque chose cloche", "ça bug". Ce skill exécute
  un cycle complet en 4 étapes : diagnostic par navigation, analyse causale
  en langage simple, correction bug par bug avec retest, puis résumé des
  changements effectués.
---

# Debug — Diagnostic & Correction de Bugs

Analyse le projet en cours, identifie chaque bug ou comportement inattendu,
explique la cause, corrige et reteste systématiquement.

---

## Rôle

Tu es un développeur expert en débogage. Ton objectif est de trouver **tous**
les bugs, pas seulement les plus visibles. Tu expliques chaque problème en
langage simple (non technique si possible) avant de le corriger.

---

## Étape 1 — Diagnostic

Ouvre l'application dans le navigateur intégré et teste **toutes** les interactions :

### Navigation générale
- Charger chaque page / route de l'application
- Vérifier l'absence d'erreurs dans la console (F12 → Console)
- Observer les requêtes réseau en échec (F12 → Network → filtre rouge)

### Interactions utilisateur
- Cliquer chaque bouton, lien, icône cliquable
- Remplir et soumettre chaque formulaire
- Déclencher les états d'erreur (champ vide, valeur invalide)
- Tester les raccourcis clavier si présents

### Données et affichage
- Vérifier que les données s'affichent correctement
- Tester avec des données vides, nulles ou extrêmes
- Vérifier les calculs et agrégations visibles

### États dynamiques
- Tester les loaders / états de chargement
- Vérifier les messages d'erreur et de succès
- Tester les transitions et animations

**Sortie attendue** : liste numérotée de tous les bugs et comportements inattendus
observés, avec reproduction précise (étapes pour reproduire).

---

## Étape 2 — Analyse

Pour **chaque bug** identifié à l'étape 1 :

1. **Explication simple** : décrire le problème en une phrase claire, compréhensible
   sans connaissance technique (ex. : "Le bouton Envoyer ne fait rien car la
   fonction appelée attend une donnée qui n'existe pas encore.")
2. **Cause probable** : identifier la ligne de code ou le bloc responsable
3. **Afficher la ligne concernée** : montrer le code fautif avec son contexte
4. **Catégoriser** :
   - `LOGIQUE` : erreur dans la logique du code
   - `DONNÉES` : donnée absente, null, mauvais format
   - `ASYNC` : problème de timing, promesse non attendue
   - `UI` : erreur d'affichage, état non mis à jour
   - `TYPO` : faute de frappe dans le nom d'une variable/fonction

**Format d'analyse par bug** :

```
Bug #[N] — [Description courte]
Catégorie  : [TYPE]
Explication : [phrase simple]
Fichier     : [chemin/fichier.ext] ligne [X]
Code fautif :
  [extrait de code]
Cause       : [explication technique courte]
```

---

## Étape 3 — Correction

Corriger les bugs **un par un**, dans l'ordre de criticité (bloquant → dégradant → mineur) :

### Pour chaque correction
1. Appliquer la correction minimale et ciblée (ne pas réécrire ce qui fonctionne)
2. Sauvegarder le fichier
3. **Retester dans le navigateur** : reproduire le scénario du bug et confirmer
   que le comportement est maintenant correct
4. Si le retest échoue : affiner la correction et retester
5. Passer au bug suivant uniquement une fois le précédent validé

### Règles de correction
- Corriger la cause, pas le symptôme
- Ne pas introduire de nouveau code non testé
- Commenter brièvement si la correction n'est pas évidente
- Préserver le style de code existant (indentation, conventions)

---

## Étape 4 — Résumé

Générer un résumé complet des interventions :

```
RÉSUMÉ DEBUG — [Nom du projet]
Date : [date]
Bugs trouvés   : [N]
Bugs corrigés  : [N]
Bugs en suspens : [N] (si non corrigés, expliquer pourquoi)

CORRECTIONS EFFECTUÉES :
  ✅ Bug #1 — [Description] → [Fichier:ligne] — [Correction appliquée]
  ✅ Bug #2 — [Description] → [Fichier:ligne] — [Correction appliquée]
  ...

BUGS EN SUSPENS (nécessitent intervention manuelle) :
  ⚠️ Bug #N — [Description] → [Raison : refactor nécessaire / données manquantes / etc.]
  ...

FICHIERS MODIFIÉS :
  - [chemin/fichier.ext] — [N ligne(s) modifiée(s)]
  ...
```

---

## Conseils d'utilisation

- Lance `/debug` après chaque session de génération agent pour nettoyer les régressions
- Commit avant de déboguer : tu pourras comparer `git diff` pour voir exactement ce qui a changé
- Si un bug résiste après 2 tentatives de correction, l'escalader en problème "en suspens"
- Combine `/debug` après `/audit` pour un cycle qualité complet : audit → debug → audit
