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
    <div style={styles.statTile}>
      <div style={{ ...styles.statValue, color }}>
        {value}
        {pulse && value > 0 && <span style={{ ...styles.pulseDot, background: color }} />}
      </div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

export function SectionHeader({ icon: Icon, title, accent = '#22d3ee', badge }) {
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

export function PageHeader({ title, subtitle, icon: Icon, accent = '#22d3ee' }) {
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
    color: '#22d3ee',
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
              background: saving ? 'rgba(34,211,238,0.3)' : '#22d3ee',
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
// ============================================================
export function MatchListCard({ match, teams, matches, standings, onTap }) {
  const home = getDisplayTeam('home', match, teams, matches, standings);
  const away = getDisplayTeam('away', match, teams, matches, standings);
  const isLive = match.status === 'live';
  const isDone = match.status === 'validated';

  let stateColor = '#94a3b8';
  let stateLabel = (match.time || '').slice(0, 5) || '—';
  if (isLive) { stateColor = '#22d3ee'; stateLabel = 'EN DIRECT'; }
  else if (isDone) { stateColor = '#34d399'; stateLabel = 'TERMINÉ'; }

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
            ? <span style={{ color: stateColor, fontWeight: 800 }}>
                {match.scoreHome ?? 0} - {match.scoreAway ?? 0}
              </span>
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
