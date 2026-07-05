---
name: descriptif-fonctionnel-universel
description: >
  Skill autonome et universel de génération et maintenance d'un descriptif
  fonctionnel exhaustif, sans aucun terme technique de code, utilisable sur
  n'importe quel projet quel que soit l'IDE, le langage ou l'environnement.

  Produit et maintient UN SEUL fichier : DESCRIPTIF_FONCTIONNEL_[PROJET].txt
  Ce fichier permet à n'importe quel développeur de recréer le programme
  à l'identique sans jamais voir le code source, uniquement en lisant le document.

  DÉCLENCHER CE SKILL dès que :
  - Un code source est fourni pour être documenté en langage naturel,
  - Un projet est décrit verbalement sans code existant,
  - Une nouvelle version d'un programme est livrée et le descriptif doit
    être mis à jour.

  Ce skill est AUTONOME : il n'a pas besoin des 5 fichiers Antigravity.
  Il gère uniquement le fichier DESCRIPTIF_FONCTIONNEL_[PROJET].txt.

  Règles absolues :
  - ZÉRO terme technique de code dans le contenu du fichier descriptif.
  - Tri VERSION DÉCROISSANT (V(N) toujours en premier).
  - Jamais écraser les versions antérieures — mode APPEND pour les blocs.
  - Date et heure = horodatage du fichier source livré (ou heure courante
    si aucun fichier source n'est fourni).
  - Exhaustivité totale : tout détail présent dans le code ou la description
    doit figurer dans le fichier.
---

# Descriptif Fonctionnel Universel — Skill Autonome

## 🎯 Objectif de ce skill

Produire et maintenir un **DESCRIPTIF_FONCTIONNEL_[PROJET].txt** qui permet
à n'importe quel développeur de recréer le programme de A à Z **sans jamais
voir le code source**, uniquement en lisant ce document.

Rédigé en langage de la vie quotidienne, avec des analogies de métiers
classiques (comptable, archiviste, chef de projet, contrôleur qualité...),
sans aucune syntaxe de programmation.

**Un seul fichier produit. Utilisable sur n'importe quel projet.**

---

## ════════════════════════════════════════════════════════════════════════
## PARTIE A — TROIS CAS D'ENTRÉE POSSIBLES
## ════════════════════════════════════════════════════════════════════════

### A.1 CAS 1 — Code source fourni (nouveau projet, V01)

```
ÉTAPE 1 — Lire le code intégralement
  → Analyser chaque comportement, chaque règle, chaque détail visuel.
  → Si un comportement est ambigu → poser la question avant de rédiger.

ÉTAPE 2 — Exposer le plan de rédaction
  → Lister les 6 étapes qui seront renseignées.
  → Signaler les zones d'ombre détectées dans le code.
  → Demander : "Ce plan te convient-il avant que je rédige ?"

ÉTAPE 3 — Rédiger le descriptif complet (6 étapes)
  → Respecter les contraintes absolues (Partie B).
  → Créer DESCRIPTIF_FONCTIONNEL_[PROJET].txt.

ÉTAPE 4 — Confirmer la création
  → Afficher la confirmation standard (Partie D).
```

---

### A.2 CAS 2 — Code source fourni (mise à jour, V(N))

```
ÉTAPE 1 — Lire l'ancienne et la nouvelle version du code
  → Identifier précisément ce qui a changé, étape par étape.
  → Si le fichier descriptif existe : le lire intégralement avant toute modification.

ÉTAPE 2 — Construire le journal des delta
  → Pour chacune des 6 étapes, noter :
    "Aucun changement" ou décrire précisément ce qui a évolué.

ÉTAPE 3 — Mettre à jour le fichier
  → Insérer le bloc V(N) EN TÊTE (tri décroissant).
  → Le bloc contient : journal des delta + état complet mis à jour des 6 étapes.
  → Mettre à jour l'index des versions (tableau en tête de fichier).
  → Les blocs des versions antérieures restent intacts, mot pour mot.

ÉTAPE 4 — Confirmer la mise à jour
  → Afficher la confirmation standard (Partie D).
```

---

### A.3 CAS 3 — Démarrage de zéro (aucun code existant)

```
ÉTAPE 1 — Annoncer la démarche
  → "Je vais te poser des questions étape par étape pour construire
    le descriptif fonctionnel de ton projet. On avance ensemble,
    section par section. Maximum 3 questions à la fois."

ÉTAPE 2 — Interview structurée (voir Partie C)
  → Poser les questions dans l'ordre des 6 étapes.
  → Reformuler chaque réponse et demander confirmation avant de continuer.

ÉTAPE 3 — Rédiger au fur et à mesure
  → Créer le fichier dès que la première étape est validée.
  → Compléter progressivement à chaque réponse validée.
  → Marquer [À COMPLÉTER] les sections en attente.

ÉTAPE 4 — Valider chaque étape
  → Après chaque étape rédigée : "Est-ce que cette description correspond
    exactement à ce que tu imagines ? Des ajustements ?"
```

---

## ════════════════════════════════════════════════════════════════════════
## PARTIE B — CONTRAINTES ABSOLUES DE RÉDACTION
## ════════════════════════════════════════════════════════════════════════

### B.1 Règle ZÉRO CODE — Non négociable

Aucun des éléments suivants n'est autorisé dans le contenu du fichier :

```
INTERDIT absolument :
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
      "gris perle très clair" plutôt que "#f5f5f5"
```

### B.2 Règle d'EXHAUSTIVITÉ — Non négociable

```
Tout ce qui est dans le code ou dans la description fournie DOIT être dans
le descriptif. Aucun détail ne peut être omis, même s'il semble mineur :

  - Une couleur précise              → la décrire avec des mots
  - Une animation                    → sa direction, sa durée, son déclencheur
  - Une mise en majuscule auto       → la signaler explicitement
  - Un arrondi de chiffre            → préciser à combien de décimales
  - Un message d'erreur              → le citer mot pour mot entre guillemets
  - Un comportement par défaut       → le décrire même s'il semble évident
  - Un élément fixe au défilement    → le mentionner
  - Un champ ignoré par la recherche → le nommer explicitement
  - Une colonne volontairement vide  → l'indiquer et expliquer pourquoi

TEST QUALITÉ OBLIGATOIRE :
  Avant de livrer le descriptif, se poser la question :
  "Un développeur peut-il recréer ce programme à l'identique uniquement
  en lisant ce texte, sans voir le code source ?"
  Si la réponse est non → approfondir avant de livrer.
```

### B.3 Règle ORTHOGRAPHE ET TYPOGRAPHIE FRANÇAISE

```
  - Accents et signes diacritiques OBLIGATOIRES (é, è, ê, à, ù, ô, î, ï, ç)
  - Grammaire et accords vérifiés avant chaque phrase écrite dans le fichier
  - Encodage UTF-8 obligatoire pour le fichier .txt
  - Aucun mot tronqué, aucune abréviation non standard
  - Relire mentalement chaque phrase générée pour détecter les fautes
```

### B.4 Règle SOURCE DE LA DATE

```
Priorité de lecture pour la date et l'heure à inscrire :
  1. Horodatage de dernière modification du fichier source livré (.html, .py, etc.)
  2. Commentaire de version dans le fichier source (ex: "Version : V02 — 15/06/2026")
  3. Date et heure système courantes (uniquement si aucun fichier source n'est fourni)

Cette date est appliquée de manière identique à toutes les occurrences
dans le fichier descriptif (en-tête, index, bloc de version).
```

---

## ════════════════════════════════════════════════════════════════════════
## PARTIE C — GUIDE D'INTERVIEW (CAS 3 — DÉMARRAGE DE ZÉRO)
## ════════════════════════════════════════════════════════════════════════

### C.1 Séquence d'interview obligatoire

Poser les questions dans cet ordre. Ne pas passer à l'étape suivante
avant d'avoir des réponses validées sur l'étape en cours.
Maximum 3 questions à la fois. Reformuler chaque réponse et confirmer.

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
  · "Y a-t-il des dates ou des chiffres ? Dans quel format exact sont-ils attendus ?"

ÉTAPE 3 — Tri et organisation interne
  · "Dans quel ordre le programme doit-il ranger les informations
    avant de les afficher ?"
  · "S'il y a des groupes ou des catégories : comment sont-ils ordonnés
    entre eux, et comment les éléments sont-ils ordonnés à l'intérieur ?"
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

### C.2 Règles de conduite de l'interview

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

## ════════════════════════════════════════════════════════════════════════
## PARTIE D — TEMPLATE DU FICHIER DESCRIPTIF_FONCTIONNEL_[PROJET].txt
## ════════════════════════════════════════════════════════════════════════

### D.1 En-tête global du fichier (créé une seule fois)

```
====================================================================================================================================
                    DESCRIPTIF FONCTIONNEL COMPLET — [NOM PROJET EN MAJUSCULES]
====================================================================================================================================
Date de création     : [JJ/MM/AAAA à HH:MM]
Projet               : [Nom du projet]
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

### D.2 Template de bloc de version (répété pour chaque V(N), tri décroissant)

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

 Comportement des éléments :
  - Au survol de la souris : changement de couleur, effet de relief, soulignement...
  - À l'ouverture : apparition immédiate, fondu progressif, glissement depuis un bord...
  - À la fermeture : disparition immédiate, fondu, glissement...

 Animations :
  - Déclencheur (clic, survol, chargement de page, temporisateur...)
  - Direction (de gauche à droite, de bas en haut...)
  - Durée approximative (très rapide — moins d'une demi-seconde, lente — plus d'une seconde...)

 Éléments fixes lors du défilement de la page :
  - Nommer chaque élément qui reste visible en permanence.

 Mise en page générale :
  - Nombre de colonnes visibles, alignement des textes (gauche, centré, droite).
  - Espacements caractéristiques entre les blocs.

 Typographie :
  - Taille relative des textes (grand titre, titre moyen, texte courant, petite note).
  - Graisse (épais/gras, fin/léger, normal).
  - Couleur du texte selon le contexte (texte normal, texte d'erreur, texte désactivé).
  - Mise en majuscule automatique si applicable.]

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
ÉTAPE 2 — STRUCTURE EXACTE DES DONNÉES D'ENTRÉE
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

[Décrire tout ce que le programme reçoit comme information.

 Si fichier importé :
  - Nombre exact de colonnes.
  - Nom exact de chaque colonne, dans l'ordre de gauche à droite.
  - Format des dates (ex: jour/mois/année séparés par des barres obliques).
  - Format des nombres (virgule ou point pour les décimales, séparateur de milliers).
  - Encodage du fichier (ex: caractères internationaux acceptés ou non).
  - Présence d'une ligne d'en-tête : lue ou ignorée par le programme.

 Si saisie manuelle :
  - Chaque champ attendu avec son libellé exact.
  - Type de contenu (texte libre, nombre, date, choix dans une liste...).
  - Longueur minimale et maximale autorisée.

 Valeurs par défaut :
  - Que se passe-t-il si une information est absente ?
  - Valeur de remplacement utilisée automatiquement.

 Transformations à la lecture :
  - Tout ce que le programme recalcule ou réinterprète à l'entrée.
    (ex: un montant négatif est traité comme un remboursement,
         une date sans heure est complétée à minuit,
         un texte en minuscules est converti en majuscules automatiquement)]

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
ÉTAPE 3 — LOGIQUE DE TRI ET D'ORGANISATION INTERNE
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

[Décrire comment les données sont rangées avant toute affichage.

 Hiérarchie de tri complète :
  - Niveau 1 : trié d'abord par [critère], dans le sens [croissant/décroissant/alphabétique].
  - Niveau 2 : à critère égal sur le niveau 1, trié ensuite par [critère].
  - Niveau 3 : à égalité sur les niveaux 1 et 2, trié enfin par [critère].

 Regroupements :
  - Si les éléments sont regroupés en catégories : décrire la logique de regroupement.
  - Ordre des catégories entre elles.
  - Ordre des éléments à l'intérieur de chaque catégorie.

 Numérotation automatique :
  - Si le programme attribue des numéros automatiquement : décrire précisément
    à quel moment la numérotation commence (à 1 ou à 0),
    à quel moment elle repart à zéro (changement de groupe, nouvelle page...),
    et sur quelle base elle progresse (de 1 en 1, par dizaines...).]

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
ÉTAPE 4 — CONTRÔLES ET RÈGLES MÉTIER
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

[Pour chaque règle de vérification, décrire les quatre points suivants :

  1. CE QUI EST MESURÉ OU COMPARÉ
     (ex: "la somme de toutes les lignes d'un groupe est comparée au total affiché en tête")

  2. LE SEUIL EXACT OU LA CONDITION EXACTE DE DÉCLENCHEMENT DE L'ERREUR
     (ex: "si la différence entre les deux montants dépasse 0,001",
           "si le champ contient exactement 0 caractères",
           "si la date saisie est antérieure à aujourd'hui")

  3. LE MESSAGE EXACT AFFICHÉ À L'UTILISATEUR
     (citer le texte mot pour mot entre guillemets :
      ex: "Le montant total ne correspond pas à la somme des lignes.")

  4. LA RÈGLE DE CONTAMINATION
     (ex: "si une seule ligne d'un groupe est en erreur, toutes les lignes
           du groupe sont surlignées en rouge, même celles qui sont correctes")

 Ordre de priorité si plusieurs règles s'appliquent au même élément :
  (ex: "la règle sur le format est vérifiée avant la règle sur la valeur maximale")]

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
ÉTAPE 5 — INTERACTIONS UTILISATEUR ET CAS PARTICULIERS
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

[Décrire chaque action que l'utilisateur peut effectuer.

 Actions disponibles :
  - Clic simple : sur quoi, et quel effet immédiat.
  - Double-clic : sur quoi, et quel effet distinct du clic simple.
  - Frappe au clavier : quels raccourcis, quels effets.
  - Glisser-déposer : quels éléments peuvent être déplacés, vers où.
  - Filtre : sur quels champs porte-t-il, lesquels sont ignorés.
  - Tri par colonne : quelles colonnes permettent le tri, dans quel ordre.

 Mécanismes de recherche :
  - Champs dans lesquels la recherche est active (nommer chacun).
  - Champs qui sont ignorés par la recherche (nommer chacun).
  - Sensibilité à la casse (majuscules/minuscules distinguées ou non).
  - Recherche partielle (le mot "mars" trouve "marseille") ou exacte uniquement.

 Transformations automatiques lors de la saisie :
  - Mise en majuscules forcée.
  - Format imposé (ex: date reformatée automatiquement).
  - Caractères refusés à la frappe (lettres dans un champ de chiffres...).
  - Caractères remplacés automatiquement.

 Comportements en cas de saisie invalide :
  - Blocage immédiat à la frappe.
  - Correction silencieuse sans avertissement.
  - Message d'avertissement affiché (citer le texte entre guillemets).
  - Surlignage ou coloration du champ concerné.

 Cas limites documentés :
  - Que se passe-t-il si un champ obligatoire est laissé vide ?
  - Que se passe-t-il si la valeur est au maximum autorisé ?
  - Que se passe-t-il si l'utilisateur tente une action non autorisée ?]

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
ÉTAPE 6 — STRUCTURE EXACTE DES DONNÉES DE SORTIE
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

[Décrire tout ce que le programme produit.

 Si affichage à l'écran : décrire la disposition des résultats (voir étape 1
 pour le visuel, ici se concentrer sur le contenu et sa logique d'affichage).

 Si fichier exporté :
  - Nom du fichier : fixe (toujours le même nom) ou dynamique (contient la date,
    le nom du projet, un numéro...). Donner le modèle exact du nom.
  - Format du fichier et encodage.
  - Nombre de colonnes, dans l'ordre exact de gauche à droite :
      · Nom exact de la colonne (libellé de l'en-tête).
      · Type de contenu (texte, nombre, date, formule calculée...).
      · Source de la donnée (issue de l'entrée, calculée, constante...).
      · Arrondi appliqué (à combien de décimales, quelle règle d'arrondi).
  - Colonnes volontairement vides : lesquelles et pourquoi.
  - Lignes supprimées avant l'export : critère de suppression précis.
  - Calculs intégrés dans le fichier produit :
      (ex: "la dernière ligne contient la somme de toutes les lignes
            au-dessus dans chaque colonne numérique")
  - Nombre total de lignes attendu selon les données d'entrée.

************************************************************************************************************************************
```

### D.3 Règles critiques du fichier descriptif

```
1.  Tri décroissant : V(N) toujours en premier sous l'en-tête global.
2.  Index des versions : mis à jour à chaque nouvelle version (tableau en tête).
3.  Intégrité absolue : les blocs des versions antérieures ne sont jamais modifiés.
4.  ZÉRO terme de code : relire chaque phrase avant de l'écrire dans le fichier.
5.  Exhaustivité : si un détail est dans le code, il est dans le descriptif.
6.  Sections incomplètes : marquer [À COMPLÉTER — raison] plutôt que laisser vide.
7.  Pas de markdown : .txt pur, encodage UTF-8 uniquement.
8.  Date = horodatage du fichier livré (ou heure courante si aucun fichier source).
9.  Test qualité : relire en se demandant "un développeur peut-il recréer
    ce programme uniquement avec ce texte, sans voir le code source ?"
10. Mode APPEND strict : insérer les nouveaux blocs en tête, ne jamais
    réécrire intégralement le fichier à chaque mise à jour.
```

---

## ════════════════════════════════════════════════════════════════════════
## PARTIE E — CONFIRMATIONS STANDARDS
## ════════════════════════════════════════════════════════════════════════

**Création (V01) :**

```
✅ Fichier créé — DESCRIPTIF_FONCTIONNEL_[PROJET].txt — V01
   · Date/heure source : [JJ/MM/AAAA à HH:MM]
   · Étapes renseignées : [liste des étapes complètes]
   · Sections en attente : [liste des [À COMPLÉTER] ou "Aucune"]
   · Test qualité : [résultat — "Recréation complète possible" ou anomalies signalées]
```

**Mise à jour (V(N)) :**

```
✅ Fichier mis à jour — DESCRIPTIF_FONCTIONNEL_[PROJET].txt — V[N]
   · Date/heure source : [JJ/MM/AAAA à HH:MM]
   · Bloc V[N] inséré en tête (tri décroissant respecté)
   · Étapes modifiées : [liste ou "Aucune"]
   · Étapes inchangées : [liste]
   · Sections en attente : [liste des [À COMPLÉTER] ou "Aucune"]
   · Index des versions : mis à jour
```

**Si anomalie détectée :**

```
   [⚠] ANOMALIE DÉTECTÉE :
       - [description : contradiction, ambiguïté, information manquante]
       - [action : question posée / correction appliquée / attente de confirmation]
```

---

## ════════════════════════════════════════════════════════════════════════
## PARTIE F — POINTS COMPLÉMENTAIRES
## ════════════════════════════════════════════════════════════════════════

### F.1 Gestion des contradictions entre code et descriptif existant

```
Si le nouveau code contredit une description existante dans le fichier :
  → Signaler avant toute modification :
    "[⚠] CONTRADICTION :
     Le descriptif V[N-1] indique [ancienne description].
     Le nouveau code indique [nouvelle description].
     Confirmes-tu que ce comportement a bien changé ?"
  → Attendre confirmation avant de mettre à jour.
  → Documenter dans le journal des delta de V(N).
```

### F.2 Niveau de granularité selon l'ampleur des changements

```
Changement mineur (couleur, marge, libellé d'un bouton) :
  → Renseigner uniquement l'étape concernée dans le journal des delta.
  → Mettre à jour uniquement la sous-section impactée dans l'état complet.

Changement majeur (nouveau module, refonte d'une règle, nouveau formulaire) :
  → Renseigner toutes les étapes potentiellement impactées.
  → Vérifier les dépendances : une règle métier peut impacter simultanément
    le visuel (étape 1), les interactions (étape 5) et la sortie (étape 6).

Refonte totale :
  → Traiter comme une nouvelle création : rédiger les 6 étapes complètes.
  → Indiquer dans le journal des delta : "Refonte complète — voir état V[N]".
```

### F.3 Signalement des sections incomplètes en fin de session

```
Toujours terminer par un bilan explicite :

"⚠ Sections encore en attente dans le DESCRIPTIF_FONCTIONNEL_[PROJET].txt :
   · Étape [N] — [nom de la section] : [raison de l'absence de l'information]
   · Étape [N] — [nom de la section] : [raison]
  Pour compléter ces sections : [question directe à poser à l'utilisateur]"

Si toutes les sections sont complètes :
"✔ Toutes les sections sont renseignées. Le descriptif est complet."
```

### F.4 Compatibilité avec d'autres outils de documentation

```
Ce skill est autonome et ne dépend d'aucun autre fichier de suivi.
Il peut coexister avec :
  - Des fichiers README existants (ne pas les remplacer — ils sont complémentaires)
  - Des wikis ou bases de connaissances (le descriptif peut être copié-collé)
  - Des outils de ticketing (référencer le numéro de version dans les tickets)

Le fichier DESCRIPTIF_FONCTIONNEL_[PROJET].txt est la seule source de vérité
fonctionnelle non technique du projet. En cas de contradiction avec d'autres
documents, signaler la contradiction et demander à l'utilisateur de trancher.
```

---

## ════════════════════════════════════════════════════════════════════════
## PARTIE G — GUIDE D'INSTALLATION ET D'UTILISATION
## ════════════════════════════════════════════════════════════════════════

### G.1 Installation

Ce skill est autonome. Pour l'activer dans une session :

```
Instruction à donner à l'agent en début de session :
"Lis le fichier descriptif-fonctionnel-universel.md et applique-le
 pour documenter ce projet."
```

### G.2 Workflow utilisateur type

```
[UTILISATEUR]  → Fournit un code source, une description verbale, ou demande une MAJ
[AGENT]        → Identifie le cas (CAS 1 / CAS 2 / CAS 3)
[AGENT]        → Pose les questions manquantes si nécessaire (interview CAS 3)
[AGENT]        → Expose le plan de rédaction et demande validation
[UTILISATEUR]  → Valide ("Oui", "Go", corrections...)
[AGENT]        → Rédige ou met à jour le fichier descriptif
[AGENT]        → Affiche la confirmation standard (Partie E)
```

### G.3 Nommage du fichier

```
Modèle : DESCRIPTIF_FONCTIONNEL_[NOM_PROJET].txt

  - [NOM_PROJET] = nom du dossier racine du projet, en majuscules.
  - Remplacer les espaces par des tirets bas : MON_PROJET.
  - Si ambiguïté sur le nom → demander à l'utilisateur avant de créer.
  - Exemple : DESCRIPTIF_FONCTIONNEL_GESTION_STOCK.txt
```

### G.4 Checklist "Zero-Day" — Premier usage

```
  - [ ] Identifier le nom du projet
  - [ ] Déterminer le cas d'entrée (code fourni / démarrage de zéro)
  - [ ] Si code fourni : lire intégralement avant toute rédaction
  - [ ] Si démarrage de zéro : lancer l'interview (Partie C)
  - [ ] Exposer le plan et obtenir validation
  - [ ] Créer le fichier DESCRIPTIF_FONCTIONNEL_[PROJET].txt
  - [ ] Vérifier le test qualité (recréation complète possible ?)
  - [ ] Afficher la confirmation et lister les sections en attente
```

---

*Skill version : 1.0 — Skill autonome et universel*
*Portée : tout projet, tout IDE, tout langage*
*Fichier produit : DESCRIPTIF_FONCTIONNEL_[PROJET].txt — un seul fichier*
