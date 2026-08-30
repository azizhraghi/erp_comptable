import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { depot } from '@/data';
import type { Compte, DonneesTiers, Tiers as TiersType } from '@/data/depot';
import { messageErreur } from '@/data/depot';
import { useDossier } from '@/dossier/DossierProvider';

const types = ['client', 'fournisseur', 'salarie', 'autre'] as const;
const libellesTypes: Record<TiersType['type'], string> = {
  client: 'Clients', fournisseur: 'Fournisseurs', salarie: 'Salariés', autre: 'Autres tiers',
};

type Formulaire = Omit<DonneesTiers, 'delai_paiement' | 'plafond_credit'> & {
  delai_paiement: string;
  plafond_credit: string;
};

const nul = (valeur: string) => valeur.trim() || null;

function defaut(tiers?: TiersType): Formulaire {
  return {
    code: tiers?.code ?? '', raison_sociale: tiers?.raison_sociale ?? '', type: tiers?.type ?? 'client',
    compte_collectif_id: tiers?.compte_collectif_id ?? null, mf: tiers?.mf ?? '', rc: tiers?.rc ?? '',
    adresse: tiers?.adresse ?? '', ville: tiers?.ville ?? '', pays: tiers?.pays ?? 'Tunisie',
    contact: tiers?.contact ?? '', telephone: tiers?.telephone ?? '', email: tiers?.email ?? '',
    rib: tiers?.rib ?? '', banque: tiers?.banque ?? '', devise: tiers?.devise ?? 'TND',
    mode_reglement: tiers?.mode_reglement ?? '', delai_paiement: String(tiers?.delai_paiement ?? 0),
    plafond_credit: tiers?.plafond_credit === null || tiers?.plafond_credit === undefined ? '' : String(tiers.plafond_credit),
    lettrage_auto: tiers?.lettrage_auto ?? true, gestion_echeances: tiers?.gestion_echeances ?? true,
    statut: tiers?.statut ?? 'actif', notes: tiers?.notes ?? '',
  };
}

export default function Tiers() {
  const { dossier, dossiers, chargement } = useDossier();
  const queryClient = useQueryClient();
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('');
  const [tiersEdite, setTiersEdite] = useState<TiersType | null | undefined>(undefined);

  const { data: tiers = [], isLoading, error } = useQuery({
    queryKey: ['tiers', dossier?.id], enabled: Boolean(dossier),
    queryFn: () => depot.listerTiers(dossier!.id),
  });
  const { data: comptes = [] } = useQuery({
    queryKey: ['comptes', dossier?.id], enabled: Boolean(dossier),
    queryFn: () => depot.listerComptes(dossier!.id),
  });
  const enregistrer = useMutation({
    mutationFn: async ({ tiersId, donnees }: { tiersId?: string; donnees: DonneesTiers }) => {
      if (!dossier) throw new Error('Sélectionnez un dossier avant de gérer les tiers.');
      return tiersId ? depot.modifierTiers(tiersId, donnees) : depot.creerTiers(dossier.id, donnees);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tiers', dossier?.id] });
      setTiersEdite(undefined);
    },
  });
  const ouvrir = (tiersCible: TiersType | null) => { enregistrer.reset(); setTiersEdite(tiersCible); };

  const visibles = useMemo(() => {
    const terme = recherche.trim().toLocaleLowerCase('fr');
    return tiers.filter((tiersCourant) => (!filtreType || tiersCourant.type === filtreType)
      && (!terme || tiersCourant.code.toLocaleLowerCase('fr').includes(terme)
        || tiersCourant.raison_sociale.toLocaleLowerCase('fr').includes(terme)
        || (tiersCourant.mf ?? '').toLocaleLowerCase('fr').includes(terme)));
  }, [filtreType, recherche, tiers]);

  if (chargement) return <p className="text-sm text-neutral-500">Chargement des tiers…</p>;
  if (!dossier || dossiers.length === 0) return <p className="text-sm text-neutral-500">Aucun dossier accessible pour afficher les tiers.</p>;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">Référentiel</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">Tiers</h1>
          <p className="mt-1 text-sm text-neutral-500">Clients, fournisseurs, salariés et autres partenaires de {dossier.raison_sociale}.</p>
        </div>
        <button type="button" onClick={() => ouvrir(null)} className="rounded-md bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800">Nouveau tiers</button>
      </section>

      <section className="grid gap-3 sm:grid-cols-4">
        {types.map((type) => <button key={type} type="button" onClick={() => setFiltreType(filtreType === type ? '' : type)} className={`rounded-lg border p-3 text-left transition-colors ${filtreType === type ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' : 'border-neutral-200 bg-white hover:border-emerald-300 dark:border-neutral-800 dark:bg-neutral-900'}`}><p className="text-xs uppercase tracking-wide text-neutral-500">{libellesTypes[type]}</p><p className="mt-1 text-xl font-semibold">{tiers.filter((item) => item.type === type && item.statut === 'actif').length}</p></button>)}
      </section>

      <section className="flex flex-wrap gap-3 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
        <label className="min-w-56 flex-1"><span className="sr-only">Rechercher un tiers</span><input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher par code, nom ou matricule fiscal" className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:border-neutral-700 dark:bg-neutral-950" /></label>
        <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)} className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"><option value="">Tous les types</option>{types.map((type) => <option key={type} value={type}>{libellesTypes[type]}</option>)}</select>
      </section>

      {error ? <Erreur>{messageErreur(error)}</Erreur> : isLoading ? <p className="text-sm text-neutral-500">Chargement des tiers…</p> : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"><div className="overflow-x-auto"><table className="w-full min-w-[820px] border-collapse text-sm"><thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-950/50"><tr><th className="px-4 py-3 font-medium">Code</th><th className="px-4 py-3 font-medium">Tiers</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Contact</th><th className="px-4 py-3 font-medium">Compte collectif</th><th className="px-4 py-3 font-medium">Statut</th><th className="w-28 px-4 py-3"><span className="sr-only">Modifier</span></th></tr></thead><tbody>
          {visibles.map((tiersCourant) => { const compte = comptes.find((item) => item.id === tiersCourant.compte_collectif_id); return <tr key={tiersCourant.id} className="border-t border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"><td className="px-4 py-3 font-mono font-medium">{tiersCourant.code}</td><td className="px-4 py-3"><p className="font-medium text-neutral-900 dark:text-neutral-100">{tiersCourant.raison_sociale}</p>{tiersCourant.mf && <p className="mt-0.5 font-mono text-xs text-neutral-500">MF {tiersCourant.mf}</p>}</td><td className="px-4 py-3"><Badge>{libellesTypes[tiersCourant.type]}</Badge></td><td className="px-4 py-3 text-neutral-600 dark:text-neutral-400"><p>{tiersCourant.contact ?? '—'}</p><p className="text-xs">{tiersCourant.telephone ?? tiersCourant.email ?? ''}</p></td><td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-400">{compte ? `${compte.numero} · ${compte.libelle}` : '—'}</td><td className="px-4 py-3"><Statut valeur={tiersCourant.statut} /></td><td className="px-4 py-3 text-right"><button type="button" onClick={() => ouvrir(tiersCourant)} className="rounded px-2 py-1 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950">Modifier</button></td></tr>; })}
          {visibles.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-neutral-500">Aucun tiers ne correspond à ce filtre.</td></tr>}
        </tbody></table></div></div>
      )}

      {tiersEdite !== undefined && <FormulaireTiers tiers={tiersEdite} comptes={comptes} enCours={enregistrer.isPending} erreur={enregistrer.error ? messageErreur(enregistrer.error) : null} annuler={() => setTiersEdite(undefined)} soumettre={(donnees) => enregistrer.mutate({ tiersId: tiersEdite?.id, donnees })} />}
    </div>
  );
}

function FormulaireTiers({ tiers, comptes, enCours, erreur, annuler, soumettre }: { tiers: TiersType | null; comptes: Compte[]; enCours: boolean; erreur: string | null; annuler: () => void; soumettre: (donnees: DonneesTiers) => void }) {
  const [formulaire, setFormulaire] = useState(() => defaut(tiers ?? undefined));
  const [erreurValidation, setErreurValidation] = useState<string | null>(null);
  const maj = <K extends keyof Formulaire>(cle: K, valeur: Formulaire[K]) => setFormulaire((courant) => ({ ...courant, [cle]: valeur }));
  const comptesCollectifs = comptes.filter((compte) => compte.collectif && (compte.type_tiers === formulaire.type || (formulaire.type === 'autre' && compte.type_tiers === 'autre')));
  const changerType = (type: TiersType['type']) => { maj('type', type); maj('compte_collectif_id', null); };

  function envoyer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = formulaire.code.trim().toUpperCase();
    const raisonSociale = formulaire.raison_sociale.trim();
    if (!code || !/^[A-Z0-9_-]{2,20}$/.test(code)) { setErreurValidation('Le code doit contenir 2 à 20 lettres, chiffres, tirets ou soulignés.'); return; }
    if (!raisonSociale) { setErreurValidation('La raison sociale est obligatoire.'); return; }
    if (formulaire.email && !/^\S+@\S+\.\S+$/.test(formulaire.email)) { setErreurValidation('L’adresse e-mail n’est pas valide.'); return; }
    setErreurValidation(null);
    soumettre({
      ...formulaire, code, raison_sociale: raisonSociale,
      mf: nul(formulaire.mf ?? ''), rc: nul(formulaire.rc ?? ''), adresse: nul(formulaire.adresse ?? ''), ville: nul(formulaire.ville ?? ''), pays: nul(formulaire.pays ?? ''), contact: nul(formulaire.contact ?? ''), telephone: nul(formulaire.telephone ?? ''), email: nul(formulaire.email ?? ''), rib: nul(formulaire.rib ?? ''), banque: nul(formulaire.banque ?? ''), devise: nul(formulaire.devise ?? ''), mode_reglement: nul(formulaire.mode_reglement ?? ''), notes: nul(formulaire.notes ?? ''),
      delai_paiement: formulaire.delai_paiement === '' ? null : Number(formulaire.delai_paiement), plafond_credit: formulaire.plafond_credit === '' ? null : Number(formulaire.plafond_credit),
    });
  }

  return <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-neutral-950/35 p-4 sm:items-center" role="presentation"><form onSubmit={envoyer} className="my-auto w-full max-w-3xl rounded-xl bg-white p-5 shadow-xl dark:bg-neutral-900" aria-label={tiers ? 'Modifier le tiers' : 'Créer un tiers'}><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold">{tiers ? 'Modifier le tiers' : 'Nouveau tiers'}</h2><p className="mt-1 text-sm text-neutral-500">Identité, coordonnées et paramètres de règlement.</p></div><button type="button" onClick={annuler} className="rounded px-2 py-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">Fermer</button></div>
    {(erreurValidation || erreur) && <Erreur>{erreurValidation ?? erreur!}</Erreur>}
    <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-neutral-500">Identification</p><div className="mt-3 grid gap-4 sm:grid-cols-2"><Champ label="Code"><input value={formulaire.code} onChange={(e) => maj('code', e.target.value)} className="champ font-mono" placeholder="CL002" required /></Champ><Champ label="Type"><select value={formulaire.type} onChange={(e) => changerType(e.target.value as TiersType['type'])} className="champ">{types.map((type) => <option key={type} value={type}>{libellesTypes[type]}</option>)}</select></Champ><Champ label="Raison sociale" large><input value={formulaire.raison_sociale} onChange={(e) => maj('raison_sociale', e.target.value)} className="champ" placeholder="Nom du tiers" required /></Champ><Champ label="Compte collectif"><select value={formulaire.compte_collectif_id ?? ''} onChange={(e) => maj('compte_collectif_id', e.target.value || null)} className="champ"><option value="">Aucun compte collectif</option>{comptesCollectifs.map((compte) => <option key={compte.id} value={compte.id}>{compte.numero} — {compte.libelle}</option>)}</select></Champ><Champ label="Matricule fiscal"><input value={formulaire.mf ?? ''} onChange={(e) => maj('mf', e.target.value)} className="champ font-mono" /></Champ><Champ label="Registre de commerce"><input value={formulaire.rc ?? ''} onChange={(e) => maj('rc', e.target.value)} className="champ" /></Champ></div>
    <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-neutral-500">Coordonnées</p><div className="mt-3 grid gap-4 sm:grid-cols-2"><Champ label="Contact"><input value={formulaire.contact ?? ''} onChange={(e) => maj('contact', e.target.value)} className="champ" /></Champ><Champ label="Téléphone"><input value={formulaire.telephone ?? ''} onChange={(e) => maj('telephone', e.target.value)} className="champ" /></Champ><Champ label="E-mail"><input value={formulaire.email ?? ''} onChange={(e) => maj('email', e.target.value)} className="champ" type="email" /></Champ><Champ label="Ville"><input value={formulaire.ville ?? ''} onChange={(e) => maj('ville', e.target.value)} className="champ" /></Champ><Champ label="Adresse" large><input value={formulaire.adresse ?? ''} onChange={(e) => maj('adresse', e.target.value)} className="champ" /></Champ></div>
    <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-neutral-500">Règlement et statut</p><div className="mt-3 grid gap-4 sm:grid-cols-2"><Champ label="Mode de règlement"><input value={formulaire.mode_reglement ?? ''} onChange={(e) => maj('mode_reglement', e.target.value)} className="champ" placeholder="Virement, chèque…" /></Champ><Champ label="Délai de paiement (jours)"><input value={formulaire.delai_paiement} onChange={(e) => maj('delai_paiement', e.target.value.replace(/\D/g, ''))} className="champ" inputMode="numeric" /></Champ><Champ label="RIB"><input value={formulaire.rib ?? ''} onChange={(e) => maj('rib', e.target.value)} className="champ font-mono" /></Champ><Champ label="Banque"><input value={formulaire.banque ?? ''} onChange={(e) => maj('banque', e.target.value)} className="champ" /></Champ><Champ label="Statut"><select value={formulaire.statut} onChange={(e) => maj('statut', e.target.value as TiersType['statut'])} className="champ"><option value="actif">Actif</option><option value="bloque">Bloqué</option><option value="inactif">Inactif</option></select></Champ><Champ label="Plafond de crédit (TND)"><input value={formulaire.plafond_credit} onChange={(e) => maj('plafond_credit', e.target.value.replace(',', '.').replace(/[^0-9.]/g, ''))} className="champ tabular" inputMode="decimal" /></Champ></div>
    <div className="mt-5 grid gap-3 rounded-lg bg-neutral-50 p-4 text-sm dark:bg-neutral-950/50 sm:grid-cols-2"><Case label="Lettrage automatique" coche={formulaire.lettrage_auto} changer={(value) => maj('lettrage_auto', value)} /><Case label="Gestion des échéances" coche={formulaire.gestion_echeances} changer={(value) => maj('gestion_echeances', value)} /></div>
    <Champ label="Notes"><textarea value={formulaire.notes ?? ''} onChange={(e) => maj('notes', e.target.value)} className="champ mt-1 min-h-20 resize-y" /></Champ><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={annuler} disabled={enCours} className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800">Annuler</button><button type="submit" disabled={enCours} className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{enCours ? 'Enregistrement…' : 'Enregistrer'}</button></div>
  </form></div>;
}

function Champ({ label, children, large = false }: { label: string; children: React.ReactNode; large?: boolean }) { return <label className={large ? 'sm:col-span-2' : ''}><span className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>{children}</label>; }
function Case({ label, coche, changer }: { label: string; coche: boolean; changer: (valeur: boolean) => void }) { return <label className="flex min-h-10 cursor-pointer items-center gap-2"><input type="checkbox" checked={coche} onChange={(e) => changer(e.target.checked)} className="size-4 accent-emerald-700" /><span>{label}</span></label>; }
function Badge({ children }: { children: string }) { return <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">{children}</span>; }
function Statut({ valeur }: { valeur: TiersType['statut'] }) { const ton = valeur === 'actif' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : valeur === 'bloque' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'; return <span className={`rounded px-1.5 py-0.5 text-xs ${ton}`}>{valeur}</span>; }
function Erreur({ children }: { children: string }) { return <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300">{children}</p>; }
