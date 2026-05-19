import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Crest } from './Crest';
import { useSponsors } from '../hooks/useTournamentSecondary';
import { getDisplayTeam } from '../utils/standings';

export function PresentationView({ tournament, teams, matches, standings, activeCategory }) {
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { list: sponsors } = useSponsors(tournament?.id);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const filteredMatches = activeCategory
    ? (matches || []).filter(m => !m.category || m.category === activeCategory)
    : (matches || []);

  const liveMatches = filteredMatches.filter(m => m.status === 'live');
  const hostTeam = (teams || []).find(t => t.isHost);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        minHeight: isFullscreen ? '100vh' : 'calc(100vh - 50px)',
        background: 'linear-gradient(180deg, #0a0e1a 0%, #0f172a 100%)',
        color: '#f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => {
          const url = `${window.location.origin}${window.location.pathname}?presentation=1&t=${tournament?.id || ''}&cat=${activeCategory || ''}`;
          window.open(url, '_blank', 'width=1920,height=1080,toolbar=no,menubar=no');
        }}
        style={{
          position: 'absolute',
          top: 12,
          right: 150,
          padding: '8px 12px',
          background: 'rgba(167,139,250,0.12)',
          border: '1px solid rgba(167,139,250,0.4)',
          borderRadius: 8,
          color: '#a78bfa',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
          zIndex: 100,
        }}
      >
        ⤴ OUVRIR EN RÉGIE
      </button>
      
      <button
        onClick={toggleFullscreen}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          padding: '8px 12px',
          background: 'rgba(34,211,238,0.12)',
          border: '1px solid rgba(34,211,238,0.4)',
          borderRadius: 8,
          color: '#22d3ee',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        {isFullscreen ? 'QUITTER' : 'PLEIN ECRAN'}
      </button>

      <div style={{
        padding: '20px 32px',
        background: 'rgba(15,23,42,0.6)',
        borderBottom: '2px solid rgba(34,211,238,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
      }}>
        {hostTeam && hostTeam.logo && (
          <img src={hostTeam.logo} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }} />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 1, color: '#22d3ee' }}>
            {tournament?.name || 'Tournoi'}
          </div>
          {hostTeam && (
            <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 2 }}>
              Organise par {hostTeam.name}
            </div>
          )}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#94a3b8' }}>
          {liveMatches.length > 0 ? `${liveMatches.length} match${liveMatches.length > 1 ? 's' : ''} en cours` : 'Aucun match en cours'}
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'stretch',
        padding: 24,
        overflow: 'hidden',
      }}>
        {liveMatches.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            color: '#475569',
          }}>
            Mode diaporama (a venir)
          </div>
        ) : (
          <MatchGrid
            matches={liveMatches}
            teams={teams || []}
            allMatches={filteredMatches}
            standings={standings || {}}
          />
        )}
      </div>

      <div style={{
        padding: '12px 0',
        background: 'rgba(15,23,42,0.8)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ fontSize: 11, color: '#64748b', letterSpacing: 1 }}>
          {sponsors && sponsors.length > 0
            ? `${sponsors.length} sponsor(s) - defilement a venir`
            : 'Aucun sponsor'}
        </div>
      </div>
    </div>
  );
}
// ============================================================
// Sous-composants
// ============================================================

function MatchGrid({ matches, teams, allMatches, standings }) {
  const count = matches.length;

  const getLayout = () => {
    if (count === 1) return { cols: 1, size: 'xl' };
    if (count === 2) return { cols: 2, size: 'lg' };
    if (count === 3) return { cols: 2, size: 'md' };
    if (count === 4) return { cols: 2, size: 'md' };
    if (count <= 6) return { cols: 3, size: 'sm' };
    return { cols: 3, size: 'sm' };
  };

  const layout = getLayout();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
      gap: 16,
      width: '100%',
      height: '100%',
    }}>
      {matches.map(m => (
        <MatchTile
          key={m.id}
          match={m}
          teams={teams}
          allMatches={allMatches}
          standings={standings}
          size={layout.size}
        />
      ))}
    </div>
  );
}

function MatchTile({ match, teams, allMatches, standings, size }) {
  const home = getDisplayTeam('home', match, teams, allMatches, standings);
  const away = getDisplayTeam('away', match, teams, allMatches, standings);

  const sizes = {
    xl: { logo: 'xl', name: 60, score: 120, gap: 40, padding: 48 },
    lg: { logo: 'xl', name: 38, score: 90, gap: 28, padding: 32 },
    md: { logo: 'lg', name: 24, score: 64, gap: 20, padding: 20 },
    sm: { logo: 'md', name: 16, score: 40, gap: 12, padding: 14 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div style={{
      background: 'rgba(15,23,42,0.7)',
      border: '2px solid rgba(34,211,238,0.3)',
      borderRadius: 16,
      padding: s.padding,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: s.gap,
      }}>
        <div style={{
          padding: '4px 10px',
          background: '#ef4444',
          color: 'white',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 1,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{
            width: 6, height: 6,
            background: 'white',
            borderRadius: '50%',
          }} />
          LIVE
        </div>
        <div style={{
          fontSize: 14,
          fontWeight: 800,
          color: '#facc15',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {match.field || '?'}
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: s.gap / 2,
        flex: 1,
      }}>
        <Crest team={home} size={s.logo} />
        <span style={{
          fontSize: s.name,
          fontWeight: 900,
          color: '#f1f5f9',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {home.short || home.name}
        </span>
        <span style={{
          fontSize: s.score,
          fontWeight: 900,
          color: '#22d3ee',
          fontFamily: "'JetBrains Mono', monospace",
          minWidth: s.score * 0.7,
          textAlign: 'right',
        }}>
          {match.scoreHome ?? 0}
        </span>
      </div>

      <div style={{
        height: 1,
        background: 'rgba(255,255,255,0.1)',
        margin: `${s.gap / 2}px 0`,
      }} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: s.gap / 2,
        flex: 1,
      }}>
        <Crest team={away} size={s.logo} />
        <span style={{
          fontSize: s.name,
          fontWeight: 900,
          color: '#f1f5f9',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {away.short || away.name}
        </span>
        <span style={{
          fontSize: s.score,
          fontWeight: 900,
          color: '#22d3ee',
          fontFamily: "'JetBrains Mono', monospace",
          minWidth: s.score * 0.7,
          textAlign: 'right',
        }}>
          {match.scoreAway ?? 0}
        </span>
      </div>
    </div>
  );
}