import React, { useState } from 'react';
import { Filter, X, Goal as Whistle } from 'lucide-react';
import { Crest } from './Crest';
import { PageHeader, MatchListCard } from './MatchCards';
import { MatchWaveGroup } from './MatchWaveGroup';
import { groupScheduledByTime } from '../utils/waves';
import { styles } from '../styles/styles';

// ============================================================
// MatchList — vue "tous les matchs" avec filtres + recherche par équipe
// + groupement par vague (heure) avec bouton coup d'envoi pour l'organisateur
// ============================================================
export function MatchList({
  matches, teams, standings, tournament, role,
  setSelectedMatch, setView,
  kickoffWave, askConfirm, closeConfirm,
}) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  const filters = [
    { id: 'all', label: 'TOUS' },
    { id: 'live', label: 'LIVE' },
    { id: 'scheduled', label: 'À VENIR' },
    { id: 'validated', label: 'TERMINÉS' },
  ];

  const searchLower = search.trim().toLowerCase();
  const suggestions = searchLower && !selectedTeamId
    ? teams.filter(t =>
        t.name.toLowerCase().includes(searchLower)
        || (t.short || '').toLowerCase().includes(searchLower)
      ).slice(0, 5)
    : [];

  let filtered = filter === 'all' ? matches : matches.filter(m => m.status === filter);
  if (selectedTeamId) {
    filtered = filtered.filter(m => m.home === selectedTeamId || m.away === selectedTeamId);
  }

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  const pickTeam = (t) => {
    setSelectedTeamId(t.id);
    setSearch(t.name);
  };
  const clearSearch = () => {
    setSelectedTeamId(null);
    setSearch('');
  };

  // Décide si on affiche en mode "vagues groupées" ou en liste plate
  // → Vagues groupées seulement quand on consulte les "À venir" sans filtre équipe
  const showAsWaves = (filter === 'all' || filter === 'scheduled') && !selectedTeamId;

  // Vagues issues des matchs filtrés (uniquement les scheduled)
  const waves = showAsWaves ? groupScheduledByTime(filtered) : [];

  // Liste plate des matchs non-scheduled (live + validated) pour le mode "all"
  // (en mode "scheduled" on ne montre que les vagues)
  const flatMatchesForAll = filter === 'all' && !selectedTeamId
    ? filtered.filter(m => m.status !== 'scheduled')
    : filtered;

  return (
    <div style={{ paddingBottom: 130 }}>
      <PageHeader
        title="Tous les matchs"
        subtitle={`${matches.length} matchs au programme`}
        icon={Whistle}
        accent="#22d3ee"
      />

      <div style={styles.searchWrap}>
        <div style={styles.searchBar}>
          <Filter size={14} color="#64748b" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedTeamId(null); }}
            placeholder="Rechercher une équipe…"
            style={styles.searchInput}
          />
          {search && (
            <button onClick={clearSearch} style={styles.searchClear}>
              <X size={14} />
            </button>
          )}
        </div>
        {suggestions.length > 0 && (
          <div style={styles.searchSuggest}>
            {suggestions.map(t => (
              <button key={t.id} onClick={() => pickTeam(t)} style={styles.searchSuggestRow}>
                <Crest team={t} size="sm" />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                    {t.short} · Poule {t.pool}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        {selectedTeam && (
          <div style={styles.selectedTeamPill}>
            <Crest team={selectedTeam} size="xs" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#22d3ee' }}>
              Filtré sur {selectedTeam.name}
            </span>
            <button onClick={clearSearch} style={styles.pillClear}>
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      <div style={styles.filterBar}>
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{ ...styles.filterChip, ...(filter === f.id ? styles.filterChipActive : {}) }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Affichage par vagues (À VENIR ou TOUS sans filtre équipe) */}
      {showAsWaves && waves.length > 0 && (
        <>
          {waves.map(wave => (
            <MatchWaveGroup
              key={wave.time}
              wave={wave}
              tournament={tournament}
              role={role}
              autoKickoffEnabled={tournament?.autoKickoff !== false}
              teams={teams}
              matches={matches}
              standings={standings}
              onKickoff={kickoffWave}
              askConfirm={askConfirm}
              closeConfirm={closeConfirm}
              setSelectedMatch={setSelectedMatch}
              setView={setView}
            />
          ))}
        </>
      )}

      {/* Affichage liste plate (LIVE, TERMINÉS, ou TOUS pour les non-scheduled, ou filtre équipe actif) */}
      {(!showAsWaves || filter === 'all') && (
        <div style={styles.cardStack}>
          {(showAsWaves ? flatMatchesForAll : filtered).length === 0 && waves.length === 0 && (
            <div style={styles.emptyState}>
              <Filter size={28} color="#475569" />
              <span>
                {selectedTeam
                  ? `Aucun match pour ${selectedTeam.name} dans cette catégorie`
                  : 'Aucun match dans cette catégorie'}
              </span>
            </div>
          )}
          {(showAsWaves ? flatMatchesForAll : filtered).map(m => (
            <MatchListCard
              key={m.id}
              match={m}
              teams={teams}
              matches={matches}
              standings={standings}
              onTap={() => { setSelectedMatch(m); setView('match'); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
