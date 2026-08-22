-- =====================================================================
-- 0006 — COUCHE AGENTS ET PISTE D'AUDIT
-- ---------------------------------------------------------------------
-- Ici vit tout ce que l'IA produit. Rien de ce qui est écrit dans ce
-- fichier ne touche `ecriture` : une proposition d'agent est un objet
-- distinct, qui doit être promu en pièce par le chemin de 0004 comme
-- n'importe quelle saisie.
-- =====================================================================

create extension if not exists vector;   -- pgvector, pour la mémoire d'imputation

-- ---------------------------------------------------------------------
-- DOCUMENT — la pièce justificative telle qu'elle arrive
-- Le binaire vit dans Supabase Storage ; ici on garde le pointeur, le
-- hash (déduplication), et le résultat d'extraction de l'agent SCR.
-- ---------------------------------------------------------------------
create table document (
  id            uuid primary key default gen_random_uuid(),
  dossier_id    uuid not null references dossier(id) on delete cascade,
  exercice_id   uuid references exercice(id) on delete set null,

  storage_path  text not null,
  nom_fichier   text not null,
  mime_type     text,
  taille_octets bigint,
  hash_sha256   text not null,

  type_document text check (type_document in
                  ('facture_achat','facture_vente','releve_bancaire',
                   'note_frais','contrat','avoir','autre')),
  origine       text not null default 'depot'
                check (origine in ('depot','portail','email','scan','import')),

  -- Résultat de SCR. Le JSONB laisse le schéma d'extraction évoluer sans
  -- migration ; les champs stabilisés seront promus en colonnes plus tard.
  extraction        jsonb,
  extraction_statut text not null default 'en_attente'
                    check (extraction_statut in
                      ('en_attente','en_cours','extrait','echec','ignore')),
  confiance_globale numeric(4,3) check (confiance_globale between 0 and 1),
  extracteur        text,        -- 'convertisseur:BIAT' | 'vlm:<modele>'

  depose_par    uuid references collaborateur(id),
  created_at    timestamptz not null default now(),

  -- Un même document ne s'ingère qu'une fois par dossier.
  unique (dossier_id, hash_sha256)
);

create index on document (dossier_id, extraction_statut);
create index on document (dossier_id, created_at desc);

alter table immobilisation
  add constraint immo_document_fk
  foreign key (document_id) references document(id) on delete set null;

-- ---------------------------------------------------------------------
-- PROPOSITION — ce qu'un agent suggère, avant tout contrôle
-- `contenu` porte la pièce proposée et ses lignes. Tant que la
-- proposition n'est pas acceptée, rien n'existe dans le grand livre.
-- ---------------------------------------------------------------------
create table proposition (
  id            uuid primary key default gen_random_uuid(),
  dossier_id    uuid not null references dossier(id) on delete cascade,
  document_id   uuid references document(id) on delete set null,

  agent_code    text not null
                check (agent_code in ('SCR','IMP','LET','REV','FIS','ANA','ORC')),
  type          text not null
                check (type in ('ecriture','lettrage','rapprochement',
                                'immobilisation','echeance','note_revision')),

  contenu       jsonb not null,
  confiance     numeric(4,3) not null check (confiance between 0 and 1),

  -- Niveau d'autonomie appliqué au moment de l'émission (N0 → N3).
  -- Conservé pour pouvoir expliquer a posteriori pourquoi telle
  -- proposition est partie en validation automatique et telle autre non.
  autonomie     smallint not null default 1 check (autonomie between 0 and 3),

  statut        text not null default 'en_attente'
                check (statut in ('en_attente','acceptee','corrigee','rejetee','expiree')),

  -- Renseignés à l'acceptation
  piece_id      uuid references piece(id) on delete set null,
  traitee_par   uuid references collaborateur(id),
  traitee_le    timestamptz,

  created_at    timestamptz not null default now()
);

create index on proposition (dossier_id, statut) where statut = 'en_attente';
create index on proposition (agent_code, created_at desc);
create index on proposition (document_id);

alter table piece
  add constraint piece_proposition_fk
  foreign key (proposition_id) references proposition(id) on delete set null;

-- ---------------------------------------------------------------------
-- CORRECTION — la boucle d'apprentissage
-- Le triplet document → proposition → correction. C'est la seule table
-- qui fasse progresser le système ; sans elle, la qualité du premier jour
-- est la qualité définitive.
-- ---------------------------------------------------------------------
create table correction (
  id             uuid primary key default gen_random_uuid(),
  proposition_id uuid not null references proposition(id) on delete cascade,
  dossier_id     uuid not null references dossier(id) on delete cascade,

  contenu_propose jsonb not null,
  contenu_retenu  jsonb not null,
  champs_modifies text[] not null default '{}',

  -- Renseigné quand le correcteur veut expliquer la règle plutôt que
  -- laisser le système la deviner. Ces motifs valent de l'or.
  motif          text,
  corrige_par    uuid references collaborateur(id),
  created_at     timestamptz not null default now()
);

create index on correction (dossier_id, created_at desc);
create index on correction using gin (champs_modifies);

-- ---------------------------------------------------------------------
-- MÉMOIRE D'IMPUTATION — le RAG du cabinet
-- Un enregistrement par situation apprise. `embedding` sert la recherche
-- vectorielle, `contexte_texte` la recherche lexicale : la recherche est
-- hybride, comme annoncé en Phase 1.
-- ---------------------------------------------------------------------
create table memoire_imputation (
  id             uuid primary key default gen_random_uuid(),
  dossier_id     uuid not null references dossier(id) on delete cascade,
  tiers_id       uuid references tiers(id) on delete cascade,

  contexte_texte text not null,        -- libellé fournisseur, mots-clés facture
  embedding      vector(1024),         -- dimension à figer selon le modèle retenu

  imputation     jsonb not null,       -- comptes, journal, ventilation TVA
  occurrences    integer not null default 1,
  taux_confirmation numeric(4,3),      -- part des fois où elle n'a pas été corrigée
  derniere_utilisation timestamptz,
  created_at     timestamptz not null default now()
);

create index on memoire_imputation (dossier_id, tiers_id);
create index on memoire_imputation using gin (contexte_texte gin_trgm_ops);
create index memoire_imputation_embedding_idx
  on memoire_imputation using hnsw (embedding vector_cosine_ops);

-- ---------------------------------------------------------------------
-- RÈGLE D'IMPUTATION — la mémoire devenue explicite
-- Quand un motif se répète assez, on le promeut en règle lisible que le
-- cabinet peut relire, corriger et désactiver. C'est ce qui rend le
-- système auditable plutôt que magique.
-- ---------------------------------------------------------------------
create table regle_imputation (
  id           uuid primary key default gen_random_uuid(),
  dossier_id   uuid references dossier(id) on delete cascade,
  cabinet_id   uuid not null references cabinet(id) on delete cascade,

  -- dossier_id NULL = règle mutualisée au niveau du cabinet. Elle ne peut
  -- alors contenir aucune donnée nominative : uniquement un motif.
  portee       text not null default 'dossier'
               check (portee in ('dossier','cabinet')),

  condition    jsonb not null,        -- { tiers_mf: "...", libelle_contient: "..." }
  imputation   jsonb not null,
  libelle      text not null,         -- « Factures STEG → 606100, TVA 19 % »
  active       boolean not null default true,
  creee_par    text not null default 'apprentissage'
               check (creee_par in ('apprentissage','manuelle')),
  validee_par  uuid references collaborateur(id),
  created_at   timestamptz not null default now(),

  constraint regle_portee_coherente
    check ((portee = 'dossier' and dossier_id is not null)
        or (portee = 'cabinet' and dossier_id is null))
);

create index on regle_imputation (dossier_id) where active;
create index on regle_imputation (cabinet_id) where portee = 'cabinet' and active;

-- ---------------------------------------------------------------------
-- EXÉCUTION D'AGENT — la traçabilité de niveau audit
-- Un contrôle fiscal doit pouvoir reconstituer pourquoi une écriture a
-- été passée trois ans plus tôt : quel modèle, quelle version, quelles
-- sources, quelle confiance.
-- ---------------------------------------------------------------------
create table agent_execution (
  id             uuid primary key default gen_random_uuid(),
  dossier_id     uuid references dossier(id) on delete cascade,
  agent_code     text not null
                 check (agent_code in ('SCR','IMP','LET','REV','FIS','ANA','ORC')),

  modele         text not null,       -- identifiant du modèle auto-hébergé
  modele_version text,
  prompt_hash    text,                -- empreinte du gabarit, pas son contenu

  entree_ref     uuid,                -- document_id, piece_id, question…
  proposition_id uuid references proposition(id) on delete set null,

  sources        jsonb,               -- extraits RAG cités
  confiance      numeric(4,3),
  duree_ms       integer,
  tokens_entree  integer,
  tokens_sortie  integer,

  statut         text not null default 'succes'
                 check (statut in ('succes','echec','escalade')),
  motif_escalade text,
  erreur         text,
  created_at     timestamptz not null default now()
);

create index on agent_execution (dossier_id, created_at desc);
create index on agent_execution (agent_code, statut, created_at desc);

-- ---------------------------------------------------------------------
-- AUDIT LOG — unifié
-- Fusionne state.auditLog (V61) et globalLog (Échéances Expert). Écrit par
-- trigger, jamais par l'application : une trace qu'on peut oublier
-- d'écrire n'est pas une trace.
-- ---------------------------------------------------------------------
create table audit_log (
  id           bigint generated always as identity primary key,
  cabinet_id   uuid references cabinet(id) on delete cascade,
  dossier_id   uuid references dossier(id) on delete cascade,

  acteur_id    uuid references collaborateur(id),
  acteur_agent text,                  -- renseigné si l'auteur est un agent
  action       text not null
               check (action in ('CREATE','UPDATE','DELETE','VALIDATE','VISA',
                                 'PRINT','EXPORT','IMPORT','LETTRAGE',
                                 'CLOTURE','RAN','PROPOSE','ACCEPTE','REJETE')),
  entite       text not null,
  entite_id    uuid,
  description  text,
  avant        jsonb,
  apres        jsonb,
  horodatage   timestamptz not null default now()
);

create index on audit_log (dossier_id, horodatage desc);
create index on audit_log (entite, entite_id);
create index on audit_log (acteur_id, horodatage desc);

-- Trace générique, branchée table par table.
create or replace function app.tracer()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_dossier uuid;
  v_action  text;
begin
  v_dossier := case
    when tg_op = 'DELETE' then (to_jsonb(old) ->> 'dossier_id')::uuid
    else (to_jsonb(new) ->> 'dossier_id')::uuid
  end;

  v_action := case tg_op
    when 'INSERT' then 'CREATE'
    when 'UPDATE' then 'UPDATE'
    else 'DELETE'
  end;

  insert into audit_log (dossier_id, acteur_id, action, entite, entite_id, avant, apres)
  values (
    v_dossier,
    auth.uid(),
    v_action,
    tg_table_name,
    case when tg_op = 'DELETE' then (to_jsonb(old) ->> 'id')::uuid
         else (to_jsonb(new) ->> 'id')::uuid end,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );

  return coalesce(new, old);
end;
$$;

create trigger tracer_piece      after insert or update or delete on piece
  for each row execute function app.tracer();
create trigger tracer_ecriture   after insert or update or delete on ecriture
  for each row execute function app.tracer();
create trigger tracer_compte     after insert or update or delete on compte
  for each row execute function app.tracer();
create trigger tracer_tiers      after insert or update or delete on tiers
  for each row execute function app.tracer();
create trigger tracer_exercice   after insert or update or delete on exercice
  for each row execute function app.tracer();
create trigger tracer_immo       after insert or update or delete on immobilisation
  for each row execute function app.tracer();
create trigger tracer_proposition after insert or update or delete on proposition
  for each row execute function app.tracer();

-- Le journal d'audit ne se modifie ni ne s'efface. Jamais.
create or replace function app.audit_append_only()
returns trigger language plpgsql as $$
begin
  raise exception 'Le journal d''audit est en ajout seul.'
    using errcode = 'restrict_violation';
end;
$$;

create trigger audit_log_append_only_trg
  before update or delete on audit_log
  for each row execute function app.audit_append_only();
