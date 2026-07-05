/**
 * Gestion du stockage local et génération de données fictives de démonstration.
 */

import { 
  Societe, Compte, Tiers, Exercice, Periode, 
  Ecriture, AuditLog, NoteRevision, Rapprochement, 
  Echeance, SeuilControle, Role, Utilisateur 
} from '../types';
import { INITIAL_ACCOUNTS, SEUILS_CONTROLE_DEFAUT } from '../initialData';

// Clés LocalStorage
const K_SOCIETES = 'compta_societes';
const K_ACTIVE_SOCIETE_ID = 'compta_active_societe_id';
const K_AUDIT_LOGS = 'compta_audit_logs';
const K_CURRENT_USER = 'compta_current_user';

// Utilisateur par défaut
const DEFAULT_USER: Utilisateur = {
  id: 'u-1',
  login: 'NajdB',
  nom: 'Ben Thabet',
  prenom: 'Najd',
  email: 'najd.benthabet@gmail.com',
  role: 'admin',
  actif: true,
  droits: {
    planComptable: true,
    saisie: true,
    lettrage: true,
    editions: true,
    liasse: true,
    controles: true,
    configuration: true,
  }
};

export function getCurrentUser(): Utilisateur {
  const data = localStorage.getItem(K_CURRENT_USER);
  if (!data) {
    localStorage.setItem(K_CURRENT_USER, JSON.stringify(DEFAULT_USER));
    return DEFAULT_USER;
  }
  return JSON.parse(data);
}

export function saveCurrentUser(user: Utilisateur) {
  localStorage.setItem(K_CURRENT_USER, JSON.stringify(user));
}

// Logs d'audit
export function getAuditLogs(): AuditLog[] {
  const data = localStorage.getItem(K_AUDIT_LOGS);
  return data ? JSON.parse(data) : [];
}

export function addAuditLog(action: AuditLog['action'], module: string, description: string) {
  const logs = getAuditLogs();
  const user = getCurrentUser();
  const newLog: AuditLog = {
    id: 'log-' + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    utilisateur: user.login,
    action,
    module,
    description
  };
  // Limite à 500 entrées comme spécifié
  const updatedLogs = [newLog, ...logs].slice(0, 500);
  localStorage.setItem(K_AUDIT_LOGS, JSON.stringify(updatedLogs));
}

// Charger les dossiers (Sociétés)
export function getSocietes(): Societe[] {
  const data = localStorage.getItem(K_SOCIETES);
  return data ? JSON.parse(data) : [];
}

export function saveSocietes(list: Societe[]) {
  localStorage.setItem(K_SOCIETES, JSON.stringify(list));
}

export function getActiveSocieteId(): string {
  return localStorage.getItem(K_ACTIVE_SOCIETE_ID) || '';
}

export function setActiveSocieteId(id: string) {
  localStorage.setItem(K_ACTIVE_SOCIETE_ID, id);
}

// Accesseurs génériques par Société active
export function getCompanyData<T>(keyPrefix: string, activeId: string, defaultValue: T): T {
  if (!activeId) return defaultValue;
  const data = localStorage.getItem(`${keyPrefix}_${activeId}`);
  return data ? JSON.parse(data) : defaultValue;
}

export function saveCompanyData<T>(keyPrefix: string, activeId: string, value: T) {
  if (!activeId) return;
  localStorage.setItem(`${keyPrefix}_${activeId}`, JSON.stringify(value));
}

// Fonctions d'initialisation complètes pour une Société
export function initNewCompanyData(societeId: string) {
  // 1. Plan comptable
  localStorage.setItem(`comptes_${societeId}`, JSON.stringify(INITIAL_ACCOUNTS));
  // 2. Tiers par défaut
  const defaultTiers: Tiers[] = [
    {
      id: 't-1',
      code: 'CLI-STEG',
      compteCollectif: '411000',
      type: 'Client',
      raisonSociale: 'STEG (Société Tunisienne d\'Électricité et de Gaz)',
      nomContact: 'M. Ben Ali',
      adresse: '38 Rue de Kamal, Tunis',
      ville: 'Tunis',
      pays: 'Tunisie',
      telephone: '+216 71 111 222',
      email: 'contact@steg.com.tn',
      mf: '0001235/G/A/M/000',
      rc: 'B125432026',
      rib: '03100010001234567891',
      banque: 'BNA',
      devise: 'TND',
      modeReglement: 'Virement',
      delaiPaiement: 30,
      plafondCredit: 50000,
      actif: true
    },
    {
      id: 't-2',
      code: 'FO-SOPAL',
      compteCollectif: '401000',
      type: 'Fournisseur',
      raisonSociale: 'SOPAL Robinetterie SA',
      nomContact: 'Mme Amel',
      adresse: 'Zone Industrielle, Sfax',
      ville: 'Sfax',
      pays: 'Tunisie',
      telephone: '+216 74 444 555',
      email: 'sales@sopal.com',
      mf: '0032541/X/A/P/000',
      rc: 'A152142026',
      rib: '10200030005555555551',
      banque: 'UIB',
      devise: 'TND',
      modeReglement: 'Chèque',
      delaiPaiement: 60,
      plafondCredit: 100000,
      actif: true
    },
    {
      id: 't-3',
      code: 'FO-MICROSOFT',
      compteCollectif: '401000',
      type: 'Fournisseur',
      raisonSociale: 'Microsoft Europe',
      nomContact: 'Licensing Dept',
      adresse: 'One Microsoft Place, Dublin',
      ville: 'Dublin',
      pays: 'Irlande',
      telephone: '+353 1 706 5000',
      email: 'billing@microsoft.com',
      mf: '9999999/M/A/M/000',
      rc: 'IE98357',
      rib: 'IE00BOFI900000123456',
      banque: 'Bank of Ireland',
      devise: 'USD',
      modeReglement: 'Virement',
      delaiPaiement: 15,
      plafondCredit: 25000,
      actif: true
    }
  ];
  localStorage.setItem(`tiers_${societeId}`, JSON.stringify(defaultTiers));

  // 3. Exercices et périodes (2026 par défaut)
  const defaultExercice: Exercice = {
    id: `ex-${societeId}-2026`,
    numero: 2026,
    dateDebut: '2026-01-01',
    dateFin: '2026-12-31',
    statut: 'ouvert',
    aNouveauGenere: false,
    resultatExercice: 0,
    premiereAnnee: false,
  };
  localStorage.setItem(`exercices_${societeId}`, JSON.stringify([defaultExercice]));

  const moisLibelles = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const listPeriodes: Periode[] = moisLibelles.map((mois, index) => {
    const moisNum = index + 1;
    const padMois = moisNum.toString().padStart(2, '0');
    return {
      id: `per-${societeId}-2026-${padMois}`,
      idExercice: defaultExercice.id,
      numeroMois: moisNum,
      libelle: `${mois} 2026`,
      dateDebut: `2026-${padMois}-01`,
      dateFin: `2026-${padMois}-${new Date(2026, moisNum, 0).getDate()}`,
      statut: 'ouverte'
    };
  });
  localStorage.setItem(`periodes_${societeId}`, JSON.stringify(listPeriodes));

  // 4. Seuils de contrôle par défaut
  localStorage.setItem(`seuilControle_${societeId}`, JSON.stringify(SEUILS_CONTROLE_DEFAUT));

  // 5. Initialiser les autres tables vides
  localStorage.setItem(`ecritures_${societeId}`, JSON.stringify([]));
  localStorage.setItem(`rapprochements_${societeId}`, JSON.stringify([]));
  localStorage.setItem(`echeances_${societeId}`, JSON.stringify([]));
  localStorage.setItem(`notesRevision_${societeId}`, JSON.stringify([]));
}

// Fonction pour injecter des écritures de démonstration de haute fidélité
// Cela permet d'avoir des chiffres réels dans le tableau de bord, la balance générale,
// et de déclencher élégamment des erreurs/alertes audit (ex : entretien > 500 DT dans 615,
// facture non lettrée, caisse négative temporaire, écriture asymétrique...)
export function injectDemoTransactions(societeId: string) {
  const ecritures: Ecriture[] = [
    // -------------------------------------------------------------------------
    // 1. REPORT À NOUVEAU (01/01/2026) - Équilibre parfait
    // -------------------------------------------------------------------------
    {
      id: 'demo-ran-1',
      numeroPiece: '001-RAN',
      datePiece: '2026-01-01',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-01-01',
      journal: 'AN',
      libelle: 'Report à nouveau - Capital',
      numeroCompte: '101000',
      montantDebit: 0,
      montantCredit: 250000,
      devise: 'TND',
      montantDevise: 0,
      tauxChange: 1,
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'manuelle'
    },
    {
      id: 'demo-ran-2',
      numeroPiece: '001-RAN',
      datePiece: '2026-01-01',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-01-01',
      journal: 'AN',
      libelle: 'Report à nouveau - Réserves',
      numeroCompte: '106000',
      montantDebit: 0,
      montantCredit: 50000,
      devise: 'TND',
      montantDevise: 0,
      tauxChange: 1,
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'manuelle'
    },
    {
      id: 'demo-ran-3',
      numeroPiece: '001-RAN',
      datePiece: '2026-01-01',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-01-01',
      journal: 'AN',
      libelle: 'Report à nouveau - Matériel Ind.',
      numeroCompte: '223000',
      montantDebit: 180000,
      montantCredit: 0,
      devise: 'TND',
      montantDevise: 0,
      tauxChange: 1,
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'manuelle'
    },
    {
      id: 'demo-ran-4',
      numeroPiece: '001-RAN',
      datePiece: '2026-01-01',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-01-01',
      journal: 'AN',
      libelle: 'Report à nouveau - Amort Corp.',
      numeroCompte: '282000',
      montantDebit: 0,
      montantCredit: 36000,
      devise: 'TND',
      montantDevise: 0,
      tauxChange: 1,
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'manuelle'
    },
    {
      id: 'demo-ran-5',
      numeroPiece: '001-RAN',
      datePiece: '2026-01-01',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-01-01',
      journal: 'AN',
      libelle: 'Report à nouveau - Stocks Mat P',
      numeroCompte: '311000',
      montantDebit: 45000,
      montantCredit: 0,
      devise: 'TND',
      montantDevise: 0,
      tauxChange: 1,
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'manuelle'
    },
    {
      id: 'demo-ran-6',
      numeroPiece: '001-RAN',
      datePiece: '2026-01-01',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-01-01',
      journal: 'AN',
      libelle: 'Report à nouveau - Solde Banque',
      numeroCompte: '512000',
      montantDebit: 111000,
      montantCredit: 0,
      devise: 'TND',
      montantDevise: 0,
      tauxChange: 1,
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'manuelle'
    },

    // -------------------------------------------------------------------------
    // 2. VENTÈS (Janvier - Février 2026)
    // Facture VTE001 : Vente de produits finis locale avec TVA collectée 19%
    // -------------------------------------------------------------------------
    {
      id: 'demo-vte-1a',
      numeroPiece: 'VTE26-001',
      datePiece: '2026-01-15',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-01-15',
      journal: 'VT',
      libelle: 'Facture VTE001 - STEG',
      numeroCompte: '411000',
      idTiers: 't-1', // STEG
      montantDebit: 23800, // TTC
      montantCredit: 0,
      devise: 'TND',
      montantDevise: 0,
      tauxChange: 1,
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'manuelle'
    },
    {
      id: 'demo-vte-1b',
      numeroPiece: 'VTE26-001',
      datePiece: '2026-01-15',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-01-15',
      journal: 'VT',
      libelle: 'Facture VTE001 - Ventes Produits',
      numeroCompte: '701000',
      montantDebit: 0,
      montantCredit: 20000, // HT
      devise: 'TND',
      montantDevise: 0,
      tauxChange: 1,
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'manuelle'
    },
    {
      id: 'demo-vte-1c',
      numeroPiece: 'VTE26-001',
      datePiece: '2026-01-15',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-01-15',
      journal: 'VT',
      libelle: 'Facture VTE001 - TVA collectée 19%',
      numeroCompte: '436700',
      montantDebit: 0,
      montantCredit: 3800, // TVA 19%
      devise: 'TND',
      montantDevise: 0,
      tauxChange: 1,
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'manuelle'
    },

    // Vente Export (US Dollars) - Pas de TVA
    {
      id: 'demo-vte-exp-a',
      numeroPiece: 'VTE26-002',
      datePiece: '2026-02-10',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-02-10',
      journal: 'VT',
      libelle: 'Facture VTE002 Export - US Client',
      numeroCompte: '411000',
      montantDebit: 15500, // Equivalent TND
      montantCredit: 0,
      devise: 'USD',
      montantDevise: 5000,
      tauxChange: 3.1, // USD/TND
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'manuelle'
    },
    {
      id: 'demo-vte-exp-b',
      numeroPiece: 'VTE26-002',
      datePiece: '2026-02-10',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-02-10',
      journal: 'VT',
      libelle: 'Facture VTE002 Export - Vente',
      numeroCompte: '703000',
      montantDebit: 0,
      montantCredit: 15500,
      devise: 'USD',
      montantDevise: 5000,
      tauxChange: 3.1,
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'manuelle'
    },

    // -------------------------------------------------------------------------
    // 3. ACHATS & CHARGES (Janvier - Février 2026)
    // Facture ACH001 : Achat de matières premières de SOPAL (19% TVA déductible)
    // -------------------------------------------------------------------------
    {
      id: 'demo-ach-1a',
      numeroPiece: 'ACH26-001',
      datePiece: '2026-01-20',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-01-20',
      journal: 'AC',
      libelle: 'Achat SOPAL - Matières Premières',
      numeroCompte: '601000',
      montantDebit: 10000, // HT
      montantCredit: 0,
      devise: 'TND',
      montantDevise: 0,
      tauxChange: 1,
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'manuelle'
    },
    {
      id: 'demo-ach-1b',
      numeroPiece: 'ACH26-001',
      datePiece: '2026-01-20',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-01-20',
      journal: 'AC',
      libelle: 'Achat SOPAL - TVA Déductible 19%',
      numeroCompte: '436600',
      montantDebit: 1900,
      montantCredit: 0,
      devise: 'TND',
      montantDevise: 0,
      tauxChange: 1,
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'manuelle'
    },
    {
      id: 'demo-ach-1c',
      numeroPiece: 'ACH26-001',
      datePiece: '2026-01-20',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-01-20',
      journal: 'AC',
      libelle: 'Facture ACH001 - SOPAL',
      numeroCompte: '401000',
      idTiers: 't-2', // SOPAL
      montantDebit: 0,
      montantCredit: 11900, // TTC
      devise: 'TND',
      montantDevise: 0,
      tauxChange: 1,
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'manuelle'
    },

    // TRAP POUR EXTRICATEUR D'AUDIT : Écriture de maintenance (615000) > 500 DT
    // Doit être détectée par le "Cycle D (Immobilisations)" pour suggérer de la requalifier en Immobilisation!
    {
      id: 'demo-trap-ach-2a',
      numeroPiece: 'ACH26-002',
      datePiece: '2026-02-15',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-02-15',
      journal: 'AC',
      libelle: 'Remplacement d\'un compresseur moteur',
      numeroCompte: '615000', // Entretien
      montantDebit: 3200, // > 500 DT !! Déclenchera l'alerte !
      montantCredit: 0,
      devise: 'TND',
      montantDevise: 0,
      tauxChange: 1,
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'manuelle'
    },
    {
      id: 'demo-trap-ach-2b',
      numeroPiece: 'ACH26-002',
      datePiece: '2026-02-15',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-02-15',
      journal: 'AC',
      libelle: 'TVA déductible sur compresseur',
      numeroCompte: '436600',
      montantDebit: 608,
      montantCredit: 0,
      devise: 'TND',
      montantDevise: 0,
      tauxChange: 1,
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'manuelle'
    },
    {
      id: 'demo-trap-ach-2c',
      numeroPiece: 'ACH26-002',
      datePiece: '2026-02-15',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-02-15',
      journal: 'AC',
      libelle: 'Facture ACH002 - SOPAL',
      numeroCompte: '401000',
      idTiers: 't-2',
      montantDebit: 0,
      montantCredit: 3808,
      devise: 'TND',
      montantDevise: 0,
      tauxChange: 1,
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'manuelle'
    },

    // -------------------------------------------------------------------------
    // 4. RÉGLEMENTS ET RELEVÉS DE TRÉSORERIE (Banque / Caisse)
    // Règlement de la facture VTE-001 (STEG) por la Banque (512000)
    // -------------------------------------------------------------------------
    {
      id: 'demo-bq-1a',
      numeroPiece: 'CHQ-001',
      datePiece: '2026-02-20',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-02-20',
      journal: 'BQ',
      libelle: 'Paiement Chèque STEG Fact VTE26-001',
      numeroCompte: '512000', // Banque débit
      montantDebit: 23800, // Reçu
      montantCredit: 0,
      devise: 'TND',
      montantDevise: 0,
      tauxChange: 1,
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'manuelle'
    },
    {
      id: 'demo-bq-1b',
      numeroPiece: 'CHQ-001',
      datePiece: '2026-02-20',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-02-20',
      journal: 'BQ',
      libelle: 'Règlement STEG Fact VTE001',
      numeroCompte: '411000', // Crédit Client pour lettrage
      idTiers: 't-1',
      montantDebit: 0,
      montantCredit: 23800,
      devise: 'TND',
      montantDevise: 0,
      tauxChange: 1,
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'manuelle'
    },

    // Règlement partiel SOPAL ACH-001 (10000 DT sur 11900 DT)
    // Pour démontrer le lettrage partiel et l'analyse des restants dus !
    {
      id: 'demo-bq-2a',
      numeroPiece: 'VIR-SOPAL',
      datePiece: '2026-02-25',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-02-25',
      journal: 'BQ',
      libelle: 'Acompte virement SOPAL Fact ACH26-001',
      numeroCompte: '401000',
      idTiers: 't-2',
      montantDebit: 10000, // Débit Fournisseur
      montantCredit: 0,
      devise: 'TND',
      montantDevise: 0,
      tauxChange: 1,
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'manuelle'
    },
    {
      id: 'demo-bq-2b',
      numeroPiece: 'VIR-SOPAL',
      datePiece: '2026-02-25',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-02-25',
      journal: 'BQ',
      libelle: 'Virement de fonds - Fournisseur',
      numeroCompte: '512000',
      montantDebit: 0,
      montantCredit: 10000,  // Crédit Banque
      devise: 'TND',
      montantDevise: 0,
      tauxChange: 1,
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'manuelle'
    },

    // -------------------------------------------------------------------------
    // 5. PAIE ET CHARGES SOCIALES (Février 2026)
    // Enregistrement des salaires (641000) et personnel (421000)
    // -------------------------------------------------------------------------
    {
      id: 'demo-paie-1',
      numeroPiece: 'PAIE26-02',
      datePiece: '2026-02-28',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-02-28',
      journal: 'OD',
      libelle: 'Salaires du mois de Février 2026',
      numeroCompte: '641000', // Charges personnel
      montantDebit: 8500,
      montantCredit: 0,
      devise: 'TND',
      montantDevise: 0,
      tauxChange: 1,
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'manuelle'
    },
    {
      id: 'demo-paie-2',
      numeroPiece: 'PAIE26-02',
      datePiece: '2026-02-28',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-02-28',
      journal: 'OD',
      libelle: 'Salaires Février 2026 - Net à payer',
      numeroCompte: '421000', // Personnel net due
      montantDebit: 0,
      montantCredit: 7225, // 85% du brut
      devise: 'TND',
      montantDevise: 0,
      tauxChange: 1,
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'manuelle'
    },
    {
      id: 'demo-paie-3',
      numeroPiece: 'PAIE26-02',
      datePiece: '2026-02-28',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-02-28',
      journal: 'OD',
      libelle: 'Retenues à la source / salaires (15%)',
      numeroCompte: '432000', // RS due
      montantDebit: 0,
      montantCredit: 1275, // 15% RS
      devise: 'TND',
      montantDevise: 0,
      tauxChange: 1,
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'manuelle'
    }
  ];

  localStorage.setItem(`ecritures_${societeId}`, JSON.stringify(ecritures));

  // Lettrer automatiquement les pièces de démonstration lettrables !
  // VTE26-001 (23800 DT) con BQ CHQ-001 (23800 DT).
  const updatedEcritures = ecritures.map(e => {
    if (e.numeroPiece === 'VTE26-001' && e.numeroCompte === '411000') {
      return { ...e, lettrage: '2026-LET01' };
    }
    if (e.numeroPiece === 'CHQ-001' && e.numeroCompte === '411000') {
      return { ...e, lettrage: '2026-LET01' };
    }
    return e;
  });

  localStorage.setItem(`ecritures_${societeId}`, JSON.stringify(updatedEcritures));

  // Ajouter des échéances pour tester l'échéancier
  const basicEcheances: Echeance[] = [
    {
      id: 'ech-demo-1',
      idTiers: 't-1',
      numeroCompte: '411000',
      numeroPiece: 'VTE26-001',
      dateEcheance: '2026-02-15',
      montantInitial: 23800,
      montantReste: 0,
      montantRegle: 23800,
      statut: 'paye',
      litige: false,
      relance: 0
    },
    {
      id: 'ech-demo-2',
      idTiers: 't-2',
      numeroCompte: '401000',
      numeroPiece: 'ACH26-001',
      dateEcheance: '2026-03-20',
      montantInitial: 11900,
      montantReste: 1900,
      montantRegle: 10000,
      statut: 'partiel',
      litige: false,
      relance: 0
    },
    {
      id: 'ech-demo-3',
      idTiers: 't-2',
      numeroCompte: '401000',
      numeroPiece: 'ACH26-002',
      dateEcheance: '2026-04-15',
      montantInitial: 3808,
      montantReste: 3808,
      montantRegle: 0,
      statut: 'a_payer',
      litige: false,
      relance: 0
    }
  ];
  localStorage.setItem(`echeances_${societeId}`, JSON.stringify(basicEcheances));

  addAuditLog('CREATE', 'Saisie', 'Génération automatique des écritures de démonstration pour le dossier active.');
}

// Initialise l'application entière si aucune donnée n'existe
export function bootstrapApplication() {
  const societes = getSocietes();
  if (societes.length === 0) {
    // Créer une société tunisienne de démonstration
    const demoCompany: Societe = {
      id: 'soc-demo-tun',
      code: 'SOC-TUN',
      raisonSociale: 'Tunis Trade & Manufacturing SA',
      formeJuridique: 'SA',
      mf: '1432567/A/M/000',
      rc: 'B241282026',
      adresse: 'Zone Industrielle Charguia II, Tunis',
      deviseBase: 'TND',
      multiDevise: true,
      dateDebutExercice: '2026-01-01',
      dateFinExercice: '2026-12-31',
      regimeTva: 'Reel',
      typeComptabilite: 'Generale',
      actif: true,
      premiereAnnee: false
    };

    saveSocietes([demoCompany]);
    setActiveSocieteId(demoCompany.id);
    initNewCompanyData(demoCompany.id);
    injectDemoTransactions(demoCompany.id);
    addAuditLog('CREATE', 'Système', 'Initialisation de l\'application avec la société de démonstration SOPAL.');
  }
}
