/**
 * Composant PlanComptableView : Gestion interactive du plan comptable tunisien (SYSCOHADA révisé).
 * Affiche l'arborescence des classes 1 à 7, permet la recherche filtre, l'édition du mapping NEF/Liasse Fiscale,
 * et l'ajout d'un nouveau compte ou sous-compte.
 */

import React, { useState, useMemo } from 'react';
import { Compte } from '../types';
import { Search, Plus, Filter, Edit, Eye, EyeOff, Save, FolderOpen } from 'lucide-react';
import { addAuditLog } from '../lib/storage';

interface PlanComptableViewProps {
  comptes: Compte[];
  onSaveComptes: (comptes: Compte[]) => void;
}

export default function PlanComptableView({ comptes, onSaveComptes }: PlanComptableViewProps) {
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<number | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Formulaire d'ajout
  const [newAccount, setNewAccount] = useState({
    numero: '',
    libelle: '',
    classe: 1,
    type: 'Actif' as Compte['type'],
    natureSolde: 'Debiteur' as Compte['natureSolde'],
    collectif: false,
    lettrable: false,
    rapprochable: false,
    cycleAudit: 'C',
    rubriqueBilan: '',
    rubriqueCr: '',
    rubriqueLiasse: ''
  });

  // Formulaire d'édition de mapping
  const [editFormData, setEditFormData] = useState({
    libelle: '',
    lettrable: false,
    rapprochable: false,
    cycleAudit: '',
    rubriqueBilan: '',
    rubriqueCr: '',
    rubriqueLiasse: '',
    bloque: false
  });

  // Classes Tunisian SYSCOHADA nomenclature
  const classesSYSCOHADA = [
    { num: 1, label: 'Capital, Réserves, Emprunts' },
    { num: 2, label: 'Actifs Immobilisés (Corporels / Incorp.)' },
    { num: 3, label: 'Stocks (Matières, Produits finis)' },
    { num: 4, label: 'Comptes de Tiers (Clients, Fourn, État)' },
    { num: 5, label: 'Trésorerie (Banque, Caisse, Virements)' },
    { num: 6, label: 'Charges d\'Exploitation & Fin.' },
    { num: 7, label: 'Produits d\'Exploitation & Fin.' },
  ];

  // Filtrage du plan comptable
  const filteredComptes = useMemo(() => {
    return comptes.filter(c => {
      const matchSearch = c.numero.includes(search) || c.libelle.toLowerCase().includes(search.toLowerCase());
      const matchClass = selectedClass === 'all' || c.classe === selectedClass;
      return matchSearch && matchClass;
    });
  }, [comptes, search, selectedClass]);

  // Ajouter un nouveau compte
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.numero || !newAccount.libelle) {
      alert('Veuillez remplir les informations indispensables.');
      return;
    }

    const firstDigit = parseInt(newAccount.numero.charAt(0));
    if (isNaN(firstDigit) || firstDigit < 1 || firstDigit > 7) {
      alert('Le numéro de compte doit commencer par un chiffre entre 1 et 7.');
      return;
    }

    const c: Compte = {
      id: 'acc-' + Math.random().toString(36).substring(2, 9),
      numero: newAccount.numero,
      libelle: newAccount.libelle,
      libelleCourt: newAccount.libelle.substring(0, 15),
      classe: firstDigit,
      type: newAccount.type,
      natureSolde: newAccount.natureSolde,
      niveau: newAccount.numero.length <= 3 ? 2 : 3,
      collectif: newAccount.collectif,
      lettrable: newAccount.lettrable,
      rapprochable: newAccount.rapprochable,
      deviseCompte: 'TND',
      reportRan: newAccount.lettrable ? 'detail' : 'solde',
      cycleAudit: newAccount.cycleAudit,
      rubriqueBilan: newAccount.rubriqueBilan || undefined,
      rubriqueCr: newAccount.rubriqueCr || undefined,
      rubriqueLiasse: newAccount.rubriqueLiasse || undefined,
      bloque: false,
      actif: true
    };

    onSaveComptes([...comptes, c]);
    addAuditLog('CREATE', 'Plan Comptable', `Création du compte: ${c.numero} - ${c.libelle}`);
    setShowAddForm(false);
    setNewAccount({
      numero: '',
      libelle: '',
      classe: 1,
      type: 'Actif',
      natureSolde: 'Debiteur',
      collectif: false,
      lettrable: false,
      rapprochable: false,
      cycleAudit: 'C',
      rubriqueBilan: '',
      rubriqueCr: '',
      rubriqueLiasse: ''
    });
  };

  // Édition d'un compte (ouverture du mode édition)
  const startEditing = (c: Compte) => {
    setEditingId(c.id);
    setEditFormData({
      libelle: c.libelle,
      lettrable: c.lettrable,
      rapprochable: c.rapprochable,
      cycleAudit: c.cycleAudit || 'C',
      rubriqueBilan: c.rubriqueBilan || '',
      rubriqueCr: c.rubriqueCr || '',
      rubriqueLiasse: c.rubriqueLiasse || '',
      bloque: c.bloque
    });
  };

  // Enregistrer les modifications d'un compte
  const saveEditing = (id: string) => {
    const updated = comptes.map(c => {
      if (c.id === id) {
        return {
          ...c,
          libelle: editFormData.libelle,
          lettrable: editFormData.lettrable,
          rapprochable: editFormData.rapprochable,
          cycleAudit: editFormData.cycleAudit,
          rubriqueBilan: editFormData.rubriqueBilan || undefined,
          rubriqueCr: editFormData.rubriqueCr || undefined,
          rubriqueLiasse: editFormData.rubriqueLiasse || undefined,
          bloque: editFormData.bloque
        };
      }
      return c;
    });

    onSaveComptes(updated);
    addAuditLog('UPDATE', 'Plan Comptable', `Mise à jour et cartographie NEF du compte id ${id}`);
    setEditingId(null);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full text-left">
      {/* Title block */}
      <div className="flex justify-between items-center bg-[#181B2E] p-4 rounded-xl border border-white/5">
        <div>
          <h3 className="text-base font-semibold text-white">Nomenclature & Plan Comptable Tunisien</h3>
          <p className="text-xs text-[#8892B0]">524 comptes SYSCOHADA pré-mappés avec les rubriques de la liasse fiscale tunisienne.</p>
        </div>
        <button
          id="add-compte-action"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 rounded-lg bg-[#6C63FF] hover:bg-[#6C63FF]/90 text-xs font-semibold text-white flex items-center gap-2 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Ajouter un compte auxiliaire/général
        </button>
      </div>

      {/* Add Account Modal Form */}
      {showAddForm && (
        <form onSubmit={handleAddAccount} className="p-6 bg-[#181B2E] border border-white/5 rounded-xl space-y-4 shadow-lg animate-fadeIn">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Nouveau compte comptable</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-1">Numéro de compte (*)</label>
              <input
                id="acc-new-num"
                type="text"
                maxLength={8}
                placeholder="ex: 411100"
                value={newAccount.numero}
                onChange={(e) => setNewAccount({ ...newAccount, numero: e.target.value })}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-1">Intitulé / Libellé officiel (*)</label>
              <input
                id="acc-new-label"
                type="text"
                placeholder="ex: Clients Sfaxiens"
                value={newAccount.libelle}
                onChange={(e) => setNewAccount({ ...newAccount, libelle: e.target.value })}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-1">Cycle d'audit</label>
              <select
                id="acc-new-cycle"
                value={newAccount.cycleAudit}
                onChange={(e) => setNewAccount({ ...newAccount, cycleAudit: e.target.value })}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white font-mono"
              >
                {['C','D','E','F','G','H','I','J','K','L','M','N','O','P','R','S'].map(char => (
                  <option key={char} value={char}>Cycle {char} (cliquez pour associer)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-1">Type de Compte</label>
              <select
                id="acc-new-type"
                value={newAccount.type}
                onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value as any })}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white shadow"
              >
                <option value="Actif">Actif (Bilan)</option>
                <option value="Passif">Passif (Bilan)</option>
                <option value="Charge">Charge (Compte de résultat)</option>
                <option value="Produit">Produit (Compte de résultat)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-1">Nature de Solde attendu</label>
              <select
                id="acc-new-nature"
                value={newAccount.natureSolde}
                onChange={(e) => setNewAccount({ ...newAccount, natureSolde: e.target.value as any })}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white shadow"
              >
                <option value="Debiteur">Débiteur par défaut</option>
                <option value="Crediteur">Créditeur par défaut</option>
                <option value="Solde">Mixte / Solde ajustable</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                id="acc-new-lettrable"
                type="checkbox"
                checked={newAccount.lettrable}
                onChange={(e) => setNewAccount({ ...newAccount, lettrable: e.target.checked })}
                className="rounded text-[#6C63FF] bg-[#13162A] border-white/10 focus:ring-0"
              />
              <label htmlFor="acc-new-lettrable" className="text-xs text-[#8892B0]">Lettrable (Comptes de tiers)</label>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                id="acc-new-rapp"
                type="checkbox"
                checked={newAccount.rapprochable}
                onChange={(e) => setNewAccount({ ...newAccount, rapprochable: e.target.checked })}
                className="rounded text-[#6C63FF] bg-[#13162A] border-white/10 focus:ring-0"
              />
              <label htmlFor="acc-new-rapp" className="text-xs text-[#8892B0]">Rapprochable (Comptes Banque)</label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-1">Mapping NEF Bilan (A.01 - P.06)</label>
              <input
                id="acc-new-nef-bilan"
                type="text"
                placeholder="ex: A.10 (Clients) / P.04 (Fournisseurs)"
                value={newAccount.rubriqueBilan}
                onChange={(e) => setNewAccount({ ...newAccount, rubriqueBilan: e.target.value })}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-1">Mapping NEF Résultat (R.01 - R.15)</label>
              <input
                id="acc-new-nef-resultat"
                type="text"
                placeholder="ex: R.01 (Ventes) / R.05 (Achats)"
                value={newAccount.rubriqueCr}
                onChange={(e) => setNewAccount({ ...newAccount, rubriqueCr: e.target.value })}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-1">Rubrique liasse tunisienne (F6001-F6005)</label>
              <input
                id="acc-new-liasse"
                type="text"
                placeholder="ex: F6001-31"
                value={newAccount.rubriqueLiasse}
                onChange={(e) => setNewAccount({ ...newAccount, rubriqueLiasse: e.target.value })}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
            <button
              id="acc-cancel-btn"
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#8892B0]"
            >
              Annuler
            </button>
            <button
              id="acc-save-btn"
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#6C63FF] hover:bg-[#6C63FF]/90 text-xs font-semibold text-white shadow-md shadow-[#6C63FF]/25"
            >
              Valider et Créer
            </button>
          </div>
        </form>
      )}

      {/* Classes filtration strip */}
      <div className="flex flex-wrap gap-2">
        <button
          id="class-filter-all"
          onClick={() => setSelectedClass('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            selectedClass === 'all' 
              ? 'bg-[#6C63FF] text-white shadow' 
              : 'bg-[#181B2E] text-[#8892B0] hover:bg-white/5 border border-white/5'
          }`}
        >
          Tous les comptes
        </button>
        {classesSYSCOHADA.map((cl) => (
          <button
            id={`class-filter-${cl.num}`}
            key={cl.num}
            onClick={() => setSelectedClass(cl.num)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              selectedClass === cl.num 
                ? 'bg-[#6C63FF] text-white shadow' 
                : 'bg-[#181B2E] text-[#8892B0] hover:bg-white/5 border border-white/5'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5 shrink-0" />
            Classe {cl.num} : {cl.label.split('(')[0]}
          </button>
        ))}
      </div>

      {/* Search and results list */}
      <div className="bg-[#181B2E] rounded-xl border border-white/5 shadow-sm overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/[0.01]">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#8892B0] absolute left-3 top-2.5" />
            <input
              id="pc-list-search"
              type="text"
              placeholder="Rechercher par numéro ou libellé..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 pl-9 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
            />
          </div>
          <span className="text-xs text-[#8892B0] font-mono">
            {filteredComptes.length} comptes affichés sur {comptes.length} au total
          </span>
        </div>

        {/* List table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white">
            <thead className="bg-white/[0.02] border-b border-white/5 text-[#8892B0] uppercase text-[10px] tracking-wider font-mono">
              <tr>
                <th className="p-4">N° Compte</th>
                <th className="p-4">Libellé Officiel Tunisien</th>
                <th className="p-4">Cycle Audit</th>
                <th className="p-4">Cochages</th>
                <th className="p-4">NEF Bilan / CR</th>
                <th className="p-4">Liasse Fiscale</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredComptes.map((c) => {
                const isEditing = editingId === c.id;
                return (
                  <tr key={c.id} className="hover:bg-white/[0.01] transition-colors">
                    {/* Numéro */}
                    <td className="p-4 font-bold text-[#00D4FF] font-mono select-all">
                      {c.numero}
                    </td>

                    {/* Libellé */}
                    <td className="p-4">
                      {isEditing ? (
                        <input
                          id={`edit-label-${c.id}`}
                          type="text"
                          value={editFormData.libelle}
                          onChange={(e) => setEditFormData({ ...editFormData, libelle: e.target.value })}
                          className="w-full bg-[#13162A] border border-white/20 rounded p-1 text-xs text-white"
                        />
                      ) : (
                        <span className={`text-xs ${c.bloque ? 'text-white/30 line-through' : 'text-white'}`}>
                          {c.libelle}
                        </span>
                      )}
                    </td>

                    {/* Cycle d'audit */}
                    <td className="p-4">
                      {isEditing ? (
                        <select
                          id={`edit-cycle-${c.id}`}
                          value={editFormData.cycleAudit}
                          onChange={(e) => setEditFormData({ ...editFormData, cycleAudit: e.target.value })}
                          className="bg-[#13162A] border border-white/20 rounded p-1 text-xs text-white"
                        >
                          {['C','D','E','F','G','H','I','J','K','L','M','N','O','P','R','S'].map(char => (
                            <option key={char} value={char}>Cycle {char}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-[#6C63FF]/15 text-[#6C63FF] font-bold text-[10px] border border-[#6C63FF]/20 select-none">
                          Cycle {c.cycleAudit}
                        </span>
                      )}
                    </td>

                    {/* Lettrable / Rapprochable */}
                    <td className="p-4 flex gap-1.5 pt-4">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <label className="flex items-center gap-1">
                            <input 
                              id={`edit-lettrable-${c.id}`}
                              type="checkbox" 
                              checked={editFormData.lettrable} 
                              onChange={(e) => setEditFormData({ ...editFormData, lettrable: e.target.checked })}
                            />
                            Lettrable
                          </label>
                          <label className="flex items-center gap-1">
                            <input 
                              id={`edit-rapprochable-${c.id}`}
                              type="checkbox" 
                              checked={editFormData.rapprochable} 
                              onChange={(e) => setEditFormData({ ...editFormData, rapprochable: e.target.checked })}
                            />
                            Rapprochable
                          </label>
                        </div>
                      ) : (
                        <>
                          {c.lettrable && (
                            <span className="px-1.5 py-0.5 rounded bg-[#00D4AA]/10 text-[#00D4AA] text-[9px] font-semibold border border-[#00D4AA]/20 select-none">
                              Lettrable
                            </span>
                          )}
                          {c.rapprochable && (
                            <span className="px-1.5 py-0.5 rounded bg-[#74B9FF]/10 text-[#74B9FF] text-[9px] font-semibold border border-[#74B9FF]/20 select-none">
                              Rapprochable
                            </span>
                          )}
                          {!c.lettrable && !c.rapprochable && (
                            <span className="text-[#8892B0] text-[9px]">Standard</span>
                          )}
                        </>
                      )}
                    </td>

                    {/* NEF Mapping */}
                    <td className="p-4 text-xs">
                      {isEditing ? (
                        <div className="space-y-1">
                          <input
                            id={`edit-nef-bilan-${c.id}`}
                            type="text"
                            placeholder="Bilan NEF"
                            value={editFormData.rubriqueBilan}
                            onChange={(e) => setEditFormData({ ...editFormData, rubriqueBilan: e.target.value })}
                            className="w-24 bg-[#13162A] border border-white/20 rounded p-1 text-xs text-white"
                          />
                          <input
                            id={`edit-nef-cr-${c.id}`}
                            type="text"
                            placeholder="CR NEF"
                            value={editFormData.rubriqueCr}
                            onChange={(e) => setEditFormData({ ...editFormData, rubriqueCr: e.target.value })}
                            className="w-24 bg-[#13162A] border border-white/20 rounded p-1 text-xs text-white"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1 font-mono">
                          {c.rubriqueBilan && (
                            <span className="text-[10px] text-white/75">
                              Bilan Code : <strong className="text-white bg-white/5 px-1 py-0.5 rounded">{c.rubriqueBilan}</strong>
                            </span>
                          )}
                          {c.rubriqueCr && (
                            <span className="text-[10px] text-white/75">
                              CR Code : <strong className="text-white bg-white/5 px-1 py-0.5 rounded">{c.rubriqueCr}</strong>
                            </span>
                          )}
                          {!c.rubriqueBilan && !c.rubriqueCr && (
                            <span className="text-white/30 text-[10px]">Non mappé</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Liasse Tunisienne code */}
                    <td className="p-4">
                      {isEditing ? (
                        <input
                          id={`edit-liasse-${c.id}`}
                          type="text"
                          value={editFormData.rubriqueLiasse}
                          onChange={(e) => setEditFormData({ ...editFormData, rubriqueLiasse: e.target.value })}
                          className="w-24 bg-[#13162A] border border-white/10 rounded p-1 text-xs text-white font-mono"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-[#FDCB6E] font-mono">
                          {c.rubriqueLiasse || 'Non assigné'}
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="p-4">
                      {isEditing ? (
                        <button
                          id={`save-edit-btn-${c.id}`}
                          onClick={() => saveEditing(c.id)}
                          className="p-1 px-2 rounded bg-[#00D4AA] hover:bg-[#00D4AA]/80 text-black text-[10px] font-bold tracking-wider flex items-center gap-1 transition-colors"
                        >
                          <Save className="w-3 h-3" /> Save
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            id={`edit-compte-btn-${c.id}`}
                            onClick={() => startEditing(c)}
                            className="p-1.5 rounded bg-white/5 hover:bg-[#6C63FF]/20 text-[#8892B0] hover:text-white transition-colors"
                            title="Configurer le mapping"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`toggle-block-${c.id}`}
                            onClick={() => {
                              const updated = comptes.map(item => {
                                if (item.id === c.id) {
                                  return { ...item, bloque: !item.bloque };
                                }
                                return item;
                              });
                              onSaveComptes(updated);
                              addAuditLog('UPDATE', 'Plan Comptable', `Statut d'inhibition altéré pour le compte ${c.numero}`);
                            }}
                            className={`p-1.5 rounded border border-white/5 transition-colors ${
                              c.bloque 
                                ? 'bg-[#FF6B6B]/10 text-[#FF6B6B] hover:bg-[#FF6B6B]/20' 
                                : 'bg-white/5 text-[#8892B0] hover:text-[#00D4AA]'
                            }`}
                            title={c.bloque ? 'Débloquer pour la saisie' : 'Bloquer le compte'}
                          >
                            {c.bloque ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredComptes.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-white/40 font-mono">
                    Aucun compte ne correspond aux critères de recherche définis.
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
