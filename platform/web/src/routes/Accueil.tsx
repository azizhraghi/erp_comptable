import { useQuery } from '@tanstack/react-query';
import { depot, modeLocal } from '@/data';
import { useDossier } from '@/dossier/DossierProvider';

const tnd = new Intl.NumberFormat('fr-TN', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

export default function Accueil() {
  const { dossier, exercice, dossiers, chargement } = useDossier();

  const { data: balance = [] } = useQuery({
    queryKey: ['balance', exercice?.id],
    enabled: Boolean(exercice),
    queryFn: () => depot.balanceGenerale(exercice!.id),
  });

  const { data: resultat = 0 } = useQuery({
    queryKey: ['resultat', exercice?.id],
    enabled: Boolean(exercice),
    queryFn: () => depot.resultatExercice(exercice!.id),
  });

  if (chargement) return <p className="text-sm text-neutral-500">Chargement des dossiers…</p>;

  if (dossiers.length === 0) {
    return (
      <div className="max-w-2xl space-y-3">
        <h1 className="text-lg font-bold">Aucun dossier accessible</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {modeLocal
            ? "La base locale n'a pas pu s'amorcer. Videz le stockage du site et rechargez."
            : "Vous n'êtes affecté à aucun dossier, ou la base n'en contient encore aucun."}
        </p>
      </div>
    );
  }

  const totalDebit = balance.reduce((s, l) => s + Number(l.debit), 0);
  const totalCredit = balance.reduce((s, l) => s + Number(l.credit), 0);
  const ecart = totalDebit - totalCredit;

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
          {dossier?.raison_sociale}
        </h1>
        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <Fait label="Code" valeur={dossier?.code} mono />
          <Fait label="Matricule fiscal" valeur={dossier?.mf ?? '—'} mono />
          <Fait label="Nature" valeur={dossier?.nature} />
          <Fait
            label="Exercice"
            valeur={exercice ? `${exercice.annee} (${exercice.statut})` : '—'}
          />
          <Fait
            label="Résultat"
            valeur={`${tnd.format(Number(resultat))} TND`}
            mono
          />
        </dl>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Balance générale
          </h2>
          <span
            className={`rounded px-2 py-0.5 font-mono text-[11px] ${
              Math.abs(ecart) < 0.001
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400'
            }`}
          >
            {Math.abs(ecart) < 0.001
              ? 'équilibrée'
              : `écart ${tnd.format(ecart)} TND`}
          </span>
        </div>

        {balance.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Aucune écriture sur cet exercice. L'écran de saisie arrive.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-300 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-700">
                  <th className="py-2 pr-4 font-medium">Compte</th>
                  <th className="py-2 pr-4 font-medium">Libellé</th>
                  <th className="py-2 pr-4 text-right font-medium">Débit</th>
                  <th className="py-2 pr-4 text-right font-medium">Crédit</th>
                  <th className="py-2 text-right font-medium">Solde</th>
                </tr>
              </thead>
              <tbody>
                {balance.map((l) => (
                  <tr
                    key={l.compte_id}
                    className="border-b border-neutral-200 dark:border-neutral-800"
                  >
                    <td className="py-1.5 pr-4 font-mono">{l.compte_numero}</td>
                    <td className="py-1.5 pr-4">{l.compte_libelle}</td>
                    <td className="tabular py-1.5 pr-4 text-right">
                      {tnd.format(Number(l.debit))}
                    </td>
                    <td className="tabular py-1.5 pr-4 text-right">
                      {tnd.format(Number(l.credit))}
                    </td>
                    <td className="tabular py-1.5 text-right font-medium">
                      {tnd.format(Number(l.solde))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-neutral-900 font-semibold dark:border-neutral-100">
                  <td className="py-2 pr-4" colSpan={2}>
                    Totaux
                  </td>
                  <td className="tabular py-2 pr-4 text-right">{tnd.format(totalDebit)}</td>
                  <td className="tabular py-2 pr-4 text-right">{tnd.format(totalCredit)}</td>
                  <td className="tabular py-2 text-right">{tnd.format(ecart)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Fait({
  label,
  valeur,
  mono,
}: {
  label: string;
  valeur: string | number | undefined;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className={mono ? 'font-mono tabular' : ''}>{valeur ?? '—'}</dd>
    </div>
  );
}
