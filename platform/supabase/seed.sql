-- =====================================================================
-- AMORÇAGE — à exécuter UNE FOIS, après les 7 migrations
-- ---------------------------------------------------------------------
-- PRÉREQUIS : l'utilisateur doit déjà exister dans Supabase Auth.
--   Dashboard > Authentication > Users > Add user
--   Cochez « Auto Confirm User », sinon la connexion sera refusée.
--
-- Ensuite : remplacez l'e-mail ci-dessous par le vôtre et exécutez tout ce
-- fichier dans le SQL Editor du dashboard.
--
-- Sans cet amorçage, la RLS fait son travail et vous ne verrez rien :
-- pas de cabinet, pas de collaborateur, donc aucun dossier autorisé.
-- =====================================================================

do $$
declare
  -- ⚠️ SEULE LIGNE À MODIFIER
  v_email    text := 'najd.benthabet@amex.com.tn';

  v_user     uuid;
  v_cabinet  uuid;
  v_dossier  uuid;
  v_exercice uuid;
  v_annee    smallint := extract(year from current_date)::smallint;
begin
  -- 1. Retrouver l'utilisateur créé dans le dashboard
  select id into v_user from auth.users where email = v_email;

  if v_user is null then
    raise exception
      'Aucun utilisateur « % » dans Auth. Créez-le d''abord : Authentication > Users > Add user (avec Auto Confirm).',
      v_email;
  end if;

  -- 2. Le cabinet
  insert into cabinet (nom, email)
  values ('Cabinet ComptaExpert', v_email)
  returning id into v_cabinet;

  -- 3. Vous, en administrateur
  insert into collaborateur (id, cabinet_id, nom, prenom, email, profil)
  values (v_user, v_cabinet, 'Ben Thabet', 'Najd', v_email, 'administrateur');

  -- 4. Un dossier de démonstration
  insert into dossier (
    cabinet_id, code, raison_sociale, forme_juridique,
    mf, nature, regime_tva, mode_depot, longueur_compte
  )
  values (
    v_cabinet, 'SOC001', 'Société de démonstration SARL', 'SARL',
    '1234567A/M/C/000', 'PM', 'Reel', 'teleLiq', 6
  )
  returning id into v_dossier;

  -- Un administrateur voit déjà tous les dossiers de son cabinet, mais on
  -- crée l'affectation explicite : c'est elle qui sera la règle générale
  -- pour les collaborateurs.
  insert into dossier_affectation (dossier_id, collaborateur_id, role)
  values (v_dossier, v_user, 'responsable');

  -- 5. L'exercice courant et ses douze périodes
  insert into exercice (
    dossier_id, annee, libelle, date_debut, date_fin, statut, est_courant
  )
  values (
    v_dossier, v_annee, 'Exercice ' || v_annee,
    make_date(v_annee, 1, 1), make_date(v_annee, 12, 31),
    'ouvert', true
  )
  returning id into v_exercice;

  perform app.creer_periodes(v_exercice);

  -- 6. Les journaux, repris de V61
  insert into journal (dossier_id, code, nom, nature, rapprochement) values
    (v_dossier, 'AN', 'A NOUVEAU',            'AN',         false),
    (v_dossier, 'AC', 'ACHATS',               'Achat',      false),
    (v_dossier, 'VT', 'VENTES',               'Vente',      false),
    (v_dossier, 'BQ', 'BANQUE',               'Tresorerie', true),
    (v_dossier, 'OD', 'OPÉRATIONS DIVERSES',  'OD',         false),
    (v_dossier, 'SI', 'SITUATION/INVENTAIRE', 'SituInv',    false);

  -- 7. Un plan comptable minimal (PCE tunisien)
  insert into compte (
    dossier_id, numero, libelle, classe, type, nature_solde,
    collectif, type_tiers, lettrable, rapprochable
  ) values
    (v_dossier,'101000','Capital',            1,'Passif', 'Crediteur',false,null,          false,false),
    (v_dossier,'401000','Fournisseurs',       4,'Passif', 'Crediteur',true, 'fournisseur', true, false),
    (v_dossier,'411000','Clients',            4,'Actif',  'Debiteur', true, 'client',      true, false),
    (v_dossier,'425000','Personnel',          4,'Passif', 'Crediteur',true, 'salarie',     true, false),
    (v_dossier,'436000','État — TVA',         4,'Passif', 'Crediteur',false,null,          false,false),
    (v_dossier,'532000','Banque BIAT',        5,'Actif',  'Debiteur', false,null,          false,true),
    (v_dossier,'542000','Caisse',             5,'Actif',  'Debiteur', false,null,          false,false),
    (v_dossier,'601000','Achats',             6,'Charge', 'Debiteur', false,null,          false,false),
    (v_dossier,'606100','Électricité et gaz', 6,'Charge', 'Debiteur', false,null,          false,false),
    (v_dossier,'701000','Ventes',             7,'Produit','Crediteur',false,null,          false,false);

  -- 8. Deux tiers de démonstration
  insert into tiers (dossier_id, code, raison_sociale, type, compte_collectif_id, mf)
  select v_dossier, 'FR001', 'STEG', 'fournisseur', c.id, '4567890D/M/C/003'
    from compte c where c.dossier_id = v_dossier and c.numero = '401000';

  insert into tiers (dossier_id, code, raison_sociale, type, compte_collectif_id, mf)
  select v_dossier, 'CL001', 'Tunisie Telecom', 'client', c.id, '1234567A/M/C/000'
    from compte c where c.dossier_id = v_dossier and c.numero = '411000';

  raise notice 'Amorçage terminé. Cabinet %, dossier SOC001, exercice %.',
    v_cabinet, v_annee;
end;
$$;
