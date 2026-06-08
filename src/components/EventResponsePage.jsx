import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, Clock, Car, CheckCircle } from 'lucide-react';

// ============================================================
// EventResponsePage — page publique réponse présence
// Accessible via /?event=TOKEN
// Mobile-first, 1 clic pour répondre
// ============================================================

export function EventResponsePage({ token }) {
  const [data, setData] = useState(null);
  const [event, setEvent] = useState(null);
  const [licencie, setLicencie] = useState(null);
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageState, setPageState] = useState('loading'); // loading|form|success|error
  const [response, setResponse] = useState('');
  const [comment, setComment] = useState('');
  const [canDrive, setCanDrive] = useState(false);
  const [driveSeats, setDriveSeats] = useState(3);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [branding, setBranding] = useState(null);

  useEffect(() => {
    if (!token) { setPageState('error'); return; }
    (async () => {
      // Récupérer la réponse via token
      const { data: respData } = await supabase.rpc('get_event_by_token', { p_token: token });
      if (!respData?.[0]) { setPageState('error'); setLoading(false); return; }
      const resp = respData[0];
      setData(resp);
      setResponse(resp.response !== 'pending' ? resp.response : '');
      setCanDrive(resp.can_drive || false);
      setDriveSeats(resp.drive_seats || 3);

      // Charger l'événement
      const { data: evtData } = await supabase.from('club_events').select('*').eq('id', resp.event_id).single();
      setEvent(evtData);

      // Charger le licencié
      if (resp.licencie_id) {
        const { data: licData } = await supabase.from('licencies').select('first_name, last_name, category').eq('id', resp.licencie_id).single();
        setLicencie(licData);
      }

      // Charger le sondage attaché
      const { data: surveyData } = await supabase.from('surveys').select('*, survey_responses(*)').eq('event_id', resp.event_id).single();
      if (surveyData) setSurvey(surveyData);

      // Charger branding du club
      const { data: profileData } = await supabase.from('profiles').select('club_name, club_color, club_logo_url').eq('id', evtData.owner_id).single();
      if (profileData) setBranding(profileData);

      setPageState('form');
      setLoading(false);
    })();
  }, [token]);

  const accent = branding?.club_color || '#f472b6';

  const toggleOption = (optId) => {
    if (survey?.multiple_choice) {
      setSelectedOptions(prev => prev.includes(optId) ? prev.filter(o=>o!==optId) : [...prev, optId]);
    } else {
      setSelectedOptions([optId]);
    }
  };

  const submit = async () => {
    if (!response) return;
    setSaving(true);

    // Mettre à jour la réponse
    await supabase.from('event_responses')
      .update({ response, can_drive: canDrive, drive_seats: canDrive ? driveSeats : 0, comment: comment.trim() || null })
      .eq('event_id', data.event_id)
      .eq('licencie_id', data.licencie_id);

    // Enregistrer réponse sondage
    if (survey && selectedOptions.length > 0) {
      const existing = survey.survey_responses?.find(r => r.licencie_id === data.licencie_id);
      if (existing) {
        await supabase.from('survey_responses').update({ selected_options: selectedOptions }).eq('id', existing.id);
      } else {
        await supabase.from('survey_responses').insert({
          survey_id: survey.id,
          licencie_id: data.licencie_id,
          selected_options: selectedOptions,
        });
      }
    }

    setSaving(false);
    setPageState('success');
  };

  const EVENT_EMOJIS = { training:'⚽', match:'🏆', tournament:'🥇', stage:'🏕️', meeting:'📋', other:'📌' };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0a0e1a', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', color:'#64748b' }}>
        <div style={{ fontSize:32, marginBottom:12 }}>⚽</div>
        <p>Chargement...</p>
      </div>
    </div>
  );

  if (pageState === 'error') return (
    <div style={{ minHeight:'100vh', background:'#0a0e1a', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ textAlign:'center', color:'#64748b', maxWidth:320 }}>
        <div style={{ fontSize:40, marginBottom:12 }}>❌</div>
        <h2 style={{ color:'#f1f5f9', fontSize:18, fontWeight:800 }}>Lien invalide</h2>
        <p style={{ fontSize:14 }}>Ce lien n'existe pas ou a expiré.</p>
      </div>
    </div>
  );

  if (pageState === 'success') return (
    <div style={{ minHeight:'100vh', background:'#0a0e1a', fontFamily:'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg, ${accent}22 0%, #0a0e1a 60%)`, padding:'20px 24px', borderBottom:`1px solid ${accent}22`, display:'flex', alignItems:'center', gap:12 }}>
        {branding?.club_logo_url && <img src={branding.club_logo_url} style={{ width:40, height:40, borderRadius:10, objectFit:'cover' }} alt="logo" />}
        <div>
          <div style={{ fontWeight:800, color:'#f1f5f9', fontSize:15 }}>{branding?.club_name || 'FootPlanner'}</div>
          <div style={{ fontSize:12, color:'#64748b' }}>Réponse enregistrée</div>
        </div>
      </div>
      <div style={{ maxWidth:420, margin:'0 auto', padding:'40px 24px', textAlign:'center' }}>
        <CheckCircle size={64} style={{ color:'#34d399', marginBottom:20 }} />
        <h2 style={{ color:'#f1f5f9', fontSize:22, fontWeight:900, marginBottom:8 }}>Réponse enregistrée !</h2>
        <p style={{ color:'#94a3b8', fontSize:14, lineHeight:1.7 }}>
          {response === 'yes' && '✅ Tu as confirmé ta présence.'}
          {response === 'no' && '❌ Tu as indiqué ton absence.'}
          {response === 'maybe' && '❓ Tu as indiqué que tu étais incertain.'}
        </p>
        {canDrive && <p style={{ color:'#34d399', fontSize:13, marginTop:8 }}>🚗 Merci d'avoir proposé ton covoiturage !</p>}
        <p style={{ color:'#475569', fontSize:12, marginTop:24 }}>Tu peux fermer cette page.</p>
      </div>
    </div>
  );

  const RESP_OPTIONS = [
    { val:'yes',   label:'✅ Présent',    color:'#34d399', bg:'rgba(52,211,153,0.12)'  },
    { val:'no',    label:'❌ Absent',     color:'#fb7185', bg:'rgba(251,113,133,0.12)' },
    { val:'maybe', label:'❓ Peut-être',  color:'#f59e0b', bg:'rgba(245,158,11,0.12)'  },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#0a0e1a', fontFamily:'system-ui, sans-serif', color:'#f1f5f9' }}>
      {/* Header club */}
      <div style={{ background:`linear-gradient(135deg, ${accent}22 0%, #0a0e1a 60%)`, padding:'20px 24px', borderBottom:`1px solid ${accent}22`, display:'flex', alignItems:'center', gap:12 }}>
        {branding?.club_logo_url && <img src={branding.club_logo_url} style={{ width:40, height:40, borderRadius:10, objectFit:'cover' }} alt="logo" />}
        <div>
          <div style={{ fontWeight:800, color:'#f1f5f9', fontSize:15 }}>{branding?.club_name || 'FootPlanner'}</div>
          <div style={{ fontSize:12, color:'#64748b' }}>Invitation</div>
        </div>
      </div>

      <div style={{ maxWidth:420, margin:'0 auto', padding:'24px 20px' }}>
        {/* Infos événement */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${accent}33`, borderRadius:16, padding:'20px', marginBottom:20 }}>
          <div style={{ fontSize:28, marginBottom:8 }}>{EVENT_EMOJIS[event?.type] || '📌'}</div>
          <h1 style={{ fontSize:20, fontWeight:900, color:'#f1f5f9', margin:'0 0 10px' }}>{event?.title}</h1>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {event?.date && (
              <span style={{ fontSize:14, color:'#94a3b8', display:'flex', alignItems:'center', gap:8 }}>
                <Calendar size={14} style={{ color:accent }} />
                {new Date(event.date).toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}
                {event.time_start && ` à ${event.time_start.slice(0,5)}`}
                {event.time_end && ` → ${event.time_end.slice(0,5)}`}
              </span>
            )}
            {event?.location && (
              <span style={{ fontSize:14, color:'#94a3b8', display:'flex', alignItems:'center', gap:8 }}>
                <MapPin size={14} style={{ color:accent }} />
                {event.location}
              </span>
            )}
          </div>
          {event?.description && <p style={{ fontSize:13, color:'#64748b', marginTop:10, lineHeight:1.6 }}>{event.description}</p>}
        </div>

        {/* Salutation */}
        {licencie && (
          <p style={{ fontSize:16, color:'#f1f5f9', fontWeight:600, marginBottom:20, textAlign:'center' }}>
            Bonjour {licencie.first_name} ! 👋
          </p>
        )}

        {/* Réponse présence */}
        <div style={{ marginBottom:24 }}>
          <p style={{ fontSize:14, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1, marginBottom:12, textAlign:'center' }}>Seras-tu présent(e) ?</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {RESP_OPTIONS.map(opt => (
              <button key={opt.val} onClick={() => setResponse(opt.val)} style={{
                width:'100%', padding:'16px', borderRadius:12, border:'2px solid', cursor:'pointer', fontFamily:'inherit',
                fontSize:16, fontWeight:800, transition:'all 0.15s',
                borderColor: response === opt.val ? opt.color : 'rgba(255,255,255,0.08)',
                background: response === opt.val ? opt.bg : 'rgba(255,255,255,0.02)',
                color: response === opt.val ? opt.color : '#64748b',
                transform: response === opt.val ? 'scale(1.02)' : 'scale(1)',
              }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Covoiturage */}
        {response === 'yes' && (
          <div style={{ background:'rgba(52,211,153,0.06)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:12, padding:'16px', marginBottom:20 }}>
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', marginBottom: canDrive ? 12 : 0 }}>
              <input type="checkbox" checked={canDrive} onChange={e => setCanDrive(e.target.checked)} style={{ accentColor:'#34d399', width:18, height:18 }} />
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#f1f5f9', display:'flex', alignItems:'center', gap:6 }}>
                  <Car size={16} style={{ color:'#34d399' }} /> Je peux conduire
                </div>
                <div style={{ fontSize:12, color:'#64748b' }}>Proposer des places de covoiturage</div>
              </div>
            </label>
            {canDrive && (
              <div>
                <p style={{ fontSize:12, color:'#94a3b8', marginBottom:8 }}>Nombre de places disponibles :</p>
                <div style={{ display:'flex', gap:8 }}>
                  {[1,2,3,4,5,6].map(n => (
                    <button key={n} onClick={() => setDriveSeats(n)} style={{
                      width:40, height:40, borderRadius:8, border:'2px solid', cursor:'pointer', fontFamily:'inherit', fontWeight:800, fontSize:14,
                      borderColor: driveSeats === n ? '#34d399' : 'rgba(255,255,255,0.1)',
                      background: driveSeats === n ? 'rgba(52,211,153,0.15)' : 'transparent',
                      color: driveSeats === n ? '#34d399' : '#64748b',
                    }}>{n}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sondage attaché */}
        {survey && (
          <div style={{ background:'rgba(129,140,248,0.06)', border:'1px solid rgba(129,140,248,0.2)', borderRadius:12, padding:'16px', marginBottom:20 }}>
            <p style={{ fontSize:14, fontWeight:700, color:'#818cf8', marginBottom:12 }}>📊 {survey.title}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {(survey.options || []).map(opt => {
                const isSelected = selectedOptions.includes(opt.id);
                return (
                  <button key={opt.id} onClick={() => toggleOption(opt.id)} style={{
                    width:'100%', padding:'12px 16px', borderRadius:10, border:'2px solid', cursor:'pointer', fontFamily:'inherit',
                    fontSize:14, fontWeight:600, textAlign:'left', transition:'all 0.15s',
                    borderColor: isSelected ? '#818cf8' : 'rgba(255,255,255,0.08)',
                    background: isSelected ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.02)',
                    color: isSelected ? '#818cf8' : '#94a3b8',
                  }}>
                    {isSelected ? '◉' : '○'} {opt.label}
                  </button>
                );
              })}
            </div>
            {survey.multiple_choice && <p style={{ fontSize:11, color:'#475569', marginTop:8 }}>Plusieurs choix possibles</p>}
          </div>
        )}

        {/* Commentaire */}
        <div style={{ marginBottom:24 }}>
          <p style={{ fontSize:13, color:'#64748b', marginBottom:8 }}>Un message pour le coach ? (optionnel)</p>
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Je serai en retard de 10 minutes..." style={{ width:'100%', padding:'12px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', color:'#f1f5f9', fontSize:13, fontFamily:'inherit', boxSizing:'border-box', resize:'vertical', minHeight:70 }} />
        </div>

        {/* Bouton submit */}
        <button onClick={submit} disabled={!response || saving} style={{
          width:'100%', padding:'16px', borderRadius:12, border:'none',
          background: !response ? 'rgba(255,255,255,0.05)' : accent,
          color: !response ? '#475569' : '#fff',
          fontSize:16, fontWeight:800, cursor: !response ? 'not-allowed' : 'pointer',
          fontFamily:'inherit', transition:'all 0.2s',
          opacity: saving ? 0.6 : 1,
        }}>
          {saving ? 'Enregistrement...' : !response ? 'Sélectionne une réponse' : '✓ Envoyer ma réponse'}
        </button>

        <p style={{ color:'#334155', fontSize:11, textAlign:'center', marginTop:16 }}>
          Propulsé par FootPlanner · Gestion de clubs de football
        </p>
      </div>
    </div>
  );
}
