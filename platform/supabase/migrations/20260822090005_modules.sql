-- =====================================================================
-- 0005 — MODULES : immobilisations, échéances déclaratives, temps passé
-- ---------------------------------------------------------------------
-- Les échéances reprennent le modèle d'Échéances Expert
-- (16 déclarations, 7 organismes, 8 statuts, règles PP/PM × mode de dépôt,
-- jours fériés, date reportée). Les immobilisations sont neuves.
-- Le temps passé est retenu sans les honoraires (arbitrage E).
-- =====================================================================

-- #####################################################################
-- IMMOBILISATIONS ET AMORTISSEMENTS
-- #####################################################################

create table categorie_immobilisation (
  id             uuid primary key default gen_random_uuid(),
  dossier_id     uuid not null references dossier(id) on delete cascade,
  code           text not null,
  libelle        text not null,
  duree_defaut   smallint not null check (duree_defaut between 1 and 100),
  mode_defaut    text not null default 'lineaire'
                 check (mode_defaut in ('lineaire','degressif','non_amortissable')),
  compte_immo_id uuid references compte(id),     -- 2xxx
  compte_amort_id uuid references compte(id),    -- 28xxx
  compte_dotation_id uuid references compte(id), -- 681xx
  -- Plafond fiscal déductible (véhicules de tourisme notamment).
  plafond_fiscal numeric(15,3),
  unique (dossier_id, code)
);

create table immobilisation (
  id                uuid primary key default gen_random_uuid(),
  dossier_id        uuid not null references dossier(id) on delete cascade,
  categorie_id      uuid not null references categorie_immobilisation(id),
  code              text not null,
  libelle           text not null,

  -- Ces deux dates diffèrent et c'est la seconde qui déclenche le
  -- prorata temporis. Les confondre est l'erreur classique.
  date_acquisition  date not null,
  date_mise_service date not null,

  valeur_origine    numeric(15,3) not null check (valeur_origine > 0),
  tva_recuperable   numeric(15,3) not null default 0,
  valeur_residuelle numeric(15,3) not null default 0,

  duree             smallint not null check (duree between 1 and 100),
  mode              text not null default 'lineaire'
                    check (mode in ('lineaire','degressif','non_amortissable')),
  taux              numeric(6,4),

  fournisseur_id    uuid references tiers(id),
  piece_acquisition_id uuid references piece(id),
  document_id       uuid,                       -- FK ajoutée en 0006

  statut            text not null default 'en_service'
                    check (statut in ('en_service','cede','rebut','detruit')),
  date_sortie       date,
  valeur_cession    numeric(15,3),
  piece_sortie_id   uuid references piece(id),

  notes             text,
  created_at        timestamptz not null default now(),

  unique (dossier_id, code),
  constraint immo_mise_service_apres_acquisition
    check (date_mise_service >= date_acquisition),
  constraint immo_sortie_coherente
    check ((statut = 'en_service' and date_sortie is null)
        or (statut <> 'en_service' and date_sortie is not null))
);

create index on immobilisation (dossier_id, statut);
create index on immobilisation (categorie_id);

-- Plan d'amortissement pluriannuel : une ligne par exercice.
-- Recalculable intégralement après tout événement (révision de durée,
-- cession, mise au rebut).
create table amortissement_ligne (
  id                uuid primary key default gen_random_uuid(),
  immobilisation_id uuid not null references immobilisation(id) on delete cascade,
  dossier_id        uuid not null references dossier(id) on delete cascade,
  exercice_id       uuid references exercice(id),
  annee             smallint not null,

  base_amortissable numeric(15,3) not null,
  dotation          numeric(15,3) not null default 0,
  cumul             numeric(15,3) not null default 0,
  vnc               numeric(15,3) not null default 0,   -- valeur nette comptable

  -- Divergence comptable / fiscale : c'est ici que se joue l'utilité
  -- réelle du module (amortissement dérogatoire, réintégration).
  dotation_fiscale  numeric(15,3),
  reintegration     numeric(15,3) not null default 0,

  prorata_mois      smallint check (prorata_mois between 0 and 12),
  piece_dotation_id uuid references piece(id),
  comptabilise      boolean not null default false,

  unique (immobilisation_id, annee)
);

create index on amortissement_ligne (dossier_id, annee);
create index on amortissement_ligne (immobilisation_id, annee);

-- Génération du plan linéaire avec prorata temporis au mois.
-- Le mode dégressif est traité par le moteur TypeScript, qui doit aussi
-- gérer la bascule linéaire en fin de plan : le coder en SQL n'apporterait
-- rien et le rendrait plus difficile à tester.
create or replace function app.generer_plan_lineaire(p_immo_id uuid)
returns void
language plpgsql
as $$
declare
  v_i        immobilisation%rowtype;
  v_base     numeric(15,3);
  v_annuite  numeric(15,3);
  v_annee    smallint;
  v_cumul    numeric(15,3) := 0;
  v_dotation numeric(15,3);
  v_mois     smallint;
  v_reste    numeric(15,3);
begin
  select * into v_i from immobilisation where id = p_immo_id;
  if not found then
    raise exception 'Immobilisation % introuvable', p_immo_id;
  end if;

  if v_i.mode <> 'lineaire' then
    raise exception 'generer_plan_lineaire ne traite que le mode linéaire (reçu : %)', v_i.mode;
  end if;

  delete from amortissement_ligne
   where immobilisation_id = p_immo_id and not comptabilise;

  v_base    := v_i.valeur_origine - v_i.valeur_residuelle;
  v_annuite := round(v_base / v_i.duree, 3);
  v_annee   := extract(year from v_i.date_mise_service)::smallint;

  -- Première année : prorata au mois de mise en service.
  v_mois := 12 - extract(month from v_i.date_mise_service)::int + 1;

  for i in 0 .. v_i.duree loop
    if i = 0 then
      v_dotation := round(v_annuite * v_mois / 12.0, 3);
    else
      v_dotation := v_annuite;
    end if;

    -- Dernière annuité : on solde exactement, sans traîner d'arrondi.
    v_reste := v_base - v_cumul;
    if v_dotation > v_reste then
      v_dotation := v_reste;
    end if;
    exit when v_dotation <= 0;

    v_cumul := v_cumul + v_dotation;

    insert into amortissement_ligne (
      immobilisation_id, dossier_id, annee,
      base_amortissable, dotation, cumul, vnc, prorata_mois
    )
    values (
      p_immo_id, v_i.dossier_id, (v_annee + i)::smallint,
      v_base, v_dotation, v_cumul,
      v_i.valeur_origine - v_cumul,
      case when i = 0 then v_mois else 12 end
    )
    on conflict (immobilisation_id, annee) do nothing;
  end loop;
end;
$$;

-- #####################################################################
-- ÉCHÉANCES DÉCLARATIVES  (import du modèle Échéances Expert)
-- #####################################################################

create table organisme (
  id         uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null references cabinet(id) on delete cascade,
  nom        text not null,
  actif      boolean not null default true,
  unique (cabinet_id, nom)
);

create table declaration_type (
  id           uuid primary key default gen_random_uuid(),
  cabinet_id   uuid not null references cabinet(id) on delete cascade,
  code         text not null,                    -- tva, ret, cnss, is_liasse…
  nom          text not null,
  organisme_id uuid references organisme(id),
  frequence    text not null
               check (frequence in ('monthly','quarterly','annual','specific')),
  mois_annuel  smallint check (mois_annuel between 1 and 12),
  alerte_jours smallint not null default 7,
  actif        boolean not null default true,
  unique (cabinet_id, code)
);

-- La règle qui donne le jour d'exigibilité. C'est le cœur métier
-- d'Échéances Expert : la TVA d'une PM en téléliquidation tombe le 28,
-- la même TVA pour une PP en télédéclaration tombe le 15.
create table declaration_regle (
  id                  uuid primary key default gen_random_uuid(),
  declaration_type_id uuid not null references declaration_type(id) on delete cascade,
  nature              text check (nature in ('PP','PM')),
  mode_depot          text check (mode_depot in ('teleDec','teleLiq')),
  jour                smallint not null check (jour between 1 and 31),
  unique (declaration_type_id, nature, mode_depot)
);

create table jour_ferie (
  cabinet_id uuid not null references cabinet(id) on delete cascade,
  date_ferie date not null,
  libelle    text not null,
  primary key (cabinet_id, date_ferie)
);

-- Abonnement d'un dossier à une déclaration.
create table dossier_declaration (
  dossier_id          uuid not null references dossier(id) on delete cascade,
  declaration_type_id uuid not null references declaration_type(id) on delete cascade,
  actif               boolean not null default true,
  primary key (dossier_id, declaration_type_id)
);

create table echeance (
  id                  uuid primary key default gen_random_uuid(),
  dossier_id          uuid not null references dossier(id) on delete cascade,
  exercice_id         uuid references exercice(id) on delete set null,
  declaration_type_id uuid not null references declaration_type(id),
  libelle             text not null,             -- « TVA Jan 2026 »
  periode_mois        smallint check (periode_mois between 1 and 12),

  -- date_exigible est la date théorique, date_reportee la date effective
  -- après décalage pour week-end ou jour férié. Les deux sont conservées :
  -- la première fait foi en cas de litige, la seconde pilote l'alerte.
  date_exigible       date not null,
  date_reportee       date not null,
  alerte_jours        smallint not null default 7,

  statut              text not null default 'todo'
                      check (statut in ('todo','pieces','prete','controlee',
                                        'deposee','instance','rejetee','cloturee')),
  montant             numeric(15,3),
  reference_depot     text,
  assignee_id         uuid references collaborateur(id),
  notes               text,
  created_at          timestamptz not null default now(),

  unique (dossier_id, declaration_type_id, exercice_id, periode_mois)
);

create index on echeance (dossier_id, date_reportee);
create index on echeance (assignee_id, statut)
  where statut not in ('cloturee','rejetee');
create index on echeance (date_reportee)
  where statut not in ('cloturee','rejetee');

create table echeance_historique (
  id           uuid primary key default gen_random_uuid(),
  echeance_id  uuid not null references echeance(id) on delete cascade,
  statut       text not null,
  par          uuid references collaborateur(id),
  note         text,
  horodatage   timestamptz not null default now()
);

create index on echeance_historique (echeance_id, horodatage desc);

-- Trace automatique de chaque changement de statut.
create or replace function app.echeance_tracer()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.statut is distinct from old.statut then
    insert into echeance_historique (echeance_id, statut, par)
    values (new.id, new.statut, auth.uid());
  end if;
  return new;
end;
$$;

create trigger echeance_tracer_trg
  after insert or update of statut on echeance
  for each row execute function app.echeance_tracer();

-- Décale une date d'exigibilité au premier jour ouvré suivant.
create or replace function app.reporter_si_ferie(
  p_cabinet_id uuid,
  p_date       date
)
returns date
language plpgsql
stable
as $$
declare
  v_date date := p_date;
  v_i    int  := 0;
begin
  while v_i < 30 loop
    exit when extract(isodow from v_date) < 6          -- ni samedi ni dimanche
          and not exists (
                select 1 from jour_ferie
                 where cabinet_id = p_cabinet_id and date_ferie = v_date
              );
    v_date := v_date + 1;
    v_i := v_i + 1;
  end loop;
  return v_date;
end;
$$;

-- #####################################################################
-- TEMPS PASSÉ  (arbitrage E : le temps, pas les honoraires)
-- #####################################################################

create table nature_tache (
  id         uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null references cabinet(id) on delete cascade,
  code       text not null,
  libelle    text not null,           -- saisie, révision, liasse, conseil…
  actif      boolean not null default true,
  unique (cabinet_id, code)
);

create table temps_passe (
  id               uuid primary key default gen_random_uuid(),
  cabinet_id       uuid not null references cabinet(id) on delete cascade,
  dossier_id       uuid references dossier(id) on delete set null,
  collaborateur_id uuid not null references collaborateur(id) on delete restrict,
  nature_tache_id  uuid references nature_tache(id),
  exercice_id      uuid references exercice(id) on delete set null,

  date_travail     date not null,
  minutes          integer not null check (minutes > 0 and minutes <= 1440),
  commentaire      text,
  created_at       timestamptz not null default now(),

  unique (collaborateur_id, dossier_id, date_travail, nature_tache_id)
);

create index on temps_passe (dossier_id, date_travail);
create index on temps_passe (collaborateur_id, date_travail);

comment on table temps_passe is
  'Mesure « heures par dossier à périmètre constant », indicateur directeur '
  'du projet avec le taux de traitement sans intervention. Aucune valorisation '
  'monétaire : les honoraires sont hors périmètre (arbitrage E).';
