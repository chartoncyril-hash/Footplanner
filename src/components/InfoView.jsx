import React from 'react';

export function InfoView({ tournament, onBack }) {
  return (
    <div style={{ padding: '24px 16px', maxWidth: 600, margin: '0 auto' }}>
      <button onClick={onBack} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#94a3b8', cursor:'pointer', fontSize:13, fontWeight:600, marginBottom:24 }}>
        ← Retour
      </button>

      <h1 style={{ fontSize:24, fontWeight:900, color:'#f1f5f9', marginBottom:8 }}>
        {tournament?.name || 'Tournoi'}
      </h1>

      {tournament?.date && (
        <p style={{ fontSize:14, color:'#64748b', marginBottom:24 }}>
          📅 {new Date(tournament.date).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
        </p>
      )}

      {tournament?.location && (
        <div style={{ padding:'16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, marginBottom:16 }}>
          <div style={{ fontSize:11, color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Lieu</div>
          <div style={{ fontSize:15, color:'#f1f5f9' }}>📍 {tournament.location}</div>
        </div>
      )}

      <div style={{ padding:'16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, marginBottom:16 }}>
        <div style={{ fontSize:11, color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Règlement</div>
        <div style={{ fontSize:14, color:'#94a3b8', lineHeight:1.7 }}>
          {tournament?.rules || 'Le règlement de ce tournoi sera bientôt disponible.'}
        </div>
      </div>

      <div style={{ padding:'16px', background:'rgba(163,230,53,0.05)', border:'1px solid rgba(163,230,53,0.1)', borderRadius:12 }}>
        <div style={{ fontSize:12, color:'#64748b', textAlign:'center' }}>
          Suivi en direct sur <strong style={{ color:'#a3e635' }}>FootPlanner</strong>
        </div>
      </div>
    </div>
  );
}
