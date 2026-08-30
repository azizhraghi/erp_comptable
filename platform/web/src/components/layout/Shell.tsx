import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { useDossier } from '@/dossier/DossierProvider';
import { modeLocal } from '@/data';

/**
 * Cadre de l'application : sélecteur de dossier, sélecteur d'exercice,
 * identité du collaborateur. Le sélecteur de dossier est la pièce centrale —
 * tout écran métier travaille dans le contexte qu'il définit.
 */
export default function Shell({ children }: { children: ReactNode }) {
  const { collaborateur, seDeconnecter } = useAuth();
  const { dossiers, dossier, exercices, exercice, choisirDossier, choisirExercice } =
    useDossier();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
          <span className="font-bold text-neutral-900 dark:text-neutral-100">
            ComptaExpert
          </span>

          {modeLocal && (
            <span
              title="Base PostgreSQL locale dans le navigateur. Les données ne quittent pas cette machine, et l'isolation RLS n'est pas exercée."
              className="rounded bg-amber-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-800 dark:bg-amber-950 dark:text-amber-400"
            >
              Base locale
            </span>
          )}

          <label className="flex items-center gap-2 text-sm">
            <span className="text-xs uppercase tracking-wide text-neutral-500">
              Dossier
            </span>
            <select
              value={dossier?.id ?? ''}
              onChange={(e) => choisirDossier(e.target.value)}
              className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            >
              {dossiers.length === 0 && <option value="">Aucun dossier</option>}
              {dossiers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} — {d.raison_sociale}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <span className="text-xs uppercase tracking-wide text-neutral-500">
              Exercice
            </span>
            <select
              value={exercice?.id ?? ''}
              onChange={(e) => choisirExercice(e.target.value)}
              className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm tabular dark:border-neutral-700 dark:bg-neutral-950"
            >
              {exercices.length === 0 && <option value="">—</option>}
              {exercices.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.annee}
                  {ex.statut !== 'ouvert' ? ` (${ex.statut})` : ''}
                </option>
              ))}
            </select>
          </label>

          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">
              {collaborateur
                ? `${collaborateur.prenom ?? ''} ${collaborateur.nom}`.trim()
                : '—'}
              {collaborateur && (
                <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs uppercase tracking-wide text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                  {collaborateur.profil}
                </span>
              )}
            </span>
            <button
              onClick={() => void seDeconnecter()}
              className="rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Quitter
            </button>
          </div>
        </div>
      </header>

      <nav className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900" aria-label="Navigation principale">
        <div className="mx-auto flex max-w-7xl gap-1 px-4">
          <LienNavigation to="/" fin>Accueil</LienNavigation>
          <LienNavigation to="/pce">Plan comptable</LienNavigation>
          <LienNavigation to="/tiers">Tiers</LienNavigation>
          <LienNavigation to="/saisie">Saisie</LienNavigation>
          <LienNavigation to="/import">Import Excel</LienNavigation>
          <LienNavigation to="/editions">Éditions</LienNavigation>
          <LienNavigation to="/ia">Centre IA</LienNavigation>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}

function LienNavigation({ to, children, fin = false }: { to: string; children: ReactNode; fin?: boolean }) {
  return (
    <NavLink
      to={to}
      end={fin}
      className={({ isActive }) => `border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? 'border-emerald-700 text-emerald-800 dark:text-emerald-400'
          : 'border-transparent text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white'
      }`}
    >
      {children}
    </NavLink>
  );
}
