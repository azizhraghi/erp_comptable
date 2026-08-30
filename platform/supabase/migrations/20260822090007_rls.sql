-- =====================================================================
-- 0007 — ISOLATION PAR DOSSIER (Row-Level Security)
-- ---------------------------------------------------------------------
-- L'isolation entre dossiers est la promesse la plus sensible du produit :
-- un cabinet ne peut pas se permettre qu'une donnée du dossier A
-- apparaisse dans le dossier B. Elle est donc appliquée ici, en base, et
-- pas dans le code applicatif — un oubli côté client ne doit rien pouvoir
-- exposer.
--
-- Ces policies se testent comme des tests de sécurité, pas comme des
-- tests fonctionnels : cf. platform/docs/tests-isolation.md
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tables portant directement un dossier_id : politique uniforme.
-- La liste est explicite pour rester auditable d'un coup d'œil ; le DO
-- garantit qu'aucune n'est oubliée par copier-coller.
-- ---------------------------------------------------------------------
do $$
declare
  t text;
  tables_dossier text[] := array[
    -- référentiel
    'exercice','periode','journal','compte','tiers',
    -- grand livre
    'piece','ecriture','lettrage','rapprochement',
    -- modules
    'categorie_immobilisation','immobilisation','amortissement_ligne',
    'echeance','temps_passe',
    -- couche agents
    'document','proposition','correction','memoire_imputation','agent_execution'
  ];
begin
  foreach t in array tables_dossier loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);

    -- Le nom de la policy est un identifiant à part entière : il se
    -- construit avant d'être passé à %I, jamais par concaténation après.
    execute format(
      'create policy %I on %I for select
         using (dossier_id in (select app.dossiers_autorises()))',
      t || '_select', t);

    execute format(
      'create policy %I on %I for insert
         with check (app.peut_ecrire(dossier_id))',
      t || '_insert', t);

    execute format(
      'create policy %I on %I for update
         using (app.peut_ecrire(dossier_id))
         with check (app.peut_ecrire(dossier_id))',
      t || '_update', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Suppressions : volontairement absentes de la boucle.
-- Un grand livre ne se supprime pas ; on corrige par contre-passation.
-- Seules les tables où la suppression a un sens métier en reçoivent une.
-- ---------------------------------------------------------------------
create policy piece_delete on piece for delete
  using (
    app.peut_ecrire(dossier_id)
    and statut = 'brouillon'          -- un brouillon s'abandonne, une pièce validée non
  );

create policy ecriture_delete on ecriture for delete
  using (
    app.peut_ecrire(dossier_id)
    and exists (select 1 from piece p where p.id = piece_id and p.statut = 'brouillon')
  );

create policy document_delete on document for delete
  using (app.peut_ecrire(dossier_id) and extraction_statut <> 'extrait');

create policy proposition_delete on proposition for delete
  using (app.peut_ecrire(dossier_id) and statut = 'en_attente');

create policy temps_passe_delete on temps_passe for delete
  using (collaborateur_id = auth.uid());

-- ---------------------------------------------------------------------
-- DOSSIER — la table pivot
-- ---------------------------------------------------------------------
alter table dossier enable row level security;
alter table dossier force row level security;

create policy dossier_select on dossier for select
  using (id in (select app.dossiers_autorises()));

create policy dossier_insert on dossier for insert
  with check (app.profil_courant() = 'administrateur');

create policy dossier_update on dossier for update
  using (app.peut_ecrire(id))
  with check (app.peut_ecrire(id));

-- ---------------------------------------------------------------------
-- Tables au périmètre cabinet : visibles par tout collaborateur actif du
-- cabinet, modifiables par les administrateurs seulement.
-- ---------------------------------------------------------------------
do $$
declare
  t text;
  -- regle_imputation est volontairement absente : elle porte un
  -- dossier_id quand sa portée est « dossier », et une règle de dossier
  -- ne doit pas être visible d'un collaborateur non affecté. Elle reçoit
  -- sa propre policy juste en dessous.
  tables_cabinet text[] := array[
    'organisme','declaration_type','jour_ferie','nature_tache'
  ];
begin
  foreach t in array tables_cabinet loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);

    execute format(
      'create policy %I on %I for select
         using (cabinet_id = app.cabinet_courant())',
      t || '_select', t);

    execute format(
      'create policy %I on %I for all
         using (
           cabinet_id = app.cabinet_courant()
           and app.profil_courant() = ''administrateur''
         )
         with check (
           cabinet_id = app.cabinet_courant()
           and app.profil_courant() = ''administrateur''
         )',
      t || '_write', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- RÈGLE D'IMPUTATION — la seule table où la portée décide de la visibilité.
-- Une règle mutualisée ne contient qu'un motif anonymisé : elle est
-- visible de tout le cabinet. Une règle de dossier suit l'isolation.
-- ---------------------------------------------------------------------
alter table regle_imputation enable row level security;
alter table regle_imputation force row level security;

create policy regle_imputation_select on regle_imputation for select
  using (
    (portee = 'cabinet' and cabinet_id = app.cabinet_courant())
    or
    (portee = 'dossier' and dossier_id in (select app.dossiers_autorises()))
  );

create policy regle_imputation_write on regle_imputation for all
  using (
    (portee = 'dossier' and app.peut_ecrire(dossier_id))
    or (portee = 'cabinet' and app.profil_courant() = 'administrateur')
  )
  with check (
    (portee = 'dossier' and app.peut_ecrire(dossier_id))
    or (portee = 'cabinet' and app.profil_courant() = 'administrateur')
  );

-- ---------------------------------------------------------------------
-- Tables sans dossier_id propre : on remonte par la clé étrangère.
-- ---------------------------------------------------------------------
alter table tiers_compte enable row level security;
alter table tiers_compte force row level security;

create policy tiers_compte_all on tiers_compte for all
  using (exists (
    select 1 from tiers t
     where t.id = tiers_id and t.dossier_id in (select app.dossiers_autorises())
  ))
  with check (exists (
    select 1 from tiers t
     where t.id = tiers_id and app.peut_ecrire(t.dossier_id)
  ));

alter table declaration_regle enable row level security;
alter table declaration_regle force row level security;

create policy declaration_regle_all on declaration_regle for all
  using (exists (
    select 1 from declaration_type dt
     where dt.id = declaration_type_id
       and dt.cabinet_id = app.cabinet_courant()
  ))
  with check (app.profil_courant() = 'administrateur');

alter table dossier_declaration enable row level security;
alter table dossier_declaration force row level security;

create policy dossier_declaration_all on dossier_declaration for all
  using (dossier_id in (select app.dossiers_autorises()))
  with check (app.peut_ecrire(dossier_id));

alter table echeance_historique enable row level security;
alter table echeance_historique force row level security;

-- Historique consultable, jamais modifiable : il est alimenté par trigger.
create policy echeance_historique_select on echeance_historique for select
  using (exists (
    select 1 from echeance e
     where e.id = echeance_id and e.dossier_id in (select app.dossiers_autorises())
  ));

-- ---------------------------------------------------------------------
-- COLLABORATEUR et AFFECTATION
-- ---------------------------------------------------------------------
alter table collaborateur enable row level security;
alter table collaborateur force row level security;

create policy collaborateur_select on collaborateur for select
  using (cabinet_id = app.cabinet_courant());

create policy collaborateur_update_soi on collaborateur for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy collaborateur_admin on collaborateur for all
  using (app.profil_courant() = 'administrateur')
  with check (app.profil_courant() = 'administrateur');

alter table dossier_affectation enable row level security;
alter table dossier_affectation force row level security;

create policy affectation_select on dossier_affectation for select
  using (collaborateur_id = auth.uid()
      or dossier_id in (select app.dossiers_autorises()));

create policy affectation_admin on dossier_affectation for all
  using (app.profil_courant() = 'administrateur')
  with check (app.profil_courant() = 'administrateur');

-- ---------------------------------------------------------------------
-- CABINET
-- ---------------------------------------------------------------------
alter table cabinet enable row level security;
alter table cabinet force row level security;

create policy cabinet_select on cabinet for select
  using (id = app.cabinet_courant());

create policy cabinet_update on cabinet for update
  using (app.profil_courant() = 'administrateur')
  with check (app.profil_courant() = 'administrateur');

-- ---------------------------------------------------------------------
-- AUDIT LOG — lisible sur ses dossiers, jamais modifiable
-- (la table porte déjà un trigger d'ajout seul en 0006 ; la policy
--  ferme la porte côté API REST)
-- ---------------------------------------------------------------------
alter table audit_log enable row level security;
alter table audit_log force row level security;

create policy audit_log_select on audit_log for select
  using (dossier_id in (select app.dossiers_autorises()));

-- Aucune policy insert : seul le trigger app.tracer(), en SECURITY
-- DEFINER, alimente cette table. Un client ne peut pas fabriquer de trace.

-- =====================================================================
-- VERROU DE SURFACE
-- Le schéma `app` n'est pas exposé par PostgREST : les helpers et les
-- fonctions de contrôle ne sont pas appelables directement depuis le
-- client. Les seuls points d'entrée sont les tables et les RPC que l'on
-- exposera explicitement.
-- =====================================================================
revoke all on schema app from anon, authenticated;
grant usage on schema app to authenticated;

revoke all on all functions in schema app from anon;
grant execute on function app.dossiers_autorises() to authenticated;
grant execute on function app.peut_ecrire(uuid)   to authenticated;
grant execute on function app.profil_courant()    to authenticated;
grant execute on function app.controler_piece(uuid)    to authenticated;
grant execute on function app.controler_lettrage(uuid) to authenticated;
grant execute on function app.controler_dossier(uuid, uuid) to authenticated;
