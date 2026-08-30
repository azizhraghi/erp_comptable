-- =====================================================================
-- 0011 — DROITS SQL DU RÔLE AUTHENTIFIÉ
-- ---------------------------------------------------------------------
-- Le projet Supabase a été créé avec « Automatically expose new tables »
-- désactivé. C'est le bon choix : les droits doivent être explicitement
-- accordés. La RLS reste la barrière de sécurité effective par dossier ;
-- ces GRANT ne la contournent pas.
-- =====================================================================

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Toute nouvelle table publique restera inutilisable par le frontend tant
-- qu'une migration ne lui ajoute pas de policy RLS. Cette règle évite
-- seulement l'oubli du GRANT après cette étape.
alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to authenticated;
