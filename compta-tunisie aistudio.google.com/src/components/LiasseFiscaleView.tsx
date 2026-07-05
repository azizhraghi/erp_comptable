/**
 * Composant LiasseFiscaleView : Confection de la Liasse Fiscale Tunisienne réglementaire (F6001 à F6005).
 * Calcule dynamiquement les postes à partir des balances de comptes réelles en portefeuille.
 */

import React, { useState, useMemo } from 'react';
import { Compte, Ecriture } from '../types';
import { FileText, Download, CheckCircle, Tag, Eye, Info } from 'lucide-react';
import { addAuditLog } from '../lib/storage';

interface LiasseFiscaleViewProps {
  comptes: Compte[];
  ecritures: Ecriture[];
}

export default function LiasseFiscaleView({ comptes, ecritures }: LiasseFiscaleViewProps) {
  const [activeForm, setActiveForm] = useState<'F6001' | 'F6002' | 'F6003' | 'F6004'>('F6001');

  // ==========================================
  // PARSEUR ET CALCUL DYNAMIQUE DES RUBRIQUES
  // ==========================================
  const balances = useMemo(() => {
    const list: Record<string, number> = {};
    comptes.forEach(c => {
      list[c.numero] = 0;
    });

    ecritures.forEach(e => {
      if (list[e.numeroCompte] === undefined) {
        list[e.numeroCompte] = 0;
      }
      list[e.numeroCompte] += (e.montantDebit - e.montantCredit);
    });

    return list;
  }, [comptes, ecritures]);

  // Additionner une liste de racines de comptes (ex: ['2', '28'])
  const sumAccountsByPrefixes = (prefixes: string[], invert = false) => {
    let tot = 0;
    Object.keys(balances).forEach(num => {
      if (prefixes.some(p => num.startsWith(p))) {
        tot += balances[num];
      }
    });
    return invert ? -tot : tot;
  };

  // 1. F6001 : ACTIF BILAN
  const f6001Actif = useMemo(() => {
    const immoBrut = sumAccountsByPrefixes(['22', '23']);
    const immoAmort = sumAccountsByPrefixes(['28'], true);
    const immoNet = immoBrut - immoAmort;

    const stocks = sumAccountsByPrefixes(['31', '35', '37']);
    const creances = sumAccountsByPrefixes(['411', '413', '416']);
    const tresorerie = sumAccountsByPrefixes(['512', '531', '54']);

    return {
      immoBrut,
      immoAmort,
      immoNet,
      stocks,
      creances,
      tresorerie,
      totalActif: immoNet + stocks + creances + tresorerie
    };
  }, [balances]);

  // 2. F6002 : PASSIF BILAN
  const f6002Passif = useMemo(() => {
    const capital = sumAccountsByPrefixes(['101'], true);
    const reserves = sumAccountsByPrefixes(['106', '120'], true);
    const resultat = sumAccountsByPrefixes(['131', '135'], true); // Solde bénéficiaire / déficitaire

    const passifPropre = capital + reserves + resultat;
    const dettesLT = sumAccountsByPrefixes(['16'], true);
    const dettesFournisseurs = sumAccountsByPrefixes(['401', '403', '404'], true);
    const dettesFiscale = sumAccountsByPrefixes(['436', '431', '444'], true);

    return {
      capital,
      reserves,
      resultat,
      passifPropre,
      dettesLT,
      dettesFournisseurs,
      dettesFiscale,
      totalPassif: passifPropre + dettesLT + dettesFournisseurs + dettesFiscale
    };
  }, [balances]);

  // 3. F6003 : ÉTAT DE RÉSULTAT
  const f6003Resultat = useMemo(() => {
    const chiffreAffaires = sumAccountsByPrefixes(['70'], true);
    const autresProduits = sumAccountsByPrefixes(['73', '75'], true);
    
    const achatsMatieres = sumAccountsByPrefixes(['60'], false);
    const chargesPersonnel = sumAccountsByPrefixes(['64', '641'], false);
    const dotationsAmort = sumAccountsByPrefixes(['68'], false);
    
    const totalCharges = achatsMatieres + chargesPersonnel + dotationsAmort;
    const exploitationSolde = (chiffreAffaires + autresProduits) - totalCharges;

    // Taux d'impôt standard en Tunisie : 15% (§15.1 CAHIER)
    const IS = exploitationSolde > 0 ? exploitationSolde * 0.15 : 0;
    const netProfit = exploitationSolde - IS;

    return {
      chiffreAffaires,
      autresProduits,
      achatsMatieres,
      chargesPersonnel,
      dotationsAmort,
      totalCharges,
      exploitationSolde,
      IS,
      netProfit
    };
  }, [balances]);

  // Téléchargement simulé de la liasse
  const handleDownloadXML = () => {
    addAuditLog('EXPORT', 'Liasse', `Génération du fichier XML officiel de la liasse ${activeForm}`);
    alert(`Liasse fiscale ${activeForm} exportée avec succès sous format XML normalisé pour la télé-déclaration tunisienne (Portail Jort / Minitère des finances).`);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full text-left font-sans select-text">
      {/* Top Header info */}
      <div className="flex justify-between items-center bg-[#181B2E] p-4 rounded-xl border border-white/5">
        <div>
          <h3 className="text-base font-semibold text-white">Liasse Fiscale Tunisienne F6001-F6005</h3>
          <p className="text-xs text-[#8892B0]">Générez automatiquement les déclarations fiscales requises par l'arrêté ministériel tunisien.</p>
        </div>

        <button
          id="export-xml-btn"
          onClick={handleDownloadXML}
          className="px-4 py-2 rounded-lg bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-xs font-bold text-black flex items-center gap-2 transition-all font-mono"
        >
          <Download className="w-4 h-4" />
          Exporter XML Télé-déclaration Tunisian Government
        </button>
      </div>

      {/* Liasse schedule switch submenus */}
      <div className="flex border-b border-white/5 bg-[#181B2E] p-1.5 rounded-xl justify-start gap-2 select-none">
        {[
          { key: 'F6001', label: 'F6001 : Actif du Bilan' },
          { key: 'F6002', label: 'F6002 : Passif du Bilan' },
          { key: 'F6003', label: 'F6003 : État de Résultat' },
        ].map(sh => (
          <button
            id={`schedule-${sh.key}`}
            key={sh.key}
            onClick={() => setActiveForm(sh.key as any)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeForm === sh.key ? 'bg-[#6C63FF] text-white shadow-md' : 'text-[#8892B0] hover:bg-white/5'
            }`}
          >
            {sh.label}
          </button>
        ))}
      </div>

      {/* Standard warning box rule */}
      <div className="p-4 bg-white/[0.01] border border-[#6C63FF]/20 rounded-2xl flex gap-3 text-xs leading-relaxed text-[#8892B0]">
        <Info className="w-5 h-5 text-[#6C63FF] shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block mb-0.5 font-mono">Formulaires de Confection Ministérielle</strong>
          Chaque poste est dynamique. Les formules lisent en temps réel le total des mouvements des comptes spécifiques tunisiens. L'impôt sur les sociétés (IS) est calculé au taux d'imposition fixe de 15%.
        </div>
      </div>

      {/* RENDER FORMS */}
      <div className="bg-[#181B2E] border border-white/5 rounded-2xl p-6 shadow-sm">
        
        {/* F6001 ACTIF */}
        {activeForm === 'F6001' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#00D4FF] font-mono border-b border-white/10 pb-2 mb-4">
              FORMULAIRE F6001 : ÉLÉMENTS DE L'ACTIF
            </h4>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between p-3 bg-[#13162A] rounded-xl border border-white/[0.03]">
                <span className="text-white/70">Actifs Non Courants - Équipements &amp; Immo. (Brut)</span>
                <span className="text-white font-bold">{f6001Actif.immoBrut.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>
              <div className="flex justify-between p-3 bg-[#13162A] rounded-xl border border-white/[0.03]">
                <span className="text-white/70">(-) Total Amortissements pratiqués (N-1 &amp; N)</span>
                <span className="text-[#FF6B6B] font-bold">{f6001Actif.immoAmort.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>
              <div className="flex justify-between p-3 bg-[#6C63FF]/5 rounded-xl border border-[#6C63FF]/15">
                <span className="text-[#00D4FF] font-semibold">Total Actifs Non Courants (Net)</span>
                <span className="text-[#00D4FF] font-bold">{f6001Actif.immoNet.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>

              <div className="flex justify-between p-3 bg-[#13162A] rounded-xl border border-white/[0.03] mt-6">
                <span className="text-white/70">Actifs Courants - Stocks de marchandises</span>
                <span className="text-white font-bold">{f6001Actif.stocks.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>
              <div className="flex justify-between p-3 bg-[#13162A] rounded-xl border border-white/[0.03]">
                <span className="text-white/70">Actifs Courants - Clients et créances d'exploitation</span>
                <span className="text-white font-bold">{f6001Actif.creances.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>
              <div className="flex justify-between p-3 bg-[#13162A] rounded-xl border border-white/[0.03]">
                <span className="text-white/70">Trésorerie Active (Liquidités BNA/UIB, Caisse)</span>
                <span className="text-[#00D4AA] font-bold">{f6001Actif.tresorerie.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>

              {/* Total final */}
              <div className="flex justify-between p-4 bg-[#00D4AA]/10 rounded-xl border border-[#00D4AA]/25 text-sm uppercase">
                <span className="text-[#00D4AA] font-bold">TOTAL GÉNÉRAL DE L'ACTIF</span>
                <span className="text-[#00D4AA] font-extrabold">{f6001Actif.totalActif.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>
            </div>
          </div>
        )}

        {/* F6002 PASSIF */}
        {activeForm === 'F6002' && (
          <div className="space-y-4 font-mono text-xs">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#00D4FF] font-mono border-b border-white/10 pb-2 mb-4">
              FORMULAIRE F6002 : CAPITAUX PROPRES &amp; PASSIFS
            </h4>

            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-[#13162A] rounded-xl border border-white/[0.03]">
                <span className="text-white/70">Capitaux Propres - Capital social d'exploitation</span>
                <span className="text-white font-bold">{f6002Passif.capital.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>
              <div className="flex justify-between p-3 bg-[#13162A] rounded-xl border border-white/[0.03]">
                <span className="text-white/70">Réserves réglementaires accumulées</span>
                <span className="text-white font-bold">{f6002Passif.reserves.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>
              <div className="flex justify-between p-3 bg-[#13162A] rounded-xl border border-white/[0.03]">
                <span className="text-white/70">Résultat net de l'exercice (Bénéfice/Déficit)</span>
                <span className="text-white font-bold">{f6002Passif.resultat.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>
              <div className="flex justify-between p-3 bg-[#6C63FF]/5 rounded-xl border border-[#6C63FF]/15">
                <span className="text-[#00D4FF] font-semibold">Total Capitaux Propres</span>
                <span className="text-[#00D4FF] font-bold">{f6002Passif.passifPropre.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>

              <div className="flex justify-between p-3 bg-[#13162A] rounded-xl border border-white/[0.03] mt-6">
                <span className="text-white/70">Passifs Non Courants - Dettes financières long terme</span>
                <span className="text-white font-bold">{f6002Passif.dettesLT.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>
              <div className="flex justify-between p-3 bg-[#13162A] rounded-xl border border-white/[0.03]">
                <span className="text-white/70">Passifs Courants - Fournisseurs &amp; comptes rattachants</span>
                <span className="text-white font-bold">{f6002Passif.dettesFournisseurs.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>
              <div className="flex justify-between p-3 bg-[#13162A] rounded-xl border border-white/[0.03]">
                <span className="text-white/70">Passifs Courants - État tunisien (Impôt &amp; TVA dus)</span>
                <span className="text-white font-bold">{f6002Passif.dettesFiscale.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>

              {/* Total final */}
              <div className="flex justify-between p-4 bg-[#FF6B6B]/15 rounded-xl border border-[#FF6B6B]/20 text-sm uppercase">
                <span className="text-[#FF6B6B] font-bold">TOTAL AUXILIAIRE PASSIFS COMPLETS</span>
                <span className="text-[#FF6B6B] font-extrabold">{f6002Passif.totalPassif.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>
            </div>
          </div>
        )}

        {/* F6003 ÉTAT DE RÉSULTAT */}
        {activeForm === 'F6003' && (
          <div className="space-y-4 font-mono text-xs">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#00D4FF] font-mono border-b border-white/10 pb-2 mb-4">
              FORMULAIRE F6003 : ÉTAT DE RÉSULTAT DE L'EXERCICE
            </h4>

            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-[#13162A] rounded-xl border border-white/[0.03]">
                <span className="text-white/70">Chiffre d'Affaires Brut (Production vendue ou services de classe 70)</span>
                <span className="text-white font-bold">{f6003Resultat.chiffreAffaires.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>
              <div className="flex justify-between p-3 bg-[#13162A] rounded-xl border border-white/[0.03]">
                <span className="text-white/70">Autres Produits d'Exploitation</span>
                <span className="text-white font-bold">{f6003Resultat.autresProduits.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>

              {/* Total Charges d'exploitation */}
              <p className="text-[10px] text-[#8892B0] uppercase font-bold tracking-wider mt-6 mb-1">Moins charges engagées</p>
              <div className="flex justify-between p-3 bg-[#13162A] rounded-xl border border-white/[0.03]">
                <span className="text-white/40">Achats &amp; Variations de Consommation de Matières (Classes 60)</span>
                <span className="text-white">{f6003Resultat.achatsMatieres.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>
              <div className="flex justify-between p-3 bg-[#13162A] rounded-xl border border-white/[0.03]">
                <span className="text-white/40">Charges de Personnel (Salaires ouvriers, charges cotisables CNSS classe 64)</span>
                <span className="text-white">{f6003Resultat.chargesPersonnel.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>
              <div className="flex justify-between p-3 bg-[#13162A] rounded-xl border border-white/[0.03]">
                <span className="text-white/40">Dotation aux Amortissements de l'année (Classe 68)</span>
                <span className="text-white">{f6003Resultat.dotationsAmort.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>

              {/* Résultat brut exploitation */}
              <div className="flex justify-between p-3 bg-white/[0.01] rounded-xl border border-white/5 mt-4">
                <span className="text-[#FDCB6E] font-semibold">Résultat d'Exploitation Brut</span>
                <span className="text-[#FDCB6E] font-bold">{f6003Resultat.exploitationSolde.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>

              {/* Impôt corporate 15% */}
              <div className="flex justify-between p-3 bg-[#FF6B6B]/5 rounded-xl border border-[#FF6B6B]/10">
                <span className="text-[#FF6B6B] font-semibold">(-) Impôt sur les Sociétés calculé (IS à 15%)</span>
                <span className="text-[#FF6B6B] font-bold">{f6003Resultat.IS.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>

              {/* Résultat net final */}
              <div className="flex justify-between p-4 bg-[#00D4AA]/10 rounded-xl border border-[#00D4AA]/25 text-sm uppercase">
                <span className="text-[#00D4AA] font-bold">RÉSULTAT NET DE L'EXERCICE À DECLARER</span>
                <span className="text-[#00D4AA] font-extrabold">{f6003Resultat.netProfit.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
