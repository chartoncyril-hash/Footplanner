import React from 'react';
import {
  Sparkles, Users, GitBranch, Calendar, Monitor, Trophy,
  Plus, LogOut, BookOpen, Archive, Settings,
} from 'lucide-react';
import { getCategories } from '../utils/categoryHelpers';

const SIDEBAR_WIDTH = 240;
const SECTION_LIST = [
  { id: 'dashboard', label: 'Tableau de bord', icon: Sparkles, color: '#22d3ee' },
  { id: 'teams',     label: 'Equipes',          icon: Users,    color: '#a78bfa' },
  { id: 'format',    label: 'Format',           icon: GitBranch, color: '#f59e0b' },
  { id: 'schedule',  label: 'Calendrier',       icon: Calendar, color: '#34d399' },
  { id: 'presentation', label: 'Presentation',  icon: Monitor,  color: '#fb7185' },
  { id: 'standings', label: 'Resultats',        icon: Trophy,   color: '#facc15' },
  { id: 'library',   label: 'Bibliotheque',     icon: BookOpen, color: '#f472b6' },
  { id: 'archives',  label: 'Archives',         icon: Archive,  color: '#94a3b8' },
];

export function DesktopSidebar(props) {
  const tournament = props.tournament;
  const view = props.view;
  const setView = props.setView;
  const activeCategory = props.activeCategory;
  const setActiveCategory = props.setActiveCategory;
  const myTournaments = props.myTournaments;
  const onPickTournament = props.onPickTournament;
  const onCreateTournament = props.onCreateTournament;
  const onOpenCategoryManager = props.onOpenCategoryManager;
  const onOpenParams = props.onOpenParams;
  const signOut = props.signOut;

  const categories = getCategories(tournament);
  const showCategoryTabs = categories.length > 0;

  return (
    <aside style={{
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      width: SIDEBAR_WIDTH,
      background: 'rgba(10, 14, 26, 0.95)',
      borderRight: '1px solid rgba(34,211,238,0.12)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      overflowY: 'auto',
    }}>
      <div style={{
        padding: '20px 18px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderBottom: '1px solid rgba(34,211,238,0.08)',
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: 'linear-gradient(135deg, #22d3ee, #67e8f9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(34,211,238,0.4)',
        }}>
          <Sparkles size={18} color="#0a0e1a" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#22d3ee', letterSpacing: 2 }}>
            FOOTPLANNER
          </div>
          <div style={{ fontSize: 9, color: '#64748b', letterSpacing: 1 }}>
            ORGANISATEUR
          </div>
        </div>
      </div>

      {tournament && (
        <div style={{ padding: '12px 18px 0' }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: '#64748b', marginBottom: 6 }}>
            TOURNOI
          </div>
          <div style={{
            fontSize: 13,
            fontWeight: 800,
            color: '#f1f5f9',
            padding: '8px 10px',
            background: 'rgba(34,211,238,0.06)',
            border: '1px solid rgba(34,211,238,0.18)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tournament.name}
            </span>
            {onOpenParams && (
              <button
                onClick={onOpenParams}
                title="Modifier les paramètres"
                style={{
                  padding: 4,
                  background: 'transparent',
                  border: 'none',
                  color: '#22d3ee',
                  cursor: 'pointer',
                  display: 'flex',
                  flexShrink: 0,
                }}
              >
                <Settings size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {showCategoryTabs && (
              <div style={{ padding: '12px 18px 0' }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: '#64748b', marginBottom: 6 }}>
                  CATEGORIE
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {categories.map(function(cat) {
                    const isActive = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={function() { setActiveCategory(cat); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '7px 10px',
                          background: isActive ? 'rgba(167,139,250,0.18)' : 'transparent',
                          border: isActive ? '1px solid rgba(167,139,250,0.5)' : '1px solid transparent',
                          borderRadius: 7,
                          color: isActive ? '#a78bfa' : '#94a3b8',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
      
      {onOpenCategoryManager && tournament && (
        <div style={{ padding: '8px 18px 0' }}>
          <button
            onClick={onOpenCategoryManager}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: 'rgba(167,139,250,0.08)',
              border: '1px dashed rgba(167,139,250,0.3)',
              borderRadius: 7,
              color: '#a78bfa',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            }}
          >
            + GÉRER LES CATÉGORIES
          </button>
        </div>
      
      )}
            <nav style={{ padding: '16px 12px', flex: 1 }}>
              <div style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: 1.5,
                color: '#64748b',
                padding: '0 6px 6px',
              }}>
                GESTION
              </div>
              {SECTION_LIST.map(function(section) {
                const Icon = section.icon;
                const isActive = view === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={function() { setView(section.id); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '10px 12px',
                      marginBottom: 2,
                      background: isActive ? (section.color + '15') : 'transparent',
                      border: isActive ? ('1px solid ' + section.color + '40') : '1px solid transparent',
                      borderRadius: 8,
                      color: isActive ? section.color : '#94a3b8',
                      fontSize: 13,
                      fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <Icon size={16} color={isActive ? section.color : '#94a3b8'} />
                    {section.label}
                  </button>
                );
              })}
            </nav>

            {myTournaments && myTournaments.length > 1 && (
              <div style={{ padding: '12px 12px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: 1.5,
                  color: '#64748b',
                  padding: '8px 6px 4px',
                }}>
                  MES TOURNOIS
                </div>
                {myTournaments.slice(0, 4).map(function(t) {
                  const isActive = tournament && tournament.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={function() { if (onPickTournament) onPickTournament(t.id); }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '6px 10px',
                        marginBottom: 2,
                        background: isActive ? 'rgba(34,211,238,0.08)' : 'transparent',
                        border: 'none',
                        color: isActive ? '#22d3ee' : '#64748b',
                        fontSize: 11,
                        cursor: 'pointer',
                        textAlign: 'left',
                        borderRadius: 6,
                      }}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{
              padding: '12px 18px',
              borderTop: '1px solid rgba(255,255,255,0.04)',
              display: 'flex',
              gap: 8,
            }}>
              {onCreateTournament && (
                <button
                  onClick={onCreateTournament}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px',
                    background: 'rgba(34,211,238,0.12)',
                    border: '1px solid rgba(34,211,238,0.3)',
                    borderRadius: 7,
                    color: '#22d3ee',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={12} /> NOUVEAU
                </button>
              )}
              {signOut && (
                <button
                  onClick={signOut}
                  style={{
                    padding: '8px 10px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 7,
                    color: '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  <LogOut size={12} />
                </button>
              )}
            </div>
          </aside>
        );
      }