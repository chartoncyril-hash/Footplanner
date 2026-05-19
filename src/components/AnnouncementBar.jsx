import React, { useState, useEffect } from 'react';
import { useAnnouncements } from '../hooks/useTournamentSecondary';
import { styles } from '../styles/styles';

// ============================================================
// AnnouncementBar — bandeau défilant en haut
// ============================================================
const COLOR_MAP = {
  info: '#22d3ee',
  success: '#34d399',
  warning: '#f59e0b',
  urgent: '#fb7185',
};

export function AnnouncementBar({ tournamentId }) {
  const { list } = useAnnouncements(tournamentId);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (list.length <= 1) return;
    const id = setInterval(() => setIdx(i => (i + 1) % list.length), 6000);
    return () => clearInterval(id);
  }, [list.length]);

  if (list.length === 0) return null;

  const a = list[idx % list.length];
  const color = COLOR_MAP[a.type] || COLOR_MAP.info;

  return (
    <div style={{ ...styles.annBar, borderColor: color + '44', background: color + '0e' }}>
      <div style={{ ...styles.annDot, background: color }} />
      <div style={styles.annText}>
        <span style={{ color }}>{a.message}</span>
      </div>
      {list.length > 1 && (
        <span style={{ ...styles.annCount, color: color + 'aa' }}>
          {(idx % list.length) + 1}/{list.length}
        </span>
      )}
    </div>
  );
}
