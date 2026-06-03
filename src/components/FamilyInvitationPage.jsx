import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function FamilyInvitationPage({ token }) {
  const [invitation, setInvitation] = useState(null);
  const [licencie, setLicencie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('signup');
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: inv } = await supabase
        .from('family_invitations')
        .select('*, licencies(*)')
        .eq('token', token)
        .single();
      if (!inv) { setError('Invitation invalide ou expirée.'); setLoading(false); return; }
      if (inv.status === 'accepted') { setError('Cette invitation a déjà été utilisée.'); setLoading(false); return; }
      if (new Date(inv.expires_at) < new Date()) { setError('Cette invitation a expiré.'); setLoading(false); return; }
      setInvitation(inv);
      setLicencie(inv.licencies);
      setForm(p => ({ ...p, email: inv.email }));
      setLoading(false);
    }
    load();
  }, [token]);

  const handleSubmit = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) return setError('Prénom et nom obligatoires.');
    if (!form.password || form.password.length < 6) return setError('Mot de passe minimum 6 caractères.');
    setSubmitting(true); setError('');
    try {
      let userId;
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({ email: form.email, password: form.password });
        if (signUpError) throw signUpError;
        userId = data.user?.id;
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (signInError) throw signInError;
        userId = data.user?.id;
      }
      if (!userId) throw new Error('Erreur lors de la création du compte.');

      // Créer le profil famille
      await supabase.from('family_profiles').upsert({
        user_id: userId, first_name: form.first_name, last_name: form.last_name, phone: form.phone
      }, { onConflict: 'user_id' });

      // Lier le parent au licencié
      await supabase.from('family_licencies').upsert({
        family_user_id: userId, licencie_id: invitation.licencie_id, club_owner_id: invitation.owner_id, relation: 'parent'
      }, { onConflict: 'family_user_id,licencie_id' });

      // Marquer l'invitation comme acceptée
      await supabase.from('family_invitations').update({ status: 'accepted' }).eq('token', token);

      setSuccess(true);
    } catch(e) { setError(e.message); }
    setSubmitting(false);
  };

  const S = {
    page: { minHeight: '100vh', background: '#060a12', color: '#f1f5f9', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
    card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 40, maxWidth: 460, width: '100%' },
    input: { width: '100%', padding: '12px 14px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: 14, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit' },
    label: { fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 },
    btnPrimary: { width: '100%', padding: '14px', background: '#a3e635', color: '#060a12', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' },
  };

  if (loading) return <div style={S.page}><div style={{ color: '#64748b' }}>Chargement...</div></div>;

  if (error && !invitation) return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ fontSize: 32, marginBottom: 16, textAlign: 'center' }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>Invitation invalide</div>
        <div style={{ fontSize: 14, color: '#64748b', textAlign: 'center' }}>{error}</div>
      </div>
    </div>
  );

  if (success) return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ fontSize: 48, marginBottom: 16, textAlign: 'center' }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 800, textAlign: 'center', marginBottom: 8, color: '#a3e635' }}>Compte créé !</div>
        <div style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24 }}>
          Vous êtes maintenant lié à <strong style={{ color: '#f1f5f9' }}>{licencie?.first_name} {licencie?.last_name}</strong>.<br />
          Vous pouvez maintenant accéder à l'espace famille.
        </div>
        <a href="/" style={{ ...S.btnPrimary, display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          Accéder à mon espace →
        </a>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>👨‍👩‍👧</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Espace famille FootPlanner</div>
          <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
            Vous avez été invité à rejoindre l'espace de<br />
            <strong style={{ color: '#a3e635' }}>{licencie?.first_name} {licencie?.last_name}</strong>
            {licencie?.category && <span style={{ color: '#818cf8' }}> · {licencie.category}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[{v:'signup',l:'Créer un compte'},{v:'signin',l:'J\'ai déjà un compte'}].map(m => (
            <button key={m.v} onClick={() => setMode(m.v)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: mode === m.v ? '#a3e635' : 'rgba(255,255,255,0.06)', color: mode === m.v ? '#060a12' : '#94a3b8', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{m.l}</button>
          ))}
        </div>

        {error && <div style={{ padding: '10px 14px', background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.2)', borderRadius: 8, fontSize: 13, color: '#fb7185', marginBottom: 16 }}>{error}</div>}

        {mode === 'signup' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 0 }}>
            <div><label style={S.label}>Prénom *</label><input style={S.input} placeholder="Marie" value={form.first_name} onChange={e => setForm(p => ({...p, first_name: e.target.value}))} /></div>
            <div><label style={S.label}>Nom *</label><input style={S.input} placeholder="Dupont" value={form.last_name} onChange={e => setForm(p => ({...p, last_name: e.target.value}))} /></div>
          </div>
        )}

        <label style={S.label}>Email</label>
        <input style={S.input} type="email" value={form.email} readOnly={mode === 'signup'} onChange={e => setForm(p => ({...p, email: e.target.value}))} />

        {mode === 'signup' && (
          <>
            <label style={S.label}>Téléphone</label>
            <input style={S.input} type="tel" placeholder="06 xx xx xx xx" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} />
          </>
        )}

        <label style={S.label}>Mot de passe *</label>
        <input style={{ ...S.input, marginBottom: 20 }} type="password" placeholder="Minimum 6 caractères" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

        <button style={S.btnPrimary} onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Chargement...' : mode === 'signup' ? 'Créer mon espace famille →' : 'Se connecter →'}
        </button>
      </div>
    </div>
  );
}
