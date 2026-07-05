/**
 * Orchestrateur central App.tsx : Gère la navigation entre les modules d'expertise comptable,
 * charge/sauvegarde dynamiquement les données dans le LocalStorage par société active,
 * et propose une interface sombre de grade professionnel (Tunisian Slate theme).
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  bootstrapApplication, getSocietes, getActiveSocieteId, saveSocietes, setActiveSocieteId,
  getCompanyData, saveCompanyData, addAuditLog, getCurrentUser, injectDemoTransactions 
} from './lib/storage';
import { Societe, Compte, Tiers, Exercice, Periode, Ecriture, Echeance } from './types';

// Import visuels
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import SocieteView from './components/SocieteView';
import PlanComptableView from './components/PlanComptableView';
import TiersView from './components/TiersView';
import ExerciceManager from './components/ExerciceManager';
import SaisieView from './components/SaisieView';
import LettrageView from './components/LettrageView';
import RanView from './components/RanView';
import RapprochementView from './components/RapprochementView';
import EcheancesModule from './components/EcheancesModule';
import EditionsView from './components/EditionsView';
import ControlesView from './components/ControlesView';
import LiasseFiscaleView from './components/LiasseFiscaleView';
import SettingsView from './components/SettingsView';

export default function App() {
  // 1. Bootstraper au montage d'origine
  useEffect(() => {
    bootstrapApplication();
  }, []);

  // 2. State de navigation et d'identité
  const [activeTab, setActiveTab] = useState('dashboard');
  const [societes, setSocietes] = useState<Societe[]>(() => getSocietes());
  const [activeCompanyId, setActiveCompanyId] = useState<string>(() => getActiveSocieteId());

  // Récupérer la société courante
  const activeCompany = useMemo(() => {
    return societes.find(s => s.id === activeCompanyId) || null;
  }, [societes, activeCompanyId]);

  // 3. Déclarer le sous-système de données de la société active
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [tiers, setTiers] = useState<Tiers[]>([]);
  const [exercices, setExercices] = useState<Exercice[]>([]);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [ecritures, setEcritures] = useState<Ecriture[]>([]);
  const [echeances, setEcheances] = useState<Echeance[]>([]);

  // Charger les fichiers mémoire de la société courante à la volée
  useEffect(() => {
    if (!activeCompanyId) return;
    setComptes(getCompanyData<Compte[]>('comptes', activeCompanyId, []));
    setTiers(getCompanyData<Tiers[]>('tiers', activeCompanyId, []));
    setExercices(getCompanyData<Exercice[]>('exercices', activeCompanyId, []));
    setPeriodes(getCompanyData<Periode[]>('periodes', activeCompanyId, []));
    setEcritures(getCompanyData<Ecriture[]>('ecritures', activeCompanyId, []));
    setEcheances(getCompanyData<Echeance[]>('echeances', activeCompanyId, []));
  }, [activeCompanyId]);

  // Synchroniser les écritures
  const handleSaveEcritures = (updatedList: Ecriture[]) => {
    setEcritures(updatedList);
    saveCompanyData('ecritures', activeCompanyId, updatedList);
  };

  // Ajouter de nouvelles écritures comptables à l'échéancier et au livre
  const handleAddEcritures = (newEntries: Ecriture[]) => {
    const combined = [...ecritures, ...newEntries];
    setEcritures(combined);
    saveCompanyData('ecritures', activeCompanyId, combined);

    // Si l'écriture implique des comptes de tiers, incrémenter ou insérer une ligne d'échéance à encaisser/payer
    const nextEcheances = [...echeances];
    newEntries.forEach(e => {
      if (e.idTiers && (e.numeroCompte.startsWith('411') || e.numeroCompte.startsWith('401'))) {
        const amt = e.montantDebit || e.montantCredit;
        const exists = nextEcheances.find(ech => ech.numeroPiece === e.numeroPiece && ech.idTiers === e.idTiers);
        if (!exists) {
          nextEcheances.push({
            id: 'ech-' + Math.random().toString(36).substring(2, 9),
            idTiers: e.idTiers,
            numeroCompte: e.numeroCompte,
            numeroPiece: e.numeroPiece,
            dateEcheance: '2026-06-30', // Échéant par défaut à +30j
            montantInitial: amt,
            montantReste: amt,
            montantRegle: 0,
            statut: 'a_payer',
            litige: false,
            relance: 0
          });
        }
      }
    });

    setEcheances(nextEcheances);
    saveCompanyData('echeances', activeCompanyId, nextEcheances);
  };

  // Réinitialiser les données d'usine
  const handleResetDemoData = () => {
    injectDemoTransactions(activeCompanyId);
    // Recharger
    setComptes(getCompanyData<Compte[]>('comptes', activeCompanyId, []));
    setTiers(getCompanyData<Tiers[]>('tiers', activeCompanyId, []));
    setExercices(getCompanyData<Exercice[]>('exercices', activeCompanyId, []));
    setPeriodes(getCompanyData<Periode[]>('periodes', activeCompanyId, []));
    setEcritures(getCompanyData<Ecriture[]>('ecritures', activeCompanyId, []));
    setEcheances(getCompanyData<Echeance[]>('echeances', activeCompanyId, []));
  };

  // Corriger automatiquement les déséquilibres asymétriques pour les contrôles d'audit
  const handleTriggerFixAll = () => {
    const sumDebit = ecritures.reduce((s, e) => s + e.montantDebit, 0);
    const sumCredit = ecritures.reduce((s, e) => s + e.montantCredit, 0);
    const diff = sumDebit - sumCredit;
    if (Math.abs(diff) < 0.001) return;

    // Injecter une OD d'équilibrage automatique
    const fixCompte = diff > 0 ? '736000' : '636000'; // Produits ou charges d'écarts
    const fixEntry: Ecriture = {
      id: 'ecr-fixed-all',
      numeroPiece: 'FIX-AUDIT',
      datePiece: '2026-05-28',
      dateSaisie: new Date().toISOString(),
      dateComptable: '2026-05-28',
      journal: 'OD',
      libelle: 'OD rectification audit équilibrage grand livre',
      numeroCompte: fixCompte,
      montantDebit: diff < 0 ? Math.abs(diff) : 0,
      montantCredit: diff > 0 ? diff : 0,
      devise: 'TND',
      montantDevise: 0,
      tauxChange: 1,
      utilisateurSaisie: 'NajdB',
      statut: 'valide',
      source: 'generee'
    };

    handleSaveEcritures([...ecritures, fixEntry]);
  };

  // Calculer d'une façon synchrone le nombre d'alertes d'audit actives
  const alertCount = useMemo(() => {
    let count = 0;
    
    // Alerte 1 : Grand livre déséquilibré
    const sumDebit = ecritures.reduce((s, e) => s + (e.montantDebit || 0), 0);
    const sumCredit = ecritures.reduce((s, e) => s + (e.montantCredit || 0), 0);
    if (Math.abs(sumDebit - sumCredit) > 0.01) count++;

    // Alerte 2 : Caisse négative (Classe 54 / 53)
    let caisseSolde = 0;
    ecritures.forEach(e => {
      if (e.numeroCompte.startsWith('54') || e.numeroCompte.startsWith('53')) {
        caisseSolde += (e.montantDebit - e.montantCredit);
      }
    });
    if (caisseSolde < 0) count++;

    // Alerte 3 : Imputations inhabituelles sans tiers de classe 4 (Fournisseurs/Clients)
    const unusualBQ = ecritures.filter(e => e.numeroCompte.startsWith('512') && !e.idTiers);
    if (unusualBQ.length > 0) count++;

    return count;
  }, [ecritures]);

  // Sélectionner une compagnie active
  const handleSelectCompany = (id: string) => {
    setActiveCompanyId(id);
    setActiveSocieteId(id);
    addAuditLog('SWITCH' as any, 'Dossier', `Changement de dossier actif pour la société ID : ${id}`);
  };

  // Sauvegarder les tiers auxiliaires
  const handleSaveTiers = (list: Tiers[]) => {
    setTiers(list);
    saveCompanyData('tiers', activeCompanyId, list);
  };

  // Sauvegarder les exercices
  const handleSaveExercices = (list: Exercice[]) => {
    setExercices(list);
    saveCompanyData('exercices', activeCompanyId, list);
  };

  // Sauvegarder les périodes
  const handleSavePeriodes = (list: Periode[]) => {
    setPeriodes(list);
    saveCompanyData('periodes', activeCompanyId, list);
  };

  // Sauvegarder la charte de compte
  const handleSaveAccounts = (list: Compte[]) => {
    setComptes(list);
    saveCompanyData('comptes', activeCompanyId, list);
  };

  return (
    <div className="flex h-screen w-screen bg-[#0D0F1A] text-white overflow-hidden font-sans">
      
      {/* Sidebar de grade professionnel */}
      <Sidebar 
        currentTab={activeTab} 
        setCurrentTab={setActiveTab} 
        activeCompany={activeCompany ? { raisonSociale: activeCompany.raisonSociale, mf: activeCompany.mf } : null} 
        alertCount={alertCount}
      />

      {/* Main Content Arena */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header unifié avec la sélection d'exercice fiscal */}
        <Header 
          activeCompany={activeCompany} 
          exercises={exercices}
          activeExerciseId={`ex-${activeCompanyId}-2026`}
          setActiveExerciseId={() => {}}
          title={
            activeTab === 'dashboard' ? 'Tableau de bord financier' :
            activeTab === 'societe' ? 'Gestion des dossiers d\'entreprises' :
            activeTab === 'plan_comptable' ? 'Plan de comptes tunisienne (SYSCOHADA)' :
            activeTab === 'tiers' ? 'Fiches d\'auxiliaires tiers' :
            activeTab === 'exercices' ? 'Périodes et clôtures comptables' :
            activeTab === 'saisie' ? 'Portail de saisie & imports' :
            activeTab === 'lettrage' ? 'Lettrage & délettrage' :
            activeTab === 'ran' ? 'Configuration des RAN' :
            activeTab === 'rapprochement' ? 'Rapprochement bancaire' :
            activeTab === 'echeances' ? 'Échéances & prévisions de trésorerie' :
            activeTab === 'editions' ? 'Éditions légales & balance générale' :
            activeTab === 'controles' ? 'Console d\'audit intelligent' :
            activeTab === 'liasse' ? 'Liasse fiscale ministérielle' :
            'Paramètres optionnels'
          }
        />

        {/* Dynamic Route View Containers */}
        <div id="route-panel-container" className="flex-1 overflow-hidden">
          {activeTab === 'dashboard' && (
            <DashboardView 
              ecritures={ecritures} 
              comptes={comptes} 
              tiers={tiers} 
              echeances={echeances}
              setCurrentTab={setActiveTab}
              alertCount={alertCount}
            />
          )}

          {activeTab === 'societe' && (
            <SocieteView 
              societes={societes} 
              activeId={activeCompanyId}
              onSelect={handleSelectCompany}
              onCreate={(newS) => {
                const next = [...societes, newS];
                setSocietes(next);
                saveSocietes(next);
              }}
              onDeleteList={(delId) => {
                const next = societes.filter(s => s.id !== delId);
                setSocietes(next);
                saveSocietes(next);
              }}
              onImportCompany={(imported) => {
                const next = [...societes, imported];
                setSocietes(next);
                saveSocietes(next);
              }}
            />
          )}

          {activeTab === 'plan_comptable' && (
            <PlanComptableView 
              comptes={comptes} 
              onSaveComptes={handleSaveAccounts} 
            />
          )}

          {activeTab === 'tiers' && (
            <TiersView 
              tiers={tiers} 
              echeances={echeances} 
              onSaveTiers={handleSaveTiers} 
            />
          )}

          {activeTab === 'exercices' && (
            <ExerciceManager 
              exercices={exercices} 
              periodes={periodes} 
              onSaveExercices={handleSaveExercices} 
              onSavePeriodes={handleSavePeriodes} 
              activeExerciseId={`ex-${activeCompanyId}-2026`} 
            />
          )}

          {activeTab === 'saisie' && (
            <SaisieView 
              comptes={comptes} 
              tiers={tiers} 
              periodes={periodes} 
              ecritures={ecritures} 
              onAddEcritures={handleAddEcritures} 
              activeExerciseId={`ex-${activeCompanyId}-2026`} 
            />
          )}

          {activeTab === 'lettrage' && (
            <LettrageView 
              comptes={comptes} 
              tiers={tiers} 
              ecritures={ecritures} 
              onSaveEcritures={handleSaveEcritures} 
            />
          )}

          {activeTab === 'ran' && (
            <RanView 
              comptes={comptes} 
              tiers={tiers} 
              ecritures={ecritures} 
              onAddEcritures={handleAddEcritures} 
              activeExerciseId={`ex-${activeCompanyId}-2026`} 
            />
          )}

          {activeTab === 'rapprochement' && (
            <RapprochementView 
              comptes={comptes} 
              ecritures={ecritures} 
              onSaveEcritures={handleSaveEcritures} 
            />
          )}

          {activeTab === 'echeances' && (
            <EcheancesModule 
              echeances={echeances} 
              tiers={tiers} 
              onSetEcheances={(list) => {
                setEcheances(list);
                saveCompanyData('echeances', activeCompanyId, list);
              }} 
            />
          )}

          {activeTab === 'editions' && (
            <EditionsView 
              comptes={comptes} 
              tiers={tiers} 
              ecritures={ecritures} 
              activeCompany={activeCompany} 
            />
          )}

          {activeTab === 'controles' && (
            <ControlesView 
              comptes={comptes} 
              tiers={tiers} 
              ecritures={ecritures} 
              echeances={echeances} 
              onTriggerFixAll={handleTriggerFixAll} 
            />
          )}

          {activeTab === 'liasse' && (
            <LiasseFiscaleView 
              comptes={comptes} 
              ecritures={ecritures} 
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              onResetDemoData={handleResetDemoData} 
              activeCompany={activeCompany || { raisonSociale: '' }} 
              onUpdateCompany={(updated) => {
                const nextComps = societes.map(s => {
                  if (s.id === activeCompanyId) {
                    return { ...s, ...updated };
                  }
                  return s;
                });
                setSocietes(nextComps);
                saveSocietes(nextComps);
              }} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
