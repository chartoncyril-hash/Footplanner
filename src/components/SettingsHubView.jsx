import React, { useState } from 'react';
import { AccountView } from './AccountView';
import { TeamView } from './TeamView';
import { User, Users2, Bell, Shield } from 'lucide-react';

// ============================================================
// SettingsHubView — Paramètres du club
// Onglets : Mon compte / Équipe & Droits / Notifications (soon)
// ============================================================

const TABS = [
  { key:'account',  label:'Mon compte',     icon:User,    available:true  },
  { key:'team',     label:'Équipe & Droits', icon:Users2,  available:true  },
  { key:'notifs',   label:'Notifications',   icon:Bell,    available:false },
  { key:'security', label:'Sécurité',        icon:Shield,  available:false },
];

export function SettingsHubView({ signOut }) {
  const [activeTab, setActiveTab] = useState('account');

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#f1f5f9', margin:'0 0 4px' }}>⚙️ Paramètres</h2>
        <p style={{ fontSize:13, color:'#64748b', margin:0 }}>Gérez votre compte, votre équipe et vos préférences</p>
      </div>

      {/* Layout 2 colonnes : nav gauche + contenu droite */}
      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:24, alignItems:'flex-start' }}>

        {/* Nav gauche */}
        <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:8, position:'sticky', top:24 }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => tab.available && setActiveTab(tab.key)}
                style={{
                  display:'flex', alignItems:'center', gap:10, width:'100%', padding:'10px 14px', borderRadius:10, border:'none', cursor: tab.available ? 'pointer' : 'not-allowed', fontFamily:'inherit', textAlign:'left', marginBottom:2, transition:'all 0.15s',
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: isActive ? '#f1f5f9' : tab.available ? '#64748b' : '#334155',
                  opacity: tab.available ? 1 : 0.5,
                  borderLeft: isActive ? '2px solid #a3e635' : '2px solid transparent',
                }}
              >
                <Icon size={15} />
                <span style={{ fontSize:13, fontWeight: isActive ? 700 : 500 }}>{tab.label}</span>
                {!tab.available && (
                  <span style={{ fontSize:9, background:'rgba(255,255,255,0.04)', padding:'1px 6px', borderRadius:3, marginLeft:'auto', color:'#334155' }}>Bientôt</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Contenu */}
        <div>
          {activeTab === 'account' && <AccountView signOut={signOut} />}
          {activeTab === 'team' && <TeamView />}
        </div>
      </div>
    </div>
  );
}
