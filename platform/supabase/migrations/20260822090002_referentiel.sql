-- =====================================================================
-- 0002 — RÉFÉRENTIEL : exercices, périodes, journaux, plan comptable, tiers
-- Dérivé de compta-tunisie/src/types.ts, étendu là où V61 allait plus loin
-- (verrous de saisie par journal, comptes associés aux tiers).
-- =====================================================================

-- ---------------------------------------------------------------------
-- EXERCICE
-- lock_saisie_avant / lock_modifs_avant viennent de V61 et deviennent ici
-- des invariants serveur : plus aucun chemin applicatif ne peut les
-- contourner (cf. contrôle E5 en 0004).
-- ---------------------------------------------------------------------
create table exercice (
  id               uuid primary key default gen_random_uuid(),
  dossier_id       uuid not null references dossier(id) on delete cascade,
  annee            smallint not null,
  libelle          text,
  date_debut       date not null,
  date_fin         date not null,
  statut           text not null default 'ouvert'
                   check (statut in ('ouvert','cloture','archive')),
  est_courant      boolean not null default false,
  premiere_annee   boolean not null default false,

  ran_genere       boolean not null default false,
  ran_date         timestamptz,
  resultat         numeric(15,3),

  lock_saisie_avant date,
  lock_modifs_avant date,

  date_cloture     timestamptz,
  cloture_par      uuid references collaborateur(id),
  created_at       timestamptz not null default now(),

  unique (dossier_id, annee),
  constraint exercice_dates_coherentes check (date_fin > date_debut)
);

-- Un seul exercice courant par dossier.
create unique index exercice_un_seul_courant
  on exercice (dossier_id) where est_courant;

-- Deux exercices d'un même dossier ne peuvent pas se chevaucher.
alter table exercice add constraint exercice_pas_de_chevauchement
  exclude using gist (
    dossier_id with =,
    daterange(date_debut, date_fin, '[]') with &&
  );

create index on exercice (dossier_id, annee desc);

-- ---------------------------------------------------------------------
-- PÉRIODE — les 12 mois. Absente de V61, présente dans types.ts.
-- Le verrouillage mensuel est ce qui permet à un cabinet de figer janvier
-- pendant qu'il saisit février.
-- ---------------------------------------------------------------------
create table periode (
  id             uuid primary key default gen_random_uuid(),
  exercice_id    uuid not null references exercice(id) on delete cascade,
  dossier_id     uuid not null references dossier(id) on delete cascade,
  mois           smallint not null check (mois between 1 and 12),
  libelle        text,
  date_debut     date not null,
  date_fin       date not null,
  statut         text not null default 'ouverte'
                 check (statut in ('ouverte','verrouillee','cloturee')),
  verrouillee_par uuid references collaborateur(id),
  verrouillee_le  timestamptz,

  unique (exercice_id, mois)
);

create index on periode (dossier_id, statut);

-- Génère les 12 périodes d'un exercice.
create or replace function app.creer_periodes(p_exercice_id uuid)
returns void
language plpgsql
as $$
declare
  v_ex exercice%rowtype;
  v_mois date;
begin
  select * into v_ex from exercice where id = p_exercice_id;
  if not found then
    raise exception 'Exercice % introuvable', p_exercice_id;
  end if;

  v_mois := date_trunc('month', v_ex.date_debut)::date;
  while v_mois <= v_ex.date_fin loop
    insert into periode (exercice_id, dossier_id, mois, libelle, date_debut, date_fin)
    values (
      v_ex.id,
      v_ex.dossier_id,
      extract(month from v_mois)::smallint,
      to_char(v_mois, 'TMMonth YYYY'),
      greatest(v_mois, v_ex.date_debut),
      least((v_mois + interval '1 month - 1 day')::date, v_ex.date_fin)
    )
    on conflict (exercice_id, mois) do nothing;
    v_mois := (v_mois + interval '1 month')::date;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- JOURNAL
-- La nature 'AN' déclenche le contrôle E6 : toute pièce d'un journal AN
-- doit être datée au 01/01 de l'exercice.
-- ---------------------------------------------------------------------
create table journal (
  id             uuid primary key default gen_random_uuid(),
  dossier_id     uuid not null references dossier(id) on delete cascade,
  code           text not null,
  nom            text not null,
  nature         text not null
                 check (nature in ('AN','Achat','Vente','Tresorerie','OD','SituInv')),
  compte_treso_id uuid,            -- FK ajoutée après création de compte
  rapprochement  boolean not null default false,
  actif          boolean not null default true,

  lock_saisie_avant date,
  lock_modifs_avant date,

  unique (dossier_id, code)
);

create index on journal (dossier_id) where actif;

comment on column journal.nature is
  'AN déclenche le contrôle E6 (pièce obligatoirement datée au 01/01/N).';

-- ---------------------------------------------------------------------
-- COMPTE — Plan Comptable des Entreprises
-- Les rubriques NEF et liasse sont portées par le compte, comme dans
-- types.ts : c'est ce qui permet de générer les états financiers sans
-- table de correspondance externe.
-- ---------------------------------------------------------------------
create table compte (
  id             uuid primary key default gen_random_uuid(),
  dossier_id     uuid not null references dossier(id) on delete cascade,
  numero         text not null,
  libelle        text not null,
  libelle_court  text,
  classe         smallint not null check (classe between 1 and 8),
  type           text check (type in ('Actif','Passif','Charge','Produit')),
  nature_solde   text not null default 'Debiteur'
                 check (nature_solde in ('Debiteur','Crediteur','Solde')),

  -- Gestion des tiers : un compte collectif exige un tiers sur chaque
  -- écriture (contrôle E3).
  collectif      boolean not null default false,
  type_tiers     text check (type_tiers in ('client','fournisseur','salarie','autre')),

  lettrable      boolean not null default false,
  rapprochable   boolean not null default false,
  report_ran     text not null default 'solde' check (report_ran in ('detail','solde')),
  contrepartie_auto_id uuid references compte(id),
  devise_compte  char(3),

  -- Rubriques d'états financiers
  rubrique_bilan  text,           -- A.01 → P.06
  rubrique_cr     text,           -- R.01 → R.15
  rubrique_liasse text,           -- F6001 → F6005
  sens_solde_etat text check (sens_solde_etat in ('Debit','Credit','Solde absolu')),

  cycle_audit    text,            -- C → S
  bloque         boolean not null default false,
  actif          boolean not null default true,

  unique (dossier_id, numero),
  -- Un compte collectif doit dire de quel type de tiers il s'agit.
  constraint compte_collectif_type_tiers
    check (not collectif or type_tiers is not null)
);

create index on compte (dossier_id, numero);
create index on compte (dossier_id, classe) where actif;
create index on compte (dossier_id) where collectif and actif;

alter table journal
  add constraint journal_compte_treso_fk
  foreign key (compte_treso_id) references compte(id) on delete set null;

-- ---------------------------------------------------------------------
-- TIERS
-- ---------------------------------------------------------------------
create table tiers (
  id                  uuid primary key default gen_random_uuid(),
  dossier_id          uuid not null references dossier(id) on delete cascade,
  code                text not null,
  raison_sociale      text not null,
  type                text not null default 'client'
                      check (type in ('client','fournisseur','salarie','autre')),
  compte_collectif_id uuid references compte(id),

  mf                  text,
  rc                  text,
  adresse             text,
  ville               text,
  pays                text default 'Tunisie',
  contact             text,
  telephone           text,
  email               text,
  rib                 text,
  banque              text,

  devise              char(3) default 'TND',
  mode_reglement      text,
  delai_paiement      smallint default 0,
  plafond_credit      numeric(15,3),

  lettrage_auto       boolean not null default true,
  gestion_echeances   boolean not null default true,
  statut              text not null default 'actif'
                      check (statut in ('actif','bloque','inactif')),
  notes               text,

  unique (dossier_id, code)
);

create index on tiers (dossier_id, type) where statut = 'actif';
create index on tiers using gin (raison_sociale gin_trgm_ops);

-- Comptes auxiliaires associés à un tiers (un tiers peut être client ET
-- fournisseur, donc rattaché à deux comptes collectifs).
create table tiers_compte (
  tiers_id   uuid not null references tiers(id) on delete cascade,
  compte_id  uuid not null references compte(id) on delete cascade,
  primary key (tiers_id, compte_id)
);
