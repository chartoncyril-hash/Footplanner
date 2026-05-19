import React from 'react';
import { Crown } from 'lucide-react';

// ============================================================
// Crest — écusson d'équipe (logo si dispo, sinon initiales)
// Affiche un badge couronne pour les équipes hôtes
// ============================================================
const SIZES = {
  xs: { w: 22, fs: 8, br: 5, badge: 10 },
  sm: { w: 26, fs: 9, br: 6, badge: 12 },
  md: { w: 36, fs: 11, br: 8, badge: 14 },
  lg: { w: 44, fs: 13, br: 10, badge: 16 },
  xl: { w: 56, fs: 18, br: 12, badge: 18 },
};

export function Crest({ team, size = 'md', showHostBadge = true }) {
  if (!team) return null;
  const s = SIZES[size] || SIZES.md;
  const baseStyle = {
    width: s.w,
    height: s.w,
    borderRadius: s.br,
    background: (team.color || '#475569') + '22',
    border: `1.5px solid ${(team.color || '#475569')}66`,
    color: team.color || '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: s.fs,
    fontWeight: 800,
    letterSpacing: 0.3,
    fontFamily: "'JetBrains Mono', monospace",
    flexShrink: 0,
    overflow: 'hidden',
  };

  const inner = team.logo
    ? <img src={team.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    : (team.short || '?').slice(0, 2);

  if (team.isHost && showHostBadge) {
    return (
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={baseStyle}>{inner}</div>
        <div style={{
          position: 'absolute',
          top: -3,
          right: -3,
          width: s.badge,
          height: s.badge,
          borderRadius: '50%',
          background: '#facc15',
          border: '1.5px solid #0a0f1c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Crown size={s.badge - 6} color="#0a0a0a" fill="#0a0a0a" strokeWidth={2.5} />
        </div>
      </div>
    );
  }

  return <div style={baseStyle}>{inner}</div>;
}
