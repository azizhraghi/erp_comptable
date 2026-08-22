/**
 * Copie les migrations SQL dans src/db/ pour que Vite puisse les embarquer.
 *
 * Elles vivent dans platform/supabase/migrations/, hors de la racine Vite.
 * Plutôt que d'ouvrir l'accès disque au-dessus de la racine (server.fs.allow),
 * on copie : c'est explicite, et le build ne dépend pas d'une permission.
 *
 * src/db/ est ignoré par git : la source de vérité reste supabase/migrations/.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(ici, '..', '..', 'supabase', 'migrations');
const cible = path.join(ici, '..', 'src', 'db', 'migrations');

rmSync(cible, { recursive: true, force: true });
mkdirSync(cible, { recursive: true });

const fichiers = readdirSync(source).filter((f) => f.endsWith('.sql')).sort();
for (const f of fichiers) {
  writeFileSync(path.join(cible, f), readFileSync(path.join(source, f)));
}
console.log(`${fichiers.length} migrations copiées vers src/db/migrations/`);
