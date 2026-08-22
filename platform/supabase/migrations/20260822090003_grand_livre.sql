-- =====================================================================
-- 0003 — GRAND LIVRE : pièces, écritures, lettrage, rapprochement
-- ---------------------------------------------------------------------
-- Deux décisions structurantes :
--
-- 1. La PIÈCE (folio) est une entité à part entière, pas une colonne.
--    C'est ce qui rend le contrôle « équilibre folio » exprimable en base
--    plutôt qu'en JavaScript, et c'est la granularité du visa.
--
-- 2. L'écriture est IMMUABLE dès qu'elle sort du brouillon. Une erreur se
--    corrige par contre-passation, jamais par UPDATE. C'est ce qui rend la
--    piste d'audit opposable.
-- =====================================================================

-- ---------------------------------------------------------------------
-- LETTRAGE — le groupe, créé avant les écritures qui le référencent
-- ---------------------------------------------------------------------
create table lettrage (
  id           uuid primary key default gen_random_uuid(),
  dossier_id   uuid not null references dossier(id) on delete cascade,
  compte_id    uuid not null references compte(id),
  tiers_id     uuid references tiers(id),
  code         text not null,                    -- ex. « 2026-A »
  date_lettrage date not null default current_date,
  origine      text not null default 'manuel'
               check (origine in ('manuel','auto','agent')),
  agent_code   text,                             -- 'LET' si proposé par l'agent
  confiance    numeric(4,3) check (confiance between 0 and 1),
  created_at   timestamptz not null default now(),

  unique (dossier_id, compte_id, code)
);

create index on lettrage (dossier_id, compte_id);

-- ---------------------------------------------------------------------
-- RAPPROCHEMENT BANCAIRE
-- ---------------------------------------------------------------------
create table rapprochement (
  id              uuid primary key default gen_random_uuid(),
  dossier_id      uuid not null references dossier(id) on delete cascade,
  compte_id       uuid not null references compte(id),
  date_rapprochement date not null,
  solde_comptable numeric(15,3) not null,
  solde_releve    numeric(15,3) not null,
  ecart           numeric(15,3) generated always as (solde_comptable - solde_releve) stored,
  statut          text not null default 'en_cours'
                  check (statut in ('en_cours','valide')),
  valide_par      uuid references collaborateur(id),
  created_at      timestamptz not null default now()
);

create index on rapprochement (dossier_id, compte_id, date_rapprochement desc);

-- ---------------------------------------------------------------------
-- PIÈCE (folio)
-- statut reprend exactement l'échelle de types.ts, qui sert aussi
-- d'échelle d'autonomie des agents (N0 → N3).
-- ---------------------------------------------------------------------
create table piece (
  id            uuid primary key default gen_random_uuid(),
  dossier_id    uuid not null references dossier(id) on delete cascade,
  exercice_id   uuid not null references exercice(id) on delete restrict,
  periode_id    uuid references periode(id),
  journal_id    uuid not null references journal(id) on delete restrict,

  numero        text not null,
  date_piece    date not null,
  libelle       text,

  statut        text not null default 'brouillon'
                check (statut in ('brouillon','revise','supervise','valide')),
  source        text not null default 'manuelle'
                check (source in ('manuelle','import','agent','generee')),

  -- Traçabilité IA : renseignés quand la pièce vient d'une proposition
  proposition_id uuid,
  agent_code     text check (agent_code in ('SCR','IMP','LET','REV','FIS','ANA','ORC')),
  confiance      numeric(4,3) check (confiance between 0 and 1),

  cree_par       uuid references collaborateur(id),
  vise_par       uuid references collaborateur(id),
  vise_le        timestamptz,
  supervise_par  uuid references collaborateur(id),
  supervise_le   timestamptz,
  created_at     timestamptz not null default now(),

  unique (dossier_id, exercice_id, journal_id, numero)
);

create index on piece (dossier_id, exercice_id, date_piece);
create index on piece (dossier_id, statut) where statut = 'brouillon';
create index on piece (journal_id, date_piece);

comment on column piece.statut is
  'brouillon → revise → supervise → valide. Sert aussi de plafond d''autonomie aux agents.';

-- ---------------------------------------------------------------------
-- ÉCRITURE — la ligne
-- Trois contraintes portent à elles seules quatre des vingt et un
-- contrôles : ligne non vide (E1a), sens unique, montants positifs
-- (C8/C10).
-- ---------------------------------------------------------------------
create table ecriture (
  id            uuid primary key default gen_random_uuid(),
  piece_id      uuid not null references piece(id) on delete cascade,
  dossier_id    uuid not null references dossier(id) on delete cascade,
  compte_id     uuid not null references compte(id) on delete restrict,
  tiers_id      uuid references tiers(id) on delete restrict,

  ordre         smallint not null default 1,
  libelle       text not null,
  debit         numeric(15,3) not null default 0,
  credit        numeric(15,3) not null default 0,

  devise         char(3) not null default 'TND',
  montant_devise numeric(15,3),
  taux_change    numeric(12,6),

  reference      text,
  numero_facture text,
  date_echeance  date,
  mode_reglement text,
  numero_cheque  text,

  lettrage_id      uuid references lettrage(id) on delete set null,
  rapprochement_id uuid references rapprochement(id) on delete set null,

  created_at    timestamptz not null default now(),

  -- E1a : pas de ligne à zéro des deux côtés
  constraint ecriture_non_vide check (debit > 0 or credit > 0),
  -- Une ligne est soit au débit, soit au crédit, jamais les deux
  constraint ecriture_sens_unique check (debit = 0 or credit = 0),
  -- C8 / C10 : aucun montant négatif ne rentre
  constraint ecriture_montants_positifs check (debit >= 0 and credit >= 0),
  -- E3 : un libellé est obligatoire (la contrainte NOT NULL ne suffit pas,
  -- une chaîne vide passerait)
  constraint ecriture_libelle_non_vide check (length(btrim(libelle)) > 0)
);

create index on ecriture (piece_id, ordre);
create index on ecriture (dossier_id, compte_id);
create index on ecriture (dossier_id, tiers_id) where tiers_id is not null;
create index on ecriture (lettrage_id) where lettrage_id is not null;
create index on ecriture (dossier_id, date_echeance) where date_echeance is not null;

-- Une pièce issue d'une proposition dit toujours quel agent l'a produite :
-- sans cela, la piste d'audit perd l'auteur réel de l'écriture.
alter table piece
  add constraint piece_origine_agent_tracee
  check (proposition_id is null or agent_code is not null);

-- =====================================================================
-- IMMUABILITÉ
-- Une pièce sortie du brouillon ne peut plus voir ses écritures changer.
-- Le seul chemin de correction est la contre-passation.
-- =====================================================================

create or replace function app.ecriture_immuable()
returns trigger
language plpgsql
as $$
declare
  v_statut text;
  v_piece  uuid;
begin
  v_piece := coalesce(new.piece_id, old.piece_id);
  select statut into v_statut from piece where id = v_piece;

  if v_statut is distinct from 'brouillon' then
    raise exception
      'Écriture figée : la pièce % est au statut « % ». Corrigez par contre-passation.',
      v_piece, v_statut
      using errcode = 'restrict_violation';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger ecriture_immuable_trg
  before update or delete on ecriture
  for each row execute function app.ecriture_immuable();

-- La transition de statut ne peut aller que dans un sens, et jamais
-- redescendre en brouillon une fois validée.
create or replace function app.piece_transition_statut()
returns trigger
language plpgsql
as $$
declare
  v_rang   constant jsonb :=
    '{"brouillon":0,"revise":1,"supervise":2,"valide":3}'::jsonb;
  v_avant  int := (v_rang ->> old.statut)::int;
  v_apres  int := (v_rang ->> new.statut)::int;
  v_profil text := app.profil_courant();
begin
  if new.statut = old.statut then
    return new;
  end if;

  if v_apres < v_avant then
    raise exception 'Transition interdite : % → %. Une pièce ne redescend pas de statut.',
      old.statut, new.statut using errcode = 'restrict_violation';
  end if;

  -- Le visa superviseur est réservé aux profils qui en portent la responsabilité
  if new.statut in ('supervise','valide')
     and v_profil not in ('superviseur','administrateur') then
    raise exception 'Le passage au statut « % » requiert un profil superviseur.', new.statut
      using errcode = 'insufficient_privilege';
  end if;

  if new.statut = 'revise'  then new.vise_le := now();      new.vise_par := auth.uid(); end if;
  if new.statut = 'supervise' then new.supervise_le := now(); new.supervise_par := auth.uid(); end if;

  return new;
end;
$$;

create trigger piece_transition_statut_trg
  before update of statut on piece
  for each row execute function app.piece_transition_statut();
