import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Trophy, Monitor, Heart, BarChart2, ClipboardCheck, ClipboardList,
  CircleUser, Shirt, Handshake,
  Tent, MessageSquare, CalendarDays, Users2, Image, ArrowRight, Clock, Plus, User
} from 'lucide-react';
import { AccountView } from './AccountView';
import { RegistrationManager } from './RegistrationManager';
import { SponsorsHubView } from './SponsorsHubView';
import { StagesHubView } from './StagesHubView';
import { CommunicationHub } from './CommunicationHub';
import { PlanningView } from './PlanningView';
import { TeamView } from './TeamView';
import { SettingsHubView } from './SettingsHubView';
import { LicenciesView } from './LicenciesView';
import { CompositionsView } from './CompositionsView';
import { CheckInView } from './CheckInView';
import { getEffectiveOwnerId } from "../lib/effectiveUser";

// ============================================================
// HubDashboard — niveau COMPTE
// Aperçu + grille de modules
// ============================================================

const MODULES = [
  // Ligne 1
  {
    id: 'licencies',
    label: 'Licenciés & Équipes',
    icon: ClipboardList,
    color: '#34d399',
    desc: 'Gérez vos licenciés, documents, conformité et équipes.',
    available: true,
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: MessageSquare,
    color: '#f472b6',
    desc: 'Événements, présences, sondages et messagerie du club.',
    available: true,
  },
  {
    id: 'planning',
    label: 'Planning',
    icon: CalendarDays,
    color: '#22d3ee',
    desc: 'Vue agenda du club — événements, tournois et stages.',
    available: true,
  },
  {
    id: 'sponsors',
    label: 'Sponsors & Partenaires',
    icon: Handshake,
    color: '#facc15',
    desc: 'Gérez vos partenaires commerciaux et suivez vos contrats.',
    available: true,
  },
  // Ligne 2
  {
    id: 'tournaments',
    label: 'Gestion de tournois',
    icon: Trophy,
    color: '#a3e635',
    desc: 'Créez et gérez vos tournois, poules, calendriers et phases finales.',
    available: true,
  },
  {
    id: 'inscriptions',
    label: 'Inscriptions en ligne',
    icon: ClipboardCheck,
    color: '#818cf8',
    desc: 'Les équipes s\'inscrivent elles-mêmes via une page publique.',
    available: true,
  },
  {
    id: 'scoreboard',
    label: 'Table de marque',
    icon: Monitor,
    color: '#f59e0b',
    desc: 'Joueurs, feuilles de match, buteurs et cartons en temps réel.',
    available: true,
  },
  {
    id: 'compositions',
    label: 'Compositions & Tactique',
    icon: Shirt,
    color: '#818cf8',
    desc: "Créez vos compositions d'équipe et plans tactiques.",
    available: true,
  },
  // Ligne 3
  {
    id: 'stages',
    label: 'Stages & Vacances',
    icon: Tent,
    color: '#f97316',
    desc: 'Créez vos stages, gérez les inscriptions et invitez vos licenciés.',
    available: true,
  },
  {
    id: 'benevoles',
    label: 'Bénévoles & Staff',
    icon: Heart,
    color: '#fb7185',
    desc: 'Planifiez et coordonnez vos bénévoles sur tous les postes.',
    available: false,
  },
  {
    id: 'medias',
    label: 'Médias & Galerie',
    icon: Image,
    color: '#94a3b8',
    desc: 'Photos, vidéos et partage pour animer votre événement.',
    available: false,
  },
];

export function HubDashboard({ profile, clubContext, myTournaments, onEnterModule, onCreateTournament, onGoToAccount, hubView, onHubViewBack, signOut }) {
  // Modules visibles : owner = tout, membre = selon permissions
  const visibleModules = (clubContext && clubContext.type === 'member')
    ? MODULES.filter(m => clubContext.permissions && clubContext.permissions[m.id])
    : MODULES;
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  const clubColor = profile?.club_color || '#a3e635';
  const appColor = '#a3e635';
  const clubName = profile?.club_name || 'Mon club';
  const clubLogo = profile?.club_logo_url;
  const firstName = profile?.first_name || '';
  const [selectedInscriptionTournoiId, setSelectedInscriptionTournoiId] = useState(null);
  const selectedInscriptionTournoi = selectedInscriptionTournoiId ? (myTournaments || []).find(t => t.id === selectedInscriptionTournoiId) : null;
  const [selectedScoreboardTournoi, setSelectedScoreboardTournoi] = useState(null);

  // Prochains tournois (live en premier, puis récents)
  const activeTournaments = (myTournaments || []).filter(t => t.status === 'live').slice(0, 3);

      // Vue Mon compte dans le Hub
      if (hubView === 'account') {
        return (
          <div style={S.page}>
            <div style={{maxWidth:600, margin:'0 auto', padding:'0 24px'}}>
              <button onClick={onHubViewBack} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 16px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'#94a3b8',cursor:'pointer',fontSize:13,fontWeight:600,marginBottom:24,marginTop:8}}>
                ← Retour au dashboard
              </button>
              <AccountView signOut={signOut} onBack={onHubViewBack} />
            </div>
          </div>
        );
      }

      if (hubView === 'inscriptions') {
        const liveTournaments = (myTournaments || []);
        return (
          <div style={S.page}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px' }}>
              <button
                onClick={onHubViewBack}
                style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 16px',
                  background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
                  borderRadius:10, color:'#94a3b8', cursor:'pointer',
                  fontSize:13, fontWeight:600, marginBottom:24, marginTop:8 }}
              >
                ← Retour au dashboard
              </button>
              <h2 style={{ color:'#f1f5f9', fontSize:20, fontWeight:700, marginBottom:24 }}>
                Inscriptions en ligne
              </h2>
              {liveTournaments.length === 0 ? (
                <p style={{ color:'#94a3b8' }}>Aucun tournoi.</p>
              ) : liveTournaments.length === 1 ? (
                <RegistrationManager tournament={liveTournaments[0]} onUpdateTournament={() => {}} />
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {selectedInscriptionTournoi ? (
                    <>
                      <button
                        onClick={() => setSelectedInscriptionTournoiId(null)}
                        style={{ alignSelf:'flex-start', background:'none', border:'none',
                          color:'#94a3b8', cursor:'pointer', fontSize:13, fontWeight:700, padding:'0 0 12px' }}
                      >
                        ← Choisir un autre tournoi
                      </button>
                      <RegistrationManager tournament={selectedInscriptionTournoi} onUpdateTournament={() => {}} />
                    </>
                  ) : (
                    liveTournaments.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedInscriptionTournoiId(t.id)}
                        style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)',
                          borderRadius:16, padding:'0', color:'#f1f5f9', cursor:'pointer', textAlign:'left',
                          width:'100%', display:'block', overflow:'hidden', transition:'all 0.2s' }}
                      >
                        <div style={{ height:3, background: t.status === 'live' ? 'linear-gradient(90deg,#a3e635,#34d399)' : 'rgba(255,255,255,0.06)' }} />
                        <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:15, fontWeight:800, color:'#f1f5f9', marginBottom:8, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.name}</div>
                            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                              <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, color: t.status === 'live' ? '#34d399' : '#64748b', background: t.status === 'live' ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)', padding:'3px 10px', borderRadius:20, border: t.status === 'live' ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(255,255,255,0.07)' }}>
                                <span style={{ width:5, height:5, borderRadius:'50%', background: t.status === 'live' ? '#34d399' : '#475569', display:'inline-block' }}/>
                                {t.status === 'live' ? 'En cours' : 'Archivé'}
                              </span>
                              {t.date && <span style={{ fontSize:11, color:'#475569' }}>{new Date(t.date).toLocaleDateString('fr-FR', {day:'numeric', month:'short', year:'numeric'})}</span>}
                              {t.categories?.length > 0 && <span style={{ fontSize:11, color:'#475569' }}>{t.categories.length} catégorie{t.categories.length > 1 ? 's' : ''}</span>}
                            </div>
                          </div>
                          <div style={{ width:32, height:32, borderRadius:10, background:'rgba(163,230,53,0.08)', border:'1px solid rgba(163,230,53,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginLeft:12 }}>
                            <span style={{ fontSize:14, color:'#a3e635' }}>→</span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }

      if (hubView === 'settings') {
        return (
          <div style={{maxWidth:1200, margin:'0 auto', padding:'32px 24px'}}>
            <button onClick={onHubViewBack} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 16px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'#94a3b8',cursor:'pointer',fontSize:13,fontWeight:600,marginBottom:24,marginTop:8}}>
              ← Retour au dashboard
            </button>
            <SettingsHubView signOut={signOut} />
          </div>
        );
      }
      if (hubView === 'planning') {
        return (
          <div style={{maxWidth:1200, margin:'0 auto', padding:'32px 24px'}}>
            <button onClick={onHubViewBack} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 16px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'#94a3b8',cursor:'pointer',fontSize:13,fontWeight:600,marginBottom:24,marginTop:8}}>
              ← Retour au dashboard
            </button>
            <PlanningView myTournaments={myTournaments} />
          </div>
        );
      }
      if (hubView === 'communication') {
        return (
          <div style={{maxWidth:1200, margin:'0 auto', padding:'32px 24px'}}>
            <button onClick={onHubViewBack} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 16px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'#94a3b8',cursor:'pointer',fontSize:13,fontWeight:600,marginBottom:24,marginTop:8}}>
              ← Retour au dashboard
            </button>
            <CommunicationHub />
          </div>
        );
      }
      if (hubView === 'stages') {
        return (
          <div style={{maxWidth:1200, margin:'0 auto', padding:'32px 24px'}}>
            <button onClick={onHubViewBack} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 16px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'#94a3b8',cursor:'pointer',fontSize:13,fontWeight:600,marginBottom:24,marginTop:8}}>
              ← Retour au dashboard
            </button>
            <StagesHubView />
          </div>
        );
      }
      if (hubView === 'compositions') {
        return (
          <div style={{maxWidth:1200, margin:'0 auto', padding:'32px 24px'}}>
            <button onClick={onHubViewBack} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 16px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'#94a3b8',cursor:'pointer',fontSize:13,fontWeight:600,marginBottom:24,marginTop:8}}>
              ← Retour au dashboard
            </button>
            <CompositionsView />
          </div>
        );
      }
      if (hubView === 'licencies') {
        return (
          <div style={{maxWidth:1200, margin:'0 auto', padding:'32px 24px'}}>
            <button onClick={onHubViewBack} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 16px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'#94a3b8',cursor:'pointer',fontSize:13,fontWeight:600,marginBottom:24,marginTop:8}}>
              ← Retour au dashboard
            </button>
            <LicenciesView />
          </div>
        );
      }
      if (hubView === 'sponsors') {
        return (
          <div style={{maxWidth:1200, margin:'0 auto', padding:'32px 24px'}}>
            <button onClick={onHubViewBack} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 16px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'#94a3b8',cursor:'pointer',fontSize:13,fontWeight:600,marginBottom:24,marginTop:8}}>
              ← Retour au dashboard
            </button>
            <SponsorsHubView profile={profile} />
          </div>
        );
      }
      if (hubView === 'scoreboard') {
        const allTournaments = (myTournaments || []);
        return (
          <div style={S.page}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px' }}>
              <button
                onClick={onHubViewBack}
                style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 16px',
                  background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
                  borderRadius:10, color:'#94a3b8', cursor:'pointer',
                  fontSize:13, fontWeight:600, marginBottom:24 }}
              >
                ← Retour au dashboard
              </button>
              <h2 style={{ color:'#f1f5f9', fontSize:20, fontWeight:700, marginBottom:24 }}>
                Table de marque
              </h2>
              {allTournaments.length === 0 ? (
                <p style={{ color:'#94a3b8' }}>Aucun tournoi.</p>
              ) : selectedScoreboardTournoi ? (
                <>
                  <button
                    onClick={() => setSelectedScoreboardTournoi(null)}
                    style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 16px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'#94a3b8',cursor:'pointer',fontSize:13,fontWeight:600,marginBottom:20}}
                  >
                    ← Choisir un autre tournoi
                  </button>
                  <CheckInView teams={selectedScoreboardTournoi.teams || []} tournament={selectedScoreboardTournoi} />
                </>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {allTournaments.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedScoreboardTournoi(t)}
                      style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)',
                        borderRadius:16, padding:'0', color:'#f1f5f9', cursor:'pointer', textAlign:'left',
                        width:'100%', display:'block', overflow:'hidden', transition:'all 0.2s' }}
                    >
                      <div style={{ height:3, background: t.status === 'live' ? 'linear-gradient(90deg,#a3e635,#34d399)' : 'rgba(255,255,255,0.06)' }} />
                      <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:15, fontWeight:800, color:'#f1f5f9', marginBottom:8, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.name}</div>
                          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                            <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, color: t.status === 'live' ? '#34d399' : '#64748b', background: t.status === 'live' ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)', padding:'3px 10px', borderRadius:20, border: t.status === 'live' ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(255,255,255,0.07)' }}>
                              <span style={{ width:5, height:5, borderRadius:'50%', background: t.status === 'live' ? '#34d399' : '#475569', display:'inline-block' }}/>
                              {t.status === 'live' ? 'En cours' : 'Archivé'}
                            </span>
                            {t.date && <span style={{ fontSize:11, color:'#475569' }}>{new Date(t.date).toLocaleDateString('fr-FR', {day:'numeric', month:'short', year:'numeric'})}</span>}
                            {t.categories?.length > 0 && <span style={{ fontSize:11, color:'#475569' }}>{t.categories.length} catégorie{t.categories.length > 1 ? 's' : ''}</span>}
                          </div>
                        </div>
                        <div style={{ width:32, height:32, borderRadius:10, background:'rgba(163,230,53,0.08)', border:'1px solid rgba(163,230,53,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginLeft:12 }}>
                          <span style={{ fontSize:14, color:'#a3e635' }}>→</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }
      return (
        <div style={S.page}>
      {/* HEADER CLUB */}
      <div style={{...S.header, padding: isMobile ? '20px 16px 18px' : '32px 24px 24px', background: `linear-gradient(135deg, ${clubColor}18 0%, transparent 60%)`}}>
        <div style={S.headerInner}>
          <div style={S.headerLeft}>
            {clubLogo ? (
              <img src={clubLogo} alt="" style={S.clubLogo} />
            ) : (
              <div style={{...S.clubLogoPlaceholder, background: `${clubColor}22`, border: `2px solid ${clubColor}44`, color: clubColor}}>
                {clubName[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div>
              <div style={{...S.clubName, fontSize: isMobile ? 18 : 22}}>{clubName}</div>
              <div style={S.welcome}>
                {firstName ? `Bonjour ${firstName} 👋` : 'Bienvenue sur FootPlanner'}
              </div>
            </div>
          </div>
          <button
            onClick={signOut}
            style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit', padding:'8px 4px', textDecoration:'underline', textUnderlineOffset:3 }}
          >
            Se déconnecter
          </button>
        </div>
      </div>

      <div style={S.content}>
        {/* WIDGETS APERÇU — 2 colonnes */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16, marginBottom:24 }}>
          {/* Colonne 1 — Messagerie */}
          <CommunicationWidget appColor={appColor} onNavigate={() => onEnterModule('communication')} />

          {/* Colonne 2 — Planning du jour */}
          <TodayPlanning myTournaments={myTournaments} appColor={appColor} onNavigate={() => onEnterModule('planning')} />
        </div>

        {/* GRILLE MODULES */}
        <div style={S.section}>
          <div style={S.sectionTitle}>
            <Trophy size={14} color={appColor} />
            Mes modules
          </div>
          <div style={{ ...S.moduleGrid, gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 16 }}>
            {visibleModules.map(mod => (
              <ModuleCard
                key={mod.id}
                mod={mod}
                clubColor={appColor}
                compact={isMobile}
                onClick={() => mod.available && onEnterModule(mod.id)}
              />
            ))}
          </div>
        </div>

        {/* STATS RAPIDES */}
        
      </div>
    </div>
  );
}

function ModuleCard({ mod, clubColor, onClick, compact }) {
  const Icon = mod.icon;
  if (compact) {
    return (
      <div
        onClick={onClick}
        style={{
          background: 'rgba(15,23,42,0.6)',
          border: `1px solid ${mod.available ? mod.color + '22' : 'rgba(255,255,255,0.04)'}`,
          borderRadius: 14,
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 10,
          cursor: mod.available ? 'pointer' : 'default',
          opacity: mod.available ? 1 : 0.5,
          minHeight: 104,
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${mod.color}15`, color: mod.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={22} />
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.25 }}>{mod.label}</div>
        {!mod.available && (
          <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 8, fontWeight: 700, color: '#475569', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 5 }}>Bientôt</div>
        )}
      </div>
    );
  }
  return (
    <div
      onClick={onClick}
      style={{
        ...S.moduleCard,
        cursor: mod.available ? 'pointer' : 'default',
        opacity: mod.available ? 1 : 0.6,
        borderColor: mod.available ? `${mod.color}22` : 'rgba(255,255,255,0.04)',
      }}
    >
      <div style={{...S.moduleIcon, background: `${mod.color}15`, color: mod.color}}>
        <Icon size={22} />
      </div>
      <div style={S.moduleLabel}>{mod.label}</div>
      <div style={S.moduleDesc}>{mod.desc}</div>
      {!mod.available && (
        <div style={S.moduleBadge}>Bientôt disponible</div>
      )}
      {mod.available && (
        <div style={{...S.moduleBadge, background: `${clubColor}15`, color: clubColor, border: `1px solid ${clubColor}33`}}>
          Accéder →
        </div>
      )}
    </div>
  );
}

// STYLES
const S = {
  page: { minHeight: '100vh', background: '#060a12', color: '#f1f5f9' },
  header: { padding: '32px 24px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  headerInner: { maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  clubLogo: { width: 56, height: 56, borderRadius: 12, objectFit: 'cover' },
  clubLogoPlaceholder: { width: 56, height: 56, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900 },
  clubName: { fontSize: 22, fontWeight: 900, letterSpacing: -0.5 },
  welcome: { fontSize: 13, color: '#64748b', marginTop: 2 },
  btnCreate: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit' },
  content: { maxWidth: 1100, margin: '0 auto', padding: '24px 16px' },
  section: { marginBottom: 40 },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 },
  widgetGrid: { display: 'flex', flexDirection: 'column', gap: 8 },
  tournamentCard: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(15,23,42,0.6)', border: '1px solid', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s' },
  tournamentDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  tournamentInfo: { flex: 1 },
  tournamentName: { fontSize: 14, fontWeight: 700, color: '#f1f5f9' },
  tournamentMeta: { fontSize: 11, color: '#64748b', marginTop: 2 },
  moduleGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 },
  moduleCard: { background: 'rgba(15,23,42,0.6)', border: '1px solid', borderRadius: 16, padding: 20, transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 8 },
  moduleIcon: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  moduleLabel: { fontSize: 14, fontWeight: 800, color: '#f1f5f9' },
  moduleDesc: { fontSize: 12, color: '#64748b', lineHeight: 1.5, flex: 1 },
  moduleBadge: { display: 'inline-flex', padding: '3px 10px', background: 'rgba(255,255,255,0.04)', color: '#475569', borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: 0.5, alignSelf: 'flex-start' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 },
  statCard: { background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px', textAlign: 'center' },
  statValue: { fontSize: 36, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", letterSpacing: -1 },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: 600, marginTop: 4 },
};
// ── TODAY PLANNING ──────────────────────────────────────────
function CommunicationWidget({ appColor, onNavigate }) {
  const [convs, setConvs] = React.useState([]);
  const [unreadTotal, setUnreadTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const ownerId = await getEffectiveOwnerId();
        if (!ownerId) { setLoading(false); return; }
        const readerKey = "usr_" + user.id;

        const { data: conversations } = await supabase
          .from("conversations").select("*")
          .eq("club_owner_id", ownerId).order("created_at");
        if (!conversations || !conversations.length) { setConvs([]); setLoading(false); return; }

        const ids = conversations.map(c => c.id);
        const [{ data: msgs }, { data: reads }] = await Promise.all([
          supabase.from("conv_messages").select("conversation_id, created_at, content, sender_name")
            .in("conversation_id", ids).order("created_at", { ascending: false }).limit(300),
          supabase.from("conv_reads").select("conversation_id, last_read_at")
            .eq("reader_key", readerKey).in("conversation_id", ids),
        ]);

        const lastRead = {};
        (reads || []).forEach(r => { lastRead[r.conversation_id] = r.last_read_at; });

        const lastMsgByConv = {};
        const unreadByConv = {};
        (msgs || []).forEach(m => {
          if (!lastMsgByConv[m.conversation_id]) lastMsgByConv[m.conversation_id] = m;
          const lr = lastRead[m.conversation_id];
          if (!lr || new Date(m.created_at) > new Date(lr))
            unreadByConv[m.conversation_id] = (unreadByConv[m.conversation_id] || 0) + 1;
        });

        const enriched = conversations
          .map(c => ({ ...c, lastMsg: lastMsgByConv[c.id], unread: unreadByConv[c.id] || 0 }))
          .filter(c => c.lastMsg)
          .sort((a, b) => new Date(b.lastMsg.created_at) - new Date(a.lastMsg.created_at))
          .slice(0, 4);

        setConvs(enriched);
        setUnreadTotal(Object.values(unreadByConv).reduce((s, n) => s + n, 0));
      } catch (e) { console.error("comm widget", e); }
      setLoading(false);
    })();
  }, []);

  const fmt = (d) => {
    const dt = new Date(d), now = new Date();
    const sameDay = dt.toDateString() === now.toDateString();
    return sameDay ? dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                   : dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  return (
    <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'18px 20px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:800, color:'#cbd5e1', textTransform:'uppercase', letterSpacing:1 }}>
          <MessageSquare size={14} color="#f472b6" />
          Messagerie
          {unreadTotal > 0 && (
            <span style={{ minWidth:18, height:18, padding:'0 5px', borderRadius:9, background:'#ef4444', color:'#fff', fontSize:11, fontWeight:800, display:'inline-flex', alignItems:'center', justifyContent:'center', letterSpacing:0 }}>
              {unreadTotal > 99 ? '99+' : unreadTotal}
            </span>
          )}
        </div>
        <button onClick={onNavigate} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'inherit', display:'flex', alignItems:'center', gap:3 }}>
          Ouvrir <ArrowRight size={12} />
        </button>
      </div>
      {loading ? (
        <div style={{ color:'#334155', fontSize:13, textAlign:'center', padding:'20px 0' }}>Chargement...</div>
      ) : convs.length === 0 ? (
        <div style={{ color:'#334155', fontSize:13, textAlign:'center', padding:'20px 0' }}>Aucun message</div>
      ) : convs.map(c => (
        <div key={c.id} onClick={onNavigate}
          style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, cursor:'pointer', marginBottom:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(244,114,182,0.15)', transition:'all 0.15s' }}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(244,114,182,0.08)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.03)'}}
        >
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#f1f5f9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{c.name || 'Conversation'}</div>
              <span style={{ fontSize:10, color:'#475569', flexShrink:0 }}>{fmt(c.lastMsg.created_at)}</span>
            </div>
            <div style={{ fontSize:11, color:'#64748b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:2 }}>
              {c.lastMsg.sender_name ? `${c.lastMsg.sender_name}: ` : ''}{c.lastMsg.content}
            </div>
          </div>
          {c.unread > 0 && (
            <span style={{ minWidth:18, height:18, padding:'0 5px', borderRadius:9, background:'#ef4444', color:'#fff', fontSize:11, fontWeight:800, display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{c.unread}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function TodayPlanning({ myTournaments, appColor, onNavigate }) {
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const TYPES = {
    training:   { label:'Entraînement', color:'#34d399', emoji:'⚽' },
    match:      { label:'Match',        color:'#f59e0b', emoji:'🏆' },
    tournament: { label:'Tournoi',      color:'#f97316', emoji:'🥇' },
    stage:      { label:'Stage',        color:'#a78bfa', emoji:'🏕️' },
    meeting:    { label:'Réunion',      color:'#22d3ee', emoji:'📋' },
    other:      { label:'Autre',        color:'#94a3b8', emoji:'📌' },
    cancelled:  { label:'Annulé',       color:'#475569', emoji:'❌' },
  };

  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const today = new Date().toISOString().slice(0, 10);

      const [{ data: clubEvts }, { data: stagesData }] = await Promise.all([
        supabase.from('club_events').select('*').eq('owner_id', await getEffectiveOwnerId()).eq('date', today),
        supabase.from('stages').select('*').eq('owner_id', await getEffectiveOwnerId()).lte('date_start', today).gte('date_end', today),
      ]);

      const all = [];
      for (const e of clubEvts || []) all.push({
        type: e.status === 'cancelled' ? 'cancelled' : (e.type || 'other'),
        title: e.title, time: e.time_start,
      });
      for (const s of stagesData || []) all.push({ type:'stage', title:s.name, time:null });
      for (const t of myTournaments || []) {
        if (t.date === today) all.push({ type:'tournament', title:t.name, time:null });
      }

      all.sort((a,b) => (a.time||'99:99').localeCompare(b.time||'99:99'));
      setEvents(all);
      setLoading(false);
    })();
  }, [myTournaments]);

  const todayStr = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long' });

  return (
    <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'18px 20px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:800, color:'#64748b', textTransform:'uppercase', letterSpacing:1 }}>
          <CalendarDays size={14} color={'#22d3ee'} />
          Aujourd'hui
        </div>
        <button onClick={onNavigate} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'inherit', display:'flex', alignItems:'center', gap:3 }}>
          Ouvrir <ArrowRight size={12} />
        </button>
      </div>
      <div style={{ fontSize:12, color:'#475569', marginBottom:12, fontWeight:600 }}>{todayStr}</div>
      {loading ? (
        <div style={{ color:'#334155', fontSize:13, textAlign:'center', padding:'10px 0' }}>...</div>
      ) : events.length === 0 ? (
        <div style={{ color:'#334155', fontSize:13, textAlign:'center', padding:'20px 0' }}>
          <div style={{ fontSize:24, marginBottom:6 }}>🌟</div>
          Rien au programme aujourd'hui
        </div>
      ) : events.map((evt, i) => {
        const t = TYPES[evt.type] || TYPES.other;
        return (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, marginBottom:6, background:`${t.color}10`, borderLeft:`3px solid ${t.color}` }}>
            <span style={{ fontSize:14 }}>{t.emoji}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#f1f5f9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{evt.title}</div>
              {evt.time && <div style={{ fontSize:10, color:`${t.color}99` }}>🕐 {evt.time.slice(0,5)}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
