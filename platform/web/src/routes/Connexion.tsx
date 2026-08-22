import { useState, type FormEvent } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { messageErreur } from '@/data';

export default function Connexion() {
  const { seConnecter } = useAuth();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);
    try {
      await seConnecter(email, motDePasse);
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-5 rounded-lg border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            ComptaExpert
          </h1>
          <p className="mt-1 text-sm text-neutral-500">Plateforme de cabinet</p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            Adresse e-mail
          </span>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-neutral-700 dark:bg-neutral-950"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            Mot de passe
          </span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-neutral-700 dark:bg-neutral-950"
          />
        </label>

        {erreur && (
          <p
            role="alert"
            className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          >
            {erreur}
          </p>
        )}

        <button
          type="submit"
          disabled={envoi}
          className="w-full rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {envoi ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
