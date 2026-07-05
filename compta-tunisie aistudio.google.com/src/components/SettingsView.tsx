/**
 * Composant SettingsView : Portail de configuration de l'entreprise et de sécurité.
 * Gère l'identité fiscale d'entreprise (Raison sociale, Matricule fiscal, RC),
 * la base d'utilisateur à rôles (Admins, Comptables, Saisisseurs) et les utilitaires de sauvegarde globale.
 */

import React, { useState } from 'react';
import { Settings, User, Shield, HelpCircle, Save, Database, Download, CheckCircle, RefreshCw } from 'lucide-react';
import { addAuditLog } from '../lib/storage';

interface SettingsViewProps {
  onResetDemoData: () => void;
  activeCompany: { 
    raisonSociale: string; 
    code?: string;
    mf?: string;
    rc?: string;
    cnss?: string;
    adresse?: string;
    ville?: string;
    secteur?: string;
    regime?: string;
  };
  onUpdateCompany: (updated: any) => void;
}

export default function SettingsView({ onResetDemoData, activeCompany, onUpdateCompany }: SettingsViewProps) {
  const [compDetails, setCompDetails] = useState({
    raisonSociale: activeCompany.raisonSociale || 'SOPAL S.A.',
    code: activeCompany.code || 'SOPAL',
    mf: activeCompany.mf || '1234567/M/A/P/000',
    rc: activeCompany.rc || 'B1112452020',
    cnss: activeCompany.cnss || '452123-90',
    adresse: activeCompany.adresse || 'Zone Industrielle Megrine',
    ville: activeCompany.ville || 'Ben Arous, Tunis',
    secteur: activeCompany.secteur || 'Métallurgie',
    regime: activeCompany.regime || 'Réel d\'exploitation'
  });

  const [loadingReset, setLoadingReset] = useState(false);

  // Équipe utilisateur simulée
  const mockTeam = [
    { id: 1, name: 'Najd BELKADHI', role: 'Administrateur Principal', email: 'admin@comptatunisie.tn', active: true },
    { id: 2, name: 'Sihem DRIDI', role: 'Expert Comptable Associé', email: 's.dridi@cabinetdridi.com', active: true },
    { id: 3, name: 'Hamza CHAABANE', role: 'Collaborateur Saisie', email: 'h.chaabane@comptatunisie.tn', active: true },
  ];

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompany(compDetails);
    addAuditLog('UPDATE', 'Settings', `Mise à jour de la fiche d'identité fiscale d'entreprise ${compDetails.raisonSociale}`);
    alert('Informations d\'identité sociale sauvegardées.');
  };

  const handleResetDataAction = () => {
    if (confirm('ATTENTION : Voulez-vous réinitialiser le Grand Livre et réinjecter les écritures de démonstration d\'origine ?')) {
      setLoadingReset(true);
      setTimeout(() => {
        onResetDemoData();
        setLoadingReset(false);
        addAuditLog('UPDATE', 'System', 'Réinitialisation complète de la mémoire locale vers la configuration d\'usine.');
      }, 700);
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full text-left font-sans select-text">
      {/* Top Header info */}
      <div className="flex justify-between items-center bg-[#181B2E] p-4 rounded-xl border border-white/5">
        <div>
          <h3 className="text-base font-semibold text-white">Paramètres Généraux du Dossier Social</h3>
          <p className="text-xs text-[#8892B0]">Administrez l'identité légale de votre structure, les permissions d'accès, et la sécurité.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Corporate legal data card */}
        <div className="lg:col-span-2 p-5 bg-[#181B2E] border border-white/5 rounded-2xl shadow-sm">
          <h4 className="text-xs font-bold text-[#00D4FF] uppercase tracking-wider mb-4 font-mono flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-[#00D4FF]" /> Identité Légale de la Structure Sociétale
          </h4>

          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#8892B0] mb-1">Raison Sociale Officielle</label>
                <input
                  id="sett-name"
                  type="text"
                  value={compDetails.raisonSociale}
                  onChange={(e) => setCompDetails({ ...compDetails, raisonSociale: e.target.value })}
                  className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8892B0] mb-1">Code Interne Dossier</label>
                <input
                  id="sett-code"
                  type="text"
                  value={compDetails.code}
                  onChange={(e) => setCompDetails({ ...compDetails, code: e.target.value.toUpperCase() })}
                  className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#8892B0] mb-1">Matricule Fiscal National (*)</label>
                <input
                  id="sett-mf"
                  type="text"
                  value={compDetails.mf}
                  onChange={(e) => setCompDetails({ ...compDetails, mf: e.target.value })}
                  className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8892B0] mb-1">Registre du Commerce (RC)</label>
                <input
                  id="sett-rc"
                  type="text"
                  value={compDetails.rc}
                  onChange={(e) => setCompDetails({ ...compDetails, rc: e.target.value })}
                  className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8892B0] mb-1">Affiliation CNSS Employeur</label>
                <input
                  id="sett-cnss"
                  type="text"
                  value={compDetails.cnss}
                  onChange={(e) => setCompDetails({ ...compDetails, cnss: e.target.value })}
                  className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#8892B0] mb-1">Adresse postale</label>
                <input
                  id="sett-address"
                  type="text"
                  value={compDetails.adresse}
                  onChange={(e) => setCompDetails({ ...compDetails, adresse: e.target.value })}
                  className="w-full bg-[#13162A] border border-white/10 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8892B0] mb-1">Secteur / Régime fiscal</label>
                <input
                  id="sett-sector"
                  type="text"
                  value={`${compDetails.secteur} - ${compDetails.regime}`}
                  disabled
                  className="w-full bg-white/5 border border-white/5 rounded-lg p-2 text-xs text-white/50"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                id="save-company-data"
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#6C63FF] hover:bg-[#6C63FF]/90 text-xs font-semibold text-white flex items-center gap-1.5 shadow"
              >
                <Save className="w-3.5 h-3.5" /> Enregistrer les modifications
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Security roles and recovery modules */}
        <div className="space-y-6">
          {/* Active members cards group */}
          <div className="p-5 bg-[#181B2E] border border-white/5 rounded-2xl shadow-sm">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 font-mono">
              Équipe d'accès autorisée
            </h4>

            <div className="space-y-3">
              {mockTeam.map((u) => (
                <div key={u.id} className="p-3 bg-[#13162A] rounded-xl border border-white/[0.03] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#6C63FF]/15 flex items-center justify-center text-[#6C63FF] font-bold text-xs select-none">
                    {u.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div className="font-mono text-[10px] text-[#8892B0]">
                    <p className="font-bold text-white font-sans">{u.name}</p>
                    <p className="mt-0.5">{u.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Database Recovery tool */}
          <div className="p-5 bg-[#181B2E] border border-white/5 rounded-2xl shadow-sm">
            <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
              <Database className="w-4 h-4 text-red-400 shrink-0" /> Restauration d'Usine
            </h4>
            <p className="text-[11px] text-[#8892B0] leading-relaxed mb-4">
              Pour des raisons de commodité ou de démonstration d'audit, vous pouvez forcer la reconstruction de l'ensemble du livre avec les transactions tunisiennes par défaut.
            </p>

            <button
              id="factory-reset-action"
              onClick={handleResetDataAction}
              disabled={loadingReset}
              className="w-full py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-[#FF6B6B] border border-red-500/20 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors font-mono"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingReset ? 'animate-spin' : ''}`} />
              Réinitialiser et Injecter le modèle de démo (SOPAL S.A.)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
