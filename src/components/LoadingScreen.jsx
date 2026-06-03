import React from 'react';
import { Zap } from 'lucide-react';
import { styles } from '../styles/styles';

// ============================================================
// BackgroundFX — grille + glows ambiants (utilisé partout)
// ============================================================
export function BackgroundFX() {
  return (
    <>
      <div style={styles.bgGrid} />
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />
    </>
  );
}

// ============================================================
// LoadingScreen — splash de chargement avec logo
// ============================================================
export function LoadingScreen({ message }) {
  return (
    <div style={{ ...styles.app, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <BackgroundFX />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, position: 'relative', zIndex: 2 }}>
        <img src="https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/logo%20app/8891B8C3-D2AB-4CE4-AA8B-5A740A9FD062.png" alt="FootPlanner" style={{ width:64, height:64, objectFit:'contain' }} />
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, color: '#a3e635' }}>FOOTPLANNER</div>
        <div style={{ fontSize: 10, color: '#64748b', letterSpacing: 2 }}>
          {message || 'CHARGEMENT...'}
        </div>
      </div>
    </div>
  );
}
