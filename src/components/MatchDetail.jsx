import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Activity, Clock, ShieldCheck, Lock, Eye, Star, Flag,
  MinusCircle, PlusCircle, Save, Check, RefreshCw,
  Goal as Whistle,
} from 'lucide-react';
import { Crest } from './Crest';
import { getDisplayTeam } from '../utils/standings';
import { knockoutRoundLabel } from '../utils/scheduling';
import { styles } from '../styles/styles';

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
  const [savedFlash, setSavedFlash] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Reflète le match courant (peut avoir changé via Realtime ou refresh)
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

  // Routage de l'écriture selon le rôle
  const persist = async (patch) => {
    setError('');
    setSaving(true);
    try {
      if (isReferee && !isOrganizer) {
        // Arbitre : RPC sécurisée
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
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } catch (e) {
      setError(e.message || 'Erreur d\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const startMatch = () => persist({ status: 'live', scoreHome: 0, scoreAway: 0 });
  const closeMatch = () => persist({
    status: 'validated',
    scoreHome: home,
    scoreAway: away,
    fairplayHome: fpHome,
    fairplayAway: fpAway,
  });
  const liveSave = () => persist({ scoreHome: home, scoreAway: away });
  const reopenMatch = () => persist({ status: 'live' });
  const saveCorrection = () => persist({
    scoreHome: home,
    scoreAway: away,
    fairplayHome: fpHome,
    fairplayAway: fpAway,
  });
  const back = () => { setSelectedMatch(null); setView('matches'); };

  return (
    <div style={{ paddingBottom: 130 }}>
      <button onClick={back} style={styles.backBtn}>
        <ArrowLeft size={16} /> Retour
      </button>

      <div style={styles.matchDetailHero}>
        <div style={styles.matchMetaRow}>
          {m.phase === 'knockout' ? (
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

        <StatusPill status={m.status} />

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
              <ScoreEditor value={home} onChange={setHome} color="#22d3ee" />
            ) : (
              <span style={styles.bigScoreNum}>{m.scoreHome ?? '-'}</span>
            )}
            <span style={styles.bigScoreSep}>:</span>
            {canModifyNow && m.status !== 'scheduled' ? (
              <ScoreEditor value={away} onChange={setAway} color="#f472b6" />
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

      {canModifyNow && m.status !== 'scheduled' && (
        <section style={styles.detailCard}>
          <div style={styles.detailCardTitle}>
            <Star size={13} color="#facc15" /> FAIR-PLAY
          </div>
          <div style={styles.fpRow}>
            <FpToggle team={homeTeam} value={fpHome} onChange={setFpHome} />
            <FpToggle team={awayTeam} value={fpAway} onChange={setFpAway} />
          </div>
          <div style={styles.fpHint}>+1 pt si fair-play respecté ce match</div>
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
          <>
            <button
              onClick={liveSave}
              disabled={saving}
              style={{
                ...styles.btnSecondary,
                ...(savedFlash ? { background: 'rgba(52,211,153,0.15)', borderColor: 'rgba(52,211,153,0.5)', color: '#34d399' } : {}),
              }}
            >
              {savedFlash
                ? <><Check size={14} /> Score sauvegardé</>
                : <><Save size={14} /> Sauvegarder le score live</>}
            </button>
            <button onClick={closeMatch} disabled={saving} style={styles.btnPrimary}>
              <Check size={16} /> CLÔTURER LE MATCH
            </button>
          </>
        )}
        {m.status === 'validated' && isOrganizer && (
          <>
            <button
              onClick={saveCorrection}
              disabled={saving}
              style={{
                ...styles.btnPrimary,
                ...(savedFlash ? { background: 'linear-gradient(135deg, #34d399, #10b981)' } : {}),
              }}
            >
              {savedFlash
                ? <><Check size={16} /> CORRECTION ENREGISTRÉE</>
                : <><Save size={16} /> ENREGISTRER LA CORRECTION</>}
            </button>
            <button onClick={reopenMatch} disabled={saving} style={styles.btnSecondary}>
              <RefreshCw size={14} /> Rouvrir le match
            </button>
          </>
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
    </div>
  );
}

function ScoreEditor({ value, onChange, color }) {
  return (
    <div style={styles.scoreEditor}>
      <button onClick={() => onChange(Math.max(0, value - 1))} style={{ ...styles.scoreBtn, color }}>
        <MinusCircle size={20} />
      </button>
      <span style={{ ...styles.bigScoreNum, color, minWidth: 50, textAlign: 'center' }}>{value}</span>
      <button onClick={() => onChange(value + 1)} style={{ ...styles.scoreBtn, color }}>
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

function StatusPill({ status }) {
  const map = {
    scheduled: { label: 'PROGRAMMÉ', color: '#94a3b8', icon: Clock },
    live: { label: 'EN DIRECT', color: '#22d3ee', icon: Activity, pulse: true },
    validated: { label: 'VALIDÉ', color: '#34d399', icon: ShieldCheck },
  };
  const s = map[status] || map.scheduled;
  const Icon = s.icon;
  return (
    <div style={{ ...styles.statusPill, color: s.color, borderColor: s.color + '55', background: s.color + '12' }}>
      {s.pulse && <span style={{ ...styles.pulseDot, background: s.color, position: 'static' }} />}
      <Icon size={10} /> {s.label}
    </div>
  );
}
