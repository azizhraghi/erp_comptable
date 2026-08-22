import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import Connexion from '@/routes/Connexion';
import Shell from '@/components/layout/Shell';
import Accueil from '@/routes/Accueil';

export default function App() {
  const { chargement, connexionRequise } = useAuth();

  if (chargement) {
    return (
      <div className="grid min-h-screen place-items-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <p className="text-sm text-neutral-500">Préparation de la base…</p>
          <p className="mt-1 font-mono text-xs text-neutral-400">
            PostgreSQL démarre dans le navigateur, quelques secondes au premier lancement.
          </p>
        </div>
      </div>
    );
  }

  if (connexionRequise) return <Connexion />;

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Accueil />} />
        {/* Les écrans métier arrivent ici : saisie, éditions, lettrage. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
