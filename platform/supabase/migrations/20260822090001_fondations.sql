-- =====================================================================
-- 0001 — FONDATIONS : multi-dossier, collaborateurs, helpers d'isolation
-- ComptaExpert / plateforme de cabinet — Supabase auto-hébergé
-- ---------------------------------------------------------------------
-- Arbitrage A : le Dossier est l'entité racine. Chaque table métier
-- porte un dossier_id et l'isolation est appliquée en base (RLS),
-- jamais dans le code applicatif.
-- =====================================================================

create extension if not exists pgcrypto;      -- gen_random_uuid()
create extension if not exists pg_trgm;       -- recherche floue libellés / tiers
create extension if not exists btree_gist;    -- contraintes d'exclusion sur périodes

-- Schéma technique : helpers non exposés à l'API REST
create schema if not exists app;

-- ---------------------------------------------------------------------
-- CABINET — le locataire. Une seule ligne au démarrage, mais la colonne
-- existe dès maintenant pour ne pas avoir à migrer un grand livre plus tard.
-- ---------------------------------------------------------------------
create table cabinet (
  id            uuid primary key default gen_random_uuid(),
  nom           text not null,
  mf            text,
  adresse       text,
  telephone     text,
  email         text,
  actif         boolean not null default true,
  created_at    timestamptz not null default now()
);

comment on table cabinet is
  'Le cabinet d''expertise comptable. Racine de tenancy pour un futur SaaS multi-cabinets.';

-- ---------------------------------------------------------------------
-- COLLABORATEUR — adossé à auth.users de Supabase.
-- Les profils reprennent ceux de V61 (Junior / Senior / Administrateur)
-- en y ajoutant le superviseur, qui existait déjà comme visa sans exister
-- comme profil.
-- ---------------------------------------------------------------------
create table collaborateur (
  id            uuid primary key references auth.users(id) on delete cascade,
  cabinet_id    uuid not null references cabinet(id) on delete restrict,
  nom           text not null,
  prenom        text,
  email         text not null,
  profil        text not null default 'junior'
                check (profil in ('administrateur','superviseur','senior','junior','lecture')),
  actif         boolean not null default true,
  derniere_connexion timestamptz,
  created_at    timestamptz not null default now()
);

create index on collaborateur (cabinet_id) where actif;

-- ---------------------------------------------------------------------
-- DOSSIER — la réconciliation des trois référentiels.
--   * state.societe        (ComptaExpert V61)
--   * clients[]            (Échéances Expert)
--   * champ texte Société  (Éditions GL et BG)
-- deviennent une seule entité. Les colonnes nature / regime_tva /
-- mode_depot viennent d'Échéances Expert : ce sont elles qui pilotent
-- le calcul des dates d'exigibilité déclaratives.
-- ---------------------------------------------------------------------
create table dossier (
  id              uuid primary key default gen_random_uuid(),
  cabinet_id      uuid not null references cabinet(id) on delete restrict,
  code            text not null,
  raison_sociale  text not null,
  forme_juridique text,
  mf              text,
  rc              text,

  -- Détermine les règles d'échéance déclarative (cf. 0005)
  nature          text not null default 'PM' check (nature in ('PP','PM')),
  regime_tva      text check (regime_tva in ('Reel','Forfaitaire','Suspension')),
  mode_depot      text check (mode_depot in ('teleDec','teleLiq')),
  type_comptabilite text default 'Generale'
                  check (type_comptabilite in ('Generale','Developpee','Simplifiee')),

  -- Paramètres comptables. longueur_compte alimente le contrôle « comptes
  -- à 6 chiffres » : il est paramétrable par dossier, pas figé à 6.
  devise_base     char(3) not null default 'TND',
  multi_devise    boolean not null default false,
  longueur_compte smallint not null default 6 check (longueur_compte between 3 and 12),

  adresse         text,
  contact         text,
  telephone       text,
  email           text,
  notes           text,
  actif           boolean not null default true,
  created_at      timestamptz not null default now(),

  unique (cabinet_id, code)
);

create index on dossier (cabinet_id) where actif;
create index on dossier using gin (raison_sociale gin_trgm_ops);

comment on column dossier.nature is
  'PP ou PM. Croisée avec mode_depot pour déterminer le jour d''exigibilité de chaque déclaration.';
comment on column dossier.longueur_compte is
  'Longueur imposée des numéros de compte général. Alimente le contrôle E2.';

-- ---------------------------------------------------------------------
-- AFFECTATION — qui travaille sur quel dossier. C'est la table que lit
-- la RLS : un collaborateur ne voit que les dossiers où il est affecté.
-- ---------------------------------------------------------------------
create table dossier_affectation (
  dossier_id       uuid not null references dossier(id) on delete cascade,
  collaborateur_id uuid not null references collaborateur(id) on delete cascade,
  role             text not null default 'collaborateur'
                   check (role in ('responsable','superviseur','collaborateur','lecture')),
  created_at       timestamptz not null default now(),
  primary key (dossier_id, collaborateur_id)
);

create index on dossier_affectation (collaborateur_id);

-- =====================================================================
-- HELPERS D'ISOLATION
-- Utilisés par toutes les policies RLS de 0007. En SECURITY DEFINER pour
-- pouvoir lire collaborateur / affectation sans récursion de policy.
-- =====================================================================

-- Dossiers visibles par l'utilisateur courant.
create or replace function app.dossiers_autorises()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  -- Affectation explicite
  select da.dossier_id
    from dossier_affectation da
   where da.collaborateur_id = auth.uid()

  union

  -- Un administrateur voit tous les dossiers de son cabinet
  select d.id
    from dossier d
    join collaborateur c on c.cabinet_id = d.cabinet_id
   where c.id = auth.uid()
     and c.profil = 'administrateur'
     and c.actif;
$$;

-- L'utilisateur courant peut-il écrire sur ce dossier ?
create or replace function app.peut_ecrire(p_dossier_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
      from dossier_affectation da
      join collaborateur c on c.id = da.collaborateur_id
     where da.dossier_id = p_dossier_id
       and da.collaborateur_id = auth.uid()
       and da.role <> 'lecture'
       and c.actif
  ) or exists (
    select 1
      from collaborateur c
      join dossier d on d.cabinet_id = c.cabinet_id
     where c.id = auth.uid()
       and d.id = p_dossier_id
       and c.profil = 'administrateur'
       and c.actif
  );
$$;

-- Profil de l'utilisateur courant — sert aux transitions de visa.
create or replace function app.profil_courant()
returns text
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select profil from collaborateur where id = auth.uid() and actif;
$$;

-- Cabinet de l'utilisateur courant. SECURITY DEFINER est indispensable :
-- une policy RLS sur collaborateur ne doit jamais relire collaborateur par
-- une sous-requête ordinaire, ce qui provoquerait une récursion infinie.
create or replace function app.cabinet_courant()
returns uuid
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select cabinet_id from collaborateur where id = auth.uid() and actif;
$$;
