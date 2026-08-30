import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { depot } from '@/data';
import type { Compte, DemandeEnregistrement, ResultatEnregistrement, Tiers } from '@/data/depot';
import { messageErreur } from '@/data/depot';
import { useDossier } from '@/dossier/DossierProvider';

type LigneFormulaire = {
  id: number;
  compte_id: string;
  tiers_id: string;
  libelle: string;
  debit: string;
  credit: string;
  reference: string;
  numero_facture: string;
  date_echeance: string;
};

let prochainId = 1;
const nouvelleLigne = (): LigneFormulaire => ({
  id: prochainId++, compte_id: '', tiers_id: '', libelle: '', debit: '', credit: '',
  reference: '', numero_facture: '', date_echeance: '',
});
const lireMontant = (valeur: string) => Number(valeur.replace(',', '.')) || 0;
const tnd = new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

export default function Saisie() {
  const { dossier, exercice, chargement } = useDossier();
  const queryClient = useQueryClient();
  const [journalId, setJournalId] = useState('');
  const [datePiece, setDatePiece] = useState('');
  const [libelle, setLibelle] = useState('');
  const [lignes, setLignes] = useState<LigneFormulaire[]>(() => [nouvelleLigne(), nouvelleLigne()]);
  const [pieceId, setPieceId] = useState<string | null>(null);
  const [resultat, setResultat] = useState<ResultatEnregistrement | null>(null);
  const [erreurValidation, setErreurValidation] = useState<string | null>(null);

  const { data: journaux = [] } = useQuery({
    queryKey: ['journaux', dossier?.id], enabled: Boolean(dossier), queryFn: () => depot.listerJournaux(dossier!.id),
  });
  const { data: comptes = [] } = useQuery({
    queryKey: ['comptes', dossier?.id], enabled: Boolean(dossier), queryFn: () => depot.listerComptes(dossier!.id),
  });
  const { data: tiers = [] } = useQuery({
    queryKey: ['tiers', dossier?.id], enabled: Boolean(dossier), queryFn: () => depot.listerTiers(dossier!.id),
  });

  const totaux = useMemo(() => {
    const debit = lignes.reduce((total, ligne) => total + lireMontant(ligne.debit), 0);
    const credit = lignes.reduce((total, ligne) => total + lireMontant(ligne.credit), 0);
    return { debit, credit, ecart: debit - credit, equilibree: Math.abs(debit - credit) < 0.001 };
  }, [lignes]);

  const enregistrer = useMutation({
    mutationFn: (demande: DemandeEnregistrement) => depot.enregistrerPiece(demande),
    onSuccess: (reponse) => {
      setResultat(reponse);
      setPieceId(reponse.statut === 'brouillon' ? reponse.piece_id : null);
      void queryClient.invalidateQueries({ queryKey: ['balance', exercice?.id] });
      void queryClient.invalidateQueries({ queryKey: ['resultat', exercice?.id] });
      void queryClient.invalidateQueries({ queryKey: ['comptes', dossier?.id] });
    },
  });

  const modifierLigne = <K extends keyof LigneFormulaire>(id: number, cle: K, valeur: LigneFormulaire[K]) => {
    setLignes((courantes) => courantes.map((ligne) => {
      if (ligne.id !== id) return ligne;
      if (cle === 'compte_id') return { ...ligne, compte_id: valeur as string, tiers_id: '' };
      if (cle === 'debit') return { ...ligne, debit: valeur as string, credit: lireMontant(valeur as string) > 0 ? '' : ligne.credit };
      if (cle === 'credit') return { ...ligne, credit: valeur as string, debit: lireMontant(valeur as string) > 0 ? '' : ligne.debit };
      return { ...ligne, [cle]: valeur };
    }));
  };

  const nouvellePiece = () => {
    setJournalId(''); setDatePiece(''); setLibelle(''); setLignes([nouvelleLigne(), nouvelleLigne()]);
    setPieceId(null); setResultat(null); setErreurValidation(null); enregistrer.reset();
  };

  function valider(statut: 'brouillon' | 'revise') {
    if (!dossier || !exercice) return;
    const date = datePiece || exercice.date_debut;
    if (!journalId) { setErreurValidation('Sélectionnez un journal comptable.'); return; }
    if (!libelle.trim()) { setErreurValidation('Le libellé de la pièce est obligatoire.'); return; }
    if (date < exercice.date_debut || date > exercice.date_fin) { setErreurValidation(`La date doit être comprise dans l’exercice ${exercice.annee}.`); return; }
    if (lignes.length < 2) { setErreurValidation('Une pièce comptable doit contenir au moins deux lignes.'); return; }
    for (const [index, ligne] of lignes.entries()) {
      const compte = comptes.find((item) => item.id === ligne.compte_id);
      const debit = lireMontant(ligne.debit);
      const credit = lireMontant(ligne.credit);
      if (!compte) { setErreurValidation(`Ligne ${index + 1} : sélectionnez un compte.`); return; }
      if (compte.bloque) { setErreurValidation(`Ligne ${index + 1} : le compte ${compte.numero} est bloqué.`); return; }
      if ((debit <= 0 && credit <= 0) || (debit > 0 && credit > 0)) { setErreurValidation(`Ligne ${index + 1} : renseignez un montant au débit ou au crédit.`); return; }
      if (compte.collectif && !ligne.tiers_id) { setErreurValidation(`Ligne ${index + 1} : le compte ${compte.numero} exige un tiers.`); return; }
    }
    if (statut === 'revise' && !totaux.equilibree) { setErreurValidation(`La pièce doit être équilibrée pour être révisée (écart : ${tnd.format(totaux.ecart)} TND).`); return; }

    setErreurValidation(null); setResultat(null);
    enregistrer.mutate({
      piece_id: pieceId, dossier_id: dossier.id, exercice_id: exercice.id, journal_id: journalId,
      date_piece: date, libelle: libelle.trim(), statut,
      lignes: lignes.map((ligne) => ({
        compte_id: ligne.compte_id, tiers_id: ligne.tiers_id || null,
        libelle: ligne.libelle.trim() || libelle.trim(), debit: lireMontant(ligne.debit), credit: lireMontant(ligne.credit),
        reference: ligne.reference.trim() || null, numero_facture: ligne.numero_facture.trim() || null,
        date_echeance: ligne.date_echeance || null,
      })),
    });
  }

  if (chargement) return <p className="text-sm text-neutral-500">Chargement de la saisie…</p>;
  if (!dossier || !exercice) return <p className="text-sm text-neutral-500">Sélectionnez un dossier et un exercice avant de saisir une pièce.</p>;
  const estRevisee = resultat?.statut === 'revise';

  return <div className="space-y-6">
    <section className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">Comptabilité</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">Saisie comptable</h1><p className="mt-1 text-sm text-neutral-500">Pièce manuelle · exercice {exercice.annee} · tous les contrôles sont appliqués à l’enregistrement.</p></div><button type="button" onClick={nouvellePiece} className="rounded-md border border-neutral-300 px-3.5 py-2 text-sm font-semibold hover:bg-white dark:border-neutral-700 dark:hover:bg-neutral-900">Nouvelle pièce</button></section>

    <section className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 md:grid-cols-4"><Champ label="Journal"><select value={journalId} onChange={(e) => setJournalId(e.target.value)} disabled={estRevisee} className="champ"><option value="">Choisir…</option>{journaux.map((journal) => <option key={journal.id} value={journal.id}>{journal.code} — {journal.nom}</option>)}</select></Champ><Champ label="Date comptable"><input type="date" value={datePiece || exercice.date_debut} min={exercice.date_debut} max={exercice.date_fin} disabled={estRevisee} onChange={(e) => setDatePiece(e.target.value)} className="champ tabular" /></Champ><Champ label="Libellé" large><input value={libelle} disabled={estRevisee} onChange={(e) => setLibelle(e.target.value)} className="champ" placeholder="Ex. Facture fournisseur n° 2026-001" /></Champ></section>

    {(erreurValidation || enregistrer.error) && <Alerte>{erreurValidation ?? messageErreur(enregistrer.error!)}</Alerte>}
    {resultat && <RetourEnregistrement resultat={resultat} />}

    <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800"><div><h2 className="font-semibold">Lignes d’écriture</h2><p className="mt-0.5 text-xs text-neutral-500">Un compte collectif requiert le tiers associé.</p></div><button type="button" disabled={estRevisee} onClick={() => setLignes((courantes) => [...courantes, nouvelleLigne()])} className="rounded border border-emerald-700 px-2.5 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-950">Ajouter une ligne</button></div><div className="overflow-x-auto"><table className="w-full min-w-[1120px] border-collapse text-sm"><thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-950/50"><tr><th className="px-3 py-3 font-medium">Compte</th><th className="px-3 py-3 font-medium">Tiers</th><th className="px-3 py-3 font-medium">Libellé ligne</th><th className="px-3 py-3 font-medium">Référence</th><th className="px-3 py-3 text-right font-medium">Débit</th><th className="px-3 py-3 text-right font-medium">Crédit</th><th className="w-12 px-3 py-3"><span className="sr-only">Supprimer</span></th></tr></thead><tbody>{lignes.map((ligne, index) => <Ligne key={ligne.id} ligne={ligne} index={index} comptes={comptes} tiers={tiers} estRevisee={estRevisee} modifier={modifierLigne} supprimer={() => setLignes((courantes) => courantes.length > 2 ? courantes.filter((item) => item.id !== ligne.id) : courantes)} />)}</tbody></table></div><footer className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 bg-neutral-50 px-4 py-4 dark:border-neutral-800 dark:bg-neutral-950/30"><div className="flex flex-wrap gap-x-6 gap-y-1 text-sm"><Total libelle="Total débit" valeur={totaux.debit} /><Total libelle="Total crédit" valeur={totaux.credit} /><span className={totaux.equilibree ? 'font-medium text-emerald-700 dark:text-emerald-400' : 'font-medium text-red-700 dark:text-red-400'}>{totaux.equilibree ? 'Pièce équilibrée' : `Écart : ${tnd.format(totaux.ecart)} TND`}</span></div><div className="flex gap-2"><button type="button" disabled={enregistrer.isPending || estRevisee} onClick={() => valider('brouillon')} className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-white disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900">Enregistrer brouillon</button><button type="button" disabled={enregistrer.isPending || estRevisee || !totaux.equilibree} onClick={() => valider('revise')} className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">{enregistrer.isPending ? 'Enregistrement…' : 'Réviser la pièce'}</button></div></footer></section>
  </div>;
}

function Ligne({ ligne, index, comptes, tiers, estRevisee, modifier, supprimer }: { ligne: LigneFormulaire; index: number; comptes: Compte[]; tiers: Tiers[]; estRevisee: boolean; modifier: <K extends keyof LigneFormulaire>(id: number, cle: K, valeur: LigneFormulaire[K]) => void; supprimer: () => void }) {
  const compte = comptes.find((item) => item.id === ligne.compte_id);
  const tiersEligibles = compte?.collectif ? tiers.filter((item) => item.statut === 'actif' && item.compte_collectif_id === compte.id) : [];
  return <tr className="border-t border-neutral-200 dark:border-neutral-800"><td className="px-3 py-2"><select value={ligne.compte_id} disabled={estRevisee} onChange={(e) => modifier(ligne.id, 'compte_id', e.target.value)} className="champ min-w-64"><option value="">{index + 1}. Sélectionner un compte…</option>{comptes.map((item) => <option key={item.id} value={item.id} disabled={item.bloque}>{item.numero} — {item.libelle}{item.bloque ? ' (bloqué)' : ''}</option>)}</select></td><td className="px-3 py-2">{compte?.collectif ? <select value={ligne.tiers_id} disabled={estRevisee} onChange={(e) => modifier(ligne.id, 'tiers_id', e.target.value)} className="champ min-w-48"><option value="">Tiers obligatoire…</option>{tiersEligibles.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.raison_sociale}</option>)}</select> : <span className="text-xs text-neutral-400">—</span>}</td><td className="px-3 py-2"><input value={ligne.libelle} disabled={estRevisee} onChange={(e) => modifier(ligne.id, 'libelle', e.target.value)} className="champ min-w-44" placeholder="Libellé" /></td><td className="px-3 py-2"><input value={ligne.reference} disabled={estRevisee} onChange={(e) => modifier(ligne.id, 'reference', e.target.value)} className="champ w-32 font-mono" placeholder="Réf." /></td><td className="px-3 py-2"><input type="number" min="0" step="0.001" value={ligne.debit} disabled={estRevisee || lireMontant(ligne.credit) > 0} onChange={(e) => modifier(ligne.id, 'debit', e.target.value)} className="champ w-28 text-right font-mono tabular" placeholder="0.000" /></td><td className="px-3 py-2"><input type="number" min="0" step="0.001" value={ligne.credit} disabled={estRevisee || lireMontant(ligne.debit) > 0} onChange={(e) => modifier(ligne.id, 'credit', e.target.value)} className="champ w-28 text-right font-mono tabular" placeholder="0.000" /></td><td className="px-3 py-2 text-center"><button type="button" onClick={supprimer} disabled={estRevisee || index < 2} className="rounded px-2 py-1 text-neutral-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-30 dark:hover:bg-red-950">×</button></td></tr>;
}

function RetourEnregistrement({ resultat }: { resultat: ResultatEnregistrement }) { const estBrouillon = resultat.statut === 'brouillon'; return <div className={`rounded-lg border p-4 ${estBrouillon ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200' : 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'}`}><p className="font-semibold">Pièce n° {resultat.numero} {estBrouillon ? 'enregistrée comme brouillon' : 'révisée avec succès'}.</p>{resultat.violations.length > 0 ? <ul className="mt-2 list-inside list-disc text-sm">{resultat.violations.map((violation) => <li key={`${violation.code}-${violation.ecriture_id ?? ''}`}>{violation.code} : {violation.message}</li>)}</ul> : <p className="mt-1 text-sm">Aucune anomalie détectée.</p>}</div>; }
function Champ({ label, children, large = false }: { label: string; children: React.ReactNode; large?: boolean }) { return <label className={large ? 'md:col-span-2' : ''}><span className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>{children}</label>; }
function Total({ libelle, valeur }: { libelle: string; valeur: number }) { return <span className="text-neutral-600 dark:text-neutral-300">{libelle} : <strong className="font-mono tabular text-neutral-950 dark:text-white">{tnd.format(valeur)} TND</strong></span>; }
function Alerte({ children }: { children: string }) { return <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300">{children}</p>; }
