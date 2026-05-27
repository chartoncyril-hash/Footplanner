import React, { useState } from 'react';
import { Star, Sparkles, Filter, X, Lock, Users, Shield } from 'lucide-react';
import { Crest } from './Crest';
import { PageHeader, SectionHeader } from './MatchCards';
import { useFollowedTeams } from '../hooks/useTournamentSecondary';
import { styles } from '../styles/styles';

// ============================================================
// FollowView — gérer les équipes suivies
// ============================================================
export function FollowView({ tournament, teams, role }) {
  const [search, setSearch] = useState('');
  const canFollow = role === 'spectator' || role === 'coach';
  const { followedIds, toggle } = useFollowedTeams(tournament?.id);

  if (!canFollow) {
    return (
      <div style={{ paddingBottom: 130 }}>
        <PageHeader title="Mes équipes" icon={Star} accent="#facc15" />
        <div style={{ ...styles.lockedBox || {}, padding: 24, textAlign: 'center' }}>
          <Lock size={28} color="#64748b" />
          <div style={{ fontSize: 14, fontWeight: 700, color: '#cbd5e1', marginTop: 8 }}>
            Non disponible pour ce rôle
          </div>
        </div>
      </div>
    );
  }

  const filtered = search.trim()
    ? teams.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase())
        || (t.short || '').toLowerCase().includes(search.toLowerCase()))
    : teams;

  const grouped = filtered.reduce((acc, t) => {
    if (!acc[t.pool]) acc[t.pool] = [];
    acc[t.pool].push(t);
    return acc;
  }, {});
  const pools = Object.keys(grouped).sort();

  return (
    <div style={{ paddingBottom: 130 }}>
      <PageHeader
        title="Mes équipes"
        subtitle={
          followedIds.length > 0
            ? `${followedIds.length} équipe${followedIds.length > 1 ? 's' : ''} suivie${followedIds.length > 1 ? 's' : ''}`
            : 'Choisis les équipes à suivre'
        }
        icon={Star}
        accent="#facc15"
      />

      <div style={styles.helpBox}>
        <Sparkles size={12} color="#facc15" />
        <span>
          Tu recevras des notifications avant chaque match, au coup d'envoi, et à chaque but de tes équipes.
        </span>
      </div>

      <div style={{ ...styles.searchBar, marginTop: 12 }}>
        <Filter size={14} color="#64748b" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une équipe…"
          style={styles.searchInput}
        />
        {search && (
          <button onClick={() => setSearch('')} style={styles.searchClear}>
            <X size={14} />
          </button>
        )}
      </div>

      {pools.map(p => (
        <section key={p} style={styles.section}>
          <SectionHeader icon={Shield} title={`Poule ${p}`} accent="#818cf8" badge={grouped[p].length} />
          <div style={styles.cardStack}>
            {grouped[p].map(t => {
              const followed = followedIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggle(t.id)}
                  style={{
                    ...styles.teamCard,
                    borderColor: followed ? 'rgba(250,204,21,0.5)' : 'rgba(255,255,255,0.06)',
                    background: followed ? 'rgba(250,204,21,0.08)' : 'rgba(15,23,42,0.5)',
                    cursor: 'pointer',
                  }}
                >
                  <Crest team={t} size="lg" />
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div style={styles.teamCardName}>{t.name}</div>
                    <div style={styles.teamCardShort}>{t.short} · Poule {t.pool}</div>
                  </div>
                  <div
                    style={{
                      ...styles.followStar,
                      background: followed ? '#facc15' : 'transparent',
                      borderColor: followed ? '#facc15' : '#475569',
                    }}
                  >
                    <Star size={16} color={followed ? '#0a0a0a' : '#475569'} fill={followed ? '#0a0a0a' : 'none'} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {teams.length === 0 && (
        <div style={styles.emptyState}>
          <Users size={28} color="#475569" />
          <span>Aucune équipe pour ce tournoi.</span>
        </div>
      )}
    </div>
  );
}
