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
        <div style={{ ...styles.logoMark, width: 48, height: 48, borderRadius: 12 }}>
          <Zap size={24} strokeWidth={2.5} color="#0a0a0a" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, color: '#22d3ee' }}>FOOTPLANNER</div>
        <div style={{ fontSize: 10, color: '#64748b', letterSpacing: 2 }}>
          {message || 'CHARGEMENT...'}
        </div>
      </div>
    </div>
  );
}
