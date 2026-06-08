import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronLeft, ChevronRight, Printer, Calendar, List, LayoutGrid } from 'lucide-react';

// ============================================================
// PlanningView — Agenda club premium
// Vue semaine / mois / liste · Print · Mobile-first
// ============================================================

const TYPES = {
  training:   { label:'Entraînement', color:'#34d399', dark:'#064e3b', emoji:'⚽' },
  match:      { label:'Match',        color:'#f59e0b', dark:'#78350f', emoji:'🏆' },
  tournament: { label:'Tournoi',      color:'#f97316', dark:'#7c2d12', emoji:'🥇' },
  stage:      { label:'Stage',        color:'#a78bfa', dark:'#4c1d95', emoji:'🏕️' },
  meeting:    { label:'Réunion',      color:'#22d3ee', dark:'#164e63', emoji:'📋' },
  other:      { label:'Autre',        color:'#94a3b8', dark:'#1e293b', emoji:'📌' },
  cancelled:  { label:'Annulé',       color:'#475569', dark:'#0f172a', emoji:'❌' },
};

const DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function getWeekStart(d) {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  date.setHours(0,0,0,0);
  return date;
}

function addDays(d, n) {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function sameDay(a, b) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

function inRange(day, start, end) {
  const d = new Date(day); d.setHours(12);
  const s = new Date(start); s.setHours(0);
  const e = end ? new Date(end) : new Date(start); e.setHours(23);
  return d >= s && d <= e;
}

export function PlanningView({ myTournaments }) {
  const [view, setView] = useState('week');
  const [current, setCurrent] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterType, setFilterType] = useState('');
  const printRef = useRef();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: clubEvts }, { data: stagesData }] = await Promise.all([
      supabase.from('club_events').select('*').eq('owner_id', user.id),
      supabase.from('stages').select('*').eq('owner_id', user.id),
    ]);
    const all = [];
    for (const e of clubEvts || []) all.push({
      id:e.id, source:'event',
      type: e.status==='cancelled' ? 'cancelled' : (e.type||'other'),
      title:e.title, date:e.date, date_end:e.date,
      time_start:e.time_start, time_end:e.time_end,
      location:e.location, description:e.description,
      status:e.status, raw:e,
    });
    for (const s of stagesData || []) {
      if (!s.date_start) continue;
      all.push({ id:s.id, source:'stage', type:'stage', title:s.name, date:s.date_start, date_end:s.date_end||s.date_start, location:s.location, description:s.description, raw:s });
    }
    for (const t of myTournaments || []) {
      if (!t.date) continue;
      all.push({ id:t.id, source:'tournament', type:'tournament', title:t.name, date:t.date, date_end:t.endDate||t.date, raw:t });
    }
    all.sort((a,b) => new Date(a.date)-new Date(b.date));
    setEvents(all);
    setLoading(false);
  }, [myTournaments]);

  useEffect(() => { load(); }, [load]);

  const filtered = filterType ? events.filter(e=>e.type===filterType) : events;
  const forDay = (day) => filtered.filter(e => inRange(day, e.date, e.date_end));
  const today = new Date(); today.setHours(0,0,0,0);

  const nav = (dir) => {
    setCurrent(prev => {
      const d = new Date(prev);
      if (view==='week') d.setDate(d.getDate()+dir*7);
      else if (view==='month') d.setMonth(d.getMonth()+dir);
      else d.setMonth(d.getMonth()+dir);
      return d;
    });
  };

  const handlePrint = () => window.print();

  const weekStart = getWeekStart(current);
  const weekDays = Array.from({length:7}, (_,i) => addDays(weekStart,i));

  const titleStr = view==='week'
    ? `${weekDays[0].getDate()} ${MONTHS[weekDays[0].getMonth()].slice(0,3)} — ${weekDays[6].getDate()} ${MONTHS[weekDays[6].getMonth()].slice(0,3)} ${weekDays[6].getFullYear()}`
    : `${MONTHS[current.getMonth()]} ${current.getFullYear()}`;

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #planning-print, #planning-print * { visibility: visible !important; }
          #planning-print { position: fixed; inset: 0; background: white !important; color: black !important; padding: 20px; }
          .no-print { display: none !important; }
          .evt-chip { border: 1px solid #ddd !important; background: #f5f5f5 !important; color: #333 !important; }
        }
        @keyframes fadeSlide { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .plan-anim { animation: fadeSlide 0.25s ease; }
      `}</style>

      <div id="planning-print" ref={printRef} style={{ paddingBottom:60 }}>
        {/* ── HEADER ── */}
        <div className="no-print" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
          <div>
            <h2 style={{ fontSize:24, fontWeight:900, color:'#f1f5f9', margin:0, letterSpacing:'-0.5px' }}>📅 Planning</h2>
            <p style={{ fontSize:13, color:'#475569', margin:'4px 0 0' }}>Agenda complet du club</p>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            {/* Filtre */}
            <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{ padding:'8px 12px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'#1e293b', color:'#f1f5f9', fontSize:12, fontFamily:'inherit', cursor:'pointer' }}>
              <option value="">Tous</option>
              {Object.entries(TYPES).filter(([k])=>k!=='cancelled').map(([k,v])=>(
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </select>
            {/* Vues */}
            <div style={{ display:'flex', background:'rgba(255,255,255,0.05)', borderRadius:10, padding:3, border:'1px solid rgba(255,255,255,0.08)' }}>
              {[
                { key:'week', icon:<LayoutGrid size={14}/>, label:'Sem.' },
                { key:'month', icon:<Calendar size={14}/>, label:'Mois' },
                { key:'list', icon:<List size={14}/>, label:'Liste' },
              ].map(v=>(
                <button key={v.key} onClick={()=>setView(v.key)} style={{
                  display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700, transition:'all 0.15s',
                  background: view===v.key ? 'rgba(34,211,238,0.15)' : 'transparent',
                  color: view===v.key ? '#22d3ee' : '#64748b',
                }}>{v.icon}{v.label}</button>
              ))}
            </div>
            {/* Print */}
            <button onClick={handlePrint} title="Imprimer" style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#94a3b8', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:600 }}>
              <Printer size={14}/> Imprimer
            </button>
          </div>
        </div>

        {/* ── NAV DATE ── */}
        <div className="no-print" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <button onClick={()=>nav(-1)} style={{ width:34, height:34, borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#94a3b8', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><ChevronLeft size={16}/></button>
          <button onClick={()=>setCurrent(new Date())} style={{ padding:'6px 16px', borderRadius:10, border:'1px solid rgba(34,211,238,0.3)', background:'rgba(34,211,238,0.08)', color:'#22d3ee', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700 }}>Aujourd'hui</button>
          <button onClick={()=>nav(1)} style={{ width:34, height:34, borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#94a3b8', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><ChevronRight size={16}/></button>
          <span style={{ fontSize:16, fontWeight:800, color:'#f1f5f9', letterSpacing:'-0.3px' }}>{titleStr}</span>
          <span style={{ fontSize:12, color:'#475569', marginLeft:4 }}>{filtered.length} événement{filtered.length>1?'s':''}</span>
        </div>

        {/* ── LÉGENDE ── */}
        <div className="no-print" style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
          {Object.entries(TYPES).filter(([k])=>k!=='cancelled').map(([k,v])=>(
            <button key={k} onClick={()=>setFilterType(filterType===k?'':k)} style={{
              display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, border:'1px solid', cursor:'pointer', fontFamily:'inherit', fontSize:11, fontWeight:700, transition:'all 0.15s',
              borderColor: filterType===k ? v.color : `${v.color}44`,
              background: filterType===k ? `${v.color}20` : 'transparent',
              color: filterType===k ? v.color : '#64748b',
            }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:v.color, flexShrink:0 }}/>
              {v.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'#475569' }}>
            <div style={{ fontSize:32, marginBottom:12, animation:'spin 1s linear infinite' }}>⏳</div>
            Chargement du planning...
          </div>
        ) : (
          <div className="plan-anim">
            {view==='week' && <WeekView days={weekDays} forDay={forDay} today={today} onSelect={setSelected}/>}
            {view==='month' && <MonthView current={current} forDay={forDay} today={today} onSelect={setSelected}/>}
            {view==='list' && <ListView events={filtered} today={today} onSelect={setSelected}/>}
          </div>
        )}
      </div>

      {selected && <EventPopup event={selected} onClose={()=>setSelected(null)}/>}
    </>
  );
}

// ── VUE SEMAINE ─────────────────────────────────────────────
function WeekView({ days, forDay, today, onSelect }) {
  return (
    <div>
      {/* Grille header jours */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6, marginBottom:6 }}>
        {days.map((day,i) => {
          const isToday = sameDay(day,today);
          const isPast = day < today && !isToday;
          return (
            <div key={i} style={{ textAlign:'center', padding:'8px 4px' }}>
              <div style={{ fontSize:10, fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:1.5, marginBottom:4 }}>{DAYS[i]}</div>
              <div style={{
                width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto',
                background: isToday ? '#22d3ee' : 'transparent',
                boxShadow: isToday ? '0 0 0 4px rgba(34,211,238,0.15)' : 'none',
                border: !isToday && !isPast ? '1px solid rgba(255,255,255,0.1)' : 'none',
                color: isToday ? '#0a0e1a' : isPast ? '#334155' : '#f1f5f9',
                fontSize:15, fontWeight:900,
              }}>{day.getDate()}</div>
              <div style={{ fontSize:9, color:'#334155', marginTop:3 }}>{MONTHS[day.getMonth()].slice(0,3)}</div>
            </div>
          );
        })}
      </div>
      {/* Grille événements */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6 }}>
        {days.map((day,i) => {
          const dayEvts = forDay(day);
          const isToday = sameDay(day,today);
          const isPast = day < today && !isToday;
          return (
            <div key={i} style={{
              minHeight:120, borderRadius:12, padding:6,
              background: isToday ? 'rgba(34,211,238,0.04)' : isPast ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isToday ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.05)'}`,
            }}>
              {dayEvts.length === 0 ? (
                <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#1e293b', fontSize:18 }}>·</div>
              ) : dayEvts.map(evt => {
                const t = TYPES[evt.type]||TYPES.other;
                return (
                  <button key={evt.id+i} onClick={()=>onSelect(evt)} style={{
                    width:'100%', marginBottom:4, padding:'5px 6px', borderRadius:7, border:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit',
                    background: `${t.color}18`, borderLeft:`3px solid ${t.color}`,
                    transition:'transform 0.1s, box-shadow 0.1s',
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.02)';e.currentTarget.style.boxShadow=`0 4px 12px ${t.color}30`}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='none'}}
                  >
                    <div style={{ fontSize:10, fontWeight:800, color:t.color, display:'flex', alignItems:'center', gap:3 }}>
                      <span>{t.emoji}</span>
                      <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:80 }}>{evt.title}</span>
                    </div>
                    {evt.time_start && <div style={{ fontSize:9, color:`${t.color}99`, marginTop:1 }}>{evt.time_start.slice(0,5)}</div>}
                    {evt.date_end && evt.date_end!==evt.date && <div style={{ fontSize:9, color:`${t.color}80`, fontStyle:'italic' }}>Multi-jours</div>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── VUE MOIS ────────────────────────────────────────────────
function MonthView({ current, forDay, today, onSelect }) {
  const year = current.getFullYear(), month = current.getMonth();
  const first = new Date(year,month,1);
  const offset = first.getDay()===0?6:first.getDay()-1;
  const days = [];
  for (let i=offset-1;i>=0;i--) { const d=new Date(first);d.setDate(d.getDate()-i-1);days.push({date:d,cur:false}); }
  for (let i=1;i<=new Date(year,month+1,0).getDate();i++) days.push({date:new Date(year,month,i),cur:true});
  while(days.length%7!==0){const d=new Date(days[days.length-1].date);d.setDate(d.getDate()+1);days.push({date:d,cur:false});}

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:6 }}>
        {DAYS.map(d=><div key={d} style={{ textAlign:'center', fontSize:10, fontWeight:800, color:'#334155', textTransform:'uppercase', letterSpacing:1, padding:'6px 0' }}>{d}</div>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
        {days.map(({date,cur},i)=>{
          const isToday=sameDay(date,today);
          const isPast=date<today&&!isToday;
          const evts=forDay(date);
          return (
            <div key={i} style={{ minHeight:90, borderRadius:10, padding:5, background:cur?(isToday?'rgba(34,211,238,0.05)':'rgba(255,255,255,0.02)'):'transparent', border:`1px solid ${isToday?'rgba(34,211,238,0.25)':cur?'rgba(255,255,255,0.06)':'transparent'}`, opacity:cur?1:0.3 }}>
              <div style={{ fontSize:12, fontWeight:isToday?900:500, color:isToday?'#22d3ee':isPast?'#334155':'#94a3b8', marginBottom:4, width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:isToday?'rgba(34,211,238,0.15)':'transparent' }}>{date.getDate()}</div>
              {evts.slice(0,2).map(evt=>{
                const t=TYPES[evt.type]||TYPES.other;
                return (
                  <button key={evt.id+i} onClick={()=>onSelect(evt)} style={{ width:'100%', padding:'2px 5px', borderRadius:5, border:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit', background:`${t.color}18`, borderLeft:`2px solid ${t.color}`, marginBottom:2, display:'block', transition:'opacity 0.1s' }}
                  onMouseEnter={e=>e.currentTarget.style.opacity='0.8'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                    <div style={{ fontSize:9, fontWeight:700, color:t.color, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.emoji} {evt.title}</div>
                  </button>
                );
              })}
              {evts.length>2&&<div style={{ fontSize:9, color:'#475569', fontWeight:600, paddingLeft:4 }}>+{evts.length-2} autre{evts.length-2>1?'s':''}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── VUE LISTE ───────────────────────────────────────────────
function ListView({ events, today, onSelect }) {
  if (!events.length) return (
    <div style={{ textAlign:'center', padding:'60px 24px', color:'#334155' }}>
      <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
      <p style={{ fontSize:15, color:'#475569' }}>Aucun événement</p>
    </div>
  );

  const grouped = {};
  for (const e of events) {
    const key = `${MONTHS[new Date(e.date).getMonth()]} ${new Date(e.date).getFullYear()}`;
    if (!grouped[key]) grouped[key]=[];
    grouped[key].push(e);
  }

  return (
    <div>
      {Object.entries(grouped).map(([month, evts])=>(
        <div key={month} style={{ marginBottom:32 }}>
          <div style={{ fontSize:11, fontWeight:900, color:'#334155', textTransform:'uppercase', letterSpacing:2, marginBottom:14, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)', display:'block' }}/>
            {month}
            <span style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)', display:'block' }}/>
          </div>
          {evts.map(evt=>{
            const t=TYPES[evt.type]||TYPES.other;
            const isPast=new Date(evt.date)<today;
            const d=new Date(evt.date);
            return (
              <button key={evt.id} onClick={()=>onSelect(evt)} style={{
                display:'flex', alignItems:'stretch', gap:0, width:'100%', marginBottom:8, borderRadius:12, border:'none', cursor:'pointer', fontFamily:'inherit', overflow:'hidden', textAlign:'left',
                background: isPast?'rgba(255,255,255,0.02)':'rgba(255,255,255,0.03)',
                opacity: isPast?0.6:1,
                transition:'transform 0.15s, box-shadow 0.15s',
                boxShadow: `inset 0 0 0 1px ${isPast?'rgba(255,255,255,0.05)':t.color+'22'}`,
              }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateX(4px)';e.currentTarget.style.boxShadow=`inset 0 0 0 1px ${t.color}44, -4px 0 0 ${t.color}`}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateX(0)';e.currentTarget.style.boxShadow=`inset 0 0 0 1px ${isPast?'rgba(255,255,255,0.05)':t.color+'22'}`}}
              >
                {/* Date bloc */}
                <div style={{ width:64, background:`${t.color}12`, borderRight:`1px solid ${t.color}22`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'12px 8px', flexShrink:0 }}>
                  <div style={{ fontSize:22, fontWeight:900, color:sameDay(d,today)?'#22d3ee':t.color, lineHeight:1 }}>{d.getDate()}</div>
                  <div style={{ fontSize:9, fontWeight:800, color:`${t.color}99`, textTransform:'uppercase', letterSpacing:1 }}>{DAYS[(d.getDay()===0?6:d.getDay()-1)]}</div>
                </div>
                {/* Contenu */}
                <div style={{ flex:1, padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:20, flexShrink:0 }}>{t.emoji}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:'#f1f5f9', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{evt.title}</div>
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                      {evt.time_start&&<span style={{ fontSize:11, color:'#64748b' }}>🕐 {evt.time_start.slice(0,5)}{evt.time_end?` → ${evt.time_end.slice(0,5)}`:''}</span>}
                      {evt.location&&<span style={{ fontSize:11, color:'#64748b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:160 }}>📍 {evt.location}</span>}
                      {evt.date_end&&evt.date_end!==evt.date&&<span style={{ fontSize:11, color:'#64748b' }}>→ {new Date(evt.date_end).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}</span>}
                    </div>
                  </div>
                  <div style={{ fontSize:10, fontWeight:800, color:t.color, background:`${t.color}15`, padding:'3px 10px', borderRadius:20, flexShrink:0, border:`1px solid ${t.color}33` }}>{t.label}</div>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── POPUP DÉTAIL ─────────────────────────────────────────────
function EventPopup({ event, onClose }) {
  const t = TYPES[event.type]||TYPES.other;
  const d = new Date(event.date);
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        border:`1px solid ${t.color}44`, borderRadius:20, width:'100%', maxWidth:440, padding:28,
        boxShadow:`0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px ${t.color}22`,
        animation:'fadeSlide 0.2s ease',
      }}>
        {/* Bande colorée top */}
        <div style={{ height:4, borderRadius:4, background:`linear-gradient(90deg, ${t.color}, ${t.color}44)`, marginBottom:20 }}/>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:`${t.color}20`, border:`1px solid ${t.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>{t.emoji}</div>
            <div>
              <h3 style={{ color:'#f1f5f9', fontSize:17, fontWeight:900, margin:'0 0 4px', letterSpacing:'-0.3px' }}>{event.title}</h3>
              <span style={{ fontSize:11, fontWeight:800, color:t.color, background:`${t.color}15`, padding:'3px 10px', borderRadius:20, border:`1px solid ${t.color}33`, textTransform:'uppercase', letterSpacing:0.5 }}>{t.label}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#64748b', cursor:'pointer', width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>✕</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            { icon:'📅', val:`${d.toLocaleDateString('fr-FR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}${event.date_end&&event.date_end!==event.date?` → ${new Date(event.date_end).toLocaleDateString('fr-FR',{day:'2-digit',month:'long'})}`:''}`},
            event.time_start && { icon:'🕐', val:`${event.time_start.slice(0,5)}${event.time_end?` → ${event.time_end.slice(0,5)}`:''}`},
            event.location && { icon:'📍', val:event.location },
          ].filter(Boolean).map((row,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{row.icon}</span>
              <span style={{ fontSize:13, color:'#94a3b8', fontWeight:500 }}>{row.val}</span>
            </div>
          ))}
          {event.description&&(
            <div style={{ padding:'12px 14px', borderRadius:10, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', fontSize:13, color:'#64748b', lineHeight:1.6 }}>{event.description}</div>
          )}
          {event.status==='cancelled'&&(
            <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(251,113,133,0.08)', border:'1px solid rgba(251,113,133,0.2)', fontSize:12, color:'#fb7185', fontWeight:700 }}>
              ❌ Événement annulé{event.raw?.cancellation_reason?` — ${event.raw.cancellation_reason}`:''}
            </div>
          )}
          <div style={{ display:'flex', gap:6, marginTop:4 }}>
            {event.source==='tournament'&&<div style={{ fontSize:11, color:'#f97316', background:'rgba(249,115,22,0.08)', borderRadius:8, padding:'6px 12px', fontWeight:700, border:'1px solid rgba(249,115,22,0.2)' }}>🏆 Tournoi FootPlanner</div>}
            {event.source==='stage'&&<div style={{ fontSize:11, color:'#a78bfa', background:'rgba(167,139,250,0.08)', borderRadius:8, padding:'6px 12px', fontWeight:700, border:'1px solid rgba(167,139,250,0.2)' }}>🏕️ Stage FootPlanner</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
