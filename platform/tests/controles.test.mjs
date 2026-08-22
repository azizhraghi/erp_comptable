/**
 * Les 21 contrôles, vérifiés par leur comportement — pas par relecture.
 *
 *   node --test tests/
 */
import { test, describe, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  baseNeuve,
  fixtures,
  creerPiece,
  viser,
  codesBloquants,
  violations,
} from './harnais.mjs';

let db;
let fx;

before(async () => {
  db = await baseNeuve();
});

beforeEach(async () => {
  // Base neuve à chaque test : un contrôle qui laisse des traces ne doit pas
  // pouvoir en faire échouer un autre.
  db = await baseNeuve();
  fx = await fixtures(db);
});

/** Vérifie qu'une opération échoue, et que le message contient un motif. */
async function doitEchouer(promesse, motif) {
  let erreur = null;
  try {
    await promesse;
  } catch (e) {
    erreur = e;
  }
  assert.ok(erreur, `L'opération aurait dû être refusée (motif attendu : ${motif})`);
  assert.match(String(erreur.message), motif);
  return erreur;
}

// =====================================================================
describe('Contraintes structurelles — les contrôles devenus impossibles', () => {
  test('E1a : une ligne à zéro des deux côtés est refusée', async () => {
    await doitEchouer(
      creerPiece(db, fx, { lignes: [{ compte: '601000', debit: 0, credit: 0 }] }),
      /ecriture_non_vide/
    );
  });

  test('C8 / C10 : un montant négatif est refusé', async () => {
    await doitEchouer(
      creerPiece(db, fx, { lignes: [{ compte: '601000', debit: -100 }] }),
      /ecriture_montants_positifs|ecriture_non_vide/
    );
  });

  test('Une ligne ne peut pas être au débit ET au crédit', async () => {
    await doitEchouer(
      creerPiece(db, fx, { lignes: [{ compte: '601000', debit: 100, credit: 50 }] }),
      /ecriture_sens_unique/
    );
  });

  test('E3 : un libellé vide est refusé', async () => {
    await doitEchouer(
      creerPiece(db, fx, { lignes: [{ compte: '601000', debit: 100, libelle: '   ' }] }),
      /ecriture_libelle_non_vide/
    );
  });
});

// =====================================================================
describe('E4 / C1 — équilibre du folio', () => {
  test('une pièce équilibrée passe au visa', async () => {
    const p = await creerPiece(db, fx, {
      lignes: [
        { compte: '601000', debit: 1000 },
        { compte: '532000', credit: 1000 },
      ],
    });
    assert.deepEqual(await codesBloquants(db, p), []);
    await viser(db, p);
    const { rows } = await db.query('select statut from piece where id = $1', [p]);
    assert.equal(rows[0].statut, 'revise');
  });

  test('une pièce déséquilibrée est refusée au visa', async () => {
    const p = await creerPiece(db, fx, {
      lignes: [
        { compte: '601000', debit: 1000 },
        { compte: '532000', credit: 900 },
      ],
    });
    assert.ok((await codesBloquants(db, p)).includes('E4'));
    await doitEchouer(viser(db, p), /E4|Folio déséquilibré/);
  });

  test('C7 : un écart sous la tolérance de 0,001 passe, en avertissement', async () => {
    const p = await creerPiece(db, fx, {
      lignes: [
        { compte: '601000', debit: 1000.0 },
        { compte: '532000', credit: 999.999 },
      ],
    });
    const v = await violations(db, p);
    assert.deepEqual(v.filter((x) => x.gravite === 'bloquant'), []);
    assert.ok(v.some((x) => x.code === 'C7' && x.gravite === 'avertissement'));
    await viser(db, p);
  });

  test('C1 : une pièce à une seule ligne est refusée', async () => {
    const p = await creerPiece(db, fx, {
      lignes: [{ compte: '601000', debit: 1000 }],
    });
    assert.ok((await codesBloquants(db, p)).includes('C1'));
  });
});

// =====================================================================
describe('E2 — longueur des comptes généraux', () => {
  test('un compte à 4 chiffres est refusé quand le dossier en impose 6', async () => {
    const p = await creerPiece(db, fx, {
      lignes: [
        { compte: '4011', debit: 500 },
        { compte: '532000', credit: 500 },
      ],
    });
    assert.ok((await codesBloquants(db, p)).includes('E2'));
    await doitEchouer(viser(db, p), /E2/);
  });
});

// =====================================================================
describe('E3 — auxiliaire obligatoire sur compte collectif', () => {
  test('un compte 401000 sans tiers est refusé', async () => {
    const p = await creerPiece(db, fx, {
      lignes: [
        { compte: '601000', debit: 500 },
        { compte: '401000', credit: 500 },
      ],
    });
    assert.ok((await codesBloquants(db, p)).includes('E3'));
  });

  test('le même compte avec son tiers passe', async () => {
    const p = await creerPiece(db, fx, {
      lignes: [
        { compte: '601000', debit: 500 },
        { compte: '401000', credit: 500, tiers: fx.tiersId },
      ],
    });
    assert.deepEqual(await codesBloquants(db, p), []);
  });
});

// =====================================================================
describe('E5 / C2 — intervalle et verrous', () => {
  test('une date hors exercice est refusée', async () => {
    const p = await creerPiece(db, fx, {
      date: `${fx.annee + 1}-03-01`,
      lignes: [
        { compte: '601000', debit: 100 },
        { compte: '532000', credit: 100 },
      ],
    });
    assert.ok((await codesBloquants(db, p)).includes('E5'));
  });

  test('un exercice clôturé bloque le visa', async () => {
    const p = await creerPiece(db, fx, {
      lignes: [
        { compte: '601000', debit: 100 },
        { compte: '532000', credit: 100 },
      ],
    });
    await db.query(`update exercice set statut = 'cloture' where id = $1`, [fx.exerciceId]);
    assert.ok((await codesBloquants(db, p)).includes('E5'));
    await doitEchouer(viser(db, p), /E5/);
  });

  test('un verrou de saisie antérieur bloque', async () => {
    const p = await creerPiece(db, fx, {
      date: `${fx.annee}-02-10`,
      lignes: [
        { compte: '601000', debit: 100 },
        { compte: '532000', credit: 100 },
      ],
    });
    await db.query(`update exercice set lock_saisie_avant = $2 where id = $1`, [
      fx.exerciceId,
      `${fx.annee}-03-01`,
    ]);
    assert.ok((await codesBloquants(db, p)).includes('E5'));
  });

  test('une période verrouillée bloque', async () => {
    const p = await creerPiece(db, fx, {
      date: `${fx.annee}-06-15`,
      lignes: [
        { compte: '601000', debit: 100 },
        { compte: '532000', credit: 100 },
      ],
    });
    await db.query(
      `update periode set statut = 'verrouillee' where exercice_id = $1 and mois = 6`,
      [fx.exerciceId]
    );
    assert.ok((await codesBloquants(db, p)).includes('E5'));
  });
});

// =====================================================================
describe('E6 — report à nouveau au 01/01/N', () => {
  test('une écriture AN au 15/06 est refusée', async () => {
    const p = await creerPiece(db, fx, {
      journal: 'AN',
      date: `${fx.annee}-06-15`,
      lignes: [
        { compte: '601000', debit: 100 },
        { compte: '532000', credit: 100 },
      ],
    });
    assert.ok((await codesBloquants(db, p)).includes('E6'));
  });

  test('la même au 01/01 passe', async () => {
    const p = await creerPiece(db, fx, {
      journal: 'AN',
      date: `${fx.annee}-01-01`,
      lignes: [
        { compte: '601000', debit: 100 },
        { compte: '532000', credit: 100 },
      ],
    });
    assert.deepEqual(await codesBloquants(db, p), []);
  });
});

// =====================================================================
describe('C13 — champs obligatoires et compte bloqué', () => {
  test('un compte bloqué est refusé', async () => {
    await db.query(`update compte set bloque = true where id = $1`, [fx.comptes['601000']]);
    const p = await creerPiece(db, fx, {
      lignes: [
        { compte: '601000', debit: 100 },
        { compte: '532000', credit: 100 },
      ],
    });
    assert.ok((await codesBloquants(db, p)).includes('C13'));
  });

  test('une pièce sans écriture est refusée', async () => {
    const p = await creerPiece(db, fx, { lignes: [] });
    assert.ok((await codesBloquants(db, p)).includes('C13'));
  });
});

// =====================================================================
describe('C11 — libellés multiples sur une pièce', () => {
  test('deux libellés différents produisent un avertissement, pas un blocage', async () => {
    const p = await creerPiece(db, fx, {
      lignes: [
        { compte: '601000', debit: 100, libelle: 'Facture STEG' },
        { compte: '532000', credit: 100, libelle: 'Règlement' },
      ],
    });
    const v = await violations(db, p);
    assert.ok(v.some((x) => x.code === 'C11' && x.gravite === 'avertissement'));
    assert.deepEqual(v.filter((x) => x.gravite === 'bloquant'), []);
  });

  test('la casse et les espaces ne comptent pas comme une différence', async () => {
    const p = await creerPiece(db, fx, {
      lignes: [
        { compte: '601000', debit: 100, libelle: 'Facture STEG' },
        { compte: '532000', credit: 100, libelle: '  facture   steg  ' },
      ],
    });
    const v = await violations(db, p);
    assert.ok(!v.some((x) => x.code === 'C11'));
  });
});

// =====================================================================
describe('Immuabilité et transitions', () => {
  test('une écriture ne se modifie plus une fois la pièce visée', async () => {
    const p = await creerPiece(db, fx, {
      lignes: [
        { compte: '601000', debit: 100 },
        { compte: '532000', credit: 100 },
      ],
    });
    await viser(db, p);
    await doitEchouer(
      db.query(`update ecriture set debit = 999 where piece_id = $1`, [p]),
      /contre-passation|figée|figee/i
    );
  });

  test('une écriture ne se supprime plus une fois la pièce visée', async () => {
    const p = await creerPiece(db, fx, {
      lignes: [
        { compte: '601000', debit: 100 },
        { compte: '532000', credit: 100 },
      ],
    });
    await viser(db, p);
    await doitEchouer(
      db.query(`delete from ecriture where piece_id = $1`, [p]),
      /contre-passation|figée|figee/i
    );
  });

  test('une pièce ne redescend pas de statut', async () => {
    const p = await creerPiece(db, fx, {
      lignes: [
        { compte: '601000', debit: 100 },
        { compte: '532000', credit: 100 },
      ],
    });
    await viser(db, p, 'revise');
    await doitEchouer(viser(db, p, 'brouillon'), /Transition interdite/);
  });

  test('un profil junior ne peut pas superviser', async () => {
    const p = await creerPiece(db, fx, {
      lignes: [
        { compte: '601000', debit: 100 },
        { compte: '532000', credit: 100 },
      ],
    });
    await db.query(`update collaborateur set profil = 'junior' where id = $1`, [fx.userId]);
    await doitEchouer(viser(db, p, 'supervise'), /superviseur/);
  });
});

// =====================================================================
describe('Lettrage — C3 C4 C5 C6', () => {
  async function lettrer(lignes, compteNumero = '401000') {
    const { rows: [l] } = await db.query(
      `insert into lettrage (dossier_id, compte_id, code) values ($1, $2, $3) returning id`,
      [fx.dossierId, fx.comptes[compteNumero], 'L' + Math.random().toString(36).slice(2, 7)]
    );
    await db.transaction(async (tx) => {
      for (const e of lignes) {
        await tx.query(`update ecriture set lettrage_id = $1 where id = $2`, [l.id, e]);
      }
    });
    return l.id;
  }

  async function deuxEcrituresTiers(sens) {
    const p = await creerPiece(db, fx, {
      lignes: [
        { compte: '601000', debit: 500 },
        { compte: '401000', credit: 500, tiers: fx.tiersId },
      ],
    });
    const p2 = await creerPiece(db, fx, {
      lignes: [
        { compte: '401000', debit: sens === 'inverse' ? 500 : 0, credit: sens === 'inverse' ? 0 : 500, tiers: fx.tiersId },
        { compte: '532000', credit: sens === 'inverse' ? 500 : 0, debit: sens === 'inverse' ? 0 : 500 },
      ],
    });
    const { rows } = await db.query(
      `select e.id from ecriture e join compte c on c.id = e.compte_id
        where e.piece_id in ($1,$2) and c.numero = '401000' order by e.created_at`,
      [p, p2]
    );
    return rows.map((r) => r.id);
  }

  test('C5 : un lettrage à une seule écriture est refusé', async () => {
    const ids = await deuxEcrituresTiers('inverse');
    await doitEchouer(lettrer([ids[0]]), /isolé|isole/i);
  });

  test('C6 : un lettrage entièrement dans le même sens est refusé', async () => {
    const ids = await deuxEcrituresTiers('meme');
    await doitEchouer(lettrer(ids), /mono-polaire/i);
  });

  test('un lettrage équilibré débit/crédit est accepté', async () => {
    const ids = await deuxEcrituresTiers('inverse');
    const l = await lettrer(ids);
    const { rows } = await db.query(
      `select count(*)::int n from ecriture where lettrage_id = $1`,
      [l]
    );
    assert.equal(rows[0].n, 2);
  });
});

// =====================================================================
describe('Piste d\'audit', () => {
  test('la création d\'une pièce laisse une trace', async () => {
    await creerPiece(db, fx, {
      lignes: [
        { compte: '601000', debit: 100 },
        { compte: '532000', credit: 100 },
      ],
    });
    const { rows } = await db.query(
      `select count(*)::int n from audit_log where entite = 'piece' and action = 'CREATE'`
    );
    assert.ok(rows[0].n >= 1);
  });

  test('le journal d\'audit ne se modifie pas', async () => {
    await creerPiece(db, fx, {
      lignes: [
        { compte: '601000', debit: 100 },
        { compte: '532000', credit: 100 },
      ],
    });
    await doitEchouer(
      db.query(`update audit_log set description = 'falsifié'`),
      /ajout seul/i
    );
  });

  test('le journal d\'audit ne s\'efface pas', async () => {
    await creerPiece(db, fx, {
      lignes: [
        { compte: '601000', debit: 100 },
        { compte: '532000', credit: 100 },
      ],
    });
    await doitEchouer(db.query(`delete from audit_log`), /ajout seul/i);
  });
});

// =====================================================================
describe('E1 / C9 — contrôles de dossier', () => {
  test('E1 : un exercice déséquilibré interdit les éditions', async () => {
    // On force le déséquilibre au niveau exercice en laissant une pièce
    // déséquilibrée en brouillon.
    await creerPiece(db, fx, {
      lignes: [
        { compte: '601000', debit: 1000 },
        { compte: '532000', credit: 700 },
      ],
    });
    const { rows } = await db.query(`select * from app.controler_dossier($1, $2)`, [
      fx.dossierId,
      fx.exerciceId,
    ]);
    assert.ok(rows.some((r) => r.code === 'E1' && r.gravite === 'bloquant'));
  });

  test('C9 : un saut de numéro de pièce est signalé sans bloquer', async () => {
    for (const n of ['1', '2', '7']) {
      await creerPiece(db, fx, {
        numero: n,
        lignes: [
          { compte: '601000', debit: 100 },
          { compte: '532000', credit: 100 },
        ],
      });
    }
    const { rows } = await db.query(`select * from app.controler_dossier($1, $2)`, [
      fx.dossierId,
      fx.exerciceId,
    ]);
    const c9 = rows.filter((r) => r.code === 'C9');
    assert.ok(c9.length >= 1);
    assert.equal(c9[0].gravite, 'avertissement');
  });
});
