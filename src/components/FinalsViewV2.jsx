import React from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { getDisplayTeam } from '../utils/standings';

export function FinalsViewV2({ knockoutMatches, teams, matches, standings }) {
  if (!knockoutMatches || knockoutMatches.length === 0) {
    return (
      <div style={{ padding: 20, color: '#94a3b8', textAlign: 'center', fontSize: 13 }}>
        Aucun match de phase finale pour l'instant.
      </div>
    );
  }
  const champions = knockoutMatches.filter(m => m.cup === 'champions');
  const europa = knockoutMatches.filter(m => m.cup === 'europa');
  const consolante = knockoutMatches.filter(m => m.cup === 'consolante');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {champions.length > 0 && <LeagueSection title="Champions League" icon={<Trophy size={16} color="#facc15" />} accent="#facc15" matches={champions} teams={teams} allMatches={matches} standings={standings} />}
      {europa.length > 0 && <LeagueSection title="Europa League" icon={<Medal size={16} color="#94a3b8" />} accent="#94a3b8" matches={europa} teams={teams} allMatches={matches} standings={standings} />}
      {consolante.length > 0 && <LeagueSection title="Consolante" icon={<Award size={16} color="#b45309" />} accent="#b45309" matches={consolante} teams={teams} allMatches={matches} standings={standings} />}
    </div>
  );
}

function LeagueSection({ title, icon, accent, matches, teams, allMatches, standings }) {
  // Les matchs de phase finale ont phase='knockout' et sont distingues par knockout_round
  // (ex: "Demi-finales", "Finale", "Match pour la 3e place"). On gere aussi l'ancien schema
  // (phase 'ranking'/'final'/'3rd') par compatibilite.
  const isFinalRound = (m) => m.phase === 'final' || /finale/i.test(m.knockout_round || '') && !/demi|quart|8|16|3e|3 ?place/i.test(m.knockout_round || '');
  const isThird = (m) => m.phase === '3rd' || /3e place|3 ?place|petite finale/i.test(m.knockout_round || '');
  const final = matches.filter(m => isFinalRound(m) && !isThird(m));
  const thirdPlace = matches.filter(m => isThird(m));
  const others = matches.filter(m => !isFinalRound(m) && !isThird(m));
  const groups = {};
  others.forEach(m => {
    const key = m.knockout_round || m.knockoutRound || 'Phase finale';
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });
  // Traduit une clé technique "IG1"/"IG2" en libellé lisible
  const groupLabel = (key) => {
    const match = key.match(/^[IJ]G(\d+)$/);
    return match ? `Poule de classement ${match[1]}` : key;
  };
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid ' + accent + '33', borderRadius: 12, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {icon}
        <span style={{ fontSize: 13, fontWeight: 800, color: accent, letterSpacing: 0.4 }}>{title}</span>
      </div>
      {Object.keys(groups).sort().map(key => (
        <GroupCard key={key} title={groupLabel(key)} matches={groups[key]} teams={teams} allMatches={allMatches} standings={standings} accent={accent} />
      ))}
      {final.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: accent, marginBottom: 6, opacity: 0.85 }}>
            Finale {title}
          </div>
          {final.map(m => <MatchRow key={m.id} match={m} teams={teams} allMatches={allMatches} standings={standings} accent={accent} isFinal />)}
        </div>
      )}
      {thirdPlace.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6, opacity: 0.85 }}>
            Match pour la 3e place
          </div>
          {thirdPlace.map(m => <MatchRow key={m.id} match={m} teams={teams} allMatches={allMatches} standings={standings} accent="#64748b" />)}
        </div>
      )}
    </div>
  );
}

function GroupCard({ title, matches, teams, allMatches, standings, accent }) {
  return (
    <div style={{ marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: accent, marginBottom: 6, opacity: 0.85 }}>{title}</div>
      {matches.map(m => <MatchRow key={m.id} match={m} teams={teams} allMatches={allMatches} standings={standings} accent={accent} />)}
    </div>
  );
}

function MatchRow({ match, teams, allMatches, standings, accent, isFinal }) {
  const home = getDisplayTeam('home', match, teams, allMatches, standings);
  const away = getDisplayTeam('away', match, teams, allMatches, standings);
  const homeName = home ? (home.name || home.short || match.home_label || '—') : (match.home_label || '—');
  const awayName = away ? (away.name || away.short || match.away_label || '—') : (match.away_label || '—');
  const time = match.match_time ? match.match_time.slice(0, 5) : '';
  const field = match.field || '';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', marginBottom: 4, background: isFinal ? accent + '0a' : 'transparent', borderRadius: 6, fontSize: 12 }}>
      <div style={{ flex: 1, color: '#f1f5f9', fontWeight: isFinal ? 700 : 500 }}>{homeName}</div>
      <div style={{ color: '#64748b', fontSize: 10 }}>vs</div>
      <div style={{ flex: 1, color: '#f1f5f9', fontWeight: isFinal ? 700 : 500, textAlign: 'right' }}>{awayName}</div>
      <div style={{ minWidth: 70, textAlign: 'right', fontSize: 10, color: '#64748b' }}>
        {time && <span>{time}</span>}
        {field && <span> · {field}</span>}
      </div>
    </div>
  );
}
