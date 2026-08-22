/**
 * Implémentation Supabase Cloud.
 *
 * Même schéma, mêmes fonctions SQL que le mode local — la différence tient
 * au transport (PostgREST en HTTP) et à ce que le mode local ne peut pas
 * reproduire : l'authentification GoTrue et l'isolation par RLS.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  Collaborateur, Compte, DemandeEnregistrement, Depot, Dossier, Exercice,
  Journal, LigneBalance, LigneGrandLivre, ResultatEnregistrement, Tiers, Violation,
} from './depot';

export class DepotSupabase implements Depot {
  readonly mode = 'supabase' as const;
  readonly client: SupabaseClient;

  constructor(url: string, anonKey: string) {
    // La clé anon est publique par conception : la protection vient de la
    // RLS, pas du secret de la clé. La service_role n'a jamais sa place ici.
    this.client = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }

  async initialiser(): Promise<void> {
    // Rien à préparer : le schéma est déjà en place côté serveur.
  }

  private static verifier<T>(data: T | null, error: unknown): T {
    if (error) throw error;
    return data as T;
  }

  async utilisateurCourant(): Promise<Collaborateur | null> {
    const { data: session } = await this.client.auth.getUser();
    if (!session.user) return null;
    const { data, error } = await this.client
      .from('collaborateur')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();
    if (error) throw error;
    return data as Collaborateur | null;
  }

  async listerDossiers(): Promise<Dossier[]> {
    const { data, error } = await this.client
      .from('dossier').select('*').eq('actif', true).order('code');
    return DepotSupabase.verifier(data as Dossier[], error);
  }

  async listerExercices(dossierId: string): Promise<Exercice[]> {
    const { data, error } = await this.client
      .from('exercice').select('*').eq('dossier_id', dossierId)
      .order('annee', { ascending: false });
    return DepotSupabase.verifier(data as Exercice[], error);
  }

  async listerJournaux(dossierId: string): Promise<Journal[]> {
    const { data, error } = await this.client
      .from('journal').select('id, code, nom, nature')
      .eq('dossier_id', dossierId).eq('actif', true).order('code');
    return DepotSupabase.verifier(data as Journal[], error);
  }

  async listerComptes(dossierId: string): Promise<Compte[]> {
    const { data, error } = await this.client
      .from('compte')
      .select('id, numero, libelle, classe, collectif, type_tiers, bloque')
      .eq('dossier_id', dossierId).eq('actif', true).order('numero');
    return DepotSupabase.verifier(data as Compte[], error);
  }

  async listerTiers(dossierId: string): Promise<Tiers[]> {
    const { data, error } = await this.client
      .from('tiers')
      .select('id, code, raison_sociale, type, compte_collectif_id')
      .eq('dossier_id', dossierId).eq('statut', 'actif').order('code');
    return DepotSupabase.verifier(data as Tiers[], error);
  }

  async enregistrerPiece(demande: DemandeEnregistrement): Promise<ResultatEnregistrement> {
    const { data, error } = await this.client.rpc('enregistrer_piece', {
      p_payload: demande,
    });
    return DepotSupabase.verifier(data as ResultatEnregistrement, error);
  }

  async controlerPiece(pieceId: string): Promise<Violation[]> {
    const { data, error } = await this.client.rpc('controler_piece', {
      p_piece_id: pieceId,
    });
    return DepotSupabase.verifier(data as Violation[], error);
  }

  async balanceGenerale(exerciceId: string): Promise<LigneBalance[]> {
    const { data, error } = await this.client
      .from('v_balance_generale')
      .select('compte_id, compte_numero, compte_libelle, compte_classe, debit, credit, solde, nb_mouvements')
      .eq('exercice_id', exerciceId).order('compte_numero');
    return DepotSupabase.verifier(data as LigneBalance[], error);
  }

  async grandLivre(exerciceId: string, compteId?: string): Promise<LigneGrandLivre[]> {
    let requete = this.client
      .from('v_grand_livre')
      .select('ecriture_id, piece_numero, date_piece, piece_statut, journal_code, compte_numero, compte_libelle, tiers_code, libelle, debit, credit, solde_cumule, lettrage_code')
      .eq('exercice_id', exerciceId);
    if (compteId) requete = requete.eq('compte_id', compteId);

    const { data, error } = await requete
      .order('compte_numero').order('date_piece').order('piece_numero').order('ordre');
    return DepotSupabase.verifier(data as LigneGrandLivre[], error);
  }

  async resultatExercice(exerciceId: string): Promise<number> {
    const { data, error } = await this.client.rpc('resultat_exercice', {
      p_exercice_id: exerciceId,
    });
    return Number(DepotSupabase.verifier(data as number, error) ?? 0);
  }
}
