import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getEffectiveOwnerId } from "../lib/effectiveUser";

// ============================================================
// MatchEvents — Chrono + Cartons pour MatchDetail
// ============================================================

const REASONS = [
  'Jeu dangereux', 'Faute grossière', 'Contestation arbitre',
  'Retard de jeu', 'Simulation', 'Récidive', 'Autre'
];

function useChronoFromKickoff(kickedOffAt) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!kickedOffAt) return;
    const tick = () => {
      const ms = Date.now() - new Date(kickedOffAt).getTime();
      setElapsed(Math.max(0, Math.floor(ms / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [kickedOffAt]);
  return elapsed;
}

function formatChrono(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── CHRONO BAR ───────────────────────────────────────────────
export function ChronoBar({ match, onKickoff, canEdit }) {
  const elapsed = useChronoFromKickoff(match.kicked_off_at);
  const isLive = match.status === 'live';
  const minute = Math.floor(elapsed / 60) + 1;

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, padding:'12px 0', marginBottom:8 }}>
      {isLive && match.kicked_off_at ? (
        <>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:32, fontWeight:900, color:'#a3e635', fontFamily:"'JetBrains Mono', monospace", letterSpacing:2 }}>
              {formatChrono(elapsed)}
            </div>
            <div style={{ fontSize:11, color:'#64748b', fontWeight:700, letterSpacing:1, textTransform:'uppercase' }}>
              {minute > 90 ? `+${minute - 90}'` : `${minute}'`}
            </div>
          </div>
        </>
      ) : isLive && !match.kicked_off_at && canEdit ? (
        <button onClick={onKickoff} style={{ padding:'8px 20px', background:'rgba(163,230,53,0.15)', border:'1px solid rgba(163,230,53,0.3)', borderRadius:10, color:'#a3e635', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
          ⏱️ Démarrer le chrono
        </button>
      ) : null}
    </div>
  );
}

// ── MATCH EVENTS PANEL ───────────────────────────────────────
export function MatchEventsPanel({ match, tournament, homeTeam, awayTeam, canEdit }) {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [cardType, setCardType] = useState('yellow');
  const [licencies, setLicencies] = useState([]);
  const elapsed = useChronoFromKickoff(match.kicked_off_at);
  const currentMinute = match.kicked_off_at ? Math.floor(elapsed / 60) + 1 : null;

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('match_events')
      .select('*')
      .eq('match_id', match.id)
      .order('minute', { ascending: true })
      .order('created_at', { ascending: true });
    if (data) setEvents(data);
  }, [match.id]);

  useEffect(() => { load(); }, [load]);

  // Charger licenciés du club pour équipe locale
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('licencies')
        .select('id, first_name, last_name, licence_number, category')
        .eq('owner_id', await getEffectiveOwnerId())
        .order('last_name');
      setLicencies(data || []);
    })();
  }, []);

  // Détection double jaune
  const getEffectiveType = (event, allEvents) => {
    if (event.type !== 'yellow') return event.type;
    if (!event.player_number) return event.type;
    const yellows = allEvents.filter(e =>
      e.team_side === event.team_side &&
      e.player_number === event.player_number &&
      e.type === 'yellow'
    );
    const idx = yellows.findIndex(e => e.id === event.id);
    if (idx >= 1) return 'double_yellow';
    return event.type;
  };

  const deleteEvent = async (id) => {
    if (!window.confirm('Supprimer cet événement ?')) return;
    await supabase.from('match_events').delete().eq('id', id);
    load();
  };

  const isLive = match.status === 'live';

  return (
    <div style={{ marginTop: 16 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <span style={{ fontSize:12, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:1 }}>
          🟨 Cartons
        </span>
        {canEdit && isLive && (
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => { setCardType('yellow'); setShowForm(true); }}
              style={{ padding:'5px 12px', borderRadius:8, border:'1px solid rgba(250,204,21,0.4)', background:'rgba(250,204,21,0.1)', color:'#facc15', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              🟨 Jaune
            </button>
            <button onClick={() => { setCardType('red'); setShowForm(true); }}
              style={{ padding:'5px 12px', borderRadius:8, border:'1px solid rgba(251,113,133,0.4)', background:'rgba(251,113,133,0.1)', color:'#fb7185', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              🟥 Rouge
            </button>
          </div>
        )}
      </div>

      {/* Liste événements */}
      {events.length === 0 ? (
        <div style={{ color:'#475569', fontSize:13, textAlign:'center', padding:'12px 0' }}>
          Aucun carton pour ce match
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {events.map(evt => {
            const effectiveType = getEffectiveType(evt, events);
            const isHome = evt.team_side === 'home';
            const teamName = isHome ? homeTeam.name : awayTeam.name;
            const emoji = effectiveType === 'double_yellow' ? '🟨🟥' : effectiveType === 'red' ? '🟥' : '🟨';
            return (
              <div key={evt.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ fontSize:16 }}>{emoji}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#f1f5f9' }}>
                    {evt.player_name || 'Joueur inconnu'}
                    {evt.player_number && <span style={{ color:'#64748b', fontWeight:400, marginLeft:6 }}>#{evt.player_number}</span>}
                  </div>
                  <div style={{ fontSize:11, color:'#64748b' }}>
                    {teamName}
                    {evt.minute && <span> · {evt.minute}'</span>}
                    {evt.reason && <span> · {evt.reason}</span>}
                    {effectiveType === 'double_yellow' && <span style={{ color:'#fb7185', fontWeight:700 }}> · Expulsion 2ème jaune</span>}
                  </div>
                </div>
                {canEdit && (
                  <button onClick={() => deleteEvent(evt.id)} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:16, padding:'0 4px' }}>✕</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal saisie carton */}
      {showForm && (
        <CardForm
          type={cardType}
          match={match}
          tournament={tournament}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          licencies={licencies}
          currentMinute={currentMinute}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

// ── CARD FORM ────────────────────────────────────────────────
function CardForm({ type, match, tournament, homeTeam, awayTeam, licencies, currentMinute, onClose, onSaved }) {
  const [teamSide, setTeamSide] = useState('home');
  const [playerMode, setPlayerMode] = useState('list'); // 'list' | 'free'
  const [selectedLicId, setSelectedLicId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerNumber, setPlayerNumber] = useState('');
  const [minute, setMinute] = useState(currentMinute || '');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const isHomeClub = teamSide === 'home'; // équipe locale = home par défaut
  // On suppose que l'équipe home appartient au club organisateur
  // Si licencies disponibles → mode liste, sinon mode libre

  const handleLicSelect = (licId) => {
    setSelectedLicId(licId);
    if (licId) {
      const lic = licencies.find(l => l.id === licId);
      if (lic) {
        setPlayerName(`${lic.first_name} ${lic.last_name}`);
        setPlayerNumber(lic.licence_number || '');
      }
    } else {
      setPlayerName('');
      setPlayerNumber('');
    }
  };

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('match_events').insert({
      match_id: match.id,
      tournament_id: tournament.id,
      owner_id: await getEffectiveOwnerId(),
      type,
      team_side: teamSide,
      player_name: playerName.trim() || null,
      player_number: playerNumber.trim() || null,
      minute: minute ? parseInt(minute) : null,
      reason: reason.trim() || null,
    });
    setSaving(false);
    onSaved();
  };

  const inp = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'#1e293b', color:'#f1f5f9', fontSize:13, fontFamily:'inherit', boxSizing:'border-box' };
  const lbl = { fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.8, display:'block', marginBottom:5 };
  const typeColor = type === 'yellow' ? '#facc15' : '#fb7185';
  const typeLabel = type === 'yellow' ? '🟨 Carton Jaune' : '🟥 Carton Rouge';

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#0f172a', border:`1px solid ${typeColor}33`, borderRadius:16, width:'100%', maxWidth:420, padding:24, maxHeight:'90vh', overflowY:'auto' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h3 style={{ color:typeColor, fontSize:16, fontWeight:800, margin:0 }}>{typeLabel}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:18 }}>✕</button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Équipe */}
          <div>
            <label style={lbl}>Équipe</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[
                { side:'home', team:homeTeam },
                { side:'away', team:awayTeam },
              ].map(({ side, team }) => (
                <button key={side} onClick={() => { setTeamSide(side); setSelectedLicId(''); setPlayerName(''); setPlayerNumber(''); setPlayerMode(side === 'home' && licencies.length > 0 ? 'list' : 'free'); }}
                  style={{ padding:'10px 8px', borderRadius:10, border:'1px solid', textAlign:'center', cursor:'pointer', fontFamily:'inherit',
                    borderColor: teamSide === side ? typeColor : 'rgba(255,255,255,0.1)',
                    background: teamSide === side ? `${typeColor}15` : 'rgba(255,255,255,0.03)',
                    color: teamSide === side ? typeColor : '#94a3b8', fontWeight:700, fontSize:12,
                  }}>
                  {team.name}
                </button>
              ))}
            </div>
          </div>

          {/* Joueur */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
              <label style={{ ...lbl, marginBottom:0 }}>Joueur</label>
              {teamSide === 'home' && licencies.length > 0 && (
                <button onClick={() => setPlayerMode(playerMode === 'list' ? 'free' : 'list')}
                  style={{ fontSize:11, color:'#64748b', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>
                  {playerMode === 'list' ? 'Saisie libre' : 'Depuis licenciés'}
                </button>
              )}
            </div>
            {teamSide === 'home' && licencies.length > 0 && playerMode === 'list' ? (
              <select style={inp} value={selectedLicId} onChange={e => handleLicSelect(e.target.value)}>
                <option value="">— Sélectionner un licencié —</option>
                {licencies.map(l => (
                  <option key={l.id} value={l.id}>{l.first_name} {l.last_name} {l.category ? `(${l.category})` : ''}</option>
                ))}
              </select>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 80px', gap:8 }}>
                <input style={inp} placeholder="Nom du joueur" value={playerName} onChange={e => setPlayerName(e.target.value)} />
                <input style={inp} placeholder="N°" value={playerNumber} onChange={e => setPlayerNumber(e.target.value)} />
              </div>
            )}
          </div>

          {/* Minute */}
          <div>
            <label style={lbl}>Minute</label>
            <input type="number" style={{ ...inp, width:100 }} min={1} max={120} value={minute} onChange={e => setMinute(e.target.value)} placeholder={currentMinute ? `${currentMinute}'` : 'ex: 23'} />
          </div>

          {/* Motif */}
          <div>
            <label style={lbl}>Motif</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
              {REASONS.map(r => (
                <button key={r} onClick={() => setReason(reason === r ? '' : r)}
                  style={{ padding:'4px 10px', borderRadius:16, border:'1px solid', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
                    borderColor: reason === r ? typeColor : 'rgba(255,255,255,0.1)',
                    background: reason === r ? `${typeColor}15` : 'transparent',
                    color: reason === r ? typeColor : '#64748b',
                  }}>{r}</button>
              ))}
            </div>
            <input style={inp} placeholder="Ou saisir un motif libre..." value={REASONS.includes(reason) ? '' : reason} onChange={e => setReason(e.target.value)} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:8, marginTop:20 }}>
          <button onClick={onClose} style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'#64748b', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            Annuler
          </button>
          <button onClick={save} disabled={saving} style={{ flex:2, padding:'10px', borderRadius:8, border:'none', background:typeColor, color:'#0a0e1a', fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit', opacity:saving?0.6:1 }}>
            {saving ? 'Enregistrement...' : `Confirmer ${type === 'yellow' ? '🟨' : '🟥'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
