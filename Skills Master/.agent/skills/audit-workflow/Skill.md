---
name: audit-workflow
description: >
  Skill d'audit qualité complet pour applications web et mobiles. Déclencher
  SYSTÉMATIQUEMENT dès que l'utilisateur mentionne : "/audit", "auditer mon app",
  "tester mon application", "score qualité", "vérifier les bugs", "tester les
  fonctionnalités", "audit visuel", "audit fonctionnel", "trouver les problèmes",
  "corriger les bugs automatiquement". Toujours exécuté sur la DERNIÈRE version
  disponible. Lit HISTORIQUE_VERSIONS pour identifier cette version avant de
  commencer.
---

# Audit Qualité Application

Exécute un audit visuel et fonctionnel complet, attribue un score /10,
et corrige automatiquement les problèmes critiques et moyens.

---

## Prérequis — Identifier la dernière version

Avant tout, lire `HISTORIQUE_VERSIONS_[PROJET].txt` pour identifier
la dernière version disponible. L'audit porte **toujours et uniquement**
sur cette version. Ne jamais auditer une version antérieure sauf demande explicite.

```
Version auditée : [NOM_PROJET]_V[N].html
Confirmée depuis : HISTORIQUE_VERSIONS_[PROJET].txt
```

---

## Étape 1 — Test visuel

Ouvrir l'application dans le navigateur et vérifier :

- **Alignement** : éléments correctement alignés, pas de débordement ni chevauchement
- **Cohérence des couleurs** : palette conforme à `brand-guidelines.md`, contrastes WCAG AA
- **Lisibilité** : taille de police, espacement, pas de texte tronqué
- **Responsive** : desktop (1280px), tablette (768px), mobile (375px)
- **Mode sombre / clair** : si activé, vérifier la lisibilité dans les deux modes
- **Images et icônes** : chargement correct, cohérence, pas d'éléments cassés
- **Espacement** : padding/margin cohérents entre les sections

**Sortie** : liste des anomalies visuelles avec localisation (composant, page, breakpoint).

---

## Étape 2 — Test fonctionnel

### Boutons et liens
- Cliquer chaque bouton et vérifier l'action déclenchée
- Vérifier les états (hover, focus, disabled, loading)
- Tester tous les liens (internes, externes, ancres)

### Formulaires
- Remplir avec des données réalistes et valides
- Tester les validations (champs requis, formats, limites)
- Vérifier les messages de retour (succès / erreur)
- Tester avec des données invalides

### Calculs et logique métier
- Vérifier l'exactitude de chaque calcul affiché
- Tester les cas limites (valeurs nulles, maximales, négatives)
- Comparer avec les valeurs attendues selon `context.md`

### Exports et fichiers générés
- Tester les exports PDF, Excel, CSV si présents
- Vérifier que le contenu exporté correspond aux données affichées
- Contrôler le format et la mise en page des fichiers générés

### Persistance des données
- Vérifier que les données sont bien sauvegardées (localStorage)
- Tester la restauration après rechargement de page
- Vérifier la cohérence des données entre sessions

**Sortie** : liste des dysfonctionnements avec étapes de reproduction.

---

## Étape 3 — Rapport de score

```
RAPPORT D'AUDIT — [Nom de l'application] V[N]
Date  : [JJ/MM/AAAA]
Score : [X]/10

PROBLÈMES CRITIQUES (bloquants) :
  [N°]. [Description] — [Localisation]

PROBLÈMES MOYENS (dégradants) :
  [N°]. [Description] — [Localisation]

PROBLÈMES MINEURS (cosmétiques) :
  [N°]. [Description] — [Localisation]

POINTS POSITIFS :
  - [Ce qui fonctionne bien]
```

### Grille de scoring

| Critère | Poids | Note |
|---|---|---|
| Absence d'erreurs critiques | 30% | /3 |
| Fonctionnalités opérationnelles | 25% | /2.5 |
| Qualité visuelle & UX | 20% | /2 |
| Exactitude des calculs/données | 15% | /1.5 |
| Responsive & accessibilité | 10% | /1 |

### Niveaux de gravité

- **Critique** : bloque l'utilisation (crash, perte de données, calcul faux, export cassé)
- **Moyen** : dégrade l'expérience (bouton sans effet, validation absente, affichage incorrect)
- **Mineur** : cosmétique (alignement imparfait, texte tronqué, espacement irrégulier)

---

## Étape 4 — Correction automatique

### Corriger immédiatement (critiques + moyens)
1. Localiser le fichier et la ligne concernés
2. Appliquer la correction minimale et ciblée
3. Re-tester pour valider
4. Documenter dans le rapport

### Ne pas corriger (mineurs)
Lister avec suggestion de correction — l'utilisateur décide.

### Rapport final

```
CORRECTIONS APPLIQUÉES :
  ✅ [Problème] → [Correction effectuée] → [Fichier:ligne]

À CORRIGER MANUELLEMENT (mineurs) :
  ⚠️ [Problème] → [Correction suggérée]

Score final après corrections : [X]/10
```

---

## Étape 5 — Mise à jour obligatoire

Après chaque audit ayant entraîné des corrections, invoquer
`Skills/managing-versions.md` pour enregistrer la nouvelle version corrigée.

---

## Conseils d'utilisation

- Lancer `/audit` à chaque fin de session de développement
- Committer avant l'audit (point de restauration Git)
- Si score < 6/10, relancer un second cycle après corrections
- Après audit, enchaîner avec `Skills/optimize-workflow.md`
