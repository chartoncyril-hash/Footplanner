import React, { useState } from 'react';
import {
  Trophy, Users, Monitor, ShoppingCart, Heart, BarChart2,
  MessageSquare, Image, ArrowRight, Clock, Plus, User
} from 'lucide-react';
import { AccountView } from './AccountView';
import { RegistrationManager } from './RegistrationManager';
import { SponsorsHubView } from './SponsorsHubView';
import { LicenciesView } from './LicenciesView';
import { CompositionsView } from './CompositionsView';
import { CheckInView } from './CheckInView';

// ============================================================
// HubDashboard — niveau COMPTE
// Aperçu + grille de modules
// ============================================================

const MODULES = [
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
    icon: Users,
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
    id: 'licencies',
    label: 'Licenciés & Équipes',
    icon: ShoppingCart,
    color: '#34d399',
    desc: 'Gérez vos licenciés, documents, conformité et équipes.',
    available: true,
  },
  {
    id: 'compositions',
    label: 'Compositions & Tactique',
    icon: Users,
    color: '#818cf8',
    desc: "Créez vos compositions d'équipe et plans tactiques.",
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
    id: 'sponsors',
    label: 'Sponsors & Partenaires',
    icon: BarChart2,
    color: '#facc15',
    desc: 'Gérez vos partenaires commerciaux et suivez vos contrats.',
    available: true,
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: MessageSquare,
    color: '#f472b6',
    desc: 'Annonces, notifications et messagerie pour vos participants.',
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

export function HubDashboard({ profile, myTournaments, onEnterModule, onCreateTournament, onGoToAccount, hubView, onHubViewBack, signOut }) {
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
              <button onClick={onHubViewBack} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 16px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'#94a3b8',cursor:'pointer',fontSize:13,fontWeight:600,marginBottom:24,marginTop:24}}>
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
                  fontSize:13, fontWeight:600, marginBottom:24 }}
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
                        style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)',
                          borderRadius:16, padding:'20px 24px', color:'#f1f5f9',
                          cursor:'pointer', textAlign:'left', width:'100%',
                          display:'flex', alignItems:'center', justifyContent:'space-between',
                          transition:'border-color 0.15s' }}
                      >
                        <div>
                          <div style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>{t.name}</div>
                          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                            <span style={{ fontSize:12, color: t.status === 'live' ? '#34d399' : '#64748b', fontWeight:600, background: t.status === 'live' ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)', padding:'2px 10px', borderRadius:20, border: t.status === 'live' ? '1px solid rgba(52,211,153,0.2)' : '1px solid rgba(255,255,255,0.08)' }}>
                              {t.status === 'live' ? '🟢 En cours' : '⬜ Archivé'}
                            </span>
                            {t.date && <span style={{ fontSize:12, color:'#64748b' }}>📅 {new Date(t.date).toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'})}</span>}
                          </div>
                        </div>
                        <span style={{ fontSize:20, color:'#334155' }}>→</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }

      if (hubView === 'compositions') {
        return (
          <div style={{maxWidth:900, margin:'0 auto', padding:'32px 24px'}}>
            <button onClick={onHubViewBack} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 16px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'#94a3b8',cursor:'pointer',fontSize:13,fontWeight:600,marginBottom:24,marginTop:24}}>
              ← Retour au dashboard
            </button>
            <CompositionsView />
          </div>
        );
      }
      if (hubView === 'licencies') {
        return (
          <div style={{maxWidth:900, margin:'0 auto', padding:'32px 24px'}}>
            <button onClick={onHubViewBack} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 16px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'#94a3b8',cursor:'pointer',fontSize:13,fontWeight:600,marginBottom:24,marginTop:24}}>
              ← Retour au dashboard
            </button>
            <LicenciesView />
          </div>
        );
      }
      if (hubView === 'sponsors') {
        return (
          <div style={{maxWidth:900, margin:'0 auto', padding:'32px 24px'}}>
            <button onClick={onHubViewBack} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 16px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'#94a3b8',cursor:'pointer',fontSize:13,fontWeight:600,marginBottom:24,marginTop:24}}>
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
                      style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)',
                        borderRadius:16, padding:'20px 24px', color:'#f1f5f9',
                        cursor:'pointer', textAlign:'left', width:'100%',
                        display:'flex', alignItems:'center', justifyContent:'space-between',
                        transition:'border-color 0.15s' }}
                    >
                      <div>
                        <div style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>{t.name}</div>
                        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                          <span style={{ fontSize:12, color: t.status === 'live' ? '#34d399' : '#64748b', fontWeight:600, background: t.status === 'live' ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)', padding:'2px 10px', borderRadius:20, border: t.status === 'live' ? '1px solid rgba(52,211,153,0.2)' : '1px solid rgba(255,255,255,0.08)' }}>
                            {t.status === 'live' ? '🟢 En cours' : '⬜ Archivé'}
                          </span>
                          {t.date && <span style={{ fontSize:12, color:'#64748b' }}>📅 {new Date(t.date).toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'})}</span>}
                        </div>
                      </div>
                      <span style={{ fontSize:20, color:'#334155' }}>→</span>
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
      <div style={{...S.header, background: `linear-gradient(135deg, ${clubColor}18 0%, transparent 60%)`}}>
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
              <div style={S.clubName}>{clubName}</div>
              <div style={S.welcome}>
                {firstName ? `Bonjour ${firstName} 👋` : 'Bienvenue sur FootPlanner'}
              </div>
            </div>
          </div>
          <div style={{display:'flex', gap:10}}>
            <button
              onClick={onGoToAccount}
              style={{...S.btnCreate, background:'rgba(255,255,255,0.06)', color:'#94a3b8', border:'1px solid rgba(255,255,255,0.08)'}}
            >
              <User size={16} />
              Mon compte
            </button>
            <button
              onClick={onCreateTournament}
              style={{...S.btnCreate, background: appColor, color: '#060a12'}}
            >
              <Plus size={16} />
              Nouveau tournoi
            </button>
          </div>
        </div>
      </div>

      <div style={S.content}>
        {/* WIDGETS APERÇU */}
        {activeTournaments.length > 0 && (
          <div style={S.section}>
            <div style={S.sectionTitle}>
              <Clock size={14} color={appColor} />
              Tournois en cours
            </div>
            <div style={S.widgetGrid}>
              {activeTournaments.map(t => (
                <div
                  key={t.id}
                  onClick={() => onEnterModule('tournaments', t.id)}
                  style={{...S.tournamentCard, borderColor: `${clubColor}33`}}
                >
                  <div style={{...S.tournamentDot, background: appColor}} />
                  <div style={S.tournamentInfo}>
                    <div style={S.tournamentName}>{t.name}</div>
                    <div style={S.tournamentMeta}>
                      {t.categories?.length > 0
                        ? `${t.categories.length} catégorie${t.categories.length > 1 ? 's' : ''}`
                        : 'Tournoi'}
                    </div>
                  </div>
                  <ArrowRight size={14} color={appColor} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GRILLE MODULES */}
        <div style={S.section}>
          <div style={S.sectionTitle}>
            <Trophy size={14} color={appColor} />
            Mes modules
          </div>
          <div style={S.moduleGrid}>
            {MODULES.map(mod => (
              <ModuleCard
                key={mod.id}
                mod={mod}
                clubColor={appColor}
                onClick={() => mod.available && onEnterModule(mod.id)}
              />
            ))}
          </div>
        </div>

        {/* STATS RAPIDES */}
        <div style={S.statsRow}>
          {[
            { label: 'Tournois créés', value: (myTournaments || []).filter(t => t.status === 'live').length },
            { label: 'Archivés', value: (myTournaments || []).filter(t => t.status === 'archived').length },
            { label: 'Total', value: (myTournaments || []).length },
          ].map(s => (
            <div key={s.label} style={S.statCard}>
              <div style={{...S.statValue, color: appColor}}>{s.value}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModuleCard({ mod, clubColor, onClick }) {
  const Icon = mod.icon;
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
  headerInner: { maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  clubLogo: { width: 56, height: 56, borderRadius: 12, objectFit: 'cover' },
  clubLogoPlaceholder: { width: 56, height: 56, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900 },
  clubName: { fontSize: 22, fontWeight: 900, letterSpacing: -0.5 },
  welcome: { fontSize: 13, color: '#64748b', marginTop: 2 },
  btnCreate: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit' },
  content: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
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