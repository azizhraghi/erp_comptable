📋 CAHIER DES CHARGES FINAL — APPLICATION COMPTABLE TUNISIENNE
Version 2.0 — Mai 2026

═══════════════════════════════════════════════════════════════════════════════
1. PRÉSENTATION GÉNÉRALE
═══════════════════════════════════════════════════════════════════════════════

1.1 Objectif
────────────
Développer une application comptable web 100% hors ligne (PWA), mono-utilisateur 
par session, multi-sociétés (fichier JSON séparé par client), multi-exercices, 
respectant le Plan Comptable Tunisien (SYSCOHADA révisé) avec intégration complète 
des contrôles par cycle d'audit, des états financiers et de la liasse fiscale 
tunisienne.

1.2 Architecture Technique
────────────────────────
┌─────────────────┬─────────────────────────────┬────────────────────────────────────┐
│ Aspect          │ Choix                       │ Justification                      │
├─────────────────┼─────────────────────────────┼────────────────────────────────────┤
│ Stockage        │ localStorage + IndexedDB +    │ Simplicité, hors ligne,            │
│                 │ Export JSON                 │ portabilité                        │
│ Framework       │ React 18 + TypeScript       │ Composants réutilisables,           │
│                 │                             │ typage fort                        │
│ Style           │ Tailwind CSS + shadcn/ui    │ Design system cohérent,             │
│                 │                             │ mode sombre/clair                  │
│ PWA             │ Service Worker + Manifest   │ Fonctionnement 100% hors ligne      │
│ Export          │ SheetJS (xlsx) + JSON       │ Compatibilité Excel,                │
│                 │                             │ sauvegarde horodatée               │
│ Graphiques      │ Recharts                    │ Tableau de bord interactif          │
│ Authentification│ bcrypt côté client          │ Sécurité sans backend              │
│ Audit           │ Journal immuable            │ Traçabilité complète                │
└─────────────────┴─────────────────────────────┴────────────────────────────────────┘

1.3 Philosophie Design — Inspiration Apple + Dark Mode Professionnel
───────────────────────────────────────────────────────────────────
• Interface épurée, espacement généreux, typographie Inter/SF Pro
• Animations subtiles (fadeInUp, transitions 0.2s ease)
• Mode sombre par défaut (#0D0F1A fond, #E8EAFF texte)
• Cartes KPI avec dégradés subtils, bordures lumineuses
• Tableaux avec en-têtes sticky, tri colonnes, pagination
• Sidebar fixe avec navigation par sections (Principal, Analyse, Système)
• Badges d'alerte avec animation pulse sur les alertes critiques

Palette couleurs (inspirée du style.css fourni):
  --bg-base: #0D0F1A        --primary: #6C63FF
  --bg-surface: #13162A      --secondary: #00D4FF
  --bg-card: #181B2E         --success: #00D4AA
  --text-primary: #E8EAFF     --warning: #FDCB6E
  --text-secondary: #8892B0   --danger: #FF6B6B
  --text-muted: #4A5568      --info: #74B9FF

═══════════════════════════════════════════════════════════════════════════════
2. GESTION DES DOSSIERS (SOCIÉTÉS)
═══════════════════════════════════════════════════════════════════════════════

2.1 Structure par Dossier
─────────────────────────
Chaque client = un fichier JSON indépendant stocké dans un dossier local 
(File System Access API).
Fichier : {code_societe}_{raison_sociale}_{date_creation}.json

2.2 Table SOCIETE
─────────────────
┌────────────────────┬─────────────┬─────────────────────────────────────────┐
│ Champ              │ Type        │ Description                             │
├────────────────────┼─────────────┼─────────────────────────────────────────┤
│ id                 │ UUID        │ Identifiant unique                      │
│ code               │ VARCHAR(20) │ Code dossier (ex: CLI001)               │
│ raison_sociale     │ VARCHAR(255)│ Nom de la société                       │
│ forme_juridique    │ VARCHAR(50) │ SA, SARL, SARL AU, etc.                 │
│ mf                 │ VARCHAR(20) │ Matricule fiscal                        │
│ rc                 │ VARCHAR(50) │ Registre du commerce                    │
│ adresse            │ TEXT        │ Adresse complète                        │
│ devise_base        │ VARCHAR(3)  │ TND par défaut                          │
│ multi_devise       │ BOOLEAN     │ Activation multidevise                  │
│ date_debut_exercice│ DATE        │ Début exercice                          │
│ date_fin_exercice  │ DATE        │ Fin exercice                            │
│ regime_tva         │ VARCHAR(20) │ Réel, forfaitaire, suspension           │
│ type_comptabilite  │ VARCHAR(20) │ Générale, développée, simplifiée        │
│ logo               │ BASE64      │ Logo pour entête d'édition              │
│ actif              │ BOOLEAN     │ Dossier actif                           │
│ premiere_annee     │ BOOLEAN     │ Flag 1ère année d'activité              │
└────────────────────┴─────────────┴─────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
3. GESTION DES UTILISATEURS & SÉCURITÉ
═══════════════════════════════════════════════════════════════════════════════

3.1 Table UTILISATEUR
─────────────────────
┌────────────────────┬─────────────┬─────────────────────────────────────────┐
│ Champ              │ Type        │ Description                             │
├────────────────────┼─────────────┼─────────────────────────────────────────┤
│ id                 │ UUID        │ Identifiant                             │
│ login              │ VARCHAR(50) │ Identifiant unique                      │
│ password           │ VARCHAR(255)│ Hash bcrypt                           │
│ nom                │ VARCHAR(100)│ Nom                                     │
│ prenom             │ VARCHAR(100)│ Prénom                                  │
│ email              │ VARCHAR(100)│ Email                                   │
│ role               │ VARCHAR(20)│ admin, comptable, saisie, lecture         │
│ droits             │ JSON        │ Droits granulaires par module           │
│ actif              │ BOOLEAN     │ Compte actif                            │
│ derniere_connexion │ TIMESTAMP   │ Dernière connexion                      │
└────────────────────┴─────────────┴─────────────────────────────────────────┘

3.2 Authentification
────────────────────
• Login : Comparaison bcrypt côté client (dans le worker)
• Session : Stockée en mémoire (sessionStorage), pas de token
• Déconnexion : Réinitialisation variable + retour écran login
• Timeout : Déconnexion auto après 30 min d'inactivité

3.3 Journal d'Audit (AUDIT_LOG)
───────────────────────────────
┌────────────────────┬──────────────────────────────────────────────────────────┐
│ Champ              │ Description                                              │
├────────────────────┼──────────────────────────────────────────────────────────┤
│ timestamp          │ ISO string                                               │
│ utilisateur        │ Login                                                    │
│ action             │ CREATE, UPDATE, DELETE, VALIDATE, PRINT, EXPORT          │
│ module             │ Plan comptable, Saisie, Lettrage, RAN, Édition...        │
│ entity_type        │ Table concernée                                          │
│ entity_id          │ ID de l'entité                                           │
│ old_value          │ JSON (avant)                                             │
│ new_value          │ JSON (après)                                             │
│ description        │ Texte libre                                              │
└────────────────────┴──────────────────────────────────────────────────────────┘

Règles :
• Toute action critique est tracée
• Visualisation : Timeline filtrable (utilisateur, module, date, recherche texte)
• Limitation : 500 dernières entrées affichées (performance DOM)
• Pas de suppression : Les logs sont immuables

═══════════════════════════════════════════════════════════════════════════════
4. PLAN COMPTABLE TUNISIEN SYSCOHADA + MAPPING INTÉGRÉ
═══════════════════════════════════════════════════════════════════════════════

4.1 Plan Comptable Standard Tunisien (524 comptes)
──────────────────────────────────────────────────
Préchargé : Plan comptable SYSCOHADA révisé (classes 1-7) avec libellés officiels.

STRUCTURE DES CLASSES :
┌───────┬────────────────────────────────┬──────────┐
│ Classe│ Description                    │ Comptes  │
├───────┼────────────────────────────────┼──────────┤
│ 1     │ Comptes de capitaux            │ 84       │
│ 2     │ Comptes d'actif immobilisé     │ 54       │
│ 3     │ Comptes de stocks              │ 44       │
│ 4     │ Comptes de tiers               │ 100      │
│ 5     │ Comptes de trésorerie          │ 48       │
│ 6     │ Comptes de charges             │ 122      │
│ 7     │ Comptes de produits            │ 72       │
└───────┴────────────────────────────────┴──────────┘

4.2 Table COMPTE (avec mapping intégré)
───────────────────────────────────────
┌────────────────────┬─────────────┬─────────────────────────────────────────┐
│ Champ              │ Type        │ Description                             │
├────────────────────┼─────────────┼─────────────────────────────────────────┤
│ id                 │ UUID        │ Identifiant                             │
│ numero             │ VARCHAR(20) │ N° compte (401000, 512000...)           │
│ libelle            │ VARCHAR(255)│ Libellé officiel                        │
│ libelle_court      │ VARCHAR(50) │ Abrégé                                  │
│ classe             │ INT         │ Classe 1-7                              │
│ type               │ VARCHAR(20) │ Actif, Passif, Charge, Produit          │
│ nature_solde       │ VARCHAR(10) │ Débiteur, Créditeur, Solde              │
│ niveau             │ INT         │ 1=classe, 2=rubrique, 3=compte,         │
│                    │             │ 4=sous-compte                           │
│ collectif          │ BOOLEAN     │ Compte collectif (clients/fournisseurs) │
│ lettrable          │ BOOLEAN     │ Lettrage autorisé                       │
│ rapprochable       │ BOOLEAN     │ Rapprochement bancaire                  │
│ report_ran         │ VARCHAR(10) │ detail ou solde                         │
│ contrepartie_auto  │ VARCHAR(20) │ Compte de contrepartie automatique      │
│ devise_compte      │ VARCHAR(3)  │ Devise du compte                        │
│ rubrique_bilan     │ VARCHAR(50) │ Code NEF Bilan (A.01-A.14, CP.01-CP.04, │
│                    │             │ P.01-P.06)                              │
│ rubrique_cr        │ VARCHAR(50) │ Code NEF Compte Résultat (R.01-R.15)    │
│ rubrique_liasse    │ VARCHAR(50) │ Code F6001-F6005 (liasse fiscale)       │
│ sens_solde_etat    │ VARCHAR(10) │ Débit, Crédit, Solde absolu             │
│ mouvement_etat     │ VARCHAR(20) │ Mouvement attendu                       │
│ cycle_audit        │ CHAR(1)     │ C,D,E,F,G,H,I,J,K,L,M,N,O,P,R,S         │
│ bloque             │ BOOLEAN     │ Interdit en saisie                      │
│ actif              │ BOOLEAN     │ Compte actif                            │
└────────────────────┴─────────────┴─────────────────────────────────────────┘

4.3 Mapping États Financiers — 39 codes NEF
─────────────────────────────────────────────
BILAN (14 rubriques NEF):
  A.01-A.07 : Actifs non courants (Immobilisations, Amortissements, Provisions)
  A.08-A.14 : Actifs courants (Stocks, Clients, Autres actifs, Liquidités)
  CP.01-CP.04 : Capitaux propres (Capital, Réserves, Autres, Résultats)
  P.01-P.03 : Passifs non courants (Emprunts, Passifs financiers, Provisions)
  P.04-P.06 : Passifs courants (Fournisseurs, Autres passifs, Concours bancaires)

COMPTE DE RÉSULTAT (15 rubriques NEF):
  R.01-R.03 : Produits d'exploitation (Revenus, Autres produits, Production immo.)
  R.04-R.09 : Charges d'exploitation (Variation stocks, Achats, Personnel, 
              Dotations, Autres charges)
  R.10-R.13 : Résultat activités ordinaires (Charges/produits financiers, 
              Gains/pertes ordinaires)
  R.14 : Impôt sur les bénéfices
  R.15 : Éléments extraordinaires

4.4 Mapping Liasse Fiscale Tunisienne — 267 rubriques
─────────────────────────────────────────────────────
F6001 : BILAN ACTIF (55 rubriques)
  → Immobilisations incorporelles, corporelles, financières
  → Stocks, Clients, Autres actifs courants, Liquidités

F6002 : BILAN PASSIF (41 rubriques)
  → Capitaux propres, Emprunts, Provisions
  → Fournisseurs, Autres passifs courants, Concours bancaires

F6003 : COMPTE DE RÉSULTAT (65 rubriques)
  → Ventes, Achats, Charges de personnel, Dotations
  → Charges/produits financiers, Éléments extraordinaires

F6004 : TABLEAU DES FLUX DE TRÉSORERIE (22 rubriques)
  → Résultat net, Variations stocks/créances/dettes
  → Flux investissement, Financement, Trésorerie

F6005 : DÉCLARATION FISCALE — RÉINTÉGRATIONS/DÉDUCTIONS (84 rubriques)
  → Charges non déductibles (résidences secondaires, véhicules >9CV, cadeaux)
  → Amortissements non déductibles, Provisions
  → Déductions fiscales (export, développement régional, dividendes)
  → Plus-values cession, Gains de change

4.5 Interface de Paramétrage du Plan Comptable
──────────────────────────────────────────────
• Arborescence : Classes → Rubriques → Comptes → Sous-comptes
• Recherche : Par numéro, libellé, classe, cycle, rubrique NEF
• Visualisation mapping : Badge coloré par état financier / liasse
• Import/Export : Excel/CSV du plan comptable avec mapping
• Duplication : Copier plan comptable entre sociétés

═══════════════════════════════════════════════════════════════════════════════
5. CONTRÔLES PAR CYCLE (Module Intégré V2.0)
═══════════════════════════════════════════════════════════════════════════════

5.1 Architecture du Module
──────────────────────────
Paramétrage global par défaut (totalement configurable) :
┌────────────────────────────────────┬─────────────────────────────────────────┐
│ Paramètre                          │ Valeur par défaut                       │
├────────────────────────────────────┼─────────────────────────────────────────┤
│ Variation charge/produit N vs N-1  │ ±15%                                    │
│ Seuil "immobilisation" compte 615  │ 500 DT                                  │
│ Ancienneté comptes de passage      │ > 3 mois                                │
│ Créances/dettes > 90j, > 365j        │ Alerte                                  │
│ Jours de stock > 365j              │ Alerte                                  │
│ Écritures anormales                │ Montant négatif, décimal >3 chiffres,   │
│                                    │ rapprochement non soldé                 │
└────────────────────────────────────┴─────────────────────────────────────────┘

5.2 Cycle C : Immobilisations Incorporelles (Comptes 21)
────────────────────────────────────────────────────────
Contrôles automatiques :
• Signe normal : 21xx solde DÉBITEUR → Alerte si créditeur
• Amortissements 28xx solde CRÉDITEUR → Alerte si débiteur
• VNC ≥ 0 : Immo brute - amortissements ≥ 0
• Immo en cours (23) : Aucune dotation 6811 sur même compte
• Cessions : Vérification 636/736 (plus/moins-value)

Contrôles spécifiques Tunisie :
• Dotations d'amortissement : Variation 28 = somme 6811 journal → Alerte si écart
• Caractère immobilisation : Écriture 615 > 500 DT → Alerte "Vérifier immobilisation"

5.3 Cycle D : Immobilisations Corporelles (Comptes 22)
──────────────────────────────────────────────────────
• Signe normal : 22xx solde DÉBITEUR
• VNC positive ou nulle
• Dépenses réparation/entretien > 500 DT → Alerte immobilisation
• Cessions : Vérification plus/moins-value 636/736

5.4 Cycle E : Immobilisations Financières (Comptes 25-26)
─────────────────────────────────────────────────────────
• Signe normal : DÉBITEUR
• Provisions pour dépréciation cohérentes
• Valeur nette jamais négative
• Pas de reclassement erroné avec comptes de tiers

5.5 Cycle F : Stocks (Comptes 31-37)
────────────────────────────────────
• Solde jamais négatif (sauf 39 provisions)
• VNC stock ≥ 0 : Stock brut - provision ≥ 0
• Variation de stock : 603/713 = SF N - SF N-1
• Rotation lente : Jours de stock > 365 → Alerte

5.6 Cycle G : Ventes — Clients (Comptes 41)
───────────────────────────────────────────
• Signe normal : 41xx solde DÉBITEUR (sauf 419 avances)
• Soldes créditeurs anormaux hors avances → Alerte
• Lettrage : Nombre lignes non lettrées, ancienneté > 12 mois
• Créances échues : > 90j, > 365j → Alerte
• Cohérence ventes/TVA collectée/encaissements

5.7 Cycle H : Paie (Comptes 42, 64, 453)
────────────────────────────────────────
• 421 : Solde nul après paiement
• Charges personnel (64) : Cohérence effectif, sauts brusques
• Dettes sociales (453) : Soldé au plus tard Q4
• Cohérence charges sociales ≈ CNSS déclaré

5.8 Cycle I : Impôts et Taxes (Comptes 43, 66, 69)
─────────────────────────────────────────────────
• TVA collectée (4367) : Cohérence avec ventes
• TVA déductible (4366) : Solde ≥ 0, jamais débiteur anormal
• Retenues à source 432 : Solde nul après paiement État
• Distinction 432 (RS à reverser) ≠ 418 (RS client à déduire)
• Recherche intelligente libellés : Détection "TVA C..." sur compte tiers

5.9 Cycle J : Liquidités (Comptes 53-54-58)
───────────────────────────────────────────
• Caisse (54) : Solde toujours ≥ 0
• Banque (532) : Solde comptable = solde relevé + écarts soldés
• Virements internes (58) : Comptes de correspondance soldés

5.10 Cycle K : Capitaux Propres (Comptes 10-14)
───────────────────────────────────────────────
• Cohérence avec résultat exercice et reports antérieurs
• Variations non justifiées → Alerte
• Concordance résultat exercice / affectation
• Écritures clôture/ouverture obligatoires

5.11 Cycle L : Provisions (Comptes 15)
──────────────────────────────────────
• Provisions pour risques, charges, retraites
• Provisions d'origine réglementaire
• Vérification cohérence avec événements sous-jacents

5.12 Cycle M : Emprunts (Comptes 16-17)
───────────────────────────────────────
• Cohérence soldes emprunts LT/MT
• Ventilation partie courante / non courante
• Soldes débiteurs anormaux → Alerte
• Charges financières et intérêts courus liés

5.13 Cycle N : Achats — Fournisseurs (Comptes 40)
─────────────────────────────────────────────────
• Signe normal : 40xx solde CRÉDITEUR (sauf 409 avances)
• Soldes débiteurs anormaux hors avances → Alerte
• Lettrage dettes et ancienneté
• Cohérence achats/règlements/TVA déductible
• Factures non parvenues / charges mal rattachées

5.14 Cycle O : Associés (Comptes 44)
────────────────────────────────────
• Cohérence comptes courants associés
• Soldes anormaux non justifiés
• Avances, prêts, rémunérations, distributions
• Écritures anciennes non soldées

5.15 Cycle P : Autres Comptes de Bilan (Comptes 45-48)
───────────────────────────────────────────────────────
• Comptes d'attente, passage, régularisation
• Pas de soldes anciens > 3 mois
• Comptes non mouvementés ou mal utilisés
• Reclassements vers bons cycles

5.16 Cycle R : Éléments Extraordinaires (Comptes 67, 77)
────────────────────────────────────────────────────────
• Cohérence gains/pertes extraordinaires
• Non récurrents vs récurrents → Alerte

5.17 Cycle S : Charges Financières (Comptes 65)
───────────────────────────────────────────────
• Cohérence intérêts, agios, frais financiers
• Soldes créditeurs anormaux → Alerte
• Ventilation par nature
• Rattachement période correcte

5.18 Contrôles Transversaux (Tous Cycles)
─────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────────────────┐
│ BALANCES ET RAN                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Total débits = total crédits                                              │
│ • Compte 13 (Résultat) = résultat N-1 (sauf 1ère année)                     │
│ • Journal RAN/AN/OUV obligatoire sauf 1ère année                             │
│ • Si absence RAN ou solde 13 ≠ résultat N-1 → Alerte                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ ÉCRITURES MANUELLES ET ANOMALIES                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Trésorerie hors journal Caisse/Banque → Alerte                             │
│ • Date valeur ≠ date comptable → Alerte systématique                        │
│ • Montants négatifs ou décimal > 3 chiffres → Alerte                       │
│ • Équilibre débit = crédit par écriture                                     │
│ • Équilibre lettrages par compte/tiers                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ SÉQUENCE ET DOUBLONS                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Unicité pièce par journal/date → Alerte doublon technique                 │
│ • Date + montant + libellé proches → Alerte "doublon potentiel"             │
│ • Classement ACH/VTE/BQ/PAIE par mois/numéro/date                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ COMPTES DE PASSAGE (46, 47, 45x)                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Solde ancien > 3 mois → Alerte                                            │
│ • Solde anormalement élevé → Alerte                                         │
│ • Nombre lignes anormalement élevé → Alerte                                 │
└─────────────────────────────────────────────────────────────────────────────┘

5.19 Interface Contrôles par Cycle
──────────────────────────────────
• Dashboard des contrôles : Vue synthétique par cycle (icône + nombre d'alertes)
• Détail par compte : Liste des anomalies détectées avec niveau (BLOQUANT/AVERTISSEMENT)
• Filtres : Par cycle, par période, par niveau d'alerte
• Export : Rapport PDF des contrôles avec recommandations
• Paramétrage : Seuils configurables par utilisateur

═══════════════════════════════════════════════════════════════════════════════
6. GESTION DES TIERS (AUXILIAIRES)
═══════════════════════════════════════════════════════════════════════════════

6.1 Table TIERS
───────────────
┌────────────────────┬─────────────┬─────────────────────────────────────────┐
│ Champ              │ Type        │ Description                             │
├────────────────────┼─────────────┼─────────────────────────────────────────┤
│ id                 │ UUID        │ Identifiant                             │
│ code               │ VARCHAR(20) │ Code unique tiers                       │
│ compte_collectif   │ VARCHAR(20) │ Compte lié (401, 411, 421...)           │
│ type               │ VARCHAR(20) │ Client, Fournisseur, Employé, Autre     │
│ raison_sociale     │ VARCHAR(255)│ Nom                                     │
│ nom_contact        │ VARCHAR(100)│ Contact principal                       │
│ adresse            │ TEXT        │ Adresse                                 │
│ ville              │ VARCHAR(100)│ Ville                                   │
│ pays               │ VARCHAR(100)│ Pays                                    │
│ telephone          │ VARCHAR(20) │ Téléphone                               │
│ email              │ VARCHAR(100)│ Email                                   │
│ mf                 │ VARCHAR(20) │ Matricule fiscal                        │
│ rc                 │ VARCHAR(50) │ Registre commerce                       │
│ rib                │ VARCHAR(40) │ RIB bancaire                            │
│ banque             │ VARCHAR(100)│ Nom banque                              │
│ devise             │ VARCHAR(3)  │ Devise par défaut                       │
│ mode_reglement     │ VARCHAR(50) │ Virement, chèque, espèces               │
│ delai_paiement     │ INT         │ Jours de crédit                         │
│ plafond_credit     │ DECIMAL(19,3)│ Limite de crédit                       │
│ actif              │ BOOLEAN     │ Tiers actif                             │
└────────────────────┴─────────────┴─────────────────────────────────────────┘

6.2 Fonctionnalités
───────────────────
• Fiche complète : Coordonnées, fiscales, bancaires
• Liaison auto : Compte collectif paramétrable
• Balance âgée : 0-30, 31-60, 61-90, +90 jours
• Échéancier : Dates d'échéance, statuts (à payer, payé, retard)
• Encours : Suivi du plafond de crédit

═══════════════════════════════════════════════════════════════════════════════
7. GESTION DES EXERCICES & PÉRIODES
═══════════════════════════════════════════════════════════════════════════════

7.1 Table EXERCICE
──────────────────
┌────────────────────┬─────────────┬─────────────────────────────────────────┐
│ Champ              │ Type        │ Description                             │
├────────────────────┼─────────────┼─────────────────────────────────────────┤
│ id                 │ UUID        │ Identifiant                             │
│ numero             │ INT         │ N° séquentiel (1, 2, 3...)              │
│ date_debut         │ DATE        │ Début période                           │
│ date_fin           │ DATE        │ Fin période                             │
│ statut             │ VARCHAR(20) │ ouvert, cloture, archive                │
│ date_cloture       │ DATE        │ Date de clôture                         │
│ a_nouveau_genere   │ BOOLEAN     │ A-nouveaux générés                      │
│ resultat_exercice  │ DECIMAL(19,3)│ Résultat                               │
│ premiere_annee     │ BOOLEAN     │ Flag 1ère année (pas de RAN obligatoire)│
└────────────────────┴─────────────┴─────────────────────────────────────────┘

7.2 Table PERIODE
─────────────────
┌────────────────────┬─────────────┬─────────────────────────────────────────┐
│ Champ              │ Type        │ Description                             │
├────────────────────┼─────────────┼─────────────────────────────────────────┤
│ id                 │ UUID        │ Identifiant                             │
│ id_exercice        │ UUID        │ FK                                      │
│ numero_mois        │ INT         │ 1 à 12                                  │
│ libelle            │ VARCHAR(20) │ Janvier 2026                            │
│ date_debut         │ DATE        │ Début mois                              │
│ date_fin           │ DATE        │ Fin mois                                │
│ statut             │ VARCHAR(20) │ ouverte, verrouillee, cloturee          │
│ verrouillee_par    │ VARCHAR(100)│ Utilisateur                             │
└────────────────────┴─────────────┴─────────────────────────────────────────┘

7.3 Fonctionnalités
───────────────────
• Création : Assistant guidé (dates, type)
• Clôture : Contrôles préalables + génération RAN
• Verrouillage : Période par période
• Réouverture : Avec traçabilité complète

═══════════════════════════════════════════════════════════════════════════════
8. SAISIE DES ÉCRITURES
═══════════════════════════════════════════════════════════════════════════════

8.1 Table ECRITURE
──────────────────
┌────────────────────┬─────────────┬─────────────────────────────────────────┐
│ Champ              │ Type        │ Description                             │
├────────────────────┼─────────────┼─────────────────────────────────────────┤
│ id                 │ UUID        │ Identifiant unique                      │
│ numero_piece       │ VARCHAR(30) │ N° pièce justificative                  │
│ date_piece         │ DATE        │ Date de la pièce                        │
│ date_saisie        │ TIMESTAMP   │ Date de saisie                         │
│ date_comptable     │ DATE        │ Date comptabilisation                   │
│ journal            │ VARCHAR(10) │ Code journal (AC, VT, BN, OD, AN...)    │
│ libelle            │ VARCHAR(255)│ Libellé                                 │
│ numero_compte      │ VARCHAR(20) │ N° compte                               │
│ id_tiers           │ UUID        │ FK tiers (si compte collectif)          │
│ montant_debit      │ DECIMAL(19,3)│ Montant débit                          │
│ montant_credit     │ DECIMAL(19,3)│ Montant crédit                         │
│ devise             │ VARCHAR(3)  │ Devise de la transaction                │
│ montant_devise     │ DECIMAL(19,3)│ Montant en devise                      │
│ taux_change        │ DECIMAL(19,6)│ Taux appliqué                          │
│ reference          │ VARCHAR(100)│ Référence externe                       │
│ numero_facture     │ VARCHAR(50) │ N° facture liée                         │
│ date_echeance      │ DATE        │ Échéance                                │
│ mode_reglement     │ VARCHAR(50) │ Mode de règlement                       │
│ numero_cheque      │ VARCHAR(50) │ N° chèque                               │
│ lettrage           │ VARCHAR(20) │ Code lettrage                           │
│ rapprochement      │ VARCHAR(20) │ Code rapprochement                      │
│ utilisateur_saisie │ VARCHAR(100)│ Utilisateur                             │
│ statut             │ VARCHAR(20) │ brouillon, revise, supervise, valide    │
│ source             │ VARCHAR(20) │ manuelle, importee, generee             │
│ cycle_controle     │ CHAR(1)     │ Cycle associé (C-S)                     │
│ alerte_controle    │ JSON        │ Alertes générées par les contrôles      │
└────────────────────┴─────────────┴─────────────────────────────────────────┘

8.2 Modes de Saisie
───────────────────
A. Saisie Manuelle (1%)
   • Grille dynamique : Ajout de lignes débit/crédit
   • Autocomplétion : Comptes, tiers, libellés fréquents
   • Contrepartie auto : Selon paramétrage compte
   • Calcul TND : montant_devise × taux_change = montant_tnd (3 décimales)
   • Contrôles immédiats par cycle (CI-01 à CI-09)

B. Import Excel (99%)
   Template téléchargeable avec headers :
   DATE | MOIS | JOURNAL | N° FAC | REF | N° PIECE | FOLIO | COMPTE | 
   INTITULE COMPTE | COMPTE TIERS | INTITULE TIERS | LIBELLE | ECH | LET | 
   DÉBIT (TND) | CRÉDIT (TND) | SOLDE | DEVISE | MONTANT DEVISE | COURS

   Contrôles préalables à l'import :
   ┌────────────────────────────────┬─────────────┬──────────────────────────┐
   │ Contrôle                       │ Niveau      │ Action                   │
   ├────────────────────────────────┼─────────────┼──────────────────────────┤
   │ Format date valide             │ BLOQUANT    │ Rejet ligne              │
   │ Compte existe et actif         │ BLOQUANT    │ Rejet                    │
   │ Journal existe et actif        │ BLOQUANT    │ Rejet                    │
   │ Équilibre D=C par pièce        │ BLOQUANT    │ Rejet pièce              │
   │ Période ouverte                │ BLOQUANT    │ Rejet                    │
   │ Tiers obligatoire si collectif │ BLOQUANT    │ Rejet                    │
   │ Montant > 0                    │ BLOQUANT    │ Rejet                    │
   │ N° pièce unique par journal    │ AVERTISSEMENT│ Doublon détecté         │
   │ Solde calculé = D-C            │ AVERTISSEMENT│ Écart                   │
   │ Multi-devise : devise valide   │ BLOQUANT    │ Rejet                    │
   │ Multi-devise : cours > 0       │ BLOQUANT    │ Rejet                    │
   └────────────────────────────────┴─────────────┴──────────────────────────┘

   Rapport d'import : Statistiques + détail des erreurs par ligne

8.3 Statuts de Validation
─────────────────────────
┌─────────────┬─────────────────────────────┬──────────┐
│ Statut      │ Description                 │ Modifiable│
├─────────────┼─────────────────────────────┼──────────┤
│ brouillon   │ Saisie en cours             │ Oui      │
│ revise      │ Revue interne               │ Oui      │
│ supervise   │ Supervision                 │ Oui (trace)│
│ valide      │ Validé définitif            │ Oui (contre-écriture)│
└─────────────┴─────────────────────────────┴──────────┘

8.4 Contrôles Immédiats Intégrés (Saisie)
──────────────────────────────────────────
┌──────┬──────────────────────────────┬─────────────┐
│ Code │ Contrôle                     │ Niveau      │
├──────┼──────────────────────────────┼─────────────┤
│ CI-01│ Équilibre débit/crédit        │ BLOQUANT    │
│ CI-02│ Date dans exercice ouvert     │ BLOQUANT    │
│ CI-03│ Période non verrouillée       │ BLOQUANT    │
│ CI-04│ Compte existe et actif        │ BLOQUANT    │
│ CI-05│ Journal existe et actif       │ BLOQUANT    │
│ CI-06│ Montant > 0                   │ BLOQUANT    │
│ CI-07│ Tiers si compte collectif     │ BLOQUANT    │
│ CI-08│ N° pièce obligatoire          │ BLOQUANT    │
│ CI-09│ Libellé non vide              │ BLOQUANT    │
│ CI-10│ Contrôle cycle associé        │ AVERTISSEMENT│
│ CI-11│ Seuil immobilisation 615      │ AVERTISSEMENT│
│ CI-12│ Cohérence TVA                 │ AVERTISSEMENT│
└──────┴──────────────────────────────┴─────────────┘

═══════════════════════════════════════════════════════════════════════════════
9. LETTRAGE & DÉLETTRAGE (Module V7.9 Intégré)
═══════════════════════════════════════════════════════════════════════════════

9.1 Architecture de Données
─────────────────────────────
Structure interne identique au module V7.9 existant.
Persistance : Lettrages sauvegardés dans ECRITURE.lettrage
Unicité code : Préfixe exercice (ex: 2026-A, 2026-B)

9.2 Fonctionnalités Conservées
──────────────────────────────
┌────────────────────┬─────────────────────────────────────────────────────────┐
│ Fonctionnalité     │ Description                                             │
├────────────────────┼─────────────────────────────────────────────────────────┤
│ Import GL          │ Copier/coller depuis Excel                              │
│ 4 Niveaux Auto     │ N1 (N°FAC/REF/LIB), N2 (1-1), N3 (FIFO), N4 (N-N)      │
│ Lettrage Manuel    │ Sélection + Entrée (avec contrôle solde)                │
│ Rééquilibrage      │ Sélection + génération OD d'écart                       │
│ Délettrage         │ Suppr ou code saisi                                     │
│ Écarts             │ OD auto en 636000/736000                                │
│ Navigation Clavier │ ↑↓ Espace Entrée Suppr                                  │
│ Export Excel       │ Écarts en rouge                                         │
└────────────────────┴─────────────────────────────────────────────────────────┘

9.3 Améliorations Apportées
───────────────────────────
• Audit : Traçabilité de chaque action de lettrage
• Intégration : Lettrage directement depuis le Grand-Livre
• Contrôles cycle : Vérification lettrage par cycle (G, N, O...)

═══════════════════════════════════════════════════════════════════════════════
10. REPORT À NOUVEAU (Module V01 Intégré)
═══════════════════════════════════════════════════════════════════════════════

10.1 Processus
──────────────
1. Import GL N-1 : Coller le Grand-Livre de l'exercice N-1
2. Contrôles : Équilibre, dates, tiers manquants
3. Nettoyage : Suppression des lettrages soldés
4. Configuration : Détail vs Solde par compte
   • Classe 4 → TOUJOURS Détail
   • Autres bilan → Détail si lettrage détecté, sinon Solde
   • Classes 6-7 → Non reportés
5. Génération : Écritures RAN au 01/01/N+1
   • Contrepartie : 131000 (bénéfice) ou 135000 (déficit)

10.2 Améliorations
──────────────────
• Persistance : RAN stocké comme écritures normales (journal RAN)
• Paramétrage : Comptes écart et résultat configurables
• Audit : Traçabilité complète de la génération
• Contrôle cycle K : Vérification cohérence capitaux propres

═══════════════════════════════════════════════════════════════════════════════
11. RAPPROCHEMENT BANCAIRE (Simplifié)
═══════════════════════════════════════════════════════════════════════════════

11.1 Processus
──────────────
• Saisie du solde relevé : Input manuel du solde bancaire final
• Calcul écart : Solde comptable - Solde relevé = Écart
• Objectif : Écart = 0
• Si écart : Liste des écritures non rapprochées + proposition de régularisation

11.2 Table RAPPROCHEMENT
────────────────────────
┌────────────────────┬─────────────────────────────────────────────────────────┐
│ Champ              │ Description                                             │
├────────────────────┼─────────────────────────────────────────────────────────┤
│ id                 │ UUID                                                    │
│ compte_bancaire    │ N° compte (512...)                                      │
│ date_rapprochement │ Date                                                    │
│ solde_comptable    │ DECIMAL(19,3)                                           │
│ solde_releve       │ DECIMAL(19,3)                                           │
│ ecart              │ DECIMAL(19,3)                                           │
│ statut             │ en_cours, valide                                        │
└────────────────────┴─────────────────────────────────────────────────────────┘

11.3 Contrôles Cycle J
──────────────────────
• Caisse (54) : Solde toujours ≥ 0
• Banque (532) : Solde comptable = solde relevé + écarts soldés
• Virements internes (58) : Comptes de correspondance soldés

═══════════════════════════════════════════════════════════════════════════════
12. GESTION DES ÉCHÉANCES
═══════════════════════════════════════════════════════════════════════════════

12.1 Table ECHEANCE
───────────────────
┌────────────────────┬─────────────────────────────────────────────────────────┐
│ Champ              │ Description                                             │
├────────────────────┼─────────────────────────────────────────────────────────┤
│ id                 │ UUID                                                    │
│ id_tiers           │ FK tiers                                                │
│ numero_compte      │ Compte concerné                                         │
│ numero_piece       │ Pièce d'origine                                         │
│ date_echeance      │ Date d'échéance                                         │
│ montant_initial    │ DECIMAL(19,3)                                           │
│ montant_reste      │ DECIMAL(19,3)                                           │
│ montant_regle      │ DECIMAL(19,3)                                           │
│ statut             │ a_payer, partiel, paye, impaye                          │
│ date_paiement      │ DATE                                                    │
│ mode_reglement     │ VARCHAR(50)                                             │
│ relance            │ INT (nombre)                                            │
│ litige             │ BOOLEAN                                                 │
└────────────────────┴─────────────────────────────────────────────────────────┘

12.2 Fonctionnalités
────────────────────
• Tableau de bord : Échéances à venir, dépassées, impayées
• Prévisionnel de trésorerie : Graphique des encaissements/décaissements
• Balance âgée : Clients et fournisseurs

═══════════════════════════════════════════════════════════════════════════════
13. ÉDITIONS COMPTABLES (Module V3.2.15 Intégré)
═══════════════════════════════════════════════════════════════════════════════

13.1 Balance Générale (BG)
──────────────────────────
Structure :
┌─────────────────┬─────────────────────────────────────────────────────────────┐
│ Colonne         │ Description                                                 │
├─────────────────┼─────────────────────────────────────────────────────────────┤
│ Compte          │ N° compte                                                   │
│ Intitulé        │ Libellé                                                     │
│ Mouvements Débit│ Somme débits                                                │
│ Mouvements Crédit│ Somme crédits                                              │
│ Solde Débit     │ Solde si > 0                                                │
│ Solde Crédit    │ Solde si < 0                                                │
└─────────────────┴─────────────────────────────────────────────────────────────┘
Totaux : Bilan (1-5) + Gestion (6-7) + Généraux

13.2 Balance Auxiliaire (BA)
────────────────────────────
Structure par compte collectif :
┌─────────────────┬─────────────────────────────────────────────────────────────┐
│ Colonne         │ Description                                                 │
├─────────────────┼─────────────────────────────────────────────────────────────┤
│ Tiers           │ Code tiers                                                  │
│ Intitulé        │ Nom tiers                                                   │
│ Mouvements D/C  │ Débits/Crédits                                              │
│ Soldes D/C      │ Solde débiteur/créditeur                                    │
└─────────────────┴─────────────────────────────────────────────────────────────┘
Total par compte : TOTAL {compte} - {intitulé}

13.3 Grand-Livre Général (GLG)
──────────────────────────────
Tri RAN-First :
  Compte (CPT) → Date RAN (01/01) en tête → Date chronologique → 
  Journal RAN prioritaire → N° Pièce → Journal

Reports inter-pages :
  REPORT PAGE PRÉCÉDENTE (cumul D/C)
  À REPORTER (cumul D/C)
  Vérification cohérence : blocage si écart

13.4 Grand-Livre Auxiliaire (GLA)
─────────────────────────────────
Tri : Compte → Tiers → Date RAN → Date → Journal RAN → N° Pièce → Journal

13.5 Pagination Unifiée
───────────────────────
GLOBAL_PAGE_COUNT : Numérotation continue sur tout le document
Footer : Page X/Y

13.6 Entête d'Édition
─────────────────────
┌─────────────────────────────────────────────────────────────┐
│ {RAISON_SOCIALE}          {TYPE_ÉTAT}            Page X/Y   │
│ Exercice: {AAAA}    Période: {DD/MM/AA} au {DD/MM/AA}      │
│ Le: {DD/MM/AAAA} à {HH:MM}                                 │
│ {COMPTE - INTITULÉ} (si applicable)                        │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
14. ÉTATS FINANCIERS & LIASSE FISCALE (Module Intégré V2.0)
═══════════════════════════════════════════════════════════════════════════════

14.1 Paramétrage des Rubriques
──────────────────────────────
Interface de mapping avec les 39 codes NEF :
┌─────────────────────────────────────────────────────────────────────────────┐
│ Table RUBRIQUE_ETAT_FINANCIER : Code NEF, libellé, type (bilan, CR, TFT)    │
│ Table MAPPING_COMPTE_RUBRIQUE : Compte ↔ Rubrique NEF ↔ Sens               │
│ Table MAPPING_LIASSE_FISCALE : Compte ↔ Code F6001-F6005 ↔ Rubrique      │
└─────────────────────────────────────────────────────────────────────────────┘

14.2 États Générés Automatiquement
──────────────────────────────────
┌─────────────────┬─────────────────────────────────────────────────────────────┐
│ État            │ Description                                                 │
├─────────────────┼─────────────────────────────────────────────────────────────┤
│ Bilan           │ Actif/Passif avec rubriques paramétrables (14 NEF)         │
│ État de Résultat│ Charges/Produits (15 NEF)                                  │
│ TFT             │ Tableau des flux de trésorerie (22 rubriques F6004)        │
│ Notes           │ Détail automatique + texte libre                           │
└─────────────────┴─────────────────────────────────────────────────────────────┘

14.3 Liasse Fiscale Tunisienne (5 Formulaires)
──────────────────────────────────────────────
┌─────────┬─────────────────┬─────────────────────────────────────────────────┐
│ Formulaire│ Nb Rubriques  │ Contenu                                         │
├─────────┼─────────────────┼─────────────────────────────────────────────────┤
│ F6001   │ 55              │ BILAN ACTIF complet                             │
│ F6002   │ 41              │ BILAN PASSIF + Capitaux Propres                 │
│ F6003   │ 65              │ COMPTE DE RÉSULTAT détaillé                     │
│ F6004   │ 22              │ TABLEAU FLUX DE TRÉSORERIE                      │
│ F6005   │ 84              │ DÉCLARATION FISCALE (réintégrations/déductions) │
└─────────┴─────────────────┴─────────────────────────────────────────────────┘

Génération automatique depuis les écritures comptables avec mapping préétabli.
Export vers Excel avec format officiel tunisien.

14.4 Contrôles Liasse Fiscale
─────────────────────────────
• Vérification équilibre bilan : Actif = Passif + Capitaux
• Cohérence résultat comptable vs fiscal
• Vérification des rubriques obligatoires
• Alertes sur montants anormaux ou incohérents

═══════════════════════════════════════════════════════════════════════════════
15. TABLEAU DE BORD & KPI (Design Inspiré Images + Style.css)
═══════════════════════════════════════════════════════════════════════════════

15.1 Design System
──────────────────
Style Apple professionnel adapté comptabilité :
• Cartes KPI : Bordures subtiles, ombres légères, dégradés lumineux
• Graphiques Recharts : Courbes, barres, camemberts, couleurs douces
• Mode sombre/clair : Détection préférence système + toggle header
• Palette sombre (défaut) : #0D0F1A fond, #E8EAFF texte, #6C63FF primaire

15.2 Indicateurs KPI
────────────────────
┌─────────────────────────────────────────┬─────────────────────────────────┐
│ KPI                                     │ Formule                         │
├─────────────────────────────────────────┼─────────────────────────────────┤
│ Chiffre d'Affaires                      │ Σ comptes 70x                   │
│ Résultat Net                            │ Compte 120/129                  │
│ Marge Brute                             │ CA - Achats - Δ Stocks          │
│ BFR                                     │ (Stocks + Créances) - Dettes    │
│ Trésorerie Nette                        │ Trésorerie active - passive     │
│ Délai Moyen Paiement Clients            │ (Créances / CA TTC) × 360      │
│ Délai Moyen Paiement Fournisseurs       │ (Dettes / Achats TTC) × 360    │
│ Ratio Immobilisation                    │ Immobilisations / Capitaux     │
│ Rentabilité Financière                  │ Résultat / Capitaux Propres    │
│ Endettement                             │ Dettes / Capitaux Propres      │
│ Rotation Stocks                         │ Coût achats / Stock moyen      │
│ Nombre Alertes Contrôles                │ Compteur par cycle             │
└─────────────────────────────────────────┴─────────────────────────────────┘

15.3 Widgets Tableau de Bord
────────────────────────────
• Cartes KPI : Valeur + évolution % + trend up/down/neutral
• Graphiques : Courbes (CA mensuel), Barres (top 5 stocks), 
               Camemberts (répartition par catégorie/compte)
• Alertes : Échéances, impayés, écarts, contrôles cycle
• Activité récente : Dernières écritures, actions utilisateurs
• Contrôles par cycle : Vue synthétique avec badges colorés
  🔴 Critique / 🟡 Avertissement / 🟢 OK

15.4 Layout Tableau de Bord (Inspiré Images Fournies)
──────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────────────────┐
│ [KPI Cards Row] 4 métriques principales avec icônes et trends              │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Charts Row]    │  Répartition par catégorie (doughnut)                  │
│                 │  Niveaux de stock top 5 (barres)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Bottom Row]    │  Derniers mouvements        │  Alertes stock + Contrôles│
│                 │  (liste avec dots colorés)  │  (critical/warning)        │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
16. CONTRÔLES DE COHÉRENCE (Intégrés Cycles + Généraux)
═══════════════════════════════════════════════════════════════════════════════

16.1 Contrôles Immédiats (Saisie) — Voir §8.4
16.2 Contrôles par Cycle — Voir §5.2 à §5.17
16.3 Contrôles de Clôture
─────────────────────────
┌──────┬─────────────────────────────────────────────────────────────────────┐
│ Code │ Contrôle                                                            │
├──────┼─────────────────────────────────────────────────────────────────────┤
│ CC-01│ Toutes périodes verrouillées                                        │
│ CC-02│ Aucune écriture non lettrée sur comptes lettrables                  │
│ CC-03│ Rapprochements bancaires à jour                                     │
│ CC-04│ Écarts de change traités                                            │
│ CC-05│ Balance déséquilibrée = 0                                           │
│ CC-06│ Compte 120/129 = résultat calculé                                   │
│ CC-07│ Contrôles par cycle tous validés                                    │
│ CC-08│ Liasse fiscale équilibrée                                           │
│ CC-09│ RAN généré et cohérent (sauf 1ère année)                            │
└──────┴─────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
17. NOTES DE RÉVISION & SUPERVISION
═══════════════════════════════════════════════════════════════════════════════

17.1 Table NOTE_REVISION
────────────────────────
┌────────────────────┬─────────────────────────────────────────────────────────┐
│ Champ              │ Description                                             │
├────────────────────┼─────────────────────────────────────────────────────────┤
│ id                 │ UUID                                                    │
│ numero_compte      │ Compte concerné                                         │
│ cycle              │ Achats, Ventes, Trésorerie, RAN...                      │
│ contenu            │ Texte de la note                                        │
│ auteur             │ Utilisateur                                             │
│ date_creation      │ TIMESTAMP                                               │
│ date_modification  │ TIMESTAMP                                               │
│ statut             │ en_cours, resolu                                        │
└────────────────────┴─────────────────────────────────────────────────────────┘

17.2 Fonctionnalités
────────────────────
• Ajout : Sur n'importe quel compte/cycle
• Édition : Avec traçabilité (audit log)
• Impression : Note + option lignes GL sélectionnées
• Journal d'audit : Qui, quand, quoi (par login et date)

═══════════════════════════════════════════════════════════════════════════════
18. INTERFACE UTILISATEUR (Design System Complet)
═══════════════════════════════════════════════════════════════════════════════

18.1 Mode Sombre/Clair
─────────────────────
Détection : Préférence système
Bascule : Toggle dans header

Palette Sombre (Défaut) :
  --bg-base: #0D0F1A        --bg-surface: #13162A
  --bg-card: #181B2E        --bg-hover: #1E2238
  --border: rgba(255,255,255,0.07)
  --primary: #6C63FF        --primary-light: #9C8FFF
  --secondary: #00D4FF      --accent: #FF6B6B
  --success: #00D4AA        --warning: #FDCB6E
  --danger: #FF6B6B         --info: #74B9FF
  --text-primary: #E8EAFF   --text-secondary: #8892B0
  --text-muted: #4A5568

18.2 Composants (Inspirés Style.css Fourni)
───────────────────────────────────────────
• Sidebar : Navigation principale (icônes Material Symbols), 260px fixe
  - Sections : PRINCIPAL, ANALYSE, SYSTÈME
  - Badge pulse sur alertes
  - User info footer avec avatar

• Header : Titre, actions rapides, mode sombre, utilisateur
  - Search box avec focus glow
  - Bouton action principal avec icône +

• Cartes KPI : Bordures subtiles, ombres légères, top border gradient
  - 4 types : total (primary), value (success), low (warning), categories (info)

• Tableaux : En-têtes sticky, tri colonnes, pagination
  - Lignes hover avec transition
  - Badges status colorés
  - Barres de progression stock

• Formulaires : Labels flottants, validation inline
  - Input focus : border primary + glow
  - Select options fond sombre

• Modales : Actions confirmées, overlay flou, animation slideInUp
  - Header avec close button
  - Footer actions alignées droite
  - Form grid 2 colonnes

• Toast notifications : SlideInRight, bordure gauche colorée
  - Types : success (vert), error (rouge), warning (jaune), info (bleu)

18.3 Navigation Complète
─────────────────────────
┌─────────────────────────────────────────────┐
│  🏠  │  📊 Tableau de bord                    │
│  📁  │  📋 Dossiers                           │
│  📊  │  📒 Plan Comptable + Mapping           │
│  👥  │  👤 Tiers                              │
│  📅  │  📆 Exercices                          │
│  ✏️  │  ✏️ Saisie Écritures                   │
│  🔗  │  🔗 Lettrage                           │
│  📄  │  📄 RAN                                │
│  🏦  │  🏦 Rapprochement                      │
│  📅  │  📅 Échéances                          │
│  📊  │  📊 Éditions (BG/BA/GLG/GLA)          │
│  📈  │  📈 États Financiers (NEF 39 codes)    │
│  📝  │  📝 Liasse Fiscale (F6001-F6005)      │
│  🔍  │  🔍 Contrôles par Cycle (C-S)          │
│  📝  │  📝 Notes de Révision                  │
│  ⚙️  │  ⚙️ Paramètres                         │
└─────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
19. SAUVEGARDE & EXPORT
═══════════════════════════════════════════════════════════════════════════════

19.1 Sauvegarde Automatique
───────────────────────────
• Déclencheur : Toute modification
• Période : Toutes les 30 secondes (silentAutoSave)
• Stockage : localStorage + IndexedDB (handles fichiers)

19.2 Export Manuel
──────────────────
• JSON : Fichier complet horodaté ({societe}_{date}_backup.json)
• Excel : Éditions (BG, BA, GLG, GLA, RAN, Lettrage)
• CSV : Plan comptable, écritures, liasse fiscale
• PDF : États financiers, rapport contrôles cycle

19.3 Import
───────────
• JSON : Restauration complète
• Excel : Écritures (avec contrôles préalables)
• Liasse : Import données fiscales précédentes

═══════════════════════════════════════════════════════════════════════════════
20. PLANNING DE DÉVELOPPEMENT
═══════════════════════════════════════════════════════════════════════════════

Phase 1 : Fondations (4 semaines)
─────────────────────────────────
[ ] Architecture PWA + Design System (inspiré style.css)
[ ] Authentification + Gestion utilisateurs
[ ] Stockage localStorage/IndexedDB
[ ] Audit log

Phase 2 : Données de Base (4 semaines)
──────────────────────────────────────
[ ] Gestion dossiers
[ ] Plan comptable tunisien 524 comptes (préchargé)
[ ] Mapping 39 codes NEF + 267 rubriques liasse
[ ] Gestion tiers
[ ] Exercices et périodes

Phase 3 : Saisie & Import (4 semaines)
──────────────────────────────────────
[ ] Saisie manuelle écritures avec contrôles CI
[ ] Import Excel (template + contrôles)
[ ] Multi-devises

Phase 4 : Modules Existants (4 semaines)
────────────────────────────────────────
[ ] Intégration Lettrage V7.9
[ ] Intégration RAN V01
[ ] Intégration Éditions V3.2.15

Phase 5 : Fonctionnalités Avancées (4 semaines)
───────────────────────────────────────────────
[ ] Module Contrôles par Cycle (C-S) avec paramétrage
[ ] Rapprochement bancaire
[ ] Échéances + Prévisionnel
[ ] États financiers paramétrables (39 NEF)
[ ] Liasse fiscale tunisienne (F6001-F6005)

Phase 6 : Finalisation (2 semaines)
───────────────────────────────────
[ ] Tableau de bord KPI complet
[ ] Notes de révision
[ ] Tests complets (contrôles cycle, liasse)
[ ] Documentation utilisateur et technique
[ ] Déploiement PWA

Total : ~22 semaines (5.5 mois)

═══════════════════════════════════════════════════════════════════════════════
21. LIVRABLES
═══════════════════════════════════════════════════════════════════════════════

• Code source documenté (React + TypeScript)
• Schéma de données JSON avec mapping complet
• Manuel utilisateur (PDF) avec procédures contrôles cycle
• API interne documentation
• Template Excel d'import avec validation
• Templates liasse fiscale tunisienne (F6001-F6005)
• Tests unitaires et d'intégration (contrôles cycle)
• Document de paramétrage des seuils de contrôle

═══════════════════════════════════════════════════════════════════════════════
Document généré le 14 Mai 2026 — Version 2.0
Intégration : Contrôles par Cycle + Plan Comptable Mapping + États Financiers 
              NEF + Liasse Fiscale Tunisienne F6001-F6005
═══════════════════════════════════════════════════════════════════════════════
