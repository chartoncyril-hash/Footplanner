import React from 'react';
import { useSponsors } from '../hooks/useTournamentSecondary';
import { styles } from '../styles/styles';

// ============================================================
// SponsorTicker — bandeau bas avec défilement infini CSS
// ============================================================
export function SponsorTicker({ tournamentId }) {
  const { list } = useSponsors(tournamentId);
  if (!list || list.length === 0) return null;

  // Triplement pour défilement continu fluide
  const items = [...list, ...list, ...list];
  const animDuration = Math.max(20, list.length * 6);

  return (
    <div style={styles.sponsorBar}>
      <div style={styles.sponsorLabel}>SPONSORS</div>
      <div style={styles.sponsorTrack}>
        <div style={{ ...styles.sponsorScroll, animation: `scrollLeft ${animDuration}s linear infinite` }}>
          {items.map((s, i) => (
            <div key={i} style={styles.sponsorItem}>
              {s.logo
                ? <img src={s.logo} alt={s.name} style={{ height: 80, maxWidth: 240, objectFit: 'contain', filter: 'brightness(1.2)' }} />
                : <span style={styles.sponsorName}>{s.name}</span>}
              <span style={styles.sponsorSep}>•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
