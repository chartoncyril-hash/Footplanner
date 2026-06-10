import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================
// useClubContext — Source de vérité unique sur le contexte utilisateur
// ============================================================
// Retourne :
//   - loading: true tant que le contexte n'est pas chargé
//   - type: 'owner' | 'member' | 'family' | 'unknown'
//   - clubOwnerId: l'ID du propriétaire du club (pour requêtes BDD)
//   - member: ligne club_members si membre d'équipe
//   - familyProfile: ligne family_profiles si licencié/parent
//   - permissions: objet { module: bool } - accès complet pour owner
// ============================================================

const ALL_PERMISSIONS = {
  tournaments:   true,
  inscriptions:  true,
  planning:      true,
  stages:        true,
  communication: true,
  scoreboard:    true,
  sponsors:      true,
  licencies:     true,
  compositions:  true,
};

export function useClubContext(user) {
  const [context, setContext] = useState({
    loading: true,
    type: null,
    clubOwnerId: null,
    member: null,
    familyProfile: null,
    permissions: ALL_PERMISSIONS,
  });

  const load = useCallback(async () => {
    if (!user?.id) {
      setContext({ loading: false, type: null, clubOwnerId: null, member: null, familyProfile: null, permissions: {} });
      return;
    }

    // Charger en parallèle les 3 contextes possibles (avec garde d'erreur)
    let profile = null, member = null, family = null;
    try {
      const [r1, r2, r3] = await Promise.all([
        supabase.from('profiles').select('id').eq('id', user.id).maybeSingle(),
        supabase.from('club_members').select('*').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
        supabase.from('family_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      ]);
      profile = r1.data; member = r2.data; family = r3.data;
    } catch (e) {
      console.warn('useClubContext load error', e);
      setContext({ loading: false, type: 'owner', clubOwnerId: user.id, member: null, familyProfile: null, permissions: ALL_PERMISSIONS });
      return;
    }

    // Priorité : owner > member > family
    if (profile) {
      setContext({
        loading: false,
        type: 'owner',
        clubOwnerId: user.id,
        member: null,
        familyProfile: null,
        permissions: ALL_PERMISSIONS,
      });
    } else if (member) {
      setContext({
        loading: false,
        type: 'member',
        clubOwnerId: member.club_owner_id,
        member,
        familyProfile: null,
        permissions: member.permissions || {},
      });
    } else if (family) {
      setContext({
        loading: false,
        type: 'family',
        clubOwnerId: family.club_owner_id,
        member: null,
        familyProfile: family,
        permissions: {},
      });
    } else {
      setContext({
        loading: false,
        type: 'unknown',
        clubOwnerId: null,
        member: null,
        familyProfile: null,
        permissions: {},
      });
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  return { ...context, reload: load };
}
