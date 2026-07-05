/**
 * Composant ExerciceManager : Gestion de l'ouverture/clôture des exercices fiscaux (exercices)
 * et du verrouillage des périodes comptables mensuelles (janvier à décembre).
 */

import React, { useState } from 'react';
import { Exercice, Periode } from '../types';
import { 
  Calendar, Lock, Unlock, ShieldAlert, CheckCircle, 
  Plus, Archive, CheckIcon, AlertTriangle 
} from 'lucide-react';
import { addAuditLog } from '../lib/storage';

interface ExerciceManagerProps {
  exercices: Exercice[];
  periodes: Periode[];
  onSaveExercices: (list: Exercice[]) => void;
  onSavePeriodes: (list: Periode[]) => void;
  activeExerciseId: string;
}

export default function ExerciceManager({ exercices, periodes, onSaveExercices, onSavePeriodes, activeExerciseId }: ExerciceManagerProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newYear, setNewYear] = useState(2027);
  const [isNewFirstYear, setIsNewFirstYear] = useState(false);

  // Filtrer les périodes associées à l'exercice d'ouverture actif
  const currentPeriodes = periodes.filter(p => p.idExercice === activeExerciseId);
  const activeEx = exercices.find(ex => ex.id === activeExerciseId);

  // Basculer le verrouillage d'un mois de l'exercice actif
  const togglePeriodLock = (pId: string) => {
    const backupPeriodes = periodes.map(p => {
      if (p.id === pId) {
        const nextStatut = p.statut === 'ouverte' ? 'verrouillee' as const : 'ouverte' as const;
        addAuditLog('UPDATE', 'Exercices', `Période "${p.libelle}" basculée vers ${nextStatut}`);
        return {
          ...p,
          statut: nextStatut,
          verrouilleePar: nextStatut === 'verrouillee' ? 'NajdB (admin)' : undefined
        };
      }
      return p;
    });

    onSavePeriodes(backupPeriodes);
  };

  // Création d'un nouvel exercice fiscal et de ses périodes afférentes
  const handleCreateYear = (e: React.FormEvent) => {
    e.preventDefault();
    if (exercices.some(ex => ex.numero === newYear)) {
      alert(`L'exercice fiscal ${newYear} figure déjà dans la base.`);
      return;
    }

    const socId = activeExerciseId.split('-')[1] || 'demo';
    const nextExercise: Exercice = {
      id: `ex-${socId}-${newYear}`,
      numero: newYear,
      dateDebut: `${newYear}-01-01`,
      dateFin: `${newYear}-12-31`,
      statut: 'ouvert',
      aNouveauGenere: false,
      resultatExercice: 0,
      premiereAnnee: isNewFirstYear
    };

    const moisLibelles = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const nextPeriodes: Periode[] = moisLibelles.map((mois, index) => {
      const moisNum = index + 1;
      const padMois = moisNum.toString().padStart(2, '0');
      return {
        id: `per-${socId}-${newYear}-${padMois}`,
        idExercice: nextExercise.id,
        numeroMois: moisNum,
        libelle: `${mois} ${newYear}`,
        dateDebut: `${newYear}-${padMois}-01`,
        dateFin: `${newYear}-${padMois}-${new Date(newYear, moisNum, 0).getDate()}`,
        statut: 'ouverte'
      };
    });

    onSaveExercices([...exercices, nextExercise]);
    onSavePeriodes([...periodes, ...nextPeriodes]);
    addAuditLog('CREATE', 'Exercices', `Ouverture de l'exercice fiscal ${newYear} et ses 12 périodes.`);
    setShowAdd(false);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full text-left">
      {/* View Header */}
      <div className="flex justify-between items-center bg-[#181B2E] p-4 rounded-xl border border-white/5">
        <div>
          <h3 className="text-base font-semibold text-white">Exercices Fiscaux et Périodes de Saisie</h3>
          <p className="text-xs text-[#8892B0]">Ouvrez de nouveaux exercices ou protégez vos saisies mensuelles contre toute altération rétroactive.</p>
        </div>
        <button
          id="add-year-btn"
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 rounded-lg bg-[#6C63FF] hover:bg-[#6C63FF]/90 text-xs font-semibold text-white flex items-center gap-2 transition-all font-mono"
        >
          <Plus className="w-3.5 h-3.5" />
          Ouvrir un nouvel exercice (+1an)
        </button>
      </div>

      {/* Year Creator Form */}
      {showAdd && (
        <form onSubmit={handleCreateYear} className="p-5 bg-[#181B2E] border border-white/5 rounded-xl space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Créer un nouvel exercice fiscal</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-1">Millésime Année</label>
              <input
                id="new-year-input"
                type="number"
                value={newYear}
                onChange={(e) => setNewYear(Number(e.target.value))}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white font-mono"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                id="first-year-check"
                type="checkbox"
                checked={isNewFirstYear}
                onChange={(e) => setIsNewFirstYear(e.target.checked)}
                className="rounded text-[#6C63FF] bg-[#13162A] border-white/10"
              />
              <label htmlFor="first-year-check" className="text-xs text-[#8892B0]">
                Première année (RAN non obligatoire)
              </label>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              id="cancel-year-btn"
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#8892B0]"
            >
              Annuler
            </button>
            <button
              id="submit-year-btn"
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#6C63FF] hover:bg-[#6C63FF]/90 text-xs font-semibold text-white"
            >
              Générer Exercice et Périodes
            </button>
          </div>
        </form>
      )}

      {/* Layout Split: Exercises Summary + Months Locking Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exercices Directory card */}
        <div className="p-5 bg-[#181B2E] border border-white/5 rounded-2xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Répertoire des Exercices</h4>
            <div className="space-y-3">
              {exercices.map((ex) => {
                const isSelected = ex.id === activeExerciseId;
                return (
                  <div 
                    key={ex.id} 
                    className={`p-3.5 rounded-xl border flex items-center justify-between ${
                      isSelected 
                        ? 'bg-[#6C63FF]/10 border-[#6C63FF]' 
                        : 'bg-[#13162A] border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-[#8892B0]" />
                      <div>
                        <p className="text-xs font-bold text-white font-mono">ANNÉE COMPTABLE {ex.numero}</p>
                        <p className="text-[10px] text-[#8892B0] font-mono">{ex.dateDebut} au {ex.dateFin}</p>
                      </div>
                    </div>
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        ex.statut === 'ouvert' 
                          ? 'bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/20' 
                          : 'bg-white/5 text-white/40'
                      }`}>
                        {ex.statut}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 p-3 bg-white/[0.01] border border-white/5 rounded-xl text-xs text-[#8892B0] space-y-2">
            <p className="font-semibold text-white flex items-center gap-1.5 text-[10px] uppercase font-mono text-[#00D4FF]">
              <Lock className="w-3.5 h-3.5" /> Règles de verrous légaux
            </p>
            <p className="text-[11px] leading-relaxed">
              Un mois verrouillé interdit formellement la saisie ou la modification d'écritures. Pour clôturer un exercice comptable complet, toutes les sous-périodes mensuelles doivent d'abord être verrouillées.
            </p>
          </div>
        </div>

        {/* Months grid (Col-span 2) */}
        <div className="lg:col-span-2 p-5 bg-[#181B2E] border border-white/5 rounded-2xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-sm font-semibold text-white">Sous-périodes comptables ({activeEx ? activeEx.numero : ''})</h4>
              <p className="text-xs text-[#8892B0]">Cliquez sur l'interrupteur cadenas pour ouvrir ou verrouiller un mois spécifique.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 font-mono">
            {currentPeriodes.map((p) => {
              const isLocked = p.statut === 'verrouillee';
              return (
                <div 
                  key={p.id} 
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                    isLocked 
                      ? 'bg-red-500/5 border-red-500/15' 
                      : 'bg-[#13162A] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold text-white">{p.libelle}</p>
                    <p className="text-[9px] text-white/40 font-mono mt-0.5">Dates: {p.dateDebut.substring(5)} au {p.dateFin.substring(5)}</p>
                    {isLocked && (
                      <span className="text-[8px] bg-red-400/10 text-red-400 px-1 py-0.5 rounded font-mono block mt-1">
                        Bloqué par admin
                      </span>
                    )}
                  </div>
                  
                  <button
                    id={`lock-toggle-${p.id}`}
                    onClick={() => togglePeriodLock(p.id)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      isLocked 
                        ? 'bg-red-500/10 border-red-500/20 text-[#FF6B6B]' 
                        : 'bg-white/5 border-white/5 text-[#00D4AA]'
                    }`}
                    title={isLocked ? 'Déverrouiller la période' : 'Verrouiller la période'}
                  >
                    {isLocked ? (
                      <Lock className="w-4 h-4 shrink-0" />
                    ) : (
                      <Unlock className="w-4 h-4 shrink-0" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
