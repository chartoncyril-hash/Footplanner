import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Calendar, Users, CheckSquare, BarChart2, MessageCircle, ChevronRight, X, MapPin, Clock } from 'lucide-react';

const EVENT_TYPES = {
  training:   { label: 'Entraînement', color: '#34d399', emoji: '⚽' },
  match:      { label: 'Match',        color: '#f59e0b', emoji: '🏆' },
  tournament: { label: 'Tournoi',      color: '#f97316', emoji: '🥇' },
  stage:      { label: 'Stage',        color: '#818cf8', emoji: '🏕️' },
  meeting:    { label: 'Réunion',      color: '#22d3ee', emoji: '📋' },
  other:      { label: 'Autre',        color: '#94a3b8', emoji: '📌' },
};

const S = {
  page: { padding: '0 0 60px' },
  title: { fontSize: 22, fontWeight: 900, color: '#f1f5f9', marginBottom: 4 },
  sub: { fontSize: 13, color: '#64748b', marginBottom: 24 },
  tabs: { display:'flex', gap:4, marginBottom:28, borderBottom:'1px solid rgba(255,255,255,0.08)', paddingBottom:0 },
  tab: (active) => ({ padding:'10px 18px', border:'none', background:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:700, color: active ? '#f472b6' : '#64748b', borderBottom: active ? '2px solid #f472b6' : '2px solid transparent', marginBottom:-1, transition:'all 0.15s' }),
  btn: { display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, border:'none', background:'#f472b6', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:700, fontFamily:'inherit' },
  btnGhost: { display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#94a3b8', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit' },
  card: { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'18px 20px', marginBottom:10 },
  inp: { width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#f1f5f9', fontSize:14, fontFamily:'inherit', boxSizing:'border-box' },
  lbl: { fontSize:12, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.8, marginBottom:6, display:'block' },
};

export function CommunicationView() {
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [stats, setStats] = useState({ total:0, upcoming:0, responses:0 });

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('club_events')
      .select('*, event_responses(id, response)')
      .eq('owner_id', user.id)
      .order('date', { ascending: true });
    if (data) {
      setEvents(data);
      const now = new Date();
      setStats({
        total: data.length,
        upcoming: data.filter(e => new Date(e.date) >= now).length,
        responses: data.reduce((acc, e) => acc + (e.event_responses?.filter(r => r.response !== 'pending').length || 0), 0),
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteEvent = async (id) => {
    if (!window.confirm('Supprimer cet événement ?')) return;
    await supabase.from('club_events').delete().eq('id', id);
    load();
  };

  const tabs = [
    { key:'events', label:'📅 Événements' },
    { key:'tasks', label:'✅ Tâches' },
    { key:'surveys', label:'📊 Sondages' },
    { key:'chat', label:'💬 Tchat' },
  ];

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28 }}>
        <div>
          <h2 style={S.title}>💬 Communication</h2>
          <p style={S.sub}>Événements, tâches, sondages et messagerie du club</p>
        </div>
        {activeTab === 'events' && (
          <button style={S.btn} onClick={() => { setWizardOpen(true); }}>
            <Plus size={16} /> Créer un événement
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:28 }}>
        {[
          { val:stats.total, lbl:'Événements', color:'#f472b6' },
          { val:stats.upcoming, lbl:'À venir', color:'#34d399' },
          { val:stats.responses, lbl:'Réponses reçues', color:'#818cf8' },
        ].map(s => (
          <div key={s.lbl} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'16px 20px' }}>
            <div style={{ fontSize:26, fontWeight:900, color:s.color, marginBottom:2 }}>{s.val}</div>
            <div style={{ fontSize:12, color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:1 }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div style={S.tabs}>
        {tabs.map(t => (
          <button key={t.key} style={S.tab(activeTab === t.key)} onClick={() => setActiveTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* ── ÉVÉNEMENTS ── */}
      {activeTab === 'events' && (
        <div>
          {loading ? (
            <div style={{ color:'#64748b', padding:40, textAlign:'center' }}>Chargement...</div>
          ) : events.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 32px', color:'#475569' }}>
              <Calendar size={40} style={{ marginBottom:12, opacity:0.4 }} />
              <p style={{ fontSize:15, marginBottom:4 }}>Aucun événement créé</p>
              <p style={{ fontSize:13 }}>Créez votre premier événement pour commencer</p>
            </div>
          ) : events.map(evt => {
            const type = EVENT_TYPES[evt.type] || EVENT_TYPES.other;
            const responses = evt.event_responses || [];
            const yes = responses.filter(r => r.response === 'yes').length;
            const no = responses.filter(r => r.response === 'no').length;
            const maybe = responses.filter(r => r.response === 'maybe').length;
            const pending = responses.filter(r => r.response === 'pending').length;
            const isPast = new Date(evt.date) < new Date();
            return (
              <div key={evt.id} style={{ ...S.card, borderColor: isPast ? 'rgba(255,255,255,0.05)' : `${type.color}33`, opacity: isPast ? 0.7 : 1 }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                  {/* Emoji type */}
                  <div style={{ fontSize:24, flexShrink:0, marginTop:2 }}>{type.emoji}</div>
                  {/* Infos */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:15, fontWeight:800, color:'#f1f5f9' }}>{evt.title}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:type.color, background:`${type.color}15`, padding:'2px 8px', borderRadius:10 }}>{type.label}</span>
                      {isPast && <span style={{ fontSize:10, color:'#475569', fontWeight:600 }}>PASSÉ</span>}
                    </div>
                    <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:8 }}>
                      <span style={{ fontSize:12, color:'#94a3b8', display:'flex', alignItems:'center', gap:4 }}>
                        <Calendar size={12} /> {new Date(evt.date).toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long' })}
                      </span>
                      {evt.time_start && <span style={{ fontSize:12, color:'#94a3b8', display:'flex', alignItems:'center', gap:4 }}><Clock size={12} /> {evt.time_start.slice(0,5)}{evt.time_end ? ` → ${evt.time_end.slice(0,5)}` : ''}</span>}
                      {evt.location && <span style={{ fontSize:12, color:'#94a3b8', display:'flex', alignItems:'center', gap:4 }}><MapPin size={12} /> {evt.location}</span>}
                    </div>
                    {/* Présences */}
                    {responses.length > 0 && (
                      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                        <span style={{ fontSize:12, color:'#34d399', fontWeight:700 }}>✅ {yes} présents</span>
                        <span style={{ fontSize:12, color:'#fb7185', fontWeight:700 }}>❌ {no} absents</span>
                        <span style={{ fontSize:12, color:'#f59e0b', fontWeight:700 }}>❓ {maybe} peut-être</span>
                        {pending > 0 && <span style={{ fontSize:12, color:'#64748b' }}>⏳ {pending} en attente</span>}
                      </div>
                    )}
                  </div>
                  {/* Actions */}
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button onClick={() => setSelectedEvent(evt)} style={{ ...S.btn, padding:'6px 12px', fontSize:12, background:'#f472b6' }}>
                      Gérer <ChevronRight size={12} />
                    </button>
                    <button onClick={() => deleteEvent(evt.id)} style={{ ...S.btnGhost, color:'#fb7185' }}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TÂCHES ── */}
      {activeTab === 'tasks' && <TasksTab events={events} onRefresh={load} />}

      {/* ── SONDAGES ── */}
      {activeTab === 'surveys' && <SurveysTab onRefresh={load} />}

      {/* ── TCHAT ── */}
      {activeTab === 'chat' && (
        <div style={{ textAlign:'center', padding:'60px 32px', color:'#475569' }}>
          <MessageCircle size={40} style={{ marginBottom:12, opacity:0.4 }} />
          <p style={{ fontSize:15, marginBottom:4 }}>Tchat — Bientôt disponible</p>
          <p style={{ fontSize:13 }}>La messagerie en temps réel arrive prochainement</p>
        </div>
      )}

      {/* Modals */}
      {wizardOpen && <EventWizard onClose={() => setWizardOpen(false)} onSaved={() => { setWizardOpen(false); load(); }} />}
      {selectedEvent && <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onRefresh={() => { load(); setSelectedEvent(null); }} />}
    </div>
  );
}

// ============================================================
// EVENT WIZARD — Création/édition événement
// ============================================================
// ============================================================
// EVENT WIZARD — 3 étapes : Infos / Destinataires / Sondage
// ============================================================
function EventWizard({ event, onClose, onSaved }) {
  const isEdit = !!event;
  const [step, setStep] = React.useState(1);
  const [saving, setSaving] = React.useState(false);
  const [licencies, setLicencies] = React.useState([]);
  const [selectedLics, setSelectedLics] = React.useState([]);
  const [filterCat, setFilterCat] = React.useState('');
  const [filterTeam, setFilterTeam] = React.useState('');
  const [form, setForm] = React.useState({
    title: event?.title || '',
    type: event?.type || 'training',
    date: event?.date || '',
    time_start: event?.time_start?.slice(0,5) || '',
    time_end: event?.time_end?.slice(0,5) || '',
    location: event?.location || '',
    description: event?.description || '',
    categories: event?.categories || [],
    reminder_hours: event?.reminder_hours || [48, 2],
  });
  const [survey, setSurvey] = React.useState({
    enabled: false,
    title: '',
    options: ['Oui', 'Non', 'Peut-être'],
    multiple_choice: false,
    anonymous: false,
  });

  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  const setSurveyField = (k,v) => setSurvey(f => ({...f,[k]:v}));

  const CATS = ['U6','U7','U8','U9','U10','U11','U12','U13','U14','U15','U16','U17','U18','U19','Senior','Féminin'];
  const TEAMS = ['Équipe 1','Équipe 2','Équipe 3','Équipe 4'];
  const toggleCat = (cat) => set('categories', form.categories.includes(cat) ? form.categories.filter(c=>c!==cat) : [...form.categories,cat]);
  const toggleReminder = (h) => set('reminder_hours', form.reminder_hours.includes(h) ? form.reminder_hours.filter(x=>x!==h) : [...form.reminder_hours,h].sort((a,b)=>b-a));

  // Charger licenciés à l'étape 2
  React.useEffect(() => {
    if (step !== 2) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from('licencies').select('id,first_name,last_name,category,team,email').eq('owner_id', user.id).order('last_name');
      setLicencies(data || []);
      // Pré-sélectionner selon catégories choisies étape 1
      if (form.categories.length > 0) {
        const preselected = (data || []).filter(l => form.categories.includes(l.category) && l.email).map(l => l.id);
        setSelectedLics(preselected);
      } else {
        setSelectedLics((data || []).filter(l => l.email).map(l => l.id));
      }
    })();
  }, [step]);

  const filteredLics = licencies.filter(l => {
    const matchCat = !filterCat || l.category === filterCat;
    const matchTeam = !filterTeam || l.team === filterTeam;
    return matchCat && matchTeam;
  });

  const cats = [...new Set(licencies.map(l=>l.category).filter(Boolean))].sort();
  const teams = [...new Set(licencies.map(l=>l.team).filter(Boolean))].sort();

  const selectAll = () => setSelectedLics(filteredLics.filter(l=>l.email).map(l=>l.id));
  const deselectAll = () => setSelectedLics(prev => prev.filter(id => !filteredLics.map(l=>l.id).includes(id)));

  const save = async () => {
    if (!form.title.trim() || !form.date) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Créer/modifier l'événement
    let eventId = event?.id;
    const payload = {
      owner_id: user.id,
      title: form.title.trim(),
      type: form.type,
      date: form.date,
      time_start: form.time_start || null,
      time_end: form.time_end || null,
      location: form.location.trim() || null,
      description: form.description.trim() || null,
      categories: form.categories,
      reminder_hours: form.reminder_hours,
    };

    if (isEdit) {
      await supabase.from('club_events').update(payload).eq('id', eventId);
    } else {
      const { data: newEvt } = await supabase.from('club_events').insert(payload).select('id').single();
      eventId = newEvt.id;
    }

    // 2. Créer les réponses pour les licenciés sélectionnés
    if (selectedLics.length > 0 && !isEdit) {
      const existingResp = [];
      const toInsert = selectedLics
        .filter(licId => !existingResp.includes(licId))
        .map(licId => ({
          event_id: eventId,
          club_owner_id: user.id,
          licencie_id: licId,
          response: 'pending',
        }));
      if (toInsert.length > 0) await supabase.from('event_responses').insert(toInsert);
    }

    // 3. Créer le sondage si activé
    if (survey.enabled && survey.title.trim() && !isEdit) {
      await supabase.from('surveys').insert({
        owner_id: user.id,
        event_id: eventId,
        title: survey.title.trim(),
        options: survey.options.filter(o=>o.trim()).map((o,i) => ({ id:i, label:o.trim() })),
        multiple_choice: survey.multiple_choice,
        anonymous: survey.anonymous,
      });
    }

    setSaving(false);
    onSaved();
  };

  const canNext1 = form.title.trim() && form.date;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'#0f172a', border:'1px solid rgba(244,114,182,0.2)', borderRadius:16, width:'100%', maxWidth:580, maxHeight:'92vh', overflow:'auto', padding:32 }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <h3 style={{ color:'#f1f5f9', fontSize:18, fontWeight:800, margin:0 }}>{isEdit ? 'Modifier' : 'Créer un événement'}</h3>
            <p style={{ color:'#64748b', fontSize:13, margin:'4px 0 0' }}>Étape {step}/3</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:20 }}>✕</button>
        </div>

        {/* Progress */}
        <div style={{ display:'flex', gap:6, marginBottom:28 }}>
          {[1,2,3].map(n => (
            <div key={n} style={{ flex:1, height:4, borderRadius:4, background: step >= n ? '#f472b6' : 'rgba(255,255,255,0.08)', transition:'background 0.2s' }} />
          ))}
        </div>

        {/* ── ÉTAPE 1 : INFOS ── */}
        {step === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Type */}
            <div>
              <label style={S.lbl}>Type d'événement</label>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {Object.entries(EVENT_TYPES).map(([key, val]) => (
                  <button key={key} onClick={() => set('type', key)} style={{
                    padding:'6px 12px', borderRadius:8, border:'1px solid', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700,
                    borderColor: form.type === key ? val.color : 'rgba(255,255,255,0.1)',
                    background: form.type === key ? val.color+'20' : 'transparent',
                    color: form.type === key ? val.color : '#64748b',
                  }}>{val.emoji} {val.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={S.lbl}>Titre *</label>
              <input style={S.inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Entraînement U12 — Jeudi soir" />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
              <div><label style={S.lbl}>Date *</label><input type="date" style={S.inp} value={form.date} onChange={e => set('date', e.target.value)} /></div>
              <div><label style={S.lbl}>Début</label><input type="time" style={S.inp} value={form.time_start} onChange={e => set('time_start', e.target.value)} /></div>
              <div><label style={S.lbl}>Fin</label><input type="time" style={S.inp} value={form.time_end} onChange={e => set('time_end', e.target.value)} /></div>
            </div>
            <div><label style={S.lbl}>Lieu</label><input style={S.inp} value={form.location} onChange={e => set('location', e.target.value)} placeholder="Terrain municipal..." /></div>
            <div><label style={S.lbl}>Description</label><textarea style={{ ...S.inp, minHeight:70, resize:'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Infos complémentaires..." /></div>
            <div>
              <label style={S.lbl}>Catégories concernées <span style={{ color:'#475569', fontWeight:400, textTransform:'none' }}>(filtre les destinataires étape suivante)</span></label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {CATS.map(cat => (
                  <button key={cat} onClick={() => toggleCat(cat)} style={{
                    padding:'4px 10px', borderRadius:16, border:'1px solid', cursor:'pointer', fontFamily:'inherit', fontSize:11, fontWeight:600,
                    borderColor: form.categories.includes(cat) ? '#f472b6' : 'rgba(255,255,255,0.1)',
                    background: form.categories.includes(cat) ? 'rgba(244,114,182,0.15)' : 'transparent',
                    color: form.categories.includes(cat) ? '#f472b6' : '#64748b',
                  }}>{cat}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={S.lbl}>Rappels automatiques</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {[72,48,24,2].map(h => (
                  <label key={h} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, border:'1px solid', cursor:'pointer',
                    borderColor: form.reminder_hours.includes(h) ? '#f472b6' : 'rgba(255,255,255,0.1)',
                    background: form.reminder_hours.includes(h) ? 'rgba(244,114,182,0.1)' : 'transparent',
                  }}>
                    <input type="checkbox" checked={form.reminder_hours.includes(h)} onChange={() => toggleReminder(h)} style={{ accentColor:'#f472b6' }} />
                    <span style={{ fontSize:12, fontWeight:600, color: form.reminder_hours.includes(h) ? '#f472b6' : '#64748b' }}>{h >= 24 ? `J-${h/24}` : `H-${h}`}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 2 : DESTINATAIRES ── */}
        {step === 2 && (
          <div>
            <p style={{ color:'#64748b', fontSize:13, marginBottom:16 }}>Sélectionnez les licenciés à inviter. Seuls ceux avec un email recevront l'invitation.</p>
            {/* Filtres */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14, alignItems:'center' }}>
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ padding:'7px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'#1e293b', color:'#f1f5f9', fontSize:12, fontFamily:'inherit' }}>
                <option value="">Toutes catégories</option>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)} style={{ padding:'7px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'#1e293b', color:'#f1f5f9', fontSize:12, fontFamily:'inherit' }}>
                <option value="">Toutes équipes</option>
                {teams.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={selectAll} style={{ ...S.btnGhost, fontSize:11 }}>Tout sélectionner</button>
              <button onClick={deselectAll} style={{ ...S.btnGhost, fontSize:11 }}>Tout désélectionner</button>
              <span style={{ fontSize:12, color:'#64748b', marginLeft:'auto' }}>{selectedLics.length} sélectionné(s)</span>
            </div>
            {/* Liste */}
            <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:320, overflowY:'auto', marginBottom:12 }}>
              {filteredLics.map(lic => {
                const isSelected = selectedLics.includes(lic.id);
                const hasEmail = !!lic.email;
                return (
                  <label key={lic.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, border:'1px solid', cursor: hasEmail ? 'pointer' : 'not-allowed', opacity: hasEmail ? 1 : 0.4,
                    borderColor: isSelected ? 'rgba(244,114,182,0.35)' : 'rgba(255,255,255,0.06)',
                    background: isSelected ? 'rgba(244,114,182,0.06)' : 'rgba(255,255,255,0.02)',
                  }}>
                    <input type="checkbox" checked={isSelected} disabled={!hasEmail} onChange={() => setSelectedLics(prev => isSelected ? prev.filter(id=>id!==lic.id) : [...prev,lic.id])} style={{ accentColor:'#f472b6', width:15, height:15 }} />
                    <div style={{ flex:1 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#f1f5f9' }}>{lic.first_name} {lic.last_name}</span>
                      {lic.category && <span style={{ fontSize:11, color:'#818cf8', marginLeft:8 }}>{lic.category}</span>}
                      {lic.team && <span style={{ fontSize:11, color:'#64748b', marginLeft:6 }}>{lic.team}</span>}
                    </div>
                    <span style={{ fontSize:11, color: hasEmail ? '#475569' : '#fb7185' }}>{hasEmail ? lic.email : 'Pas d\'email'}</span>
                  </label>
                );
              })}
            </div>
            <div style={{ padding:'10px 14px', borderRadius:8, background:'rgba(244,114,182,0.06)', border:'1px solid rgba(244,114,182,0.15)', fontSize:12, color:'#94a3b8' }}>
              📧 {selectedLics.filter(id => licencies.find(l=>l.id===id)?.email).length} email(s) seront envoyés à la création
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 : SONDAGE ── */}
        {step === 3 && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <label style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', borderRadius:10, border:'1px solid', cursor:'pointer',
              borderColor: survey.enabled ? '#f472b6' : 'rgba(255,255,255,0.1)',
              background: survey.enabled ? 'rgba(244,114,182,0.08)' : 'rgba(255,255,255,0.02)',
            }}>
              <input type="checkbox" checked={survey.enabled} onChange={e => setSurveyField('enabled', e.target.checked)} style={{ accentColor:'#f472b6', width:18, height:18 }} />
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#f1f5f9' }}>📊 Attacher un sondage à cet événement</div>
                <div style={{ fontSize:12, color:'#64748b' }}>Les licenciés pourront répondre depuis leur lien personnel</div>
              </div>
            </label>

            {survey.enabled && (
              <div style={{ display:'flex', flexDirection:'column', gap:12, padding:'16px', borderRadius:10, border:'1px solid rgba(244,114,182,0.15)', background:'rgba(244,114,182,0.04)' }}>
                <div>
                  <label style={S.lbl}>Question *</label>
                  <input style={S.inp} value={survey.title} onChange={e => setSurveyField('title', e.target.value)} placeholder="Ex: Disponible pour ce match ?" />
                </div>
                <div>
                  <label style={S.lbl}>Options</label>
                  {survey.options.map((opt,i) => (
                    <div key={i} style={{ display:'flex', gap:6, marginBottom:6 }}>
                      <input style={S.inp} value={opt} onChange={e => setSurvey(f => ({...f, options: f.options.map((o,idx) => idx===i ? e.target.value : o)}))} placeholder={`Option ${i+1}`} />
                      {survey.options.length > 2 && (
                        <button onClick={() => setSurvey(f => ({...f, options: f.options.filter((_,idx)=>idx!==i)}))} style={{ ...S.btnGhost, padding:'5px 8px', color:'#fb7185' }}><X size={12} /></button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setSurvey(f => ({...f, options:[...f.options,'']}))} style={{ ...S.btnGhost, fontSize:12 }}><Plus size={12} /> Ajouter une option</button>
                </div>
                <div style={{ display:'flex', gap:16 }}>
                  <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#94a3b8', cursor:'pointer' }}>
                    <input type="checkbox" checked={survey.multiple_choice} onChange={e => setSurveyField('multiple_choice', e.target.checked)} style={{ accentColor:'#f472b6' }} />
                    Choix multiple
                  </label>
                  <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#94a3b8', cursor:'pointer' }}>
                    <input type="checkbox" checked={survey.anonymous} onChange={e => setSurveyField('anonymous', e.target.checked)} style={{ accentColor:'#f472b6' }} />
                    Anonyme
                  </label>
                </div>
              </div>
            )}

            {/* Récap avant envoi */}
            <div style={{ padding:'16px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ color:'#94a3b8', fontSize:13, fontWeight:700, margin:'0 0 8px' }}>📋 Récapitulatif</p>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <span style={{ fontSize:13, color:'#f1f5f9' }}>{EVENT_TYPES[form.type]?.emoji} {form.title}</span>
                <span style={{ fontSize:12, color:'#64748b' }}>📅 {form.date && new Date(form.date).toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long' })}{form.time_start ? ` à ${form.time_start}` : ''}</span>
                {form.location && <span style={{ fontSize:12, color:'#64748b' }}>📍 {form.location}</span>}
                <span style={{ fontSize:12, color:'#f472b6', fontWeight:700 }}>📧 {selectedLics.length} destinataire(s)</span>
                {survey.enabled && survey.title && <span style={{ fontSize:12, color:'#818cf8' }}>📊 Sondage : {survey.title}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:28 }}>
          <button style={S.btnGhost} onClick={() => step === 1 ? onClose() : setStep(s=>s-1)}>
            {step === 1 ? 'Annuler' : '← Retour'}
          </button>
          {step < 3 ? (
            <button style={{ ...S.btn, opacity: (step===1 && !canNext1) ? 0.5 : 1 }} disabled={step===1 && !canNext1} onClick={() => setStep(s=>s+1)}>
              Suivant →
            </button>
          ) : (
            <button style={{ ...S.btn, opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={save}>
              {saving ? 'Création...' : isEdit ? '✓ Mettre à jour' : `✓ Créer & envoyer (${selectedLics.length})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


function EventDetailModal({ event, onClose, onRefresh }) {
  const [responses, setResponses] = useState([]);
  const [licencies, setLicencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('presences');
  const [editOpen, setEditOpen] = useState(false);
  const type = EVENT_TYPES[event.type] || EVENT_TYPES.other;

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    // Charger licenciés
    const { data: lics } = await supabase.from('licencies').select('id, first_name, last_name, category, team').eq('owner_id', user.id).order('last_name');
    setLicencies(lics || []);
    // Charger réponses existantes
    const { data: resp } = await supabase.from('event_responses').select('*').eq('event_id', event.id);
    setResponses(resp || []);
    setLoading(false);
  }, [event.id]);

  useEffect(() => { load(); }, [load]);

  // Initialiser les réponses manquantes (pending) pour tous les licenciés
  const initResponses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const existingIds = responses.map(r => r.licencie_id);
    const missing = licencies.filter(l => !existingIds.includes(l.id));
    if (missing.length === 0) return;
    await supabase.from('event_responses').insert(
      missing.map(l => ({ event_id: event.id, club_owner_id: user.id, licencie_id: l.id, response: 'pending' }))
    );
    load();
  };

  const updateResponse = async (licId, response) => {
    const { data: { user } } = await supabase.auth.getUser();
    const existing = responses.find(r => r.licencie_id === licId);
    if (existing) {
      await supabase.from('event_responses').update({ response }).eq('id', existing.id);
    } else {
      await supabase.from('event_responses').insert({ event_id: event.id, club_owner_id: user.id, licencie_id: licId, response });
    }
    load();
  };

  const getResponse = (licId) => responses.find(r => r.licencie_id === licId)?.response || 'pending';

  const RESP_BTNS = [
    { val:'yes',   label:'✅', color:'#34d399' },
    { val:'no',    label:'❌', color:'#fb7185' },
    { val:'maybe', label:'❓', color:'#f59e0b' },
  ];

  const cats = [...new Set(licencies.map(l => l.category).filter(Boolean))].sort();
  const [filterCat, setFilterCat] = useState('');
  const filteredLics = filterCat ? licencies.filter(l => l.category === filterCat) : licencies;

  const countByResp = (r) => responses.filter(x => x.response === r).length;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:24, overflowY:'auto' }}>
      <div style={{ background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, width:'100%', maxWidth:700, padding:32, marginTop:20 }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <span style={{ fontSize:24 }}>{type.emoji}</span>
              <h3 style={{ color:'#f1f5f9', fontSize:18, fontWeight:800, margin:0 }}>{event.title}</h3>
              <span style={{ fontSize:11, fontWeight:700, color:type.color, background:`${type.color}15`, padding:'2px 8px', borderRadius:10 }}>{type.label}</span>
            </div>
            <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
              <span style={{ fontSize:13, color:'#94a3b8' }}>📅 {new Date(event.date).toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}</span>
              {event.time_start && <span style={{ fontSize:13, color:'#94a3b8' }}>🕐 {event.time_start.slice(0,5)}{event.time_end ? ` → ${event.time_end.slice(0,5)}` : ''}</span>}
              {event.location && <span style={{ fontSize:13, color:'#94a3b8' }}>📍 {event.location}</span>}
            </div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => setEditOpen(true)} style={S.btnGhost}>✏️ Modifier</button>
            <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:20 }}>✕</button>
          </div>
        </div>

        {/* Stats présences */}
        <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
          {[
            { val:countByResp('yes'),   label:'Présents',   color:'#34d399' },
            { val:countByResp('no'),    label:'Absents',    color:'#fb7185' },
            { val:countByResp('maybe'), label:'Peut-être',  color:'#f59e0b' },
            { val:countByResp('pending'), label:'En attente', color:'#64748b' },
          ].map(s => (
            <div key={s.label} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'10px 16px', textAlign:'center', minWidth:80 }}>
              <div style={{ fontSize:20, fontWeight:900, color:s.color }}>{s.val}</div>
              <div style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
          <button onClick={initResponses} style={{ ...S.btnGhost, fontSize:12, alignSelf:'center' }}>
            ⚡ Initialiser toutes les présences
          </button>
        </div>

        {/* Onglets */}
        <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          {[{ key:'presences', label:'👥 Présences' }, { key:'tasks', label:'✅ Tâches' }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={S.tab(activeTab === t.key)}>{t.label}</button>
          ))}
        </div>

        {/* ── PRÉSENCES ── */}
        {activeTab === 'presences' && (
          <div>
            {/* Filtre catégorie */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
              <button onClick={() => setFilterCat('')} style={{ padding:'4px 10px', borderRadius:16, border:'1px solid', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', borderColor: !filterCat ? '#f472b6' : 'rgba(255,255,255,0.1)', background: !filterCat ? 'rgba(244,114,182,0.15)' : 'transparent', color: !filterCat ? '#f472b6' : '#64748b' }}>Tous</button>
              {cats.map(cat => (
                <button key={cat} onClick={() => setFilterCat(cat)} style={{ padding:'4px 10px', borderRadius:16, border:'1px solid', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', borderColor: filterCat === cat ? '#f472b6' : 'rgba(255,255,255,0.1)', background: filterCat === cat ? 'rgba(244,114,182,0.15)' : 'transparent', color: filterCat === cat ? '#f472b6' : '#64748b' }}>{cat}</button>
              ))}
            </div>
            {loading ? (
              <div style={{ color:'#64748b', textAlign:'center', padding:20 }}>Chargement...</div>
            ) : filteredLics.length === 0 ? (
              <div style={{ color:'#475569', textAlign:'center', padding:20, fontSize:13 }}>Aucun licencié trouvé.</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {filteredLics.map(lic => {
                  const resp = getResponse(lic.id);
                  return (
                    <div key={lic.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 14px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ flex:1 }}>
                        <span style={{ fontSize:13, fontWeight:700, color:'#f1f5f9' }}>{lic.first_name} {lic.last_name}</span>
                        {lic.category && <span style={{ fontSize:11, color:'#818cf8', marginLeft:8 }}>{lic.category}</span>}
                        {lic.team && <span style={{ fontSize:11, color:'#64748b', marginLeft:6 }}>{lic.team}</span>}
                      </div>
                      <div style={{ display:'flex', gap:4 }}>
                        {RESP_BTNS.map(btn => (
                          <button key={btn.val} onClick={() => updateResponse(lic.id, btn.val)} style={{
                            width:32, height:32, borderRadius:8, border:'2px solid', cursor:'pointer', fontSize:14,
                            borderColor: resp === btn.val ? btn.color : 'rgba(255,255,255,0.08)',
                            background: resp === btn.val ? `${btn.color}20` : 'transparent',
                          }}>{btn.label}</button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TÂCHES EVENT ── */}
        {activeTab === 'tasks' && <EventTasksPanel event={event} licencies={licencies} />}
      </div>

      {editOpen && <EventWizard event={event} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); onRefresh(); }} />}
    </div>
  );
}

// ============================================================
// TASKS TAB — Vue globale des tâches
// ============================================================
function TasksTab({ events, onRefresh }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', description:'', max_volunteers:1, event_id:'' });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f => ({...f, [k]:v}));

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('tasks')
      .select('*, task_assignments(*), club_events(title, date)')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    setTasks(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveTask = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('tasks').insert({
      owner_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      max_volunteers: parseInt(form.max_volunteers) || 1,
      event_id: form.event_id || null,
    });
    setSaving(false);
    setShowForm(false);
    setForm({ title:'', description:'', max_volunteers:1, event_id:'' });
    load();
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Supprimer cette tâche ?')) return;
    await supabase.from('tasks').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <span style={{ color:'#64748b', fontSize:13 }}>{tasks.length} tâche(s) créée(s)</span>
        <button onClick={() => setShowForm(!showForm)} style={S.btn}>
          <Plus size={14} /> Ajouter une tâche
        </button>
      </div>

      {/* Formulaire inline */}
      {showForm && (
        <div style={{ ...S.card, borderColor:'rgba(244,114,182,0.2)', marginBottom:20 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <label style={S.lbl}>Tâche *</label>
              <input style={S.inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Apporter les oranges, Laver les maillots..." />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label style={S.lbl}>Nombre de bénévoles</label>
                <input type="number" style={S.inp} min={1} max={20} value={form.max_volunteers} onChange={e => set('max_volunteers', e.target.value)} />
              </div>
              <div>
                <label style={S.lbl}>Lier à un événement</label>
                <select style={{ ...S.inp, background:'#1e293b' }} value={form.event_id} onChange={e => set('event_id', e.target.value)}>
                  <option value="">— Aucun —</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title} ({new Date(ev.date).toLocaleDateString('fr-FR')})</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={S.lbl}>Description</label>
              <input style={S.inp} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Détails..." />
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={S.btnGhost}>Annuler</button>
              <button onClick={saveTask} disabled={saving || !form.title.trim()} style={{ ...S.btn, opacity: !form.title.trim() ? 0.5 : 1 }}>
                {saving ? 'Enregistrement...' : '✓ Créer la tâche'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ color:'#64748b', textAlign:'center', padding:40 }}>Chargement...</div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 32px', color:'#475569' }}>
          <CheckSquare size={40} style={{ marginBottom:12, opacity:0.4 }} />
          <p style={{ fontSize:15 }}>Aucune tâche créée</p>
          <p style={{ fontSize:13 }}>Qui apporte les oranges ? Qui lave les maillots ?</p>
        </div>
      ) : tasks.map(task => {
        const assigned = task.task_assignments || [];
        const pct = Math.min(100, Math.round((assigned.length / task.max_volunteers) * 100));
        const isFull = assigned.length >= task.max_volunteers;
        return (
          <div key={task.id} style={{ ...S.card, borderColor: isFull ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.08)' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:14, fontWeight:800, color:'#f1f5f9' }}>{task.title}</span>
                  {isFull && <span style={{ fontSize:10, fontWeight:700, color:'#34d399', background:'rgba(52,211,153,0.15)', padding:'2px 8px', borderRadius:10 }}>✓ Complet</span>}
                </div>
                {task.club_events && <span style={{ fontSize:12, color:'#64748b' }}>📅 {task.club_events.title}</span>}
                {task.description && <p style={{ fontSize:12, color:'#94a3b8', margin:'4px 0 0' }}>{task.description}</p>}
                <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ flex:1, height:4, borderRadius:4, background:'rgba(255,255,255,0.08)', overflow:'hidden', maxWidth:200 }}>
                    <div style={{ height:'100%', width:`${pct}%`, background: isFull ? '#34d399' : '#f472b6', borderRadius:4, transition:'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize:12, color:'#64748b' }}>{assigned.length}/{task.max_volunteers} bénévole(s)</span>
                </div>
                {assigned.length > 0 && (
                  <div style={{ marginTop:6, display:'flex', gap:6, flexWrap:'wrap' }}>
                    {assigned.map(a => (
                      <span key={a.id} style={{ fontSize:11, color:'#34d399', background:'rgba(52,211,153,0.1)', padding:'2px 8px', borderRadius:10 }}>
                        {a.volunteer_name || 'Bénévole'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => deleteTask(task.id)} style={{ ...S.btnGhost, color:'#fb7185', padding:'5px 8px' }}><X size={14} /></button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// EVENT TASKS PANEL — Tâches dans le détail d'un événement
// ============================================================
function EventTasksPanel({ event, licencies }) {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ title:'', max_volunteers:1 });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('tasks').select('*, task_assignments(*)').eq('event_id', event.id);
    setTasks(data || []);
  }, [event.id]);

  useEffect(() => { load(); }, [load]);

  const createTask = async () => {
    if (!newTask.title.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('tasks').insert({ owner_id: user.id, event_id: event.id, title: newTask.title.trim(), max_volunteers: parseInt(newTask.max_volunteers) || 1 });
    setNewTask({ title:'', max_volunteers:1 });
    setShowForm(false);
    setSaving(false);
    load();
  };

  const assignVolunteer = async (taskId, name) => {
    await supabase.from('task_assignments').insert({ task_id: taskId, volunteer_name: name });
    load();
  };

  const removeAssignment = async (id) => {
    await supabase.from('task_assignments').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
        <span style={{ color:'#64748b', fontSize:13 }}>Tâches pour cet événement</span>
        <button onClick={() => setShowForm(true)} style={{ ...S.btnGhost, fontSize:12 }}><Plus size={12} /> Ajouter</button>
      </div>
      {showForm && (
        <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center' }}>
          <input style={{ ...S.inp, flex:2 }} placeholder="Titre de la tâche" value={newTask.title} onChange={e => setNewTask(f => ({...f, title:e.target.value}))} />
          <input type="number" style={{ ...S.inp, width:70 }} min={1} max={20} value={newTask.max_volunteers} onChange={e => setNewTask(f => ({...f, max_volunteers:e.target.value}))} title="Nb bénévoles" />
          <button onClick={createTask} disabled={saving} style={S.btn}>✓</button>
          <button onClick={() => setShowForm(false)} style={S.btnGhost}>✕</button>
        </div>
      )}
      {tasks.length === 0 ? (
        <div style={{ color:'#475569', fontSize:13, textAlign:'center', padding:'20px 0' }}>Aucune tâche pour cet événement</div>
      ) : tasks.map(task => {
        const assigned = task.task_assignments || [];
        const isFull = assigned.length >= task.max_volunteers;
        return (
          <div key={task.id} style={{ ...S.card, padding:'12px 16px', marginBottom:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#f1f5f9', flex:1 }}>{task.title}</span>
              <span style={{ fontSize:11, color: isFull ? '#34d399' : '#64748b' }}>{assigned.length}/{task.max_volunteers}</span>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom: isFull ? 0 : 8 }}>
              {assigned.map(a => (
                <span key={a.id} onClick={() => removeAssignment(a.id)} style={{ fontSize:11, color:'#34d399', background:'rgba(52,211,153,0.1)', padding:'2px 10px', borderRadius:10, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                  {a.volunteer_name} <X size={10} />
                </span>
              ))}
            </div>
            {!isFull && (
              <select style={{ ...S.inp, background:'#1e293b', fontSize:12 }}
                onChange={e => { if (e.target.value) { assignVolunteer(task.id, e.target.value); e.target.value = ''; } }}>
                <option value="">+ Assigner un bénévole...</option>
                {licencies.map(l => <option key={l.id} value={`${l.first_name} ${l.last_name}`}>{l.first_name} {l.last_name}</option>)}
                <option value="Bénévole externe">Bénévole externe</option>
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// SURVEYS TAB — Sondages
// ============================================================
function SurveysTab({ onRefresh }) {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', description:'', options:['',''], multiple_choice:false, anonymous:false, closes_at:'' });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('surveys').select('*, survey_responses(id, selected_options)').eq('owner_id', user.id).order('created_at', { ascending:false });
    setSurveys(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addOption = () => setForm(f => ({...f, options:[...f.options,'']}));
  const updateOption = (i, v) => setForm(f => ({...f, options: f.options.map((o,idx) => idx===i ? v : o)}));
  const removeOption = (i) => setForm(f => ({...f, options: f.options.filter((_,idx) => idx!==i)}));

  const saveSurvey = async () => {
    if (!form.title.trim() || form.options.filter(o=>o.trim()).length < 2) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('surveys').insert({
      owner_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      options: form.options.filter(o=>o.trim()).map((o,i) => ({ id:i, label:o.trim() })),
      multiple_choice: form.multiple_choice,
      anonymous: form.anonymous,
      closes_at: form.closes_at || null,
    });
    setSaving(false);
    setShowForm(false);
    setForm({ title:'', description:'', options:['',''], multiple_choice:false, anonymous:false, closes_at:'' });
    load();
  };

  const deleteSurvey = async (id) => {
    if (!window.confirm('Supprimer ce sondage ?')) return;
    await supabase.from('surveys').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
        <span style={{ color:'#64748b', fontSize:13 }}>{surveys.length} sondage(s)</span>
        <button onClick={() => setShowForm(!showForm)} style={S.btn}><Plus size={14} /> Créer un sondage</button>
      </div>

      {showForm && (
        <div style={{ ...S.card, borderColor:'rgba(244,114,182,0.2)', marginBottom:20 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div><label style={S.lbl}>Question *</label><input style={S.inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Disponible pour le match de samedi ?" /></div>
            <div><label style={S.lbl}>Description</label><input style={S.inp} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Précisions..." /></div>
            <div>
              <label style={S.lbl}>Options *</label>
              {form.options.map((opt, i) => (
                <div key={i} style={{ display:'flex', gap:6, marginBottom:6 }}>
                  <input style={S.inp} value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Option ${i+1}`} />
                  {form.options.length > 2 && <button onClick={() => removeOption(i)} style={{ ...S.btnGhost, color:'#fb7185', padding:'5px 8px' }}><X size={12} /></button>}
                </div>
              ))}
              <button onClick={addOption} style={{ ...S.btnGhost, fontSize:12, marginTop:4 }}><Plus size={12} /> Ajouter une option</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, alignItems:'center' }}>
              <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#94a3b8', cursor:'pointer' }}>
                <input type="checkbox" checked={form.multiple_choice} onChange={e => set('multiple_choice', e.target.checked)} style={{ accentColor:'#f472b6' }} />
                Choix multiple
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#94a3b8', cursor:'pointer' }}>
                <input type="checkbox" checked={form.anonymous} onChange={e => set('anonymous', e.target.checked)} style={{ accentColor:'#f472b6' }} />
                Anonyme
              </label>
              <div>
                <label style={S.lbl}>Clôture</label>
                <input type="datetime-local" style={S.inp} value={form.closes_at} onChange={e => set('closes_at', e.target.value)} />
              </div>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={S.btnGhost}>Annuler</button>
              <button onClick={saveSurvey} disabled={saving} style={S.btn}>{saving ? 'Enregistrement...' : '✓ Créer le sondage'}</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ color:'#64748b', textAlign:'center', padding:40 }}>Chargement...</div>
      ) : surveys.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 32px', color:'#475569' }}>
          <BarChart2 size={40} style={{ marginBottom:12, opacity:0.4 }} />
          <p style={{ fontSize:15 }}>Aucun sondage créé</p>
          <p style={{ fontSize:13 }}>Créez un sondage pour consulter vos licenciés</p>
        </div>
      ) : surveys.map(survey => {
        const responses = survey.survey_responses || [];
        const isClosed = survey.closes_at && new Date(survey.closes_at) < new Date();
        // Calculer les résultats
        const options = survey.options || [];
        const counts = {};
        responses.forEach(r => {
          (r.selected_options || []).forEach(optId => {
            counts[optId] = (counts[optId] || 0) + 1;
          });
        });
        const maxCount = Math.max(...Object.values(counts), 1);
        return (
          <div key={survey.id} style={{ ...S.card, marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:15, fontWeight:800, color:'#f1f5f9' }}>{survey.title}</span>
                  {isClosed && <span style={{ fontSize:10, color:'#fb7185', fontWeight:700, background:'rgba(251,113,133,0.1)', padding:'2px 8px', borderRadius:10 }}>CLÔTURÉ</span>}
                  {survey.multiple_choice && <span style={{ fontSize:10, color:'#818cf8', fontWeight:700, background:'rgba(129,140,248,0.1)', padding:'2px 8px', borderRadius:10 }}>Multi</span>}
                  {survey.anonymous && <span style={{ fontSize:10, color:'#64748b', fontWeight:700, background:'rgba(100,116,139,0.1)', padding:'2px 8px', borderRadius:10 }}>Anonyme</span>}
                </div>
                <div style={{ fontSize:12, color:'#64748b', marginBottom:10 }}>{responses.length} réponse(s)</div>
                {/* Résultats */}
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {options.map(opt => {
                    const count = counts[opt.id] || 0;
                    const pct = Math.round((count / Math.max(responses.length, 1)) * 100);
                    return (
                      <div key={opt.id}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                          <span style={{ fontSize:12, color:'#94a3b8' }}>{opt.label}</span>
                          <span style={{ fontSize:12, color:'#f472b6', fontWeight:700 }}>{count} ({pct}%)</span>
                        </div>
                        <div style={{ height:6, borderRadius:4, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:'#f472b6', borderRadius:4, transition:'width 0.3s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <button onClick={() => deleteSurvey(survey.id)} style={{ ...S.btnGhost, color:'#fb7185', padding:'5px 8px' }}><X size={14} /></button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
