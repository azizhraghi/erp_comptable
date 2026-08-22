/**
 * La couche d'appel (0008) et les éditions (0009).
 *
 * On y vérifie surtout trois promesses :
 *  - l'enregistrement d'une pièce est atomique, y compris la numérotation
 *  - le dossier d'une écriture ne peut pas diverger de celui de sa pièce
 *  - balance et grand livre concordent — le contrôle E7 devenu test de
 *    non-régression, comme annoncé dans le README
 */
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { baseNeuve, fixtures } from './harnais.mjs';

let db;
let fx;

beforeEach(async () => {
  db = await baseNeuve();
  fx = await fixtures(db);
});

async function enregistrer(payload) {
  const { rows } = await db.query(`select public.enregistrer_piece($1::jsonb) as r`, [
    JSON.stringify(payload),
  ]);
  return rows[0].r;
}

function pieceEquilibree(extra = {}) {
  return {
    dossier_id: fx.dossierId,
    exercice_id: fx.exerciceId,
    journal_id: fx.journaux.AC,
    date_piece: `${fx.annee}-06-15`,
    libelle: 'Facture STEG',
    lignes: [
      { compte_id: fx.comptes['601000'], debit: 1000, credit: 0, libelle: 'Facture STEG' },
      { compte_id: fx.comptes['532000'], debit: 0, credit: 1000, libelle: 'Facture STEG' },
    ],
    ...extra,
  };
}

async function doitEchouer(promesse, motif) {
  let erreur = null;
  try {
    await promesse;
  } catch (e) {
    erreur = e;
  }
  assert.ok(erreur, `Aurait dû être refusé (${motif})`);
  assert.match(String(erreur.message), motif);
  return erreur;
}

// =====================================================================
describe('enregistrer_piece — enregistrement atomique', () => {
  test('crée la pièce et ses lignes en un seul appel', async () => {
    const r = await enregistrer(pieceEquilibree());
    assert.ok(r.piece_id);
    assert.equal(r.statut, 'brouillon');
    assert.deepEqual(r.violations, []);

    const { rows } = await db.query(
      `select count(*)::int n from ecriture where piece_id = $1`,
      [r.piece_id]
    );
    assert.equal(rows[0].n, 2);
  });

  test('un brouillon déséquilibré est sauvegardé, avec ses violations', async () => {
    const p = pieceEquilibree();
    p.lignes[1].credit = 900;
    const r = await enregistrer(p);

    assert.equal(r.statut, 'brouillon');
    assert.ok(r.violations.some((v) => v.code === 'E4'));

    const { rows } = await db.query(`select count(*)::int n from piece where id = $1`, [
      r.piece_id,
    ]);
    assert.equal(rows[0].n, 1, 'le brouillon doit rester en base pour être corrigé');
  });

  test('un visa refusé ne laisse RIEN en base', async () => {
    const p = pieceEquilibree({ statut: 'revise' });
    p.lignes[1].credit = 900;

    await doitEchouer(enregistrer(p), /E4|déséquilibré/);

    const { rows } = await db.query(`select count(*)::int n from piece`);
    assert.equal(rows[0].n, 0, 'aucun brouillon orphelin ne doit subsister');

    const { rows: e } = await db.query(`select count(*)::int n from ecriture`);
    assert.equal(e[0].n, 0);
  });

  test('un visa accepté passe la pièce au statut revise', async () => {
    const r = await enregistrer(pieceEquilibree({ statut: 'revise' }));
    assert.equal(r.statut, 'revise');
  });

  test('une pièce sans ligne est refusée avant même les contrôles', async () => {
    await doitEchouer(
      enregistrer(pieceEquilibree({ lignes: [] })),
      /au moins deux lignes/
    );
  });
});

// =====================================================================
describe('Numérotation serveur', () => {
  test('les numéros se suivent sans intervention du client', async () => {
    const a = await enregistrer(pieceEquilibree());
    const b = await enregistrer(pieceEquilibree());
    const c = await enregistrer(pieceEquilibree());
    assert.deepEqual([a.numero, b.numero, c.numero], ['1', '2', '3']);
  });

  test('chaque journal a son propre compteur', async () => {
    const ac = await enregistrer(pieceEquilibree());
    const vt = await enregistrer(pieceEquilibree({ journal_id: fx.journaux.VT }));
    assert.equal(ac.numero, '1');
    assert.equal(vt.numero, '1');
  });

  test('un échec ne consomme pas de numéro — pas de trou pour C9', async () => {
    const a = await enregistrer(pieceEquilibree());
    assert.equal(a.numero, '1');

    const mauvaise = pieceEquilibree({ statut: 'revise' });
    mauvaise.lignes[1].credit = 1;
    await doitEchouer(enregistrer(mauvaise), /E4|déséquilibré/);

    const b = await enregistrer(pieceEquilibree());
    assert.equal(b.numero, '2', 'le compteur doit s\'être rembobiné avec la transaction');
  });

  test('reprendre un brouillon remplace ses lignes sans changer son numéro', async () => {
    const a = await enregistrer(pieceEquilibree());
    const p = pieceEquilibree({ piece_id: a.piece_id });
    p.lignes = [
      { compte_id: fx.comptes['601000'], debit: 250, credit: 0, libelle: 'Corrigé' },
      { compte_id: fx.comptes['532000'], debit: 0, credit: 250, libelle: 'Corrigé' },
    ];
    const b = await enregistrer(p);

    assert.equal(b.piece_id, a.piece_id);
    assert.equal(b.numero, a.numero);

    const { rows } = await db.query(
      `select count(*)::int n, sum(debit) d from ecriture where piece_id = $1`,
      [a.piece_id]
    );
    assert.equal(rows[0].n, 2);
    assert.equal(Number(rows[0].d), 250);
  });

  test('une pièce déjà visée n\'est plus modifiable', async () => {
    const a = await enregistrer(pieceEquilibree({ statut: 'revise' }));
    await doitEchouer(
      enregistrer(pieceEquilibree({ piece_id: a.piece_id })),
      /plus modifiable|introuvable/
    );
  });
});

// =====================================================================
describe('Cohérence dossier / pièce', () => {
  test('dossier_id est hérité de la pièce quand il n\'est pas fourni', async () => {
    const r = await enregistrer(pieceEquilibree());
    const { rows } = await db.query(
      `select count(*)::int n from ecriture where piece_id = $1 and dossier_id = $2`,
      [r.piece_id, fx.dossierId]
    );
    assert.equal(rows[0].n, 2);
  });

  test('un dossier_id divergent est refusé', async () => {
    const r = await enregistrer(pieceEquilibree());
    const { rows: [autre] } = await db.query(
      `insert into dossier (cabinet_id, code, raison_sociale)
       values ($1, 'AUTRE', 'Autre dossier') returning id`,
      [fx.cabinetId]
    );
    await doitEchouer(
      db.query(
        `insert into ecriture (piece_id, dossier_id, compte_id, ordre, libelle, debit)
         values ($1, $2, $3, 9, 'Injection', 1)`,
        [r.piece_id, autre.id, fx.comptes['601000']]
      ),
      /Incohérence/
    );
  });
});

// =====================================================================
describe('Contrôles exposés au frontend', () => {
  test('public.controler_piece renvoie les violations', async () => {
    const p = pieceEquilibree();
    p.lignes[1].credit = 900;
    const r = await enregistrer(p);

    const { rows } = await db.query(`select * from public.controler_piece($1)`, [r.piece_id]);
    assert.ok(rows.some((v) => v.code === 'E4' && v.gravite === 'bloquant'));
  });

  test('public.controler_exercice renvoie les contrôles de dossier', async () => {
    const p = pieceEquilibree();
    p.lignes[1].credit = 700;
    await enregistrer(p);

    const { rows } = await db.query(`select * from public.controler_exercice($1)`, [
      fx.exerciceId,
    ]);
    assert.ok(rows.some((v) => v.code === 'E1'));
  });
});

// =====================================================================
describe('Éditions', () => {
  beforeEach(async () => {
    // Trois pièces validées : un achat fournisseur, une vente, un règlement.
    await enregistrer({
      dossier_id: fx.dossierId, exercice_id: fx.exerciceId, journal_id: fx.journaux.AC,
      date_piece: `${fx.annee}-03-10`, libelle: 'Achat STEG', statut: 'revise',
      lignes: [
        { compte_id: fx.comptes['601000'], debit: 1000, credit: 0, libelle: 'Achat STEG' },
        { compte_id: fx.comptes['401000'], debit: 0, credit: 1000, libelle: 'Achat STEG',
          tiers_id: fx.tiersId },
      ],
    });
    await enregistrer({
      dossier_id: fx.dossierId, exercice_id: fx.exerciceId, journal_id: fx.journaux.VT,
      date_piece: `${fx.annee}-04-05`, libelle: 'Vente', statut: 'revise',
      lignes: [
        { compte_id: fx.comptes['532000'], debit: 2500, credit: 0, libelle: 'Vente' },
        { compte_id: fx.comptes['701000'], debit: 0, credit: 2500, libelle: 'Vente' },
      ],
    });
    await enregistrer({
      dossier_id: fx.dossierId, exercice_id: fx.exerciceId, journal_id: fx.journaux.AC,
      date_piece: `${fx.annee}-05-20`, libelle: 'Règlement STEG', statut: 'revise',
      lignes: [
        { compte_id: fx.comptes['401000'], debit: 400, credit: 0, libelle: 'Règlement STEG',
          tiers_id: fx.tiersId },
        { compte_id: fx.comptes['532000'], debit: 0, credit: 400, libelle: 'Règlement STEG' },
      ],
    });
  });

  test('E7 — la balance générale est équilibrée', async () => {
    const { rows } = await db.query(
      `select sum(debit) d, sum(credit) c from v_balance_generale where exercice_id = $1`,
      [fx.exerciceId]
    );
    assert.equal(Number(rows[0].d), Number(rows[0].c));
  });

  test('E7 — le solde du grand livre concorde avec la balance, compte par compte', async () => {
    const { rows } = await db.query(
      `select b.compte_numero,
              b.solde                                    as solde_balance,
              (select gl.solde_cumule
                 from v_grand_livre gl
                where gl.compte_id = b.compte_id
                  and gl.exercice_id = b.exercice_id
                order by gl.date_piece desc, gl.piece_numero desc,
                         gl.ordre desc, gl.ecriture_id desc
                limit 1)                                 as solde_gl
         from v_balance_generale b
        where b.exercice_id = $1`,
      [fx.exerciceId]
    );
    assert.ok(rows.length > 0);
    for (const r of rows) {
      assert.equal(
        Number(r.solde_balance),
        Number(r.solde_gl),
        `Divergence sur le compte ${r.compte_numero}`
      );
    }
  });

  test('la balance auxiliaire ventile le compte collectif par tiers', async () => {
    const { rows } = await db.query(
      `select tiers_code, debit, credit, solde
         from v_balance_auxiliaire where exercice_id = $1`,
      [fx.exerciceId]
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].tiers_code, 'FR001');
    assert.equal(Number(rows[0].credit), 1000);
    assert.equal(Number(rows[0].debit), 400);
    assert.equal(Number(rows[0].solde), -600);
  });

  test('le résultat vaut produits moins charges', async () => {
    const { rows } = await db.query(`select public.resultat_exercice($1) r`, [fx.exerciceId]);
    assert.equal(Number(rows[0].r), 1500); // 2500 de ventes - 1000 d'achats
  });

  test('solde_compte concorde avec la balance', async () => {
    const { rows } = await db.query(`select public.solde_compte($1, $2) s`, [
      fx.comptes['532000'],
      fx.exerciceId,
    ]);
    assert.equal(Number(rows[0].s), 2100); // 2500 encaissés - 400 réglés
  });

  test('la balance âgée ne retient que le non lettré', async () => {
    const { rows } = await db.query(
      `select count(*)::int n from v_balance_agee where exercice_id = $1`,
      [fx.exerciceId]
    );
    assert.equal(rows[0].n, 2, 'les deux mouvements du compte 401000, non lettrés');
  });
});

// =====================================================================
describe('Sécurité des vues', () => {
  test('TOUTES les vues portent security_invoker', async () => {
    const { rows } = await db.query(`
      select c.relname,
             coalesce(array_to_string(c.reloptions, ','), '') as opts
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'v'
       order by c.relname
    `);
    assert.ok(rows.length >= 6, 'les vues d\'éditions doivent exister');
    for (const v of rows) {
      assert.match(
        v.opts,
        /security_invoker=(true|on)/,
        `La vue ${v.relname} contournerait la RLS : elle exposerait tous les dossiers du cabinet.`
      );
    }
  });
});
