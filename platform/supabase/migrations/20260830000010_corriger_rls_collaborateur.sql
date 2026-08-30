-- =====================================================================
-- 0010 — CORRECTION RLS : profil et cabinet courant
-- ---------------------------------------------------------------------
-- Répare les projets déjà migrés avant que cabinet_courant() soit présent.
-- Une policy sur collaborateur ne peut pas consulter collaborateur via une
-- sous-requête classique : PostgreSQL y détecte une récursion infinie.
-- =====================================================================

create or replace function app.cabinet_courant()
returns uuid
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select cabinet_id from collaborateur where id = auth.uid() and actif;
$$;

drop policy if exists collaborateur_select on collaborateur;
create policy collaborateur_select on collaborateur for select
  using (cabinet_id = app.cabinet_courant());

drop policy if exists cabinet_select on cabinet;
create policy cabinet_select on cabinet for select
  using (id = app.cabinet_courant());

drop policy if exists organisme_select on organisme;
create policy organisme_select on organisme for select
  using (cabinet_id = app.cabinet_courant());
drop policy if exists organisme_write on organisme;
create policy organisme_write on organisme for all
  using (cabinet_id = app.cabinet_courant() and app.profil_courant() = 'administrateur')
  with check (cabinet_id = app.cabinet_courant() and app.profil_courant() = 'administrateur');

drop policy if exists declaration_type_select on declaration_type;
create policy declaration_type_select on declaration_type for select
  using (cabinet_id = app.cabinet_courant());
drop policy if exists declaration_type_write on declaration_type;
create policy declaration_type_write on declaration_type for all
  using (cabinet_id = app.cabinet_courant() and app.profil_courant() = 'administrateur')
  with check (cabinet_id = app.cabinet_courant() and app.profil_courant() = 'administrateur');

drop policy if exists jour_ferie_select on jour_ferie;
create policy jour_ferie_select on jour_ferie for select
  using (cabinet_id = app.cabinet_courant());
drop policy if exists jour_ferie_write on jour_ferie;
create policy jour_ferie_write on jour_ferie for all
  using (cabinet_id = app.cabinet_courant() and app.profil_courant() = 'administrateur')
  with check (cabinet_id = app.cabinet_courant() and app.profil_courant() = 'administrateur');

drop policy if exists nature_tache_select on nature_tache;
create policy nature_tache_select on nature_tache for select
  using (cabinet_id = app.cabinet_courant());
drop policy if exists nature_tache_write on nature_tache;
create policy nature_tache_write on nature_tache for all
  using (cabinet_id = app.cabinet_courant() and app.profil_courant() = 'administrateur')
  with check (cabinet_id = app.cabinet_courant() and app.profil_courant() = 'administrateur');

drop policy if exists regle_imputation_select on regle_imputation;
create policy regle_imputation_select on regle_imputation for select
  using (
    (portee = 'cabinet' and cabinet_id = app.cabinet_courant())
    or (portee = 'dossier' and dossier_id in (select app.dossiers_autorises()))
  );

drop policy if exists declaration_regle_all on declaration_regle;
create policy declaration_regle_all on declaration_regle for all
  using (exists (
    select 1 from declaration_type dt
     where dt.id = declaration_type_id
       and dt.cabinet_id = app.cabinet_courant()
  ))
  with check (app.profil_courant() = 'administrateur');

grant execute on function app.cabinet_courant() to authenticated;
