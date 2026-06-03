import React from 'react';
import { Zap, Crown, Flag, Shield, Eye, Settings, X, ChevronDown } from 'lucide-react';
import { styles } from '../styles/styles';

const ROLE_META = {
  organizer: { label: 'Organisateur', icon: Crown, color: '#f59e0b' },
  referee: { label: 'Arbitre', icon: Flag, color: '#a3e635' },
  coach: { label: 'Coach', icon: Shield, color: '#818cf8' },
  spectator: { label: 'Spectateur', icon: Eye, color: '#94a3b8' },
};

// ============================================================
// TopBar — header sticky de l'app
// - Logo + nom court du tournoi
// - Badge de rôle (clic = ouvre RoleSwitcher)
// - Roue crantée (organizer uniquement) qui toggle l'écran settings
// ============================================================
export function TopBar({ tournament, role, view, setView, profile, accessCode, onGoToHub }) {
  const canEditTournament = role === 'organizer';

  return (
    <header style={styles.topbar}>
      <div style={styles.topbarLeft}>
        {onGoToHub && role === 'organizer' && (
          <button onClick={onGoToHub} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 10px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#64748b', cursor:'pointer', fontSize:11, fontWeight:600, marginRight:4, whiteSpace:'nowrap' }}>
            ← Retour au dashboard
          </button>
        )}
        {profile?.club_logo_url ? <img src={profile.club_logo_url} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }} /> : <div style={styles.logoMark}><Zap size={14} strokeWidth={2.5} color="#0a0a0a" /></div>}
        <div style={{ minWidth: 0 }}>
          <div style={{ ...styles.brandName, color: profile?.club_color || "#a3e635" }}>{profile?.club_name || "FOOTPLANNER"}</div>
          <div style={styles.tournamentName}>{tournament?.name || 'Tournoi'}</div>
        </div>
      </div>
      <div style={styles.topbarRight}>
        {accessCode
          ? <button onClick={() => setView('info')} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#94a3b8', cursor:'pointer', fontSize:11, fontWeight:700 }}>
              <span>ℹ️</span> INFO
            </button>
          : <RoleBadge role={role} onClick={() => setView('roles')} />
        }
        {canEditTournament && (
          <button
            onClick={() => setView(view === 'settings' ? 'dashboard' : 'settings')}
            style={{ ...styles.gearBtn, ...(view === 'settings' ? styles.gearBtnActive : {}) }}
            aria-label={view === 'settings' ? 'Fermer les réglages' : 'Réglages du tournoi'}
          >
            {view === 'settings'
              ? <X size={16} strokeWidth={2.2} />
              : <Settings size={16} strokeWidth={2.2} />}
          </button>
        )}
      </div>
    </header>
  );
}

function RoleBadge({ role, onClick }) {
  const meta = ROLE_META[role] || ROLE_META.spectator;
  const Icon = meta.icon;
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.roleBadge,
        background: meta.color + '15',
        borderColor: meta.color + '55',
        color: meta.color,
      }}
    >
      <Icon size={12} strokeWidth={2.2} />
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5 }}>
        {meta.label.toUpperCase()}
      </span>
      <ChevronDown size={10} strokeWidth={2.5} />
    </button>
  );
}
