import React from 'react';
import { Tent } from 'lucide-react';

export function StagesHubView() {
  return (
    <div style={{ color: '#f1f5f9', textAlign: 'center', padding: '80px 32px' }}>
      <Tent size={48} style={{ color: '#f97316', marginBottom: 16 }} />
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Stages & Vacances</h2>
      <p style={{ color: '#64748b', fontSize: 15 }}>Module en cours de développement — Sprint 2 à venir 🚀</p>
    </div>
  );
}
