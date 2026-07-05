/**
 * Composant RapprochementView : Rapprochement Bancaire (Simplifié réactif).
 * Calcule l'écart par rapport au solde d'un relevé bancaire réel saisi manuellement,
 * et permet de cocher les écritures non rapprochées jusqu'à atteindre un écart de 0.
 */

import React, { useState, useMemo } from 'react';
import { Ecriture, Compte } from '../types';
import { Check, ShieldCheck, HelpCircle, DollarSign, ArrowRightLeft, FileCheck } from 'lucide-react';
import { addAuditLog } from '../lib/storage';

interface RapprochementViewProps {
  comptes: Compte[];
  ecritures: Ecriture[];
  onSaveEcritures: (list: Ecriture[]) => void;
}

export default function RapprochementView({ comptes, ecritures, onSaveEcritures }: RapprochementViewProps) {
  const [selectedBankCompte, setSelectedBankCompte] = useState('512000'); // Banque par défaut
  const [statementBalance, setStatementBalance] = useState<number>(124800); // Saisie manuelle du relevé bancaire
  const [reconciliationChecked, setReconciliationChecked] = useState<Set<string>>(new Set());

  // Filtrer les comptes de banque rapprochables
  const bankComptes = useMemo(() => {
    return comptes.filter(c => c.rapprochable || c.numero.startsWith('512'));
  }, [comptes]);

  // Récupérer les écritures rattachées au compte de banque sélectionné
  const bankEntries = useMemo(() => {
    return ecritures.filter(e => e.numeroCompte === selectedBankCompte);
  }, [ecritures, selectedBankCompte]);

  // Séparer les écritures déjà pointées (rapprochées) par rapport au grand livre d'origine
  const entriesStatus = useMemo(() => {
    const unreconciled = bankEntries.filter(e => !e.rapprochement);
    const reconciled = bankEntries.filter(e => !!e.rapprochement);
    
    // Calculer le solde comptable du livre de banque courant
    const comptableDebit = bankEntries.reduce((s, e) => s + e.montantDebit, 0);
    const comptableCredit = bankEntries.reduce((s, e) => s + e.montantCredit, 0);
    const comptableBalance = comptableDebit - comptableCredit;

    return { unreconciled, reconciled, comptableBalance };
  }, [bankEntries]);

  // Pointage interactif d'une écriture
  const toggleCheck = (idxId: string) => {
    const next = new Set(reconciliationChecked);
    if (next.has(idxId)) {
      next.delete(idxId);
    } else {
      next.add(idxId);
    }
    setReconciliationChecked(next);
  };

  // Calcul réactif des écarts de pointage
  const calculation = useMemo(() => {
    // Somme des écritures validées cochées en cours de rapprochement
    let checkedDebitSum = 0;
    let checkedCreditSum = 0;

    reconciliationChecked.forEach(id => {
      const e = entriesStatus.unreconciled.find(ent => ent.id === id);
      if (e) {
        checkedDebitSum += e.montantDebit;
        checkedCreditSum += e.montantCredit;
      }
    });

    const calculatedCheckedBalance = checkedDebitSum - checkedCreditSum;
    
    // Écart de rapprochement cible : Solde relevé bancaire - (Solde Comptable Initial + Écritures Pointées)
    const deviation = statementBalance - (entriesStatus.comptableBalance - calculatedCheckedBalance);
    const deviationBalanced = Math.abs(deviation) < 0.001;

    return { calculatedCheckedBalance, deviation, deviationBalanced };
  }, [reconciliationChecked, entriesStatus, statementBalance]);

  // Validation définitive du rapprochement de cet exercice
  const handleValidateReconciliation = () => {
    if (!calculation.deviationBalanced) {
      alert(`Impossible d'enregistrer le rapprochement. L'écart est de ${calculation.deviation.toFixed(3)} DT (Cible: 0.000 DT).`);
      return;
    }

    const code = 'RAPP-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    // Assigner le code rapprochement aux écritures cochées
    const updated = ecritures.map(e => {
      if (reconciliationChecked.has(e.id)) {
        return { ...e, rapprochement: code };
      }
      return e;
    });

    onSaveEcritures(updated);
    addAuditLog('VALIDATE', 'Rapprochement', `Rapprochement bancaire enregistré sous le code ${code} sur le compte ${selectedBankCompte}`);
    setReconciliationChecked(new Set());
    alert(`Rapprochement ${code} pour le compte de banque ${selectedBankCompte} validé et archivé définitivement.`);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full text-left font-sans select-text">
      {/* Top Header */}
      <div className="flex justify-between items-center bg-[#181B2E] p-4 rounded-xl border border-white/5">
        <div>
          <h3 className="text-base font-semibold text-white">Rapprochement Bancaire</h3>
          <p className="text-xs text-[#8892B0]">Lettrage des extraits de compte réels avec les écritures du journal de trésorerie.</p>
        </div>

        {/* Bank Account switcher selection */}
        <div className="flex items-center gap-2 bg-[#13162A] p-1.5 border border-white/5 rounded-lg font-mono">
          <span className="text-xs text-[#8892B0]">Compte Banque :</span>
          <select
            id="rapp-bank-select"
            value={selectedBankCompte}
            onChange={(e) => {
              setSelectedBankCompte(e.target.value);
              setReconciliationChecked(new Set());
            }}
            className="bg-transparent text-xs font-semibold text-white border-none outline-none focus:ring-0 cursor-pointer pr-1"
          >
            {bankComptes.map(bc => (
              <option key={bc.id} value={bc.numero} className="bg-[#13162A] text-white">
                {bc.numero} : {bc.libelle.substring(0, 15)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Saisie de relevé et counters dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Step 1 input bank balance */}
        <div className="p-5 bg-[#181B2E] border border-white/5 rounded-2xl space-y-3 shadow-sm select-none">
          <span className="text-[10px] font-bold text-[#6C63FF] uppercase font-mono">Étape 1 : Solder le Relevé Réel</span>
          <h4 className="text-xs font-semibold text-white">Solde final sur le relevé en ligne (BNA/UIB)</h4>
          
          <div className="relative">
            <input
              id="rapp-statement-input"
              type="number"
              step="0.001"
              value={statementBalance}
              onChange={(e) => setStatementBalance(Number(e.target.value))}
              className="w-full bg-[#13162A] border border-white/10 p-2.5 rounded-lg text-sm text-white font-mono font-bold focus:outline-none focus:border-[#6C63FF] text-right pr-12"
            />
            <span className="absolute right-3 top-3 text-[11px] font-bold text-white/30 font-mono">DT</span>
          </div>
          
          <p className="text-[10px] text-[#8892B0] leading-relaxed">
            Reportez textuellement le montant d'arrivée de votre extrait de compte pour calculer l'écart.
          </p>
        </div>

        {/* Step 2 metrics counters */}
        <div className="p-5 bg-[#181B2E] border border-white/5 rounded-2xl flex flex-col justify-between shadow-sm font-mono">
          <div>
            <span className="text-[10px] font-bold text-[#00D4AA] uppercase font-mono">Étape 2 : Solde Grand Livre</span>
            <div className="space-y-1.5 mt-2.5 text-xs">
              <div className="flex justify-between text-[#8892B0]">
                <span>Solde Comptable Local:</span>
                <span className="text-white font-semibold">{entriesStatus.comptableBalance.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>
              <div className="flex justify-between text-[#8892B0]">
                <span>Total Différance Pointée:</span>
                <span className="text-white">{calculation.calculatedCheckedBalance.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 text-[10px] text-white/40">
            {bankEntries.length} écritures cumulées sur ce compte.
          </div>
        </div>

        {/* Step 3 discrepancy audit checker */}
        <div className="p-5 bg-[#181B2E] border border-white/5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-[#FDCB6E] uppercase font-mono">Étape 3 : Équilibre</span>
            <p className="text-[10px] text-[#8892B0] mt-1.5 leading-relaxed">
              L'écart d'imputation doit être de 0.000 DT pour déclarer la banque réconciliée.
            </p>
            
            <p className="text-lg font-mono font-bold text-white mt-3 text-right">
              Écart : <span className={calculation.deviationBalanced ? 'text-[#00D4AA]' : 'text-[#FF6B6B]'}>
                {calculation.deviation.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT
              </span>
            </p>
          </div>

          <div>
            <button
              id="rapp-validate-action"
              onClick={handleValidateReconciliation}
              disabled={!calculation.deviationBalanced}
              className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                calculation.deviationBalanced 
                  ? 'bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-black shadow cursor-pointer' 
                  : 'bg-white/5 text-[#8892B0] cursor-not-allowed border border-white/5 font-normal'
              }`}
            >
              {calculation.deviationBalanced ? 'Valider le Rapprochement' : 'Pointer les lignes ci-dessous'}
            </button>
          </div>
        </div>
      </div>

      {/* Un-reconciled items listing checklist table */}
      <div className="bg-[#181B2E] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-white/5 bg-white/[0.01]">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Mouvements bancaires en attente de vérification
          </h4>
          <p className="text-[10px] text-[#8892B0] mt-0.5 font-mono">
            Cochez les écritures portées sur votre relevé papier pour équilibrer.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white">
            <thead className="bg-[#13162A]/50 text-[#8892B0] uppercase text-[10px] tracking-widest font-mono">
              <tr>
                <th className="p-3 w-10">Pointage</th>
                <th className="p-3 w-24">Date</th>
                <th className="p-3">Lettre / N° Pièce</th>
                <th className="p-3">Libellé d'opération de trésorerie</th>
                <th className="p-3 text-right">Débit (Rentrée)</th>
                <th className="p-3 text-right">Crédit (Sortie)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {entriesStatus.unreconciled.map((e) => {
                const isSelected = reconciliationChecked.has(e.id);
                return (
                  <tr 
                    key={e.id} 
                    className={`hover:bg-white/[0.015] transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#00D4AA]/5' : ''
                    }`}
                    onClick={() => toggleCheck(e.id)}
                  >
                    <td className="p-3 select-none">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isSelected 
                          ? 'bg-[#00D4AA] border-[#00D4AA] text-black' 
                          : 'border-white/10 hover:border-white/30'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </td>
                    <td className="p-3 text-white/50">{e.datePiece}</td>
                    <td className="p-3 font-semibold text-white">{e.numeroPiece}</td>
                    <td className="p-3 truncate max-w-[250px]">{e.libelle}</td>
                    <td className="p-3 text-right font-semibold text-[#00D4AA]">
                      {e.montantDebit ? e.montantDebit.toLocaleString('fr-FR', { minimumFractionDigits: 3 }) : '-'}
                    </td>
                    <td className="p-3 text-right font-semibold text-[#FF6B6B]">
                      {e.montantCredit ? e.montantCredit.toLocaleString('fr-FR', { minimumFractionDigits: 3 }) : '-'}
                    </td>
                  </tr>
                );
              })}

              {entriesStatus.unreconciled.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-white/30 font-mono">
                    Toutes les écritures bancaires de cette période ont fait l'objet d'un pointage.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
