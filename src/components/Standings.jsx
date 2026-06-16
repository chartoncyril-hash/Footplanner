import React, { useState } from 'react';
import { Trophy, Users, Sparkles, Hash } from 'lucide-react';
import { Crest } from './Crest';
import { PageHeader } from './MatchCards';
import { BracketView } from './BracketView';
import { isRankingEnabled } from '../utils/tournament';
import { styles } from '../styles/styles';
import { isKnockoutPhase } from '../utils/scheduling';

// ============================================================
// Standings — classement par poule + accès bracket
// ============================================================
export function Standings({
  tournament, teams, matches, standings,
  setSelectedMatch, setView,
}) {
  const pools = Object.keys(standings).sort();
  const [activePool, setActivePool] = useState(pools[0]);
  const [mode, setMode] = useState('pools'); // 'pools' | 'bracket'

  const knockoutMatches = matches.filter(isKnockoutPhase);
  const rankingOn = isRankingEnabled(tournament);
  const hasKnockout = rankingOn && tournament.hasKnockout && knockoutMatches.length > 0;

  if (!rankingOn) {
    return (
      <div style={{ paddingBottom: 130 }}>
        <PageHeader
          title="Classement"
          subtitle={`Catégorie ${tournament.category}`}
          icon={Trophy}
          accent="#f59e0b"
        />
        <div style={styles.noRankingCard}>
          <div style={{ ...styles.confirmIcon, background: 'rgba(167,139,250,0.15)', borderColor: 'rgba(167,139,250,0.4)', marginBottom: 12 }}>
            <Sparkles size={20} color="#818cf8" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', textAlign: 'center' }}>
            Pas de classement pour les {tournament.category}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', lineHeight: 1.5, marginTop: 8, maxWidth: 320 }}>
            Conformément à l'esprit du football d'animation, aucun classement n'est tenu à cet âge. Les matchs sont joués pour le plaisir et l'apprentissage.
          </div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 14, textAlign: 'center' }}>
            Cette option peut être modifiée dans les <strong>Réglages → Catégories</strong>.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 130 }}>
      <PageHeader
        title="Classement"
        subtitle="Mis à jour en direct après chaque match validé"
        icon={Trophy}
        accent="#f59e0b"
      />

      {hasKnockout && (
        <div style={styles.modeToggle}>
          <button
            onClick={() => setMode('pools')}
            style={{ ...styles.modeBtn, ...(mode === 'pools' ? styles.modeBtnActive : {}) }}
          >
            <Users size={13} /> POULES
          </button>
          <button
            onClick={() => setMode('bracket')}
            style={{ ...styles.modeBtn, ...(mode === 'bracket' ? styles.modeBtnActive : {}) }}
          >
            <Trophy size={13} /> PHASE FINALE
          </button>
        </div>
      )}

      {mode === 'bracket' ? (
        <BracketView
          knockoutMatches={knockoutMatches}
          teams={teams}
          matches={matches}
          standings={standings}
          onMatchTap={(m) => { setSelectedMatch(m); setView('match'); }}
        />
      ) : (
        <PoolsStandings
          pools={pools}
          activePool={activePool}
          standings={standings}
          tournament={tournament}
          setActivePool={setActivePool}
        />
      )}
    </div>
  );
}

function PoolsStandings({ pools, activePool, standings, tournament, setActivePool }) {
  const knockoutLineRank = (tournament.knockoutFromTopN || 2);
  const showQualLine = tournament.hasKnockout;

  return (
    <>
      <div style={styles.poolTabs}>
        {pools.map(p => (
          <button
            key={p}
            onClick={() => setActivePool(p)}
            style={{ ...styles.poolTab, ...(activePool === p ? styles.poolTabActive : {}) }}
          >
            POULE {p}
          </button>
        ))}
      </div>

      <div style={styles.standingsCard}>
        <div style={styles.standingsHead}>
          <div style={{ width: 24 }}>#</div>
          <div style={{ flex: 1 }}>ÉQUIPE</div>
          <div style={styles.statCol}>J</div>
          <div style={styles.statCol}>G</div>
          <div style={styles.statCol}>N</div>
          <div style={styles.statCol}>P</div>
          <div style={styles.statCol}>+/-</div>
          <div style={{ ...styles.statCol, width: 38, fontWeight: 800, color: '#a3e635' }}>PTS</div>
        </div>
        {standings[activePool]?.map((t, i) => {
          const qualified = showQualLine && i < knockoutLineRank;
          return (
            <div
              key={t.id}
              style={{
                ...styles.standingsRow,
                borderLeft: `3px solid ${qualified ? '#a3e635' : 'transparent'}`,
              }}
            >
              <div style={{ width: 24, fontWeight: 800, color: qualified ? '#a3e635' : '#64748b' }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Crest team={t} size="sm" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={styles.teamNameSmall}>{t.name}</span>
                  {t.fairplayPoints > 0 && (
                    <span style={styles.bonusLine}>+{t.fairplayPoints} fair-play</span>
                  )}
                </div>
              </div>
              <div style={styles.statCol}>{t.played}</div>
              <div style={{ ...styles.statCol, color: '#34d399' }}>{t.won}</div>
              <div style={{ ...styles.statCol, color: '#94a3b8' }}>{t.drawn}</div>
              <div style={{ ...styles.statCol, color: '#f87171' }}>{t.lost}</div>
              <div
                style={{
                  ...styles.statCol,
                  color: t.goalDiff > 0 ? '#34d399' : t.goalDiff < 0 ? '#f87171' : '#94a3b8',
                }}
              >
                {t.goalDiff > 0 ? '+' : ''}{t.goalDiff}
              </div>
              <div style={{ ...styles.statCol, width: 38, fontWeight: 800, fontSize: 15, color: '#a3e635' }}>
                {t.points}
              </div>
            </div>
          );
        })}
      </div>

      {tournament.tiebreakers && tournament.tiebreakers.length > 0 && (
        <div style={styles.tieRules}>
          <div style={styles.tieRulesTitle}>
            <Hash size={12} /> CRITÈRES DE DÉPARTAGE
          </div>
          <div style={styles.tieRulesList}>
            {tournament.tiebreakers.map((tb, i) => (
              <div key={tb} style={styles.tieRule}>
                <span style={styles.tieRuleNum}>{i + 1}</span>
                <span>{labelFor(tb)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function labelFor(tb) {
  return ({
    points: 'Points',
    goalDiff: 'Différence de buts',
    goalsFor: 'Buts marqués',
    headToHead: 'Confrontation directe',
  })[tb] || tb;
}
