-- =====================================================================
-- 0009 — ÉDITIONS : balance générale, balance auxiliaire, grands livres
-- ---------------------------------------------------------------------
-- Portage du moteur de « Editions GL et BG/V3.2.15.html » sur des vues SQL.
--
-- ⚠️ POINT DE SÉCURITÉ CRITIQUE
-- Une vue PostgreSQL s'exécute par défaut avec les droits de SON
-- PROPRIÉTAIRE, pas de l'appelant. Une vue créée sans précaution
-- CONTOURNERAIT DONC LA RLS et exposerait tous les dossiers du cabinet à
-- n'importe quel collaborateur — en annulant d'un coup tout le travail
-- d'isolation de 0007.
--
-- Chaque vue de ce fichier porte `with (security_invoker = true)`.
-- Ne créez jamais une vue ici sans cette option.
-- =====================================================================

-- ---------------------------------------------------------------------
-- VUE DE BASE — l'écriture à plat, telle qu'une édition la lit
-- Toutes les autres vues en dérivent. `piece_statut` est exposé pour que
-- l'appelant puisse exclure les brouillons quand il le souhaite.
-- ---------------------------------------------------------------------
create view v_ecriture
with (security_invoker = true) as
select
  e.id                as ecriture_id,
  e.dossier_id,
  p.exercice_id,
  p.id                as piece_id,
  p.numero            as piece_numero,
  p.date_piece,
  p.statut            as piece_statut,
  p.source            as piece_source,
  p.agent_code,
  j.id                as journal_id,
  j.code              as journal_code,
  j.nom               as journal_nom,
  c.id                as compte_id,
  c.numero            as compte_numero,
  c.libelle           as compte_libelle,
  c.classe            as compte_classe,
  c.collectif         as compte_collectif,
  t.id                as tiers_id,
  t.code              as tiers_code,
  t.raison_sociale    as tiers_nom,
  e.ordre,
  e.libelle,
  e.debit,
  e.credit,
  (e.debit - e.credit) as mouvement,
  e.devise,
  e.reference,
  e.numero_facture,
  e.date_echeance,
  e.lettrage_id,
  l.code              as lettrage_code,
  e.rapprochement_id,
  e.created_at
from ecriture e
join piece   p on p.id = e.piece_id
join journal j on j.id = p.journal_id
join compte  c on c.id = e.compte_id
left join tiers    t on t.id = e.tiers_id
left join lettrage l on l.id = e.lettrage_id;

comment on view v_ecriture is
  'Écritures à plat. Base de toutes les éditions. security_invoker : la RLS '
  'du dossier s''applique à l''appelant.';

-- ---------------------------------------------------------------------
-- BALANCE GÉNÉRALE
-- Les colonnes _valide excluent les brouillons. Les colonnes sans suffixe
-- les incluent : un cabinet consulte souvent sa balance en cours de mois,
-- brouillons compris. Exposer les deux évite de dupliquer la vue.
-- ---------------------------------------------------------------------
create view v_balance_generale
with (security_invoker = true) as
select
  e.dossier_id,
  e.exercice_id,
  e.compte_id,
  e.compte_numero,
  e.compte_libelle,
  e.compte_classe,

  sum(e.debit)                                    as debit,
  sum(e.credit)                                   as credit,
  sum(e.debit) - sum(e.credit)                    as solde,
  greatest(sum(e.debit) - sum(e.credit), 0)       as solde_debiteur,
  greatest(sum(e.credit) - sum(e.debit), 0)       as solde_crediteur,

  sum(e.debit)  filter (where e.piece_statut <> 'brouillon') as debit_valide,
  sum(e.credit) filter (where e.piece_statut <> 'brouillon') as credit_valide,
  coalesce(sum(e.debit)  filter (where e.piece_statut <> 'brouillon'), 0)
    - coalesce(sum(e.credit) filter (where e.piece_statut <> 'brouillon'), 0)
                                                  as solde_valide,

  count(*)                                        as nb_mouvements
from v_ecriture e
group by e.dossier_id, e.exercice_id, e.compte_id,
         e.compte_numero, e.compte_libelle, e.compte_classe;

-- ---------------------------------------------------------------------
-- BALANCE AUXILIAIRE — par compte collectif et par tiers
-- ---------------------------------------------------------------------
create view v_balance_auxiliaire
with (security_invoker = true) as
select
  e.dossier_id,
  e.exercice_id,
  e.compte_id,
  e.compte_numero,
  e.compte_libelle,
  e.tiers_id,
  e.tiers_code,
  e.tiers_nom,

  sum(e.debit)                              as debit,
  sum(e.credit)                             as credit,
  sum(e.debit) - sum(e.credit)              as solde,

  -- Ce qui reste à apurer : les écritures non lettrées.
  sum(e.debit)  filter (where e.lettrage_id is null) as debit_non_lettre,
  sum(e.credit) filter (where e.lettrage_id is null) as credit_non_lettre,
  coalesce(sum(e.debit)  filter (where e.lettrage_id is null), 0)
    - coalesce(sum(e.credit) filter (where e.lettrage_id is null), 0)
                                            as solde_non_lettre,

  count(*)                                  as nb_mouvements
from v_ecriture e
where e.compte_collectif
  and e.tiers_id is not null
group by e.dossier_id, e.exercice_id, e.compte_id, e.compte_numero,
         e.compte_libelle, e.tiers_id, e.tiers_code, e.tiers_nom;

-- ---------------------------------------------------------------------
-- GRAND LIVRE GÉNÉRAL — mouvements ordonnés avec solde progressif
-- Le solde cumulé est calculé en fenêtre : c'est ce que faisait
-- « calcul des soldes cumulés » dans l'outil d'origine, en JavaScript.
-- ---------------------------------------------------------------------
create view v_grand_livre
with (security_invoker = true) as
select
  e.*,
  sum(e.mouvement) over (
    partition by e.dossier_id, e.exercice_id, e.compte_id
    order by e.date_piece, e.piece_numero, e.ordre, e.ecriture_id
    rows between unbounded preceding and current row
  ) as solde_cumule
from v_ecriture e;

-- ---------------------------------------------------------------------
-- GRAND LIVRE AUXILIAIRE — même chose, ventilé par tiers
-- ---------------------------------------------------------------------
create view v_grand_livre_auxiliaire
with (security_invoker = true) as
select
  e.*,
  sum(e.mouvement) over (
    partition by e.dossier_id, e.exercice_id, e.compte_id, e.tiers_id
    order by e.date_piece, e.piece_numero, e.ordre, e.ecriture_id
    rows between unbounded preceding and current row
  ) as solde_cumule
from v_ecriture e
where e.compte_collectif
  and e.tiers_id is not null;

-- ---------------------------------------------------------------------
-- BALANCE ÂGÉE — antériorité des créances et dettes non lettrées
-- Reste disponible comme édition au service de la révision du cycle
-- Tiers, même sans agent de recouvrement (arbitrage E).
-- ---------------------------------------------------------------------
create view v_balance_agee
with (security_invoker = true) as
select
  e.dossier_id,
  e.exercice_id,
  e.compte_numero,
  e.tiers_id,
  e.tiers_code,
  e.tiers_nom,
  coalesce(e.date_echeance, e.date_piece)                         as date_reference,
  current_date - coalesce(e.date_echeance, e.date_piece)          as anciennete_jours,
  case
    when current_date - coalesce(e.date_echeance, e.date_piece) <= 0   then 'non_echu'
    when current_date - coalesce(e.date_echeance, e.date_piece) <= 30  then '0_30'
    when current_date - coalesce(e.date_echeance, e.date_piece) <= 60  then '31_60'
    when current_date - coalesce(e.date_echeance, e.date_piece) <= 90  then '61_90'
    else 'plus_90'
  end                                                             as tranche,
  e.piece_numero,
  e.date_piece,
  e.numero_facture,
  e.mouvement                                                     as montant
from v_ecriture e
where e.compte_collectif
  and e.tiers_id is not null
  and e.lettrage_id is null
  and e.mouvement <> 0;

-- =====================================================================
-- FONCTIONS DE SOLDE
-- =====================================================================

-- Solde d'un compte, éventuellement arrêté à une date.
create or replace function public.solde_compte(
  p_compte_id   uuid,
  p_exercice_id uuid,
  p_date        date default null,
  p_inclure_brouillon boolean default true
)
returns numeric
language sql
stable
security invoker
set search_path = public, pg_catalog
as $$
  select coalesce(sum(debit - credit), 0)
    from v_ecriture
   where compte_id = p_compte_id
     and exercice_id = p_exercice_id
     and (p_date is null or date_piece <= p_date)
     and (p_inclure_brouillon or piece_statut <> 'brouillon');
$$;

-- Solde d'un tiers sur un compte collectif.
create or replace function public.solde_tiers(
  p_tiers_id    uuid,
  p_exercice_id uuid,
  p_date        date default null
)
returns numeric
language sql
stable
security invoker
set search_path = public, pg_catalog
as $$
  select coalesce(sum(debit - credit), 0)
    from v_ecriture
   where tiers_id = p_tiers_id
     and exercice_id = p_exercice_id
     and (p_date is null or date_piece <= p_date);
$$;

-- Résultat de l'exercice : produits (classe 7) moins charges (classe 6).
-- Reprend la règle de l'outil d'origine, r7 - r6, sous sa forme la plus
-- simple : sur les classes 6 et 7, le résultat est la somme de
-- (crédit - débit). Un produit crédité l'augmente, une charge débitée le
-- diminue, sans distinction de cas à écrire.
create or replace function public.resultat_exercice(p_exercice_id uuid)
returns numeric
language sql
stable
security invoker
set search_path = public, pg_catalog
as $$
  select coalesce(sum(credit - debit), 0)
    from v_ecriture
   where exercice_id = p_exercice_id
     and compte_classe in (6, 7);
$$;

-- ---------------------------------------------------------------------
-- Droits
-- ---------------------------------------------------------------------
grant select on v_ecriture, v_balance_generale, v_balance_auxiliaire,
                v_grand_livre, v_grand_livre_auxiliaire, v_balance_agee
  to authenticated;

revoke all on function public.solde_compte(uuid, uuid, date, boolean) from public, anon;
revoke all on function public.solde_tiers(uuid, uuid, date)           from public, anon;
revoke all on function public.resultat_exercice(uuid)                 from public, anon;

grant execute on function public.solde_compte(uuid, uuid, date, boolean) to authenticated;
grant execute on function public.solde_tiers(uuid, uuid, date)           to authenticated;
grant execute on function public.resultat_exercice(uuid)                 to authenticated;
