---
name: optimize-workflow
description: >
  Skill d'optimisation performance, accessibilité et UX pour applications web.
  Déclencher SYSTÉMATIQUEMENT dès que l'utilisateur mentionne : "/optimize",
  "optimiser", "améliorer les performances", "l'app est lente", "temps de
  chargement", "accessibilité", "contraste des couleurs", "navigation clavier",
  "expérience utilisateur", "UX", "améliorer l'interface", "rendre plus rapide",
  "optimisation mobile", "lighthouse", "score performance". Toujours exécuté
  sur la DERNIÈRE version disponible. Lit HISTORIQUE_VERSIONS pour identifier
  cette version avant de commencer.
---

# Optimize — Performance, Accessibilité & UX

Analyse le projet et améliore systématiquement les performances, l'accessibilité
et l'expérience utilisateur. Génère un rapport avant/après.

---

## Prérequis — Identifier la dernière version

Lire `HISTORIQUE_VERSIONS_[PROJET].txt` pour identifier la dernière version.
L'optimisation porte **toujours et uniquement** sur cette version.
Ne jamais optimiser une version antérieure sauf demande explicite.

```
Version optimisée : [NOM_PROJET]_V[N].html
Confirmée depuis  : HISTORIQUE_VERSIONS_[PROJET].txt
```

---

## Rôle

Tu es un expert en performance web et UX. Chaque amélioration doit être
justifiée, mesurable et conforme à `brand-guidelines.md`.

---

## Étape 1 — Performance

### Analyse du code
- Re-renders inutiles (React/Vue) : composants sans raison de se re-rendre
- Appels API redondants : mêmes données fetchées plusieurs fois
- Boucles coûteuses : calculs lourds dans le render sans mémoïsation
- Imports trop larges : bibliothèques entières importées pour une seule fonction
- Absence de lazy loading : composants lourds chargés inutilement au démarrage

### Analyse dans le navigateur
- DevTools → Performance → enregistrer le chargement
- First Contentful Paint (FCP) : objectif < 1.8s
- Time to Interactive (TTI) : objectif < 3.8s
- Network : ressources lourdes > 500KB à identifier

### Images et animations
- Images non compressées ou non dimensionnées (WebP recommandé)
- Animations CSS lourdes (préférer `transform` et `opacity`)
- Absence de `width`/`height` causant des layout shifts (CLS)

### Corrections à appliquer
- Ajouter `memo`, `useMemo`, `useCallback` si pertinent
- Remplacer les imports globaux par des imports ciblés
- Ajouter du lazy loading sur les routes ou composants lourds
- Optimiser les images identifiées comme trop lourdes

**Documenter avant/après** : taille bundle, nb requêtes, temps estimé.

---

## Étape 2 — Accessibilité (WCAG AA)

### Contrastes
- Texte normal : ratio ≥ 4.5:1
- Grands textes (> 18px ou 14px bold) : ratio ≥ 3:1
- Éléments UI (bordures, icônes actives) : ratio ≥ 3:1

### Tailles cibles mobile
- Zones cliquables : minimum 44×44px
- Espacement entre éléments adjacents : minimum 8px
- Champs de formulaire : hauteur minimum 44px

### Navigation clavier
- `Tab` : naviguer entre tous les éléments interactifs
- Focus **visible** à chaque étape (outline non supprimé)
- `Enter` / `Espace` : déclencher les boutons
- `Escape` : fermer les modales et menus

### Attributs
- Images : `alt` présent et descriptif (ou `alt=""` si décoratif)
- Formulaires : `<label>` ou `aria-label` sur chaque champ
- Boutons icon-only : `aria-label` descriptif
- Titres : hiérarchie `h1 → h2 → h3` cohérente

---

## Étape 2b — Mode sombre / Mode clair

Vérifier que chaque couleur est lisible dans les deux modes.
Basculer manuellement et inspecter chaque élément.

### Règle fondamentale
Zéro couleur codée en dur (`color: black`, `background: white`, `fill="#000"`).
Tout passe par des **variables CSS** ou classes `dark:` (Tailwind).

### Éléments à vérifier

| Élément | Mode clair | Mode sombre |
|---|---|---|
| Texte principal | Sombre sur fond clair | Clair sur fond sombre |
| Texte secondaire | Gris visible | Gris clair visible |
| Fonds de cartes | Blanc / gris très clair | Gris sombre (pas noir pur) |
| Champs de saisie | Fond blanc, texte noir | Fond gris foncé, texte clair |
| Bordures | Subtiles sur clair | Visibles sur sombre |
| Boutons primaires | Contraste fort | Même contraste en sombre |
| Icônes | Visibles sur clair | Visibles sur sombre |
| Placeholder | Gris lisible sur blanc | Gris clair sur gris sombre |
| Focus ring | Visible sur clair | Visible sur sombre |

### Pièges fréquents
- `color: inherit` → texte invisible dans un des modes
- `background: #fff` codé en dur → carte disparaît en sombre
- `border: 1px solid #eee` → invisible sur fond sombre
- SVG `fill="black"` ou `fill="white"` fixe
- Scrollbar non stylée

### Implémentation recommandée — Variables CSS

```css
:root {
  --color-text-primary   : #111111;
  --color-text-secondary : #555555;
  --color-bg-page        : #f5f5f5;
  --color-bg-card        : #ffffff;
  --color-bg-input       : #f9f9f9;
  --color-border         : #e0e0e0;
  --color-focus-ring     : #3b82f6;
}
[data-theme="dark"], .dark {
  --color-text-primary   : #f0f0f0;
  --color-text-secondary : #aaaaaa;
  --color-bg-page        : #111111;
  --color-bg-card        : #1e1e1e;
  --color-bg-input       : #2a2a2a;
  --color-border         : #3a3a3a;
  --color-focus-ring     : #60a5fa;
}
```

### Persistance du thème

```js
// Sauvegarde
localStorage.setItem('theme', 'dark');
// Restauration (avant le premier paint — évite le FOUC)
const saved = localStorage.getItem('theme') || 'light';
document.documentElement.classList.toggle('dark', saved === 'dark');
```

---

## Étape 3 — UX & Lisibilité

### Lisibilité
- Corps de texte : minimum 16px desktop, 14px mobile
- Longueur de ligne : 60–75 caractères (`max-width: 65ch`)
- Interligne : minimum 1.5 (`line-height: 1.5`)
- Hiérarchie typographique : titres, sous-titres, corps bien distincts

### Visibilité des actions
- Bouton CTA principal immédiatement identifiable
- Actions destructives clairement distinctes
- États visibles (actif, inactif, chargement, erreur)

### Améliorations UX (à proposer)
- Messages de feedback (confirmation, erreur, succès)
- États de chargement (skeleton, spinner)
- Messages d'erreur plus explicites et actionnables

---

## Étape 4 — Rapport avant/après

```
RAPPORT OPTIMIZE — [Projet] V[N]
Date : [JJ/MM/AAAA]

━━━━━━━━━━━━━━━━━━━━━━━━
PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━
Avant → Après
  Bundle size      : [X KB] → [Y KB]  ([−Z%])
  Requêtes réseau  : [N] → [M]
  Temps chargement : [Xs] → [Ys]
Améliorations :
  ✅ [Description] → [Fichier]

━━━━━━━━━━━━━━━━━━━━━━━━
ACCESSIBILITÉ
━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Contraste [élément] : [avant] → [après]  WCAG AA [✓/✗]
  ✅ Zone cliquable [bouton] : [avant] → [après]
  ✅ Focus visible rétabli sur [composant]

━━━━━━━━━━━━━━━━━━━━━━━━
MODE SOMBRE / MODE CLAIR
━━━━━━━━━━━━━━━━━━━━━━━━
Couleurs codées en dur remplacées : [N]
Persistance thème : [Présente / Ajoutée / Absente]
FOUC au rechargement : [Corrigé / Non détecté]
  ✅ [élément] — clair [X:1 ✓] / sombre [Y:1 ✓]
  ⚠️ [élément] — sombre [Y:1 ✗] → corrigé : [hex avant] → [hex après]

━━━━━━━━━━━━━━━━━━━━━━━━
UX & LISIBILITÉ
━━━━━━━━━━━━━━━━━━━━━━━━
Appliqué :
  ✅ [Description] → [Fichier:ligne]
Suggestions (décision produit) :
  💡 [Suggestion] → [Impact attendu]

━━━━━━━━━━━━━━━━━━━━━━━━
FICHIERS MODIFIÉS
━━━━━━━━━━━━━━━━━━━━━━━━
  - [fichier] — [type de modification]
```

---

## Étape 5 — Mise à jour obligatoire

Si des corrections ont été apportées, invoquer `Skills/managing-versions.md`
pour enregistrer la nouvelle version optimisée.

---

## Conseils d'utilisation

- Lancer après `/debug` : debug → optimize → audit
- Committer avant d'optimiser pour comparer le `git diff`
- Les suggestions UX non appliquées → consigner dans le backlog
- Relancer `Skills/audit-workflow.md` après optimisation pour valider
