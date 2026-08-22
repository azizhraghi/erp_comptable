/**
 * La couture entre l'application et sa base.
 *
 * Deux implémentations existent :
 *   - `local`    — PGlite dans le navigateur, persisté en IndexedDB
 *   - `supabase` — le projet Supabase Cloud
 *
 * Les deux exécutent le MÊME schéma et les MÊMES fonctions SQL. La surface
 * ci-dessous est volontairement étroite : parce que le backend a été conçu
 * en fonctions et en vues plutôt qu'en CRUD table par table, il n'y a qu'une
 * douzaine d'opérations à faire tenir des deux côtés.
 *
 * ⚠️ CE QUE LE MODE LOCAL NE REPRODUIT PAS
 * En local, vous êtes propriétaire de la base : la RLS ne s'applique pas.
 * L'isolation entre dossiers n'est donc PAS exercée en mode local, et ne
 * peut l'être qu'une fois sur Supabase. Voir docs/tests-isolation.md.
 */

export interface Collaborateur {
  id: string;
  cabinet_id: string;
  nom: string;
  prenom: string | null;
  email: string;
  profil: 'administrateur' | 'superviseur' | 'senior' | 'junior' | 'lecture';
}

export interface Dossier {
  id: string;
  code: string;
  raison_sociale: string;
  mf: string | null;
  nature: 'PP' | 'PM';
  devise_base: string;
  longueur_compte: number;
}

export interface Exercice {
  id: string;
  dossier_id: string;
  annee: number;
  date_debut: string;
  date_fin: string;
  statut: 'ouvert' | 'cloture' | 'archive';
  est_courant: boolean;
}

export interface Journal {
  id: string;
  code: string;
  nom: string;
  nature: string;
}

export interface Compte {
  id: string;
  numero: string;
  libelle: string;
  classe: number;
  collectif: boolean;
  type_tiers: string | null;
  bloque: boolean;
}

export interface Tiers {
  id: string;
  code: string;
  raison_sociale: string;
  type: string;
  compte_collectif_id: string | null;
}

export interface Violation {
  code: string;
  gravite: 'bloquant' | 'avertissement';
  message: string;
  ecriture_id: string | null;
}

export interface LigneSaisie {
  compte_id: string;
  tiers_id?: string | null;
  libelle?: string;
  debit?: number;
  credit?: number;
  reference?: string | null;
  numero_facture?: string | null;
  date_echeance?: string | null;
}

export interface DemandeEnregistrement {
  piece_id?: string | null;
  dossier_id: string;
  exercice_id: string;
  journal_id: string;
  date_piece: string;
  libelle: string;
  statut: 'brouillon' | 'revise';
  lignes: LigneSaisie[];
}

export interface ResultatEnregistrement {
  piece_id: string;
  numero: string;
  statut: string;
  violations: Violation[];
}

export interface LigneBalance {
  compte_id: string;
  compte_numero: string;
  compte_libelle: string;
  compte_classe: number;
  debit: number;
  credit: number;
  solde: number;
  nb_mouvements: number;
}

export interface LigneGrandLivre {
  ecriture_id: string;
  piece_numero: string;
  date_piece: string;
  piece_statut: string;
  journal_code: string;
  compte_numero: string;
  compte_libelle: string;
  tiers_code: string | null;
  libelle: string;
  debit: number;
  credit: number;
  solde_cumule: number;
  lettrage_code: string | null;
}

export interface Depot {
  readonly mode: 'local' | 'supabase';

  /** Prêt à répondre : en local, cela couvre l'application des migrations. */
  initialiser(): Promise<void>;

  utilisateurCourant(): Promise<Collaborateur | null>;

  listerDossiers(): Promise<Dossier[]>;
  listerExercices(dossierId: string): Promise<Exercice[]>;
  listerJournaux(dossierId: string): Promise<Journal[]>;
  listerComptes(dossierId: string): Promise<Compte[]>;
  listerTiers(dossierId: string): Promise<Tiers[]>;

  enregistrerPiece(demande: DemandeEnregistrement): Promise<ResultatEnregistrement>;
  controlerPiece(pieceId: string): Promise<Violation[]>;

  balanceGenerale(exerciceId: string): Promise<LigneBalance[]>;
  grandLivre(exerciceId: string, compteId?: string): Promise<LigneGrandLivre[]>;
  resultatExercice(exerciceId: string): Promise<number>;
}

/**
 * Traduit une erreur PostgreSQL en message lisible par un comptable.
 * Partagé par les deux implémentations : les codes sont ceux du moteur,
 * pas ceux d'un transport.
 */
export function messageErreur(error: unknown): string {
  if (!error || typeof error !== 'object') return String(error ?? 'Erreur inconnue.');

  const e = error as { code?: string; message?: string };
  const msg = e.message ?? 'Erreur inconnue.';

  switch (e.code) {
    case '23514': // check_violation — la barrière des 21 contrôles
      return msg;
    case '23505':
      return "Cet enregistrement existe déjà.";
    case '23503':
      return "Référence introuvable : vérifiez le compte, le tiers ou le journal.";
    case '42501':
      return "Vous n'avez pas les droits pour cette opération sur ce dossier.";
    case 'PGRST116':
      return "Aucun résultat, ou dossier hors de votre périmètre.";
    default:
      return msg;
  }
}
