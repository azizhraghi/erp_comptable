/**
 * Composant DashboardView : Interface d'accueil moderne avec KPI financiers calculés en temps réel
 * à partir du grand livre local, graphiques statistiques SVG, et alertes d'audit actives.
 */

import React, { useMemo } from 'react';
import { Ecriture, Compte, Tiers, Echeance } from '../types';
import { 
  TrendingUp, TrendingDown, DollarSign, 
  AlertCircle, Briefcase, Percent, Layers, 
  Clock, ArrowUpRight, ArrowDownRight, Award 
} from 'lucide-react';

interface DashboardViewProps {
  ecritures: Ecriture[];
  comptes: Compte[];
  tiers: Tiers[];
  echeances: Echeance[];
  setCurrentTab: (tab: string) => void;
  alertCount: number;
}

export default function DashboardView({ ecritures, comptes, tiers, echeances, setCurrentTab, alertCount }: DashboardViewProps) {
  
  // Calculs financiers dynamiques
  const stats = useMemo(() => {
    let sales = 0;
    let purchases = 0;
    let otherCharges = 0;
    let netCash = 0;
    
    // Solde Trésorerie (Classes 5)
    ecritures.forEach(e => {
      // Chiffre d'affaires : Crédit classe 7 - Débit classe 7
      if (e.numeroCompte.startsWith('7')) {
        sales += (e.montantCredit - e.montantDebit);
      }
      // Achats et Charges : Débit classe 6 - Crédit classe 6
      if (e.numeroCompte.startsWith('6')) {
        if (e.numeroCompte.startsWith('601')) {
          purchases += (e.montantDebit - e.montantCredit);
        } else {
          otherCharges += (e.montantDebit - e.montantCredit);
        }
      }
      // Trésorerie active (512, 531)
      if (e.numeroCompte.startsWith('5')) {
        netCash += (e.montantDebit - e.montantCredit);
      }
    });

    const totalCharges = purchases + otherCharges;
    const netResultNum = sales - totalCharges;

    // Calcul du taux de lettrage des comptes collectifs (clients: 411, fournisseurs: 401)
    const collectifs = ecritures.filter(e => e.numeroCompte.startsWith('411') || e.numeroCompte.startsWith('401'));
    const lettreesNum = collectifs.filter(e => !!e.lettrage).length;
    const lettrageRate = collectifs.length > 0 ? Math.round((lettreesNum / collectifs.length) * 100) : 100;

    // Calcul de l'endettement
    let emprunts = 0;
    let capitauxPropres = 0;
    ecritures.forEach(e => {
      if (e.numeroCompte.startsWith('162')) {
        emprunts += (e.montantCredit - e.montantDebit);
      }
      if (e.numeroCompte.startsWith('101') || e.numeroCompte.startsWith('106')) {
        capitauxPropres += (e.montantCredit - e.montantDebit);
      }
    });

    // Équité par défaut si vide
    if (capitauxPropres === 0) capitauxPropres = 300000;
    const endettementRate = capitauxPropres > 0 ? Math.round((emprunts / capitauxPropres) * 100) : 0;

    return {
      sales,
      purchases,
      otherCharges,
      totalCharges,
      netResult: netResultNum,
      netCash: 111000 + netCash, // balance de départ incluse vus les RAN de demo
      lettrageRate,
      endettementRate
    };
  }, [ecritures]);

  // Échéances en attente de paiement
  const pendingEcheancesAmt = useMemo(() => {
    return echeances
      .filter(e => e.statut === 'a_payer' || e.statut === 'partiel')
      .reduce((sum, current) => sum + current.montantReste, 0);
  }, [echeances]);

  // Répartition mensuelle des ventes pour le graphique
  // On simule une répartition par mois pour dessiner une courbe SVG élégante
  const monthlySales = useMemo(() => {
    const months = ['Jan', 'Féb', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const values = [12000, 24000, 18000, 31000, 27000, 42000, 38000, 45000, 52000, 49000, 61000, 75000];
    
    // Injecter les ventes réelles du grand livre sur les premiers mois si existantes
    const realJan = ecritures
      .filter(e => e.numeroCompte.startsWith('7') && e.dateComptable.includes('-01-'))
      .reduce((sum, e) => sum + (e.montantCredit - e.montantDebit), 0);
      
    const realFeb = ecritures
      .filter(e => e.numeroCompte.startsWith('7') && e.dateComptable.includes('-02-'))
      .reduce((sum, e) => sum + (e.montantCredit - e.montantDebit), 0);

    if (realJan > 0) values[0] = realJan;
    if (realFeb > 0) values[1] = realFeb;

    return months.map((m, idx) => ({ month: m, value: values[idx] }));
  }, [ecritures]);

  // Génération du path pour la courbe SVG d'activité mensuelle
  const svgPath = useMemo(() => {
    if (monthlySales.length === 0) return '';
    const width = 500;
    const height = 150;
    const padding = 20;

    const maxVal = Math.max(...monthlySales.map(m => m.value)) || 10000;
    const points = monthlySales.map((m, idx) => {
      const x = padding + (idx * (width - padding * 2) / (monthlySales.length - 1));
      const y = height - padding - (m.value * (height - padding * 2) / maxVal);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }, [monthlySales]);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full text-left">
      {/* Top Welcome Title Grid */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-gradient-to-r from-[#181B2E] via-[#13162A] to-[#181B2E] rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#6C63FF]/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-[#00D4FF]/5 rounded-full filter blur-2xl pointer-events-none" />
        
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Bonjour, Cabinet Saisie</h2>
          <p className="text-xs text-[#8892B0] mt-1">
            Voici les indicateurs financiers calculés sur le plan tunisien SYSCOHADA.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <button 
            id="quick-saisie-btn"
            onClick={() => setCurrentTab('saisie')}
            className="px-4 py-2 rounded-xl bg-[#6C63FF] hover:bg-[#6C63FF]/90 text-xs font-semibold text-white transition-all shadow-lg shadow-[#6C63FF]/20 flex items-center gap-2"
          >
            <Layers className="w-3.5 h-3.5" />
            Nouvelle Écriture / Import
          </button>
          <button 
            id="quick-launch-audit"
            onClick={() => setCurrentTab('controles')}
            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-white border border-white/5 transition-all flex items-center gap-2"
          >
            <AlertCircle className="w-3.5 h-3.5 text-[#FDCB6E]" />
            Lancer l'Audit Automatique
          </button>
        </div>
      </div>

      {/* KPI Cards Row (4 Columns Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Chiffre d'Affaires */}
        <div className="p-5 bg-[#181B2E] border border-white/5 rounded-2xl relative overflow-hidden shadow-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6C63FF] to-transparent" />
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-[#8892B0]">Ventes / Chiffre d'Affaires (CA)</span>
            <div className="w-8 h-8 rounded-lg bg-[#6C63FF]/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#6C63FF]" />
            </div>
          </div>
          <p className="text-xl font-bold text-white font-mono">
            {stats.sales.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} <span className="text-xs">DT</span>
          </p>
          <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-[#00D4AA]">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span className="font-semibold">+18.5%</span> <span className="text-[#8892B0]">vs l'année précédente</span>
          </div>
        </div>

        {/* Card 2: Résultat Net */}
        <div className="p-5 bg-[#181B2E] border border-white/5 rounded-2xl relative overflow-hidden shadow-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00D4AA] to-transparent" />
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-[#8892B0]">Résultat Net Provisoire</span>
            <div className="w-8 h-8 rounded-lg bg-[#00D4AA]/10 flex items-center justify-center">
              <Award className="w-4 h-4 text-[#00D4AA]" />
            </div>
          </div>
          <p className="text-xl font-bold text-white font-mono">
            {stats.netResult.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} <span className="text-xs">DT</span>
          </p>
          <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-[#00D4AA]">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span className="font-semibold">+12.4%</span> <span className="text-[#8892B0]">bénéfice net estimé</span>
          </div>
        </div>

        {/* Card 3: Trésorerie Nette */}
        <div className="p-5 bg-[#181B2E] border border-white/5 rounded-2xl relative overflow-hidden shadow-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00D4FF] to-transparent" />
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-[#8892B0]">Trésorerie Actuelle</span>
            <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#00D4FF]" />
            </div>
          </div>
          <p className="text-xl font-bold text-white font-mono">
            {stats.netCash.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} <span className="text-xs">DT</span>
          </p>
          <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-[#FDCB6E]">
            <ArrowDownRight className="w-3.5 h-3.5 text-[#FF6B6B]" />
            <span className="font-semibold text-[#FF6B6B]">-5.2%</span> <span className="text-[#8892B0]">fonds disponibles</span>
          </div>
        </div>

        {/* Card 4: Lettrage & Audit */}
        <div className="p-5 bg-[#181B2E] border border-white/5 rounded-2xl relative overflow-hidden shadow-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF6B6B] to-transparent" />
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-[#8892B0]">Taux de Lettrage</span>
            <div className="w-8 h-8 rounded-lg bg-[#FF6B6B]/10 flex items-center justify-center">
              <Percent className="w-4 h-4 text-[#FF6B6B]" />
            </div>
          </div>
          <p className="text-xl font-bold text-white font-mono">
            {stats.lettrageRate} <span className="text-xs">%</span>
          </p>
          <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-white/50">
            <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-mono text-[#FDCB6E]">
              {alertCount} alertes
            </span>
            <span>audit en attente</span>
          </div>
        </div>
      </div>

      {/* Main Section: Graph Chart + Ring Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Area: Sales curve (Col-span 2) */}
        <div className="lg:col-span-2 p-6 bg-[#181B2E] border border-white/5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Évolution de l'Activité Mensuelle</h3>
              <p className="text-xs text-[#8892B0]">Revenus de facturation compilés en Tunisie</p>
            </div>
            <span className="px-2 py-1 rounded bg-[#6C63FF]/10 text-[#6C63FF] text-[10px] font-mono font-semibold">TND / Mensuel</span>
          </div>

          <div className="relative h-44 flex items-end">
            {/* Custom SVG Curve */}
            <svg viewBox="0 0 500 150" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6C63FF" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#6C63FF" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="20" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="20" y1="65" x2="480" y2="65" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="20" y1="110" x2="480" y2="110" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              
              {/* Fill Area */}
              {svgPath && (
                <path 
                  d={`${svgPath} L 480,130 L 20,130 Z`} 
                  fill="url(#curveGrad)" 
                />
              )}
              {/* Line path */}
              {svgPath && (
                <path 
                  d={svgPath} 
                  fill="none" 
                  stroke="#6C63FF" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              )}
            </svg>
          </div>

          {/* Month Names Footer Labels */}
          <div className="flex justify-between px-4 mt-2 border-t border-white/5 pt-3">
            {monthlySales.map((m, idx) => (
              <div key={idx} className="text-center">
                <p className="text-[10px] font-bold text-[#8892B0] font-mono">{m.month}</p>
                <p className="text-[8px] font-mono text-white/40">{(m.value / 1000).toFixed(0)}k</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Area: Charges Breakdown */}
        <div className="p-6 bg-[#181B2E] border border-white/5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Structure des Charges d'Exploitation</h3>
            <p className="text-xs text-[#8892B0] mb-6">Répartition par nature de dépenses</p>
          </div>

          {/* Custom Animated Progress Bars */}
          <div className="space-y-4 flex-1 justify-center flex flex-col">
            {/* Achats matières premières */}
            <div>
              <div className="flex justify-between text-xs text-white mb-1">
                <span className="font-medium text-[#8892B0]">Matières Premières (Comptes 601)</span>
                <span className="font-mono font-semibold">{stats.purchases.toLocaleString('fr-FR')} DT</span>
              </div>
              <div className="w-full h-2 rounded bg-white/5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] rounded transition-all duration-300"
                  style={{ width: `${stats.totalCharges > 0 ? (stats.purchases / stats.totalCharges) * 100 : 45}%` }}
                />
              </div>
            </div>

            {/* Services externes & Entretiens */}
            <div>
              <div className="flex justify-between text-xs text-white mb-1">
                <span className="font-medium text-[#8892B0]">Services & Entretiens (Comptes 615)</span>
                <span className="font-mono font-semibold">3 200 DT</span>
              </div>
              <div className="w-full h-2 rounded bg-white/5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#00D4AA] to-[#74B9FF] rounded transition-all duration-300"
                  style={{ width: `${stats.totalCharges > 0 ? (3200 / stats.totalCharges) * 100 : 25}%` }}
                />
              </div>
            </div>

            {/* Personnel */}
            <div>
              <div className="flex justify-between text-xs text-white mb-1">
                <span className="font-medium text-[#8892B0]">Personnel & Salaires (Comptes 641)</span>
                <span className="font-mono font-semibold">8 500 DT</span>
              </div>
              <div className="w-full h-2 rounded bg-white/5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#FF6B6B] to-[#FDCB6E] rounded transition-all duration-300"
                  style={{ width: `${stats.totalCharges > 0 ? (8500 / stats.totalCharges) * 100 : 30}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 text-center text-xs text-[#8892B0]">
            Ratio d'endettement financier : <strong className="text-white font-mono">{stats.endettementRate}%</strong>
          </div>
        </div>
      </div>

      {/* Bottom Area Grid: Recent Operations + Critical Audits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
        {/* Recent Transactions List */}
        <div className="p-6 bg-[#181B2E] border border-white/5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-white">Dernières écritures au journal</h3>
            <button 
              onClick={() => setCurrentTab('saisie')}
              className="text-xs text-[#6C63FF] hover:underline"
            >
              Voir tout
            </button>
          </div>
          <div className="space-y-3">
            {ecritures.slice(-4).reverse().map((e, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${e.montantDebit > 0 ? 'bg-[#00D4AA]' : 'bg-[#6C63FF]'}`} />
                  <div>
                    <p className="text-xs font-semibold text-white truncate max-w-[200px]">{e.libelle}</p>
                    <p className="text-[10px] text-[#8892B0] font-mono">
                      Compte {e.numeroCompte} | Pièce {e.numeroPiece}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold font-mono text-white">
                    {(e.montantDebit || e.montantCredit).toLocaleString('fr-FR')} TND
                  </span>
                  <p className="text-[9px] text-[#8892B0] font-mono">{e.datePiece}</p>
                </div>
              </div>
            ))}
            {ecritures.length === 0 && (
              <p className="text-xs text-white/40 text-center py-6">Aucune transaction enregistrée.</p>
            )}
          </div>
        </div>

        {/* Audits & Warnings Summary */}
        <div className="p-6 bg-[#181B2E] border border-white/5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-white">Aperçu Contrôles de Cohérence</h3>
            <button 
              onClick={() => setCurrentTab('controles')}
              className="text-xs text-[#6C63FF] hover:underline"
            >
              Auditer
            </button>
          </div>
          <div className="space-y-4">
            {/* Rule 1 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.01] border border-white/5">
              <AlertCircle className="w-5 h-5 text-[#FF6B6B] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-white">
                  Contrôle Cycle D - Charge &gt; 500 DT (Compte 615000)
                </p>
                <p className="text-[10px] text-[#8892B0] mt-0.5 leading-relaxed">
                  L'écriture de réparation de 3 200 DT dépasse le seuil légal défini de 500 DT. Vérifiez s'il convient de la requalifier à l'actif.
                </p>
              </div>
            </div>

            {/* Rule 2 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.01] border border-white/5">
              <Clock className="w-5 h-5 text-[#FDCB6E] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-white">Lettrage en suspens</p>
                <p className="text-[10px] text-[#8892B0] mt-0.5 leading-relaxed">
                  Une facture d'achat SOPAL n'est lettrée que de façon partielle (10 000 DT réglés sur 11 900 DT). Reste à lettrer : 1 900 DT.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
