-- =====================================================================
-- Amorçage du mode local (PGlite dans le navigateur).
--
-- Équivalent de supabase/seed.sql, mais autonome : il crée lui-même
-- l'utilisateur au lieu d'en attendre un dans Auth, et calcule l'année de
-- l'exercice depuis la date du jour.
--
-- Testé par tests/amorcage-local.test.mjs sur un vrai PostgreSQL.
-- =====================================================================

insert into auth.users (email) values ('demo@cabinet.tn');

with u as (select id from auth.users where email = 'demo@cabinet.tn'),
     c as (
       insert into cabinet (nom, email)
       values ('Cabinet de démonstration', 'demo@cabinet.tn')
       returning id
     )
insert into collaborateur (id, cabinet_id, nom, prenom, email, profil)
select u.id, c.id, 'Démonstration', 'Mode local', 'demo@cabinet.tn', 'administrateur'
  from u, c;

insert into dossier (
  cabinet_id, code, raison_sociale, forme_juridique, mf,
  nature, regime_tva, mode_depot, longueur_compte
)
select id, 'SOC001', 'Société de démonstration SARL', 'SARL',
       '1234567A/M/C/000', 'PM', 'Reel', 'teleLiq', 6
  from cabinet;

insert into dossier_affectation (dossier_id, collaborateur_id, role)
select d.id, c.id, 'responsable' from dossier d, collaborateur c;

insert into exercice (
  dossier_id, annee, libelle, date_debut, date_fin, statut, est_courant
)
select d.id,
       extract(year from current_date)::smallint,
       'Exercice ' || extract(year from current_date)::text,
       make_date(extract(year from current_date)::int, 1, 1),
       make_date(extract(year from current_date)::int, 12, 31),
       'ouvert', true
  from dossier d;

select app.creer_periodes(id) from exercice;

insert into journal (dossier_id, code, nom, nature, rapprochement)
select d.id, j.code, j.nom, j.nature, j.rap
  from dossier d,
       (values ('AN', 'A NOUVEAU',            'AN',         false),
               ('AC', 'ACHATS',               'Achat',      false),
               ('VT', 'VENTES',               'Vente',      false),
               ('BQ', 'BANQUE',               'Tresorerie', true),
               ('OD', 'OPÉRATIONS DIVERSES',  'OD',         false),
               ('SI', 'SITUATION/INVENTAIRE', 'SituInv',    false))
       as j(code, nom, nature, rap);

insert into compte (
  dossier_id, numero, libelle, classe, type, nature_solde,
  collectif, type_tiers, lettrable, rapprochable
)
select d.id, c.num, c.lib, c.cl, c.typ, c.nat, c.coll, c.tt, c.coll, c.rap
  from dossier d,
       (values
         ('101000', 'Capital',                 1, 'Passif',  'Crediteur', false, null,          false),
         ('401000', 'Fournisseurs',            4, 'Passif',  'Crediteur', true,  'fournisseur', false),
         ('411000', 'Clients',                 4, 'Actif',   'Debiteur',  true,  'client',      false),
         ('425000', 'Personnel',               4, 'Passif',  'Crediteur', true,  'salarie',     false),
         ('436000', 'État — TVA',              4, 'Passif',  'Crediteur', false, null,          false),
         ('532000', 'Banque BIAT',             5, 'Actif',   'Debiteur',  false, null,          true),
         ('542000', 'Caisse',                  5, 'Actif',   'Debiteur',  false, null,          false),
         ('601000', 'Achats',                  6, 'Charge',  'Debiteur',  false, null,          false),
         ('606100', 'Électricité et gaz',      6, 'Charge',  'Debiteur',  false, null,          false),
         ('641000', 'Charges de personnel',    6, 'Charge',  'Debiteur',  false, null,          false),
         ('701000', 'Ventes',                  7, 'Produit', 'Crediteur', false, null,          false),
         ('706000', 'Prestations de services', 7, 'Produit', 'Crediteur', false, null,          false))
       as c(num, lib, cl, typ, nat, coll, tt, rap);

insert into tiers (dossier_id, code, raison_sociale, type, compte_collectif_id, mf)
select d.id, t.code, t.nom, t.typ, cc.id, t.mf
  from dossier d
  cross join (values
        ('FR001', 'STEG',            'fournisseur', '401000', '4567890D/M/C/003'),
        ('FR002', 'SONEDE',          'fournisseur', '401000', '5678901E/M/C/004'),
        ('CL001', 'Tunisie Telecom', 'client',      '411000', '1234567A/M/C/000'),
        ('CL002', 'SOTETEL',         'client',      '411000', '2345678B/M/C/001'))
       as t(code, nom, typ, num, mf)
  join compte cc on cc.dossier_id = d.id and cc.numero = t.num;
