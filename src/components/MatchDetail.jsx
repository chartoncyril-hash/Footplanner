import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Activity, Clock, ShieldCheck, Lock, Eye, Star, Flag,
  MinusCircle, PlusCircle, Check, RefreshCw,
  Goal as Whistle,
} from 'lucide-react';
import { Crest } from './Crest';
import { getDisplayTeam } from '../utils/standings';
import { knockoutRoundLabel, isKnockoutPhase } from '../utils/scheduling';
import { styles } from '../styles/styles';
import { supabase } from '../lib/supabase';
import { ChronoBar, MatchEventsPanel } from './MatchEvents';

// ============================================================
// MatchDetail — fiche match avec saisie de score
//
// Logique d'autorisation :
//   - organizer : tout, y compris rouvrir un match validé
//   - referee : peut start/saisir/clôturer, mais PAS rouvrir
//   - autres : lecture seule
//
// L'arbitre passe par submitScore() (RPC) avec son refereeCode.
// L'organisateur passe par updateMatch() direct (RLS le laisse passer).
// ============================================================
export function MatchDetail({
  selectedMatch, setSelectedMatch, setView,
  teams, matches, standings,
  updateMatch, submitScore,
  role, refereeCode,
}) {
  const [home, setHome] = useState(selectedMatch.scoreHome ?? 0);
  const [away, setAway] = useState(selectedMatch.scoreAway ?? 0);
  const [fpHome, setFpHome] = useState(selectedMatch.fairplayHome ?? true);
  const [fpAway, setFpAway] = useState(selectedMatch.fairplayAway ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const m = matches.find(x => x.id === selectedMatch.id) || selectedMatch;
  const homeTeam = getDisplayTeam('home', m, teams, matches, standings);
  const awayTeam = getDisplayTeam('away', m, teams, matches, standings);
  const isPlaceholderMatch = homeTeam.isPlaceholder || awayTeam.isPlaceholder;

  const isOrganizer = role === 'organizer';
  const isReferee = role === 'referee';
  const canEditScores = isOrganizer || isReferee;
  const canModifyNow = canEditScores && !isPlaceholderMatch && (m.status !== 'validated' || isOrganizer);

  useEffect(() => {
    setHome(m.scoreHome ?? 0);
    setAway(m.scoreAway ?? 0);
    setFpHome(m.fairplayHome ?? true);
    setFpAway(m.fairplayAway ?? true);
  }, [m.id]);

  const showToast = (msg = 'Score enregistré') => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  // Routage de l'écriture selon le rôle
  const persist = async (patch, msg) => {
    setError('');
    setSaving(true);
    try {
      if (isReferee && !isOrganizer) {
        await submitScore({
          matchId: m.id,
          scoreHome: patch.scoreHome ?? m.scoreHome ?? 0,
          scoreAway: patch.scoreAway ?? m.scoreAway ?? 0,
          status: patch.status ?? m.status,
          fairplayHome: patch.fairplayHome ?? m.fairplayHome,
          fairplayAway: patch.fairplayAway ?? m.fairplayAway,
        });
      } else {
        await updateMatch(m.id, patch);
      }
      if (msg !== false) showToast(msg);
    } catch (e) {
      setError(e.message || "Erreur d'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  // Auto-save : chaque +/- déclenche une sauvegarde immédiate
  const handleHomeChange = (newVal) => {
    setHome(newVal);
    persist({ scoreHome: newVal, scoreAway: away }, 'Score enregistré');
  };

  const handleAwayChange = (newVal) => {
    setAway(newVal);
    persist({ scoreHome: home, scoreAway: newVal }, 'Score enregistré');
  };

  const handleFpHomeChange = (newVal) => {
    setFpHome(newVal);
    persist({
      scoreHome: home, scoreAway: away,
      fairplayHome: newVal, fairplayAway: fpAway,
    }, 'Fair-play mis à jour');
  };

  const handleFpAwayChange = (newVal) => {
    setFpAway(newVal);
    persist({
      scoreHome: home, scoreAway: away,
      fairplayHome: fpHome, fairplayAway: newVal,
    }, 'Fair-play mis à jour');
  };

  const startMatch = async () => {
    const now = new Date().toISOString();
    await persist({ status: 'live', scoreHome: 0, scoreAway: 0, kickedOffAt: now }, false);
  };
  const startChrono = async () => {
    if (m.kickedOffAt) return;
    const now = new Date().toISOString();
    await updateMatch(m.id, { kickedOffAt: now });
  };
  const closeMatch = () => persist({
    status: 'validated',
    scoreHome: home, scoreAway: away,
    fairplayHome: fpHome, fairplayAway: fpAway,
  }, false);
  const reopenMatch = () => persist({ status: 'live' }, false);

  const back = () => { setSelectedMatch(null); setView('matches'); };

  return (
    <div style={{ paddingBottom: 130 }}>
      <button onClick={back} style={styles.backBtn}>
        <ArrowLeft size={16} /> Retour
      </button>

      <div style={styles.matchDetailHero}>
        <div style={styles.matchMetaRow}>
          {isKnockoutPhase(m) ? (
            <span style={{ ...styles.matchMeta, color: '#f59e0b' }}>
              {knockoutRoundLabel(m.knockoutRound, m.cup)}
            </span>
          ) : (
            <>
              <span style={styles.matchMeta}>Poule {m.pool}</span>
              <span style={styles.matchDot}>·</span>
              <span style={styles.matchMeta}>J{m.round}</span>
              <span style={styles.matchDot}>·</span>
            </>
          )}
          <span style={styles.matchMeta}>{m.field}</span>
          <span style={styles.matchDot}>·</span>
          <span style={styles.matchMeta}>{(m.time || '').slice(0, 5)}</span>
        </div>

        <StatusPill status={m.status} saving={saving} />

        {isPlaceholderMatch && (
          <div style={{ ...styles.infoBox, marginBottom: 14, marginTop: 0 }}>
            <Lock size={13} color="#94a3b8" /> En attente des matchs précédents
          </div>
        )}

        <div style={styles.bigScore}>
          <div style={styles.bigTeam}>
            <Crest team={homeTeam} size="xl" />
            <div style={styles.bigTeamName}>{homeTeam.name}</div>
          </div>
          <div style={styles.bigScoreNumbers}>
            {canModifyNow && m.status !== 'scheduled' ? (
              <ScoreEditor value={home} onChange={handleHomeChange} color="#a3e635" disabled={saving} />
            ) : (
              <span style={styles.bigScoreNum}>{m.scoreHome ?? '-'}</span>
            )}
            <span style={styles.bigScoreSep}>:</span>
            {canModifyNow && m.status !== 'scheduled' ? (
              <ScoreEditor value={away} onChange={handleAwayChange} color="#f472b6" disabled={saving} />
            ) : (
              <span style={styles.bigScoreNum}>{m.scoreAway ?? '-'}</span>
            )}
          </div>
          <div style={styles.bigTeam}>
            <Crest team={awayTeam} size="xl" />
            <div style={styles.bigTeamName}>{awayTeam.name}</div>
          </div>
        </div>

        {m.referee && (
          <div style={styles.refRow}>
            <Flag size={11} /> {m.referee}
          </div>
        )}
      </div>

      {/* Chrono */}
      {(m.status === 'live') && (
        <ChronoBar
          match={{ ...m, kicked_off_at: m.kickedOffAt }}
          canEdit={canModifyNow}
          onKickoff={startChrono}
        />
      )}

      {canModifyNow && m.status !== 'scheduled' && (
        <section style={styles.detailCard}>
          <div style={styles.detailCardTitle}>
            <Star size={13} color="#facc15" /> FAIR-PLAY
          </div>
          <div style={styles.fpRow}>
            <FpToggle team={homeTeam} value={fpHome} onChange={handleFpHomeChange} />
            <FpToggle team={awayTeam} value={fpAway} onChange={handleFpAwayChange} />
          </div>
          <div style={styles.fpHint}>+1 pt si fair-play respecté ce match</div>
        </section>
      )}

      {/* Cartons */}
      {m.status !== 'scheduled' && (
        <section style={styles.detailCard}>
          <MatchEventsPanel
            match={{ ...m, kicked_off_at: m.kickedOffAt }}
            tournament={{ id: m.tournamentId }}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            canEdit={canModifyNow && m.status === 'live'}
          />
        </section>
      )}

      {error && (
        <div style={{ ...styles.fieldError, marginBottom: 10, textAlign: 'center' }}>
          {error}
        </div>
      )}

      <div style={styles.actionStack}>
        {m.status === 'scheduled' && canModifyNow && (
          <button onClick={startMatch} disabled={saving} style={styles.btnPrimary}>
            <Whistle size={16} /> {saving ? 'PATIENTE…' : "COUP D'ENVOI"}
          </button>
        )}
        {m.status === 'live' && canModifyNow && (
          <button onClick={closeMatch} disabled={saving} style={styles.btnPrimary}>
            <Check size={16} /> {saving ? 'EN COURS…' : 'CLÔTURER LE MATCH'}
          </button>
        )}
        {m.status === 'validated' && isOrganizer && (
          <button onClick={reopenMatch} disabled={saving} style={styles.btnSecondary}>
            <RefreshCw size={14} /> Rouvrir le match
          </button>
        )}
        {m.status === 'validated' && !isOrganizer && canEditScores && (
          <div style={styles.infoBox}>
            <Lock size={14} color="#34d399" /> Match clôturé — seul l'organisateur peut le modifier
          </div>
        )}
        {!canEditScores && (
          <div style={styles.infoBox}>
            <Eye size={14} color="#94a3b8" /> Mode consultation — lecture seule
          </div>
        )}
        {isReferee && !refereeCode && (
          <div style={{ ...styles.fieldError, textAlign: 'center', marginTop: 4 }}>
            ⚠ Code arbitre absent — la saisie sera refusée. Reconnecte-toi en mode arbitre.
          </div>
        )}
      </div>

      {/* Toast auto-save */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 96,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(52,211,153,0.15)',
          border: '1px solid rgba(52,211,153,0.45)',
          borderRadius: 24,
          padding: '9px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          color: '#34d399',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.3,
          zIndex: 200,
          backdropFilter: 'blur(10px)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          animation: 'slideUp 0.2s ease',
        }}>
          <Check size={13} strokeWidth={3} /> {toast}
        </div>
      )}
    </div>
  );
}

function ScoreEditor({ value, onChange, color, disabled }) {
  return (
    <div style={styles.scoreEditor}>
      <button
        onClick={() => !disabled && onChange(Math.max(0, value - 1))}
        style={{ ...styles.scoreBtn, color, opacity: disabled ? 0.5 : 1 }}
      >
        <MinusCircle size={20} />
      </button>
      <span style={{ ...styles.bigScoreNum, color, minWidth: 50, textAlign: 'center' }}>{value}</span>
      <button
        onClick={() => !disabled && onChange(value + 1)}
        style={{ ...styles.scoreBtn, color, opacity: disabled ? 0.5 : 1 }}
      >
        <PlusCircle size={20} />
      </button>
    </div>
  );
}

function FpToggle({ team, value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        ...styles.fpToggle,
        borderColor: value ? '#facc15' : '#1e293b',
        background: value ? 'rgba(250,204,21,0.08)' : 'transparent',
      }}
    >
      <Crest team={team} size="sm" />
      <span style={styles.fpLabel}>{team.short}</span>
      <Star size={14} color={value ? '#facc15' : '#475569'} fill={value ? '#facc15' : 'none'} />
    </button>
  );
}

function StatusPill({ status, saving }) {
  const map = {
    scheduled: { label: 'PROGRAMMÉ', color: '#94a3b8', icon: Clock },
    live: { label: 'EN DIRECT', color: '#a3e635', icon: Activity, pulse: true },
    validated: { label: 'VALIDÉ', color: '#34d399', icon: ShieldCheck },
  };
  const s = map[status] || map.scheduled;
  const Icon = s.icon;
  return (
    <div style={{ ...styles.statusPill, color: s.color, borderColor: s.color + '55', background: s.color + '12' }}>
      {s.pulse && <span style={{ ...styles.pulseDot, background: s.color, position: 'static' }} />}
      <Icon size={10} /> {s.label}
      {saving && <span style={{ fontSize: 9, opacity: 0.7, marginLeft: 4 }}>· enreg…</span>}
    </div>
  );
}
