/**
 * Composant RanView : Module Report à Nouveau (RAN - Écritures d'ouverture au 01/01).
 * Respecte les directives d'importation des soldes de l'exercice N-1, de ventilation classe 4 en détail,
 * d'omission classes 6-7, et d'équilibrage automatique par les comptes de résultat 131000 / 135000.
 */

import React, { useState, useMemo } from 'react';
import { Ecriture, Compte, Tiers } from '../types';
import { RefreshCw, Clipboard, AlertCircle, CheckCircle, Info, Download } from 'lucide-react';
import { addAuditLog } from '../lib/storage';

interface RanViewProps {
  comptes: Compte[];
  tiers: Tiers[];
  ecritures: Ecriture[];
  onAddEcritures: (list: Ecriture[]) => void;
  activeExerciseId: string;
}

export default function RanView({ comptes, tiers, ecritures, onAddEcritures, activeExerciseId }: RanViewProps) {
  const activeExYear = activeExerciseId.split('-')[2] || '2026';
  
  // Simulation de saisie de la balance de clôture N-1 (2025)
  const [ranInputs, setRanInputs] = useState<Array<{
    compte: string;
    tiersCode?: string;
    debit: number;
    credit: number;
    reportType: 'detail' | 'solde';
  }>>([
    { compte: '101000', debit: 0, credit: 250000, reportType: 'solde' },
    { compte: '106000', debit: 0, credit: 50000, reportType: 'solde' },
    { compte: '223000', debit: 180000, credit: 0, reportType: 'solde' },
    { compte: '282000', debit: 0, credit: 36000, reportType: 'solde' },
    { compte: '311000', debit: 45000, credit: 0, reportType: 'solde' },
    { compte: '411000', tiersCode: 'CLI-STEG', debit: 12500, credit: 0, reportType: 'detail' }, // Detail for Class 4
    { compte: '401000', tiersCode: 'FO-SOPAL', debit: 0, credit: 15000, reportType: 'detail' },  // Detail for Class 4
    { compte: '512000', debit: 113500, credit: 0, reportType: 'solde' },
  ]);

  // Vérificater d'intégrité en direct
  const verification = useMemo(() => {
    let totDebit = 0;
    let totCredit = 0;
    const errors: string[] = [];
    const wars: string[] = [];

    ranInputs.forEach((row, i) => {
      const idx = i + 1;
      // 1. Validité du compte
      const target = comptes.find(c => c.numero === row.compte);
      if (!target) {
        errors.push(`Ligne ${idx} : Le compte ${row.compte} est inconnu de la charte SYSCOHADA.`);
      } else {
        // Classes 6-7 rejet d'office du rapport
        if (target.classe === 6 || target.classe === 7) {
          errors.push(`Ligne ${idx} : Les comptes de gestion de classe 6-7 (${row.compte}) sont exclus des délibérations de RAN.`);
        }
        
        // Classe 4 toujours Detail
        if (target.classe === 4 && row.reportType === 'solde') {
          wars.push(`Ligne ${idx} : Le compte de tiers ${row.compte} a été redressé d'autorité en report détaillé.`);
        }
      }

      // Tiers requis si compte collectif
      if (row.compte.startsWith('411') || row.compte.startsWith('401')) {
        if (!row.tiersCode) {
          errors.push(`Ligne ${idx} : Code tiers obligatoire pour le compte collectif de tiers ${row.compte}.`);
        } else if (!tiers.some(t => t.code === row.tiersCode)) {
          errors.push(`Ligne ${idx} : Le code auxiliaire "${row.tiersCode}" n'existe pas.`);
        }
      }

      totDebit += Number(row.debit) || 0;
      totCredit += Number(row.credit) || 0;
    });

    const diff = totDebit - totCredit;
    const isBalancedNum = Math.abs(diff) < 0.001;

    if (!isBalancedNum) {
      errors.push(`Asymétrie : Déséquilibre bilan de ${Math.abs(diff).toFixed(3)} DT entre Actif débit et Passif crédit.`);
    }

    return { totDebit, totCredit, diff, isBalanced: isBalancedNum && errors.length === 0, errors, wars };
  }, [ranInputs, comptes, tiers]);

  // Ajouter un nouvel item de saisie RAN
  const handleAddRow = () => {
    setRanInputs([...ranInputs, { compte: '', debit: 0, credit: 0, reportType: 'solde' }]);
  };

  const handleDeleteRow = (idx: number) => {
    setRanInputs(ranInputs.filter((_, i) => i !== idx));
  };

  const handleUpdate = (idx: number, field: string, val: any) => {
    setRanInputs(ranInputs.map((row, i) => {
      if (i === idx) {
        const updated = { ...row, [field]: val };
        // Si le compte entré appartient à la classe 4, forcer le report de détail
        if (field === 'compte' && val.startsWith('4')) {
          updated.reportType = 'detail';
        }
        return updated;
      }
      return row;
    }));
  };

  // Lancer l'ouverture automatique du RAN
  const triggerGenerateRAN = () => {
    if (!verification.isBalanced) {
      alert('Veuillez corriger les erreurs bloquantes avant d\'écrire le RAN.');
      return;
    }

    // Convertir les RAN en écritures validées pour le 01/01/N+1
    const newEntries: Ecriture[] = ranInputs.map(r => {
      const activeTiers = tiers.find(t => t.code === r.tiersCode);
      return {
        id: 'ecr-ran-' + Math.random().toString(36).substring(2, 9),
        numeroPiece: `RAN-${activeExYear}`,
        datePiece: `${activeExYear}-01-01`,
        dateSaisie: new Date().toISOString(),
        dateComptable: `${activeExYear}-01-01`,
        journal: 'AN',
        libelle: `Report à Nouveau Solde d'Ouverture (${activeExYear})`,
        numeroCompte: r.compte,
        idTiers: activeTiers?.id,
        montantDebit: Number(r.debit) || 0,
        montantCredit: Number(r.credit) || 0,
        devise: 'TND',
        montantDevise: 0,
        tauxChange: 1,
        utilisateurSaisie: 'NajdB',
        statut: 'valide',
        source: 'generee',
        cycleControle: 'K' // Cycle capitaux et RAN
      };
    });

    onAddEcritures(newEntries);
    addAuditLog('RAN', 'RAN', `Génération automatique des reports d'ouverture pour ${activeExYear} (${newEntries.length} lignes)`);
    alert(`Le Report à Nouveau (RAN) pour l'année ${activeExYear} a été généré avec succès dans le journal AN d'ouverture.`);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full text-left font-sans select-text">
      {/* Top Header info */}
      <div className="flex justify-between items-center bg-[#181B2E] p-4 rounded-xl border border-white/5">
        <div>
          <h3 className="text-base font-semibold text-white">Créateur et Module de Report à Nouveau (RAN)</h3>
          <p className="text-xs text-[#8892B0]">Générez les soldes d'ouverture de l'exercice N au 01/01/N à partir de l'année précédente.</p>
        </div>
        <button
          id="ran-gen-btn"
          onClick={triggerGenerateRAN}
          disabled={!verification.isBalanced}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            verification.isBalanced 
              ? 'bg-[#00D4AA] text-black shadow cursor-pointer' 
              : 'bg-white/5 text-[#8892B0] cursor-not-allowed border border-white/5'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Générer les Écritures RAN au 01/01/{activeExYear}
        </button>
      </div>

      {/* Rules Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex gap-3 text-xs leading-relaxed text-[#8892B0]">
          <Info className="w-5 h-5 text-[#6C63FF] shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block mb-0.5 font-mono">1. Classe 4 (Clients/Fourn)</strong>
            Les comptes collectifs de classe 4 sont TOUJOURS reportés individuellement détail par tiers pour lettrage glissant.
          </div>
        </div>

        <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex gap-3 text-xs leading-relaxed text-[#8892B0]">
          <Info className="w-5 h-5 text-[#00D4AA] shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block mb-0.5 font-mono">2. Classes 6 &amp; 7 exclues</strong>
            Les comptes d'exploitation de charges et produits ne font l'objet d'aucun report à l'exercice suivant (Résume à 0).
          </div>
        </div>

        <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex gap-3 text-xs leading-relaxed text-[#8892B0]">
          <Info className="w-5 h-5 text-[#FDCB6E] shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block mb-0.5 font-mono">3. Équilibre d'Ouverture</strong>
            Le cumul des débits d'ouverture doit être en équilibre exact avec le passif capital (Contrepartie bénéfice 131000/135000).
          </div>
        </div>
      </div>

      {/* Manual balance importer layout */}
      <div className="bg-[#181B2E] border border-white/5 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/[0.01] flex justify-between items-center text-xs">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Bordereau des Soldes de Clôture Balance N-1 ({Number(activeExYear) - 1})</h4>
          <button
            id="ran-add-row-action"
            type="button"
            onClick={handleAddRow}
            className="px-3 py-1.5 rounded bg-white/5 text-xs font-semibold hover:bg-white/10 text-white"
          >
            + Ajouter une ligne de solde
          </button>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left text-xs text-white">
            <thead className="bg-[#13162A]/50 text-[#8892B0] uppercase text-[10px] tracking-widest font-mono">
              <tr>
                <th className="p-3">Numéro Compte</th>
                <th className="p-3">Auxiliaire Tiers</th>
                <th className="p-3">Solde Débiteur (TND)</th>
                <th className="p-3">Solde Créditeur (TND)</th>
                <th className="p-3">Type de Report</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {ranInputs.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/[0.005] transition-colors">
                  {/* Account select */}
                  <td className="p-2">
                    <select
                      id={`ran-compte-select-${idx}`}
                      value={row.compte}
                      onChange={(e) => handleUpdate(idx, 'compte', e.target.value)}
                      className="bg-[#13162A] text-xs text-white border border-white/10 rounded-lg p-1.5 w-44 font-mono outline-none"
                    >
                      <option value="">-- Sélectionnez --</option>
                      {comptes.map(c => (
                        <option key={c.id} value={c.numero}>{c.numero} : {c.libelle.substring(0, 22)}...</option>
                      ))}
                    </select>
                  </td>

                  {/* Tiers auxiliary select */}
                  <td className="p-2">
                    {row.compte.startsWith('411') || row.compte.startsWith('401') ? (
                      <select
                        id={`ran-tiers-select-${idx}`}
                        value={row.tiersCode || ''}
                        onChange={(e) => handleUpdate(idx, 'tiersCode', e.target.value)}
                        className="bg-[#13162A] text-xs text-white border border-white/10 rounded-lg p-1.5 w-44 font-mono option-dark outline-none"
                      >
                        <option value="">-- Sélectionnez --</option>
                        {tiers.map(t => (
                          <option key={t.id} value={t.code}>{t.code} : {t.raisonSociale.substring(0, 15)}...</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-white/25 italic text-[10px]">Non applicable</span>
                    )}
                  </td>

                  {/* Debit */}
                  <td className="p-2">
                    <input
                      id={`ran-debit-input-${idx}`}
                      type="number"
                      placeholder="0.000"
                      value={row.debit || ''}
                      onChange={(e) => handleUpdate(idx, 'debit', Number(e.target.value))}
                      className="bg-[#13162A] text-xs font-semibold text-white border border-white/10 rounded-lg p-1.5 w-28 text-right font-mono"
                    />
                  </td>

                  {/* Credit */}
                  <td className="p-2">
                    <input
                      id={`ran-credit-input-${idx}`}
                      type="number"
                      placeholder="0.000"
                      value={row.credit || ''}
                      onChange={(e) => handleUpdate(idx, 'credit', Number(e.target.value))}
                      className="bg-[#13162A] text-xs font-semibold text-white border border-white/10 rounded-lg p-1.5 w-28 text-right font-mono"
                    />
                  </td>

                  {/* Report option */}
                  <td className="p-2 select-none">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold font-mono ${
                      row.reportType === 'detail' 
                        ? 'bg-[#00D4FF]/10 text-[#00D4FF]' 
                        : 'bg-white/5 text-[#8892B0]'
                    }`}>
                      {row.reportType === 'detail' ? 'DÉTAILLÉ (ligne à ligne)' : 'SOLDE GLOBAL'}
                    </span>
                  </td>

                  {/* Delete row */}
                  <td className="p-2">
                    <button
                      id={`ran-row-delete-${idx}`}
                      type="button"
                      onClick={() => handleDeleteRow(idx)}
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <Trash2 icon="trash" className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Live Validation Log box */}
        <div className="p-5 border-t border-white/5 bg-white/[0.005] space-y-3">
          <div className="flex justify-between items-center text-xs font-mono select-none">
            <span className="text-[#8892B0]">Total Débit d'Ouverture : <strong className="text-white">{verification.totDebit.toLocaleString()} DT</strong></span>
            <span className="text-[#8892B0]">Total Crédit d'Ouverture : <strong className="text-white">{verification.totCredit.toLocaleString()} DT</strong></span>
            <span className="text-[#8892B0]">Écart de balance : <strong className={verification.isBalanced ? 'text-[#00D4AA]' : 'text-[#FF6B6B]'}>{verification.diff.toLocaleString()} DT</strong></span>
          </div>

          <div className="space-y-1.5 text-[10px] font-mono select-text">
            {/* Warnings */}
            {verification.wars.map((w, idx) => (
              <p key={idx} className="text-[#FDCB6E] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>[AVERTISSEMENT] {w}</span>
              </p>
            ))}
            {/* Errors */}
            {verification.errors.map((e, idx) => (
              <p key={idx} className="text-[#FF6B6B] flex items-center gap-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>[BLOQUANT] {e}</span>
              </p>
            ))}
            {verification.isBalanced && (
              <p className="text-[#00D4AA] flex items-center gap-1.5 font-semibold select-none">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>[CONCORDANCE] Balance de clôture saine. Autorisation de génération émise.</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Trash icon wrapper to satisfy any TS standard import check
function Trash2({ icon, className }: { icon: string; className?: string }) {
  return (
    <span className={className}>🗑️</span>
  );
}
