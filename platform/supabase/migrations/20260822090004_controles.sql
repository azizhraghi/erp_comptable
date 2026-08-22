-- =====================================================================
-- 0004 — LE NOYAU DÉTERMINISTE : les 21 contrôles
-- ---------------------------------------------------------------------
-- Extraction des règles enfermées dans deux fichiers HTML :
--   E1 → E8   « Editions GL et BG/V3.2.15.html »  (runAudit + validateBalances)
--   C1 → C13  « Générateur .../V26.html »          (applyControls)
--
-- C'est le point de passage unique. La saisie manuelle, l'import Excel et
-- les propositions d'agents empruntent tous ce chemin : il n'existe pas
-- de porte dérobée réservée à l'IA.
--
-- Quatre contrôles ne figurent pas ici parce qu'ils sont devenus
-- structurellement impossibles en 0003 :
--   E1a lignes vides        → contrainte ecriture_non_vide
--   E8  nom de société      → NOT NULL sur dossier.raison_sociale
--   C8  montant négatif     → contrainte ecriture_montants_positifs
--   C10 valeur négative     → idem
-- Un contrôle qu'on peut transformer en contrainte vaut mieux qu'un
-- contrôle qu'on doit penser à exécuter.
-- =====================================================================

-- Tolérance d'arrondi, reprise telle quelle des deux sources : 0,001 TND.
create or replace function app.tolerance()
returns numeric language sql immutable parallel safe
as $$ select 0.001::numeric $$;

-- Type de retour commun à tous les contrôles.
create type app.violation as (
  code        text,     -- E4, C11…
  gravite     text,     -- 'bloquant' | 'avertissement'
  message     text,
  ecriture_id uuid
);

-- =====================================================================
-- CONTRÔLES DE PIÈCE
-- E2 E3 E4 E5 E6 C1 C2 C7 C11 C13
-- =====================================================================
create or replace function app.controler_piece(p_piece_id uuid)
returns setof app.violation
language plpgsql
stable
as $$
declare
  v_piece    piece%rowtype;
  v_ex       exercice%rowtype;
  v_jrn      journal%rowtype;
  v_longueur smallint;
  v_debit    numeric(15,3);
  v_credit   numeric(15,3);
  v_nb       int;
begin
  select * into v_piece from piece where id = p_piece_id;
  if not found then
    return next ('C13','bloquant','Pièce introuvable.',null)::app.violation;
    return;
  end if;

  select * into v_ex  from exercice where id = v_piece.exercice_id;
  select * into v_jrn from journal  where id = v_piece.journal_id;
  select longueur_compte into v_longueur from dossier where id = v_piece.dossier_id;

  -- ---------------------------------------------------------------
  -- C13 — champs obligatoires
  -- ---------------------------------------------------------------
  if v_piece.numero is null or length(btrim(v_piece.numero)) = 0 then
    return next ('C13','bloquant','Numéro de pièce manquant.',null)::app.violation;
  end if;

  if v_piece.date_piece is null then
    return next ('C13','bloquant','Date de pièce manquante.',null)::app.violation;
  end if;

  select count(*) into v_nb from ecriture where piece_id = p_piece_id;
  if v_nb = 0 then
    return next ('C13','bloquant','Pièce sans aucune écriture.',null)::app.violation;
    return;
  end if;
  if v_nb = 1 then
    return next ('C1','bloquant',
      'Pièce à une seule ligne : une écriture comptable a au moins deux lignes.',
      null)::app.violation;
  end if;

  -- ---------------------------------------------------------------
  -- E4 / C1 — équilibre du folio (tolérance 0,001)
  -- ---------------------------------------------------------------
  select coalesce(sum(debit),0), coalesce(sum(credit),0)
    into v_debit, v_credit
    from ecriture where piece_id = p_piece_id;

  if abs(v_debit - v_credit) > app.tolerance() then
    return next ('E4','bloquant',
      format('Folio déséquilibré : débit %s, crédit %s, écart %s TND.',
             to_char(v_debit,'FM999999990.000'),
             to_char(v_credit,'FM999999990.000'),
             to_char(abs(v_debit - v_credit),'FM999999990.000')),
      null)::app.violation;
  elsif v_debit <> v_credit then
    -- Écart non nul mais sous tolérance : on le signale sans bloquer.
    return next ('C7','avertissement',
      format('Écart d''arrondi de %s TND absorbé par la tolérance.',
             to_char(abs(v_debit - v_credit),'FM999999990.000')),
      null)::app.violation;
  end if;

  -- ---------------------------------------------------------------
  -- E5 / C2 — intervalle d'exercice et verrous de saisie
  -- ---------------------------------------------------------------
  if v_piece.date_piece < v_ex.date_debut or v_piece.date_piece > v_ex.date_fin then
    return next ('E5','bloquant',
      format('Date %s hors de l''exercice %s (%s → %s).',
             v_piece.date_piece, v_ex.annee, v_ex.date_debut, v_ex.date_fin),
      null)::app.violation;
  end if;

  if v_ex.statut <> 'ouvert' then
    return next ('E5','bloquant',
      format('Exercice %s au statut « %s » : aucune écriture ne peut y être portée.',
             v_ex.annee, v_ex.statut),
      null)::app.violation;
  end if;

  if v_ex.lock_saisie_avant is not null
     and v_piece.date_piece < v_ex.lock_saisie_avant then
    return next ('E5','bloquant',
      format('Saisie verrouillée avant le %s sur cet exercice.', v_ex.lock_saisie_avant),
      null)::app.violation;
  end if;

  if v_jrn.lock_saisie_avant is not null
     and v_piece.date_piece < v_jrn.lock_saisie_avant then
    return next ('E5','bloquant',
      format('Saisie verrouillée avant le %s sur le journal %s.',
             v_jrn.lock_saisie_avant, v_jrn.code),
      null)::app.violation;
  end if;

  if exists (
    select 1 from periode p
     where p.exercice_id = v_ex.id
       and v_piece.date_piece between p.date_debut and p.date_fin
       and p.statut <> 'ouverte'
  ) then
    return next ('E5','bloquant',
      'La période comptable correspondante est verrouillée ou clôturée.',
      null)::app.violation;
  end if;

  -- ---------------------------------------------------------------
  -- E6 — report à nouveau obligatoirement daté au 01/01/N
  -- ---------------------------------------------------------------
  if v_jrn.nature = 'AN'
     and v_piece.date_piece <> make_date(v_ex.annee::int, 1, 1) then
    return next ('E6','bloquant',
      format('Écriture de report à nouveau datée du %s : elle doit être au 01/01/%s.',
             v_piece.date_piece, v_ex.annee),
      null)::app.violation;
  end if;

  -- ---------------------------------------------------------------
  -- E2 — longueur des comptes généraux
  -- ---------------------------------------------------------------
  return query
    select 'E2'::text,'bloquant'::text,
           format('Compte %s : %s caractères au lieu de %s.',
                  c.numero, length(c.numero), v_longueur),
           e.id
      from ecriture e
      join compte c on c.id = e.compte_id
     where e.piece_id = p_piece_id
       and length(c.numero) <> v_longueur;

  -- ---------------------------------------------------------------
  -- E3 — auxiliaire obligatoire sur les comptes collectifs
  -- ---------------------------------------------------------------
  return query
    select 'E3'::text,'bloquant'::text,
           format('Compte collectif %s (%s) sans tiers.', c.numero, c.libelle),
           e.id
      from ecriture e
      join compte c on c.id = e.compte_id
     where e.piece_id = p_piece_id
       and c.collectif
       and e.tiers_id is null;

  -- ---------------------------------------------------------------
  -- C13 — compte bloqué ou inactif
  -- ---------------------------------------------------------------
  return query
    select 'C13'::text,'bloquant'::text,
           format('Compte %s bloqué ou inactif.', c.numero),
           e.id
      from ecriture e
      join compte c on c.id = e.compte_id
     where e.piece_id = p_piece_id
       and (c.bloque or not c.actif);

  -- ---------------------------------------------------------------
  -- C11 — libellés multiples sur une même pièce (non bloquant)
  -- ---------------------------------------------------------------
  select count(distinct lower(btrim(regexp_replace(libelle,'\s+',' ','g'))))
    into v_nb
    from ecriture where piece_id = p_piece_id;

  if v_nb > 1 then
    return next ('C11','avertissement',
      format('%s libellés différents sur la même pièce.', v_nb),
      null)::app.violation;
  end if;

  return;
end;
$$;

-- =====================================================================
-- CONTRÔLES DE LETTRAGE
-- C3 lettrage incohérent · C4 multi-compte · C5 isolé · C6 mono-polaire
-- =====================================================================
create or replace function app.controler_lettrage(p_lettrage_id uuid)
returns setof app.violation
language plpgsql
stable
as $$
declare
  v_nb       int;
  v_comptes  int;
  v_debit    numeric(15,3);
  v_credit   numeric(15,3);
begin
  select count(*),
         count(distinct compte_id),
         coalesce(sum(debit),0),
         coalesce(sum(credit),0)
    into v_nb, v_comptes, v_debit, v_credit
    from ecriture
   where lettrage_id = p_lettrage_id;

  -- C5 — un lettrage à une seule écriture n'apparie rien
  if v_nb <= 1 then
    return next ('C5','bloquant',
      'Lettrage isolé : une seule écriture dans le groupe.',null)::app.violation;
    return;
  end if;

  -- C4 — toutes les écritures d'un lettrage sont sur le même compte
  if v_comptes > 1 then
    return next ('C4','bloquant',
      format('Lettrage réparti sur %s comptes différents.', v_comptes),
      null)::app.violation;
  end if;

  -- C6 — un lettrage entièrement au débit ou au crédit n'apure rien
  if v_debit = 0 or v_credit = 0 then
    return next ('C6','bloquant',
      'Lettrage mono-polaire : toutes les écritures sont dans le même sens.',
      null)::app.violation;
  end if;

  -- C3 / C7 — le groupe doit s'équilibrer à la tolérance près
  if abs(v_debit - v_credit) > app.tolerance() then
    return next ('C3','bloquant',
      format('Lettrage incohérent : écart de %s TND entre débit et crédit.',
             to_char(abs(v_debit - v_credit),'FM999999990.000')),
      null)::app.violation;
  end if;

  return;
end;
$$;

-- =====================================================================
-- CONTRÔLES DE DOSSIER — audit préalable aux éditions
-- E1 équilibre global · C9 saut de numéro · C12 doublons
--
-- Note sur E7 (conformité des soldes GL contre Balance) : ce contrôle
-- existait parce que l'outil d'éditions travaillait sur un fichier plat
-- importé, où les deux états pouvaient diverger. Ici, balance et grand
-- livre sont deux agrégations de la même table `ecriture` : la
-- divergence est structurellement impossible. E7 devient un test de
-- non-régression entre les vues d'édition, pas un contrôle de données.
-- =====================================================================
create or replace function app.controler_dossier(
  p_dossier_id  uuid,
  p_exercice_id uuid
)
returns setof app.violation
language plpgsql
stable
as $$
declare
  v_debit  numeric(15,3);
  v_credit numeric(15,3);
begin
  -- E1 — équilibre global de l'exercice
  select coalesce(sum(e.debit),0), coalesce(sum(e.credit),0)
    into v_debit, v_credit
    from ecriture e
    join piece p on p.id = e.piece_id
   where p.exercice_id = p_exercice_id;

  if abs(v_debit - v_credit) > app.tolerance() then
    return next ('E1','bloquant',
      format('Exercice déséquilibré : écart de %s TND. Édition interdite.',
             to_char(abs(v_debit - v_credit),'FM999999990.000')),
      null)::app.violation;
  end if;

  -- C9 — continuité des numéros de pièce, par journal
  return query
    with numerotees as (
      select p.id, p.journal_id, j.code as journal_code,
             nullif(regexp_replace(p.numero,'\D','','g'),'')::bigint as n
        from piece p
        join journal j on j.id = p.journal_id
       where p.exercice_id = p_exercice_id
    ), sauts as (
      select journal_code, n,
             lag(n) over (partition by journal_id order by n) as precedent
        from numerotees
       where n is not null
    )
    select 'C9'::text,'avertissement'::text,
           format('Journal %s : saut de numérotation entre %s et %s.',
                  journal_code, precedent, n),
           null::uuid
      from sauts
     where precedent is not null and n - precedent > 1;

  -- C12 — doublons potentiels. Non bloquant, comme dans la source :
  -- deux factures d'un même fournisseur au même montant le même jour
  -- existent réellement.
  return query
    select 'C12'::text,'avertissement'::text,
           format('Doublon probable : %s le %s pour %s TND (pièces %s).',
                  coalesce(t.raison_sociale,'sans tiers'),
                  p.date_piece,
                  to_char(x.montant,'FM999999990.000'),
                  string_agg(distinct p.numero, ', ')),
           null::uuid
      from (
        select e.piece_id,
               e.tiers_id,
               e.numero_facture,
               (e.debit + e.credit) as montant
          from ecriture e
      ) x
      join piece p on p.id = x.piece_id
      left join tiers t on t.id = x.tiers_id
     where p.exercice_id = p_exercice_id
     group by t.raison_sociale, p.date_piece, x.montant, x.tiers_id, x.numero_facture
    having count(distinct p.id) > 1
       and (x.tiers_id is not null or x.numero_facture is not null);

  return;
end;
$$;

-- =====================================================================
-- LA BARRIÈRE
-- Une pièce ne quitte le brouillon que si aucun contrôle bloquant ne
-- subsiste. C'est ici, et nulle part ailleurs, que se joue la doctrine
-- « les agents proposent, le noyau dispose ».
-- =====================================================================
create or replace function app.piece_barriere()
returns trigger
language plpgsql
as $$
declare
  v_violations text;
begin
  if new.statut = 'brouillon' then
    return new;                       -- le brouillon accepte l'imparfait
  end if;

  select string_agg(format('[%s] %s', v.code, v.message), E'\n')
    into v_violations
    from app.controler_piece(new.id) v
   where v.gravite = 'bloquant';

  if v_violations is not null then
    raise exception E'Pièce % non conforme, passage au statut « % » refusé :\n%',
      new.id, new.statut, v_violations
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger piece_barriere_trg
  before update of statut on piece
  for each row
  when (new.statut is distinct from old.statut)
  execute function app.piece_barriere();

-- Barrière équivalente sur le lettrage.
create or replace function app.lettrage_barriere()
returns trigger
language plpgsql
as $$
declare
  v_violations text;
begin
  select string_agg(format('[%s] %s', v.code, v.message), E'\n')
    into v_violations
    from app.controler_lettrage(new.lettrage_id) v
   where v.gravite = 'bloquant';

  if v_violations is not null then
    raise exception E'Lettrage non conforme :\n%', v_violations
      using errcode = 'check_violation';
  end if;

  return null;
end;
$$;

-- Différé en fin de transaction : on veut juger le groupe complet, pas
-- chaque écriture au fur et à mesure de son rattachement.
-- La clause WHEN ne référence que NEW : sur INSERT, OLD n'existe pas et
-- y faire appel lèverait une erreur à chaque insertion.
create constraint trigger lettrage_barriere_trg
  after insert or update of lettrage_id on ecriture
  deferrable initially deferred
  for each row
  when (new.lettrage_id is not null)
  execute function app.lettrage_barriere();
