# Conception Détaillée : Module "Revue / Révision Comptable"

**Projet :** ERP ComptaExpert
**Inspiration :** Modèle ACD (Fichier : `Révision ACD.JPG`)
**Objectif :** Concevoir un module de révision comptable complet, ergonomique et professionnel pour accompagner l'expert-comptable ou le collaborateur dans le contrôle et la validation des comptes annuels.

---

## 1. Philosophie et Architecture UI/UX

Le module "Revue / Révision" est conçu comme un tableau de bord global de fin d'exercice. Il permet de parcourir la balance de manière structurée (par cycles de révision), d'y apposer des notes, de soulever des points en suspens, et de valider les comptes via un système de "Visas" (Collaborateur / Superviseur).

### Découpage Zonal de l'Interface
L'interface est divisée en **5 grandes zones interactives** :
1. **Panneau Latéral Gauche :** Situation globale et Arbre des Cycles de Révision.
2. **Grille Centrale :** La liste des comptes filtrés, avec leurs statuts de visas et soldes comparatifs.
3. **Menu Contextuel (Clic-droit) :** L'arsenal d'outils rapides pour agir sur un compte spécifique.
4. **Panneau Inférieur Gauche (Détails) :** Saisie des notes, gestion des points en suspens et synthèse de progression.
5. **Panneau Inférieur Droit (Filtres Avancés) :** Filtres d'affichage rapides (exclus les comptes révisés, soldés, etc.).

---

## 2. Spécifications Fonctionnelles par Zone

### ZONE 1 : Panneau Latéral (Pilotage & Cycles)
*Ce panneau permet de naviguer intelligemment dans les comptes sans être submergé par la balance complète.*

*   **Bloc "Situation" :**
    *   **Date de révision :** Affichage de la date d'arrêté (ex: 31/12/2022).
    *   **Actions rapides :** Boutons `Initialisation...`, `Ctrl cohérence...`, `Ctrl inventaire...`.
    *   **Arrêter la balance :** Boutons radios permettant de basculer entre les données "à la date de clôture" et "à la date de révision".
    *   **Indicateur financier :** Affichage dynamique du "Bénéfice" ou de la "Perte" en temps réel.
*   **Bloc "Cycles de révision" :**
    *   Affichage sous forme d'arborescence (Tree-view).
    *   Ligne "Tous" avec un pourcentage global d'avancement (ex: 87%).
    *   Liste standardisée des cycles (A à N), par exemple :
        *   `A - Régularité formelle`
        *   `B - Trésorerie / finances`
        *   `C - Achats / Fournisseurs`
        *   `D - Charges externes`
        *   ...
        *   `J - Capitaux et Provisions`
    *   **Indicateurs visuels :** Chaque cycle affiche une icône de validation (coche verte) si 100% des comptes sont révisés, et son pourcentage d'avancement.
    *   **Filtres d'arbre :** Cases à cocher en bas pour `Masquer les cycles sans comptes mouvementés`.

### ZONE 2 : Grille Centrale (Tableau des Comptes)
*Le cœur du module. Il affiche les comptes appartenant au cycle sélectionné dans la Zone 1.*

*   **Onglets supérieurs :** `Tous` | `Clients` | `Fournisseurs`. Permet de basculer rapidement la vue sur les comptes de tiers.
*   **Colonnes de la DataGrid :**
    1.  **Cyc :** Lettre du cycle auquel le compte est rattaché (ex: J, B, G).
    2.  **N° de compte :** Numéro du compte général (ex: 10100000).
    3.  **Intitulé :** Nom du compte (ex: CAPITAL SOCIAL).
    4.  **Indicateurs visuels (Nt, G.) :** Petites icônes indiquant la présence d'une Note (`Nt`) ou d'un document GED (`G.`).
    5.  **Visas de validation (CRUCIAL) :**
        *   **Collab. :** Nom de l'utilisateur ayant posé le visa de "Révision" (ex: ADMIN) et une encoche visuelle.
        *   **Superv. :** Nom de l'utilisateur ayant posé le visa de "Supervision" (ex: ADMIN) et une encoche visuelle.
    6.  **Soldes comparatifs :** `Solde N` (Année en cours), `Solde N-1`, `Solde N-2`, `Solde N+1`.

### ZONE 3 : Menu Contextuel et Raccourcis (Actions sur un Compte)
*Au clic-droit sur une ligne de compte de la grille, un menu puissant s'ouvre, évitant de changer d'écran.*

*   **Visas :** `Basculer visa de révision (Ctrl+R)`, `Basculer visa de supervision (Ctrl+S)`.
*   **Navigation :** `Révision mode grand livre`, `Ouvrir mode grand livre dans une nouvelle fenêtre (Ctrl+L)`.
*   **Édition :** `Saisie des écritures (F10)`, `Recherche d'écritures (Ctrl+H)`.
*   **Paramétrage :** `Plan comptable (F4)`, `Modification de l'intitulé (F2)`.
*   **Documentation :** `Notes sur le compte (Ctrl+N)`, `Documents G.E.D sur le compte (Ctrl+D)`.
*   **Autres :** `Transfert de compte (Ctrl+T)`, `Ventilation analytique (F9)`.

### ZONE 4 : Panneau Inférieur (Notes, Statuts et Avancement)
*Zone de travail active pour la documentation de la révision.*

*   **Onglets de Notes :** `Note (N)` (texte libre pour justifier le solde), `Note de calcul (N)` (tableaux ou formules).
*   **Statuts du compte :** Cases à cocher :
    *   `Point en suspens` (Alerte bloquante pour la supervision).
    *   `Réglé` (Point en suspens résolu).
    *   `Permanente` (Note reconduite l'année suivante).
*   **Barre de progression globale :** Un bloc visuel très clair affichant par exemple : `158 comptes révisés sur 181 (87%)`.

### ZONE 5 : Filtres de Positionnement (Bas Droite)
*Des filtres rapides sous forme de cases à cocher pour épurer la grille et se concentrer sur l'essentiel.*

*   `Eviter comptes soldés` (Masque les comptes avec solde = 0).
*   `Eviter comptes révisés` (Masque les comptes ayant déjà le visa "Collab.").
*   `Eviter comptes supervisés` (Masque les comptes ayant déjà le visa "Superv.").
*   `Eviter comptes non mouvementés` (Masque les comptes sans écritures sur l'exercice).
*   `Uniquement point en suspens` (Filtre strict pour ne traiter que les problèmes).

---

## 3. Modélisation des Données (Data Structure & JSON)

Pour implémenter cette logique dans le `store` (Zustand ou objet JSON) de ComptaExpert, la structure de données des comptes dans la balance doit être enrichie avec des propriétés de "Révision" :

```json
{
  "comptes": [
    {
      "compte": "10100000",
      "intitule": "CAPITAL SOCIAL",
      "solde_n": -30000.00,
      "solde_n_1": -20000.00,
      
      // -- Nouvelles métadonnées de Révision --
      "revision": {
        "cycle_id": "J",
        "visa_collab": {
          "status": true,
          "user": "ADMIN",
          "date": "2023-02-15T10:30:00Z"
        },
        "visa_superv": {
          "status": false,
          "user": null,
          "date": null
        },
        "note_texte": "Le capital correspond à l'extrait Kbis, aucune variation.",
        "note_permanente": true,
        "point_en_suspens": false,
        "point_regle": true,
        "documents_ged": ["kbis_2022.pdf"]
      }
    }
  ]
}
```

---

## 4. Logiques Métier & Règles de Gestion

1.  **Hiérarchie des Visas :** Le `visa_superv` (Supervision) ne peut généralement être apposé que si le `visa_collab` (Révision) est déjà présent. Si le visa de supervision est posé, il verrouille automatiquement le compte contre de nouvelles modifications d'écritures (sauf droit exceptionnel).
2.  **Calcul des Pourcentages :**
    *   **Avancement d'un Cycle (%) :** `(Nombre de comptes avec visa_collab dans le Cycle) / (Nombre total de comptes rattachés au Cycle et ayant un solde non nul) * 100`.
    *   **Avancement Global (%) :** Somme des comptes révisés de tous les cycles sur le total des comptes à réviser.
3.  **Liaison des Cycles et Racines :**
    *   Le paramétrage global de l'ERP doit permettre d'associer des racines de comptes à des cycles.
    *   Exemple : Racine `401` -> Cycle `C - Achats / Fournisseurs`.
    *   Racine `512` -> Cycle `B - Trésorerie`.
4.  **Points en suspens :** Un compte marqué avec un "Point en suspens" non "Réglé" doit remonter dans une vue globale "Synthèse des points en suspens" et bloquer idéalement l'édition de la liasse fiscale finale (alerte bloquante).

---

## 5. UI/UX "Vibe Coding" pour ComptaExpert V26+

Pour l'implémentation dans ComptaExpert, l'UI devra respecter les standards modernes déjà mis en place :
*   **Tableaux DataGrid :** Utiliser des grilles virtuelles fluides pour supporter des milliers de comptes sans ralentissement.
*   **Couleurs des Visas :**
    *   Visa Collaborateur : Badge Bleu / Icône Check Bleu.
    *   Visa Superviseur : Badge Vert / Double Check Vert.
*   **Raccourcis Claviers (Hotkeys) :** Implémenter des listeners globaux pour `Ctrl+R` et `Ctrl+S` afin que l'expert puisse valider les lignes à la chaîne sans utiliser la souris.
*   **Thème Sombre / Clair :** Assurer un haut contraste pour les cellules de montants et les statuts de visas, car ce module est utilisé de manière intensive visuellement.
