import React, { useState, useEffect } from 'react';
import { Play, Clock, Zap } from 'lucide-react';
import { LiveMatchCard, UpcomingMatchCard } from './MatchCards';
import { getWaveTimingStatus, getWaveColor, getWaveStatusLabel } from '../utils/waves';
import { styles } from '../styles/styles';

export function MatchWaveGroup({
  wave, tournament, role, autoKickoffEnabled,
  teams, matches, standings,
  onKickoff, askConfirm, closeConfirm,
  setSelectedMatch, setView,
}) {
  const isOrganizer = role === 'organizer';
  const tournamentDate = tournament?.date;

  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const timing = getWaveTimingStatus(wave, tournamentDate);
  const color = getWaveColor(timing.status);
  const label = getWaveStatusLabel(timing);

  const handleManualKickoff = () => {
    askConfirm({
      title: 'Lancer maintenant ?',
      message:
        wave.matches.length === 1
          ? 'Le match de ' + wave.time + ' va passer en LIVE immediatement.'
          : 'Les ' + wave.matches.length + ' matchs prevus a ' + wave.time + ' vont tous passer en LIVE simultanement.',
      confirmLabel: "COUP D'ENVOI",
      onConfirm: async () => {
        await onKickoff(wave.matches);
        closeConfirm();
      },
    });
  };

  const countdown = (() => {
    if (!tournamentDate) return null;
    const matchDate = new Date(tournamentDate + 'T' + wave.time + ':00');
    const diffSec = Math.floor((matchDate - new Date()) / 1000);
    if (diffSec <= 0) return '00:00';
    const h = Math.floor(diffSec / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    const s = diffSec % 60;
    if (h > 0) return h + 'h ' + m.toString().padStart(2, '0') + 'min';
    return m + 'min ' + s.toString().padStart(2, '0') + 's';
  })();

  const isLate = timing.status === 'late';

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px',
        background: color + '12',
        border: '1px solid ' + color + '33',
        borderRadius: 8, marginBottom: 8,
      }}>
        <Clock size={13} color={color} />
        <span style={{
          fontSize: 13, fontWeight: 800, color,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: 1,
        }}>{wave.time}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, color }}>
          {label}
        </span>
      </div>

      <div style={styles.cardStack}>
        {wave.matches.map(m => (
          <UpcomingMatchCard
            key={m.id}
            match={m}
            teams={teams}
            matches={matches}
            standings={standings}
            onTap={() => { setSelectedMatch(m); setView('match'); }}
          />
        ))}
      </div>

      {isOrganizer && (
        <div style={{
          marginTop: 8,
          padding: '12px 14px',
          background: 'linear-gradient(135deg, ' + color + '15, ' + color + '05)',
          border: '1.5px solid ' + color + '55',
          borderRadius: 12,
          boxShadow: isLate ? '0 0 20px ' + color + '30' : 'none',
        }}>
          {autoKickoffEnabled && !isLate && countdown ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Zap size={16} color={color} />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: 1.5,
                    color, marginBottom: 2,
                  }}>COUP D'ENVOI AUTO</div>
                  <div style={{
                    fontSize: 16, fontWeight: 800, color: '#f1f5f9',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>Dans {countdown}</div>
                </div>
              </div>
              <button
                onClick={handleManualKickoff}
                style={{
                  width: '100%', padding: '10px',
                  background: 'transparent',
                  border: '1px solid ' + color + '55',
                  borderRadius: 8, color,
                  fontSize: 11, fontWeight: 800, letterSpacing: 1,
                  cursor: 'pointer',
                }}
              >
                LANCER MAINTENANT (sans attendre l'heure)
              </button>
            </>
          ) : (
            <button
              onClick={handleManualKickoff}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '12px',
                background: 'transparent', border: 'none',
                color, fontSize: 14, fontWeight: 800, letterSpacing: 1,
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <Play size={16} fill={color} strokeWidth={2.5} />
              COUP D'ENVOI {wave.time}
            </button>
          )}
        </div>
      )}
    </div>
  );
}