/**
 * Composant EcheancesModule : Suivi de l'échéancier clients/fournisseurs,
 * gestion de litiges, relances clients, et prévisionnel de trésorerie réactif.
 */

import React, { useState, useMemo } from 'react';
import { Echeance, Tiers } from '../types';
import { 
  FileText, CalendarCheck, AlertTriangle, 
  Send, HelpCircle, CheckCircle, TrendingUp, Search 
} from 'lucide-react';

interface EcheancesModuleProps {
  echeances: Echeance[];
  tiers: Tiers[];
  onSetEcheances: (list: Echeance[]) => void;
}

export default function EcheancesModule({ echeances, tiers, onSetEcheances }: EcheancesModuleProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'a_payer' | 'paye' | 'impaye'>('all');

  // Relancer un client (Incrémenter le compteur)
  const handleIncreaseRelance = (eId: string) => {
    const updated = echeances.map(e => {
      if (e.id === eId) {
        return { ...e, relance: e.relance + 1 };
      }
      return e;
    });
    onSetEcheances(updated);
    alert('Relance client notifiée et enregistrée.');
  };

  // Basculer l'état de litige
  const handleToggleLitige = (eId: string) => {
    const updated = echeances.map(e => {
      if (e.id === eId) {
        return { ...e, litige: !e.litige };
      }
      return e;
    });
    onSetEcheances(updated);
  };

  // Calculs de synthèse des échéances
  const totals = useMemo(() => {
    let clientsAmt = 0;
    let suppliersAmt = 0;
    let lateMaturitiesAmt = 0;
    
    echeances.forEach(e => {
      if (e.statut === 'paye') return;
      const partner = tiers.find(t => t.id === e.idTiers);
      if (!partner) return;

      if (partner.type === 'Client') {
        clientsAmt += e.montantReste;
        // Si date de règlement dépassée (Fictive: Aujourd'hui = 2026-05-28)
        if (new Date(e.dateEcheance) < new Date('2026-05-28')) {
          lateMaturitiesAmt += e.montantReste;
        }
      } else if (partner.type === 'Fournisseur') {
        suppliersAmt += e.montantReste;
      }
    });

    return { clientsAmt, suppliersAmt, lateMaturitiesAmt };
  }, [echeances, tiers]);

  // Filtrage
  const filteredEcheances = useMemo(() => {
    return echeances.filter(e => {
      const partner = tiers.find(t => t.id === e.idTiers);
      const nameMatch = partner?.raisonSociale.toLowerCase().includes(search.toLowerCase()) || e.numeroPiece.includes(search);
      const typeMatch = filterType === 'all' || e.statut === filterType;
      return nameMatch && typeMatch;
    });
  }, [echeances, tiers, search, filterType]);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full text-left font-sans select-text">
      {/* Top Header */}
      <div className="flex justify-between items-center bg-[#181B2E] p-4 rounded-xl border border-white/5">
        <div>
          <h3 className="text-base font-semibold text-white">Échéancier de Trésorerie &amp; Prévisionnel</h3>
          <p className="text-xs text-[#8892B0]">Monitorez vos créances clients à encaisser et vos dettes fournisseurs réglementaires.</p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
        {/* Clients outstanding */}
        <div className="p-5 bg-[#181B2E] border border-white/5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00D4FF] to-transparent" />
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-[#8892B0]">Créances Clients (À Encaisser)</span>
            <span className="text-xs text-[#00D4FF] font-mono">En portefeuille</span>
          </div>
          <p className="text-xl font-bold font-mono text-white mt-2">
            {totals.clientsAmt.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} <span className="text-xs">DT</span>
          </p>
          <p className="text-[10px] text-[#8892B0]">Garant des encaissements de trésorerie brute</p>
        </div>

        {/* Suppliers outstanding */}
        <div className="p-5 bg-[#181B2E] border border-white/5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF6B6B] to-transparent" />
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-[#8892B0]">Dettes Fournisseurs (À Régler)</span>
            <span className="text-xs text-[#FF6B6B] font-mono">Dépenses prévues</span>
          </div>
          <p className="text-xl font-bold font-mono text-white mt-2">
            {totals.suppliersAmt.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} <span className="text-xs">DT</span>
          </p>
          <p className="text-[10px] text-[#8892B0]">Trésorerie engagée dans le cycle de production d'achat</p>
        </div>

        {/* Overdue Clients */}
        <div className="p-5 bg-[#181B2E] border border-white/5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FDCB6E] to-transparent" />
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-[#8892B0]">Créances Client en Retard (&gt;0j)</span>
            <AlertTriangle className="w-4 h-4 text-[#FDCB6E] animate-pulse" />
          </div>
          <p className="text-xl font-bold font-mono text-[#FDCB6E] mt-2">
            {totals.lateMaturitiesAmt.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} <span className="text-xs">DT</span>
          </p>
          <p className="text-[10px] text-[#8892B0]">Soumises à relance administrative immédiate</p>
        </div>
      </div>

      {/* Cash Flow Forecast bar chart visual */}
      <div className="p-5 bg-[#181B2E] border border-white/5 rounded-2xl shadow-sm">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 font-mono text-[#00D4FF]">
          Chronologie Prévisionnelle des Flux d'Écheances Prochaines
        </h4>
        <p className="text-xs text-[#8892B0] mb-4">Chronologie d'encaissement et de décaissement planifiée sur les 3 prochains mois.</p>
        
        {/* Simple visual timeline grid bar */}
        <div className="grid grid-cols-3 gap-4 font-mono select-none">
          <div className="bg-[#13162A] p-4 rounded-xl border border-white/5">
            <p className="text-xs font-semibold text-white">Juin 2026</p>
            <div className="flex items-center gap-1.5 mt-2.5">
              <div className="h-4 w-1 bg-[#00D4AA] rounded" />
              <span className="text-[10px] text-[#8892B0]">Encaissement estimé :</span>
              <span className="text-xs text-[#00D4AA] font-bold">18 500 DT</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="h-4 w-1 bg-[#FF6B6B] rounded" />
              <span className="text-[10px] text-[#8892B0]">Décaissement estimé :</span>
              <span className="text-xs text-[#FF6B6B] font-bold">8 500 DT</span>
            </div>
          </div>

          <div className="bg-[#13162A] p-4 rounded-xl border border-white/5">
            <p className="text-xs font-semibold text-white">Juillet 2026</p>
            <div className="flex items-center gap-1.5 mt-2.5">
              <div className="h-4 w-1 bg-[#00D4AA] rounded" />
              <span className="text-[10px] text-[#8892B0]">Encaissement estimé :</span>
              <span className="text-xs text-[#00D4AA] font-bold">12 400 DT</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="h-4 w-1 bg-[#FF6B6B] rounded" />
              <span className="text-[10px] text-[#8892B0]">Décaissement estimé :</span>
              <span className="text-xs text-[#FF6B6B] font-bold">11 900 DT</span>
            </div>
          </div>

          <div className="bg-[#13162A] p-4 rounded-xl border border-white/5">
            <p className="text-xs font-semibold text-white">Août 2026</p>
            <div className="flex items-center gap-1.5 mt-2.5">
              <div className="h-4 w-1 bg-[#00D4AA] rounded" />
              <span className="text-[10px] text-[#8892B0]">Encaissement estimé :</span>
              <span className="text-xs text-[#00D4AA] font-bold">29 000 DT</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="h-4 w-1 bg-[#FF6B6B] rounded" />
              <span className="text-[10px] text-[#8892B0]">Décaissement estimé :</span>
              <span className="text-xs text-[#FF6B6B] font-bold">4 000 DT</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table filters & entries display */}
      <div className="bg-[#181B2E] border border-white/5 rounded-xl shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/[0.01]">
          <div className="flex gap-2 select-none">
            {['all', 'a_payer', 'paye', 'impaye'].map(type => (
              <button
                id={`filter-echeance-${type}`}
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterType === type 
                    ? 'bg-[#6C63FF] text-white shadow' 
                    : 'bg-[#13162A] text-[#8892B0] hover:bg-white/5'
                }`}
              >
                {type === 'all' ? 'Toutes les échéances' : type === 'a_payer' ? 'À Encaisser / Payer' : type === 'paye' ? 'Soldées / Validées' : 'Impayées en souffrance'}
              </button>
            ))}
          </div>

          <div className="relative w-80">
            <Search className="w-4 h-4 text-[#8892B0] absolute left-3 top-2.5" />
            <input
              id="search-echeance"
              type="text"
              placeholder="Chercher par tiers ou N° pièce..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 pl-9 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
            />
          </div>
        </div>

        {/* Entries */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white">
            <thead className="bg-[#13162A]/50 text-[#8892B0] uppercase text-[10px] tracking-widest font-mono">
              <tr>
                <th className="p-3">Auxiliaire</th>
                <th className="p-3">N° Pièce Origine</th>
                <th className="p-3">Échéance d'effet</th>
                <th className="p-3 text-right">Montant Initial</th>
                <th className="p-3 text-right">Montant Restant</th>
                <th className="p-3">Statut Dossier</th>
                <th className="p-3">Indicateur Litige</th>
                <th className="p-3">Actions de relance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredEcheances.map((e) => {
                const partner = tiers.find(t => t.id === e.idTiers);
                return (
                  <tr key={e.id} className="hover:bg-white/[0.005] transition-colors">
                    <td className="p-3">
                      <p className="font-semibold text-white">{partner ? partner.raisonSociale : 'Inconnu'}</p>
                      <p className="text-[10px] text-[#8892B0] font-mono">{partner ? partner.type : ''} | Code {partner ? partner.code : ''}</p>
                    </td>
                    <td className="p-3 text-white font-semibold font-mono">{e.numeroPiece}</td>
                    <td className="p-3 text-[#00D4FF] font-mono">{e.dateEcheance}</td>
                    <td className="p-3 text-right font-semibold text-white/80">{e.montantInitial.toLocaleString('fr-FR', { minimumFractionDigits: 3 })}</td>
                    <td className="p-3 text-right font-bold text-white">{e.montantReste.toLocaleString('fr-FR', { minimumFractionDigits: 3 })}</td>
                    
                    {/* Statut Badge */}
                    <td className="p-3 select-none">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        e.statut === 'paye' 
                          ? 'bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/20' 
                          : e.statut === 'partiel' 
                          ? 'bg-[#FDCB6E]/10 text-[#FDCB6E] border border-[#FDCB6E]/20' 
                          : 'bg-[#FF6B6B]/10 text-[#FF6B6B] border border-[#FF6B6B]/20'
                      }`}>
                        {e.statut === 'paye' ? 'soldé' : e.statut === 'partiel' ? 'partiel' : 'non payé'}
                      </span>
                    </td>

                    {/* Litige checkbox trigger */}
                    <td className="p-3 select-none">
                      <button
                        id={`toggle-litige-${e.id}`}
                        onClick={() => handleToggleLitige(e.id)}
                        className={`px-2 py-0.5 rounded text-[9px] font-semibold border transition-all ${
                          e.litige 
                            ? 'bg-[#FF6B6B]/15 text-[#FF6B6B] border-[#FF6B6B]/30' 
                            : 'bg-white/5 text-[#8892B0] border-white/5 hover:bg-white/10'
                        }`}
                      >
                        {e.litige ? 'LITIGE ACTIF' : 'PAS DE LITIGE'}
                      </button>
                    </td>

                    {/* Actions relance */}
                    <td className="p-3">
                      {partner?.type === 'Client' && e.statut !== 'paye' ? (
                        <div className="flex items-center gap-2 select-none">
                          <button
                            id={`relancer-client-${e.id}`}
                            onClick={() => handleIncreaseRelance(e.id)}
                            className="p-1 px-2 rounded bg-[#6C63FF]/15 border border-[#6C63FF]/20 text-xs font-semibold text-[#8892B0] hover:text-white flex items-center gap-1 transition-colors"
                          >
                            <Send className="w-3 h-3" /> Relance ({e.relance})
                          </button>
                        </div>
                      ) : (
                        <span className="text-white/20 italic text-[10px]">Non requise</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredEcheances.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-white/30 font-mono">
                    Aucune maturité d'échéance à afficher pour le moment.
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
