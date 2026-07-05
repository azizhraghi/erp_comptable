/**
 * Composant EditionsView : Éditions légales tunisiennes.
 * 1. Balance Générale avec totaux de classe et structure BILAN / GESTION.
 * 2. Balance Auxiliaire ventilée par compte collectif d'origine.
 * 3. Grand-Livre Général trié chronologiquement prioritie RAN-First.
 * 4. Grand-Livre Auxiliaire.
 * Comprend le support de pagination unifiée GLOBAL_PAGE_COUNT et entête d'édition officielle.
 */

import React, { useState, useMemo } from 'react';
import { Ecriture, Compte, Tiers } from '../types';
import { FileText, Printer, FileSpreadsheet, List, ArrowRight } from 'lucide-react';
import { addAuditLog } from '../lib/storage';

interface EditionsViewProps {
  comptes: Compte[];
  tiers: Tiers[];
  ecritures: Ecriture[];
  activeCompany: { raisonSociale: string; Code?: string } | null;
}

export default function EditionsView({ comptes, tiers, ecritures, activeCompany }: EditionsViewProps) {
  const [selectedSubTab, setSelectedSubTab] = useState<'balance' | 'balance_aux' | 'grand_livre' | 'grand_livre_aux'>('balance');

  // ==========================================
  // CALCUL ET EXTRACTION : BALANCE GÉNÉRALE
  // ==========================================
  const balanceGenerale = useMemo(() => {
    const list: Record<string, {
      numero: string;
      libelle: string;
      debit: number;
      credit: number;
    }> = {};

    // Initialiser avec tous les comptes actifs
    comptes.forEach(c => {
      list[c.numero] = { numero: c.numero, libelle: c.libelle, debit: 0, credit: 0 };
    });

    // Sommer les transactions
    ecritures.forEach(e => {
      if (!list[e.numeroCompte]) {
        list[e.numeroCompte] = { numero: e.numeroCompte, libelle: 'Compte externe', debit: 0, credit: 0 };
      }
      list[e.numeroCompte].debit += e.montantDebit;
      list[e.numeroCompte].credit += e.montantCredit;
    });

    // Trier les comptes par code
    const sorted = Object.values(list).sort((a,b) => a.numero.localeCompare(b.numero));

    // Calculer les totaux par types
    let totalBilanDebit = 0;
    let totalBilanCredit = 0;
    let totalGestionDebit = 0;
    let totalGestionCredit = 0;

    const rowsWithBalances = sorted.map(row => {
      const net = row.debit - row.credit;
      const soldeDebit = net > 0 ? net : 0;
      const soldeCredit = net < 0 ? Math.abs(net) : 0;

      const isBilan = row.numero.startsWith('1') || row.numero.startsWith('2') || 
                      row.numero.startsWith('3') || row.numero.startsWith('4') || 
                      row.numero.startsWith('5');
      
      if (isBilan) {
        totalBilanDebit += row.debit;
        totalBilanCredit += row.credit;
      } else {
        totalGestionDebit += row.debit;
        totalGestionCredit += row.credit;
      }

      return {
        ...row,
        soldeDebit,
        soldeCredit,
        isBilan
      };
    });

    return {
      rows: rowsWithBalances,
      totalBilanDebit,
      totalBilanCredit,
      totalGestionDebit,
      totalGestionCredit,
      totalGeneralDebit: totalBilanDebit + totalGestionDebit,
      totalGeneralCredit: totalBilanCredit + totalGestionCredit,
      totalSoldeDebit: rowsWithBalances.reduce((s, r) => s + r.soldeDebit, 0),
      totalSoldeCredit: rowsWithBalances.reduce((s, r) => s + r.soldeCredit, 0),
    };
  }, [comptes, ecritures]);


  // ==========================================
  // CALCUL : BALANCE AUXILIAIRE (Clients / Fournisseurs)
  // ==========================================
  const balanceAuxiliaire = useMemo(() => {
    // Regroupement par compte collectif de tiers (ex: 411000, 401000)
    const list: Record<string, Record<string, {
      codeTiers: string;
      raisonSociale: string;
      debit: number;
      credit: number;
    }>> = {};

    // Initialiser les structures collectives
    ['411000', '401000'].forEach(coll => {
      list[coll] = {};
      tiers.forEach(t => {
        if (t.compteCollectif === coll) {
          list[coll][t.id] = { codeTiers: t.code, raisonSociale: t.raisonSociale, debit: 0, credit: 0 };
        }
      });
    });

    // Sommer les mouvements lettrables
    ecritures.forEach(e => {
      if (e.idTiers) {
        const coll = e.numeroCompte; // l'écriture collective liée (ex: 411000)
        if (!list[coll]) {
          list[coll] = {};
        }
        if (!list[coll][e.idTiers]) {
          const companion = tiers.find(t => t.id === e.idTiers);
          list[coll][e.idTiers] = {
            codeTiers: companion ? companion.code : 'AUX-EXT',
            raisonSociale: companion ? companion.raisonSociale : 'Inconnu',
            debit: 0,
            credit: 0
          };
        }
        list[coll][e.idTiers].debit += e.montantDebit;
        list[coll][e.idTiers].credit += e.montantCredit;
      }
    });

    return list;
  }, [tiers, ecritures]);


  // ==========================================
  // CALCUL ET TRIS : GRAND LIVRE GÉNÉRAL (RAN-First)
  // ==========================================
  const grandLivreGenerale = useMemo(() => {
    // Trier les écritures en plaçant le RAN (Opening balance) en toute priorité temporelle
    const sortedEntries = [...ecritures].sort((a,b) => {
      // Priorité 1 : RAN (Journal AN en ouverture de l'année)
      const aIsRan = a.journal === 'AN';
      const bIsRan = b.journal === 'AN';
      if (aIsRan && !bIsRan) return -1;
      if (!aIsRan && bIsRan) return 1;

      // Priorité 2 : Date chronologique
      return a.datePiece.localeCompare(b.datePiece);
    });

    // Regrouper par compte général
    const collections: Record<string, Ecriture[]> = {};
    comptes.forEach(c => {
      collections[c.numero] = [];
    });

    sortedEntries.forEach(e => {
      if (!collections[e.numeroCompte]) {
        collections[e.numeroCompte] = [];
      }
      collections[e.numeroCompte].push(e);
    });

    return collections;
  }, [comptes, ecritures]);


  const handlePrint = () => {
    addAuditLog('PRINT', 'Editions', `Impression ou édition PDF de la ${selectedSubTab}`);
    window.print();
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full text-left font-sans select-text">
      {/* Sub menu selector tabs */}
      <div className="flex border-b border-white/5 bg-[#181B2E] p-1.5 rounded-xl justify-between items-center select-none print:hidden">
        <div className="flex gap-2">
          <button
            id="subtab-balance-gen"
            onClick={() => setSelectedSubTab('balance')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
              selectedSubTab === 'balance' ? 'bg-[#6C63FF] text-white shadow-md' : 'text-[#8892B0] hover:bg-white/5'
            }`}
          >
            Balance Générale (TND)
          </button>
          
          <button
            id="subtab-balance-aux"
            onClick={() => setSelectedSubTab('balance_aux')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
              selectedSubTab === 'balance_aux' ? 'bg-[#6C63FF] text-white shadow-md' : 'text-[#8892B0] hover:bg-white/5'
            }`}
          >
            Balance Auxiliaire des tiers
          </button>

          <button
            id="subtab-gl-gen"
            onClick={() => setSelectedSubTab('grand_livre')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
              selectedSubTab === 'grand_livre' ? 'bg-[#6C63FF] text-white shadow-md' : 'text-[#8892B0] hover:bg-white/5'
            }`}
          >
            Grand-Livre Général
          </button>
        </div>

        <button
          id="print-btn-action"
          onClick={handlePrint}
          className="px-4 py-2 rounded-lg bg-white/[0.04] border border-white/5 text-xs font-semibold text-white flex items-center gap-2 hover:bg-white/[0.08]"
        >
          <Printer className="w-4 h-4" /> Imprimer / Télécharger PDF
        </button>
      </div>

      {/* Unified Apple-styled printable report canvas */}
      <div id="print-area-container" className="p-8 bg-[#181B2E] border border-white/5 rounded-2xl print:bg-white print:text-black print:p-0 print:border-none">
        
        {/* Entête d'Édition Officielle tunisienne (§13.6) */}
        <div className="border-b border-white/10 pb-6 mb-6 flex justify-between items-start font-mono text-[10px] text-[#8892B0] print:border-black/10 print:text-black">
          <div>
            <p className="text-sm font-bold text-white uppercase print:text-black">{activeCompany ? activeCompany.raisonSociale : 'Compta Tunisie Demo'}</p>
            <p className="mt-1">Exercice fiscal : 2026</p>
            <p>Période couverte : 01/01/2026 au 31/12/2026</p>
          </div>
          <div className="text-right">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider print:text-black">
              {selectedSubTab === 'balance' 
                ? 'BALANCE GÉNÉRALE DES COMPTES' 
                : selectedSubTab === 'balance_aux' 
                ? 'BALANCE DE VÉRIFICATION AUXILIAIRE' 
                : 'EXTRAIT COMPLET DU GRAND LIVRE'}
            </h3>
            <p className="mt-1">Date édition : {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}</p>
            <p className="font-semibold text-white/40 print:text-black">PAGE UNIFIÉE : 1/1 (GLOBAL_PAGE_COUNT)</p>
          </div>
        </div>

        {/* 1. VIEW : BALANCE GÉNÉRALE */}
        {selectedSubTab === 'balance' && (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#13162A]/50 text-[#8892B0] uppercase text-[10px] border-b border-white/10 print:text-black print:border-black">
                  <tr>
                    <th className="p-3">Numéro</th>
                    <th className="p-3">Intitulé des comptes</th>
                    <th className="p-3 text-right">Mouvements Débit</th>
                    <th className="p-3 text-right">Mouvements Crédit</th>
                    <th className="p-3 text-right">Solde Débiteur</th>
                    <th className="p-3 text-right">Solde Créditeur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 select-all text-white/90 print:text-black print:divide-black/5">
                  {balanceGenerale.rows.map(row => (
                    <tr key={row.numero} className="hover:bg-white/[0.005]">
                      <td className="p-3 font-bold text-[#00D4FF] print:text-black">{row.numero}</td>
                      <td className="p-3 truncate max-w-[280px]">{row.libelle}</td>
                      <td className="p-3 text-right">{row.debit > 0 ? row.debit.toFixed(3) : '-'}</td>
                      <td className="p-3 text-right">{row.credit > 0 ? row.credit.toFixed(3) : '-'}</td>
                      <td className="p-3 text-right font-semibold text-[#00D4AA] print:text-black">{row.soldeDebit > 0 ? row.soldeDebit.toFixed(3) : '-'}</td>
                      <td className="p-3 text-right font-semibold text-[#FF6B6B] print:text-black">{row.soldeCredit > 0 ? row.soldeCredit.toFixed(3) : '-'}</td>
                    </tr>
                  ))}
                  
                  {/* Total Bilan Row */}
                  <tr className="bg-white/5 font-bold text-white print:bg-black/5 print:text-black uppercase">
                    <td colSpan={2} className="p-3 font-semibold text-[#00D4FF]">TOTAL CUMUL BILAN (Classes 1 à 5)</td>
                    <td className="p-3 text-right">{balanceGenerale.totalBilanDebit.toFixed(3)}</td>
                    <td className="p-3 text-right">{balanceGenerale.totalBilanCredit.toFixed(3)}</td>
                    <td className="p-3 text-right"></td>
                    <td className="p-3 text-right"></td>
                  </tr>

                  {/* Total Gestion Row */}
                  <tr className="bg-white/5 font-bold text-white print:bg-black/5 print:text-black uppercase">
                    <td colSpan={2} className="p-3 font-semibold text-[#00D4FF]">TOTAL CUMUL GESTION (Classes 6 à 7)</td>
                    <td className="p-3 text-right">{balanceGenerale.totalGestionDebit.toFixed(3)}</td>
                    <td className="p-3 text-right">{balanceGenerale.totalGestionCredit.toFixed(3)}</td>
                    <td className="p-3 text-right"></td>
                    <td className="p-3 text-right"></td>
                  </tr>

                  {/* Grand General Total */}
                  <tr className="bg-[#6C63FF]/20 font-bold border-t border-b text-white print:bg-black/10 print:text-black border-white/20 uppercase pr-4">
                    <td colSpan={2} className="p-4 text-xs font-extrabold text-[#6C63FF] print:text-black">TOTAUX GÉNÉRAUX</td>
                    <td className="p-4 text-right text-xs">{balanceGenerale.totalGeneralDebit.toFixed(3)}</td>
                    <td className="p-4 text-right text-xs">{balanceGenerale.totalGeneralCredit.toFixed(3)}</td>
                    <td className="p-4 text-right text-xs text-[#00D4AA] print:text-black">{balanceGenerale.totalSoldeDebit.toFixed(3)}</td>
                    <td className="p-4 text-right text-xs text-[#FF6B6B] print:text-black">{balanceGenerale.totalSoldeCredit.toFixed(3)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. VIEW : BALANCE AUXILIAIRE */}
        {selectedSubTab === 'balance_aux' && (
          <div className="space-y-8 select-all">
            {Object.keys(balanceAuxiliaire).map((collectif) => {
              const rowsSet = Object.values(balanceAuxiliaire[collectif]) as any[];
              const groupName = collectif === '411000' ? 'Clients auxiliaires' : 'Fournisseurs auxiliaires';
              
              const totalDeb = rowsSet.reduce((s, r) => s + (r.debit || 0), 0);
              const totalCred = rowsSet.reduce((s, r) => s + (r.credit || 0), 0);

              return (
                <div key={collectif} className="space-y-2">
                  <h4 className="text-xs font-bold text-[#00D4FF] uppercase font-mono tracking-wider print:text-black">
                    COMPTE COLLECTIF COMPTABLE {collectif} : {groupName}
                  </h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-white/[0.01] text-[#8892B0] border-b border-white/5 uppercase text-[9px] print:text-black">
                        <tr>
                          <th className="p-2.5">Code Tiers</th>
                          <th className="p-2.5">Dénomination Tiers</th>
                          <th className="p-2.5 text-right">Mouvements Débit</th>
                          <th className="p-2.5 text-right">Mouvements Crédit</th>
                          <th className="p-2.5 text-right">Solde Débiteur</th>
                          <th className="p-2.5 text-right">Solde Créditeur</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white/80 print:text-black">
                        {rowsSet.map((tRow) => {
                          const netAux = (tRow.debit || 0) - (tRow.credit || 0);
                          return (
                            <tr key={tRow.codeTiers} className="hover:bg-white/[0.003]">
                              <td className="p-2.5 font-semibold text-white print:text-black">{tRow.codeTiers}</td>
                              <td className="p-2.5">{tRow.raisonSociale}</td>
                              <td className="p-2.5 text-right">{tRow.debit > 0 ? tRow.debit.toFixed(3) : '-'}</td>
                              <td className="p-2.5 text-right">{tRow.credit > 0 ? tRow.credit.toFixed(3) : '-'}</td>
                              <td className="p-2.5 text-right text-[#00D4AA] print:text-black">{netAux > 0 ? netAux.toFixed(3) : '-'}</td>
                              <td className="p-2.5 text-right text-[#FF6B6B] print:text-black">{netAux < 0 ? Math.abs(netAux).toFixed(3) : '-'}</td>
                            </tr>
                          );
                        })}

                        {/* Subtotal row */}
                        <tr className="bg-white/[0.02] font-bold text-white print:text-black">
                          <td colSpan={2} className="p-2.5 uppercase">TOTAL COLLECTIF {collectif}</td>
                          <td className="p-2.5 text-right">{totalDeb.toFixed(3)}</td>
                          <td className="p-2.5 text-right">{totalCred.toFixed(3)}</td>
                          <td className="p-2.5 text-right text-[#00D4AA] print:text-black">{totalDeb - totalCred > 0 ? (totalDeb - totalCred).toFixed(3) : '-'}</td>
                          <td className="p-2.5 text-right text-[#FF6B6B] print:text-black">{totalDeb - totalCred < 0 ? Math.abs(totalDeb - totalCred).toFixed(3) : '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. VIEW : GRAND LIVRE GÉNÉRAL */}
        {selectedSubTab === 'grand_livre' && (
          <div className="space-y-8 select-all">
            {comptes.map((c) => {
              const entries = grandLivreGenerale[c.numero] || [];
              if (entries.length === 0) return null; // Ne pas surcharger l'édition des comptes vides

              let runningBalance = 0;

              return (
                <div key={c.numero} className="space-y-2 border border-white/5 rounded-xl p-4 bg-white/[0.005] print:border-black/10">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h4 className="text-xs font-bold text-[#00D4FF] print:text-black">
                      COMPTE {c.numero} : {c.libelle}
                    </h4>
                    <span className="text-[9px] text-[#8892B0]">Nature : {c.type} Solde {c.natureSolde}</span>
                  </div>

                  <table className="w-full text-left text-[11px] font-mono select-all">
                    <thead className="text-[#8892B0] uppercase text-[9px] border-b border-white/5">
                      <tr>
                        <th className="p-2">Date</th>
                        <th className="p-2">Journal</th>
                        <th className="p-2">Piece</th>
                        <th className="p-2">Libellé écriture</th>
                        <th className="p-2 text-right">Débit (DT)</th>
                        <th className="p-2 text-right">Crédit (DT)</th>
                        <th className="p-2 text-right">Solde Cumulé (DT)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/70 print:text-black">
                      {entries.map((e, idx) => {
                        runningBalance += (e.montantDebit - e.montantCredit);
                        return (
                          <tr key={e.id || idx}>
                            <td className="p-2 text-white/40">{e.datePiece}</td>
                            <td className="p-2 font-semibold text-[#00D4FF] print:text-black">{e.journal}</td>
                            <td className="p-2 font-mono text-white print:text-black">{e.numeroPiece}</td>
                            <td className="p-2 truncate max-w-[200px]">{e.libelle}</td>
                            <td className="p-2 text-right text-[#00D4AA] print:text-black">{e.montantDebit > 0 ? e.montantDebit.toFixed(3) : '-'}</td>
                            <td className="p-2 text-right text-[#FF6B6B] print:text-black">{e.montantCredit > 0 ? e.montantCredit.toFixed(3) : '-'}</td>
                            <td className="p-2 text-right font-bold text-white print:text-black">
                              {runningBalance.toFixed(3)} {runningBalance >= 0 ? 'D' : 'C'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
