import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { depot } from '@/data';
import type { AnalyseFinanciere, AnalyseRevision, PieceRevision } from '@/data/depot';
import { messageErreur } from '@/data/depot';
import { useDossier } from '@/dossier/DossierProvider';

export default function CentreIA() {
  const { dossier, exercice, chargement } = useDossier();
  const queryClient = useQueryClient();
  const [pieceSelectionnee, setPieceSelectionnee] = useState<PieceRevision | null>(null);
  const [analyse, setAnalyse] = useState<AnalyseRevision | null>(null);
  const [questionFinanciere, setQuestionFinanciere] = useState('Quels sont les principaux points d’attention sur cet exercice ?');
  const [analyseFinanciere, setAnalyseFinanciere] = useState<AnalyseFinanciere | null>(null);

  const { data: pieces = [], isLoading, error } = useQuery({
    queryKey: ['pieces-revision', exercice?.id], enabled: Boolean(exercice),
    queryFn: () => depot.listerPiecesRevision(exercice!.id),
  });
  const revision = useMutation({
    mutationFn: (piece: PieceRevision) => {
      if (!dossier) throw new Error('Dossier absent.');
      return depot.analyserPieceRevision(dossier.id, piece.id);
    },
    onSuccess: (resultat, piece) => {
      setPieceSelectionnee(piece); setAnalyse(resultat);
      void queryClient.invalidateQueries({ queryKey: ['pieces-revision', exercice?.id] });
    },
  });
  const analyseurFinancier = useMutation({
    mutationFn: () => {
      if (!dossier || !exercice) throw new Error('Dossier ou exercice absent.');
      const question = questionFinanciere.trim();
      if (question.length < 5) throw new Error('Saisissez une question plus précise pour l’agent ANA.');
      return depot.analyserFinancier(dossier.id, exercice.id, question);
    },
    onSuccess: setAnalyseFinanciere,
  });

  if (chargement) return <p className="text-sm text-neutral-500">Chargement du centre IA…</p>;
  if (!dossier || !exercice) return <p className="text-sm text-neutral-500">Sélectionnez un dossier et un exercice avant de lancer un agent.</p>;

  return <div className="space-y-6"><section><p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">Automatisation assistée</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">Centre IA</h1><p className="mt-1 max-w-3xl text-sm text-neutral-500">Les agents ne modifient jamais le grand livre seuls. Chaque exécution est journalisée dans la piste d’audit et toute proposition future devra être validée par un collaborateur.</p></section>
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><CarteAgent code="REV" nom="Agent de révision" etat="actif" description="Applique les contrôles comptables SQL aux pièces, sans les modifier." /><CarteAgent code="ANA" nom="Agent d’analyse" etat="actif" description="Analyse la balance et répond en français, sans modifier la comptabilité." /><CarteAgent code="IMP" nom="Agent d’imputation" etat="à configurer" description="Proposera journal, comptes et TVA à partir des documents validés." /><CarteAgent code="SCR" nom="Agent documents" etat="à configurer" description="Extraira les données de factures et relevés après connexion d’un modèle IA." /></section>
    <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"><p className="font-semibold">Agents actifs et garde-fous</p><p className="mt-1">REV exécute des contrôles déterministes. ANA transmet uniquement votre question, la balance générale et le résultat de l’exercice à Mistral pour produire une analyse consultative. Aucun des deux agents ne crée, ne modifie ou ne valide d’écriture.</p></section>
    <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">Demander une analyse financière</h2><p className="mt-0.5 text-sm text-neutral-500">Agent ANA · Mistral · résultat indicatif à vérifier par un professionnel.</p></div><Etiquette ton="vert">données en lecture seule</Etiquette></div><label className="mt-4 block text-sm font-medium" htmlFor="question-financiere">Votre question</label><textarea id="question-financiere" value={questionFinanciere} onChange={(event) => setQuestionFinanciere(event.target.value)} rows={3} maxLength={1_500} className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-600 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-950" /><p className="mt-2 text-xs text-neutral-500">En lançant l’analyse, ces données de synthèse sont envoyées à Mistral. N’ajoutez pas de données personnelles ou confidentielles inutiles à votre question.</p><button type="button" disabled={analyseurFinancier.isPending} onClick={() => analyseurFinancier.mutate()} className="mt-3 rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{analyseurFinancier.isPending ? 'Analyse en cours…' : 'Lancer l’analyse ANA'}</button></section>
    {revision.error && <Alerte>{messageErreur(revision.error)}</Alerte>}
    {analyseurFinancier.error && <Alerte>{messageErreur(analyseurFinancier.error)}</Alerte>}
    {analyse && pieceSelectionnee && <Resultat piece={pieceSelectionnee} analyse={analyse} />}
    {analyseFinanciere && <ResultatFinancier analyse={analyseFinanciere} />}
    {error ? <Alerte>{messageErreur(error)}</Alerte> : isLoading ? <p className="text-sm text-neutral-500">Chargement des pièces…</p> : <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"><div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800"><h2 className="font-semibold">Pièces à analyser</h2><p className="mt-0.5 text-xs text-neutral-500">Les 50 dernières pièces de l’exercice {exercice.annee}.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-sm"><thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-950/50"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Pièce</th><th className="px-4 py-3">Libellé</th><th className="px-4 py-3">Origine</th><th className="px-4 py-3">Statut</th><th className="w-40 px-4 py-3"><span className="sr-only">Analyser</span></th></tr></thead><tbody>{pieces.map((piece) => <tr key={piece.id} className="border-t border-neutral-200 dark:border-neutral-800"><td className="px-4 py-3 font-mono">{piece.date_piece}</td><td className="px-4 py-3 font-mono font-medium">{piece.numero}</td><td className="px-4 py-3">{piece.libelle ?? '—'}</td><td className="px-4 py-3"><Etiquette>{piece.source}</Etiquette></td><td className="px-4 py-3"><Etiquette ton={piece.statut === 'brouillon' ? 'ambre' : 'vert'}>{piece.statut}</Etiquette></td><td className="px-4 py-3 text-right"><button type="button" disabled={revision.isPending} onClick={() => revision.mutate(piece)} className="rounded-md border border-emerald-700 px-2.5 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-950">{revision.isPending ? 'Analyse…' : 'Analyser'}</button></td></tr>)}{pieces.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-neutral-500">Aucune pièce à analyser. Crée ou importe d’abord une pièce comptable.</td></tr>}</tbody></table></div></section>}
  </div>;
}

function CarteAgent({ code, nom, etat, description }: { code: string; nom: string; etat: 'actif' | 'à configurer'; description: string }) { const actif = etat === 'actif'; return <article className={`rounded-lg border p-4 ${actif ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/25' : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'}`}><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">{code}</p><h2 className="mt-1 font-semibold">{nom}</h2></div><Etiquette ton={actif ? 'vert' : 'neutre'}>{etat}</Etiquette></div><p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{description}</p></article>; }
function Resultat({ piece, analyse }: { piece: PieceRevision; analyse: AnalyseRevision }) { const bloquantes = analyse.violations.filter((v) => v.gravite === 'bloquant'); return <section className={`rounded-lg border p-4 ${bloquantes.length ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40' : 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40'}`}><p className="font-semibold">Agent REV · pièce n° {piece.numero}</p><p className="mt-1 text-sm">Analyse terminée en {analyse.duree_ms} ms · confiance {Math.round(analyse.confiance * 100)} %.</p>{analyse.violations.length === 0 ? <p className="mt-2 text-sm">Aucune anomalie détectée par les contrôles comptables.</p> : <ul className="mt-2 list-inside list-disc text-sm">{analyse.violations.map((violation) => <li key={`${violation.code}-${violation.ecriture_id ?? ''}`}><strong>{violation.code}</strong> · {violation.message}</li>)}</ul>}</section>; }
function ResultatFinancier({ analyse }: { analyse: AnalyseFinanciere }) { return <section className="rounded-lg border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/35"><p className="font-semibold">Agent ANA · analyse financière</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{analyse.reponse}</p>{analyse.observations.length > 0 && <div className="mt-3"><p className="text-sm font-medium">Observations</p><ul className="mt-1 list-inside list-disc text-sm">{analyse.observations.map((observation) => <li key={observation}>{observation}</li>)}</ul></div>}{analyse.points_a_verifier.length > 0 && <div className="mt-3"><p className="text-sm font-medium">Points à vérifier</p><ul className="mt-1 list-inside list-disc text-sm">{analyse.points_a_verifier.map((point) => <li key={point}>{point}</li>)}</ul></div>}<p className="mt-3 text-xs text-neutral-500">Exécution journalisée · {analyse.duree_ms} ms</p></section>; }
function Etiquette({ children, ton = 'neutre' }: { children: string; ton?: 'neutre' | 'vert' | 'ambre' }) { const classes = ton === 'vert' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : ton === 'ambre' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'; return <span className={`rounded px-1.5 py-0.5 text-xs ${classes}`}>{children}</span>; }
function Alerte({ children }: { children: string }) { return <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300">{children}</p>; }
