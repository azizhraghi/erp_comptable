/**
 * Composant TiersView : Gestion des tiers (auxiliaires clients/fournisseurs).
 * Calcule l'encours et la balance âgée d'analyse de crédits (0-30j, 31-60j, 61-90j, +90j) en temps réel.
 */

import React, { useState, useMemo } from 'react';
import { Tiers, Echeance } from '../types';
import { 
  Plus, Users, Phone, Mail, FileText, 
  MapPin, CheckCircle, Search, TrendingUp, AlertTriangle 
} from 'lucide-react';
import { addAuditLog } from '../lib/storage';

interface TiersViewProps {
  tiers: Tiers[];
  echeances: Echeance[];
  onSaveTiers: (list: Tiers[]) => void;
}

export default function TiersView({ tiers, echeances, onSaveTiers }: TiersViewProps) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'Client' | 'Fournisseur'>('all');
  const [showAdd, setShowAdd] = useState(false);

  const [newTiers, setNewTiers] = useState({
    code: '',
    compteCollectif: '411000',
    type: 'Client' as Tiers['type'],
    raisonSociale: '',
    nomContact: '',
    adresse: '',
    ville: 'Tunis',
    pays: 'Tunisie',
    telephone: '',
    email: '',
    mf: '',
    rc: '',
    rib: '',
    banque: '',
    devise: 'TND',
    modeReglement: 'Virement',
    delaiPaiement: 30,
    plafondCredit: 20000
  });

  // Calcul du fardeau d'encours de crédit par Tiers
  const agedBalancesAndDebts = useMemo(() => {
    const today = new Date('2026-05-28'); // Temps d'exécution courant comme spécifié par les metacorner
    const result: Record<string, { 
      totalDue: number; 
      r0_30: number; 
      r31_60: number; 
      r61_90: number; 
      rAbove90: number;
    }> = {};

    // Initialisation
    tiers.forEach(t => {
      result[t.id] = { totalDue: 0, r0_30: 0, r31_60: 0, r61_90: 0, rAbove90: 0 };
    });

    // Évaluation des échéances échues ou à venir
    echeances.forEach(e => {
      if (e.statut === 'paye') return;
      const tId = e.idTiers;
      if (!result[tId]) return;

      const amt = e.montantReste;
      result[tId].totalDue += amt;

      const dueDate = new Date(e.dateEcheance);
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        // Pas en retard
        result[tId].r0_30 += amt;
      } else if (diffDays <= 30) {
        result[tId].r0_30 += amt;
      } else if (diffDays <= 60) {
        result[tId].r31_60 += amt;
      } else if (diffDays <= 90) {
        result[tId].r61_90 += amt;
      } else {
        result[tId].rAbove90 += amt;
      }
    });

    return result;
  }, [tiers, echeances]);

  // Ajouter un nouveau tiers auxiliaire
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTiers.code || !newTiers.raisonSociale) {
      alert('Veuillez remplir le code et le nom du partenaire.');
      return;
    }

    const created: Tiers = {
      id: 'tier-' + Math.random().toString(36).substring(2, 9),
      code: newTiers.code.toUpperCase(),
      compteCollectif: newTiers.type === 'Client' ? '411000' : '401000',
      type: newTiers.type,
      raisonSociale: newTiers.raisonSociale,
      nomContact: newTiers.nomContact,
      adresse: newTiers.adresse,
      ville: newTiers.ville,
      pays: newTiers.pays,
      telephone: newTiers.telephone,
      email: newTiers.email,
      mf: newTiers.mf,
      rc: newTiers.rc,
      rib: newTiers.rib,
      banque: newTiers.banque,
      devise: newTiers.devise,
      modeReglement: newTiers.modeReglement,
      delaiPaiement: Number(newTiers.delaiPaiement),
      plafondCredit: Number(newTiers.plafondCredit),
      actif: true
    };

    onSaveTiers([...tiers, created]);
    addAuditLog('CREATE', 'Tiers', `Création de fiche auxiliaire ${created.type} : ${created.code} - ${created.raisonSociale}`);
    setShowAdd(false);
    setNewTiers({
      code: '',
      compteCollectif: '411000',
      type: 'Client',
      raisonSociale: '',
      nomContact: '',
      adresse: '',
      ville: 'Tunis',
      pays: 'Tunisie',
      telephone: '',
      email: '',
      mf: '',
      rc: '',
      rib: '',
      banque: '',
      devise: 'TND',
      modeReglement: 'Virement',
      delaiPaiement: 30,
      plafondCredit: 20000
    });
  };

  const filteredTiers = useMemo(() => {
    return tiers.filter(t => {
      const matchSearch = t.code.includes(search.toUpperCase()) || t.raisonSociale.toLowerCase().includes(search.toLowerCase());
      const matchType = selectedType === 'all' || t.type === selectedType;
      return matchSearch && matchType;
    });
  }, [tiers, search, selectedType]);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full text-left">
      {/* View Header */}
      <div className="flex justify-between items-center bg-[#181B2E] p-4 rounded-xl border border-white/5">
        <div>
          <h3 className="text-base font-semibold text-white">Gestion des Comptes de Tiers (Auxiliaires)</h3>
          <p className="text-xs text-[#8892B0]">Gérez la base des clients, fournisseurs et associés avec suivi d'encours en temps réel.</p>
        </div>
        <button
          id="add-tiers-btn"
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 rounded-lg bg-[#6C63FF] hover:bg-[#6C63FF]/90 text-xs font-semibold text-white flex items-center gap-2 transition-all font-mono"
        >
          <Plus className="w-3.5 h-3.5" />
          Nouveau Partenaire Auxiliaire
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAddSubmit} className="p-6 bg-[#181B2E] border border-white/5 rounded-xl space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Fiche Création Tiers</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-1">Type de Tiers</label>
              <select
                id="form-tier-type"
                value={newTiers.type}
                onChange={(e) => setNewTiers({ ...newTiers, type: e.target.value as any })}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white"
              >
                <option value="Client">Client (Compte collectif 411)</option>
                <option value="Fournisseur">Fournisseur (Compte collectif 401)</option>
                <option value="Employe">Employé (Compte collectif 421)</option>
                <option value="Autre">Autre Débiteur/Créditeur</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-1">Code Tiers Unique (*)</label>
              <input
                id="form-tier-code"
                type="text"
                placeholder="ex: FO-CIM"
                value={newTiers.code}
                onChange={(e) => setNewTiers({ ...newTiers, code: e.target.value })}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white uppercase"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#8892B0] mb-1">Dénomination / Raison Sociale (*)</label>
              <input
                id="form-tier-name"
                type="text"
                placeholder="ex: CIE CHAUFFAGE TUNISIEN SA"
                value={newTiers.raisonSociale}
                onChange={(e) => setNewTiers({ ...newTiers, raisonSociale: e.target.value })}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-1">Matricule Fiscal (Tiers)</label>
              <input
                id="form-tier-mf"
                type="text"
                placeholder="ex: 0045231/R/A/P/000"
                value={newTiers.mf}
                onChange={(e) => setNewTiers({ ...newTiers, mf: e.target.value })}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-1">Contact Commercial</label>
              <input
                id="form-tier-contact"
                type="text"
                placeholder="ex: Adel Belkadhi"
                value={newTiers.nomContact}
                onChange={(e) => setNewTiers({ ...newTiers, nomContact: e.target.value })}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-1">Téléphone Direct</label>
              <input
                id="form-tier-phone"
                type="text"
                placeholder="ex: +216 22 345 678"
                value={newTiers.telephone}
                onChange={(e) => setNewTiers({ ...newTiers, telephone: e.target.value })}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-1">RIB (20 chiffres) / Banque</label>
              <input
                id="form-tier-rib"
                type="text"
                maxLength={20}
                placeholder="Code RIB de l'auxiliaire"
                value={newTiers.rib}
                onChange={(e) => setNewTiers({ ...newTiers, rib: e.target.value })}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-1">Délai Règlement (Jours)</label>
              <input
                id="form-tier-delai"
                type="number"
                value={newTiers.delaiPaiement}
                onChange={(e) => setNewTiers({ ...newTiers, delaiPaiement: Number(e.target.value) })}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-1">Plafond Crédit autorisé (DT)</label>
              <input
                id="form-tier-ceiling"
                type="number"
                value={newTiers.plafondCredit}
                onChange={(e) => setNewTiers({ ...newTiers, plafondCredit: Number(e.target.value) })}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              id="form-tier-cancel"
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#8892B0]"
            >
              Annuler
            </button>
            <button
              id="form-tier-submit"
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#6C63FF] hover:bg-[#6C63FF]/90 text-xs font-semibold text-white shadow"
            >
              Enregistrer le Tiers
            </button>
          </div>
        </form>
      )}

      {/* Filter Strip */}
      <div className="flex justify-between items-center gap-4 bg-[#181B2E] p-4 rounded-xl border border-white/5">
        <div className="flex gap-2">
          {['all', 'Client', 'Fournisseur'].map((type) => (
            <button
              id={`filter-tier-type-${type}`}
              key={type}
              onClick={() => setSelectedType(type as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedType === type 
                  ? 'bg-[#6C63FF] text-white shadow' 
                  : 'bg-[#13162A] text-[#8892B0] hover:bg-white/5'
              }`}
            >
              {type === 'all' ? 'Tous les tiers' : type + 's'}
            </button>
          ))}
        </div>
        
        <div className="relative w-80">
          <Search className="w-4 h-4 text-[#8892B0] absolute left-3 top-2.5" />
          <input
            id="search-tier"
            type="text"
            placeholder="Rechercher par code ou nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 pl-9 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
          />
        </div>
      </div>

      {/* Tiers Cards & Aged Balances Lists */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-6">
        {filteredTiers.map((t) => {
          const aging = agedBalancesAndDebts[t.id] || { totalDue: 0, r0_30: 0, r31_60: 0, r61_90: 0, rAbove90: 0 };
          const limitBreached = aging.totalDue > t.plafondCredit;

          return (
            <div key={t.id} className="p-5 bg-[#181B2E] border border-white/5 rounded-2xl flex flex-col justify-between hover:border-white/10 transition-colors shadow-sm">
              {/* Partner identity */}
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      t.type === 'Client' 
                        ? 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20' 
                        : 'bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/20'
                    }`}>
                      {t.type}
                    </span>
                    <h4 className="text-sm font-bold text-white tracking-wide mt-1.5 truncate max-w-[280px]">
                      {t.raisonSociale}
                    </h4>
                    <p className="text-[10px] text-[#8892B0] font-mono mt-0.5">Code auxil : {t.code} / Compte col. : {t.compteCollectif}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#8892B0]">Reste à régler</p>
                    <p className="text-sm font-bold text-white font-mono mt-0.5">
                      {aging.totalDue.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 p-3 rounded-xl bg-white/[0.01] border border-white/5 text-xs">
                  {/* Coordonnées */}
                  <div className="space-y-1 text-[#8892B0]">
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-[#6C63FF]" /> {t.telephone || 'Non renseigné'}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-[#6C63FF] truncate" /> <span className="truncate">{t.email || 'Aucun mail'}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-[#6C63FF] truncate" /> <span className="truncate">{t.ville}, {t.pays}</span>
                    </p>
                  </div>

                  {/* Limits */}
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between text-[#8892B0]">
                      <span>MF Tunisien :</span>
                      <span className="text-white select-all">{t.mf || 'Aucun'}</span>
                    </div>
                    <div className="flex justify-between text-[#8892B0]">
                      <span>Délai payé :</span>
                      <span className="text-white">{t.delaiPaiement} jours</span>
                    </div>
                    <div className="flex justify-between text-[#8892B0]">
                      <span>Limite encours :</span>
                      <span className="text-white font-semibold">{t.plafondCredit.toLocaleString()} DT</span>
                    </div>
                  </div>
                </div>

                {/* Aged Balance Visual Panel */}
                <div>
                  <h5 className="text-[10px] uppercase font-bold text-[#8892B0] tracking-wider mb-2 font-mono">
                    Balance Âgée d'Analyse des Échéances
                  </h5>
                  <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[10px]">
                    <div className="bg-[#13162A] p-2 rounded-lg border border-white/[0.03]">
                      <p className="text-white/40">0 - 30 j</p>
                      <p className="font-semibold text-white mt-0.5">{aging.r0_30.toLocaleString()} DT</p>
                    </div>
                    <div className="bg-[#13162A] p-2 rounded-lg border border-white/[0.03]">
                      <p className="text-white/40">31 - 60 j</p>
                      <p className={`font-semibold mt-0.5 ${aging.r31_60 > 0 ? 'text-[#FDCB6E]' : 'text-white'}`}>
                        {aging.r31_60.toLocaleString()} DT
                      </p>
                    </div>
                    <div className="bg-[#13162A] p-2 rounded-lg border border-white/[0.03]">
                      <p className="text-white/40">61 - 90 j</p>
                      <p className={`font-semibold mt-0.5 ${aging.r61_90 > 0 ? 'text-[#FF6B6B]' : 'text-white'}`}>
                        {aging.r61_90.toLocaleString()} DT
                      </p>
                    </div>
                    <div className="bg-[#13162A] p-2 rounded-lg border border-white/[0.03]">
                      <p className="text-white/40">90+ j</p>
                      <p className={`font-bold mt-0.5 ${aging.rAbove90 > 0 ? 'text-[#FF6B6B] animate-pulse' : 'text-white'}`}>
                        {aging.rAbove90.toLocaleString()} DT
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger triggers */}
              {limitBreached && (
                <div className="mt-4 p-2 bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 rounded-lg flex items-center gap-2 text-[10px] text-[#FF6B6B] font-mono font-semibold">
                  <AlertTriangle className="w-4 h-4 animate-bounce" />
                  <span>DANGER : Limite d'encours de crédit franchie ({aging.totalDue.toLocaleString()} DT &gt; {t.plafondCredit.toLocaleString()} DT)</span>
                </div>
              )}
            </div>
          );
        })}

        {filteredTiers.length === 0 && (
          <div className="col-span-2 text-center p-12 bg-[#181B2E] border border-white/5 rounded-2xl text-white/40 font-mono">
            Aucun partenaire auxiliaire n'a été répertorié pour le moment.
          </div>
        )}
      </div>
    </div>
  );
}
