/**
 * Implémentation locale : PostgreSQL 18 dans le navigateur, via PGlite.
 *
 * Les données vivent dans IndexedDB et survivent aux rechargements. Les
 * migrations appliquées sont les vraies, copiées depuis supabase/migrations
 * par scripts/copier-migrations.mjs.
 *
 * DIFFÉRENCES ASSUMÉES AVEC SUPABASE
 *  - pgvector n'existe pas ici : la colonne vector(1024) et l'index HNSW de
 *    memoire_imputation sont neutralisés. Sans effet sur la comptabilité.
 *  - auth.uid() est une doublure pilotée par un réglage de session.
 *  - La RLS ne s'applique pas : on est propriétaire de la base. L'isolation
 *    entre dossiers ne peut donc PAS être testée en mode local.
 */
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';
import type {
  Collaborateur, Compte, DemandeEnregistrement, Depot, DonneesCompte, DonneesTiers, Dossier, Exercice,
  AnalyseFinanciere, AnalyseRevision, Journal, LigneBalance, LigneGrandLivre, PieceRevision, ResultatEnregistrement, Tiers, Violation,
} from './depot';

import amorcageSql from './amorcage-local.sql?raw';

const migrations = import.meta.glob('../db/migrations/*.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const PRELUDE = `
create role anon;
create role authenticated;
create role service_role;
create schema auth;
create table auth.users (
  id    uuid primary key default gen_random_uuid(),
  email text unique
);
create or replace function auth.uid() returns uuid
  language sql stable as $fn$
    select nullif(current_setting('app.uid', true), '')::uuid
  $fn$;
grant usage on schema auth to authenticated, anon;
`;

function neutraliserPgvector(sql: string): string {
  return sql
    .replace(/create extension if not exists vector;/i, '')
    .replace(/embedding\s+vector\(1024\)/i, 'embedding text')
    .replace(/create index memoire_imputation_embedding_idx[\s\S]*?;/i, '');
}

export class DepotLocal implements Depot {
  readonly mode = 'local' as const;
  private db: PGlite | null = null;
  private pret: Promise<void> | null = null;

  async initialiser(): Promise<void> {
    this.pret ??= this.demarrer();
    return this.pret;
  }

  private async demarrer(): Promise<void> {
    this.db = new PGlite('idb://comptaexpert', {
      extensions: { pgcrypto, pg_trgm, btree_gist },
    });
    await this.db.waitReady;

    const { rows } = await this.db.query<{ n: number }>(
      `select count(*)::int as n from information_schema.tables
        where table_schema = 'public' and table_name = 'ecriture'`
    );
    if (rows[0]!.n === 0) {
      await this.appliquerMigrations();
      await this.amorcer();
    }

    const { rows: u } = await this.db.query<{ id: string }>(
      `select id from auth.users limit 1`
    );
    if (u[0]) await this.db.exec(`set app.uid = '${u[0].id}'`);
  }

  private async appliquerMigrations(): Promise<void> {
    const db = this.db!;
    await db.exec(PRELUDE);
    await db.exec(`
      create extension if not exists pgcrypto;
      create extension if not exists pg_trgm;
      create extension if not exists btree_gist;
    `);

    for (const chemin of Object.keys(migrations).sort()) {
      let sql = migrations[chemin]!;
      if (chemin.includes('agents_audit')) sql = neutraliserPgvector(sql);
      await db.exec(sql);
    }
  }

  /** Cabinet, collaborateur, dossier, exercice, journaux, PCE minimal, tiers. */
  private async amorcer(): Promise<void> {
    await this.db!.exec(amorcageSql);
  }

  private async q<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    await this.initialiser();
    const { rows } = await this.db!.query<T>(sql, params as never[]);
    return rows;
  }

  async utilisateurCourant(): Promise<Collaborateur | null> {
    const r = await this.q<Collaborateur>(`select * from collaborateur limit 1`);
    return r[0] ?? null;
  }

  listerDossiers() {
    return this.q<Dossier>(`select * from dossier where actif order by code`);
  }

  listerExercices(dossierId: string) {
    return this.q<Exercice>(
      `select * from exercice where dossier_id = $1 order by annee desc`,
      [dossierId]
    );
  }

  listerJournaux(dossierId: string) {
    return this.q<Journal>(
      `select id, code, nom, nature from journal
        where dossier_id = $1 and actif order by code`,
      [dossierId]
    );
  }

  listerComptes(dossierId: string) {
    return this.q<Compte>(
      `select id, numero, libelle, classe, type, nature_solde, collectif, type_tiers,
              lettrable, rapprochable, report_ran, bloque
         from compte where dossier_id = $1 and actif order by numero`,
      [dossierId]
    );
  }

  async creerCompte(dossierId: string, donnees: DonneesCompte): Promise<Compte> {
    const r = await this.q<Compte>(
      `insert into compte (
          dossier_id, numero, libelle, classe, type, nature_solde, collectif,
          type_tiers, lettrable, rapprochable, report_ran, bloque
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        returning id, numero, libelle, classe, type, nature_solde, collectif,
                  type_tiers, lettrable, rapprochable, report_ran, bloque`,
      [
        dossierId, donnees.numero, donnees.libelle, donnees.classe, donnees.type,
        donnees.nature_solde, donnees.collectif, donnees.type_tiers, donnees.lettrable,
        donnees.rapprochable, donnees.report_ran, donnees.bloque,
      ]
    );
    return r[0]!;
  }

  async modifierCompte(compteId: string, donnees: DonneesCompte): Promise<Compte> {
    const r = await this.q<Compte>(
      `update compte set
          numero = $2, libelle = $3, classe = $4, type = $5, nature_solde = $6,
          collectif = $7, type_tiers = $8, lettrable = $9, rapprochable = $10,
          report_ran = $11, bloque = $12
        where id = $1
        returning id, numero, libelle, classe, type, nature_solde, collectif,
                  type_tiers, lettrable, rapprochable, report_ran, bloque`,
      [
        compteId, donnees.numero, donnees.libelle, donnees.classe, donnees.type,
        donnees.nature_solde, donnees.collectif, donnees.type_tiers, donnees.lettrable,
        donnees.rapprochable, donnees.report_ran, donnees.bloque,
      ]
    );
    return r[0]!;
  }

  listerTiers(dossierId: string) {
    return this.q<Tiers>(
      `select id, code, raison_sociale, type, compte_collectif_id, mf, rc, adresse,
              ville, pays, contact, telephone, email, rib, banque, devise,
              mode_reglement, delai_paiement, plafond_credit, lettrage_auto,
              gestion_echeances, statut, notes
         from tiers where dossier_id = $1 order by code`,
      [dossierId]
    );
  }

  async creerTiers(dossierId: string, donnees: DonneesTiers): Promise<Tiers> {
    const r = await this.q<Tiers>(
      `insert into tiers (
          dossier_id, code, raison_sociale, type, compte_collectif_id, mf, rc,
          adresse, ville, pays, contact, telephone, email, rib, banque, devise,
          mode_reglement, delai_paiement, plafond_credit, lettrage_auto,
          gestion_echeances, statut, notes
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
        returning id, code, raison_sociale, type, compte_collectif_id, mf, rc,
          adresse, ville, pays, contact, telephone, email, rib, banque, devise,
          mode_reglement, delai_paiement, plafond_credit, lettrage_auto,
          gestion_echeances, statut, notes`,
      [dossierId, ...valeursTiers(donnees)]
    );
    return r[0]!;
  }

  async modifierTiers(tiersId: string, donnees: DonneesTiers): Promise<Tiers> {
    const r = await this.q<Tiers>(
      `update tiers set code=$2, raison_sociale=$3, type=$4, compte_collectif_id=$5,
          mf=$6, rc=$7, adresse=$8, ville=$9, pays=$10, contact=$11,
          telephone=$12, email=$13, rib=$14, banque=$15, devise=$16,
          mode_reglement=$17, delai_paiement=$18, plafond_credit=$19,
          lettrage_auto=$20, gestion_echeances=$21, statut=$22, notes=$23
        where id=$1
        returning id, code, raison_sociale, type, compte_collectif_id, mf, rc,
          adresse, ville, pays, contact, telephone, email, rib, banque, devise,
          mode_reglement, delai_paiement, plafond_credit, lettrage_auto,
          gestion_echeances, statut, notes`,
      [tiersId, ...valeursTiers(donnees)]
    );
    return r[0]!;
  }

  async enregistrerPiece(demande: DemandeEnregistrement): Promise<ResultatEnregistrement> {
    const r = await this.q<{ r: ResultatEnregistrement }>(
      `select public.enregistrer_piece($1::jsonb) as r`,
      [JSON.stringify(demande)]
    );
    return r[0]!.r;
  }

  controlerPiece(pieceId: string) {
    return this.q<Violation>(`select * from public.controler_piece($1)`, [pieceId]);
  }

  listerPiecesRevision(exerciceId: string) {
    return this.q<PieceRevision>(
      `select id, numero, date_piece, libelle, statut, source, created_at
         from piece where exercice_id = $1
         order by date_piece desc, created_at desc limit 50`,
      [exerciceId]
    );
  }

  async analyserPieceRevision(dossierId: string, pieceId: string): Promise<AnalyseRevision> {
    const debut = performance.now();
    const violations = await this.controlerPiece(pieceId);
    const duree_ms = Math.round(performance.now() - debut);
    const confiance = violations.some((violation) => violation.gravite === 'bloquant') ? 0.99 : 1;
    await this.q(
      `insert into agent_execution (
          dossier_id, agent_code, modele, modele_version, entree_ref, sources,
          confiance, duree_ms, statut
        ) values ($1, 'REV', 'moteur-regles-sql', '1', $2, $3::jsonb, $4, $5, 'succes')`,
      [dossierId, pieceId, JSON.stringify({ piece_id: pieceId, controles: violations.map((v) => v.code) }), confiance, duree_ms]
    );
    return { violations, confiance, duree_ms };
  }

  async analyserFinancier(_dossierId: string, _exerciceId: string, _question: string): Promise<AnalyseFinanciere> {
    throw new Error('L’agent ANA nécessite Supabase et le secret MISTRAL_API_KEY.');
  }

  balanceGenerale(exerciceId: string) {
    return this.q<LigneBalance>(
      `select compte_id, compte_numero, compte_libelle, compte_classe,
              debit, credit, solde, nb_mouvements
         from v_balance_generale where exercice_id = $1 order by compte_numero`,
      [exerciceId]
    );
  }

  grandLivre(exerciceId: string, compteId?: string) {
    return this.q<LigneGrandLivre>(
      `select ecriture_id, piece_numero, date_piece, piece_statut, journal_code,
              compte_numero, compte_libelle, tiers_code, libelle,
              debit, credit, solde_cumule, lettrage_code
         from v_grand_livre
        where exercice_id = $1 and ($2::uuid is null or compte_id = $2::uuid)
        order by compte_numero, date_piece, piece_numero, ordre`,
      [exerciceId, compteId ?? null]
    );
  }

  async resultatExercice(exerciceId: string): Promise<number> {
    const r = await this.q<{ r: string }>(
      `select public.resultat_exercice($1) as r`,
      [exerciceId]
    );
    return Number(r[0]?.r ?? 0);
  }

  /** Repart d'une base vierge. Utile quand une expérience a mal tourné. */
  async reinitialiser(): Promise<void> {
    await this.db?.close();
    indexedDB.deleteDatabase('/pglite/comptaexpert');
    this.db = null;
    this.pret = null;
  }
}

function valeursTiers(donnees: DonneesTiers): unknown[] {
  return [
    donnees.code, donnees.raison_sociale, donnees.type, donnees.compte_collectif_id,
    donnees.mf, donnees.rc, donnees.adresse, donnees.ville, donnees.pays,
    donnees.contact, donnees.telephone, donnees.email, donnees.rib, donnees.banque,
    donnees.devise, donnees.mode_reglement, donnees.delai_paiement,
    donnees.plafond_credit, donnees.lettrage_auto, donnees.gestion_echeances,
    donnees.statut, donnees.notes,
  ];
}
