/**
 * Console SQL sur le schéma ComptaExpert, sans Supabase et sans Docker.
 *
 *     npm run bac-a-sable
 *
 * Monte un PostgreSQL 18 en mémoire, applique les 9 migrations, pose un
 * dossier de démonstration avec quelques écritures, puis rend la main.
 *
 * Les données ne sont pas persistées : chaque lancement repart de zéro.
 * C'est fait pour essayer des choses sans conséquence.
 */
import readline from 'node:readline';
import { baseNeuve, fixtures } from './harnais.mjs';

const AIDE = `
Commandes
  \\dt              lister les tables
  \\dv              lister les vues
  \\df              lister les fonctions appelables par le frontend
  \\d <table>       décrire une table
  \\exemples        requêtes d'exemple à copier
  \\aide            ce message
  \\q               quitter

Tout le reste est exécuté comme du SQL. Les requêtes sur plusieurs lignes
se terminent par un point-virgule.
`;

const EXEMPLES = `
-- La balance générale
select compte_numero, compte_libelle, debit, credit, solde
  from v_balance_generale order by compte_numero;

-- Le grand livre d'un compte, avec solde progressif
select date_piece, piece_numero, libelle, debit, credit, solde_cumule
  from v_grand_livre where compte_numero = '401000'
 order by date_piece;

-- La balance auxiliaire, par tiers
select tiers_code, tiers_nom, debit, credit, solde from v_balance_auxiliaire;

-- Le résultat de l'exercice
select public.resultat_exercice((select id from exercice limit 1));

-- Enregistrer une pièce DÉSÉQUILIBRÉE et voir les contrôles la refuser
select public.enregistrer_piece(jsonb_build_object(
  'dossier_id',  (select id from dossier limit 1),
  'exercice_id', (select id from exercice limit 1),
  'journal_id',  (select id from journal where code='OD' limit 1),
  'date_piece',  '2026-07-01',
  'libelle',     'Essai desequilibre',
  'statut',      'revise',
  'lignes', jsonb_build_array(
    jsonb_build_object('compte_id',(select id from compte where numero='601000'),'debit',100,'credit',0),
    jsonb_build_object('compte_id',(select id from compte where numero='532000'),'debit',0,'credit',80)
  )
));

-- Une écriture de report à nouveau mal datée : le contrôle E6 doit la refuser
select public.enregistrer_piece(jsonb_build_object(
  'dossier_id',  (select id from dossier limit 1),
  'exercice_id', (select id from exercice limit 1),
  'journal_id',  (select id from journal where code='AN' limit 1),
  'date_piece',  '2026-07-01',
  'libelle',     'RAN mal date',
  'statut',      'revise',
  'lignes', jsonb_build_array(
    jsonb_build_object('compte_id',(select id from compte where numero='601000'),'debit',100,'credit',0),
    jsonb_build_object('compte_id',(select id from compte where numero='532000'),'debit',0,'credit',100)
  )
));

-- La piste d'audit, qu'on ne peut ni modifier ni effacer
select horodatage, action, entite, description from audit_log order by id desc limit 10;
update audit_log set description = 'falsifie';   -- doit être refusé
`;

function afficher(rows, fields) {
  if (!rows || rows.length === 0) {
    console.log('(aucune ligne)');
    return;
  }
  const cols = fields?.map((f) => f.name) ?? Object.keys(rows[0]);
  const texte = (v) =>
    v === null || v === undefined
      ? ''
      : typeof v === 'object'
        ? JSON.stringify(v)
        : String(v);

  const larg = cols.map((c) =>
    Math.min(48, Math.max(c.length, ...rows.map((r) => texte(r[c]).length)))
  );

  const ligne = (cells) =>
    cells.map((c, i) => texte(c).slice(0, larg[i]).padEnd(larg[i])).join('  ');

  console.log('\x1b[1m' + ligne(cols) + '\x1b[0m');
  console.log(larg.map((l) => '─'.repeat(l)).join('  '));
  for (const r of rows) console.log(ligne(cols.map((c) => r[c])));
  console.log(`(${rows.length} ligne${rows.length > 1 ? 's' : ''})`);
}

console.log('Démarrage de PostgreSQL et application des migrations…');
const db = await baseNeuve();
const fx = await fixtures(db);

// Trois pièces de démonstration, pour avoir quelque chose à interroger.
const piece = (journal, date, libelle, lignes) =>
  db.query(`select public.enregistrer_piece($1::jsonb)`, [
    JSON.stringify({
      dossier_id: fx.dossierId,
      exercice_id: fx.exerciceId,
      journal_id: fx.journaux[journal],
      date_piece: date,
      libelle,
      statut: 'revise',
      lignes,
    }),
  ]);

await piece('AC', `${fx.annee}-03-10`, 'Facture STEG', [
  { compte_id: fx.comptes['601000'], debit: 1000, credit: 0, libelle: 'Facture STEG' },
  { compte_id: fx.comptes['401000'], debit: 0, credit: 1000, libelle: 'Facture STEG', tiers_id: fx.tiersId },
]);
await piece('VT', `${fx.annee}-04-05`, 'Vente client', [
  { compte_id: fx.comptes['532000'], debit: 2500, credit: 0, libelle: 'Vente client' },
  { compte_id: fx.comptes['701000'], debit: 0, credit: 2500, libelle: 'Vente client' },
]);
await piece('AC', `${fx.annee}-05-20`, 'Règlement STEG', [
  { compte_id: fx.comptes['401000'], debit: 400, credit: 0, libelle: 'Règlement STEG', tiers_id: fx.tiersId },
  { compte_id: fx.comptes['532000'], debit: 0, credit: 400, libelle: 'Règlement STEG' },
]);

console.log(`
PostgreSQL 18 · schéma ComptaExpert · 9 migrations appliquées

  Dossier    TEST — Dossier de test
  Exercice   ${fx.annee}, ouvert
  Journaux   AN, AC, VT, OD
  Comptes    601000, 701000, 401000, 411000, 532000
  Tiers      FR001 (STEG)
  Écritures  3 pièces visées

Tapez \\aide pour les commandes, \\exemples pour des requêtes toutes faites.
`);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let tampon = '';

const invite = () => rl.setPrompt(tampon ? '   ... ' : 'compta> ');

/**
 * Les lignes sont traitées une par une, en file.
 * Sans cela, un script envoyé par tube verrait `close` tuer les requêtes
 * encore en vol — et n'afficherait jamais leurs résultats.
 */
let file = Promise.resolve();
const enFile = (fn) => (file = file.then(fn).catch((e) => console.error(e)));

invite();
rl.prompt();

rl.on('line', (entree) => enFile(() => traiter(entree)));

async function traiter(entree) {
  const l = entree.trim();

  if (!tampon) {
    if (l === '\\q' || l === 'exit' || l === 'quit') return rl.close();
    if (l === '\\aide' || l === '\\?') { console.log(AIDE); invite(); return rl.prompt(); }
    if (l === '\\exemples') { console.log(EXEMPLES); invite(); return rl.prompt(); }
    if (l === '') { return rl.prompt(); }

    const raccourcis = {
      '\\dt': `select table_name from information_schema.tables
                where table_schema='public' and table_type='BASE TABLE' order by 1`,
      '\\dv': `select table_name from information_schema.views
                where table_schema='public' order by 1`,
      '\\df': `select routine_name, data_type as retour from information_schema.routines
                where routine_schema='public' and routine_name not like 'pg_%'
                  and routine_name in ('enregistrer_piece','controler_piece','controler_exercice',
                                       'solde_compte','solde_tiers','resultat_exercice')
                order by 1`,
    };
    if (raccourcis[l]) {
      const r = await db.query(raccourcis[l]);
      afficher(r.rows, r.fields);
      invite();
      return rl.prompt();
    }
    if (l.startsWith('\\d ')) {
      const t = l.slice(3).trim();
      const r = await db.query(
        `select column_name, data_type, is_nullable, column_default
           from information_schema.columns
          where table_schema='public' and table_name=$1
          order by ordinal_position`,
        [t]
      );
      afficher(r.rows, r.fields);
      invite();
      return rl.prompt();
    }
  }

  tampon += (tampon ? '\n' : '') + entree;
  if (!tampon.trimEnd().endsWith(';')) { invite(); return rl.prompt(); }

  const sql = tampon.trim();
  tampon = '';

  try {
    const r = await db.query(sql);
    if (r.fields?.length) afficher(r.rows, r.fields);
    else console.log(`OK${r.affectedRows != null ? ` (${r.affectedRows})` : ''}`);
  } catch (e) {
    // Les refus du noyau arrivent ici : c'est le comportement attendu,
    // pas un incident du bac à sable.
    console.log('\x1b[31m' + String(e.message).trim() + '\x1b[0m');
  }
  invite();
  rl.prompt();
}

// On attend que la file soit vide avant de rendre la main : un script envoyé
// par tube doit voir tous ses résultats, pas être coupé en plein vol.
rl.on('close', () => {
  file.finally(() => {
    console.log('\nÀ bientôt.');
    process.exit(0);
  });
});
