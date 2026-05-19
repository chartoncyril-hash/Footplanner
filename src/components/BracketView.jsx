import React from 'react';
import { Trophy, Sparkles } from 'lucide-react';
import { Crest } from './Crest';
import { getDisplayTeam } from '../utils/standings';
import { knockoutRoundLabel } from '../utils/scheduling';
import { styles } from '../styles/styles';

// ============================================================
// BracketView — affichage colonné des matchs de phase finale
// ============================================================
export function BracketView({ knockoutMatches, teams, matches, standings, onMatchTap }) {
  const roundOrder = ['r16', 'qf', 'sf', 'final', '3rd'];

  // Détection Multi-cup : au moins un match a un cup défini
  const isMultiCup = knockoutMatches.some(m => m.cup === 'champions' || m.cup === 'europa');

  // Fonction pour grouper une liste de matchs par round
  const groupByRound = (matchList) => {
    const g = {};
    matchList.forEach(m => {
      const r = m.knockoutRound || 'unknown';
      if (!g[r]) g[r] = [];
      g[r].push(m);
    });
    Object.keys(g).forEach(r => {
      g[r].sort((a, b) => (a.knockoutIndex || 0) - (b.knockoutIndex || 0));
    });
    return g;
  };

  // Cas vide
  if (knockoutMatches.length === 0) {
    return (
      <div style={styles.emptyState}>
        <Trophy size={28} color="#475569" />
        <span>Aucun match de phase finale généré pour l'instant.</span>
      </div>
    );
  }

  // Mode Multi-cup : 2 brackets côte à côte
  if (isMultiCup) {
    const champMatches = knockoutMatches.filter(m => m.cup === 'champions');
    const europaMatches = knockoutMatches.filter(m => m.cup === 'europa');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {champMatches.length > 0 && (
          <CupBracket
            title="🏆 Champions League"
            color="#facc15"
            matches={champMatches}
            groupedRounds={groupByRound(champMatches)}
            roundOrder={roundOrder}
            teams={teams}
            allMatches={matches}
            standings={standings}
            onMatchTap={onMatchTap}
          />
        )}
        {europaMatches.length > 0 && (
          <CupBracket
            title="🥈 Europa League"
            color="#94a3b8"
            matches={europaMatches}
            groupedRounds={groupByRound(europaMatches)}
            roundOrder={roundOrder}
            teams={teams}
            allMatches={matches}
            standings={standings}
            onMatchTap={onMatchTap}
          />
        )}
        <div style={{ ...styles.helpBox, marginTop: 4 }}>
          <Sparkles size={12} color="#a78bfa" />
          <span>Multi-cup : 2 coupes séparées. Les équipes se placent automatiquement après les poules.</span>
        </div>
      </div>
    );
  }

  // Mode Standard : 1 seul bracket
  const grouped = groupByRound(knockoutMatches);
  const presentRounds = roundOrder.filter(r => grouped[r] && grouped[r].length > 0);

  return (
    <>
      <div style={styles.bracketContainer}>
        <div style={styles.bracketGrid}>
          {presentRounds.map(roundKey => (
            <div key={roundKey} style={styles.bracketColumn}>
              <div style={styles.bracketColumnLabel}>
                {knockoutRoundLabel(roundKey, null)}
              </div>
              {grouped[roundKey].map(m => (
                <BracketMatchCard
                  key={m.id}
                  match={m}
                  teams={teams}
                  matches={matches}
                  standings={standings}
                  onTap={() => onMatchTap(m)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...styles.helpBox, marginTop: 16 }}>
        <Sparkles size={12} color="#a78bfa" />
        <span>Les équipes se placent automatiquement dès que les matchs précédents sont validés.</span>
      </div>
    </>
  );
}

// Sous-composant pour afficher un bracket d'une coupe (Champions ou Europa)
function CupBracket({ title, color, groupedRounds, roundOrder, teams, allMatches, standings, onMatchTap }) {
  const presentRounds = roundOrder.filter(r => groupedRounds[r] && groupedRounds[r].length > 0);
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid ' + color + '33',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px',
        background: color + '14',
        borderBottom: '1px solid ' + color + '22',
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 1,
        color: color,
      }}>
        {title}
      </div>
      <div style={{ padding: 12 }}>
        <div style={styles.bracketGrid}>
          {presentRounds.map(roundKey => (
            <div key={roundKey} style={styles.bracketColumn}>
              <div style={styles.bracketColumnLabel}>
                {roundLabelShort(roundKey)}
              </div>
              {groupedRounds[roundKey].map(m => (
                <BracketMatchCard
                  key={m.id}
                  match={m}
                  teams={teams}
                  matches={allMatches}
                  standings={standings}
                  onTap={() => onMatchTap(m)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Label court pour rounds (sans préfixe cup)
function roundLabelShort(round) {
  return {
    r16: '8es de finale',
    qf: 'Quarts',
    sf: 'Demi-finales',
    final: 'Finale',
    '3rd': '3e place',
  }[round] || round;
}
function BracketMatchCard({ match, teams, matches, standings, onTap }) {
  const home = getDisplayTeam('home', match, teams, matches, standings);
  const away = getDisplayTeam('away', match, teams, matches, standings);
  const isLive = match.status === 'live';
  const isDone = match.status === 'validated';
  const homeWin = isDone && match.scoreHome > match.scoreAway;
  const awayWin = isDone && match.scoreAway > match.scoreHome;

  return (
    <button
      onClick={onTap}
      style={{
        ...styles.bracketMatch,
        ...(isLive ? styles.bracketMatchLive : {}),
        ...(isDone ? styles.bracketMatchDone : {}),
      }}
    >
      <div
        style={{
          ...styles.bracketTeam,
          ...(homeWin ? styles.bracketTeamWin : {}),
          ...(isDone && !homeWin ? styles.bracketTeamLose : {}),
        }}
      >
        <Crest team={home} size="sm" />
        <span style={styles.bracketName}>{home.name}</span>
        {match.scoreHome !== null && match.scoreHome !== undefined && (
          <span style={styles.bracketScore}>{match.scoreHome}</span>
        )}
      </div>
      <div
        style={{
          ...styles.bracketTeam,
          ...(awayWin ? styles.bracketTeamWin : {}),
          ...(isDone && !awayWin ? styles.bracketTeamLose : {}),
        }}
      >
        <Crest team={away} size="sm" />
        <span style={styles.bracketName}>{away.name}</span>
        {match.scoreAway !== null && match.scoreAway !== undefined && (
          <span style={styles.bracketScore}>{match.scoreAway}</span>
        )}
      </div>
      <div style={styles.bracketMeta}>
        <span>{match.field || '?'} · {(match.time || '—').slice(0, 5)}</span>
        {isLive && <span style={{ color: '#22d3ee' }}>● LIVE</span>}
        {isDone && <span style={{ color: '#34d399' }}>FT</span>}
      </div>
    </button>
  );
}
