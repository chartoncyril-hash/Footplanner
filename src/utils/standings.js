// ============================================================
// Calcul du classement — logique pure
// ============================================================

export function computeStandings(teams, matches, tournament) {
  const byPool = {};

  teams.forEach(t => {
    if (!byPool[t.pool]) byPool[t.pool] = [];
    const stats = {
      ...t,
      played: 0, won: 0, drawn: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, goalDiff: 0,
      points: 0,
      basePoints: 0, bonusPoints: 0, fairplayPoints: 0,
    };

    matches.forEach(m => {
      if (m.status !== 'validated') return;
      if (m.phase && m.phase !== 'pool') return; // exclure les knockouts
      if (m.home !== t.id && m.away !== t.id) return;

      const isHome = m.home === t.id;
      const gf = isHome ? m.scoreHome : m.scoreAway;
      const ga = isHome ? m.scoreAway : m.scoreHome;
      stats.played++;
      stats.goalsFor += gf;
      stats.goalsAgainst += ga;

      if (gf > ga) { stats.won++; stats.basePoints += tournament.scoring.win; }
      else if (gf === ga) { stats.drawn++; stats.basePoints += tournament.scoring.draw; }
      else { stats.lost++; stats.basePoints += tournament.scoring.loss; }

      const fp = isHome ? m.fairplayHome : m.fairplayAway;
      if (tournament.bonuses?.fairplay?.enabled && fp) {
        stats.fairplayPoints += tournament.bonuses.fairplay.points;
      }
      if (tournament.bonuses?.cleanSheet?.enabled && ga === 0) {
        stats.bonusPoints += tournament.bonuses.cleanSheet.points;
      }
    });

    stats.goalDiff = stats.goalsFor - stats.goalsAgainst;
    stats.points = stats.basePoints + stats.bonusPoints + stats.fairplayPoints;
    byPool[t.pool].push(stats);
  });

  Object.keys(byPool).forEach(pool => {
    byPool[pool].sort((a, b) => {
      for (const tb of (tournament.tiebreakers || ['points', 'goalDiff', 'goalsFor'])) {
        if (tb === 'points' && b.points !== a.points) return b.points - a.points;
        if (tb === 'goalDiff' && b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
        if (tb === 'goalsFor' && b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      }
      return 0;
    });
  });

  return byPool;
}

// Résolution d'une équipe à partir d'une référence (id direct, slot, winner/loser)
// pour afficher proprement les matchs de phase finale
export function getDisplayTeam(side, match, teams, matches, standings) {
  const ref = side === 'home' ? match.home : match.away;
  const fallbackLabel = side === 'home' ? match.homeLabel : match.awayLabel;

  const direct = teams.find(t => t.id === ref);
  if (direct) {
    // Suffixe d'équipe : ajouté uniquement si plusieurs équipes partagent le même nom
    // (ex : "CS CHEVROUX" 1 et 2). Sinon nom brut, pas de "(1)" inutile.
    const sameName = teams.filter(t => t.name === direct.name);
    if (sameName.length > 1) {
      let num = direct.level && direct.level > 0 ? direct.level : null;
      if (num === null) {
        const ordered = [...sameName].sort((a, b) => String(a.id).localeCompare(String(b.id)));
        num = ordered.findIndex(t => t.id === direct.id) + 1;
      }
      return {
        ...direct,
        name: direct.name + ' ' + num,
        short: (direct.short || direct.name) + num,
      };
    }
    return direct;
  }

  if (typeof ref === 'string' && ref.startsWith('slot:')) {
    const [poolName, rankStr] = ref.replace('slot:', '').split('#');
    const rank = parseInt(rankStr) - 1;
    if (standings && standings[poolName]) {
      const poolMatches = matches.filter(m => m.phase === 'pool' && m.pool === poolName);
      const allDone = poolMatches.length > 0 && poolMatches.every(m => m.status === 'validated');
      if (allDone && standings[poolName][rank]) {
        return standings[poolName][rank];
      }
    }
    return makePlaceholder(fallbackLabel || `${rank + 1}${rank === 0 ? 'er' : 'e'} P.${poolName}`);
  }

  if (typeof ref === 'string' && ref.startsWith('rank:')) {
    // Placeholder v2 : "rank:<groupKey>#<position>" → l'équipe classée <position>
    // dans la poule de classement <groupKey> (ex: rank:IG1#1 = 1er de IG1).
    // Résolu uniquement si tous les matchs de la poule de classement sont validés.
    const [groupKey, posStr] = ref.replace('rank:', '').split('#');
    const position = parseInt(posStr);
    const groupMatches = matches.filter(m =>
      m.phase === 'ranking' && (m.group === groupKey || m.knockoutRound === groupKey || m.knockout_round === groupKey)
    );
    // Si on a 0 match pour ce groupKey, fallback label sans casser le rendu
    if (groupMatches.length === 0) {
      return makePlaceholder(fallbackLabel || `Position ${position}`);
    }
    const allDone = groupMatches.every(m => m.status === 'validated');
    if (allDone) {
      // Mini-classement aux points (3/1/0) limité aux équipes de ce groupe
      const pts = {}, gf = {}, ga = {};
      const teamIds = new Set();
      groupMatches.forEach(m => {
        const h = m.homeTeamId || m.home_team_id;
        const a = m.awayTeamId || m.away_team_id;
        if (!h || !a) return;
        teamIds.add(h); teamIds.add(a);
        pts[h] = pts[h] || 0; pts[a] = pts[a] || 0;
        gf[h] = (gf[h] || 0) + (m.scoreHome || 0);
        gf[a] = (gf[a] || 0) + (m.scoreAway || 0);
        ga[h] = (ga[h] || 0) + (m.scoreAway || 0);
        ga[a] = (ga[a] || 0) + (m.scoreHome || 0);
        if (m.scoreHome > m.scoreAway) pts[h] += 3;
        else if (m.scoreHome < m.scoreAway) pts[a] += 3;
        else { pts[h] += 1; pts[a] += 1; }
      });
      const ranked = [...teamIds].sort((a, b) => {
        if ((pts[b] || 0) !== (pts[a] || 0)) return (pts[b] || 0) - (pts[a] || 0);
        return ((gf[b] || 0) - (ga[b] || 0)) - ((gf[a] || 0) - (ga[a] || 0));
      });
      const winnerId = ranked[position - 1];
      if (winnerId) {
        const team = teams.find(t => t.id === winnerId);
        if (team) return team;
      }
    }
    return makePlaceholder(fallbackLabel || `Position ${position} (${groupKey})`);
  }
  if (typeof ref === 'string' && (ref.startsWith('winner:') || ref.startsWith('loser:'))) {
    const isWinner = ref.startsWith('winner:');
    const matchId = ref.split(':')[1];
    const m = matches.find(x => x.id === matchId);
    if (m && m.status === 'validated' && m.scoreHome !== m.scoreAway) {
      const winSide = m.scoreHome > m.scoreAway ? 'home' : 'away';
      const targetSide = isWinner ? winSide : (winSide === 'home' ? 'away' : 'home');
      return getDisplayTeam(targetSide, m, teams, matches, standings);
    }
    return makePlaceholder(fallbackLabel || (isWinner ? 'Vainqueur' : 'Perdant'));
  }

  return makePlaceholder(fallbackLabel || '?');
}

function makePlaceholder(label) {
  // Génère un short lisible à partir du label
  // Ex: "1er P.A" → "1A", "2e P.B" → "2B", "Vainqueur 1" → "V1"
  const makeShort = (lbl) => {
    if (!lbl) return '?';
    // Pattern "1er P.X" ou "2e P.X" → "1X" / "2X"
    const m = lbl.match(/^(\d+)\D*\s*P\.?\s*([A-Z])/i);
    if (m) return m[1] + m[2].toUpperCase();
    // Vainqueur N / Perdant N → V/P + N
    const v = lbl.match(/^(Vainqueur|Perdant)\s*(\d*)/i);
    if (v) return (v[1][0].toUpperCase()) + (v[2] || '');
    // Fallback : 3 premiers caractères
    return lbl.slice(0, 3).toUpperCase();
  };
  return {
    id: '__placeholder__',
    name: label,
    short: makeShort(label),
    color: '#475569',
    isPlaceholder: true,
  };
}
