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
          color: '#818cf8',
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
          color: '#a3e635',
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
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 1, color: '#a3e635' }}>
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
          <Slideshow
            matches={filteredMatches}
            teams={teams || []}
            standings={standings || {}}
          />
        ) : (
          <MatchGrid
            matches={liveMatches}
            teams={teams || []}
            allMatches={filteredMatches}
            standings={standings || {}}
          />
        )}
      </div>

      {sponsors && sponsors.length > 0 && (
        <div style={{
          height: 60,
          background: 'rgba(15,23,42,0.8)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <style>{`
            @keyframes sponsorScroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            animation: `sponsorScroll ${Math.max(sponsors.length * 4, 12)}s linear infinite`,
            width: 'max-content',
          }}>
            {[...sponsors, ...sponsors].map((s, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '0 32px',
                flexShrink: 0,
              }}>
                {s.logo || s.logoUrl ? (
                  <img src={s.logo || s.logoUrl} alt="" style={{ height: 64, maxWidth: 140, objectFit: 'contain', filter: 'brightness(1.1)' }} />
                ) : (
                  <div style={{
                    height: 36,
                    padding: '0 16px',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f1f5f9',
                    fontSize: 18,
                    fontWeight: 800,
                  }}>
                    {s.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
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
        fontSize: 18,
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
          color: '#a3e635',
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
          color: '#a3e635',
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
// ============================================================
// Slideshow — diaporama quand aucun match live
// ============================================================

function Slideshow({ matches, teams, standings }) {
  const [slideIndex, setSlideIndex] = useState(0);

  // Prochains matchs (scheduled, triés par heure)
  const nextMatches = matches
    .filter(m => m.status === 'scheduled')
    .sort((a, b) => (a.matchTime || '').localeCompare(b.matchTime || ''))
    .slice(0, 6);

  // Résultats récents (validated, triés par heure desc)
  const recentResults = matches
    .filter(m => m.status === 'validated')
    .sort((a, b) => (b.matchTime || '').localeCompare(a.matchTime || ''))
    .slice(0, 6);

  // Poules avec classement
  const pools = Object.keys(standings || {}).sort();

  // Construction des slides
  const slides = [];
  if (nextMatches.length > 0) slides.push({ type: 'next', data: nextMatches });
  if (pools.length > 0) {
    pools.forEach(p => slides.push({ type: 'standings', data: { pool: p, rows: standings[p] } }));
  }
  if (recentResults.length > 0) slides.push({ type: 'results', data: recentResults });
  slides.push({ type: 'promo' });

  // Rotation automatique
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setSlideIndex(prev => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const currentSlide = slides[slideIndex % slides.length] || slides[0];
  if (!currentSlide) return null;

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      position: 'relative',
    }}>
      {/* Indicateur de slide */}
      <div style={{
        position: 'absolute',
        bottom: 12,
        display: 'flex',
        gap: 8,
      }}>
        {slides.map((_, i) => (
          <div key={i} style={{
            width: 8, height: 8,
            borderRadius: '50%',
            background: i === (slideIndex % slides.length) ? '#a3e635' : 'rgba(255,255,255,0.15)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      {currentSlide.type === 'next' && (
        <SlideNextMatches matches={currentSlide.data} teams={teams} allMatches={matches} standings={standings} />
      )}
      {currentSlide.type === 'standings' && (
        <SlideStandings pool={currentSlide.data.pool} rows={currentSlide.data.rows} />
      )}
      {currentSlide.type === 'results' && (
        <SlideResults matches={currentSlide.data} teams={teams} allMatches={matches} standings={standings} />
      )}
      {currentSlide.type === 'promo' && (
        <SlidePromo />
      )}
    </div>
  );
}

// ============================================================
// Slide — Prochains matchs
// ============================================================

function SlideNextMatches({ matches, teams, allMatches, standings }) {
  return (
    <div style={{ width: '100%', maxWidth: 1000 }}>
      <div style={{
        fontSize: 42,
        fontWeight: 900,
        color: '#a3e635',
        marginBottom: 24,
        textAlign: 'center',
        letterSpacing: 1,
      }}>
        PROCHAINS MATCHS
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {matches.map(m => {
          const home = getDisplayTeam('home', m, teams, allMatches, standings);
          const away = getDisplayTeam('away', m, teams, allMatches, standings);
          return (
            <div key={m.id} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 24px',
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10,
              gap: 16,
            }}>
              <div style={{
                fontSize: 18,
                fontWeight: 800,
                color: '#facc15',
                fontFamily: "'JetBrains Mono', monospace",
                minWidth: 40,
              }}>
                {m.field || '?'}
              </div>
              <div style={{
                fontSize: 18,
                fontWeight: 800,
                color: '#facc15',
                fontFamily: "'JetBrains Mono', monospace",
                minWidth: 50,
              }}>
                {(m.matchTime || '').slice(0, 5)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <Crest team={home} size="sm" />
                <span style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>
                  {home.short || home.name}
                </span>
              </div>
              <span style={{ fontSize: 14, color: '#64748b', fontWeight: 700 }}>vs</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>
                  {away.short || away.name}
                </span>
                <Crest team={away} size="sm" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Slide — Classement d'une poule
// ============================================================

function SlideStandings({ pool, rows }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div style={{ width: '100%', maxWidth: 1000 }}>
      <div style={{
        fontSize: 42,
        fontWeight: 900,
        color: '#a3e635',
        marginBottom: 32,
        textAlign: 'center',
        letterSpacing: 2,
      }}>
        CLASSEMENT — POULE {pool}
      </div>
      <div style={{
        display: 'flex',
        padding: '12px 24px',
        color: '#64748b',
        fontSize: 16,
        fontWeight: 700,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ width: 40 }}>#</span>
        <span style={{ flex: 1 }}>Equipe</span>
        <span style={{ width: 55, textAlign: 'center' }}>J</span>
        <span style={{ width: 55, textAlign: 'center' }}>V</span>
        <span style={{ width: 55, textAlign: 'center' }}>N</span>
        <span style={{ width: 55, textAlign: 'center' }}>D</span>
        <span style={{ width: 65, textAlign: 'center' }}>Diff</span>
        <span style={{ width: 65, textAlign: 'center', color: '#facc15' }}>Pts</span>
      </div>
      {rows.map((r, i) => (
        <div key={r.teamId || i} style={{
          display: 'flex',
          alignItems: 'center',
          padding: '14px 24px',
          background: i % 2 === 0 ? 'rgba(15,23,42,0.4)' : 'transparent',
          borderRadius: 6,
        }}>
          <span style={{ width: 40, fontWeight: 900, color: i < 2 ? '#a3e635' : '#64748b', fontSize: 22 }}>
            {i + 1}
          </span>
          <span style={{ flex: 1, fontWeight: 800, color: '#f1f5f9', fontSize: 22 }}>
            {r.shortName || r.name || '?'}
          </span>
          <span style={{ width: 55, textAlign: 'center', color: '#94a3b8', fontSize: 20 }}>{r.played || 0}</span>
          <span style={{ width: 55, textAlign: 'center', color: '#94a3b8', fontSize: 20 }}>{r.won || 0}</span>
          <span style={{ width: 55, textAlign: 'center', color: '#94a3b8', fontSize: 20 }}>{r.drawn || 0}</span>
          <span style={{ width: 55, textAlign: 'center', color: '#94a3b8', fontSize: 20 }}>{r.lost || 0}</span>
          <span style={{ width: 65, textAlign: 'center', color: (r.gf || 0) - (r.ga || 0) >= 0 ? '#22c55e' : '#ef4444', fontSize: 20, fontWeight: 700 }}>
            {(r.gf || 0) - (r.ga || 0) >= 0 ? '+' : ''}{(r.gf || 0) - (r.ga || 0)}
          </span>
          <span style={{ width: 65, textAlign: 'center', color: '#facc15', fontSize: 22, fontWeight: 900 }}>
            {r.pts || 0}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Slide — Résultats récents
// ============================================================

function SlideResults({ matches, teams, allMatches, standings }) {
  return (
    <div style={{ width: '100%', maxWidth: 1000 }}>
      <div style={{
        fontSize: 42,
        fontWeight: 900,
        color: '#a3e635',
        marginBottom: 24,
        textAlign: 'center',
        letterSpacing: 1,
      }}>
        DERNIERS RESULTATS
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {matches.map(m => {
          const home = getDisplayTeam('home', m, teams, allMatches, standings);
          const away = getDisplayTeam('away', m, teams, allMatches, standings);
          return (
            <div key={m.id} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 24px',
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10,
              gap: 12,
            }}>
              <div style={{
                fontSize: 18,
                fontWeight: 800,
                color: '#facc15',
                fontFamily: "'JetBrains Mono', monospace",
                minWidth: 40,
              }}>
                {m.field || '?'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <Crest team={home} size="sm" />
                <span style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>
                  {home.short || home.name}
                </span>
              </div>
              <div style={{
                fontSize: 24,
                fontWeight: 900,
                color: '#a3e635',
                fontFamily: "'JetBrains Mono', monospace",
                padding: '0 12px',
              }}>
                {m.scoreHome ?? 0} - {m.scoreAway ?? 0}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>
                  {away.short || away.name}
                </span>
                <Crest team={away} size="sm" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Slide — Promo FootPlanner
// ============================================================

function SlidePromo() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 64, marginBottom: 8 }}>⚽</div>
      <div style={{
        fontSize: 48,
        fontWeight: 900,
        letterSpacing: 2,
      }}>
        <span style={{ color: '#ffffff' }}>FOOT</span>
        <span style={{ color: '#a3e635' }}>PLANNER</span>
      </div>
      <div style={{
        fontSize: 20,
        color: '#94a3b8',
        fontWeight: 600,
        maxWidth: 500,
        lineHeight: 1.6,
      }}>
        Organisez vos tournois comme des pros.
        Gestion des equipes, calendrier automatique,
        scores en direct et classements en temps reel.
      </div>
      <div style={{
        marginTop: 16,
        padding: '12px 32px',
        background: 'rgba(34,211,238,0.12)',
        border: '1px solid rgba(34,211,238,0.4)',
        borderRadius: 10,
        color: '#a3e635',
        fontSize: 16,
        fontWeight: 800,
        letterSpacing: 1,
      }}>
        footplanner.app
      </div>
    </div>
  );
}