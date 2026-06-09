import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Shield, User, Mail, Check, X, Edit2, Trash2, RefreshCw } from 'lucide-react';

// ============================================================
// TeamView — Gestion équipe & droits d'accès
// ============================================================

const ROLES = [
  { val:'admin',     label:'Administrateur', color:'#f97316', desc:'Accès complet à tous les modules' },
  { val:'assistant', label:'Assistant coach', color:'#a3e635', desc:'Gestion sportive du club' },
  { val:'secretary', label:'Secrétaire',      color:'#22d3ee', desc:'Gestion administrative' },
  { val:'volunteer', label:'Bénévole',         color:'#818cf8', desc:'Accès limité défini manuellement' },
];

const MODULES = [
  { id:'tournaments',   label:'Tournois',          emoji:'🏆' },
  { id:'licencies',     label:'Licenciés',          emoji:'👥' },
  { id:'stages',        label:'Stages',             emoji:'🏕️' },
  { id:'communication', label:'Communication',      emoji:'💬' },
  { id:'sponsors',      label:'Sponsors',           emoji:'🤝' },
  { id:'compositions',  label:'Compositions',       emoji:'⚽' },
  { id:'planning',      label:'Planning',           emoji:'📅' },
  { id:'scoreboard',    label:'Table de marque',    emoji:'📊' },
  { id:'inscriptions',  label:'Inscriptions',       emoji:'📋' },
];

const DEFAULT_PERMISSIONS = {
  admin:     Object.fromEntries(MODULES.map(m => [m.id, true])),
  assistant: { tournaments:true, licencies:true, compositions:true, planning:true, scoreboard:true, stages:false, communication:true, sponsors:false, inscriptions:false },
  secretary: { tournaments:false, licencies:true, stages:true, communication:true, sponsors:true, compositions:false, planning:true, scoreboard:false, inscriptions:true },
  volunteer: { tournaments:false, licencies:false, stages:false, communication:true, sponsors:false, compositions:false, planning:true, scoreboard:true, inscriptions:false },
};

const S = {
  page: { padding:'0 0 60px' },
  title: { fontSize:22, fontWeight:900, color:'#f1f5f9', marginBottom:4 },
  sub: { fontSize:13, color:'#64748b', marginBottom:24 },
  btn: { display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, border:'none', background:'#a3e635', color:'#0a0e1a', cursor:'pointer', fontSize:14, fontWeight:700, fontFamily:'inherit' },
  btnGhost: { display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#94a3b8', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit' },
  card: { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'18px 20px', marginBottom:10 },
  inp: { width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#f1f5f9', fontSize:14, fontFamily:'inherit', boxSizing:'border-box' },
  lbl: { fontSize:12, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.8, marginBottom:6, display:'block' },
};

export function TeamView() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [profile, setProfile] = useState(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: prof } = await supabase.from('profiles').select('club_name,club_color,club_logo_url').eq('id', user.id).single();
    setProfile(prof);
    const { data } = await supabase.from('club_members').select('*').eq('club_owner_id', user.id).order('invited_at', { ascending:false });
    setMembers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteMember = async (id) => {
    if (!window.confirm('Supprimer ce membre ?')) return;
    await supabase.from('club_members').delete().eq('id', id);
    load();
  };

  const toggleStatus = async (member) => {
    const newStatus = member.status === 'active' ? 'suspended' : 'active';
    await supabase.from('club_members').update({ status: newStatus }).eq('id', member.id);
    load();
  };

  const resendInvite = async (member) => {
    await supabase.functions.invoke('send-member-invitation', {
      body: {
        email: member.email,
        first_name: member.first_name,
        last_name: member.last_name,
        role: member.role,
        club_name: profile?.club_name,
        club_color: profile?.club_color,
        club_logo_url: profile?.club_logo_url,
        invite_token: member.invite_token,
      }
    });
    alert('Invitation renvoyée !');
  };

  const activeCount = members.filter(m => m.status === 'active').length;
  const invitedCount = members.filter(m => m.status === 'invited').length;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28 }}>
        <div>
          <h2 style={S.title}>👥 Équipe & Droits</h2>
          <p style={S.sub}>Gérez les accès de votre équipe à FootPlanner</p>
        </div>
        <button style={S.btn} onClick={() => { setEditMember(null); setWizardOpen(true); }}>
          <Plus size={16} /> Inviter un membre
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:28 }}>
        {[
          { val:members.length, lbl:'Membres total', color:'#a3e635' },
          { val:activeCount,    lbl:'Actifs',         color:'#34d399' },
          { val:invitedCount,   lbl:'En attente',      color:'#f59e0b' },
        ].map(s => (
          <div key={s.lbl} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'16px 20px' }}>
            <div style={{ fontSize:26, fontWeight:900, color:s.color }}>{s.val}</div>
            <div style={{ fontSize:12, color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:1 }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Liste membres */}
      {loading ? (
        <div style={{ color:'#64748b', textAlign:'center', padding:40 }}>Chargement...</div>
      ) : members.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 32px', color:'#475569' }}>
          <Shield size={40} style={{ marginBottom:12, opacity:0.4 }} />
          <p style={{ fontSize:15, marginBottom:4 }}>Aucun membre invité</p>
          <p style={{ fontSize:13 }}>Invitez des assistants, secrétaires ou bénévoles</p>
        </div>
      ) : <>
      {/* Carte admin principal */}
      <div style={{ ...S.card, borderColor:'rgba(163,230,53,0.25)', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'rgba(163,230,53,0.15)', border:'1px solid rgba(163,230,53,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
            {profile?.club_name?.[0]?.toUpperCase() || '👑'}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{ fontSize:15, fontWeight:800, color:'#f1f5f9' }}>{profile?.club_name || 'Administrateur'}</span>
              <span style={{ fontSize:11, fontWeight:700, color:'#a3e635', background:'rgba(163,230,53,0.15)', padding:'2px 8px', borderRadius:10 }}>Administrateur</span>
              <span style={{ fontSize:11, fontWeight:700, color:'#34d399', background:'rgba(52,211,153,0.1)', padding:'2px 8px', borderRadius:10 }}>✓ Vous</span>
            </div>
            <div style={{ fontSize:12, color:'#64748b' }}>🔐 Accès complet à tous les modules</div>
          </div>
        </div>
      </div>
      {members.map(member => {
        const role = ROLES.find(r => r.val === member.role) || ROLES[1];
        const permCount = Object.values(member.permissions || {}).filter(Boolean).length;
        return (
          <div key={member.id} style={S.card}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              {/* Avatar */}
              <div style={{ width:44, height:44, borderRadius:12, background:`${role.color}20`, border:`1px solid ${role.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                {member.first_name?.[0]?.toUpperCase() || '?'}
              </div>
              {/* Infos */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                  <span style={{ fontSize:15, fontWeight:800, color:'#f1f5f9' }}>{member.first_name} {member.last_name}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:role.color, background:`${role.color}15`, padding:'2px 8px', borderRadius:10 }}>{role.label}</span>
                  <span style={{ fontSize:11, fontWeight:700, color: member.status==='active' ? '#34d399' : member.status==='suspended' ? '#fb7185' : '#f59e0b', background: member.status==='active' ? 'rgba(52,211,153,0.1)' : member.status==='suspended' ? 'rgba(251,113,133,0.1)' : 'rgba(245,158,11,0.1)', padding:'2px 8px', borderRadius:10 }}>
                    {member.status==='active' ? '✓ Actif' : member.status==='suspended' ? '⏸ Suspendu' : '⏳ Invitation envoyée'}
                  </span>
                </div>
                <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                  <span style={{ fontSize:12, color:'#64748b' }}>✉ {member.email}</span>
                  <span style={{ fontSize:12, color:'#64748b' }}>🔐 {permCount}/{MODULES.length} modules</span>
                  {member.last_login && <span style={{ fontSize:12, color:'#64748b' }}>🕐 Dernière connexion : {new Date(member.last_login).toLocaleDateString('fr-FR')}</span>}
                </div>
                {/* Badges modules */}
                <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:6 }}>
                  {MODULES.filter(m => member.permissions?.[m.id]).map(m => (
                    <span key={m.id} style={{ fontSize:10, color:'#64748b', background:'rgba(255,255,255,0.06)', padding:'2px 6px', borderRadius:6 }}>{m.emoji} {m.label}</span>
                  ))}
                </div>
              </div>
              {/* Actions */}
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                {member.status === 'invited' && (
                  <button onClick={() => resendInvite(member)} title="Renvoyer l'invitation" style={{ ...S.btnGhost, fontSize:12 }}>
                    <RefreshCw size={13} /> Renvoyer
                  </button>
                )}
                <button onClick={() => toggleStatus(member)} title={member.status==='active'?'Suspendre':'Réactiver'} style={{ ...S.btnGhost, color: member.status==='active'?'#fb7185':'#34d399', fontSize:12 }}>
                  {member.status==='active' ? <X size={13}/> : <Check size={13}/>}
                  {member.status==='active' ? 'Suspendre' : 'Réactiver'}
                </button>
                <button onClick={() => { setEditMember(member); setWizardOpen(true); }} style={S.btnGhost}>
                  <Edit2 size={13} />
                </button>
                <button onClick={() => deleteMember(member.id)} style={{ ...S.btnGhost, color:'#fb7185' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      </>}
      {wizardOpen && (
        <MemberWizard
          member={editMember}
          profile={profile}
          onClose={() => { setWizardOpen(false); setEditMember(null); }}
          onSaved={() => { setWizardOpen(false); setEditMember(null); load(); }}
        />
      )}
    </div>
  );
}

// ============================================================
// MEMBER WIZARD
// ============================================================
function MemberWizard({ member, profile, onClose, onSaved }) {
  const isEdit = !!member;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    email: member?.email || '',
    first_name: member?.first_name || '',
    last_name: member?.last_name || '',
    role: member?.role || 'assistant',
    permissions: member?.permissions || { ...DEFAULT_PERMISSIONS['assistant'] },
  });

  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const handleRoleChange = (role) => {
    set('role', role);
    set('permissions', { ...DEFAULT_PERMISSIONS[role] });
  };

  const togglePerm = (moduleId) => {
    set('permissions', { ...form.permissions, [moduleId]: !form.permissions[moduleId] });
  };

  const save = async () => {
    if (!form.email.trim() || !form.first_name.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (isEdit) {
      await supabase.from('club_members').update({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        role: form.role,
        permissions: form.permissions,
      }).eq('id', member.id);
    } else {
      const { data: newMember } = await supabase.from('club_members').insert({
        club_owner_id: user.id,
        email: form.email.trim().toLowerCase(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        role: form.role,
        permissions: form.permissions,
        status: 'invited',
      }).select('invite_token').single();

      // Envoyer email d'invitation
      if (newMember?.invite_token) {
        await supabase.functions.invoke('send-member-invitation', {
          body: {
            email: form.email.trim(),
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            role: form.role,
            club_name: profile?.club_name,
            club_color: profile?.club_color,
            club_logo_url: profile?.club_logo_url,
            invite_token: newMember.invite_token,
          }
        });
      }
    }
    setSaving(false);
    onSaved();
  };

  const selectedRole = ROLES.find(r => r.val === form.role) || ROLES[1];
  const permCount = Object.values(form.permissions).filter(Boolean).length;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'#0f172a', border:'1px solid rgba(163,230,53,0.2)', borderRadius:16, width:'100%', maxWidth:580, maxHeight:'92vh', overflow:'auto', padding:32 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <h3 style={{ color:'#f1f5f9', fontSize:18, fontWeight:800, margin:0 }}>{isEdit ? 'Modifier les droits' : 'Inviter un membre'}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:20 }}>✕</button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Email — disabled en edit */}
          {!isEdit && (
            <div>
              <label style={S.lbl}>Email *</label>
              <input type="email" style={S.inp} value={form.email} onChange={e=>set('email',e.target.value)} placeholder="prenom@club.fr" />
            </div>
          )}

          {/* Prénom / Nom */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={S.lbl}>Prénom *</label>
              <input style={S.inp} value={form.first_name} onChange={e=>set('first_name',e.target.value)} placeholder="Thomas" />
            </div>
            <div>
              <label style={S.lbl}>Nom</label>
              <input style={S.inp} value={form.last_name} onChange={e=>set('last_name',e.target.value)} placeholder="Dupont" />
            </div>
          </div>

          {/* Rôle */}
          <div>
            <label style={S.lbl}>Rôle</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {ROLES.map(r => (
                <button key={r.val} onClick={() => handleRoleChange(r.val)} style={{
                  padding:'10px 14px', borderRadius:10, border:'1px solid', cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all 0.15s',
                  borderColor: form.role===r.val ? r.color : 'rgba(255,255,255,0.1)',
                  background: form.role===r.val ? `${r.color}15` : 'rgba(255,255,255,0.02)',
                }}>
                  <div style={{ fontSize:13, fontWeight:800, color: form.role===r.val ? r.color : '#94a3b8', marginBottom:2 }}>{r.label}</div>
                  <div style={{ fontSize:11, color:'#475569' }}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Permissions modules */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <label style={{ ...S.lbl, marginBottom:0 }}>Modules accessibles</label>
              <span style={{ fontSize:12, color:selectedRole.color, fontWeight:700 }}>{permCount}/{MODULES.length} activés</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {MODULES.map(mod => {
                const active = !!form.permissions[mod.id];
                return (
                  <label key={mod.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, border:'1px solid', cursor:'pointer', transition:'all 0.15s',
                    borderColor: active ? `${selectedRole.color}44` : 'rgba(255,255,255,0.07)',
                    background: active ? `${selectedRole.color}08` : 'rgba(255,255,255,0.02)',
                  }}>
                    <input type="checkbox" checked={active} onChange={() => togglePerm(mod.id)} style={{ accentColor:selectedRole.color, width:16, height:16 }} />
                    <span style={{ fontSize:13, fontWeight:600, color: active ? '#f1f5f9' : '#64748b' }}>{mod.emoji} {mod.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Info email */}
          {!isEdit && (
            <div style={{ padding:'12px 16px', borderRadius:10, background:'rgba(163,230,53,0.06)', border:'1px solid rgba(163,230,53,0.15)', fontSize:13, color:'#94a3b8' }}>
              📧 Un email d'invitation sera envoyé à <strong style={{ color:'#a3e635' }}>{form.email || 'l\'adresse saisie'}</strong> avec un lien pour créer son mot de passe.
            </div>
          )}
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:24 }}>
          <button onClick={onClose} style={S.btnGhost}>Annuler</button>
          <button onClick={save} disabled={saving || !form.email.trim() || !form.first_name.trim()} style={{ ...S.btn, opacity: saving || !form.email.trim() || !form.first_name.trim() ? 0.5 : 1 }}>
            {saving ? 'Enregistrement...' : isEdit ? '✓ Mettre à jour' : '📧 Envoyer l\'invitation'}
          </button>
        </div>
      </div>
    </div>
  );
}
