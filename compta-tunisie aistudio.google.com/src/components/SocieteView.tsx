/**
 * Composant SocieteView : Gestion des entreprises (dossiers).
 * Permet de visualiser, créer, commuter, exporter en JSON indépendant, et importer des sauvegardes de dossiers.
 */

import React, { useState } from 'react';
import { Societe } from '../types';
import { 
  Plus, Download, Upload, Building, 
  MapPin, Clipboard, CheckCircle, Globe, Trash2 
} from 'lucide-react';
import { addAuditLog } from '../lib/storage';

interface SocieteViewProps {
  societes: Societe[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: (societe: Societe) => void;
  onDeleteList: (id: string) => void;
  onImportCompany: (importData: any) => void;
}

export default function SocieteView({ societes, activeId, onSelect, onCreate, onDeleteList, onImportCompany }: SocieteViewProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    raisonSociale: '',
    formeJuridique: 'SA',
    mf: '',
    rc: '',
    adresse: '',
    deviseBase: 'TND',
    multiDevise: true,
    regimeTva: 'Reel' as 'Reel' | 'Forfaitaire' | 'Suspension',
    typeComptabilite: 'Generale' as 'Generale' | 'Developpee' | 'Simplifiee',
    premiereAnnee: false
  });

  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.raisonSociale || !formData.mf) {
      setErrorMsg('Veuillez remplir les champs obligatoires (*)');
      return;
    }

    const newSoc: Societe = {
      id: 'soc-' + Math.random().toString(36).substring(2, 9),
      code: formData.code.toUpperCase(),
      raisonSociale: formData.raisonSociale,
      formeJuridique: formData.formeJuridique,
      mf: formData.mf,
      rc: formData.rc,
      adresse: formData.adresse,
      deviseBase: formData.deviseBase,
      multiDevise: formData.multiDevise,
      dateDebutExercice: '2026-01-01',
      dateFinExercice: '2026-12-31',
      regimeTva: formData.regimeTva,
      typeComptabilite: formData.typeComptabilite,
      actif: true,
      premiereAnnee: formData.premiereAnnee
    };

    onCreate(newSoc);
    addAuditLog('CREATE', 'Sociétés', `Création du nouveau dossier: ${newSoc.raisonSociale}`);
    setShowCreate(false);
    setFormData({
      code: '',
      raisonSociale: '',
      formeJuridique: 'SA',
      mf: '',
      rc: '',
      adresse: '',
      deviseBase: 'TND',
      multiDevise: true,
      regimeTva: 'Reel',
      typeComptabilite: 'Generale',
      premiereAnnee: false
    });
    setErrorMsg('');
  };

  // Exportation d'une entreprise au format JSON
  const handleExportJSON = (soc: Societe) => {
    // Collecter toutes les informations de l'entreprise correspondante depuis le localStorage
    const accounts = localStorage.getItem(`comptes_${soc.id}`);
    const tiers = localStorage.getItem(`tiers_${soc.id}`);
    const exercises = localStorage.getItem(`exercices_${soc.id}`);
    const periods = localStorage.getItem(`periodes_${soc.id}`);
    const entries = localStorage.getItem(`ecritures_${soc.id}`);
    const reconciles = localStorage.getItem(`rapprochements_${soc.id}`);
    const echeances = localStorage.getItem(`echeances_${soc.id}`);
    const notes = localStorage.getItem(`notesRevision_${soc.id}`);
    const thresholds = localStorage.getItem(`seuilControle_${soc.id}`);

    const exportBundle = {
      exportedAt: new Date().toISOString(),
      societe: soc,
      comptes: accounts ? JSON.parse(accounts) : [],
      tiers: tiers ? JSON.parse(tiers) : [],
      exercices: exercises ? JSON.parse(exercises) : [],
      periodes: periods ? JSON.parse(periods) : [],
      ecritures: entries ? JSON.parse(entries) : [],
      rapprochements: reconciles ? JSON.parse(reconciles) : [],
      echeances: echeances ? JSON.parse(echeances) : [],
      notesRevision: notes ? JSON.parse(notes) : [],
      seuilControle: thresholds ? JSON.parse(thresholds) : null
    };

    const str = JSON.stringify(exportBundle, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${soc.code}_${soc.raisonSociale.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addAuditLog('EXPORT', 'Sociétés', `Exportation du dossier ${soc.raisonSociale} en JSON autonome.`);
  };

  // Importation de fichier JSON d'une entreprise
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.societe || !data.societe.id || !data.societe.raisonSociale) {
          alert('Format de sauvegarde incompatible. Propriété "societe" introuvable.');
          return;
        }
        
        // Déclencher le callback d'importation dans le parent
        onImportCompany(data);
        alert(`Dossier "${data.societe.raisonSociale}" restauré avec succès !`);
      } catch (err) {
        alert('Erreur de lecture du fichier JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full text-left">
      {/* View Header with actions */}
      <div className="flex justify-between items-center bg-[#181B2E] p-4 rounded-xl border border-white/5">
        <div>
          <h3 className="text-base font-semibold text-white">Gestion des Dossiers Clients</h3>
          <p className="text-xs text-[#8892B0]">Gérez les profils pour chaque entreprise distinctement (Comptabilité Tunisienne).</p>
        </div>
        <div className="flex gap-2">
          <label className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/5 text-xs font-semibold text-white hover:bg-white/[0.08] cursor-pointer flex items-center gap-2 transition-all">
            <Upload className="w-3.5 h-3.5" />
            Importer Sauvegarde (.json)
            <input 
              id="import-societe-file"
              type="file" 
              accept=".json" 
              onChange={handleImportJSON} 
              className="hidden" 
            />
          </label>
          <button
            id="create-societe-btn"
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 rounded-lg bg-[#6C63FF] hover:bg-[#6C63FF]/90 text-xs font-semibold text-white flex items-center gap-2 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Créer un nouveau Dossier
          </button>
        </div>
      </div>

      {/* Toggle Create Form */}
      {showCreate && (
        <form onSubmit={handleSubmit} className="p-6 bg-[#181B2E] border border-[#6C63FF]/20 rounded-xl space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Formulaire de création de société</h4>
          
          {errorMsg && (
            <div className="p-3 bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 rounded-lg text-xs font-semibold text-[#FF6B6B]">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-1">Code Société (*) </label>
              <input
                id="soc-form-code"
                type="text"
                placeholder="ex: CLI002"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-1">Raison Sociale (*) </label>
              <input
                id="soc-form-raison"
                type="text"
                placeholder="ex: STE CARTHAGE SARL"
                value={formData.raisonSociale}
                onChange={(e) => setFormData({ ...formData, raisonSociale: e.target.value })}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-1">Forme Juridique</label>
              <select
                id="soc-form-forme"
                value={formData.formeJuridique}
                onChange={(e) => setFormData({ ...formData, formeJuridique: e.target.value })}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
              >
                <option value="SA">SA (Société Anonyme)</option>
                <option value="SARL">SARL (Société à Responsabilité Limitée)</option>
                <option value="SUARL">SUARL (Société Unipersonnelle à Responsabilité Limitée)</option>
                <option value="SNC">SNC (Société en Nom Collectif)</option>
                <option value="Physique">Personne Physique</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-1">Matricule Fiscal (MF) (*) </label>
              <input
                id="soc-form-mf"
                type="text"
                placeholder="ex: 1234567/A/M/000"
                value={formData.mf}
                onChange={(e) => setFormData({ ...formData, mf: e.target.value })}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-1">Registre du Commerce (RC)</label>
              <input
                id="soc-form-rc"
                type="text"
                placeholder="ex: B151822026"
                value={formData.rc}
                onChange={(e) => setFormData({ ...formData, rc: e.target.value })}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8892B0] mb-1">Adresse complète</label>
            <input
              id="soc-form-adresse"
              type="text"
              placeholder="ex: Rue El Qods, Menzah V, Tunis"
              value={formData.adresse}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-1">Régime TVA</label>
              <select
                id="soc-form-tva"
                value={formData.regimeTva}
                onChange={(e) => setFormData({ ...formData, regimeTva: e.target.value as any })}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
              >
                <option value="Reel">Réel d'exploitation</option>
                <option value="Forfaitaire">Forfaitaire d'exploitation</option>
                <option value="Suspension">Régime de suspension</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-1">Type de Comptabilité</label>
              <select
                id="soc-form-type"
                value={formData.typeComptabilite}
                onChange={(e) => setFormData({ ...formData, typeComptabilite: e.target.value as any })}
                className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
              >
                <option value="Generale">Comptabilité Générale</option>
                <option value="Developpee">Comptabilité Développée</option>
                <option value="Simplifiee">Comptabilité Simplifiée</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                id="soc-form-premiere"
                type="checkbox"
                checked={formData.premiereAnnee}
                onChange={(e) => setFormData({ ...formData, premiereAnnee: e.target.checked })}
                className="rounded text-[#6C63FF] focus:ring-[#6C63FF] bg-[#13162A] border-white/10"
              />
              <label htmlFor="soc-form-premiere" className="text-xs font-medium text-[#8892B0]">
                Première année d'activité (Exempte RAN oblig.)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              id="cancel-soc-btn"
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#8892B0] transition-colors"
            >
              Annuler
            </button>
            <button
              id="submit-soc-btn"
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#6C63FF] hover:bg-[#6C63FF]/90 text-xs font-semibold text-white shadow-lg transition-all"
            >
              Enregistrer l'entreprise
            </button>
          </div>
        </form>
      )}

      {/* Grid of registered companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {societes.map((soc) => {
          const isActive = soc.id === activeId;
          return (
            <div 
              key={soc.id} 
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isActive 
                  ? 'bg-[#181B2E] border-[#6C63FF] shadow-lg shadow-[#6C63FF]/5' 
                  : 'bg-[#181B2E] border-white/5 hover:border-white/10 shadow-sm'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-gradient-to-tr from-[#6C63FF]/10 to-[#00D4FF]/10 text-[#6C63FF] rounded-xl border border-[#6C63FF]/10">
                    <Building className="w-5 h-5 text-[#6C63FF]" />
                  </div>
                  {isActive ? (
                    <span className="px-2.5 py-1 rounded bg-[#00D4AA]/10 text-[#00D4AA] text-[10px] font-bold tracking-widest uppercase border border-[#00D4AA]/20 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-[#00D4AA]" />
                      DOSSIER ACTIF
                    </span>
                  ) : (
                    <button
                      id={`select-soc-${soc.id}`}
                      onClick={() => onSelect(soc.id)}
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[#8892B0] hover:text-white text-[10px] font-bold tracking-wider uppercase border border-white/5 transition-all"
                    >
                      Rentrer
                    </button>
                  )}
                </div>

                <h4 className="text-sm font-bold text-white tracking-wide truncate">{soc.raisonSociale}</h4>
                <p className="text-xs text-[#8892B0] font-mono mt-0.5">{soc.formeJuridique} | Code: {soc.code}</p>
                
                <div className="space-y-2 mt-4 text-xs">
                  <div className="flex items-center gap-2 text-[#8892B0] font-mono">
                    <Clipboard className="w-3.5 h-3.5 text-white/30 shrink-0" />
                    <span className="truncate">MF: {soc.mf}</span>
                  </div>
                  {soc.rc && (
                    <div className="flex items-center gap-2 text-[#8892B0] font-mono">
                      <Clipboard className="w-3.5 h-3.5 text-white/30 shrink-0" />
                      <span className="truncate">RC: {soc.rc}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[#8892B0] font-mono truncate">
                    <MapPin className="w-3.5 h-3.5 text-white/30 shrink-0" />
                    <span className="truncate">{soc.adresse || 'Adresse non spécifiée'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#8892B0] font-mono">
                    <Globe className="w-3.5 h-3.5 text-white/30 shrink-0" />
                    <span>Régime: {soc.regimeTva} TVA | TND</span>
                  </div>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="flex gap-2 mt-6 pt-4 border-t border-white/5">
                <button
                  id={`export-json-${soc.id}`}
                  onClick={() => handleExportJSON(soc)}
                  className="flex-1 px-3 py-2 text-center rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-xs font-semibold text-[#8892B0] hover:text-white transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exporter JSON (.json)
                </button>
                {societes.length > 1 && !isActive && (
                  <button
                    id={`delete-soc-${soc.id}`}
                    onClick={() => onDeleteList(soc.id)}
                    className="p-2 rounded-lg bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20 text-[#FF6B6B] border border-[#FF6B6B]/10 transition-all"
                    title="Supprimer ce dossier"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
