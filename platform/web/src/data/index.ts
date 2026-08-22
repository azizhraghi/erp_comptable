/**
 * Choix de l'implémentation, au démarrage.
 *
 *   VITE_MODE_DONNEES=local     → PGlite dans le navigateur (défaut)
 *   VITE_MODE_DONNEES=supabase  → projet Supabase Cloud
 *
 * Sans configuration Supabase, on retombe sur le mode local : mieux vaut une
 * application qui fonctionne sur une base de démonstration qu'un écran d'erreur.
 */
import type { Depot } from './depot';
import { DepotLocal } from './depot-local';
import { DepotSupabase } from './depot-supabase';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const modeDemande = import.meta.env.VITE_MODE_DONNEES;

const supabaseConfigure = Boolean(url && anonKey);
const modeRetenu: 'local' | 'supabase' =
  modeDemande === 'supabase' && supabaseConfigure ? 'supabase' : 'local';

export const depot: Depot =
  modeRetenu === 'supabase'
    ? new DepotSupabase(url!, anonKey!)
    : new DepotLocal();

/** Vrai quand on tourne sur une base de démonstration, pas sur Supabase. */
export const modeLocal = modeRetenu === 'local';

/** Supabase est-il configuré, indépendamment du mode retenu ? */
export const supabaseDisponible = supabaseConfigure;

export * from './depot';
