import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function MemberActivationPage({ token }) {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageState, setPageState] = useState('loading'); // loading|form|success|error
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [clubProfile, setClubProfile] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc('get_member_by_token', { p_token: token });
      if (!data?.[0]) { setPageState('error'); setLoading(false); return; }
      const m = data[0];
      setMember(m);
      // Charger branding club
      const { data: cp } = await supabase.from('profiles')
        .select('club_name, club_color, club_logo_url')
        .eq('id', m.club_owner_id).single();
      setClubProfile(cp);
      if (m.status === 'active') setPageState('already_active');
      else setPageState('form');
      setLoading(false);
    })();
  }, [token]);

  const handleSubmit = async () => {
    if (form.password.length < 6) return setError('Mot de passe minimum 6 caractères');
    if (form.password !== form.confirm) return setError('Les mots de passe ne correspondent pas');
    setSaving(true); setError('');
    try {
      // Créer le compte via Edge Function (Admin API — email auto-confirmé)
      const { data, error: fnErr } = await supabase.functions.invoke('create-member-account', {
        body: { email: member.email, password: form.password, token }
      });
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(JSON.stringify(data.error));
      setPageState('success');
    } catch(e) {
      setError(e.message || 'Erreur lors de la création du compte');
    }
    setSaving(false);
  };

  const accent = clubProfile?.club_color || '#a3e635';
  const inp = { width:'100%', padding:'12px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#f1f5f9', fontSize:14, fontFamily:'inherit', boxSizing:'border-box', marginBottom:12 };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0a0e1a', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'#64748b' }}>Chargement...</div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#0a0e1a', color:'#f1f5f9', fontFamily:'system-ui, sans-serif', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        {/* Header club */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          {clubProfile?.club_logo_url
            ? <img src={clubProfile.club_logo_url} alt="" style={{ width:64, height:64, borderRadius:16, objectFit:'cover', margin:'0 auto 12px', display:'block' }} />
            : <div style={{ width:64, height:64, borderRadius:16, background:`${accent}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto 12px' }}>⚽</div>
          }
          <div style={{ fontSize:18, fontWeight:800, color:'#f1f5f9' }}>{clubProfile?.club_name || 'FootPlanner'}</div>
          <div style={{ fontSize:13, color:'#64748b', marginTop:4 }}>Activation de votre compte</div>
        </div>

        {pageState === 'error' && (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ fontSize:40, marginBottom:16 }}>❌</div>
            <h2 style={{ color:'#fb7185', fontSize:18, fontWeight:800 }}>Lien invalide</h2>
            <p style={{ color:'#64748b', fontSize:14 }}>Ce lien d'activation n'existe pas ou a expiré.</p>
          </div>
        )}

        {pageState === 'already_active' && (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ fontSize:40, marginBottom:16 }}>✅</div>
            <h2 style={{ color:'#34d399', fontSize:18, fontWeight:800 }}>Compte déjà activé</h2>
            <p style={{ color:'#64748b', fontSize:14, marginBottom:20 }}>Votre compte est déjà actif. Connectez-vous directement.</p>
            <a href="/" style={{ display:'inline-block', padding:'12px 24px', borderRadius:10, background:accent, color:'#0a0e1a', fontWeight:800, fontSize:14, textDecoration:'none' }}>
              Se connecter →
            </a>
          </div>
        )}

        {pageState === 'form' && (
          <div style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${accent}33`, borderRadius:16, padding:28 }}>
            <h2 style={{ fontSize:18, fontWeight:800, color:'#f1f5f9', marginBottom:4 }}>
              Bienvenue {member?.first_name} !
            </h2>
            <p style={{ color:'#64748b', fontSize:13, marginBottom:24 }}>
              Créez votre mot de passe pour accéder à FootPlanner en tant que <strong style={{ color:accent }}>{member?.role === 'admin' ? 'Administrateur' : member?.role === 'assistant' ? 'Assistant coach' : member?.role === 'secretary' ? 'Secrétaire' : 'Bénévole'}</strong>.
            </p>
            <div style={{ fontSize:11, color:'#64748b', marginBottom:4, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>Email</div>
            <div style={{ padding:'10px 14px', borderRadius:8, background:'rgba(255,255,255,0.04)', color:'#94a3b8', fontSize:14, marginBottom:16 }}>{member?.email}</div>
            <div style={{ fontSize:11, color:'#64748b', marginBottom:4, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>Mot de passe *</div>
            <input type="password" style={inp} placeholder="Minimum 6 caractères" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} />
            <div style={{ fontSize:11, color:'#64748b', marginBottom:4, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>Confirmer le mot de passe *</div>
            <input type="password" style={{ ...inp, marginBottom:0 }} placeholder="Répéter le mot de passe" value={form.confirm} onChange={e => setForm(f=>({...f,confirm:e.target.value}))} onKeyDown={e => e.key==='Enter' && handleSubmit()} />
            {error && <div style={{ fontSize:13, color:'#fb7185', marginTop:8 }}>❌ {error}</div>}
            <button onClick={handleSubmit} disabled={saving} style={{ width:'100%', marginTop:20, padding:'14px', borderRadius:10, border:'none', background:accent, color:'#0a0e1a', fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'inherit', opacity:saving?0.6:1 }}>
              {saving ? 'Activation...' : '✓ Activer mon compte'}
            </button>
          </div>
        )}

        {pageState === 'success' && (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
            <h2 style={{ color:'#34d399', fontSize:20, fontWeight:900, marginBottom:8 }}>Compte activé !</h2>
            <p style={{ color:'#94a3b8', fontSize:14, marginBottom:24 }}>Votre compte est prêt. Vous pouvez maintenant vous connecter à FootPlanner.</p>
            <a href="/" style={{ display:'inline-block', padding:'14px 28px', borderRadius:10, background:accent, color:'#0a0e1a', fontWeight:800, fontSize:15, textDecoration:'none' }}>
              Se connecter →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
