import { createClient } from '@supabase/supabase-js';

// ============================================================
// Client Supabase singleton
//
// Variables d'environnement attendues (Vite) :
//   VITE_SUPABASE_URL=https://xxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJ...
//
// En production mobile (Capacitor) : mêmes variables, build à la compilation.
// ============================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] Variables d\'environnement manquantes. ' +
    'Crée un fichier .env.local avec VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // En mobile (Capacitor), on utilise localStorage natif via WebView
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

// Helper : utilisateur courant (peut être null si pas connecté)
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Helper : exiger un utilisateur connecté ou throw
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Utilisateur non authentifié');
  return user;
}
