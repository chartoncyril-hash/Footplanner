import React, { useState, useEffect, useCallback } from 'react';
import { EmergencyContactsSection, LegalGuardiansSection } from './LicencieContactsSection';
import { supabase } from '../lib/supabase';
import { Calendar, Bell, User, MessageCircle, Home } from 'lucide-react';
import { ChatModule } from './chat/ChatModule';

// ============================================================
// LicencieApp — Espace licencié / parent
// ============================================================

export function LicencieApp({ user, signOut }) {
  const [familyProfile, setFamilyProfile] = useState(null);
  const [licencies, setLicencies] = useState([]);
  const [selectedLicId, setSelectedLicId] = useState(null);
  const [clubProfile, setClubProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingEvents, setPendingEvents] = useState(0);

  const load = useCallback(async () => {
    // 1. Charger le profil family
    const { data: fpData } = await supabase
      .from('family_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!fpData) { setLoading(false); return; }
    setFamilyProfile(fpData);

    // 2. Charger les licenciés liés
    const { data: licsData } = await supabase.rpc('get_licencies_for_parent', {
      p_family_profile_id: fpData.id
    });
    setLicencies(licsData || []);
    if (licsData?.length > 0) setSelectedLicId(licsData[0].id);

    // 3. Charger le profil du club
    if (fpData.club_owner_id) {
      const { data: cp } = await supabase
        .from('profiles')
        .select('club_name, club_color, club_logo_url, first_name, last_name')
        .eq('id', fpData.club_owner_id)
        .single();
      setClubProfile(cp);
    }

    // 4. Compter messages non lus
    const { count: unread } = await supabase
      .from('chat_messages')
      .select('*', { count:'exact', head:true })
      .eq('family_profile_id', fpData.id)
      .eq('sender_type', 'coach')
      .is('read_at', null);
    setUnreadCount(unread || 0);

    // 5. Compter événements en attente de réponse
    const { count: pending } = await supabase
      .from('event_responses')
      .select('*', { count:'exact', head:true })
      .in('licencie_id', (licsData||[]).map(l=>l.id))
      .eq('response', 'pending');
    setPendingEvents(pending || 0);

    setLoading(false);
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  const selectedLic = licencies.find(l => l.id === selectedLicId);
  const KID_PALETTE = ['#22d3ee','#a78bfa','#fbbf24','#34d399','#f472b6','#60a5fa','#fb923c','#2dd4bf'];
  const kidColor = (id) => { if(!id) return null; let h=0; for(let i=0;i<id.length;i++) h=(h*31+id.charCodeAt(i))>>>0; return KID_PALETTE[h % KID_PALETTE.length]; };
  const accent = (selectedLic ? kidColor(selectedLic.id) : null) || clubProfile?.club_color || '#a3e635';

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0a0e1a', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:32 }}>⚽</div>
      <div style={{ color:'#64748b', fontSize:14 }}>Chargement...</div>
    </div>
  );

  if (!familyProfile) return (
    <div style={{ minHeight:'100vh', background:'#0a0e1a', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ textAlign:'center', color:'#64748b', maxWidth:320 }}>
        <div style={{ fontSize:40, marginBottom:16 }}>🔒</div>
        <h2 style={{ color:'#f1f5f9', fontSize:18, fontWeight:800, marginBottom:8 }}>Accès non autorisé</h2>
        <p style={{ fontSize:14, marginBottom:20 }}>Votre compte n'est pas lié à un espace licencié. Contactez votre club.</p>
        <button onClick={signOut} style={{ padding:'10px 24px', borderRadius:10, border:'none', background:'rgba(255,255,255,0.05)', color:'#94a3b8', cursor:'pointer', fontFamily:'inherit', fontSize:14 }}>
          Se déconnecter
        </button>
      </div>
    </div>
  );

  const TABS = [
    { key:'home',    label:'Accueil',    icon:Home,          badge:0 },
    { key:'events',  label:'Événements', icon:Bell,          badge:pendingEvents },
    { key:'planning',label:'Planning',   icon:Calendar,      badge:0 },
    { key:'profile', label:'Mon profil', icon:User,          badge:0 },
    { key:'chat',    label:'Chat',       icon:MessageCircle, badge:unreadCount },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#0a0e1a', color:'#f1f5f9', fontFamily:'system-ui, sans-serif', paddingBottom:80 }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg, ${accent}22 0%, #0a0e1a 60%)`, borderBottom:`1px solid ${accent}22`, padding:'14px 20px', display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:50, backdropFilter:'blur(10px)' }}>
        {clubProfile?.club_logo_url
          ? <img src={clubProfile.club_logo_url} alt="" style={{ width:36, height:36, borderRadius:10, objectFit:'cover', flexShrink:0 }} />
          : <div style={{ width:36, height:36, borderRadius:10, background:`${accent}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>⚽</div>
        }
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:800, color:'#f1f5f9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{clubProfile?.club_name || 'Mon club'}</div>
          <div style={{ fontSize:11, color:'#64748b' }}>
            Bonjour {((Array.isArray(selectedLic?.legal_guardians) && selectedLic.legal_guardians[0]?.first_name?.trim()) || selectedLic?.first_name || familyProfile.first_name)} 👋
          </div>
        </div>
        <button onClick={signOut} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:11, padding:'4px 8px', borderRadius:6, fontFamily:'inherit' }}>
          Déco.
        </button>
      </div>

      {/* Switcher enfant (avatars colores) */}
      {licencies.length > 1 && (
        <div style={{ maxWidth:600, margin:'0 auto', display:'flex', gap:10, overflowX:'auto', padding:'14px 16px 6px', WebkitOverflowScrolling:'touch' }}>
          {licencies.map(l => {
            const c = kidColor(l.id);
            const on = l.id === selectedLicId;
            return (
              <div key={l.id} onClick={()=>setSelectedLicId(l.id)} style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:6, cursor:'pointer', width:60 }}>
                <div style={{ width:54, height:54, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:17, color:'#fff', position:'relative', overflow:'hidden', border:`2px solid ${on?c:'transparent'}`, boxShadow:on?`0 0 0 4px ${c}33, 0 8px 18px -6px ${c}`:'none', background:on?c:'#334155', opacity:on?1:0.6, filter:on?'none':'saturate(0.7)', transition:'.2s' }}>
                  {l.photo_url
                    ? <img src={l.photo_url} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
                    : `${(l.first_name[0]||'')}${(l.last_name[0]||'')}`}
                </div>
                <div style={{ fontSize:11, fontWeight:600, color:on?c:'#64748b', whiteSpace:'nowrap', maxWidth:60, overflow:'hidden', textOverflow:'ellipsis' }}>{l.first_name}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contenu */}
      <div style={{ maxWidth:600, margin:'0 auto', padding:'20px 16px' }}>
        {activeTab === 'home'    && <LicencieHome familyProfile={familyProfile} licencies={licencies} selectedLic={selectedLic} clubProfile={clubProfile} accent={accent} pendingEvents={pendingEvents} unreadCount={unreadCount} onTabChange={setActiveTab} onRefresh={load} />}
        {activeTab === 'events'  && <LicencieEvents familyProfile={familyProfile} licencies={licencies} selectedLic={selectedLic} accent={accent} onRefresh={load} />}
        {activeTab === 'planning'&& <LicienciePlanning familyProfile={familyProfile} licencies={licencies} selectedLic={selectedLic} accent={accent} />}
        {activeTab === 'profile' && <LicencieProfil familyProfile={familyProfile} licencies={licencies} selectedLic={selectedLic} setSelectedLicId={setSelectedLicId} accent={accent} onRefresh={load} />}
        {activeTab === 'chat'    && <ChatModule user={user} clubOwnerId={familyProfile.club_owner_id} isStaff={false} senderName={selectedLic ? (selectedLic.first_name + ' ' + selectedLic.last_name) : ((familyProfile.first_name || '') + ' ' + (familyProfile.last_name || ''))} familyProfile={familyProfile} voterLicencie={selectedLic} accent={accent} />}
      </div>

      {/* Bottom nav */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'rgba(10,14,26,0.97)', borderTop:'1px solid rgba(255,255,255,0.08)', display:'flex', backdropFilter:'blur(10px)', zIndex:50 }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, padding:'10px 4px', border:'none', background:'none', cursor:'pointer', position:'relative', transition:'all 0.15s' }}>
              <div style={{ position:'relative' }}>
                <Icon size={20} color={isActive ? accent : '#475569'} />
                {tab.badge > 0 && (
                  <div style={{ position:'absolute', top:-4, right:-6, width:16, height:16, borderRadius:'50%', background:'#fb7185', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color:'#fff' }}>{tab.badge > 9 ? '9+' : tab.badge}</div>
                )}
              </div>
              <span style={{ fontSize:10, fontWeight: isActive ? 700 : 500, color: isActive ? accent : '#475569' }}>{tab.label}</span>
              {isActive && <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:24, height:2, borderRadius:2, background:accent }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// LICENCIE HOME — Tableau de bord
// ============================================================
function LicencieHome({ familyProfile, licencies, selectedLic, clubProfile, accent, pendingEvents, unreadCount, onTabChange, onRefresh }) {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [stages, setStages] = useState([]);

  useEffect(() => {
    if (!selectedLic) return;
    (async () => {
      const today = new Date().toISOString().slice(0,10);
      // Événements à venir
      const { data: evts } = await supabase
        .from('event_responses')
        .select('*, club_events(title, date, time_start, location, type)')
        .eq('licencie_id', selectedLic.id)
        .order('responded_at', { ascending:false })
        .limit(10);
      setUpcomingEvents((evts||[]).filter(e => e.club_events && new Date(e.club_events.date) >= new Date()).slice(0,3));

      // Stages invités
      const { data: stageInvites } = await supabase
        .from('stage_invites')
        .select('*, stages(name, date_start, date_end, location, price)')
        .eq('licencie_id', selectedLic.id)
        .eq('status', 'invited')
        .limit(3);
      setStages((stageInvites||[]).filter(s => s.stages));
    })();
  }, [selectedLic]);

  const EVENT_EMOJIS = { training:'⚽', match:'🏆', tournament:'🥇', stage:'🏕️', meeting:'📋', other:'📌' };

  return (
    <div>
      {/* Carte licencié sélectionné */}
      {selectedLic && (
        <div style={{ background:`linear-gradient(135deg, ${accent}15 0%, rgba(255,255,255,0.03) 100%)`, border:`1px solid ${accent}33`, borderRadius:16, padding:'18px 20px', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            {selectedLic.photo_url
              ? <img src={selectedLic.photo_url} alt="" style={{ width:56, height:56, borderRadius:14, objectFit:'cover', border:`2px solid ${accent}44` }} />
              : <div style={{ width:56, height:56, borderRadius:14, background:`${accent}20`, border:`2px solid ${accent}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:900, color:accent }}>{selectedLic.first_name[0]}{selectedLic.last_name[0]}</div>
            }
            <div>
              <div style={{ fontSize:18, fontWeight:900, color:'#f1f5f9' }}>{selectedLic.first_name} {selectedLic.last_name}</div>
              <div style={{ display:'flex', gap:8, marginTop:4 }}>
                {selectedLic.category && <span style={{ fontSize:11, fontWeight:700, color:accent, background:`${accent}15`, padding:'2px 8px', borderRadius:10 }}>{selectedLic.category}</span>}
                {selectedLic.team && <span style={{ fontSize:11, color:'#64748b' }}>{selectedLic.team}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alertes */}
      {pendingEvents > 0 && (
        <button onClick={() => onTabChange('events')} style={{ width:'100%', marginBottom:12, padding:'12px 16px', borderRadius:12, border:'1px solid rgba(245,158,11,0.3)', background:'rgba(245,158,11,0.08)', cursor:'pointer', textAlign:'left', fontFamily:'inherit', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:20 }}>🔔</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#f59e0b' }}>{pendingEvents} réponse{pendingEvents>1?'s':''} en attente</div>
            <div style={{ fontSize:11, color:'#64748b' }}>Confirmez vos présences</div>
          </div>
          <span style={{ color:'#f59e0b', fontSize:16 }}>→</span>
        </button>
      )}
      {unreadCount > 0 && (
        <button onClick={() => onTabChange('chat')} style={{ width:'100%', marginBottom:12, padding:'12px 16px', borderRadius:12, border:'1px solid rgba(251,113,133,0.3)', background:'rgba(251,113,133,0.08)', cursor:'pointer', textAlign:'left', fontFamily:'inherit', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:20 }}>💬</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#fb7185' }}>{unreadCount} message{unreadCount>1?'s':''} non lu{unreadCount>1?'s':''}</div>
            <div style={{ fontSize:11, color:'#64748b' }}>Du coach</div>
          </div>
          <span style={{ color:'#fb7185', fontSize:16 }}>→</span>
        </button>
      )}

      {/* Prochains événements */}
      {upcomingEvents.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:1.5, marginBottom:10 }}>Prochains événements</div>
          {upcomingEvents.map(er => {
            const evt = er.club_events;
            const emoji = EVENT_EMOJIS[evt.type] || '📌';
            const respColor = er.response==='yes'?'#34d399':er.response==='no'?'#fb7185':er.response==='maybe'?'#f59e0b':'#64748b';
            return (
              <div key={er.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', marginBottom:8 }}>
                <span style={{ fontSize:20, flexShrink:0 }}>{emoji}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#f1f5f9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{evt.title}</div>
                  <div style={{ fontSize:11, color:'#64748b' }}>📅 {new Date(evt.date).toLocaleDateString('fr-FR',{weekday:'short',day:'2-digit',month:'short'})}{evt.time_start?` · ${evt.time_start.slice(0,5)}`:''}</div>
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:respColor }}>
                  {er.response==='yes'?'✅':er.response==='no'?'❌':er.response==='maybe'?'❓':'⏳'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Stages invités */}
      {stages.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:1.5, marginBottom:10 }}>Stages disponibles</div>
          {stages.map(si => {
            const stage = si.stages;
            return (
              <div key={si.id} style={{ padding:'12px 14px', borderRadius:10, background:'rgba(129,140,248,0.06)', border:'1px solid rgba(129,140,248,0.2)', marginBottom:8 }}>
                <div style={{ fontSize:13, fontWeight:800, color:'#f1f5f9', marginBottom:4 }}>🏕️ {stage.name}</div>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  {stage.date_start && <span style={{ fontSize:11, color:'#64748b' }}>📅 {new Date(stage.date_start).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}</span>}
                  {stage.location && <span style={{ fontSize:11, color:'#64748b' }}>📍 {stage.location}</span>}
                  {stage.price > 0 && <span style={{ fontSize:11, color:'#a78bfa', fontWeight:700 }}>{stage.price}€</span>}
                </div>
                <a href={`/?stage=${si.token}`} style={{ display:'inline-block', marginTop:8, padding:'5px 14px', borderRadius:8, background:'rgba(129,140,248,0.15)', color:'#a78bfa', fontSize:12, fontWeight:700, textDecoration:'none', border:'1px solid rgba(129,140,248,0.25)' }}>
                  Voir le stage →
                </a>
              </div>
            );
          })}
        </div>
      )}

      {upcomingEvents.length === 0 && stages.length === 0 && pendingEvents === 0 && (
        <div style={{ textAlign:'center', padding:'40px 24px', color:'#334155' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🌟</div>
          <p style={{ fontSize:15, color:'#475569' }}>Tout est à jour !</p>
          <p style={{ fontSize:13 }}>Aucune action en attente</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// LICENCIE EVENTS — Présences + Sondages
// ============================================================
function LicencieEvents({ familyProfile, licencies, selectedLic, accent, onRefresh }) {
  const [responses, setResponses] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('presences');

  const load = useCallback(async () => {
    if (!selectedLic) return;
    // Réponses événements
    const { data: resp } = await supabase
      .from('event_responses')
      .select('*, club_events(*)')
      .eq('licencie_id', selectedLic.id)
      .order('responded_at', { ascending:false });
    setResponses((resp||[]).filter(r => r.club_events));

    // Sondages en cours
    const { data: survs } = await supabase
      .from('surveys')
      .select('*, survey_responses(*)')
      .eq('event_id', responses.map(r=>r.event_id).filter(Boolean)[0] || '00000000-0000-0000-0000-000000000000');
    setSurveys(survs || []);
    setLoading(false);
  }, [selectedLic]);

  useEffect(() => { load(); }, [load]);

  const updateResponse = async (responseId, newResp, canDrive=false, driveSeats=0, comment='') => {
    await supabase.from('event_responses').update({
      response: newResp, can_drive: canDrive,
      drive_seats: driveSeats, comment: comment || null,
    }).eq('id', responseId);
    load(); onRefresh();
  };

  const pending = responses.filter(r => r.response === 'pending' && new Date(r.club_events?.date) >= new Date());
  const upcoming = responses.filter(r => r.response !== 'pending' && new Date(r.club_events?.date) >= new Date());
  const past = responses.filter(r => new Date(r.club_events?.date) < new Date());

  const EVENT_EMOJIS = { training:'⚽', match:'🏆', tournament:'🥇', stage:'🏕️', meeting:'📋', other:'📌' };

  const EventCard = ({ er, showActions=true }) => {
    const evt = er.club_events;
    if (!evt) return null;
    const emoji = EVENT_EMOJIS[evt.type] || '📌';
    const [expanded, setExpanded] = useState(false);
    const [localResp, setLocalResp] = useState(er.response);
    const [canDrive, setCanDrive] = useState(er.can_drive || false);
    const [seats, setSeats] = useState(er.drive_seats || 3);
    const [comment, setComment] = useState(er.comment || '');
    const [saving, setSaving] = useState(false);

    const doSave = async (resp) => {
      setSaving(true);
      setLocalResp(resp);
      await updateResponse(er.id, resp, canDrive, seats, comment);
      setSaving(false);
      setExpanded(false);
    };

    const RESP_OPTS = [
      { val:'yes',   label:'✅ Présent',   color:'#34d399', bg:'rgba(52,211,153,0.12)'  },
      { val:'no',    label:'❌ Absent',    color:'#fb7185', bg:'rgba(251,113,133,0.12)' },
      { val:'maybe', label:'❓ Peut-être', color:'#f59e0b', bg:'rgba(245,158,11,0.12)'  },
    ];
    const respColor = localResp==='yes'?'#34d399':localResp==='no'?'#fb7185':localResp==='maybe'?'#f59e0b':'#64748b';

    return (
      <div style={{ borderRadius:12, overflow:'hidden', border:`1px solid ${localResp==='pending'?'rgba(245,158,11,0.3)':'rgba(255,255,255,0.08)'}`, background: localResp==='pending'?'rgba(245,158,11,0.04)':'rgba(255,255,255,0.02)', marginBottom:10 }}>
        <button onClick={() => showActions && setExpanded(!expanded)} style={{ width:'100%', padding:'12px 16px', background:'none', border:'none', cursor: showActions?'pointer':'default', textAlign:'left', fontFamily:'inherit', display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:20 }}>{emoji}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#f1f5f9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{evt.title}</div>
            <div style={{ fontSize:11, color:'#64748b' }}>
              📅 {new Date(evt.date).toLocaleDateString('fr-FR',{weekday:'long',day:'2-digit',month:'long'})}
              {evt.time_start ? ` · ${evt.time_start.slice(0,5)}` : ''}
              {evt.location ? ` · 📍 ${evt.location}` : ''}
            </div>
          </div>
          <span style={{ fontSize:14, fontWeight:700, color:respColor }}>
            {localResp==='yes'?'✅':localResp==='no'?'❌':localResp==='maybe'?'❓':'⏳'}
          </span>
        </button>
        {expanded && showActions && (
          <div style={{ padding:'0 16px 16px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize:13, color:'#64748b', margin:'12px 0 10px' }}>Votre réponse :</p>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:12 }}>
              {RESP_OPTS.map(opt => (
                <button key={opt.val} onClick={() => doSave(opt.val)} disabled={saving} style={{ padding:'11px 16px', borderRadius:10, border:`2px solid ${localResp===opt.val?opt.color:'rgba(255,255,255,0.08)'}`, background:localResp===opt.val?opt.bg:'transparent', color:localResp===opt.val?opt.color:'#64748b', cursor:'pointer', fontFamily:'inherit', fontSize:14, fontWeight:700, transition:'all 0.15s' }}>
                  {opt.label}
                </button>
              ))}
            </div>
            {localResp === 'yes' && (
              <label style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:8, background:'rgba(52,211,153,0.06)', border:'1px solid rgba(52,211,153,0.15)', cursor:'pointer', marginBottom:10 }}>
                <input type="checkbox" checked={canDrive} onChange={e=>setCanDrive(e.target.checked)} style={{ accentColor:'#34d399' }} />
                <span style={{ fontSize:13, color:'#94a3b8' }}>🚗 Je peux conduire ({seats} places)</span>
              </label>
            )}
            <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Message pour le coach..." style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', color:'#f1f5f9', fontSize:12, fontFamily:'inherit', resize:'vertical', minHeight:60, boxSizing:'border-box' }} />
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div style={{ color:'#64748b', textAlign:'center', padding:40 }}>Chargement...</div>;

  return (
    <div>
      <h3 style={{ fontSize:18, fontWeight:900, color:'#f1f5f9', marginBottom:20 }}>📋 Événements</h3>
      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid rgba(255,255,255,0.08)', paddingBottom:0 }}>
        {[
          { key:'presences', label:`⏳ En attente (${pending.length})` },
          { key:'upcoming',  label:'📅 À venir' },
          { key:'past',      label:'✓ Passés' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ padding:'8px 14px', border:'none', background:'none', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700, color: activeTab===t.key ? accent : '#64748b', borderBottom: activeTab===t.key ? `2px solid ${accent}` : '2px solid transparent', marginBottom:-1 }}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'presences' && (
        pending.length === 0
          ? <div style={{ textAlign:'center', padding:'40px 0', color:'#334155' }}>✅ Toutes vos présences sont confirmées !</div>
          : pending.map(er => <EventCard key={er.id} er={er} showActions={true} />)
      )}
      {activeTab === 'upcoming' && (
        upcoming.length === 0
          ? <div style={{ textAlign:'center', padding:'40px 0', color:'#334155' }}>Aucun événement à venir</div>
          : upcoming.map(er => <EventCard key={er.id} er={er} showActions={true} />)
      )}
      {activeTab === 'past' && (
        past.length === 0
          ? <div style={{ textAlign:'center', padding:'40px 0', color:'#334155' }}>Aucun événement passé</div>
          : past.map(er => <EventCard key={er.id} er={er} showActions={false} />)
      )}
    </div>
  );
}

// ============================================================
// LICENCIE PLANNING — Vue semaine filtrée
// ============================================================
function LicienciePlanning({ familyProfile, licencies, selectedLic, accent }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);

  const getWeekStart = (offset=0) => {
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() - (day===0?6:day-1) + offset*7);
    d.setHours(0,0,0,0);
    return d;
  };

  useEffect(() => {
    if (!selectedLic) return;
    (async () => {
      setLoading(true);
      const ws = getWeekStart(weekOffset);
      const we = new Date(ws); we.setDate(we.getDate()+6);
      const { data } = await supabase
        .from('event_responses')
        .select('*, club_events(*)')
        .eq('licencie_id', selectedLic.id)
        .order('responded_at', { ascending:false });
      setEvents((data||[]).filter(e=>e.club_events && e.club_events.date >= ws.toISOString().slice(0,10) && e.club_events.date <= we.toISOString().slice(0,10)).sort((a,b)=>{
        const d=new Date(a.club_events.date)-new Date(b.club_events.date);
        if(d!==0) return d;
        return (a.club_events.time_start||'').localeCompare(b.club_events.time_start||'');
      }));
      setLoading(false);
    })();
  }, [selectedLic, weekOffset]);

  const ws = getWeekStart(weekOffset);
  const we = new Date(ws); we.setDate(we.getDate()+6);
  const wsStr = ws.toISOString().slice(0,10);
  const weStr = we.toISOString().slice(0,10);
  const DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  const today = new Date(); today.setHours(0,0,0,0);
  const todayStr = today.toISOString().slice(0,10);
  const EVENT_COLORS = { training:'#34d399', match:'#f59e0b', tournament:'#f97316', stage:'#a78bfa', meeting:'#22d3ee', other:'#94a3b8' };
  const TYPE_LABELS = { training:'Entrainement', match:'Match', tournament:'Tournoi', stage:'Stage', meeting:'Reunion', other:'Evenement' };
  const weekDays = Array.from({length:7}, (_,i)=>{ const d=new Date(ws); d.setDate(d.getDate()+i); return d; });

  const inWeek = todayStr >= wsStr && todayStr <= weStr;
  const effectiveDay = (selectedDay && selectedDay >= wsStr && selectedDay <= weStr) ? selectedDay : (inWeek ? todayStr : wsStr);
  const dayEvents = events.filter(e => e.club_events?.date === effectiveDay);
  const effDateObj = new Date(effectiveDay + 'T00:00:00');
  const cap = s => s ? s.charAt(0).toUpperCase()+s.slice(1) : s;

  const navBtn = { width:34, height:34, borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#94a3b8', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' };
  const Chevron = ({dir}) => (<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">{dir==='l'?<path d="M15 18l-6-6 6-6"/>:<path d="M9 18l6-6-6-6"/>}</svg>);

  const RESP = {
    yes:    { bg:'rgba(52,211,153,0.15)',  c:'#34d399' },
    no:     { bg:'rgba(251,113,133,0.15)', c:'#fb7185' },
    maybe:  { bg:'rgba(245,158,11,0.15)',  c:'#f59e0b' },
    pending:{ bg:'rgba(148,163,184,0.12)', c:'#94a3b8' },
  };
  const RespIcon = ({r}) => {
    const st = { width:19, height:19 };
    if(r==='yes') return <svg viewBox="0 0 24 24" style={st} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
    if(r==='no') return <svg viewBox="0 0 24 24" style={st} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>;
    if(r==='maybe') return <svg viewBox="0 0 24 24" style={st} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.6-2.5 2-2.5 3.5"/><circle cx="12" cy="17" r="0.7" fill="currentColor"/></svg>;
    return <svg viewBox="0 0 24 24" style={st} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <h3 style={{ fontSize:22, fontWeight:900, color:'#f1f5f9', margin:0, flex:1, letterSpacing:'-0.5px' }}>Planning</h3>
        <button onClick={()=>{setWeekOffset(w=>w-1); setSelectedDay(null);}} style={navBtn}><Chevron dir="l"/></button>
        <button onClick={()=>{setWeekOffset(0); setSelectedDay(null);}} style={{ padding:'0 14px', height:34, borderRadius:10, border:`1px solid ${accent}55`, background:`${accent}15`, color:accent, cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700 }}>Auj.</button>
        <button onClick={()=>{setWeekOffset(w=>w+1); setSelectedDay(null);}} style={navBtn}><Chevron dir="r"/></button>
      </div>
      <div style={{ fontSize:13, color:'#64748b', fontWeight:600, marginBottom:14 }}>
        {ws.toLocaleDateString('fr-FR',{day:'2-digit',month:'long'})} — {we.toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'})}
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:22 }}>
        {weekDays.map((day,i)=>{
          const dStr = day.toISOString().slice(0,10);
          const isActive = dStr===effectiveDay;
          const dayEvts = events.filter(e=>e.club_events?.date===dStr);
          return (
            <div key={i} onClick={()=>setSelectedDay(dStr)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:7, flex:1, cursor:'pointer' }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.5px', color:'#475569', textTransform:'uppercase' }}>{DAYS[i]}</div>
              <div style={{ width:34, height:34, borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, color:isActive?'#0a0e1a':'#94a3b8', background:isActive?accent:'transparent', border:isActive?'none':'1px solid rgba(255,255,255,0.08)', boxShadow:isActive?`0 6px 14px -5px ${accent}`:'none', transition:'.15s' }}>{day.getDate()}</div>
              <div style={{ display:'flex', gap:3, height:6 }}>
                {dayEvts.slice(0,3).map(er=>(<i key={er.id} style={{ width:5, height:5, borderRadius:'50%', background:EVENT_COLORS[er.club_events?.type]||'#94a3b8', display:'block' }} />))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:8, margin:'4px 2px 13px', fontSize:14, fontWeight:800, color:'#94a3b8' }}>
        {cap(effDateObj.toLocaleDateString('fr-FR',{weekday:'long',day:'2-digit',month:'long'}))}
        <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.07)' }} />
      </div>

      {loading ? (
        <div style={{ color:'#64748b', textAlign:'center', padding:24 }}>Chargement...</div>
      ) : dayEvents.length===0 ? (
        <div style={{ textAlign:'center', padding:'34px 20px' }}>
          <div style={{ width:56, height:56, borderRadius:16, background:'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#475569" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></svg>
          </div>
          <p style={{ fontSize:14, fontWeight:600, color:'#64748b', margin:0 }}>Aucune activite ce jour</p>
        </div>
      ) : dayEvents.map(er=>{
        const evt = er.club_events;
        const color = EVENT_COLORS[evt.type]||'#94a3b8';
        const rs = RESP[er.response] || RESP.pending;
        return (
          <div key={er.id} style={{ display:'flex', alignItems:'center', gap:13, borderRadius:15, padding:'13px 14px', marginBottom:11, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderLeft:`3px solid ${color}` }}>
            <div style={{ width:48, textAlign:'center', flexShrink:0 }}>
              <div style={{ fontWeight:800, fontSize:15, color:'#f1f5f9' }}>{evt.time_start?evt.time_start.slice(0,5):'--'}</div>
            </div>
            <div style={{ width:1, alignSelf:'stretch', background:'rgba(255,255,255,0.07)' }} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:15, color:'#f1f5f9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{evt.title}</div>
              <div style={{ fontSize:12, color:'#94a3b8', marginTop:3, display:'flex', alignItems:'center', gap:5 }}>
                {evt.location ? (
                  <><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#64748b" strokeWidth="2"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>{evt.location}</>
                ) : (TYPE_LABELS[evt.type]||'Evenement')}
              </div>
            </div>
            <div style={{ width:34, height:34, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:rs.bg, color:rs.c }}>
              <RespIcon r={er.response||'pending'} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// LICENCIE PROFIL — Fiche modifiable + RGPD
// ============================================================
function LicencieProfil({ familyProfile, licencies, selectedLic, setSelectedLicId, accent, onRefresh }) {
  const blank = (lic) => ({
    first_name: lic?.first_name || '',
    last_name: lic?.last_name || '',
    birth_date: lic?.birth_date || '',
    gender: lic?.gender || '',
    strong_foot: lic?.strong_foot || '',
    preferred_number: (lic?.preferred_number ?? '') === null ? '' : (lic?.preferred_number ?? ''),
    allergies: lic?.allergies || '',
    contre_indications: lic?.medical_notes || '',
    medical_consent: lic?.medical_consent || false,
    emergency_contacts: Array.isArray(lic?.emergency_contacts) ? lic.emergency_contacts : [],
    legal_guardians: Array.isArray(lic?.legal_guardians) ? lic.legal_guardians : [],
  });
  const [form, setForm] = useState(blank(selectedLic));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileRef = React.useRef();

  useEffect(() => { if (selectedLic) setForm(blank(selectedLic)); }, [selectedLic?.id]);

  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const isLocked = (key) => {
    const v = selectedLic?.[key];
    if (key === 'preferred_number') return v !== null && v !== undefined && v !== '';
    return v !== null && v !== undefined && String(v).trim() !== '';
  };

  const FIELD_DEFS = [
    { key:'first_name', label:'Prénom', type:'text', required:true },
    { key:'last_name', label:'Nom', type:'text', required:true },
    { key:'birth_date', label:'Date de naissance', type:'date', required:true },
    { key:'gender', label:'Sexe', type:'select', required:true, options:[['M','Masculin'],['F','Féminin']] },
    { key:'strong_foot', label:'Pied fort', type:'select', required:false, options:[['droit','Droit'],['gauche','Gauche']] },
    { key:'preferred_number', label:'Numéro de maillot préféré', type:'number', required:false, placeholder:'Ex: 10' },
  ];
  const fmtVal = (def, v) => {
    if (v === null || v === undefined || v === '') return '—';
    if (def.type === 'date') return new Date(v).toLocaleDateString('fr-FR');
    if (def.options) { const o = def.options.find(([val]) => String(val) === String(v)); return o ? o[1] : v; }
    return v;
  };

  const save = async () => {
    if (!selectedLic) return;
    setError('');
    const missing = FIELD_DEFS.filter(d => d.required && !isLocked(d.key) && !String(form[d.key] || '').trim()).map(d => d.label);
    if (missing.length) { setError('Champs obligatoires a completer : ' + missing.join(', ')); return; }
    setSaving(true);
    const payload = {
      allergies: form.allergies.trim() || null,
      contre_indications: form.contre_indications.trim() || null,
      medical_consent: form.medical_consent,
      medical_consent_at: form.medical_consent ? new Date().toISOString() : null,
      emergency_contacts: form.emergency_contacts,
      legal_guardians: form.legal_guardians,
      last_active_at: new Date().toISOString(),
    };
    if (!isLocked('first_name')) payload.first_name = form.first_name.trim();
    if (!isLocked('last_name')) payload.last_name = form.last_name.trim();
    if (!isLocked('birth_date')) payload.birth_date = form.birth_date || null;
    if (!isLocked('gender')) payload.gender = form.gender || null;
    if (!isLocked('strong_foot')) payload.strong_foot = form.strong_foot || null;
    if (!isLocked('preferred_number')) payload.preferred_number = form.preferred_number ? parseInt(form.preferred_number, 10) : null;

    const { error: err } = await supabase.from('licencies').update(payload).eq('id', selectedLic.id);
    setSaving(false);
    if (err) { setError("Erreur d enregistrement : " + err.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    onRefresh();
  };

  const uploadPhoto = async (file) => {
    if (!file || !selectedLic) return;
    setUploadingPhoto(true);
    const ext = file.name.split('.').pop();
    const path = `photos/${selectedLic.id}_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('licencies-docs').upload(path, file, { upsert:true, contentType:file.type });
    if (!upErr) {
      const { data } = supabase.storage.from('licencies-docs').getPublicUrl(path);
      await supabase.from('licencies').update({ photo_url: data.publicUrl }).eq('id', selectedLic.id);
      onRefresh();
    }
    setUploadingPhoto(false);
  };

  const inp = { width:'100%', padding:'11px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#f1f5f9', fontSize:14, fontFamily:'inherit', boxSizing:'border-box' };
  const lbl = { fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.8, marginBottom:6, display:'block' };
  const anyEditable = FIELD_DEFS.some(d => !isLocked(d.key));

  return (
    <div>
      <h3 style={{ fontSize:18, fontWeight:900, color:'#f1f5f9', marginBottom:20 }}>Mon profil</h3>

      

      {selectedLic && (
        <>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
            <div style={{ position:'relative', cursor:'pointer' }} onClick={() => fileRef.current?.click()}>
              {selectedLic.photo_url
                ? <img src={selectedLic.photo_url} alt="" style={{ width:72, height:72, borderRadius:16, objectFit:'cover', border:`2px solid ${accent}44` }} />
                : <div style={{ width:72, height:72, borderRadius:16, background:`${accent}20`, border:`2px solid ${accent}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:900, color:accent }}>{selectedLic.first_name[0]}{selectedLic.last_name[0]}</div>
              }
              <div style={{ position:'absolute', bottom:-4, right:-4, width:22, height:22, borderRadius:'50%', background:accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>📷</div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>uploadPhoto(e.target.files[0])} />
            </div>
            <div>
              <div style={{ fontSize:17, fontWeight:800, color:'#f1f5f9' }}>{selectedLic.first_name} {selectedLic.last_name}</div>
              <div style={{ display:'flex', gap:6, marginTop:4 }}>
                {selectedLic.category && <span style={{ fontSize:11, color:accent, fontWeight:700 }}>{selectedLic.category}</span>}
                {selectedLic.team && <span style={{ fontSize:11, color:'#64748b' }}>{selectedLic.team}</span>}
              </div>
              {uploadingPhoto && <div style={{ fontSize:11, color:'#64748b', marginTop:4 }}>Upload...</div>}
            </div>
          </div>

          <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'16px', marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Identité</div>
            {anyEditable
              ? <div style={{ fontSize:11, color:'#64748b', marginBottom:14, lineHeight:1.5 }}>Complétez les informations manquantes. Les champs déjà renseignés par le club (🔒) sont verrouillés.</div>
              : <div style={{ height:10 }} />}

            {FIELD_DEFS.map(def => isLocked(def.key) ? (
              <div key={def.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize:13, color:'#64748b' }}>🔒 {def.label}</span>
                <span style={{ fontSize:13, color:'#f1f5f9', fontWeight:600 }}>{fmtVal(def, selectedLic[def.key])}</span>
              </div>
            ) : (
              <div key={def.key} style={{ marginBottom:12 }}>
                <label style={lbl}>{def.label}{def.required && <span style={{ color:accent }}> *</span>}</label>
                {def.type === 'select'
                  ? <select style={inp} value={form[def.key]} onChange={e=>set(def.key, e.target.value)}>
                      <option value="" style={{ background:'#1e293b' }}>—</option>
                      {def.options.map(([v,l]) => <option key={v} value={v} style={{ background:'#1e293b' }}>{l}</option>)}
                    </select>
                  : <input style={inp} type={def.type} value={form[def.key]} onChange={e=>set(def.key, e.target.value)} placeholder={def.placeholder || ''} {...(def.type==='number' ? { min:1, max:99 } : {})} />}
              </div>
            ))}

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0' }}>
              <span style={{ fontSize:13, color:'#64748b' }}>🔒 Numéro de licence</span>
              <span style={{ fontSize:13, color:'#f1f5f9', fontWeight:600 }}>{selectedLic.licence_number || '—'}</span>
            </div>
          </div>

          <div style={{ marginBottom:20 }}>
            <LegalGuardiansSection guardians={form.legal_guardians} onChange={v=>set('legal_guardians', v)} />
          </div>

          <div style={{ marginBottom:20 }}>
            <EmergencyContactsSection contacts={form.emergency_contacts} onChange={v=>set('emergency_contacts', v)} />
          </div>

          <div style={{ background:'rgba(251,113,133,0.04)', border:'1px solid rgba(251,113,133,0.15)', borderRadius:12, padding:'16px', marginBottom:20 }}>
            <div style={{ fontSize:13, fontWeight:800, color:'#fb7185', marginBottom:12 }}>🏥 Données médicales</div>

            <label style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderRadius:8, border:'1px solid rgba(251,113,133,0.2)', background:'rgba(251,113,133,0.06)', cursor:'pointer', marginBottom:14 }}>
              <input type="checkbox" checked={form.medical_consent} onChange={e => set('medical_consent', e.target.checked)} style={{ accentColor:'#fb7185', width:16, height:16, marginTop:1, flexShrink:0 }} />
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'#f1f5f9', marginBottom:2 }}>Consentement RGPD</div>
                <div style={{ fontSize:11, color:'#94a3b8', lineHeight:1.5 }}>
                  J accepte que les données médicales de mon enfant soient conservées pour assurer sa sécurité lors des activités sportives. Je peux les supprimer à tout moment.
                </div>
                {selectedLic.medical_consent_at && <div style={{ fontSize:10, color:'#64748b', marginTop:4 }}>Consenti le {new Date(selectedLic.medical_consent_at).toLocaleDateString('fr-FR')}</div>}
              </div>
            </label>

            {form.medical_consent ? (
              <>
                <div style={{ marginBottom:12 }}>
                  <label style={lbl}>Allergies</label>
                  <input style={inp} value={form.allergies} onChange={e=>set('allergies',e.target.value)} placeholder="Aucune ou préciser..." />
                </div>
                <div>
                  <label style={lbl}>Contre-indications médicales</label>
                  <textarea style={{ ...inp, minHeight:70, resize:'vertical' }} value={form.contre_indications} onChange={e=>set('contre_indications',e.target.value)} placeholder="Aucune ou préciser..." />
                </div>
              </>
            ) : (
              <div style={{ fontSize:12, color:'#64748b', textAlign:'center', padding:'12px 0' }}>
                Acceptez le consentement pour saisir les données médicales
              </div>
            )}
          </div>

          {error && <div style={{ background:'rgba(251,113,133,0.1)', border:'1px solid rgba(251,113,133,0.3)', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:13, color:'#fb7185' }}>{error}</div>}

          <button onClick={save} disabled={saving} style={{ width:'100%', padding:'14px', borderRadius:12, border:'none', background:accent, color:'#0a0e1a', fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'inherit', opacity:saving?0.6:1 }}>
            {saving ? 'Enregistrement...' : saved ? '✓ Sauvegardé !' : 'Sauvegarder'}
          </button>
        </>
      )}
    </div>
  );
}

// ============================================================
// LICENCIE CHAT — Messagerie coach ↔ licencié
// ============================================================
function LicencieChat({ familyProfile, accent, onRefresh }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [senderName, setSenderName] = useState(`${familyProfile.first_name} ${familyProfile.last_name}`);
  const bottomRef = React.useRef();

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('family_profile_id', familyProfile.id)
      .order('responded_at', { ascending:false });
    setMessages(data || []);
    // Marquer comme lus
    await supabase.from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('family_profile_id', familyProfile.id)
      .eq('sender_type', 'coach')
      .is('read_at', null);
    setLoading(false);
    onRefresh();
  }, [familyProfile.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`chat_${familyProfile.id}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'chat_messages', filter:`family_profile_id=eq.${familyProfile.id}` }, () => load())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [familyProfile.id, load]);

  const send = async () => {
    if (!content.trim()) return;
    setSending(true);
    await supabase.from('chat_messages').insert({
      club_owner_id: familyProfile.club_owner_id,
      family_profile_id: familyProfile.id,
      sender_type: 'licencie',
      sender_name: senderName,
      content: content.trim(),
    });
    setContent('');
    setSending(false);
    load();
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 200px)', minHeight:400 }}>
      <h3 style={{ fontSize:18, fontWeight:900, color:'#f1f5f9', marginBottom:16, flexShrink:0 }}>💬 Chat avec le coach</h3>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:10, paddingBottom:10 }}>
        {loading ? (
          <div style={{ color:'#64748b', textAlign:'center', padding:20 }}>Chargement...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'#334155' }}>
            <div style={{ fontSize:32, marginBottom:8 }}>💬</div>
            <p style={{ fontSize:14 }}>Aucun message — démarrez la conversation !</p>
          </div>
        ) : messages.map(msg => {
          const isMe = msg.sender_type === 'licencie';
          return (
            <div key={msg.id} style={{ display:'flex', justifyContent: isMe?'flex-end':'flex-start' }}>
              <div style={{ maxWidth:'80%', padding:'10px 14px', borderRadius: isMe?'16px 16px 4px 16px':'16px 16px 16px 4px', background: isMe?`${accent}20`:'rgba(255,255,255,0.06)', border:`1px solid ${isMe?accent+'33':'rgba(255,255,255,0.08)'}` }}>
                {!isMe && <div style={{ fontSize:10, fontWeight:700, color:accent, marginBottom:4 }}>👤 {msg.sender_name || 'Coach'}</div>}
                <div style={{ fontSize:14, color:'#f1f5f9', lineHeight:1.5 }}>{msg.content}</div>
                <div style={{ fontSize:10, color:'#475569', marginTop:4, textAlign: isMe?'right':'left' }}>
                  {new Date(msg.created_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
                  {isMe && msg.read_at && ' · Lu'}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Saisie */}
      <div style={{ flexShrink:0, display:'flex', gap:8, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.08)' }}>
        <textarea
          value={content}
          onChange={e=>setContent(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Votre message... (Entrée pour envoyer)"
          style={{ flex:1, padding:'10px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#f1f5f9', fontSize:14, fontFamily:'inherit', resize:'none', minHeight:44, maxHeight:120 }}
          rows={1}
        />
        <button onClick={send} disabled={sending||!content.trim()} style={{ width:44, height:44, borderRadius:12, border:'none', background: content.trim()?accent:'rgba(255,255,255,0.05)', color: content.trim()?'#0a0e1a':'#475569', cursor: content.trim()?'pointer':'not-allowed', fontSize:18, flexShrink:0, alignSelf:'flex-end' }}>
          ↑
        </button>
      </div>
    </div>
  );
}
