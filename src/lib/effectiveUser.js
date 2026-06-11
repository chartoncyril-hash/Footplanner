import { supabase } from './supabase';

// ============================================================
// getEffectiveOwnerId — renvoie l'ID du club auquel appartient
// l'utilisateur courant :
//   - owner    → son propre id
//   - membre   → le club_owner_id de son club
// Mis en cache pour la session (1 seule requête).
// ============================================================
let _cache = null;

// Vider le cache à chaque changement de session (login/logout/switch de compte)
supabase.auth.onAuthStateChange(() => { _cache = null; });

export async function getEffectiveOwnerId() {
  if (_cache) return _cache;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: member } = await supabase
    .from('club_members')
    .select('club_owner_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();
  _cache = member?.club_owner_id || user.id;
  return _cache;
}

export function clearEffectiveOwnerCache() { _cache = null; }
