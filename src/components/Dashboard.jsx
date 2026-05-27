import React, { useState } from 'react';
import {
  Sparkles, Calendar, MapPin, Activity, Clock, Zap, Trophy, Users, Star,
  Timer, ArrowLeft, ChevronRight, Play, AlertCircle, FileText,
  Goal as Whistle,
} from 'lucide-react';
import { StatTile, SectionHeader, QuickAction, LiveMatchCard, UpcomingMatchCard } from './MatchCards';
import { MatchWaveGroup } from './MatchWaveGroup';
import { groupScheduledByTime } from '../utils/waves';
import { styles } from '../styles/styles';
import { pdfService } from '../services/pdfService';
// ============================================================
// Dashboard — écran d'accueil après onboarding
// Reçoit ctx (App.jsx) avec :
//   - tournament, teams, matches, standings (data via hooks)
//   - role (rôle d'affichage local)
//   - setView, setSelectedMatch (navigation)
//   - shiftSchedule (action async via service)
// ============================================================
export function Dashboard({
  tournament, teams, matches, standings, role, activeCategory,
  setView, setSelectedMatch,
  shiftSchedule, updateMatch,
  kickoffWave, askConfirm, closeConfirm,
}) {
  const matchesInCategory = activeCategory
    ? matches.filter(m => m.category === activeCategory)
    : matches;
  const liveMatches = matchesInCategory.filter(m => m.status === 'live');
  const upcomingMatches = matchesInCategory.filter(m => m.status === 'scheduled').slice(0, 4);
  const completedCount = matchesInCategory.filter(m => m.status === 'validated').length;
  const totalCount = matchesInCategory.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const isOrganizer = role === 'organizer';
  console.log("Dashboard role:", role, "isOrganizer:", isOrganizer);
  const canFollow = role === 'spectator' || role === 'coach';

  // Toast géré par un état React (plus fiable que document.createElement)
  const [toast, setToast] = useState(null);

  const showToast = (message, isError = false) => {
    setToast({ message, isError, id: Date.now() });
    setTimeout(() => setToast(null), 2500);
  };

  // Mise à jour du score sans clôturer (auto-save pendant le match en cours)
  const handleScoreUpdate = async (matchId, { scoreHome, scoreAway }) => {
    if (!updateMatch) return;
    try {
      await updateMatch(matchId, { scoreHome, scoreAway });
    } catch (e) {
      console.error('Score update failed', e);
    }
  };
  
  const [shifting, setShifting] = useState(false);
  const handleShift = async (minutes) => {
    if (shifting) return;
    setShifting(true);
    try {
      await shiftSchedule(minutes);
      showToast(`Planning decale de ${minutes > 0 ? '+' : ''}${minutes} min`);
    } catch (e) {
      showToast('Erreur lors du decalage', true);
    } finally {
      setShifting(false);
    }
  };

  // Clôture d'un match : passe en validated avec toast
  const handleValidateMatch = async (matchId, { scoreHome, scoreAway }) => {
    if (!updateMatch) return;
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    try {
      await updateMatch(matchId, { status: 'validated', scoreHome, scoreAway });
      const home = teams.find(t => t.id === match.home);
      const away = teams.find(t => t.id === match.away);
      const homeName = home ? (home.short || home.name) : 'Equipe 1';
      const awayName = away ? (away.short || away.name) : 'Equipe 2';
      const msg = `${homeName} ${scoreHome} - ${scoreAway} ${awayName} validé`;
      showToast(msg);
    } catch (e) {
      console.error('Validate failed', e);
      showToast('Erreur lors de la clôture', true);
    }
  };

 // Clôture tous les matchs LIVE d'un coup avec leurs scores actuels
  const handleValidateAllLive = async () => {
    const liveMatches = matchesInCategory.filter(m => m.status === 'live');
    if (!updateMatch || liveMatches.length === 0) return;
    try {
      await Promise.all(
        liveMatches.map(m =>
          updateMatch(m.id, {
            status: 'validated',
            scoreHome: m.scoreHome ?? 0,
            scoreAway: m.scoreAway ?? 0,
          })
        )
      );
      showToast(liveMatches.length === 1
        ? '1 match clôturé'
        : liveMatches.length + ' matchs clôturés');
    } catch (e) {
      console.error('Validate all failed', e);
      showToast('Erreur lors de la clôture', true);
    }
  };

  return (
    <div style={{ paddingBottom: 130 }}>
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 20px',
          background: toast.isError ? '#fb7185' : '#a3e635',
          color: '#0a0e1a',
          borderRadius: 10,
          fontWeight: 800,
          fontSize: 13,
          letterSpacing: 0.5,
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          zIndex: 10000,
        }}>
          {toast.message}
        </div>
      )}
      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroGrid}>
          <div style={styles.heroLabel}>
            <Sparkles size={11} /> EN COURS
          </div>
          <div style={styles.heroTitle}>{tournament.name}</div>
          <div style={styles.heroMeta}>
            {tournament.date && (
              <span>
                <Calendar size={11} /> {new Date(tournament.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            )}
            {tournament.location && (
              <span><MapPin size={11} /> {tournament.location}</span>
            )}
          </div>
          {totalCount > 0 && (
            <div style={styles.heroProgress}>
              <div style={styles.progressTrack}>
                <div style={{ ...styles.progressFill, width: `${progress}%` }} />
              </div>
              <div style={styles.progressMeta}>
                <span style={{ color: '#a3e635', fontWeight: 800 }}>{completedCount}</span>
                <span style={{ color: '#64748b' }}>/ {totalCount} matchs joués · {progress}%</span>
              </div>
            </div>
          )}
        </div>
        <div style={styles.heroAccent} />
      </section>

      {/* Stats */}
      <section style={styles.statRow}>
        <StatTile label="EN DIRECT" value={liveMatches.length} color="#a3e635" pulse />
        <StatTile label="TERMINÉS" value={completedCount} color="#34d399" />
        <StatTile label="ÉQUIPES" value={teams.length} color="#818cf8" />
        <StatTile label="POULES" value={[...new Set(teams.map(t => t.pool))].length} color="#f59e0b" />
      </section>

      {/* Avance/retard (organisateur) */}
      {isOrganizer && (
        <section style={styles.section}>
          <SectionHeader icon={Timer} title="Décaler le planning" accent="#fb7185" />
          <div style={styles.adjustPanel}>
            <button onClick={() => handleShift(-5)} disabled={shifting} style={{...styles.adjustBtn, opacity: shifting ? 0.5 : 1}}>
              {shifting ? '...' : '← -5 min'}
            </button>
            <button onClick={() => handleShift(-10)} disabled={shifting} style={{...styles.adjustBtn, opacity: shifting ? 0.5 : 1}}>
              {shifting ? '...' : '-10 min'}
            </button>
            <div style={styles.adjustLabel}>
              <Timer size={14} color="#fb7185" />
              <span>Avance / Retard</span>
            </div>
            <button onClick={() => handleShift(10)} disabled={shifting} style={{...styles.adjustBtn, opacity: shifting ? 0.5 : 1}}>
              {shifting ? '...' : '+10 min'}
            </button>
            <button onClick={() => handleShift(5)} disabled={shifting} style={{...styles.adjustBtn, opacity: shifting ? 0.5 : 1}}>
              {shifting ? '...' : '+5 min →'}
            </button>
          </div>
          <div style={{ fontSize: 10, color: '#64748b', textAlign: 'center', marginTop: 6 }}>
            Décale tous les matchs à venir (ceux joués/en cours sont préservés).
          </div>
        </section>
      )}

      {/* Live */}
      {liveMatches.length > 0 && (
        <section style={styles.section}>
          <SectionHeader icon={Activity} title="Matchs en direct" accent="#a3e635" />
          {isOrganizer && liveMatches.length > 0 && (
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  if (askConfirm) {
                    askConfirm({
                      title: 'Clôturer tous les matchs en cours ?',
                      message: liveMatches.length === 1
                        ? '1 match va être clôturé avec son score actuel.'
                        : liveMatches.length + ' matchs vont être clôturés avec leurs scores actuels (0-0 si non saisi).',
                      confirmLabel: 'CLÔTURER',
                      onConfirm: async () => {
                        await handleValidateAllLive();
                        closeConfirm();
                      },
                    });
                  } else {
                    handleValidateAllLive();
                  }
                }}
                style={{
                  padding: '8px 14px',
                  background: 'rgba(34,211,238,0.12)',
                  border: '1px solid rgba(34,211,238,0.35)',
                  borderRadius: 7,
                  color: '#a3e635',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 1,
                  cursor: 'pointer',
                }}
              >
                CLÔTURER TOUS ({liveMatches.length})
              </button>
            </div>
          )}
          <div style={styles.cardStack}>
            {liveMatches.map(m => (
              <LiveMatchCard
                key={m.id}
                match={m}
                teams={teams}
                matches={matchesInCategory}
                standings={standings}
                onTap={() => { setSelectedMatch(m); setView('match'); }}
                onUpdateScore={handleScoreUpdate}
                onValidate={handleValidateMatch}
                canEdit={isOrganizer}
              />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming — groupé par vague (heure) avec compte à rebours et bouton coup d'envoi */}
      {(() => {
      const waves = groupScheduledByTime(matchesInCategory).slice(0, 3); // max 3 vagues affichées
        if (waves.length === 0) return null;
        return (
          <section style={styles.section}>
            <SectionHeader icon={Clock} title="Prochaines vagues" accent="#94a3b8" />
            {waves.map(wave => (
              <MatchWaveGroup
                key={wave.time}
                wave={wave}
                tournament={tournament}
                role={role}
                autoKickoffEnabled={tournament.autoKickoff !== false}
                teams={teams}
                matches={matchesInCategory}
                standings={standings}
                onKickoff={kickoffWave}
                askConfirm={askConfirm}
                closeConfirm={closeConfirm}
                setSelectedMatch={setSelectedMatch}
                setView={setView}
              />
            ))}
          </section>
        );
      })()}

      {/* Documents */}
      {isOrganizer && (
        <section style={styles.section}>
          <SectionHeader icon={FileText} title="Documents" accent="#a3e635" />
          <div style={styles.quickGrid}>
            <QuickAction
              icon={FileText}
              label="Affiche QR Code"
              onClick={() => setView('poster')}
              color="#a3e635"
            />
            <QuickAction
              icon={FileText}
              label="Planning complet"
              onClick={() => pdfService.downloadSchedulePdf(tournament, teams, matches)}
              color="#34d399"
            />
            <QuickAction
              icon={FileText}
              label="Résumé compact"
              onClick={() => pdfService.downloadSummaryPdf(tournament, teams, matches)}
              color="#818cf8"
            />
            {[...new Set(teams.map(t => t.pool).filter(Boolean))].sort().map(pool => (
              <QuickAction
                key={pool}
                icon={FileText}
                label={"Poule " + pool}
                onClick={() => pdfService.downloadPoolPdf(tournament, teams, matches, pool)}
                color="#f59e0b"
              />
            ))}
          </div>
        </section>
      )}
      {/* Quick actions */}
      <section style={styles.section}>
        <SectionHeader icon={Zap} title="Raccourcis" accent="#818cf8" />
        <div style={styles.quickGrid}>
          <QuickAction icon={Trophy} label="Classement live" onClick={() => setView('standings')} color="#f59e0b" />
          <QuickAction icon={Whistle} label="Tous les matchs" onClick={() => setView('matches')} color="#a3e635" />
          {canFollow && (
            <QuickAction icon={Star} label="Mes équipes" onClick={() => setView('follow')} color="#facc15" />
          )}
          {role !== 'spectator' && (
            <QuickAction icon={Users} label="Équipes" onClick={() => setView('teams')} color="#818cf8" />
          )}
          {isOrganizer && (
            <>
              <QuickAction icon={Calendar} label="Calendrier" onClick={() => setView('schedule')} color="#34d399" />
              <QuickAction icon={Trophy} label="Archives" onClick={() => setView('archives')} color="#818cf8" />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
