/**
 * Implémentation Supabase Cloud.
 *
 * Même schéma, mêmes fonctions SQL que le mode local — la différence tient
 * au transport (PostgREST en HTTP) et à ce que le mode local ne peut pas
 * reproduire : l'authentification GoTrue et l'isolation par RLS.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  Collaborateur, Compte, DemandeEnregistrement, Depot, DonneesCompte, DonneesTiers, Dossier, Exercice,
  AnalyseFinanciere, AnalyseRevision, Journal, LigneBalance, LigneGrandLivre, PieceRevision, ResultatEnregistrement, Tiers, Violation,
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
      .select('id, numero, libelle, classe, type, nature_solde, collectif, type_tiers, lettrable, rapprochable, report_ran, bloque')
      .eq('dossier_id', dossierId).eq('actif', true).order('numero');
    return DepotSupabase.verifier(data as Compte[], error);
  }

  async creerCompte(dossierId: string, donnees: DonneesCompte): Promise<Compte> {
    const { data, error } = await this.client
      .from('compte')
      .insert({ dossier_id: dossierId, ...donnees })
      .select('id, numero, libelle, classe, type, nature_solde, collectif, type_tiers, lettrable, rapprochable, report_ran, bloque')
      .single();
    return DepotSupabase.verifier(data as Compte, error);
  }

  async modifierCompte(compteId: string, donnees: DonneesCompte): Promise<Compte> {
    const { data, error } = await this.client
      .from('compte')
      .update(donnees)
      .eq('id', compteId)
      .select('id, numero, libelle, classe, type, nature_solde, collectif, type_tiers, lettrable, rapprochable, report_ran, bloque')
      .single();
    return DepotSupabase.verifier(data as Compte, error);
  }

  async listerTiers(dossierId: string): Promise<Tiers[]> {
    const { data, error } = await this.client
      .from('tiers')
      .select('id, code, raison_sociale, type, compte_collectif_id, mf, rc, adresse, ville, pays, contact, telephone, email, rib, banque, devise, mode_reglement, delai_paiement, plafond_credit, lettrage_auto, gestion_echeances, statut, notes')
      .eq('dossier_id', dossierId).order('code');
    return DepotSupabase.verifier(data as Tiers[], error);
  }

  async creerTiers(dossierId: string, donnees: DonneesTiers): Promise<Tiers> {
    const { data, error } = await this.client
      .from('tiers').insert({ dossier_id: dossierId, ...donnees })
      .select('id, code, raison_sociale, type, compte_collectif_id, mf, rc, adresse, ville, pays, contact, telephone, email, rib, banque, devise, mode_reglement, delai_paiement, plafond_credit, lettrage_auto, gestion_echeances, statut, notes')
      .single();
    return DepotSupabase.verifier(data as Tiers, error);
  }

  async modifierTiers(tiersId: string, donnees: DonneesTiers): Promise<Tiers> {
    const { data, error } = await this.client
      .from('tiers').update(donnees).eq('id', tiersId)
      .select('id, code, raison_sociale, type, compte_collectif_id, mf, rc, adresse, ville, pays, contact, telephone, email, rib, banque, devise, mode_reglement, delai_paiement, plafond_credit, lettrage_auto, gestion_echeances, statut, notes')
      .single();
    return DepotSupabase.verifier(data as Tiers, error);
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

  async listerPiecesRevision(exerciceId: string): Promise<PieceRevision[]> {
    const { data, error } = await this.client
      .from('piece')
      .select('id, numero, date_piece, libelle, statut, source, created_at')
      .eq('exercice_id', exerciceId)
      .order('date_piece', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);
    return DepotSupabase.verifier(data as PieceRevision[], error);
  }

  async analyserPieceRevision(dossierId: string, pieceId: string): Promise<AnalyseRevision> {
    const debut = performance.now();
    const violations = await this.controlerPiece(pieceId);
    const duree_ms = Math.round(performance.now() - debut);
    const confiance = violations.some((violation) => violation.gravite === 'bloquant') ? 0.99 : 1;
    const { error } = await this.client.from('agent_execution').insert({
      dossier_id: dossierId,
      agent_code: 'REV',
      modele: 'moteur-regles-sql',
      modele_version: '1',
      entree_ref: pieceId,
      sources: { piece_id: pieceId, controles: violations.map((violation) => violation.code) },
      confiance,
      duree_ms,
      statut: 'succes',
    });
    if (error) throw error;
    return { violations, confiance, duree_ms };
  }

  async analyserFinancier(dossierId: string, exerciceId: string, question: string): Promise<AnalyseFinanciere> {
    const apiUrl = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8001').replace(/\/$/, '');
    const { data: session } = await this.client.auth.getSession();
    const accessToken = session.session?.access_token;
    if (!accessToken) throw new Error('Votre session a expiré. Reconnectez-vous avant de lancer l’agent ANA.');

    const response = await fetch(`${apiUrl}/api/v1/agents/ana/analyse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ dossier_id: dossierId, exercice_id: exerciceId, question }),
    });
    const payload = await response.json().catch(() => ({})) as AnalyseFinanciere & { detail?: string };
    if (!response.ok) throw new Error(payload.detail ?? 'Le backend ANA est indisponible.');
    return payload;
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
