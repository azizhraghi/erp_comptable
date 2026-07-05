/**
 * Composant Sidebar : Navigation principale de l'application.
 */

import React from 'react';
import { 
  Home, Building, BookOpen, Users, Calendar, 
  PenTool, CheckSquare, RefreshCcw, FileText, 
  HelpCircle, Settings, Shield, AlertTriangle, 
  DollarSign, FileSpreadsheet, Eye, MessageSquare 
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeCompany: { raisonSociale: string; mf: string } | null;
  alertCount: number;
}

export default function Sidebar({ currentTab, setCurrentTab, activeCompany, alertCount }: SidebarProps) {
  const sections = [
    {
      title: 'Principal',
      items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: Home },
        { id: 'societe', label: 'Dossiers / Sociétés', icon: Building },
        { id: 'plan_comptable', label: 'Plan Comptable', icon: BookOpen },
        { id: 'tiers', label: 'Comptes de Tiers', icon: Users },
        { id: 'exercices', label: 'Exercices & Mois', icon: Calendar },
      ]
    },
    {
      title: 'Opérations',
      items: [
        { id: 'saisie', label: 'Saisie / Import', icon: PenTool },
        { id: 'lettrage', label: 'Lettrage & Délettrage', icon: CheckSquare },
        { id: 'ran', label: 'Report à Nouveau (RAN)', icon: RefreshCcw },
        { id: 'rapprochement', label: 'Rapprochement Bancaire', icon: DollarSign },
        { id: 'echeances', label: 'Échéances & Tréso', icon: FileText },
      ]
    },
    {
      title: 'Analyses & Déclarations',
      items: [
        { id: 'editions', label: 'Éditions Balance & GL', icon: FileSpreadsheet },
        { id: 'liasse', label: 'Liasse Fiscale Tunisienne', icon: FileSpreadsheet },
        { id: 'controles', label: 'Contrôles par Cycle', icon: AlertTriangle, badge: true },
      ]
    },
    {
      title: 'Système',
      items: [
        { id: 'settings', label: 'Configuration & Audit', icon: Settings },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen overflow-y-auto shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
        </div>
        <span className="text-xl font-bold tracking-tight text-white font-sans">ComptaPro</span>
      </div>

      {/* Active Company Quick Summary */}
      <div className="mx-4 my-4 p-3 rounded-xl bg-slate-800/50 border border-slate-800">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Société d'exercice</p>
        <p className="text-xs font-semibold text-white truncate my-1">
          {activeCompany ? activeCompany.raisonSociale : 'Aucun dossier'}
        </p>
        <p className="text-[10px] font-mono text-slate-500 truncate">
          M.F. : {activeCompany ? activeCompany.mf : 'non configuré'}
        </p>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 space-y-6 pb-6">
        {sections.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <h3 className="px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2 font-mono">
              {group.title}
            </h3>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      id={`btn-${item.id}`}
                      onClick={() => setCurrentTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-150 relative ${
                        isActive 
                          ? 'bg-indigo-500/10 text-indigo-400 font-medium' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 p-0.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      
                      {item.badge && alertCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20 px-1.5 text-[10px] font-bold text-rose-400 animate-pulse">
                          {alertCount}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer System User */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center gap-3 text-left">
        <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-bold text-slate-300">
          JD
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Najd Ben Thabet</p>
          <p className="text-xs text-slate-500 font-mono">Admin Sarl</p>
        </div>
      </div>
    </aside>
  );
}
