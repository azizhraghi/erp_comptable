import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { depot, type Dossier, type Exercice } from '@/data';
import { useAuth } from '@/auth/AuthProvider';

const CLE_DOSSIER_ACTIF = 'comptaexpert.dossier_actif';

interface DossierState {
  dossiers: Dossier[];
  dossier: Dossier | null;
  exercice: Exercice | null;
  exercices: Exercice[];
  chargement: boolean;
  choisirDossier: (id: string) => void;
  choisirExercice: (id: string) => void;
}

const DossierContext = createContext<DossierState | null>(null);

export function DossierProvider({ children }: { children: ReactNode }) {
  const { collaborateur } = useAuth();
  const [dossierId, setDossierId] = useState<string | null>(null);
  const [exerciceId, setExerciceId] = useState<string | null>(null);

  // En mode Supabase, la liste est déjà filtrée par la RLS : aucun filtrage
  // côté client n'est nécessaire, et il serait trompeur d'en ajouter un.
  const { data: dossiers = [], isLoading } = useQuery({
    queryKey: ['dossiers', collaborateur?.id],
    enabled: Boolean(collaborateur),
    queryFn: () => depot.listerDossiers(),
  });

  const { data: exercices = [] } = useQuery({
    queryKey: ['exercices', dossierId],
    enabled: Boolean(dossierId),
    queryFn: () => depot.listerExercices(dossierId!),
  });

  // Restaure le dernier dossier ouvert, s'il est toujours accessible :
  // une affectation peut avoir été retirée depuis.
  useEffect(() => {
    if (dossiers.length === 0) return;
    let memorise: string | null = null;
    try {
      memorise = localStorage.getItem(CLE_DOSSIER_ACTIF);
    } catch {
      // Navigation privée ou stockage bloqué : sans gravité.
    }
    const valide = memorise && dossiers.some((d) => d.id === memorise);
    setDossierId((actuel) => actuel ?? (valide ? memorise : dossiers[0]!.id));
  }, [dossiers]);

  useEffect(() => {
    if (exercices.length === 0) {
      setExerciceId(null);
      return;
    }
    setExerciceId(
      (actuel) => actuel ?? (exercices.find((e) => e.est_courant) ?? exercices[0]!).id
    );
  }, [exercices]);

  function choisirDossier(id: string) {
    setDossierId(id);
    setExerciceId(null); // l'exercice appartient au dossier
    try {
      localStorage.setItem(CLE_DOSSIER_ACTIF, id);
    } catch {
      // idem
    }
  }

  const value: DossierState = {
    dossiers,
    dossier: dossiers.find((d) => d.id === dossierId) ?? null,
    exercice: exercices.find((e) => e.id === exerciceId) ?? null,
    exercices,
    chargement: isLoading,
    choisirDossier,
    choisirExercice: setExerciceId,
  };

  return <DossierContext.Provider value={value}>{children}</DossierContext.Provider>;
}

export function useDossier(): DossierState {
  const ctx = useContext(DossierContext);
  if (!ctx) throw new Error('useDossier doit être utilisé dans un DossierProvider.');
  return ctx;
}
