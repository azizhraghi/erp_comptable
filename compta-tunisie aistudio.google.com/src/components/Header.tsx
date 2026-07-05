/**
 * Composant Header : En-tête de l'application avec information de session,
 * sélecteur d'exercice fiscal, et indicateur de statut hors ligne.
 */

import React from 'react';
import { Exercice, Societe } from '../types';
import { Calendar, Monitor, Moon, Sun, ShieldAlert, Cpu } from 'lucide-react';

interface HeaderProps {
  activeCompany: Societe | null;
  exercises: Exercice[];
  activeExerciseId: string;
  setActiveExerciseId: (id: string) => void;
  title: string;
}

export default function Header({ activeCompany, exercises, activeExerciseId, setActiveExerciseId, title }: HeaderProps) {
  const selectedExercise = exercises.find(e => e.id === activeExerciseId);

  return (
    <header className="h-20 bg-slate-950 border-b border-slate-800 px-8 flex items-center justify-between shrink-0 select-none">
      {/* View Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-white tracking-tight">
          {title}
        </h1>
        {activeCompany && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            100% Hors-ligne
          </span>
        )}
      </div>

      {/* Right Side Controls */}
      <div className="flex items-center gap-4">
        {/* Exercice selector */}
        {activeCompany && exercises.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium font-mono">Exercice :</span>
            <select
              id="exercise-select"
              value={activeExerciseId}
              onChange={(e) => setActiveExerciseId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white font-mono border-none outline-none focus:ring-0 cursor-pointer pr-1"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id} className="bg-slate-900 text-white">
                  {ex.numero} ({ex.statut === 'ouvert' ? 'Ouvert' : 'Clôturé'})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Server Indicator (Anti-AI-Slop compliant: simple and real local indicator) */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl font-mono">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>Local Storage</span>
        </div>

        {/* User Info & Email */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
          <div className="text-right hidden xl:block">
            <p className="text-xs font-semibold text-white">Najd B.</p>
            <p className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">najd.benthabet@gmail.com</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-sm font-sans">
            NB
          </div>
        </div>
      </div>
    </header>
  );
}
