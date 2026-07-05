
# 📋 CAHIER DES CHARGES FINAL — APPLICATION COMPTABLE TUNISIENNE
## Version 1.0 — Mai 2026

---

## 1. PRÉSENTATION GÉNÉRALE

### 1.1 Objectif
Développer une application comptable web **100% hors ligne (PWA)**, mono-utilisateur par session, 
multi-sociétés (fichier JSON séparé par client), multi-exercices, respectant le **Plan Comptable Tunisien (SYSCOHADA révisé)**.

### 1.2 Architecture Technique
| Aspect | Choix | Justification |
|--------|-------|---------------|
| **Stockage** | localStorage + IndexedDB + Export JSON | Simplicité, hors ligne, portabilité |
| **Framework** | React 18 + TypeScript | Composants réutilisables, typage fort |
| **Style** | Tailwind CSS + shadcn/ui | Design system cohérent, mode sombre/clair |
| **PWA** | Service Worker + Manifest | Fonctionnement 100% hors ligne |
| **Export** | SheetJS (xlsx) + JSON | Compatibilité Excel, sauvegarde horodatée |
| **Graphiques** | Recharts | Tableau de bord interactif |

### 1.3 Philosophie Design
**Inspiration Apple** : Interface épurée, espacement généreux, typographie San Francisco/Inter, 
animations subtiles, mode sombre/clair système.

---

## 2. GESTION DES DOSSIERS (SOCIÉTÉS)

### 2.1 Structure par Dossier
Chaque client = **un fichier JSON indépendant** stocké dans un dossier local (File System Access API).

**Fichier :** `{code_societe}_{raison_sociale}_{date_creation}.json`

### 2.2 Table `SOCIETE`
| Champ | Type | Description |
|-------|------|-------------|
| `id` | UUID | Identifiant unique |
| `code` | VARCHAR(20) | Code dossier (ex: CLI001) |
| `raison_sociale` | VARCHAR(255) | Nom de la société |
| `forme_juridique` | VARCHAR(50) | SA, SARL, SARL AU, etc. |
| `mf` | VARCHAR(20) | Matricule fiscal |
| `rc` | VARCHAR(50) | Registre du commerce |
| `adresse` | TEXT | Adresse complète |
| `devise_base` | VARCHAR(3) | TND par défaut |
| `multi_devise` | BOOLEAN | Activation multidevise |
| `date_debut_exercice` | DATE | Début exercice |
| `date_fin_exercice` | DATE | Fin exercice |
| `regime_tva` | VARCHAR(20) | Réel, forfaitaire, suspension |
| `type_comptabilite` | VARCHAR(20) | Générale, développée, simplifiée |
| `logo` | BASE64 | Logo pour entête d'édition |
| `actif` | BOOLEAN | Dossier actif |

---

## 3. GESTION DES UTILISATEURS & SÉCURITÉ

### 3.1 Table `UTILISATEUR`
| Champ | Type | Description |
|-------|------|-------------|
| `id` | UUID | Identifiant |
| `login` | VARCHAR(50) | Identifiant unique |
| `password` | VARCHAR(255) | **Hash bcrypt** (simple mais sécurisé) |
| `nom` | VARCHAR(100) | Nom |
| `prenom` | VARCHAR(100) | Prénom |
| `email` | VARCHAR(100) | Email |
| `role` | VARCHAR(20) | `admin`, `comptable`, `saisie`, `lecture` |
| `droits` | JSON | Droits granulaires par module |
| `actif` | BOOLEAN | Compte actif |
| `derniere_connexion` | TIMESTAMP | Dernière connexion |

### 3.2 Authentification
- **Login** : Comparaison bcrypt côté client (dans le worker)
- **Session** : Stockée en mémoire (`sessionStorage`), pas de token
- **Déconnexion** : Réinitialisation variable + retour écran login
- **Timeout** : Déconnexion auto après 30 min d'inactivité

### 3.3 Journal d'Audit (`AUDIT_LOG`)
| Champ | Description |
|-------|-------------|
| `timestamp` | ISO string |
| `utilisateur` | Login |
| `action` | CREATE, UPDATE, DELETE, VALIDATE, PRINT, EXPORT |
| `module` | Plan comptable, Saisie, Lettrage, RAN, Édition... |
| `entity_type` | Table concernée |
| `entity_id` | ID de l'entité |
| `old_value` | JSON (avant) |
| `new_value` | JSON (après) |
| `description` | Texte libre |

**Règles :**
- Toute action critique est tracée
- Visualisation : Timeline filtrable (utilisateur, module, date, recherche texte)
- Limitation : 500 dernières entrées affichées (performance DOM)
- **Pas de suppression** : Les logs sont immuables

---

## 4. PLAN COMPTABLE & PARAMÉTRAGE AVANCÉ

### 4.1 Plan Comptable Standard Tunisien
**Préchargé** : Plan comptable SYSCOHADA révisé (classes 1-7) avec libellés officiels.

### 4.2 Table `COMPTE`
| Champ | Type | Description |
|-------|------|-------------|
| `id` | UUID | Identifiant |
| `numero` | VARCHAR(20) | N° compte (401000, 512000...) |
| `libelle` | VARCHAR(255) | Libellé officiel |
| `libelle_court` | VARCHAR(50) | Abrégé |
| `classe` | INT | Classe 1-7 |
| `type` | VARCHAR(20) | Actif, Passif, Charge, Produit |
| `nature_solde` | VARCHAR(10) | Débiteur, Créditeur, Solde |
| `niveau` | INT | 1=classe, 2=rubrique, 3=compte, 4=sous-compte |
| **collectif** | BOOLEAN | Compte collectif (clients/fournisseurs) |
| **lettrable** | BOOLEAN | Lettrage autorisé |
| **rapprochable** | BOOLEAN | Rapprochement bancaire |
| **report_ran** | VARCHAR(10) | `detail` (toutes lignes) ou `solde` (1 ligne) |
| **contrepartie_auto** | VARCHAR(20) | Compte de contrepartie automatique |
| `devise_compte` | VARCHAR(3) | Devise du compte |
| `rubrique_bilan` | VARCHAR(50) | Lien état financier |
| `rubrique_cr` | VARCHAR(50) | Lien compte de résultat |
| `rubrique_liasse` | VARCHAR(50) | Code liasse fiscale |
| `sens_solde_etat` | VARCHAR(10) | Débit, Crédit, Solde absolu |
| `mouvement_etat` | VARCHAR(20) | Mouvement attendu |
| `bloque` | BOOLEAN | Interdit en saisie |
| `actif` | BOOLEAN | Compte actif |

### 4.3 Interface de Paramétrage
- **Arborescence** : Classes → Rubriques → Comptes → Sous-comptes
- **Recherche** : Par numéro, libellé, classe
- **Import/Export** : Excel/CSV du plan comptable
- **Duplication** : Copier plan comptable entre sociétés

---

## 5. GESTION DES TIERS (AUXILIAIRES)

### 5.1 Table `TIERS`
| Champ | Type | Description |
|-------|------|-------------|
| `id` | UUID | Identifiant |
| `code` | VARCHAR(20) | Code unique tiers |
| `compte_collectif` | VARCHAR(20) | Compte lié (401, 411, 421...) |
| `type` | VARCHAR(20) | Client, Fournisseur, Employé, Autre |
| `raison_sociale` | VARCHAR(255) | Nom |
| `nom_contact` | VARCHAR(100) | Contact principal |
| `adresse` | TEXT | Adresse |
| `ville` | VARCHAR(100) | Ville |
| `pays` | VARCHAR(100) | Pays |
| `telephone` | VARCHAR(20) | Téléphone |
| `email` | VARCHAR(100) | Email |
| `mf` | VARCHAR(20) | Matricule fiscal |
| `rc` | VARCHAR(50) | Registre commerce |
| `rib` | VARCHAR(40) | RIB bancaire |
| `banque` | VARCHAR(100) | Nom banque |
| `devise` | VARCHAR(3) | Devise par défaut |
| `mode_reglement` | VARCHAR(50) | Virement, chèque, espèces |
| `delai_paiement` | INT | Jours de crédit |
| `plafond_credit` | DECIMAL(19,3) | Limite de crédit |
| `actif` | BOOLEAN | Tiers actif |

### 5.2 Fonctionnalités
- **Fiche complète** : Coordonnées, fiscales, bancaires
- **Liaison auto** : Compte collectif paramétrable
- **Balance âgée** : 0-30, 31-60, 61-90, +90 jours
- **Échéancier** : Dates d'échéance, statuts (à payer, payé, retard)
- **Encours** : Suivi du plafond de crédit

---

## 6. GESTION DES EXERCICES & PÉRIODES

### 6.1 Table `EXERCICE`
| Champ | Type | Description |
|-------|------|-------------|
| `id` | UUID | Identifiant |
| `numero` | INT | N° séquentiel (1, 2, 3...) |
| `date_debut` | DATE | Début période |
| `date_fin` | DATE | Fin période |
| `statut` | VARCHAR(20) | `ouvert`, `cloture`, `archive` |
| `date_cloture` | DATE | Date de clôture |
| `a_nouveau_genere` | BOOLEAN | A-nouveaux générés |
| `resultat_exercice` | DECIMAL(19,3) | Résultat |

### 6.2 Table `PERIODE`
| Champ | Type | Description |
|-------|------|-------------|
| `id` | UUID | Identifiant |
| `id_exercice` | UUID | FK |
| `numero_mois` | INT | 1 à 12 |
| `libelle` | VARCHAR(20) | Janvier 2026 |
| `date_debut` | DATE | Début mois |
| `date_fin` | DATE | Fin mois |
| `statut` | VARCHAR(20) | `ouverte`, `verrouillee`, `cloturee` |
| `verrouillee_par` | VARCHAR(100) | Utilisateur |

### 6.3 Fonctionnalités
- **Création** : Assistant guidé (dates, type)
- **Clôture** : Contrôles préalables + génération RAN
- **Verrouillage** : Période par période
- **Réouverture** : Avec traçabilité complète

---

## 7. SAISIE DES ÉCRITURES

### 7.1 Table `ECRITURE`
| Champ | Type | Description |
|-------|------|-------------|
| `id` | UUID | Identifiant unique |
| `numero_piece` | VARCHAR(30) | N° pièce justificative |
| `date_piece` | DATE | Date de la pièce |
| `date_saisie` | TIMESTAMP | Date de saisie |
| `date_comptable` | DATE | Date comptabilisation |
| `journal` | VARCHAR(10) | Code journal (AC, VT, BN, OD, AN...) |
| `libelle` | VARCHAR(255) | Libellé |
| `numero_compte` | VARCHAR(20) | N° compte |
| `id_tiers` | UUID | FK tiers (si compte auxiliaire) |
| `montant_debit` | DECIMAL(19,3) | Montant débit |
| `montant_credit` | DECIMAL(19,3) | Montant crédit |
| `devise` | VARCHAR(3) | Devise de la transaction |
| `montant_devise` | DECIMAL(19,3) | Montant en devise |
| `taux_change` | DECIMAL(19,6) | Taux appliqué |
| `reference` | VARCHAR(100) | Référence externe |
| `numero_facture` | VARCHAR(50) | N° facture liée |
| `date_echeance` | DATE | Échéance |
| `mode_reglement` | VARCHAR(50) | Mode de règlement |
| `numero_cheque` | VARCHAR(50) | N° chèque |
| `lettrage` | VARCHAR(20) | Code lettrage |
| `rapprochement` | VARCHAR(20) | Code rapprochement |
| `utilisateur_saisie` | VARCHAR(100) | Utilisateur |
| `statut` | VARCHAR(20) | `brouillon`, `revise`, `supervise`, `valide` |
| `source` | VARCHAR(20) | `manuelle`, `importee`, `generee` |

### 7.2 Modes de Saisie
#### A. Saisie Manuelle (1%)
- **Grille dynamique** : Ajout de lignes débit/crédit
- **Autocomplétion** : Comptes, tiers, libellés fréquents
- **Contrepartie auto** : Selon paramétrage compte
- **Calcul TND** : `montant_devise × taux_change = montant_tnd` (3 décimales)

#### B. Import Excel (99%)
**Template téléchargeable** avec headers :
```
DATE | MOIS | JOURNAL | N° FAC | REF | N° PIECE | FOLIO | COMPTE | 
INTITULE COMPTE | COMPTE TIERS | INTITULE TIERS | LIBELLE | ECH | LET | 
DÉBIT (TND) | CRÉDIT (TND) | SOLDE | DEVISE | MONTANT DEVISE | COURS
```

**Contrôles préalables à l'import :**
| Contrôle | Niveau | Action |
|----------|--------|--------|
| Format date valide | BLOQUANT | Rejet ligne |
| Compte existe et actif | BLOQUANT | Rejet |
| Journal existe et actif | BLOQUANT | Rejet |
| Équilibre débit = crédit par pièce | BLOQUANT | Rejet pièce |
| Période ouverte | BLOQUANT | Rejet |
| Tiers obligatoire si compte collectif | BLOQUANT | Rejet |
| Montant > 0 | BLOQUANT | Rejet |
| N° pièce unique par journal/exercice | AVERTISSEMENT | Doublon détecté |
| Solde calculé = débit - crédit | AVERTISSEMENT | Écart |
| Multi-devise : devise valide | BLOQUANT | Rejet |
| Multi-devise : cours > 0 | BLOQUANT | Rejet |

**Rapport d'import** : Statistiques + détail des erreurs par ligne

### 7.3 Statuts de Validation
| Statut | Description | Modifiable |
|--------|-------------|------------|
| `brouillon` | Saisie en cours | Oui |
| `revise` | Revue interne | Oui |
| `supervise` | Supervision | Oui (avec trace) |
| `valide` | Validé définitif | Oui (avec contre-écriture) |

---

## 8. LETTRAGE & DÉLETTRAGE (Module V7.9 Intégré)

### 8.1 Architecture de Données
**Structure interne identique au module V7.9 existant.**

### 8.2 Fonctionnalités Conservées
| Fonctionnalité | Description |
|----------------|-------------|
| **Import GL** | Copier/coller depuis Excel |
| **4 Niveaux Auto** | N1 (N°FAC/REF/LIB), N2 (1-1), N3 (FIFO), N4 (N-N) |
| **Lettrage Manuel** | Sélection + Entrée (avec contrôle solde) |
| **Rééquilibrage** | Sélection + génération OD d'écart |
| **Délettrage** | Suppr ou code saisi |
| **Écarts** | OD auto en 636000/736000 |
| **Navigation Clavier** | ↑↓ Espace Entrée Suppr |
| **Export Excel** | Écarts en rouge |

### 8.3 Améliorations Apportées
- **Persistance** : Lettrages sauvegardés dans `ECRITURE.lettrage`
- **Unicité code** : Préfixe exercice (ex: `2026-A`, `2026-B`)
- **Audit** : Traçabilité de chaque action de lettrage
- **Intégration** : Lettrage directement depuis le Grand-Livre

---

## 9. REPORT À NOUVEAU (Module V01 Intégré)

### 9.1 Processus
1. **Import GL N-1** : Coller le Grand-Livre de l'exercice N-1
2. **Contrôles** : Équilibre, dates, tiers manquants
3. **Nettoyage** : Suppression des lettrages soldés
4. **Configuration** : Détail vs Solde par compte
   - **Classe 4** → TOUJOURS Détail
   - **Autres bilan** → Détail si lettrage détecté, sinon Solde
   - **Classes 6-7** → Non reportés
5. **Génération** : Écritures RAN au 01/01/N+1
6. **Contrepartie** : 131000 (bénéfice) ou 135000 (déficit)

### 9.2 Améliorations
- **Persistance** : RAN stocké comme écritures normales (journal `RAN`)
- **Paramétrage** : Comptes écart et résultat configurables
- **Audit** : Traçabilité complète de la génération

---

## 10. RAPPROCHEMENT BANCAIRE (Simplifié)

### 10.1 Processus
1. **Saisie du solde relevé** : Input manuel du solde bancaire final
2. **Calcul écart** : `Solde comptable - Solde relevé = Écart`
3. **Objectif** : Écart = 0
4. **Si écart** : Liste des écritures non rapprochées + proposition de régularisation

### 10.2 Table `RAPPROCHEMENT`
| Champ | Description |
|-------|-------------|
| `id` | UUID |
| `compte_bancaire` | N° compte (512...) |
| `date_rapprochement` | Date |
| `solde_comptable` | DECIMAL(19,3) |
| `solde_releve` | DECIMAL(19,3) |
| `ecart` | DECIMAL(19,3) |
| `statut` | `en_cours`, `valide` |

---

## 11. GESTION DES ÉCHÉANCES

### 11.1 Table `ECHEANCE`
| Champ | Description |
|-------|-------------|
| `id` | UUID |
| `id_tiers` | FK tiers |
| `numero_compte` | Compte concerné |
| `numero_piece` | Pièce d'origine |
| `date_echeance` | Date d'échéance |
| `montant_initial` | DECIMAL(19,3) |
| `montant_reste` | DECIMAL(19,3) |
| `montant_regle` | DECIMAL(19,3) |
| `statut` | `a_payer`, `partiel`, `paye`, `impaye` |
| `date_paiement` | DATE |
| `mode_reglement` | VARCHAR(50) |
| `relance` | INT (nombre) |
| `litige` | BOOLEAN |

### 11.2 Fonctionnalités
- **Tableau de bord** : Échéances à venir, dépassées, impayées
- **Prévisionnel de trésorerie** : Graphique des encaissements/décaissements
- **Balance âgée** : Clients et fournisseurs

---

## 12. ÉDITIONS COMPTABLES (Module V3.2.15 Intégré)

### 12.1 Balance Générale (BG)
**Structure :**
| Colonne | Description |
|---------|-------------|
| Compte | N° compte |
| Intitulé | Libellé |
| Mouvements Débit | Somme débits |
| Mouvements Crédit | Somme crédits |
| Solde Débit | Solde si > 0 |
| Solde Crédit | Solde si < 0 |

**Totaux :** Bilan (1-5) + Gestion (6-7) + Généraux

### 12.2 Balance Auxiliaire (BA)
**Structure par compte collectif :**
| Colonne | Description |
|---------|-------------|
| Tiers | Code tiers |
| Intitulé | Nom tiers |
| Mouvements D/C | Débits/Crédits |
| Soldes D/C | Solde débiteur/créditeur |

**Total par compte** : `TOTAL {compte} - {intitulé}`

### 12.3 Grand-Livre Général (GLG)
**Tri RAN-First :**
1. Compte (CPT)
2. Date RAN (01/01) en tête
3. Date chronologique
4. Journal RAN prioritaire
5. N° Pièce
6. Journal

**Reports inter-pages :**
- `REPORT PAGE PRÉCÉDENTE` (cumul D/C)
- `À REPORTER` (cumul D/C)
- Vérification cohérence : blocage si écart

### 12.4 Grand-Livre Auxiliaire (GLA)
**Tri :** Compte → Tiers → Date RAN → Date → Journal RAN → N° Pièce → Journal

### 12.5 Pagination Unifiée
- `GLOBAL_PAGE_COUNT` : Numérotation continue sur tout le document
- Footer : `Page X/Y`

### 12.6 Entête d'Édition
```
┌─────────────────────────────────────────────────────────────┐
│ {RAISON_SOCIALE}          {TYPE_ÉTAT}            Page X/Y   │
│ Exercice: {AAAA}    Période: {DD/MM/AA} au {DD/MM/AA}      │
│ Le: {DD/MM/AAAA} à {HH:MM}                                 │
│ {COMPTE - INTITULÉ} (si applicable)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 13. ÉTATS FINANCIERS & LIASSE FISCALE

### 13.1 Paramétrage des Rubriques
**Interface de mapping :**
- Table `RUBRIQUE_ETAT_FINANCIER` : Code, libellé, type (bilan, CR, TFT)
- Table `MAPPING_COMPTE_RUBRIQUE` : Compte ↔ Rubrique ↔ Sens

### 13.2 États Générés
| État | Description |
|------|-------------|
| **Bilan** | Actif/Passif avec rubriques paramétrables |
| **État de Résultat** | Charges/Produits |
| **TFT** | Tableau des flux de trésorerie |
| **Notes** | Détail automatique + texte libre |

### 13.3 Liasse Fiscale Tunisienne
- Déclaration fiscale (modèle tunisien)
- Tableau d'amortissements
- État des créances et dettes
- Rapprochement résultat comptable ↔ fiscal

---

## 14. TABLEAU DE BORD & KPI

### 14.1 Design Inspiration
**Style Apple** : Cartes épurées, graphiques Recharts, couleurs douces.

### 14.2 Indicateurs
| KPI | Formule |
|-----|---------|
| Chiffre d'Affaires | Σ comptes 70x |
| Résultat Net | Compte 120/129 |
| Marge Brute | CA - Achats - Δ Stocks |
| BFR | (Stocks + Créances) - Dettes |
| Trésorerie Nette | Trésorerie active - passive |
| Délai Moyen Paiement Clients | (Créances / CA TTC) × 360 |
| Délai Moyen Paiement Fournisseurs | (Dettes / Achats TTC) × 360 |

### 14.3 Widgets
- **Cartes KPI** : Valeur + évolution %
- **Graphiques** : Courbes, barres, camemberts
- **Alertes** : Échéances, impayés, écarts
- **Activité récente** : Dernières écritures, actions utilisateurs

---

## 15. CONTRÔLES DE COHÉRENCE

### 15.1 Contrôles Immédiats (Saisie)
| Code | Contrôle | Niveau |
|------|----------|--------|
| CI-01 | Équilibre débit/crédit | BLOQUANT |
| CI-02 | Date dans exercice ouvert | BLOQUANT |
| CI-03 | Période non verrouillée | BLOQUANT |
| CI-04 | Compte existe et actif | BLOQUANT |
| CI-05 | Journal existe et actif | BLOQUANT |
| CI-06 | Montant > 0 | BLOQUANT |
| CI-07 | Tiers si compte collectif | BLOQUANT |
| CI-08 | N° pièce obligatoire | BLOQUANT |
| CI-09 | Libellé non vide | BLOQUANT |

### 15.2 Contrôles par Cycle
| Cycle | Contrôles |
|-------|-----------|
| **Achats/Fournisseurs** | TVA déductible cohérente, 401 uniquement pour fournisseurs, dates facture ≤ date saisie |
| **Ventes/Clients** | TVA collectée cohérente, 411 uniquement pour clients, N° facture unique |
| **Trésorerie** | Caisse non négative, solde bancaire cohérent, rapprochement équilibré |
| **RAN** | Date = 01/01/N, journal RAN, équilibre des A-nouveaux |

### 15.3 Contrôles de Clôture
| Code | Contrôle |
|------|----------|
| CC-01 | Toutes périodes verrouillées |
| CC-02 | Aucune écriture non lettrée sur comptes lettrables |
| CC-03 | Rapprochements bancaires à jour |
| CC-04 | Écarts de change traités |
| CC-05 | Balance déséquilibrée = 0 |
| CC-06 | Compte 120/129 = résultat calculé |

---

## 16. NOTES DE RÉVISION & SUPERVISION

### 16.1 Table `NOTE_REVISION`
| Champ | Description |
|-------|-------------|
| `id` | UUID |
| `numero_compte` | Compte concerné |
| `cycle` | Achats, Ventes, Trésorerie, RAN... |
| `contenu` | Texte de la note |
| `auteur` | Utilisateur |
| `date_creation` | TIMESTAMP |
| `date_modification` | TIMESTAMP |
| `statut` | `en_cours`, `resolu` |

### 16.2 Fonctionnalités
- **Ajout** : Sur n'importe quel compte/cycle
- **Édition** : Avec traçabilité (audit log)
- **Impression** : Note + option lignes GL sélectionnées
- **Journal d'audit** : Qui, quand, quoi (par login et date)

---

## 17. INTERFACE UTILISATEUR (Design System)

### 17.1 Mode Sombre/Clair
- **Détection** : Préférence système
- **Bascule** : Toggle dans header
- **Palette** :
  - **Clair** : `#f6f7f8` fond, `#111418` texte, `#137fec` primaire
  - **Sombre** : `#101922` fond, `#ffffff` texte, `#3b82f6` primaire

### 17.2 Composants
- **Sidebar** : Navigation principale (icônes Material Symbols)
- **Header** : Titre, actions rapides, mode sombre, utilisateur
- **Cartes KPI** : Bordures subtiles, ombres légères
- **Tableaux** : En-têtes sticky, tri colonnes, pagination
- **Formulaires** : Labels flottants, validation inline
- **Modales** : Actions confirmées, overlay flou

### 17.3 Navigation
```
┌─────────────────────────────────────────────┐
│  🏠  │  📊 Tableau de bord                 │
│  📁  │  📋 Dossiers                        │
│  📊  │  📒 Plan Comptable                  │
│  👥  │  👤 Tiers                           │
│  📅  │  📆 Exercices                       │
│  ✏️  │  ✏️ Saisie Écritures                │
│  🔗  │  🔗 Lettrage                        │
│  📄  │  📄 RAN                             │
│  🏦  │  🏦 Rapprochement                   │
│  📅  │  📅 Échéances                       │
│  📊  │  📊 Éditions (BG/BA/GLG/GLA)       │
│  📈  │  📈 États Financiers                │
│  📝  │  📝 Notes de Révision               │
│  ⚙️  │  ⚙️ Paramètres                      │
└─────────────────────────────────────────────┘
```

---

## 18. SAUVEGARDE & EXPORT

### 18.1 Sauvegarde Automatique
- **Déclencheur** : Toute modification
- **Période** : Toutes les 30 secondes (silentAutoSave)
- **Stockage** : localStorage + IndexedDB (handles fichiers)

### 18.2 Export Manuel
- **JSON** : Fichier complet horodaté (`{societe}_{date}_backup.json`)
- **Excel** : Éditions (BG, BA, GLG, GLA, RAN, Lettrage)
- **CSV** : Plan comptable, écritures

### 18.3 Import
- **JSON** : Restauration complète
- **Excel** : Écritures (avec contrôles préalables)

---

## 19. PLANNING DE DÉVELOPPEMENT

### Phase 1 : Fondations (4 semaines)
- [ ] Architecture PWA + Design System
- [ ] Authentification + Gestion utilisateurs
- [ ] Stockage localStorage/IndexedDB
- [ ] Audit log

### Phase 2 : Données de Base (4 semaines)
- [ ] Gestion dossiers
- [ ] Plan comptable tunisien (préchargé)
- [ ] Gestion tiers
- [ ] Exercices et périodes

### Phase 3 : Saisie & Import (4 semaines)
- [ ] Saisie manuelle écritures
- [ ] Import Excel (template + contrôles)
- [ ] Multi-devises

### Phase 4 : Modules Existants (4 semaines)
- [ ] Intégration Lettrage V7.9
- [ ] Intégration RAN V01
- [ ] Intégration Éditions V3.2.15

### Phase 5 : Fonctionnalités Avancées (4 semaines)
- [ ] Rapprochement bancaire
- [ ] Échéances + Prévisionnel
- [ ] États financiers paramétrables
- [ ] Tableau de bord

### Phase 6 : Finalisation (2 semaines)
- [ ] Notes de révision
- [ ] Tests complets
- [ ] Documentation
- [ ] Déploiement

**Total : ~22 semaines (5.5 mois)**

---

## 20. LIVRABLES

1. **Code source** documenté (React + TypeScript)
2. **Schéma de données** (JSON structure)
3. **Manuel utilisateur** (PDF)
4. **API interne** documentation
5. **Template Excel** d'import
6. **Tests** unitaires et d'intégration

---

*Document généré le 14 Mai 2026 — Version 1.0*
