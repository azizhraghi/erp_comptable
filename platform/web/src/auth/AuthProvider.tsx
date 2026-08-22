import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from 'react';
import { depot, modeLocal, type Collaborateur } from '@/data';
import { DepotSupabase } from '@/data/depot-supabase';

interface AuthState {
  collaborateur: Collaborateur | null;
  chargement: boolean;
  /** En mode local, il n'y a pas d'écran de connexion : la session est ouverte. */
  connexionRequise: boolean;
  seConnecter: (email: string, motDePasse: string) => Promise<void>;
  seDeconnecter: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [collaborateur, setCollaborateur] = useState<Collaborateur | null>(null);
  const [chargement, setChargement] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let annule = false;

    (async () => {
      setChargement(true);
      try {
        await depot.initialiser();
        const c = await depot.utilisateurCourant();
        if (!annule) setCollaborateur(c);
      } catch (e) {
        console.error('Initialisation de la base impossible', e);
        if (!annule) setCollaborateur(null);
      } finally {
        if (!annule) setChargement(false);
      }
    })();

    return () => {
      annule = true;
    };
  }, [version]);

  // En mode Supabase, un changement de session doit relancer la lecture du
  // profil métier : il vit dans `collaborateur`, pas dans le JWT.
  useEffect(() => {
    if (modeLocal || !(depot instanceof DepotSupabase)) return;
    const { data } = depot.client.auth.onAuthStateChange(() =>
      setVersion((v) => v + 1)
    );
    return () => data.subscription.unsubscribe();
  }, []);

  async function seConnecter(email: string, motDePasse: string) {
    if (!(depot instanceof DepotSupabase)) return;
    const { error } = await depot.client.auth.signInWithPassword({
      email,
      password: motDePasse,
    });
    if (error) throw error;
  }

  async function seDeconnecter() {
    if (depot instanceof DepotSupabase) await depot.client.auth.signOut();
    setVersion((v) => v + 1);
  }

  return (
    <AuthContext.Provider
      value={{
        collaborateur,
        chargement,
        connexionRequise: !modeLocal && !collaborateur,
        seConnecter,
        seDeconnecter,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider.');
  return ctx;
}
