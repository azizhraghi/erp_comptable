/**
 * Harnais de test — PostgreSQL 18 via PGlite (WebAssembly, sans Docker).
 *
 * Applique les migrations réelles sur une base neuve en mémoire, puis pose
 * un jeu de fixtures minimal. Chaque fichier de test repart d'une base vierge.
 *
 * CE QUE CE HARNAIS NE COUVRE PAS
 *  - pgvector n'est pas embarqué dans PGlite : la colonne `vector(1024)` et
 *    l'index HNSW sont neutralisés. Ces deux lignes restent non vérifiées et
 *    le seront à la première application sur Supabase.
 *  - Les tests tournent en superutilisateur, qui contourne la RLS. Le
 *    comportement des policies se vérifie séparément, avec de vrais JWT :
 *    voir docs/tests-isolation.md.
 *
 * Ce qui EST couvert : les 21 contrôles, l'immuabilité, les transitions de
 * statut, les contraintes structurelles et le journal en ajout seul.
 */
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS = path.join(ICI, '..', 'supabase', 'migrations');

/**
 * auth.uid() est pilotable par `set local test.uid` : c'est ce qui permet de
 * tester les contrôles de profil (visa superviseur) sans GoTrue.
 */
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
    select nullif(current_setting('test.uid', true), '')::uuid
  $fn$;
grant usage on schema auth to authenticated, anon;
`;

function neutraliserPgvector(sql) {
  return sql
    .replace(/create extension if not exists vector;/i, '')
    .replace(/embedding\s+vector\(1024\)/i, 'embedding text')
    .replace(/create index memoire_imputation_embedding_idx[\s\S]*?;/i, '');
}

/** Base neuve, migrations appliquées, extensions chargées. */
export async function baseNeuve() {
  const db = new PGlite({ extensions: { pgcrypto, pg_trgm, btree_gist } });
  await db.exec(PRELUDE);
  await db.exec(`
    create extension if not exists pgcrypto;
    create extension if not exists pg_trgm;
    create extension if not exists btree_gist;
  `);

  for (const f of readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort()) {
    let sql = readFileSync(path.join(MIGRATIONS, f), 'utf8');
    if (f.includes('agents_audit')) sql = neutraliserPgvector(sql);
    await db.exec(sql);
  }
  return db;
}

/**
 * Jeu de fixtures : un cabinet, un collaborateur superviseur, un dossier,
 * un exercice ouvert avec ses périodes, six journaux, quelques comptes.
 * Renvoie les identifiants utiles aux tests.
 */
export async function fixtures(db) {
  const annee = 2026;

  const { rows: [u] } = await db.query(
    `insert into auth.users (email) values ('test@cabinet.tn') returning id`
  );
  const { rows: [cab] } = await db.query(
    `insert into cabinet (nom) values ('Cabinet Test') returning id`
  );
  await db.query(
    `insert into collaborateur (id, cabinet_id, nom, email, profil)
     values ($1, $2, 'Testeur', 'test@cabinet.tn', 'superviseur')`,
    [u.id, cab.id]
  );
  const { rows: [dos] } = await db.query(
    `insert into dossier (cabinet_id, code, raison_sociale, longueur_compte)
     values ($1, 'TEST', 'Dossier de test', 6) returning id`,
    [cab.id]
  );
  const { rows: [ex] } = await db.query(
    `insert into exercice (dossier_id, annee, date_debut, date_fin, statut, est_courant)
     values ($1, $2, $3, $4, 'ouvert', true) returning id`,
    [dos.id, annee, `${annee}-01-01`, `${annee}-12-31`]
  );
  await db.query(`select app.creer_periodes($1)`, [ex.id]);

  const journaux = {};
  for (const [code, nom, nature] of [
    ['AN', 'A NOUVEAU', 'AN'],
    ['AC', 'ACHATS', 'Achat'],
    ['VT', 'VENTES', 'Vente'],
    ['OD', 'OPERATIONS DIVERSES', 'OD'],
  ]) {
    const { rows: [j] } = await db.query(
      `insert into journal (dossier_id, code, nom, nature)
       values ($1, $2, $3, $4) returning id`,
      [dos.id, code, nom, nature]
    );
    journaux[code] = j.id;
  }

  const comptes = {};
  for (const [num, lib, classe, collectif, typeTiers] of [
    ['601000', 'Achats', 6, false, null],
    ['701000', 'Ventes', 7, false, null],
    ['401000', 'Fournisseurs', 4, true, 'fournisseur'],
    ['411000', 'Clients', 4, true, 'client'],
    ['532000', 'Banque', 5, false, null],
    ['4011', 'Compte trop court', 4, false, null], // sert au contrôle E2
  ]) {
    const { rows: [c] } = await db.query(
      `insert into compte (dossier_id, numero, libelle, classe, collectif, type_tiers, lettrable)
       values ($1, $2, $3, $4, $5, $6, $5) returning id`,
      [dos.id, num, lib, classe, collectif, typeTiers]
    );
    comptes[num] = c.id;
  }

  const { rows: [t] } = await db.query(
    `insert into tiers (dossier_id, code, raison_sociale, type, compte_collectif_id)
     values ($1, 'FR001', 'STEG', 'fournisseur', $2) returning id`,
    [dos.id, comptes['401000']]
  );

  await db.exec(`set test.uid = '${u.id}'`);

  return {
    annee,
    userId: u.id,
    cabinetId: cab.id,
    dossierId: dos.id,
    exerciceId: ex.id,
    journaux,
    comptes,
    tiersId: t.id,
  };
}

let compteurPiece = 0;

/**
 * Crée une pièce au statut brouillon avec ses lignes.
 * lignes : [{ compte, tiers?, debit?, credit?, libelle? }]
 */
export async function creerPiece(db, fx, { journal = 'OD', date, lignes, numero }) {
  compteurPiece += 1;
  const { rows: [p] } = await db.query(
    `insert into piece (dossier_id, exercice_id, journal_id, numero, date_piece, libelle)
     values ($1, $2, $3, $4, $5, 'Pièce de test') returning id`,
    [
      fx.dossierId,
      fx.exerciceId,
      fx.journaux[journal],
      numero ?? String(compteurPiece),
      date ?? `${fx.annee}-06-15`,
    ]
  );

  let ordre = 0;
  for (const l of lignes) {
    ordre += 1;
    await db.query(
      `insert into ecriture (piece_id, dossier_id, compte_id, tiers_id, ordre, libelle, debit, credit)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        p.id,
        fx.dossierId,
        fx.comptes[l.compte],
        l.tiers ?? null,
        ordre,
        l.libelle ?? 'Ligne de test',
        l.debit ?? 0,
        l.credit ?? 0,
      ]
    );
  }
  return p.id;
}

/** Tente de faire passer la pièce au statut demandé. */
export function viser(db, pieceId, statut = 'revise') {
  return db.query(`update piece set statut = $2 where id = $1`, [pieceId, statut]);
}

/** Les violations renvoyées par le noyau pour une pièce. */
export async function violations(db, pieceId) {
  const { rows } = await db.query(`select * from app.controler_piece($1)`, [pieceId]);
  return rows;
}

/** Codes des violations bloquantes uniquement. */
export async function codesBloquants(db, pieceId) {
  return (await violations(db, pieceId))
    .filter((v) => v.gravite === 'bloquant')
    .map((v) => v.code);
}
