import React, { useState, useEffect, useCallback } from 'react';
import { User, Building2, Phone, Mail, Lock, LogOut, Calendar, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export function AccountView({ signOut }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ current: '', new1: '', new2: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [clubNameLocked, setClubNameLocked] = useState(null); // null = pas encore chargé

  const showToast = (message, isError = false) => {
    setToast({ message, isError, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  };

  // Charger le profil
  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      const p = data || { id: user.id, email: user.email, first_name: '', last_name: '', club_name: '', phone: '' };
      setProfile(p);
      setClubNameLocked(!!p.club_name); // locked si club_name existait déjà au chargement
    } catch (e) {
      console.error('loadProfile', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // Sauvegarder le profil
  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        display_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        first_name: profile.first_name,
        last_name: profile.last_name,
        club_name: profile.club_name,
        club_logo_url: profile.club_logo_url,
        phone: profile.phone,
        tournaments_per_year: profile.tournaments_per_year,
        iban: profile.iban,
        payment_info: profile.payment_info,
        payment_link: profile.payment_link,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      showToast('Profil enregistre');
    } catch (e) {
      showToast('Erreur: ' + e.message, true);
    } finally {
      setSaving(false);
    }
  };

  // Changer le mot de passe
  const changePassword = async () => {
    if (passwordForm.new1.length < 6) {
      showToast('Le mot de passe doit contenir au moins 6 caracteres', true);
      return;
    }
    if (passwordForm.new1 !== passwordForm.new2) {
      showToast('Les mots de passe ne correspondent pas', true);
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.new1 });
      if (error) throw error;
      showToast('Mot de passe modifie');
      setPasswordForm({ current: '', new1: '', new2: '' });
      setShowPassword(false);
    } catch (e) {
      showToast('Erreur: ' + e.message, true);
    } finally {
      setSaving(false);
    }
  };

  // Upload logo club
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop();
    const path = `clubs/${user.id}/logo.${ext}`;
    setSaving(true);
    try {
      const { error: upErr } = await supabase.storage.from('logos').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path);
      setProfile(prev => ({ ...prev, club_logo_url: publicUrl }));
      showToast('Logo telecharge');
    } catch (e) {
      showToast('Erreur upload: ' + e.message, true);
    } finally {
      setSaving(false);
    }
  };

  const update = (key, value) => setProfile(prev => ({ ...prev, [key]: value }));

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Chargement...</div>;

  return (
    <div style={{ paddingBottom: 130, maxWidth: 600, margin: '0 auto' }}>
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, padding: '12px 20px',
          background: toast.isError ? '#fb7185' : '#22c55e', color: '#0a0e1a',
          borderRadius: 10, fontWeight: 800, fontSize: 13, letterSpacing: 0.5,
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)', zIndex: 10000,
        }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '24px 0 20px' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(34,211,238,0.12)', border: '2px solid rgba(34,211,238,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 900, color: '#a3e635',
        }}>
          {(profile?.first_name || user?.email || '?')[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9' }}>Mon compte</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>{user?.email}</div>
        </div>
      </div>

      {/* Identité */}
      <Section title="Identite" icon={User}>
        <div style={S.row}>
          <Field label="Prenom" value={profile?.first_name || ''} onChange={v => update('first_name', v)} />
          <Field label="Nom" value={profile?.last_name || ''} onChange={v => update('last_name', v)} />
        </div>
        <Field label="Email" value={user?.email || ''} disabled />
        <Field label="Telephone" value={profile?.phone || ''} onChange={v => update('phone', v)} />
      </Section>

      {/* Club */}
      <Section title="Mon club" icon={Building2}>
        <div style={S.field}>
          <label style={S.label}>Couleur du club</label>
          <div style={{display:'flex', flexWrap:'wrap', gap:8, marginTop:4}}>
            {['#a3e635','#818cf8','#f59e0b','#34d399','#fb7185','#f472b6',
              '#60a5fa','#ff6b35','#34d399','#e879f9','#facc15','#f1f5f9'].map(color => (
              <button
                key={color}
                onClick={() => update('club_color', color)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: color,
                  border: profile?.club_color === color ? '3px solid #fff' : '3px solid transparent',
                  cursor: 'pointer',
                  boxShadow: profile?.club_color === color ? `0 0 0 2px ${color}` : 'none',
                  transition: 'all 0.15s',
                }}
              />
            ))}
          </div>
        </div>
        <Field
          label="Nom du club"
          value={profile?.club_name || ''}
          onChange={!clubNameLocked ? v => update('club_name', v) : undefined}
          disabled={clubNameLocked}
          placeholder="Nom de votre club"
        />
        {clubNameLocked && (
          <div style={{fontSize:11, color:'#64748b', marginTop:-8, marginBottom:12}}>
            Le nom du club ne peut pas être modifié après inscription.
          </div>
        )}
        <div style={S.field}>
          <label style={S.label}>Logo du club</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {profile?.club_logo_url ? (
              <img src={profile.club_logo_url} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: 48, height: 48, borderRadius: 8,
                background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748b', fontSize: 11,
              }}>
                Logo
              </div>
            )}
            <label style={{
              padding: '8px 16px', background: 'rgba(34,211,238,0.08)',
              border: '1px solid rgba(34,211,238,0.2)', borderRadius: 8,
              color: '#a3e635', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
              Choisir un fichier
              <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      </Section>

      {/* Sécurité */}
      <Section title="Securite" icon={Lock}>
        {!showPassword ? (
          <button onClick={() => setShowPassword(true)} style={S.actionBtn}>
            Changer le mot de passe
          </button>
        ) : (
          <div>
            <Field label="Nouveau mot de passe" type="password" value={passwordForm.new1} onChange={v => setPasswordForm(p => ({ ...p, new1: v }))} placeholder="Minimum 6 caracteres" />
            <Field label="Confirmer le mot de passe" type="password" value={passwordForm.new2} onChange={v => setPasswordForm(p => ({ ...p, new2: v }))} placeholder="Saisissez a nouveau" />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={changePassword} disabled={saving} style={{...S.saveBtn, flex: 1}}>
                {saving ? 'Modification...' : 'Modifier le mot de passe'}
              </button>
              <button onClick={() => { setShowPassword(false); setPasswordForm({ current: '', new1: '', new2: '' }); }} style={S.cancelBtn}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* Infos compte */}
      <Section title="Informations" icon={Shield}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
          <span style={{ color: '#64748b' }}>Plan</span>
          <span style={{ color: '#a3e635', fontWeight: 700 }}>Beta gratuite</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
          <span style={{ color: '#64748b' }}>Inscrit le</span>
          <span style={{ color: '#94a3b8' }}>{user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '-'}</span>
        </div>
      </Section>

      {/* Infos bancaires */}
      <Section title="Informations de paiement" icon="💳">
        <Field label="IBAN" value={profile?.iban || ''} onChange={v => update('iban', v)} placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX" />
        <Field label="Informations de paiement" value={profile?.payment_info || ''} onChange={v => update('payment_info', v)} placeholder="Ex: Virement bancaire, chèque à l'ordre de..." />
        <Field label="Lien de paiement (HelloAsso, PayPal...)" value={profile?.payment_link || ''} onChange={v => update('payment_link', v)} placeholder="https://www.helloasso.com/..." />
      </Section>
      {/* Bouton sauvegarder */}
      <button onClick={saveProfile} disabled={saving} style={S.saveBtn}>
        {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
      </button>

      {/* Déconnexion */}
      <button onClick={signOut} style={{
        width: '100%', marginTop: 16, padding: '14px',
        background: 'transparent', border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: 10, color: '#fb7185', fontSize: 14, fontWeight: 700,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <LogOut size={16} /> Se deconnecter
      </button>
    </div>
  );
}

// Sous-composants
function Section({ title, icon: Icon, children }) {
  return (
    <div style={{
      background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16, padding: 20, marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {Icon && <Icon size={16} color="#a3e635" />}
        <span style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, disabled, type, placeholder }) {
  return (
    <div style={S.field}>
      <label style={S.label}>{label}</label>
      <input
        style={{...S.input, opacity: disabled ? 0.5 : 1}}
        type={type || 'text'}
        value={value}
        onChange={onChange ? e => onChange(e.target.value) : undefined}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  );
}

const S = {
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { marginBottom: 12 },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4, letterSpacing: 0.3 },
  input: { width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, color: '#f1f5f9', fontFamily: "'Manrope', system-ui, sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  saveBtn: { width: '100%', padding: '14px', background: '#a3e635', color: '#060a12', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: 'pointer', marginTop: 8 },
  cancelBtn: { padding: '14px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#94a3b8', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  actionBtn: { width: '100%', padding: '12px', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 8, color: '#a3e635', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
};