import React from 'react';
import {
  Sparkles, Users, GitBranch, Calendar, Monitor, Trophy,
  Plus, LogOut, BookOpen, Archive, Settings, Trash2, LayoutDashboard, ClipboardList,
} from 'lucide-react';
import { getCategories } from '../utils/categoryHelpers';

const SIDEBAR_WIDTH = 240;
const SECTION_LIST = [
  { id: 'dashboard', label: 'Tableau de bord', icon: Sparkles, color: '#a3e635' },
  { id: 'teams',     label: 'Equipes',          icon: Users,    color: '#818cf8' },
  { id: 'format',    label: 'Format',           icon: GitBranch, color: '#f59e0b' },
  { id: 'schedule',  label: 'Calendrier',       icon: Calendar, color: '#34d399' },
  { id: 'presentation', label: 'Presentation',  icon: Monitor,  color: '#fb7185' },
  { id: 'standings', label: 'Resultats',        icon: Trophy,   color: '#facc15' },
  { id: 'library',      label: 'Bibliotheque',  icon: BookOpen, color: '#f472b6' },
  { id: 'registrations', label: 'Inscriptions', icon: Users,    color: '#818cf8' },
  { id: 'checkin',      label: 'Table de marque', icon: ClipboardList, color: '#34d399' },
  { id: 'archives',     label: 'Archives',      icon: Archive,  color: '#94a3b8' },
  { id: 'account',      label: 'Mon compte',    icon: Settings, color: '#64748b' },
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
  const onGoToHub = props.onGoToHub;
  const profile = props.profile;
  const pendingRegistrations = props.pendingRegistrations || 0;

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
      <div
        onClick={() => onGoToHub && onGoToHub()}
        style={{
          padding: '20px 18px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderBottom: '1px solid rgba(34,211,238,0.08)',
          cursor: onGoToHub ? 'pointer' : 'default',
        }}
        title="Retour au hub"
      >
        <img src="https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/logo%20app/8891B8C3-D2AB-4CE4-AA8B-5A740A9FD062.png" alt="FootPlanner" style={{ width:40, height:40, objectFit:'contain', flexShrink:0 }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#a3e635', letterSpacing: 2 }}>
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
                  color: '#a3e635',
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
                          color: isActive ? '#818cf8' : '#94a3b8',
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
              color: '#818cf8',
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
                      justifyContent: 'space-between',
                    }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon size={16} color={isActive ? section.color : '#94a3b8'} />
                        {section.label}
                      </div>
                      {section.id === 'registrations' && pendingRegistrations > 0 && (
                        <span style={{
                          background: '#fb7185',
                          color: '#fff',
                          borderRadius: '50%',
                          width: 18,
                          height: 18,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 900,
                          flexShrink: 0,
                        }}>
                          {pendingRegistrations}
                        </span>
                      )}
                    </button>
                );
              })}
            </nav>

      {myTournaments && myTournaments.length > 0 && (
        <div style={{ padding: '12px 12px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: 1.5,
            color: '#64748b',
            padding: '8px 6px 4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            MES TOURNOIS
            <span style={{ color: '#475569', fontWeight: 600 }}>{myTournaments.filter(function(t) { return t.status !== 'archived'; }).length}</span>
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto', overflowX: 'hidden' }}>
            {myTournaments.filter(function(t) { return t.status !== 'archived'; }).map(function(t) {
              const isActive = tournament && tournament.id === t.id;
              return (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    marginBottom: 2,
                  }}
                >
                  <button
                    onClick={function() { if (onPickTournament) onPickTournament(t.id); }}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      background: isActive ? 'rgba(34,211,238,0.08)' : 'transparent',
                      border: 'none',
                      color: isActive ? '#a3e635' : '#94a3b8',
                      fontSize: 11,
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderRadius: 6,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.name}
                  </button>
                  {props.onDeleteTournament && (
                    <button
                      onClick={function(e) {
                        e.stopPropagation();
                        if (window.confirm('Supprimer "' + t.name + '" ? Cette action est irreversible.')) {
                          props.onDeleteTournament(t.id);
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: 4,
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                        opacity: 0.4,
                      }}
                      title="Supprimer ce tournoi"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

            <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {onGoToHub && (
                <button
                  onClick={onGoToHub}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px',
                    background: 'rgba(167,139,250,0.1)',
                    border: '1px solid rgba(167,139,250,0.3)',
                    borderRadius: 8,
                    color: '#818cf8',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    letterSpacing: 0.5,
                    fontFamily: 'inherit',
                  }}
                  title="Retour au tableau de bord"
                >
                  <LayoutDashboard size={14} /> TABLEAU DE BORD
                </button>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
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
                      color: '#a3e635',
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
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
                      fontFamily: 'inherit',
                    }}
                  >
                    <LogOut size={12} />
                  </button>
                )}
              </div>
            </div>
          </aside>
        );
      }