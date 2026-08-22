-- =====================================================================
-- 0008 — COUCHE D'APPEL : ce que le frontend a le droit d'invoquer
-- ---------------------------------------------------------------------
-- Le schéma `app` n'est pas exposé par PostgREST (config.toml :
-- schemas = ["public", "graphql_public"]), et c'est voulu : personne ne
-- doit pouvoir appeler app.peut_ecrire() ou app.dossiers_autorises()
-- depuis un navigateur.
--
-- Ce fichier ouvre trois portes, et trois seulement :
--   1. consulter les contrôles d'une pièce, pour les afficher pendant la saisie
--   2. enregistrer une pièce entière de façon atomique
--   3. consulter les contrôles d'un exercice avant édition
-- =====================================================================

-- ---------------------------------------------------------------------
-- NUMÉROTATION SERVEUR
-- Une séquence PostgreSQL laisserait des trous à chaque transaction
-- annulée — et le contrôle C9 surveille précisément les trous de
-- numérotation. Un compteur en table, verrouillé par ligne, se
-- rembobine avec la transaction : la continuité est préservée.
-- ---------------------------------------------------------------------
create table compteur_piece (
  dossier_id  uuid not null references dossier(id) on delete cascade,
  exercice_id uuid not null references exercice(id) on delete cascade,
  journal_id  uuid not null references journal(id) on delete cascade,
  dernier     integer not null default 0,
  primary key (dossier_id, exercice_id, journal_id)
);

alter table compteur_piece enable row level security;
alter table compteur_piece force row level security;

create policy compteur_piece_select on compteur_piece for select
  using (dossier_id in (select app.dossiers_autorises()));

create or replace function app.prochain_numero(
  p_dossier uuid, p_exercice uuid, p_journal uuid
)
returns text
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_n integer;
begin
  insert into compteur_piece (dossier_id, exercice_id, journal_id, dernier)
  values (p_dossier, p_exercice, p_journal, 1)
  on conflict (dossier_id, exercice_id, journal_id)
  do update set dernier = compteur_piece.dernier + 1
  returning dernier into v_n;

  return v_n::text;
end;
$$;

comment on function app.prochain_numero(uuid, uuid, uuid) is
  'Numéro suivant, par dossier/exercice/journal. Atomique : ON CONFLICT DO UPDATE '
  'pose un verrou de ligne, donc deux saisies simultanées ne peuvent pas '
  'obtenir le même numéro.';

-- ---------------------------------------------------------------------
-- COHÉRENCE dossier_id / piece_id
-- `ecriture.dossier_id` est dénormalisé pour la RLS et les index. Rien
-- n'empêchait jusqu'ici qu'il diverge du dossier de sa pièce — ce qui
-- fausserait silencieusement toutes les éditions. On le dérive et on
-- refuse toute incohérence.
-- ---------------------------------------------------------------------
create or replace function app.ecriture_heriter_dossier()
returns trigger
language plpgsql
as $$
declare
  v_dossier uuid;
begin
  select dossier_id into v_dossier from piece where id = new.piece_id;

  if v_dossier is null then
    raise exception 'Pièce % introuvable.', new.piece_id
      using errcode = 'foreign_key_violation';
  end if;

  if new.dossier_id is null then
    new.dossier_id := v_dossier;
  elsif new.dossier_id <> v_dossier then
    raise exception
      'Incohérence : l''écriture porte le dossier % alors que sa pièce appartient au dossier %.',
      new.dossier_id, v_dossier
      using errcode = 'integrity_constraint_violation';
  end if;

  return new;
end;
$$;

create trigger ecriture_heriter_dossier_trg
  before insert or update of piece_id, dossier_id on ecriture
  for each row execute function app.ecriture_heriter_dossier();

alter table ecriture alter column dossier_id drop not null;

-- =====================================================================
-- PORTE 1 — consulter les contrôles d'une pièce
-- Le type de retour est déclaré en colonnes, pas via app.violation :
-- un type composite du schéma `app` ne serait pas sérialisable par
-- PostgREST.
-- =====================================================================
create or replace function public.controler_piece(p_piece_id uuid)
returns table (
  code        text,
  gravite     text,
  message     text,
  ecriture_id uuid
)
language sql
stable
security invoker
set search_path = public, pg_catalog
as $$
  -- security invoker : la RLS s'applique. Une pièce hors périmètre ne
  -- remonte rien, exactement comme un SELECT.
  select v.code, v.gravite, v.message, v.ecriture_id
    from piece p
    cross join lateral app.controler_piece(p.id) v
   where p.id = p_piece_id;
$$;

-- =====================================================================
-- PORTE 2 — contrôles d'un exercice, avant édition
-- =====================================================================
create or replace function public.controler_exercice(p_exercice_id uuid)
returns table (
  code        text,
  gravite     text,
  message     text,
  ecriture_id uuid
)
language sql
stable
security invoker
set search_path = public, pg_catalog
as $$
  select v.code, v.gravite, v.message, v.ecriture_id
    from exercice e
    cross join lateral app.controler_dossier(e.dossier_id, e.id) v
   where e.id = p_exercice_id;
$$;

-- =====================================================================
-- PORTE 3 — enregistrer une pièce entière, atomiquement
-- ---------------------------------------------------------------------
-- Payload attendu :
-- {
--   "piece_id":    null | "<uuid>",      -- pour reprendre un brouillon
--   "dossier_id":  "<uuid>",
--   "exercice_id": "<uuid>",
--   "journal_id":  "<uuid>",
--   "date_piece":  "2026-06-15",
--   "numero":      null,                 -- null = attribué par le serveur
--   "libelle":     "Facture STEG",
--   "statut":      "brouillon" | "revise",
--   "lignes": [
--     { "compte_id": "<uuid>", "tiers_id": null, "libelle": "...",
--       "debit": 1000, "credit": 0, "reference": null,
--       "numero_facture": null, "date_echeance": null }
--   ]
-- }
--
-- Retour :
-- { "piece_id": "...", "numero": "42", "statut": "revise",
--   "violations": [ { "code": "...", "gravite": "...", "message": "..." } ] }
--
-- Le tout dans une seule transaction : si le visa est refusé, la pièce
-- n'existe pas. Pas de brouillon orphelin après un échec.
-- =====================================================================
create or replace function public.enregistrer_piece(p_payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_piece_id  uuid  := nullif(p_payload ->> 'piece_id', '')::uuid;
  v_dossier   uuid  := (p_payload ->> 'dossier_id')::uuid;
  v_exercice  uuid  := (p_payload ->> 'exercice_id')::uuid;
  v_journal   uuid  := (p_payload ->> 'journal_id')::uuid;
  v_date      date  := (p_payload ->> 'date_piece')::date;
  v_numero    text  := nullif(p_payload ->> 'numero', '');
  v_libelle   text  := p_payload ->> 'libelle';
  v_statut    text  := coalesce(p_payload ->> 'statut', 'brouillon');
  v_lignes    jsonb := coalesce(p_payload -> 'lignes', '[]'::jsonb);

  v_periode   uuid;
  v_ligne     jsonb;
  v_ordre     smallint := 0;
  v_violations jsonb;
begin
  if v_statut not in ('brouillon', 'revise') then
    raise exception 'Statut « % » non autorisé ici : utilisez brouillon ou revise.', v_statut
      using errcode = 'invalid_parameter_value';
  end if;

  if jsonb_array_length(v_lignes) = 0 then
    raise exception 'Aucune ligne : une écriture comptable a au moins deux lignes.'
      using errcode = 'invalid_parameter_value';
  end if;

  -- Reprise d'un brouillon : on repart des mêmes lignes à zéro plutôt que
  -- de tenter un rapprochement ligne à ligne, source d'incohérences.
  if v_piece_id is not null then
    if not exists (
      select 1 from piece where id = v_piece_id and statut = 'brouillon'
    ) then
      raise exception 'Pièce % introuvable ou déjà visée : elle n''est plus modifiable.', v_piece_id
        using errcode = 'restrict_violation';
    end if;
    delete from ecriture where piece_id = v_piece_id;
    update piece
       set journal_id = v_journal,
           date_piece = v_date,
           libelle    = v_libelle
     where id = v_piece_id;
  else
    if v_numero is null then
      v_numero := app.prochain_numero(v_dossier, v_exercice, v_journal);
    end if;

    select id into v_periode
      from periode
     where exercice_id = v_exercice
       and v_date between date_debut and date_fin;

    insert into piece (
      dossier_id, exercice_id, periode_id, journal_id,
      numero, date_piece, libelle, statut, source, cree_par
    )
    values (
      v_dossier, v_exercice, v_periode, v_journal,
      v_numero, v_date, v_libelle, 'brouillon', 'manuelle', auth.uid()
    )
    returning id into v_piece_id;
  end if;

  for v_ligne in select * from jsonb_array_elements(v_lignes) loop
    v_ordre := v_ordre + 1;
    insert into ecriture (
      piece_id, compte_id, tiers_id, ordre, libelle,
      debit, credit, reference, numero_facture, date_echeance
    )
    values (
      v_piece_id,
      (v_ligne ->> 'compte_id')::uuid,
      nullif(v_ligne ->> 'tiers_id', '')::uuid,
      v_ordre,
      coalesce(v_ligne ->> 'libelle', v_libelle, 'Sans libellé'),
      coalesce((v_ligne ->> 'debit')::numeric, 0),
      coalesce((v_ligne ->> 'credit')::numeric, 0),
      nullif(v_ligne ->> 'reference', ''),
      nullif(v_ligne ->> 'numero_facture', ''),
      nullif(v_ligne ->> 'date_echeance', '')::date
    );
  end loop;

  -- Les contrôles sont renvoyés dans tous les cas : un brouillon affiche
  -- ses défauts pendant la saisie plutôt qu'au moment du visa.
  select coalesce(
           jsonb_agg(jsonb_build_object(
             'code', v.code, 'gravite', v.gravite,
             'message', v.message, 'ecriture_id', v.ecriture_id
           )),
           '[]'::jsonb
         )
    into v_violations
    from app.controler_piece(v_piece_id) v;

  -- Le passage au visa traverse la barrière de 0004. S'il échoue,
  -- l'exception remonte et TOUTE la transaction est annulée — y compris
  -- l'incrément du compteur de numérotation.
  if v_statut = 'revise' then
    update piece set statut = 'revise' where id = v_piece_id;
  end if;

  return jsonb_build_object(
    'piece_id',   v_piece_id,
    'numero',     (select numero from piece where id = v_piece_id),
    'statut',     (select statut from piece where id = v_piece_id),
    'violations', v_violations
  );
end;
$$;

-- ---------------------------------------------------------------------
-- Droits : uniquement ces trois fonctions, uniquement aux connectés.
-- ---------------------------------------------------------------------
revoke all on function public.controler_piece(uuid)     from public, anon;
revoke all on function public.controler_exercice(uuid)  from public, anon;
revoke all on function public.enregistrer_piece(jsonb)  from public, anon;

grant execute on function public.controler_piece(uuid)    to authenticated;
grant execute on function public.controler_exercice(uuid) to authenticated;
grant execute on function public.enregistrer_piece(jsonb) to authenticated;
