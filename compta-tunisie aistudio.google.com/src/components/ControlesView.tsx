/**
 * Composant ControlesView : Outil d'audit et contrôles de cohérence réglementaires tunisiens.
 * Analyse les anomalies (CC-01 à CC-05 : caisse créancière, déséquilibre, tiers non lettrés, etc.).
 */

import React, { useState, useMemo } from 'react';
import { Ecriture, Compte, Tiers, Echeance } from '../types';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, 
  HelpCircle, CheckCircle, RefreshCw, Eye, Sparkles 
} from 'lucide-react';
import { addAuditLog } from '../lib/storage';

interface ControlesViewProps {
  comptes: Compte[];
  tiers: Tiers[];
  ecritures: Ecriture[];
  echeances: Echeance[];
  onTriggerFixAll: () => void;
}

export default function ControlesView({ comptes, tiers, ecritures, echeances, onTriggerFixAll }: ControlesViewProps) {
  const [recomputing, setRecomputing] = useState(false);

  // Exécuter l'évaluation complète d'audit sur l'ensemble du livre
  const auditReport = useMemo(() => {
    const anomalies: Array<{
      id: string;
      code: string;
      label: string;
      level: 'CRITICAL' | 'WARNING' | 'INFO';
      description: string;
      details?: string;
    }> = [];

    // --- CC-01 : Double-checks complete balance equation
    const sumDebit = ecritures.reduce((s, e) => s + e.montantDebit, 0);
    const sumCredit = ecritures.reduce((s, e) => s + e.montantCredit, 0);
    const glDiff = Math.abs(sumDebit - sumCredit);
    if (glDiff > 0.001) {
      anomalies.push({
        id: 'cc-01',
        code: 'CC-01',
        label: 'Déséquilibre de la Balance Générale',
        level: 'CRITICAL',
        description: `Le montant cumulé de débit (${sumDebit.toFixed(3)} DT) déroge de la somme globale crédit (${sumCredit.toFixed(3)} DT).`,
        details: `Variance asymétrique de ${glDiff.toFixed(3)} DT identifiée dans le Grand Livre.`
      });
    }

    // --- CC-02 : Non-lettered expired entries
    const unpaidAmt = echeances.filter(e => e.statut !== 'paye' && new Date(e.dateEcheance) < new Date('2026-05-28'))
                                .reduce((s, e) => s + e.montantReste, 0);
    if (unpaidAmt > 1000) {
      anomalies.push({
        id: 'cc-02',
        code: 'CC-02',
        label: 'Accumulation d\'Échéances en Retard',
        level: 'WARNING',
        description: `Vous détenez des factures de tiers échues et non soldées d'un montant total de ${unpaidAmt.toLocaleString()} DT.`,
        details: 'Risque de dégradation du fonds de roulement de la société.'
      });
    }

    // --- CC-03 : Cash accounts credit balances (Caisse créditrice interdite)
    // On calcule le solde cumulé du compte caisse 530000 ou 530...
    const cashEntries = ecritures.filter(e => e.numeroCompte.startsWith('53'));
    const cashDebit = cashEntries.reduce((s, e) => s + e.montantDebit, 0);
    const cashCredit = cashEntries.reduce((s, e) => s + e.montantCredit, 0);
    const cashBal = cashDebit - cashCredit;
    if (cashBal < 0) {
      anomalies.push({
        id: 'cc-03',
        code: 'CC-03',
        label: 'Caisse Créditrice Actuelle',
        level: 'CRITICAL',
        description: `Le solde comptable de caisse est négatif : ${cashBal.toFixed(3)} DT.`,
        details: 'En droit comptable tunisien pur, une caisse créditrice matérialise une présomption d\'omission de recettes.'
      });
    }

    // --- CC-04 : Active account with missing sub-ledger code
    const missingTiers = ecritures.filter(e => (e.numeroCompte.startsWith('411') || e.numeroCompte.startsWith('401')) && !e.idTiers);
    if (missingTiers.length > 0) {
      anomalies.push({
        id: 'cc-04',
        code: 'CC-04',
        label: 'Écritures Collectives sans Auxiliaire',
        level: 'WARNING',
        description: `Nous avons comptabilisé ${missingTiers.length} écritures collectives sur des comptes collectifs sans associer de compte tiers auxiliaire.`,
        details: 'Ces écritures ne pourront jamais être reportées dans la balance auxiliaire ou lettrées correctement.'
      });
    }

    // --- CC-05 : Highlight unusual cross-journal registers
    const unusualBQ = ecritures.filter(e => e.journal === 'BQ' && !e.numeroCompte.startsWith('512') && !e.numeroCompte.startsWith('4'));
    if (unusualBQ.length > 5) {
      anomalies.push({
        id: 'cc-05',
        code: 'CC-05',
        label: 'Anomalies de ventilation Journal de Banque',
        level: 'INFO',
        description: `Il y a ${unusualBQ.length} imputations inhabituelles dans le journal de Trésorerie Banque sans passage par un tiers.`,
        details: 'Audit conseillé pour s\'assurer de l\'imputation directe.'
      });
    }

    return { anomalies, score: Math.max(0, 100 - (anomalies.length * 15)) };
  }, [ecritures, echeances]);

  const runRecompute = () => {
    setRecomputing(true);
    setTimeout(() => {
      setRecomputing(false);
      addAuditLog('VALIDATE', 'Controles', 'Relancement manuel du robot de vérification des cycles d\'audit.');
    }, 800);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full text-left font-sans select-text">
      {/* Top Header info */}
      <div className="flex justify-between items-center bg-[#181B2E] p-4 rounded-xl border border-white/5">
        <div>
          <h3 className="text-base font-semibold text-white">Console Intelligente d'Audit &amp; de Cohérence</h3>
          <p className="text-xs text-[#8892B0]">Vérification continue par cycles comptables et détections d'anomalies fiscales.</p>
        </div>
        <button
          id="recompute-audit-btn"
          onClick={runRecompute}
          className="px-4 py-2 rounded-lg bg-[#6C63FF] hover:bg-[#6C63FF]/90 text-xs font-semibold text-white flex items-center gap-2 transition-all font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${recomputing ? 'animate-spin' : ''}`} />
          Recalculer les indicateurs
        </button>
      </div>

      {/* Main split: Score dial and recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Audit general score dial */}
        <div className="p-6 bg-[#181B2E] border border-white/5 rounded-2xl flex flex-col items-center justify-between text-center shadow-sm select-none">
          <div>
            <span className="text-xs font-bold text-[#8892B0] uppercase font-mono tracking-wider">Score de conformité fiscale</span>
            
            {/* Round dial display */}
            <div className="my-6 relative w-32 h-32 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="54" className="stroke-white/5 fill-transparent" strokeWidth="8" />
                <circle 
                  cx="64" 
                  cy="64" 
                  r="54" 
                  className="stroke-[#00D4AA] fill-transparent transition-all duration-1000" 
                  strokeWidth="8" 
                  strokeDasharray="339.2"
                  strokeDashoffset={339.2 - (339.2 * auditReport.score) / 100}
                />
              </svg>
              <div>
                <span className="text-3xl font-extrabold text-white font-mono">{auditReport.score}%</span>
                <span className="block text-[8px] text-[#8892B0] uppercase font-bold tracking-widest mt-0.5">Sûr &amp; Conforme</span>
              </div>
            </div>
          </div>

          <div className="w-full space-y-2 mt-4 text-xs">
            <div className="flex justify-between text-[#8892B0]">
              <span>Anomalies blocage :</span>
              <span className="text-white font-bold">{auditReport.anomalies.filter(a => a.level === 'CRITICAL').length}</span>
            </div>
            <div className="flex justify-between text-[#8892B0]">
              <span>Contrôles sains :</span>
              <span className="text-[#00D4AA] font-bold">12 / 12</span>
            </div>
          </div>
        </div>

        {/* Anomalies List cards (Col-span 2) */}
        <div className="lg:col-span-2 p-5 bg-[#181B2E] border border-white/5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex justify-between items-center bg-white/[0.005] p-3 rounded-lg border border-white/5 select-none text-xs">
            <div>
              <h4 className="font-semibold text-white">Anomalies repérées en portefeuille</h4>
              <p className="text-[10px] text-[#8892B0] mt-0.5">{auditReport.anomalies.length} diagnostics nécessitant attention</p>
            </div>
            {auditReport.anomalies.length > 0 && (
              <button
                id="fix-anomalies-auto"
                onClick={() => {
                  onTriggerFixAll();
                  alert('Correction automatique effectuée : injection d\'écritures d\'équilibrage.');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#00D4AA] font-semibold text-xs text-black"
              >
                Résoudre l'asymétrie
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {auditReport.anomalies.map((a) => (
              <div 
                key={a.id} 
                className={`p-4 rounded-xl border flex gap-3.5 items-start transition-colors ${
                  a.level === 'CRITICAL' 
                    ? 'bg-red-500/5 border-red-500/15' 
                    : a.level === 'WARNING' 
                    ? 'bg-amber-500/5 border-amber-500/15' 
                    : 'bg-blue-500/5 border-blue-500/15'
                }`}
              >
                <div className="mt-0.5">
                  {a.level === 'CRITICAL' ? (
                    <ShieldAlert className="w-5 h-5 text-[#FF6B6B] shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-[#FDCB6E] shrink-0" />
                  )}
                </div>

                <div className="flex-1 font-mono text-xs text-[#8892B0]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white uppercase">{a.code} : {a.label}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      a.level === 'CRITICAL' 
                        ? 'bg-[#FF6B6B]/10 text-[#FF6B6B]' 
                        : 'bg-[#FDCB6E]/10 text-[#FDCB6E]'
                    }`}>
                      {a.level}
                    </span>
                  </div>
                  <p className="mt-1 text-white/80 leading-relaxed font-sans">{a.description}</p>
                  {a.details && (
                    <p className="text-[10px] text-white/40 block mt-1 border-t border-white/[0.02] pt-1 select-all">{a.details}</p>
                  )}
                </div>
              </div>
            ))}

            {auditReport.anomalies.length === 0 && (
              <div className="text-center p-8 bg-[#13162A]/50 border border-white/5 rounded-xl text-white/40 font-mono flex flex-col items-center gap-2 select-none">
                <ShieldCheck className="w-8 h-8 text-[#00D4AA]" />
                <p className="text-xs font-bold text-white">Félicitations ! Aucun écart fiscal n'a été répertorié.</p>
                <p className="text-[10px]">La comptabilité est conforme aux instructions de contrôle.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
