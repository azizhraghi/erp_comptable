/**
 * Le mode local du frontend : amorçage et requêtes.
 *
 * Le navigateur exécutera exactement ce SQL. Le vérifier ici évite de
 * découvrir une erreur d'amorçage dans une console de développement, où
 * elle se présente sous une forme bien moins lisible.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { baseNeuve } from './harnais.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const AMORCAGE = readFileSync(
  path.join(ICI, '..', 'web', 'src', 'data', 'amorcage-local.sql'),
  'utf8'
);

let db;
let dossierId;
let exerciceId;

before(async () => {
  db = await baseNeuve();
  await db.exec(AMORCAGE);

  const { rows: u } = await db.query(`select id from auth.users limit 1`);
  await db.exec(`set app.uid = '${u[0].id}'`);

  const { rows: d } = await db.query(`select id from dossier limit 1`);
  dossierId = d[0].id;
  const { rows: e } = await db.query(`select id from exercice limit 1`);
  exerciceId = e[0].id;
});

describe('Amorçage du mode local', () => {
  test('crée un cabinet, un collaborateur administrateur et un dossier', async () => {
    const { rows } = await db.query(`
      select (select count(*)::int from cabinet)      as cabinets,
             (select count(*)::int from collaborateur) as collaborateurs,
             (select count(*)::int from dossier)       as dossiers,
             (select profil from collaborateur limit 1) as profil
    `);
    assert.deepEqual(
      { cabinets: rows[0].cabinets, collaborateurs: rows[0].collaborateurs, dossiers: rows[0].dossiers },
      { cabinets: 1, collaborateurs: 1, dossiers: 1 }
    );
    assert.equal(rows[0].profil, 'administrateur');
  });

  test('crée l\'exercice courant et ses douze périodes', async () => {
    const { rows } = await db.query(`
      select e.annee, e.statut, e.est_courant, count(p.id)::int as periodes
        from exercice e left join periode p on p.exercice_id = e.id
       group by e.annee, e.statut, e.est_courant
    `);
    assert.equal(rows[0].annee, new Date().getFullYear());
    assert.equal(rows[0].statut, 'ouvert');
    assert.equal(rows[0].est_courant, true);
    assert.equal(rows[0].periodes, 12);
  });

  test('crée six journaux et douze comptes', async () => {
    const { rows } = await db.query(`
      select (select count(*)::int from journal) as journaux,
             (select count(*)::int from compte)  as comptes,
             (select count(*)::int from tiers)   as tiers
    `);
    assert.deepEqual(rows[0], { journaux: 6, comptes: 12, tiers: 4 });
  });

  test('rattache chaque tiers à son bon compte collectif', async () => {
    const { rows } = await db.query(`
      select t.code, c.numero
        from tiers t join compte c on c.id = t.compte_collectif_id
       order by t.code
    `);
    assert.deepEqual(rows, [
      { code: 'CL001', numero: '411000' },
      { code: 'CL002', numero: '411000' },
      { code: 'FR001', numero: '401000' },
      { code: 'FR002', numero: '401000' },
    ]);
  });

  test('n\'a créé aucun tiers en trop par produit cartésien', async () => {
    // Le SQL croise un VALUES avec le dossier puis joint sur le compte :
    // une jointure mal écrite produirait ici 8 ou 16 lignes au lieu de 4.
    const { rows } = await db.query(`select count(*)::int n from tiers`);
    assert.equal(rows[0].n, 4);
  });
});

describe('Requêtes du mode local', () => {
  test('la saisie fonctionne de bout en bout', async () => {
    const { rows: c } = await db.query(
      `select id, numero from compte where numero in ('601000','532000')`
    );
    const compte = Object.fromEntries(c.map((x) => [x.numero, x.id]));
    const { rows: j } = await db.query(`select id from journal where code = 'AC'`);

    const { rows } = await db.query(`select public.enregistrer_piece($1::jsonb) as r`, [
      JSON.stringify({
        dossier_id: dossierId,
        exercice_id: exerciceId,
        journal_id: j[0].id,
        date_piece: `${new Date().getFullYear()}-06-15`,
        libelle: 'Essai',
        statut: 'revise',
        lignes: [
          { compte_id: compte['601000'], debit: 1000, credit: 0, libelle: 'Essai' },
          { compte_id: compte['532000'], debit: 0, credit: 1000, libelle: 'Essai' },
        ],
      }),
    ]);

    assert.equal(rows[0].r.statut, 'revise');
    assert.equal(rows[0].r.numero, '1');
    assert.deepEqual(rows[0].r.violations, []);
  });

  test('la balance générale se lit avec la requête exacte du dépôt local', async () => {
    const { rows } = await db.query(
      `select compte_id, compte_numero, compte_libelle, compte_classe,
              debit, credit, solde, nb_mouvements
         from v_balance_generale where exercice_id = $1 order by compte_numero`,
      [exerciceId]
    );
    assert.equal(rows.length, 2);
    assert.equal(Number(rows[0].debit) + Number(rows[1].debit), 1000);
  });

  test('le grand livre se lit avec la requête exacte du dépôt local', async () => {
    const { rows } = await db.query(
      `select ecriture_id, piece_numero, date_piece, piece_statut, journal_code,
              compte_numero, compte_libelle, tiers_code, libelle,
              debit, credit, solde_cumule, lettrage_code
         from v_grand_livre
        where exercice_id = $1 and ($2::uuid is null or compte_id = $2::uuid)
        order by compte_numero, date_piece, piece_numero, ordre`,
      [exerciceId, null]
    );
    assert.equal(rows.length, 2);
    assert.equal(rows[0].journal_code, 'AC');
  });

  test('le résultat de l\'exercice se calcule', async () => {
    const { rows } = await db.query(`select public.resultat_exercice($1) as r`, [exerciceId]);
    assert.equal(Number(rows[0].r), -1000); // une charge de 1000, aucun produit
  });
});
