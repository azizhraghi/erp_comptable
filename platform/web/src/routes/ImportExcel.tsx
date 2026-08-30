import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { depot } from '@/data';
import type { Compte, Journal, Tiers } from '@/data/depot';
import { messageErreur } from '@/data/depot';
import { useDossier } from '@/dossier/DossierProvider';

type LigneImport = {
  ligne: number; date: string; journal: string; piece: string; compte: string; tiers: string;
  debit: string; credit: string; libelle: string; reference: string; facture: string; echeance: string;
  erreurs: string[];
};
type Groupe = { cle: string; piece: string; lignes: LigneImport[]; erreurs: string[] };
type ResultatImport = { reussies: string[]; erreurs: { piece: string; message: string }[] };

const colonnes = ['Date', 'Journal', 'Pièce', 'Compte', 'Tiers', 'Débit', 'Crédit', 'Libellé', 'Référence', 'Facture', 'Échéance'];
const tnd = new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

function simplifier(valeur: unknown) { return String(valeur ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
function texte(valeur: unknown) { return String(valeur ?? '').trim(); }
function montant(valeur: string) {
  const brut = valeur.replace(/\s/g, '');
  if (!brut) return 0;
  const normalise = brut.includes(',') && brut.includes('.')
    ? (brut.lastIndexOf(',') > brut.lastIndexOf('.') ? brut.replace(/\./g, '').replace(',', '.') : brut.replace(/,/g, ''))
    : brut.replace(',', '.');
  return Number(normalise) || 0;
}
function dateIso(valeur: string) {
  const v = valeur.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const fr = v.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
  return fr ? `${fr[3]}-${fr[2]!.padStart(2, '0')}-${fr[1]!.padStart(2, '0')}` : v;
}
function indexColonnes(entetes: unknown[]) {
  const aliases: Record<string, string[]> = {
    date: ['date', 'datepiece', 'datecomptable'], journal: ['journal', 'codejournal'], piece: ['piece', 'numeropiece', 'numpiece', 'numerodepiece'], compte: ['compte', 'numerocompte', 'ncompte'], tiers: ['tiers', 'codetiers'], debit: ['debit', 'montantdebit'], credit: ['credit', 'montantcredit'], libelle: ['libelle', 'description'], reference: ['reference', 'ref'], facture: ['facture', 'numerofacture', 'nfacture'], echeance: ['echeance', 'dateecheance'],
  };
  const resultat: Record<string, number> = {};
  for (const [champ, noms] of Object.entries(aliases)) {
    const index = entetes.findIndex((entete) => noms.includes(simplifier(entete)));
    if (index >= 0) resultat[champ] = index;
  }
  return resultat;
}
function valeur(ligne: unknown[], indexes: Record<string, number>, champ: string) { const index = indexes[champ]; return index === undefined ? '' : texte(ligne[index]); }

export default function ImportExcel() {
  const { dossier, exercice, chargement } = useDossier();
  const queryClient = useQueryClient();
  const [nomFichier, setNomFichier] = useState('');
  const [lignes, setLignes] = useState<LigneImport[]>([]);
  const [erreurLecture, setErreurLecture] = useState<string | null>(null);
  const [resultat, setResultat] = useState<ResultatImport | null>(null);

  const { data: journaux = [] } = useQuery({ queryKey: ['journaux', dossier?.id], enabled: Boolean(dossier), queryFn: () => depot.listerJournaux(dossier!.id) });
  const { data: comptes = [] } = useQuery({ queryKey: ['comptes', dossier?.id], enabled: Boolean(dossier), queryFn: () => depot.listerComptes(dossier!.id) });
  const { data: tiers = [] } = useQuery({ queryKey: ['tiers', dossier?.id], enabled: Boolean(dossier), queryFn: () => depot.listerTiers(dossier!.id) });

  const groupes = useMemo(() => analyserGroupes(lignes, journaux, comptes, tiers, exercice?.date_debut, exercice?.date_fin), [lignes, journaux, comptes, tiers, exercice]);
  const groupesValides = groupes.filter((groupe) => groupe.erreurs.length === 0 && groupe.lignes.every((ligne) => ligne.erreurs.length === 0));
  const lignesEnErreur = lignes.filter((ligne) => ligne.erreurs.length > 0).length;

  const importer = useMutation({
    mutationFn: async () => {
      if (!dossier || !exercice) throw new Error('Dossier ou exercice absent.');
      const reussies: string[] = []; const erreurs: { piece: string; message: string }[] = [];
      for (const groupe of groupesValides) {
        try {
          const premiere = groupe.lignes[0]!;
          const journal = journaux.find((item) => item.code.toUpperCase() === premiere.journal.toUpperCase())!;
          await depot.enregistrerPiece({
            dossier_id: dossier.id, exercice_id: exercice.id, journal_id: journal.id, date_piece: premiere.date,
            libelle: premiere.libelle || `Import ${groupe.piece}`, statut: 'brouillon',
            lignes: groupe.lignes.map((ligne) => ({
              compte_id: comptes.find((item) => item.numero === ligne.compte)!.id,
              tiers_id: ligne.tiers ? tiers.find((item) => item.code.toUpperCase() === ligne.tiers.toUpperCase())?.id ?? null : null,
              libelle: ligne.libelle || `Import ${groupe.piece}`, debit: montant(ligne.debit), credit: montant(ligne.credit),
              reference: ligne.reference || null, numero_facture: ligne.facture || null, date_echeance: ligne.echeance || null,
            })),
          });
          reussies.push(groupe.piece);
        } catch (error) { erreurs.push({ piece: groupe.piece, message: messageErreur(error) }); }
      }
      return { reussies, erreurs };
    },
    onSuccess: (reponse) => {
      setResultat(reponse);
      void queryClient.invalidateQueries({ queryKey: ['balance', exercice?.id] });
      void queryClient.invalidateQueries({ queryKey: ['resultat', exercice?.id] });
    },
  });

  async function choisirFichier(event: React.ChangeEvent<HTMLInputElement>) {
    const fichier = event.target.files?.[0];
    if (!fichier) return;
    setErreurLecture(null); setResultat(null); setNomFichier(fichier.name);
    if (fichier.size > 10 * 1024 * 1024) { setLignes([]); setErreurLecture('Le fichier dépasse la limite de 10 Mo.'); return; }
    try {
      const classeur = XLSX.read(await fichier.arrayBuffer(), { type: 'array', cellDates: false, raw: false, dateNF: 'yyyy-mm-dd' });
      const feuille = classeur.Sheets[classeur.SheetNames[0] ?? ''];
      if (!feuille) throw new Error('Aucune feuille lisible dans ce fichier.');
      const donnees = XLSX.utils.sheet_to_json<unknown[]>(feuille, { header: 1, defval: '', raw: false, dateNF: 'yyyy-mm-dd' });
      if (donnees.length < 2) throw new Error('Le fichier doit contenir une ligne d’en-têtes et au moins une écriture.');
      const indexes = indexColonnes(donnees[0]!);
      const manquantes = ['date', 'journal', 'piece', 'compte', 'debit', 'credit'].filter((champ) => indexes[champ] === undefined);
      if (manquantes.length) throw new Error(`Colonnes obligatoires introuvables : ${manquantes.join(', ')}.`);
      setLignes(donnees.slice(1).filter((ligne) => ligne.some((cellule) => texte(cellule))).map((ligne, index) => ({
        ligne: index + 2, date: dateIso(valeur(ligne, indexes, 'date')), journal: valeur(ligne, indexes, 'journal').toUpperCase(), piece: valeur(ligne, indexes, 'piece'), compte: valeur(ligne, indexes, 'compte'), tiers: valeur(ligne, indexes, 'tiers'), debit: valeur(ligne, indexes, 'debit'), credit: valeur(ligne, indexes, 'credit'), libelle: valeur(ligne, indexes, 'libelle'), reference: valeur(ligne, indexes, 'reference'), facture: valeur(ligne, indexes, 'facture'), echeance: dateIso(valeur(ligne, indexes, 'echeance')), erreurs: [],
      })));
    } catch (error) { setLignes([]); setErreurLecture(messageErreur(error)); }
    event.target.value = '';
  }

  function telechargerModele() {
    const feuille = XLSX.utils.aoa_to_sheet([colonnes, ['2026-01-15', 'AC', 'FAC-001', '601000', '', '100.000', '', 'Achat de fournitures', 'FAC-001', 'FAC-001', ''], ['2026-01-15', 'AC', 'FAC-001', '532000', '', '', '100.000', 'Règlement banque', 'FAC-001', '', '']]);
    feuille['!cols'] = [12, 10, 14, 12, 12, 12, 12, 32, 16, 16, 14].map((wch) => ({ wch }));
    const classeur = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(classeur, feuille, 'Écritures'); XLSX.writeFileXLSX(classeur, 'modele-import-comptaexpert.xlsx');
  }

  if (chargement) return <p className="text-sm text-neutral-500">Chargement de l’importeur…</p>;
  if (!dossier || !exercice) return <p className="text-sm text-neutral-500">Sélectionnez un dossier et un exercice avant d’importer.</p>;

  return <div className="space-y-6"><section className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">Comptabilité</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">Import Excel / CSV</h1><p className="mt-1 text-sm text-neutral-500">Les fichiers sont analysés localement, prévisualisés puis enregistrés en brouillons seulement.</p></div><button type="button" onClick={telechargerModele} className="rounded-md border border-neutral-300 px-3.5 py-2 text-sm font-semibold hover:bg-white dark:border-neutral-700 dark:hover:bg-neutral-900">Télécharger le modèle</button></section>
    <section className="rounded-lg border border-dashed border-emerald-400 bg-emerald-50/50 p-7 text-center dark:border-emerald-800 dark:bg-emerald-950/20"><label className="inline-flex cursor-pointer flex-col items-center gap-2"><span className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Choisir un fichier Excel ou CSV</span><input className="sr-only" type="file" accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={(event) => void choisirFichier(event)} /><span className="text-sm text-neutral-600 dark:text-neutral-300">.xlsx, .xls ou .csv · 10 Mo maximum · aucune donnée n’est envoyée avant votre validation.</span></label></section>
    {erreurLecture && <Alerte>{erreurLecture}</Alerte>}
    {lignes.length > 0 && <><section className="grid gap-3 sm:grid-cols-4"><Indicateur libelle="Fichier" valeur={nomFichier} /><Indicateur libelle="Lignes lues" valeur={String(lignes.length)} /><Indicateur libelle="Pièces valides" valeur={String(groupesValides.length)} ton={groupesValides.length ? 'vert' : 'ambre'} /><Indicateur libelle="Lignes à corriger" valeur={String(lignesEnErreur + groupes.filter((groupe) => groupe.erreurs.length > 0).length)} ton={lignesEnErreur ? 'rouge' : 'vert'} /></section><section className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800"><div><h2 className="font-semibold">Prévisualisation et contrôles</h2><p className="mt-0.5 text-xs text-neutral-500">Chaque pièce doit être équilibrée et cohérente avec le dossier actif.</p></div><button type="button" disabled={groupesValides.length === 0 || importer.isPending} onClick={() => importer.mutate()} className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">{importer.isPending ? 'Import en cours…' : `Importer ${groupesValides.length} pièce${groupesValides.length > 1 ? 's' : ''} en brouillon`}</button></div><div className="overflow-x-auto"><table className="w-full min-w-[950px] border-collapse text-sm"><thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-950/50"><tr><th className="px-3 py-3">Ligne</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Journal</th><th className="px-3 py-3">Pièce</th><th className="px-3 py-3">Compte</th><th className="px-3 py-3">Tiers</th><th className="px-3 py-3 text-right">Débit</th><th className="px-3 py-3 text-right">Crédit</th><th className="px-3 py-3">Contrôle</th></tr></thead><tbody>{lignes.slice(0, 100).map((ligne) => <tr key={ligne.ligne} className="border-t border-neutral-200 dark:border-neutral-800"><td className="px-3 py-2 font-mono text-neutral-500">{ligne.ligne}</td><td className="px-3 py-2 font-mono">{ligne.date}</td><td className="px-3 py-2 font-mono">{ligne.journal}</td><td className="px-3 py-2 font-mono">{ligne.piece}</td><td className="px-3 py-2 font-mono">{ligne.compte}</td><td className="px-3 py-2">{ligne.tiers || '—'}</td><td className="px-3 py-2 text-right font-mono">{ligne.debit ? tnd.format(montant(ligne.debit)) : '—'}</td><td className="px-3 py-2 text-right font-mono">{ligne.credit ? tnd.format(montant(ligne.credit)) : '—'}</td><td className="px-3 py-2">{ligne.erreurs.length ? <span className="text-xs text-red-700 dark:text-red-300">{ligne.erreurs.join(' · ')}</span> : <span className="text-xs text-emerald-700 dark:text-emerald-300">OK</span>}</td></tr>)}</tbody></table></div>{lignes.length > 100 && <p className="border-t border-neutral-200 px-4 py-3 text-sm text-neutral-500 dark:border-neutral-800">Aperçu limité aux 100 premières lignes ; toutes les lignes sont contrôlées.</p>}</section></>}
    {groupes.filter((groupe) => groupe.erreurs.length > 0).length > 0 && <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"><p className="font-semibold">Pièces à corriger avant import</p><ul className="mt-2 list-inside list-disc">{groupes.filter((groupe) => groupe.erreurs.length > 0).map((groupe) => <li key={groupe.cle}>{groupe.piece} : {groupe.erreurs.join(' · ')}</li>)}</ul></section>}
    {importer.error && <Alerte>{messageErreur(importer.error)}</Alerte>}{resultat && <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"><p className="font-semibold">Import terminé : {resultat.reussies.length} pièce(s) enregistrée(s) comme brouillon.</p>{resultat.erreurs.length > 0 && <ul className="mt-2 list-inside list-disc">{resultat.erreurs.map((erreur) => <li key={erreur.piece}>{erreur.piece} : {erreur.message}</li>)}</ul>}</section>}
  </div>;
}

function analyserGroupes(lignes: LigneImport[], journaux: Journal[], comptes: Compte[], tiers: Tiers[], debut?: string, fin?: string): Groupe[] {
  const groupes = new Map<string, Groupe>();
  for (const ligneSource of lignes) {
    const ligne: LigneImport = { ...ligneSource, erreurs: [] };
    const compte = comptes.find((item) => item.numero === ligne.compte);
    const journal = journaux.find((item) => item.code.toUpperCase() === ligne.journal.toUpperCase());
    const tiersCourant = ligne.tiers ? tiers.find((item) => item.code.toUpperCase() === ligne.tiers.toUpperCase()) : undefined;
    const debit = montant(ligne.debit); const credit = montant(ligne.credit);
    if (!ligne.piece) ligne.erreurs.push('N° pièce absent'); if (!journal) ligne.erreurs.push('Journal inconnu'); if (!compte) ligne.erreurs.push('Compte inconnu'); if (!/^\d{4}-\d{2}-\d{2}$/.test(ligne.date) || (debut && ligne.date < debut) || (fin && ligne.date > fin)) ligne.erreurs.push('Date hors exercice ou invalide'); if ((debit <= 0 && credit <= 0) || (debit > 0 && credit > 0)) ligne.erreurs.push('Débit/crédit invalide'); if (compte?.bloque) ligne.erreurs.push('Compte bloqué'); if (compte?.collectif && !tiersCourant) ligne.erreurs.push('Tiers requis ou inconnu'); if (tiersCourant && compte?.collectif && tiersCourant.compte_collectif_id !== compte.id) ligne.erreurs.push('Tiers non rattaché au compte collectif');
    const cle = `${ligne.piece}::${ligne.date}::${ligne.journal}`;
    const groupe = groupes.get(cle) ?? { cle, piece: ligne.piece || `Ligne ${ligne.ligne}`, lignes: [], erreurs: [] }; groupe.lignes.push(ligne); groupes.set(cle, groupe);
  }
  for (const groupe of groupes.values()) { const debit = groupe.lignes.reduce((total, ligne) => total + montant(ligne.debit), 0); const credit = groupe.lignes.reduce((total, ligne) => total + montant(ligne.credit), 0); if (groupe.lignes.length < 2) groupe.erreurs.push('Une pièce doit avoir au moins deux lignes'); if (Math.abs(debit - credit) >= 0.001) groupe.erreurs.push(`Pièce déséquilibrée (${tnd.format(debit - credit)} TND)`); }
  return [...groupes.values()];
}

function Indicateur({ libelle, valeur, ton = 'neutre' }: { libelle: string; valeur: string; ton?: 'neutre' | 'vert' | 'ambre' | 'rouge' }) { const couleurs = { neutre: 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900', vert: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30', ambre: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30', rouge: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30' }; return <div className={`rounded-lg border p-3 ${couleurs[ton]}`}><p className="text-xs uppercase tracking-wide text-neutral-500">{libelle}</p><p className="mt-1 truncate font-semibold">{valeur}</p></div>; }
function Alerte({ children }: { children: string }) { return <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300">{children}</p>; }
