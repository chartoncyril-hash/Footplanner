import React from 'react';
import { Activity, ChevronRight, Clock, Hash, Crown, ShieldCheck } from 'lucide-react';
import { Crest } from './Crest';
import { getDisplayTeam } from '../utils/standings';
import { styles } from '../styles/styles';

// ============================================================
// Primitives UI réutilisables
// Pas de logique métier ici, juste de l'affichage paramétré
// ============================================================

export function StatTile({ label, value, color, pulse }) {
  return (
    <div style={{ ...styles.statTile, position: 'relative' }}>
      {pulse && value > 0 && <span style={{ ...styles.pulseDot, background: color }} />}
      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

export function SectionHeader({ icon: Icon, title, accent = '#a3e635', badge }) {
  return (
    <div style={styles.sectionHeader}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ ...styles.sectionIconBox, background: accent + '15', borderColor: accent + '40' }}>
          <Icon size={13} color={accent} strokeWidth={2.5} />
        </div>
        <span style={styles.sectionTitle}>{title}</span>
        {badge !== undefined && (
          <span style={{ ...styles.sectionBadge, background: accent }}>{badge}</span>
        )}
      </div>
    </div>
  );
}

export function QuickAction({ icon: Icon, label, onClick, color }) {
  return (
    <button onClick={onClick} style={styles.quickAction}>
      <div style={{ ...styles.quickIcon, background: color + '15', borderColor: color + '40' }}>
        <Icon size={18} color={color} strokeWidth={2.2} />
      </div>
      <span style={styles.quickLabel}>{label}</span>
    </button>
  );
}

export function PageHeader({ title, subtitle, icon: Icon, accent = '#a3e635' }) {
  return (
    <div style={styles.pageHeader}>
      <div style={{ ...styles.pageHeaderIcon, background: accent + '15', borderColor: accent + '40' }}>
        <Icon size={18} color={accent} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={styles.pageHeaderTitle}>{title}</div>
        {subtitle && <div style={styles.pageHeaderSub}>{subtitle}</div>}
      </div>
    </div>
  );
}

// ============================================================
// LiveMatchCard — match en cours, gros score visible
// ============================================================
export function LiveMatchCard({ match, teams, matches, standings, onTap, onUpdateScore, onValidate, canEdit }) {
  const home = getDisplayTeam('home', match, teams, matches, standings);
  const away = getDisplayTeam('away', match, teams, matches, standings);
  const [draftHome, setDraftHome] = React.useState(match.scoreHome ?? 0);
  const [draftAway, setDraftAway] = React.useState(match.scoreAway ?? 0);
  const [saving, setSaving] = React.useState(false);

  // Sync local state if match score changes externally
  React.useEffect(() => {
    setDraftHome(match.scoreHome ?? 0);
    setDraftAway(match.scoreAway ?? 0);
  }, [match.scoreHome, match.scoreAway]);

  const updateHome = async (delta) => {
    const newVal = Math.max(0, Math.min(99, (draftHome || 0) + delta));
    setDraftHome(newVal);
    if (onUpdateScore && canEdit) {
      try { await onUpdateScore(match.id, { scoreHome: newVal, scoreAway: draftAway }); }
      catch (e) { console.error('Score update failed', e); }
    }
  };

  const updateAway = async (delta) => {
    const newVal = Math.max(0, Math.min(99, (draftAway || 0) + delta));
    setDraftAway(newVal);
    if (onUpdateScore && canEdit) {
      try { await onUpdateScore(match.id, { scoreHome: draftHome, scoreAway: newVal }); }
      catch (e) { console.error('Score update failed', e); }
    }
  };

  const handleValidate = async (e) => {
    e.stopPropagation();
    if (!onValidate || saving) return;
    setSaving(true);
    try { await onValidate(match.id, { scoreHome: draftHome, scoreAway: draftAway }); }
    catch (e) { console.error('Validate failed', e); }
    finally { setSaving(false); }
  };

  const btnScore = (delta) => ({
    width: 28, height: 28,
    background: 'rgba(34,211,238,0.12)',
    border: '1px solid rgba(34,211,238,0.35)',
    borderRadius: 7,
    color: '#a3e635',
    fontSize: 18, fontWeight: 800,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0,
    lineHeight: 1,
  });

  return (
    <div style={styles.liveCard}>
      <div style={styles.liveTopRow}>
        <div style={styles.livePill}>
          <span style={styles.livePulse} />
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5 }}>EN DIRECT</span>
        </div>
        <div style={styles.liveField}>
          <Hash size={9} /> {match.field}
        </div>
      </div>
      <div style={styles.liveScore}>
        <div style={styles.liveTeam}>
          <Crest team={home} size="md" />
          <span style={styles.liveTeamName}>{home.short}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {canEdit && (
            <button onClick={(e) => { e.stopPropagation(); updateHome(-1); }} style={btnScore(-1)}>−</button>
          )}
          <div style={{
            fontSize: 26, fontWeight: 800, color: '#f1f5f9',
            minWidth: 32, textAlign: 'center',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {draftHome}
          </div>
          {canEdit && (
            <button onClick={(e) => { e.stopPropagation(); updateHome(1); }} style={btnScore(1)}>+</button>
          )}
          <span style={{ color: '#475569', fontSize: 18, fontWeight: 800, margin: '0 4px' }}>—</span>
          {canEdit && (
            <button onClick={(e) => { e.stopPropagation(); updateAway(-1); }} style={btnScore(-1)}>−</button>
          )}
          <div style={{
            fontSize: 26, fontWeight: 800, color: '#f1f5f9',
            minWidth: 32, textAlign: 'center',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {draftAway}
          </div>
          {canEdit && (
            <button onClick={(e) => { e.stopPropagation(); updateAway(1); }} style={btnScore(1)}>+</button>
          )}
        </div>
        <div style={{ ...styles.liveTeam, flexDirection: 'row-reverse' }}>
          <Crest team={away} size="md" />
          <span style={styles.liveTeamName}>{away.short}</span>
        </div>
      </div>
      {canEdit && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button
            onClick={handleValidate}
            disabled={saving}
            style={{
              flex: 1, padding: '10px 12px',
              background: saving ? 'rgba(34,211,238,0.3)' : '#a3e635',
              border: 'none', borderRadius: 7,
              color: '#0a0e1a',
              fontSize: 11, fontWeight: 800, letterSpacing: 1,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'EN COURS...' : `CLÔTURER ${draftHome}-${draftAway}`}
          </button>
          {onTap && (
            <button
              onClick={(e) => { e.stopPropagation(); onTap(); }}
              style={{
                padding: '10px 12px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 7,
                color: '#94a3b8',
                fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                cursor: 'pointer',
              }}
            >
              DÉTAILS
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// UpcomingMatchCard — match à venir, heure visible
// ============================================================
export function UpcomingMatchCard({ match, teams, matches, standings, onTap }) {
  const home = getDisplayTeam('home', match, teams, matches, standings);
  const away = getDisplayTeam('away', match, teams, matches, standings);
  return (
    <button onClick={onTap} style={styles.upcomingCard}>
      <div style={styles.upcomingTime}>
        <Clock size={11} color="#94a3b8" />
        <span style={{ fontSize: 12, fontWeight: 800, color: '#cbd5e1', fontFamily: "'JetBrains Mono', monospace" }}>
          {(match.time || '').slice(0, 5)}
        </span>
      </div>
      <div style={styles.upcomingMid}>
        <div style={styles.upcomingTeams}>
          <Crest team={home} size="sm" />
          <span style={styles.upcomingTeamName}>{home.short}</span>
          <span style={{ fontSize: 10, color: '#475569', margin: '0 4px' }}>vs</span>
          <Crest team={away} size="sm" />
          <span style={styles.upcomingTeamName}>{away.short}</span>
        </div>
        <div style={styles.upcomingMeta}>
          <Hash size={9} /> {match.field}
          {match.pool && <span> · P.{match.pool}</span>}
        </div>
      </div>
      <ChevronRight size={14} color="#475569" />
    </button>
  );
}

// ============================================================
// MatchListCard — utilisée dans la liste complète
// Organizer : saisie rapide de score inline sans entrer dans les détails
// ============================================================
export function MatchListCard({ match, teams, matches, standings, onTap, role, onUpdateScore, onValidate, onKickoff }) {
  const home = getDisplayTeam('home', match, teams, matches, standings);
  const away = getDisplayTeam('away', match, teams, matches, standings);
  const isLive = match.status === 'live';
  const isDone = match.status === 'validated';
  const isScheduled = match.status === 'scheduled';
  const isOrganizer = role === 'organizer';

  const [draftHome, setDraftHome] = React.useState(match.scoreHome ?? 0);
  const [draftAway, setDraftAway] = React.useState(match.scoreAway ?? 0);
  const [editMode, setEditMode] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setDraftHome(match.scoreHome ?? 0);
    setDraftAway(match.scoreAway ?? 0);
  }, [match.scoreHome, match.scoreAway]);

  const adj = (side, delta) => async (e) => {
    e.stopPropagation();
    const nh = side === 'home' ? Math.max(0, draftHome + delta) : draftHome;
    const na = side === 'away' ? Math.max(0, draftAway + delta) : draftAway;
    if (side === 'home') setDraftHome(nh); else setDraftAway(na);
    if (onUpdateScore && isLive) {
      try { await onUpdateScore(match.id, { scoreHome: nh, scoreAway: na }); } catch (_) {}
    }
  };

  const handleValidate = async (e) => {
    e.stopPropagation();
    if (!onValidate || saving) return;
    setSaving(true);
    try { await onValidate(match.id, { scoreHome: draftHome, scoreAway: draftAway }); }
    catch (_) {} finally { setSaving(false); }
  };

  const handleKickoff = async (e) => {
    e.stopPropagation();
    if (!onKickoff || saving) return;
    setSaving(true);
    try { await onKickoff(match.id); }
    catch (_) {} finally { setSaving(false); }
  };

  const handleSaveEdit = async (e) => {
    e.stopPropagation();
    if (!onUpdateScore || saving) return;
    setSaving(true);
    try {
      await onUpdateScore(match.id, { scoreHome: draftHome, scoreAway: draftAway });
      setEditMode(false);
    } catch (_) {} finally { setSaving(false); }
  };

  let stateColor = '#94a3b8';
  let stateLabel = (match.time || '').slice(0, 5) || '—';
  if (isLive) { stateColor = '#a3e635'; stateLabel = 'EN DIRECT'; }
  else if (isDone) { stateColor = '#34d399'; stateLabel = 'TERMINÉ'; }

  const btnSm = (color = '#22d3ee') => ({
    width: 26, height: 26,
    background: color + '18',
    border: '1px solid ' + color + '40',
    borderRadius: 6,
    color,
    fontSize: 16, fontWeight: 800,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0, lineHeight: 1, flexShrink: 0,
  });

  const scoreNum = (val) => (
    <span style={{ fontSize: 18, fontWeight: 800, minWidth: 22, textAlign: 'center', color: '#f1f5f9', fontFamily: "'JetBrains Mono', monospace" }}>
      {val}
    </span>
  );

  // Rangée du haut : info équipes + score
  const topRow = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
      <div style={{ ...styles.matchListLeft, color: stateColor }}>
        {isLive && <span style={styles.livePulse} />}
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1 }}>{stateLabel}</span>
      </div>
      <div style={{ ...styles.matchListMid }}>
        <div style={styles.matchListSide}>
          <Crest team={home} size="sm" />
          <span style={styles.matchListName}>{home.short}</span>
        </div>
        <div style={styles.matchListScore}>
          {(isLive || isDone)
            ? <span style={{ color: stateColor, fontWeight: 800 }}>{match.scoreHome ?? 0} - {match.scoreAway ?? 0}</span>
            : <span style={{ color: '#475569' }}>vs</span>}
        </div>
        <div style={{ ...styles.matchListSide, flexDirection: 'row-reverse' }}>
          <Crest team={away} size="sm" />
          <span style={styles.matchListName}>{away.short}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ ...styles.matchListRight }}>
          <Hash size={9} /> {match.field}
        </div>
        {/* Bouton édition pour matchs terminés */}
        {isOrganizer && isDone && !editMode && (
          <button
            onClick={(e) => { e.stopPropagation(); setEditMode(true); }}
            style={{ ...btnSm('#94a3b8'), width: 22, height: 22, marginLeft: 4 }}
            title="Modifier le score"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        )}
      </div>
    </div>
  );

  // Contrôles inline pour live et edit mode
  const scoreControls = (onClose) => (
    <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Home score */}
      <button onClick={adj('home', -1)} style={btnSm()}>−</button>
      {scoreNum(draftHome)}
      <button onClick={adj('home', +1)} style={btnSm('#a3e635')}>+</button>
      <span style={{ color: '#334155', fontWeight: 800, margin: '0 4px' }}>—</span>
      {/* Away score */}
      <button onClick={adj('away', -1)} style={btnSm()}>−</button>
      {scoreNum(draftAway)}
      <button onClick={adj('away', +1)} style={btnSm('#a3e635')}>+</button>
      {/* Action button */}
      {isLive && (
        <button onClick={handleValidate} disabled={saving} style={{ flex: 1, padding: '5px 8px', background: '#a3e635', border: 'none', borderRadius: 6, color: '#0a0e1a', fontSize: 10, fontWeight: 800, letterSpacing: 0.5, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? '...' : `CLÔTURER ${draftHome}-${draftAway}`}
        </button>
      )}
      {editMode && isDone && (
        <>
          <button onClick={handleSaveEdit} disabled={saving} style={{ flex: 1, padding: '5px 8px', background: '#22d3ee', border: 'none', borderRadius: 6, color: '#0a0e1a', fontSize: 10, fontWeight: 800, letterSpacing: 0.5, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? '...' : 'SAUVEGARDER'}
          </button>
          <button onClick={(e) => { e.stopPropagation(); setEditMode(false); }} style={{ padding: '5px 8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#64748b', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
            ✕
          </button>
        </>
      )}
    </div>
  );

  if (isOrganizer && isScheduled) {
    return (
      <div style={{ ...styles.matchListCard, flexDirection: 'column', alignItems: 'stretch', cursor: 'default' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <button onClick={onTap} style={{ flex: 1, background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#f1f5f9', textAlign: 'left' }}>
            {topRow}
          </button>
          <button onClick={handleKickoff} disabled={saving} style={{ marginLeft: 8, padding: '5px 10px', background: '#a3e63520', border: '1px solid #a3e63550', borderRadius: 7, color: '#a3e635', fontSize: 10, fontWeight: 800, letterSpacing: 0.5, cursor: saving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {saving ? '...' : '▶ DÉMARRER'}
          </button>
        </div>
      </div>
    );
  }

  if (isOrganizer && isLive) {
    return (
      <div style={{ ...styles.matchListCard, flexDirection: 'column', alignItems: 'stretch', cursor: 'default', borderColor: 'rgba(163,230,53,0.2)' }}>
        <button onClick={onTap} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', color: '#f1f5f9' }}>
          {topRow}
        </button>
        {scoreControls()}
      </div>
    );
  }

  if (isOrganizer && isDone) {
    return (
      <div style={{ ...styles.matchListCard, flexDirection: 'column', alignItems: 'stretch', cursor: 'default' }}>
        <button onClick={onTap} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', color: '#f1f5f9' }}>
          {topRow}
        </button>
        {editMode && scoreControls()}
      </div>
    );
  }

  // Lecture seule (spectateur, coach, arbitre, etc.)
  return (
    <button onClick={onTap} style={styles.matchListCard}>
      <div style={{ ...styles.matchListLeft, color: stateColor }}>
        {isLive && <span style={styles.livePulse} />}
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1 }}>{stateLabel}</span>
      </div>
      <div style={styles.matchListMid}>
        <div style={styles.matchListSide}>
          <Crest team={home} size="sm" />
          <span style={styles.matchListName}>{home.short}</span>
        </div>
        <div style={styles.matchListScore}>
          {(isLive || isDone)
            ? <span style={{ color: stateColor, fontWeight: 800 }}>{match.scoreHome ?? 0} - {match.scoreAway ?? 0}</span>
            : <span style={{ color: '#475569' }}>vs</span>}
        </div>
        <div style={{ ...styles.matchListSide, flexDirection: 'row-reverse' }}>
          <Crest team={away} size="sm" />
          <span style={styles.matchListName}>{away.short}</span>
        </div>
      </div>
      <div style={styles.matchListRight}>
        <Hash size={9} /> {match.field}
      </div>
    </button>
  );
}
