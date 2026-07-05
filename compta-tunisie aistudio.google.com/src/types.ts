/**
 * Types et interfaces pour l'application Compta Tunisie.
 */

export type Role = 'admin' | 'comptable' | 'saisie' | 'lecture';

export interface DroitsUser {
  planComptable: boolean;
  saisie: boolean;
  lettrage: boolean;
  editions: boolean;
  liasse: boolean;
  controles: boolean;
  configuration: boolean;
}

export interface Utilisateur {
  id: string;
  login: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  droits: DroitsUser;
  actif: boolean;
  derniereConnexion?: string;
}

export interface Societe {
  id: string;
  code: string;
  raisonSociale: string;
  formeJuridique: string;
  mf: string; // Matricule Fiscal
  rc: string; // Registre du Commerce
  adresse: string;
  deviseBase: string; // TND par défaut
  multiDevise: boolean;
  dateDebutExercice: string;
  dateFinExercice: string;
  regimeTva: 'Reel' | 'Forfaitaire' | 'Suspension';
  typeComptabilite: 'Generale' | 'Developpee' | 'Simplifiee';
  logo?: string; // Base64 logo
  actif: boolean;
  premiereAnnee: boolean;
}

export interface Compte {
  id: string;
  numero: string;
  libelle: string;
  libelleCourt: string;
  classe: number; // 1-7
  type: 'Actif' | 'Passif' | 'Charge' | 'Produit';
  natureSolde: 'Debiteur' | 'Crediteur' | 'Solde';
  niveau: number; // 1-4
  collectif: boolean; // Compte de tiers
  lettrable: boolean;
  rapprochable: boolean;
  reportRan: 'detail' | 'solde';
  contrepartieAuto?: string;
  deviseCompte: string;
  rubriqueBilan?: string; // Codes NEF A.01 - P.06
  rubriqueCr?: string; // Codes NEF R.01 - R.15
  rubriqueLiasse?: string; // Codes F6001 - F6005
  sensSoldeEtat?: 'Debit' | 'Credit' | 'Solde absolu';
  cycleAudit: string; // C à S
  bloque: boolean;
  actif: boolean;
}

export interface Tiers {
  id: string;
  code: string; // CLI001, FO001...
  compteCollectif: string; // ex: 411000, 401000
  type: 'Client' | 'Fournisseur' | 'Employe' | 'Autre';
  raisonSociale: string;
  nomContact: string;
  adresse: string;
  ville: string;
  pays: string;
  telephone: string;
  email: string;
  mf: string; // Matricule Fiscal
  rc: string; // Registre de Commerce
  rib: string;
  banque: string;
  devise: string;
  modeReglement: string;
  delaiPaiement: number; // jours
  plafondCredit: number; // TND
  actif: boolean;
}

export interface Exercice {
  id: string;
  numero: number;
  dateDebut: string;
  dateFin: string;
  statut: 'ouvert' | 'cloture' | 'archive';
  dateCloture?: string;
  aNouveauGenere: boolean;
  resultatExercice: number;
  premiereAnnee: boolean;
}

export interface Periode {
  id: string;
  idExercice: string;
  numeroMois: number; // 1-12
  libelle: string; // ex: "Janvier 2026"
  dateDebut: string;
  dateFin: string;
  statut: 'ouverte' | 'verrouillee' | 'cloturee';
  verrouilleePar?: string;
}

export interface Ecriture {
  id: string;
  numeroPiece: string;
  datePiece: string;
  dateSaisie: string;
  dateComptable: string;
  journal: string; // AC, VT, BQ, OD, RAN...
  libelle: string;
  numeroCompte: string;
  idTiers?: string; // FK tiers si compte collectif
  montantDebit: number;
  montantCredit: number;
  devise: string; // TND...
  montantDevise: number;
  tauxChange: number;
  reference?: string;
  numeroFacture?: string;
  dateEcheance?: string;
  modeReglement?: string;
  numeroCheque?: string;
  lettrage?: string; // ex: "2026-A"
  rapprochement?: string; // Code rapprochement
  utilisateurSaisie: string;
  statut: 'brouillon' | 'revise' | 'supervise' | 'valide';
  source: 'manuelle' | 'importee' | 'generee';
  cycleControle?: string; // C à S
  alerteControle?: string[]; // Alertes d'audit
}

export interface AuditLog {
  id: string;
  timestamp: string;
  utilisateur: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VALIDATE' | 'PRINT' | 'EXPORT' | 'IMPORT' | 'LETTRAGE' | 'CLOTURE' | 'RAN';
  module: string;
  entityType?: string;
  entityId?: string;
  description: string;
}

export interface NoteRevision {
  id: string;
  numeroCompte?: string;
  cycle?: string;
  contenu: string;
  auteur: string;
  dateCreation: string;
  dateModification: string;
  statut: 'en_cours' | 'resolu';
}

export interface Rapprochement {
  id: string;
  compteBancaire: string; // 512...
  dateRapprochement: string;
  soldeComptable: number;
  soldeReleve: number;
  ecart: number;
  statut: 'en_cours' | 'valide';
}

export interface Echeance {
  id: string;
  idTiers: string;
  numeroCompte: string;
  numeroPiece: string;
  dateEcheance: string;
  montantInitial: number;
  montantReste: number;
  montantRegle: number;
  statut: 'a_payer' | 'partiel' | 'paye' | 'impaye';
  datePaiement?: string;
  modeReglement?: string;
  relance: number; // compteur
  litige: boolean;
}

export interface SeuilControle {
  variationChargeProduit: number; // variation % (ex: 15)
  seuilImmoCompte615: number; // TND (ex: 500)
  anciennetePassageMois: number; // mois (ex: 3)
  ancienneteCreanceDetteJours: number; // jours (ex: 90)
  joursStockLent: number; // jours (ex: 365)
}
