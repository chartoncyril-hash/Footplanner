import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import QRCode from 'qrcode';

export function PosterView({ tournament, profile, onBack }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    if (!tournament?.accessCode) return;
    const spectatorUrl = window.location.origin + '/?t=' + tournament.accessCode;
    QRCode.toDataURL(spectatorUrl, { width: 300, margin: 2, color: { dark: '#0a0e1a', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [tournament?.accessCode]);

  if (!tournament) return null;

  const clubColor = profile?.club_color || '#a3e635';
  const clubName = profile?.club_name || 'FootPlanner';
  const clubLogo = profile?.club_logo_url;
  const date = tournament.date
    ? new Date(tournament.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  return (
      <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>

        <div style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
          <button onClick={() => {
          const el = document.getElementById('poster');
          const win = window.open('', '_blank', 'width=900,height=1200');
          win.document.write('<html><head><style>* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } body { margin: 0; background: white; } @page { size: A4 portrait; margin: 0; }</style></head><body>' + el.outerHTML + '</body></html>');
          win.document.close();
          setTimeout(() => win.print(), 500);
        }} style={{ padding: '10px 24px', background: '#0a0e1a', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            🖨️ Imprimer / Télécharger PDF
          </button>
          {onBack && (
            <button onClick={onBack} style={{ padding: '10px 24px', background: 'rgba(0,0,0,0.08)', color: '#333', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>
              ← Retour
            </button>
          )}
        </div>

        <div id="poster" style={{ width: 794, minHeight: 1123, background: 'white', boxShadow: '0 8px 48px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          <div style={{ background: `linear-gradient(135deg, ${clubColor} 0%, ${clubColor}cc 100%)`, padding: '40px 48px', display: 'flex', alignItems: 'center', gap: 32, minHeight: 160 }}>
            {clubLogo && (
              <img src={clubLogo} alt="" style={{ width: 90, height: 90, borderRadius: 16, objectFit: 'cover', background: 'white', padding: 4, flexShrink: 0 }} />
            )}
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>{clubName}</div>
              <div style={{ fontSize: 42, fontWeight: 900, color: 'white', lineHeight: 1.1 }}>{tournament.name}</div>
              {date && <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', marginTop: 10, fontWeight: 500 }}>📅 {date}</div>}
              {tournament.location && <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>📍 {tournament.location}</div>}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 48px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 12, textAlign: 'center' }}>
              Suivez le tournoi en direct 📱
            </div>
            <div style={{ fontSize: 15, color: '#64748b', marginBottom: 48, textAlign: 'center', maxWidth: 420, lineHeight: 1.6 }}>
              Scannez le QR code avec votre téléphone pour accéder aux résultats, classements et matchs en temps réel
            </div>
            {qrDataUrl && (
              <div style={{ padding: 20, background: 'white', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,0,0,0.12)', border: `4px solid ${clubColor}` }}>
                <img src={qrDataUrl} alt="QR Code" style={{ width: 240, height: 240, display: 'block' }} />
              </div>
            )}
          </div>

          <div style={{ background: '#0a0e1a', padding: '24px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, background: '#a3e635', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚡</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'white', letterSpacing: 1 }}>FOOTPLANNER</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>footplanner.fr</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#475569', fontStyle: 'italic' }}>
              Gérez vos tournois comme un pro
            </div>
          </div>
        </div>

        <style>{`
          @media print {
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body > * { display: none !important; }
            #poster { display: flex !important; flex-direction: column; position: fixed; left: 0; top: 0; width: 210mm; min-height: 297mm; box-shadow: none; margin: 0; }
            @page { size: A4 portrait; margin: 0; }
          }
        `}</style>
      </div>
    );
  }