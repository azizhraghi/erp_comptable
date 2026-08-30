import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { depot } from '@/data';
import type { Compte, DonneesCompte } from '@/data/depot';
import { messageErreur } from '@/data/depot';
import { useDossier } from '@/dossier/DossierProvider';

type FormulaireCompte = Omit<DonneesCompte, 'type'> & {
  type: '' | NonNullable<Compte['type']>;
};

const typesTiers = ['client', 'fournisseur', 'salarie', 'autre'] as const;

function valeursParDefaut(compte?: Compte): FormulaireCompte {
  return {
    numero: compte?.numero ?? '',
    libelle: compte?.libelle ?? '',
    classe: compte?.classe ?? 4,
    type: compte?.type ?? '',
    nature_solde: compte?.nature_solde ?? 'Debiteur',
    collectif: compte?.collectif ?? false,
    type_tiers: compte?.type_tiers ?? null,
    lettrable: compte?.lettrable ?? false,
    rapprochable: compte?.rapprochable ?? false,
    report_ran: compte?.report_ran ?? 'solde',
    bloque: compte?.bloque ?? false,
  };
}

function classeLibelle(classe: number) {
  return {
    1: 'Capitaux', 2: 'Immobilisations', 3: 'Stocks', 4: 'Tiers',
    5: 'Financiers', 6: 'Charges', 7: 'Produits', 8: 'Spéciaux',
  }[classe] ?? '—';
}

export default function PlanComptable() {
  const { dossier, dossiers, chargement } = useDossier();
  const clientQuery = useQueryClient();
  const [recherche, setRecherche] = useState('');
  const [classe, setClasse] = useState('');
  const [compteEdite, setCompteEdite] = useState<Compte | null | undefined>(undefined);

  const { data: comptes = [], isLoading, error } = useQuery({
    queryKey: ['comptes', dossier?.id],
    enabled: Boolean(dossier),
    queryFn: () => depot.listerComptes(dossier!.id),
  });

  const enregistrer = useMutation({
    mutationFn: async ({ compteId, donnees }: { compteId?: string; donnees: DonneesCompte }) => {
      if (!dossier) throw new Error('Sélectionnez un dossier avant de modifier le plan comptable.');
      return compteId
        ? depot.modifierCompte(compteId, donnees)
        : depot.creerCompte(dossier.id, donnees);
    },
    onSuccess: () => {
      void clientQuery.invalidateQueries({ queryKey: ['comptes', dossier?.id] });
      setCompteEdite(undefined);
    },
  });

  const ouvrirFormulaire = (compte: Compte | null) => {
    enregistrer.reset();
    setCompteEdite(compte);
  };

  const comptesFiltres = useMemo(() => {
    const terme = recherche.trim().toLocaleLowerCase('fr');
    return comptes.filter((compte) => {
      const dansClasse = !classe || compte.classe === Number(classe);
      const dansRecherche = !terme
        || compte.numero.includes(terme)
        || compte.libelle.toLocaleLowerCase('fr').includes(terme);
      return dansClasse && dansRecherche;
    });
  }, [classe, comptes, recherche]);

  if (chargement) return <p className="text-sm text-neutral-500">Chargement du plan comptable…</p>;

  if (!dossier || dossiers.length === 0) {
    return <p className="text-sm text-neutral-500">Aucun dossier accessible pour afficher le plan comptable.</p>;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
            Référentiel
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">
            Plan comptable
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {comptes.length} compte{comptes.length !== 1 ? 's' : ''} actif{comptes.length !== 1 ? 's' : ''} pour {dossier.raison_sociale}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => ouvrirFormulaire(null)}
          className="rounded-md bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 dark:focus:ring-offset-neutral-950"
        >
          Nouveau compte
        </button>
      </section>

      <section className="flex flex-wrap gap-3 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
        <label className="min-w-56 flex-1">
          <span className="sr-only">Rechercher un compte</span>
          <input
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
            placeholder="Rechercher par numéro ou libellé"
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:border-neutral-700 dark:bg-neutral-950 dark:focus:ring-emerald-950"
          />
        </label>
        <label>
          <span className="sr-only">Filtrer par classe</span>
          <select
            value={classe}
            onChange={(event) => setClasse(event.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
          >
            <option value="">Toutes les classes</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((numero) => (
              <option key={numero} value={numero}>Classe {numero} — {classeLibelle(numero)}</option>
            ))}
          </select>
        </label>
      </section>

      {error ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300">
          {messageErreur(error)}
        </p>
      ) : isLoading ? (
        <p className="text-sm text-neutral-500">Chargement des comptes…</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-950/50">
                <tr>
                  <th className="px-4 py-3 font-medium">N° compte</th>
                  <th className="px-4 py-3 font-medium">Libellé</th>
                  <th className="px-4 py-3 font-medium">Classe</th>
                  <th className="px-4 py-3 font-medium">Nature</th>
                  <th className="px-4 py-3 font-medium">Options</th>
                  <th className="w-28 px-4 py-3"><span className="sr-only">Modifier</span></th>
                </tr>
              </thead>
              <tbody>
                {comptesFiltres.map((compte) => (
                  <tr key={compte.id} className="border-t border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50">
                    <td className="px-4 py-3 font-mono font-medium tabular">{compte.numero}</td>
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{compte.libelle}</td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{compte.classe} · {classeLibelle(compte.classe)}</td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {compte.type ?? '—'} · {compte.nature_solde.toLocaleLowerCase('fr')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {compte.collectif && <Badge>{`Collectif ${compte.type_tiers ?? ''}`}</Badge>}
                        {compte.lettrable && <Badge>Lettrable</Badge>}
                        {compte.rapprochable && <Badge>Rapprochable</Badge>}
                        {compte.bloque && <Badge ton="ambre">Bloqué</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => ouvrirFormulaire(compte)}
                        className="rounded px-2 py-1 text-sm font-medium text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
                      >
                        Modifier
                      </button>
                    </td>
                  </tr>
                ))}
                {comptesFiltres.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-neutral-500">
                      Aucun compte ne correspond à ce filtre.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {compteEdite !== undefined && (
        <FormulaireCompte
          compte={compteEdite}
          longueurCompte={dossier.longueur_compte}
          enCours={enregistrer.isPending}
          erreur={enregistrer.error ? messageErreur(enregistrer.error) : null}
          annuler={() => setCompteEdite(undefined)}
          soumettre={(donnees) => enregistrer.mutate({ compteId: compteEdite?.id, donnees })}
        />
      )}
    </div>
  );
}

function Badge({ children, ton = 'neutre' }: { children: string; ton?: 'neutre' | 'ambre' }) {
  return (
    <span className={ton === 'ambre'
      ? 'rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300'
      : 'rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'}>
      {children}
    </span>
  );
}

function FormulaireCompte({
  compte, longueurCompte, enCours, erreur, annuler, soumettre,
}: {
  compte: Compte | null;
  longueurCompte: number;
  enCours: boolean;
  erreur: string | null;
  annuler: () => void;
  soumettre: (donnees: DonneesCompte) => void;
}) {
  const [formulaire, setFormulaire] = useState(() => valeursParDefaut(compte ?? undefined));
  const [erreurValidation, setErreurValidation] = useState<string | null>(null);
  const maj = <K extends keyof FormulaireCompte>(cle: K, valeur: FormulaireCompte[K]) => {
    setFormulaire((courant) => ({ ...courant, [cle]: valeur }));
  };

  function envoyer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numero = formulaire.numero.trim();
    const libelle = formulaire.libelle.trim();
    if (!new RegExp(`^\\d{${longueurCompte}}$`).test(numero)) {
      setErreurValidation(`Le numéro doit contenir exactement ${longueurCompte} chiffres.`);
      return;
    }
    if (Number(numero[0]) !== formulaire.classe) {
      setErreurValidation('La classe doit correspondre au premier chiffre du numéro de compte.');
      return;
    }
    if (!libelle) {
      setErreurValidation('Le libellé est obligatoire.');
      return;
    }
    if (formulaire.collectif && !formulaire.type_tiers) {
      setErreurValidation('Un compte collectif doit indiquer son type de tiers.');
      return;
    }
    setErreurValidation(null);
    soumettre({
      ...formulaire,
      numero,
      libelle,
      type: formulaire.type || null,
      type_tiers: formulaire.collectif ? formulaire.type_tiers : null,
    });
  }

  return (
    <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-neutral-950/35 p-4 sm:items-center" role="presentation">
      <form onSubmit={envoyer} className="my-auto w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl dark:bg-neutral-900" aria-label={compte ? 'Modifier le compte' : 'Créer un compte'}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">{compte ? 'Modifier le compte' : 'Nouveau compte'}</h2>
            <p className="mt-1 text-sm text-neutral-500">Les règles du plan comptable tunisien sont contrôlées avant l’enregistrement.</p>
          </div>
          <button type="button" onClick={annuler} className="rounded px-2 py-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">Fermer</button>
        </div>

        {(erreurValidation || erreur) && <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300">{erreurValidation ?? erreur}</p>}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Champ label={`Numéro (${longueurCompte} chiffres)`}>
            <input value={formulaire.numero} inputMode="numeric" maxLength={longueurCompte} onChange={(e) => maj('numero', e.target.value.replace(/\D/g, ''))} className="champ font-mono" placeholder={'4'.padEnd(longueurCompte, '0')} required />
          </Champ>
          <Champ label="Classe">
            <select value={formulaire.classe} onChange={(e) => maj('classe', Number(e.target.value))} className="champ">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((numero) => <option key={numero} value={numero}>Classe {numero} — {classeLibelle(numero)}</option>)}
            </select>
          </Champ>
          <Champ label="Libellé" large>
            <input value={formulaire.libelle} onChange={(e) => maj('libelle', e.target.value)} className="champ" placeholder="Ex. Fournisseurs locaux" required />
          </Champ>
          <Champ label="Type comptable">
            <select value={formulaire.type} onChange={(e) => maj('type', e.target.value as FormulaireCompte['type'])} className="champ">
              <option value="">Non défini</option>
              {['Actif', 'Passif', 'Charge', 'Produit'].map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </Champ>
          <Champ label="Nature du solde">
            <select value={formulaire.nature_solde} onChange={(e) => maj('nature_solde', e.target.value as Compte['nature_solde'])} className="champ">
              <option value="Debiteur">Débiteur</option><option value="Crediteur">Créditeur</option><option value="Solde">Solde</option>
            </select>
          </Champ>
          <Champ label="Report à nouveau">
            <select value={formulaire.report_ran} onChange={(e) => maj('report_ran', e.target.value as Compte['report_ran'])} className="champ">
              <option value="solde">Solde</option><option value="detail">Détail</option>
            </select>
          </Champ>
        </div>

        <div className="mt-5 grid gap-3 rounded-lg bg-neutral-50 p-4 text-sm dark:bg-neutral-950/50 sm:grid-cols-2">
          <CaseCochee label="Compte collectif (tiers obligatoire)" coche={formulaire.collectif} changer={(value) => maj('collectif', value)} />
          {formulaire.collectif && <Champ label="Type de tiers"><select value={formulaire.type_tiers ?? ''} onChange={(e) => maj('type_tiers', e.target.value || null)} className="champ"><option value="">Choisir…</option>{typesTiers.map((type) => <option key={type} value={type}>{type}</option>)}</select></Champ>}
          <CaseCochee label="Lettrable" coche={formulaire.lettrable} changer={(value) => maj('lettrable', value)} />
          <CaseCochee label="Rapprochable" coche={formulaire.rapprochable} changer={(value) => maj('rapprochable', value)} />
          <CaseCochee label="Bloquer la saisie sur ce compte" coche={formulaire.bloque} changer={(value) => maj('bloque', value)} />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={annuler} disabled={enCours} className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800">Annuler</button>
          <button type="submit" disabled={enCours} className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{enCours ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </form>
    </div>
  );
}

function Champ({ label, children, large = false }: { label: string; children: React.ReactNode; large?: boolean }) {
  return <label className={large ? 'sm:col-span-2' : ''}><span className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>{children}</label>;
}

function CaseCochee({ label, coche, changer }: { label: string; coche: boolean; changer: (value: boolean) => void }) {
  return <label className="flex min-h-10 cursor-pointer items-center gap-2"><input type="checkbox" checked={coche} onChange={(e) => changer(e.target.checked)} className="size-4 accent-emerald-700" /><span>{label}</span></label>;
}
