import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================
// useAuth — état de session + actions login/signup/logout
// ============================================================
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setUser(session?.user || null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async ({ email, password, displayName, firstName, lastName, club, phone, tournoisPerYear }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName || `${firstName || ''} ${lastName || ''}`.trim() } },
    });
    if (error) throw error;
    // Remplir le profil enrichi
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        display_name: displayName || `${firstName || ''} ${lastName || ''}`.trim(),
        first_name: firstName || '',
        last_name: lastName || '',
        club_name: club || '',
        phone: phone || '',
        tournaments_per_year: tournoisPerYear || '',
        updated_at: new Date().toISOString(),
      });
    }
    return data.user;
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return { user, loading, signUp, signIn, signOut, isAuthenticated: !!user };
}
