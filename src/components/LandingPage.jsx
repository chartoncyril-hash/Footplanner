import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const SCREENSHOTS = {
  dashboard: 'https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/screenshots/dashboard_tournois_2.png',
  calendrier: 'https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/screenshots/calendrier.png',
  classement: 'https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/screenshots/classement.png',
  licencies: 'https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/screenshots/composition_equipe.png',
  sponsors: 'https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/screenshots/sponsors_et_partenaire.png',
  inscriptions: 'https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/screenshots/suivi_des_inscriptions.png',
  regie: 'https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/screenshots/reegie_sponsor.png',
  mobile: 'https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/screenshots/mobile.png',
  format: 'https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/screenshots/format.png',
  tablemarque: 'https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/screenshots/table_de_marque.png',
};

export function LandingPage({ onLogin }) {
  const { signIn, signUp } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeFeature, setActiveFeature] = useState(0);
  const [authMode, setAuthMode] = useState(null);
  const [spaceMode, setSpaceMode] = useState('club'); // 'club' | 'licencie'
  const [form, setForm] = useState({ email: '', emailConfirm: '', password: '', clubName: '', tournoiCount: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setError('');
    if (authMode === 'signup') {
      if (!form.clubName.trim()) return setError('Le nom du club est obligatoire.');
      if (!form.email.trim()) return setError('Email obligatoire.');
      if (form.email.trim() !== form.emailConfirm.trim()) return setError('Les emails ne correspondent pas.');
      if (form.password.length < 6) return setError('Mot de passe minimum 6 caractères.');
    }
    setLoading(true);
    try {
      if (authMode === 'signup') await signUp({ email: form.email.trim(), password: form.password, clubName: form.clubName.trim() });
      else {
        localStorage.setItem('fp_space_mode', spaceMode);
        await signIn({ email: form.email.trim(), password: form.password });
      }
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const openAuth = (mode, space = 'club') => {
    setAuthMode(mode);
    setSpaceMode(space);
    setTimeout(() => document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div style={{ background: '#060a12', color: '#f1f5f9', fontFamily: "'Inter', system-ui, sans-serif", overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(6,10,18,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/logo%20app/8891B8C3-D2AB-4CE4-AA8B-5A740A9FD062.png" alt="FootPlanner" style={{ height:44, width:'auto', objectFit:'contain' }} />
          <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: -0.5 }}>FOOT<span style={{ color: '#a3e635' }}>PLANNER</span></span>
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            <a onClick={() => scrollTo('club')} style={{ color: '#94a3b8', fontSize: 14, cursor: 'pointer', textDecoration: 'none' }}>Gestion de club</a>
            <a onClick={() => scrollTo('tournois')} style={{ color: '#94a3b8', fontSize: 14, cursor: 'pointer', textDecoration: 'none' }}>Tournois</a>
            <a onClick={() => scrollTo('mobile')} style={{ color: '#94a3b8', fontSize: 14, cursor: 'pointer', textDecoration: 'none' }}>Mobile</a>
          </div>
        )}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => openAuth('signin', 'licencie')} style={{ padding:'9px 16px', background:'rgba(34,211,238,0.1)', color:'#22d3ee', border:'1px solid rgba(34,211,238,0.3)', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer' }}>
            👤 Espace licencié
          </button>
          <button onClick={() => openAuth('signup', 'club')} style={{ padding:'9px 16px', background:'#a3e635', color:'#060a12', border:'none', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer' }}>
            🏆 Espace club
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: isMobile ? '60px 24px 40px' : '100px 40px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 40 : 80, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(163,230,53,0.1)', border: '1px solid rgba(163,230,53,0.2)', borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#a3e635', letterSpacing: 1, marginBottom: 24 }}>
              ⚽ BETA GRATUITE — TOUTES FONCTIONNALITÉS INCLUSES
            </div>
            <h1 style={{ fontSize: isMobile ? 36 : 52, fontWeight: 900, lineHeight: 1.1, marginBottom: 20, letterSpacing: -1 }}>
              Gérez votre club.<br />
              <span style={{ color: '#a3e635' }}>Organisez vos tournois.</span>
            </h1>
            <p style={{ fontSize: 17, color: '#94a3b8', lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}>
              FootPlanner réunit tout ce dont un club de football a besoin : gestion des licenciés, sponsors, compositions tactiques, et organisation complète de tournois avec classements en direct.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => openAuth('signup')} style={{ padding: '14px 28px', background: '#a3e635', color: '#060a12', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
                Créer mon espace club →
              </button>
              <button onClick={() => scrollTo('tournois')} style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.06)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
                Voir les fonctionnalités
              </button>
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 32, flexWrap: 'wrap' }}>
              {['100% gratuit en beta', 'Aucune carte requise', '14 966 clubs FFF intégrés'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
                  <span style={{ color: '#a3e635' }}>✓</span> {f}
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -20, background: 'radial-gradient(ellipse at center, rgba(163,230,53,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', position: 'relative' }}>
              <img src="https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/screenshoot/dashboard%20dournois.png" alt="Dashboard FootPlanner" style={{ width: '200%', maxWidth: 'none', display: 'block', borderRadius: 16 }} />
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <div style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '28px 40px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '2fr 2fr' : 'repeat(4, 1fr)', gap: 24, textAlign: 'center' }}>
          {[{ v: '14 966', l: 'Clubs FFF intégrés' }, { v: '∞', l: 'Tournois illimités' }, { v: '6', l: 'Modules de gestion' }, { v: '100%', l: 'Gratuit en beta' }].map(s => (
            <div key={s.l}>
              <div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 900, color: '#a3e635', marginBottom: 4 }}>{s.v}</div>
              <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION GESTION DE CLUB */}
      <section id="club" style={{ padding: isMobile ? '60px 24px' : '100px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#818cf8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
            🏟️ Gestion de club
          </div>
          <h2 style={{ fontSize: isMobile ? 28 : 40, fontWeight: 900, marginBottom: 16, letterSpacing: -0.5 }}>
            Bien plus qu'un outil de tournoi
          </h2>
          <p style={{ fontSize: 16, color: '#94a3b8', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            FootPlanner centralise toute la vie de votre club en un seul endroit. Des licenciés aux sponsors, en passant par les compositions tactiques.
          </p>
        </div>

        {/* MODULES GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24, marginBottom: 48 }}>

          {/* Licenciés */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ padding: '28px 28px 0' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#34d399', marginBottom: 16 }}>👥 LICENCIÉS & ÉQUIPES</div>
              <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10, color: '#f1f5f9' }}>Gérez vos joueurs et leur conformité</h3>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>Fiches licenciés complètes, suivi des documents (licence, certificat médical, assurance), dashboard de conformité et affectation aux équipes par catégorie.</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                {['Dashboard conformité', 'Documents & alertes', 'Équipes par catégorie'].map(t => (
                  <span key={t} style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 20, color: '#34d399' }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ background: 'linear-gradient(180deg, transparent, rgba(52,211,153,0.03))', borderTop: '1px solid rgba(255,255,255,0.04)', margin: '0 28px', paddingTop: 20, paddingBottom: 28 }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Conformité du club</span>
                  <span style={{ fontSize: 13, color: '#34d399', fontWeight: 700 }}>92%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 16 }}>
                  <div style={{ width: '92%', height: '100%', background: 'linear-gradient(90deg, #34d399, #a3e635)', borderRadius: 3 }} />
                </div>
                {[{ label: 'Licence', status: '🟢', n: '48/50' }, { label: 'Certificat médical', status: '🟠', n: '44/50' }, { label: 'Assurance', status: '🟢', n: '50/50' }].map(d => (
                  <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
                    <span style={{ color: '#64748b' }}>{d.status} {d.label}</span>
                    <span style={{ color: '#94a3b8' }}>{d.n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sponsors */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ padding: '28px 28px 0' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#fbbf24', marginBottom: 16 }}>🤝 SPONSORS & PARTENAIRES</div>
              <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10, color: '#f1f5f9' }}>CRM sponsors intégré</h3>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>Suivez vos contrats, alertes d'expiration, CA sponsoring et gérez vos partenaires commerciaux depuis un tableau de bord dédié.</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                {['Suivi contrats', 'Alertes 60j', 'CA total'].map(t => (
                  <span key={t} style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 20, color: '#fbbf24' }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ padding: '0 28px 28px' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {[{ v: '6', l: 'Actifs', c: '#34d399' }, { v: '2500€', l: 'CA total', c: '#a3e635' }, { v: '1', l: 'Expire bientôt', c: '#fb7185' }, { v: '2', l: 'En négo', c: '#f59e0b' }].map(s => (
                    <div key={s.l} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: s.c }}>{s.v}</div>
                      <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                {[{ name: 'CORRAND', type: 'Or', amount: '1500€', status: '🟢' }, { name: 'ADLM', type: 'Argent', amount: '800€', status: '🟠' }].map(s => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤝</div>
                    <span style={{ color: '#f1f5f9', fontWeight: 600, flex: 1 }}>{s.name}</span>
                    <span style={{ color: '#64748b' }}>{s.type}</span>
                    <span style={{ color: '#a3e635', fontWeight: 700 }}>{s.amount}</span>
                    <span>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Compositions pleine largeur */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: isMobile ? 24 : 40, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 40, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#818cf8', marginBottom: 16 }}>⚽ COMPOSITIONS & TACTIQUE</div>
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10, color: '#f1f5f9' }}>Terrain interactif avec vos licenciés</h3>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>Sélectionnez vos joueurs, choisissez votre formation (4-3-3, 4-4-2...) et positionnez-les sur le terrain. Sauvegardez et partagez vos compositions.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Foot à 5, 8 et 11', 'Drag & drop', 'Formations multiples', 'Sauvegarde BDD'].map(t => (
                <span key={t} style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.15)', borderRadius: 20, color: '#818cf8' }}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 20, border: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
            <svg viewBox="0 0 300 200" style={{ width: '100%', borderRadius: 8 }}>
              <rect width="300" height="200" fill="#2d5a27" rx="6" />
              <rect x="8" y="8" width="284" height="184" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" rx="3" />
              <line x1="8" y1="100" x2="292" y2="100" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <circle cx="150" cy="100" r="28" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <rect x="100" y="8" width="100" height="44" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <rect x="100" y="148" width="100" height="44" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              {[{x:150,y:178,c:'#f59e0b',l:'GK'},{x:80,y:148,c:'#3b82f6',l:'DEF'},{x:150,y:142,c:'#3b82f6',l:'DEF'},{x:220,y:148,c:'#3b82f6',l:'DEF'},{x:100,y:105,c:'#10b981',l:'MID'},{x:150,y:100,c:'#10b981',l:'MID'},{x:200,y:105,c:'#10b981',l:'MID'},{x:110,y:58,c:'#ef4444',l:'ATT'},{x:150,y:52,c:'#ef4444',l:'ATT'},{x:190,y:58,c:'#ef4444',l:'ATT'}].map((p,i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="12" fill={p.c} stroke="white" strokeWidth="1.5" />
                  <text x={p.x} y={p.y+4} textAnchor="middle" fill="white" fontSize="7" fontWeight="700">{p.l}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </section>

      {/* SECTION TOURNOIS */}
      <section id="tournois" style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: isMobile ? '60px 24px' : '100px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#a3e635', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>🏆 Gestion de tournois</div>
            <h2 style={{ fontSize: isMobile ? 28 : 40, fontWeight: 900, marginBottom: 16, letterSpacing: -0.5 }}>Tout pour organiser votre tournoi</h2>
            <p style={{ fontSize: 16, color: '#94a3b8', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>De la création des poules à la finale, en passant par les scores en direct et l'affichage grand écran pour les spectateurs.</p>
          </div>

          {/* Features tabs */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
            {[
              { i: 0, label: '📋 Calendrier', desc: 'Génération automatique' },
              { i: 1, label: '🏅 Classement', desc: 'Mis à jour en direct' },
              { i: 2, label: '📝 Inscriptions', desc: 'Page publique' },
              { i: 3, label: '📺 Régie', desc: 'Grand écran' },
              { i: 4, label: '🏷️ Table de marque', desc: 'Accueil équipes' },
            ].map(f => (
              <button key={f.i} onClick={() => setActiveFeature(f.i)} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: activeFeature === f.i ? '#a3e635' : 'rgba(255,255,255,0.05)', color: activeFeature === f.i ? '#060a12' : '#94a3b8', fontWeight: activeFeature === f.i ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Feature detail */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.6fr', gap: 40, alignItems: 'center' }}>
            <div>
              {activeFeature === 0 && <>
                <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: '#f1f5f9' }}>Calendrier généré automatiquement</h3>
                <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>Définissez vos poules, créneaux et terrains. FootPlanner génère l'intégralité du planning en un clic, avec gestion des décalages en temps réel.</p>
                {['Génération automatique serpentin', 'Décalage planning ±5/10 min', 'Export PDF affichage terrain', 'Gestion multi-terrains'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, fontSize: 14, color: '#94a3b8' }}>
                    <span style={{ color: '#a3e635', flexShrink: 0 }}>✓</span> {f}
                  </div>
                ))}
              </>}
              {activeFeature === 1 && <>
                <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: '#f1f5f9' }}>Classements en temps réel</h3>
                <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>Chaque score validé met à jour instantanément le classement. Poules, phases finales et critères de départage personnalisables.</p>
                {['Mise à jour instantanée', 'Critères de départage custom', 'Champions League / Europa', 'Phases finales auto'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, fontSize: 14, color: '#94a3b8' }}>
                    <span style={{ color: '#a3e635', flexShrink: 0 }}>✓</span> {f}
                  </div>
                ))}
              </>}
              {activeFeature === 2 && <>
                <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: '#f1f5f9' }}>Inscriptions en ligne</h3>
                <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>Page publique brandée à votre couleur. Les équipes s'inscrivent elles-mêmes, vous validez ou refusez depuis votre tableau de bord.</p>
                {['Page publique personnalisée', 'Frais d\'inscription & IBAN', 'Validation manuelle', 'Notifications email'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, fontSize: 14, color: '#94a3b8' }}>
                    <span style={{ color: '#a3e635', flexShrink: 0 }}>✓</span> {f}
                  </div>
                ))}
              </>}
              {activeFeature === 3 && <>
                <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: '#f1f5f9' }}>Mode régie grand écran</h3>
                <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>Projetez les scores en direct, classements et sponsors sur grand écran. Rotation automatique des slides, défilement des sponsors.</p>
                {['Affichage 1080p/4K', 'Rotation automatique', 'Défilement sponsors', 'QR code spectateurs'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, fontSize: 14, color: '#94a3b8' }}>
                    <span style={{ color: '#a3e635', flexShrink: 0 }}>✓</span> {f}
                  </div>
                ))}
              </>}
              {activeFeature === 4 && <>
                <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: '#f1f5f9' }}>Table de marque & accueil</h3>
                <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>Gérez l'arrivée des équipes, les maillots, paiements et joueurs. Une vue d'ensemble pour une organisation parfaite le jour J.</p>
                {['Arrivée équipes en temps réel', 'Suivi paiements', 'Gestion des joueurs', 'Couleurs de maillots'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, fontSize: 14, color: '#94a3b8' }}>
                    <span style={{ color: '#a3e635', flexShrink: 0 }}>✓</span> {f}
                  </div>
                ))}
              </>}
            </div>
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 48px rgba(0,0,0,0.4)', background: '#0f172a' }}>
              {activeFeature === 0 && (
                <div style={{ padding: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>📋 Calendrier — 32 matchs programmés</div>
                  {[{t:'09:00', h:'AS MONACO FC (1)', s:'3 - 1', a:'RC MTP CEVENNES (2)'},{t:'09:00', h:'AS MONACO FC (2)', s:'1 - 1', a:'RC MTP CEVENNES (1)'},{t:'09:15', h:'OLYMPIQUE LYONNAIS (1)', s:'2 - 0', a:'GIRONDINS BORDEAUX (2)'},{t:'09:30', h:'AS MONACO FC (1)', s:'3 - 0', a:'RC MTP CEVENNES (1)'},{t:'09:30', h:'OLYMPIQUE MARSEILLE (1)', s:'1 - 0', a:'LOSC LILLE (2)'}].map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
                      <span style={{ color: '#475569', width: 40, flexShrink: 0 }}>{m.t}</span>
                      <span style={{ flex: 1, color: '#94a3b8', fontSize: 11 }}>{m.h}</span>
                      <span style={{ fontWeight: 900, color: '#a3e635', fontSize: 14, width: 50, textAlign: 'center' }}>{m.s}</span>
                      <span style={{ flex: 1, color: '#94a3b8', fontSize: 11, textAlign: 'right' }}>{m.a}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeFeature === 1 && (
                <div style={{ padding: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>🏅 Classement — Poule A</div>
                  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: '#475569', fontWeight: 700 }}>
                    <span style={{ width: 30 }}>#</span><span style={{ flex: 1 }}>Équipe</span><span style={{ width: 35, textAlign: 'center' }}>J</span><span style={{ width: 35, textAlign: 'center' }}>V</span><span style={{ width: 35, textAlign: 'center' }}>D</span><span style={{ width: 45, textAlign: 'center' }}>+/-</span><span style={{ width: 40, textAlign: 'center', color: '#facc15' }}>Pts</span>
                  </div>
                  {[{r:1,n:'A.S. MONACO F.C.',j:3,v:3,d:0,diff:'+7',pts:9,c:'#a3e635'},{r:2,n:'RC MONTPELLIER',j:3,v:0,d:2,diff:'-2',pts:2,c:'#64748b'},{r:3,n:'A.S. MONACO F.C.',j:3,v:0,d:2,diff:'-2',pts:2,c:'#64748b'},{r:4,n:'RC MONTPELLIER',j:3,v:0,d:1,diff:'-3',pts:2,c:'#64748b'}].map(r => (
                    <div key={r.r} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 12 }}>
                      <span style={{ width: 30, fontWeight: 900, color: r.c }}>{r.r}</span>
                      <span style={{ flex: 1, color: '#f1f5f9', fontWeight: 600, fontSize: 11 }}>{r.n}</span>
                      <span style={{ width: 35, textAlign: 'center', color: '#64748b' }}>{r.j}</span>
                      <span style={{ width: 35, textAlign: 'center', color: '#64748b' }}>{r.v}</span>
                      <span style={{ width: 35, textAlign: 'center', color: '#64748b' }}>{r.d}</span>
                      <span style={{ width: 45, textAlign: 'center', color: r.diff.startsWith('+') ? '#34d399' : '#fb7185', fontWeight: 700 }}>{r.diff}</span>
                      <span style={{ width: 40, textAlign: 'center', color: '#facc15', fontWeight: 900 }}>{r.pts}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeFeature === 2 && (
                <div style={{ padding: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 }}>📝 Suivi des inscriptions</div>
                  {[{club:'FC NICE', status:'Validée', cat:'U11 — Équipe 1', c:'#34d399'},{club:'FC BOURG', status:'En attente', cat:'U11 — Équipe 1', c:'#f59e0b'},{club:'AS MACON', status:'Validée', cat:'U11 — Équipe 1', c:'#34d399'}].map((ins, i) => (
                    <div key={i} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{ins.club}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: ins.c, background: ins.c + '15', padding: '2px 8px', borderRadius: 10 }}>{ins.status}</span>
                      </div>
                      <span style={{ fontSize: 11, color: '#475569' }}>{ins.cat}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeFeature === 3 && (
                <div style={{ background: '#0a0e1a', padding: 24, minHeight: 220 }}>
                  <div style={{ fontSize: 11, color: '#475569', marginBottom: 20, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 2 }}>Tournois de printemps</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[{h:'AS MONACO FC', sh:1, sa:0, a:'PARIS SG', t:'T2'},{h:'LOSC LILLE', sh:0, sa:2, a:'OL', t:'T1'}].map((m,i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 14 }}>
                        <div style={{ fontSize: 10, color: '#fb7185', fontWeight: 700, marginBottom: 8 }}>● LIVE — {m.t}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: '#f1f5f9', fontWeight: 700, flex: 1 }}>{m.h}</span>
                          <span style={{ fontSize: 22, fontWeight: 900, color: '#a3e635', margin: '0 8px' }}>{m.sh}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                          <span style={{ fontSize: 11, color: '#f1f5f9', fontWeight: 700, flex: 1 }}>{m.a}</span>
                          <span style={{ fontSize: 22, fontWeight: 900, color: '#a3e635', margin: '0 8px' }}>{m.sa}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeFeature === 4 && (
                <div style={{ padding: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>🏷️ Table de marque — Accueil</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                    {[{v:'1/2',l:'Arrivées',c:'#34d399'},{v:'2',l:'Paiements',c:'#f59e0b'},{v:'2',l:'Équipes',c:'#818cf8'}].map(s => (
                      <div key={s.l} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: s.c }}>{s.v}</div>
                        <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                  {[{club:'FC NICE',cat:'U11',eq:'Équipe 1',status:'Arrivée',c:'#34d399'},{club:'FC BOURG',cat:'U11',eq:'Équipe 1',status:'Attendue',c:'#f59e0b'}].map((t,i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, marginBottom: 8, fontSize: 12 }}>
                      <span style={{ fontSize: 18 }}>{t.status === 'Arrivée' ? '✅' : '⭕'}</span>
                      <span style={{ flex: 1, color: '#f1f5f9', fontWeight: 700 }}>{t.club}</span>
                      <span style={{ color: '#475569' }}>{t.cat}</span>
                      <span style={{ background: 'rgba(129,140,248,0.1)', color: '#818cf8', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>{t.eq}</span>
                      <span style={{ color: t.c, fontWeight: 700 }}>{t.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION MOBILE */}
      <section id="mobile" style={{ padding: isMobile ? '60px 24px' : '100px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div style={{ order: isMobile ? 2 : 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 280 }}>
              <div style={{ position: 'absolute', inset: -30, background: 'radial-gradient(ellipse at center, rgba(163,230,53,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <img src="https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/screenshoot/Capture%20decran.png" alt="FootPlanner mobile" style={{ width: '100%', borderRadius: 32, boxShadow: '0 40px 80px rgba(0,0,0,0.6)', border: '4px solid rgba(255,255,255,0.1)' }} />
            </div>
          </div>
          <div style={{ order: isMobile ? 1 : 2 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#a3e635', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>📱 Application mobile</div>
            <h2 style={{ fontSize: isMobile ? 28 : 40, fontWeight: 900, marginBottom: 16, letterSpacing: -0.5 }}>Votre tournoi dans la poche</h2>
            <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.7, marginBottom: 32 }}>Les spectateurs suivent les scores en direct depuis leur téléphone. Classements live, résultats et programme du tournoi accessibles en un scan de QR code.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { icon: '📷', title: 'Accès QR Code instantané', desc: 'Les spectateurs scannent le QR et accèdent immédiatement au tournoi sans inscription.' },
                { icon: '⚡', title: 'Scores en temps réel', desc: 'Chaque but marqué s\'affiche instantanément sur tous les téléphones.' },
                { icon: '🏅', title: 'Classements et programme', desc: 'Tous les matchs, résultats et classements accessibles depuis le téléphone.' },
              ].map(f => (
                <div key={f.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(163,230,53,0.1)', border: '1px solid rgba(163,230,53,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BASE FFF */}
      <section style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: isMobile ? '40px 24px' : '60px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>🗂️ Base de données FFF</div>
          <h3 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 900, marginBottom: 12 }}>14 966 clubs français intégrés</h3>
          <p style={{ fontSize: 15, color: '#64748b', maxWidth: 560, margin: '0 auto 24px', lineHeight: 1.7 }}>Recherchez n'importe quel club affilié à la FFF par nom, district ou ville. Ajoutez-les en un clic à votre bibliothèque avec logo et infos pré-remplies.</p>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 20px', maxWidth: 500, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 16 }}>🔍</span>
            <span style={{ color: '#475569', fontSize: 14 }}>Rechercher un club (ex: US Feillens, OL, PSG...)</span>
            <div style={{ marginLeft: 'auto', padding: '4px 12px', background: '#a3e635', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#060a12' }}>14 966</div>
          </div>
        </div>
      </section>

      {/* CTA BETA */}
      <section id="auth" style={{ padding: isMobile ? '60px 24px' : '100px 40px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#a3e635', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 20 }}>🚀 Beta gratuite</div>
          <h2 style={{ fontSize: isMobile ? 28 : 44, fontWeight: 900, marginBottom: 16, letterSpacing: -0.5 }}>
            Rejoignez la beta.<br />
            <span style={{ color: '#a3e635' }}>C'est gratuit, et ça le restera.</span>
          </h2>
          <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.7, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
            FootPlanner est en version beta. Toutes les fonctionnalités sont accessibles gratuitement. Vos retours nous aident à construire l'outil de référence des clubs de football.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
            {[{v:'100%',l:'Gratuit en beta'},{v:'∞',l:'Tournois illimités'},{v:'0€',l:'Sans engagement'},{v:'24/7',l:'Accessible partout'}].map(s => (
              <div key={s.l} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 16px' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#a3e635', marginBottom: 4 }}>{s.v}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => openAuth('signup', 'club')} style={{ padding: '16px 32px', background: '#a3e635', color: '#060a12', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 16, cursor: 'pointer', boxShadow: '0 0 40px rgba(163,230,53,0.2)' }}>
              🏆 Créer mon espace club →
            </button>
            <button onClick={() => openAuth('signin', 'licencie')} style={{ padding: '16px 32px', background: 'rgba(34,211,238,0.1)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.3)', borderRadius: 12, fontWeight: 900, fontSize: 16, cursor: 'pointer' }}>
              👤 Espace licencié →
            </button>
          </div>
          <div style={{ marginTop: 16, fontSize: 13, color: '#475569' }}>Aucune carte bancaire · Accès immédiat · Support réactif</div>

          {authMode && (
            <div style={{ marginTop: 40, background: 'rgba(255,255,255,0.03)', border: `1px solid ${spaceMode==='licencie'?'rgba(34,211,238,0.2)':'rgba(163,230,53,0.2)'}`, borderRadius: 16, padding: 32, maxWidth: 400, margin: '40px auto 0' }}>
              {/* Badge espace */}
              <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
                <span style={{ fontSize:12, fontWeight:800, padding:'4px 14px', borderRadius:20, background: spaceMode==='licencie'?'rgba(34,211,238,0.12)':'rgba(163,230,53,0.12)', color: spaceMode==='licencie'?'#22d3ee':'#a3e635', border: `1px solid ${spaceMode==='licencie'?'rgba(34,211,238,0.3)':'rgba(163,230,53,0.3)'}` }}>
                  {spaceMode==='licencie' ? '👤 Espace Licencié' : '🏆 Espace Club'}
                </span>
              </div>
              {/* Switcher espace */}
              <div style={{ display:'flex', gap:6, marginBottom:20, padding:'4px', background:'rgba(255,255,255,0.04)', borderRadius:10 }}>
                <button onClick={() => { setSpaceMode('club'); setAuthMode('signup'); setError(''); }} style={{ flex:1, padding:'8px', borderRadius:8, border:'none', background: spaceMode==='club'?'#a3e635':'transparent', color: spaceMode==='club'?'#060a12':'#64748b', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>🏆 Club</button>
                <button onClick={() => { setSpaceMode('licencie'); setAuthMode('signin'); setError(''); }} style={{ flex:1, padding:'8px', borderRadius:8, border:'none', background: spaceMode==='licencie'?'#22d3ee':'transparent', color: spaceMode==='licencie'?'#060a12':'#64748b', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>👤 Licencié</button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                {(spaceMode==='club' ? [{v:'signup',l:'Créer un compte'},{v:'signin',l:'Se connecter'}] : [{v:'signin',l:'Se connecter'}]).map(m => (
                  <button key={m.v} onClick={() => { setAuthMode(m.v); setError(''); }} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: authMode === m.v ? (spaceMode==='licencie'?'#22d3ee':'#a3e635') : 'rgba(255,255,255,0.06)', color: authMode === m.v ? '#060a12' : '#94a3b8', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{m.l}</button>
                ))}
              </div>
              {error && <div style={{ padding: '10px 14px', background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.2)', borderRadius: 8, fontSize: 13, color: '#fb7185', marginBottom: 16 }}>{error}</div>}
              {authMode === 'signup' && (
                <>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Nom du club *</div>
                  <input type="text" placeholder="Ex: US Feillens, FC Lyon..." value={form.clubName} onChange={e => setForm(p => ({...p, clubName: e.target.value}))} style={{ width: '100%', padding: '12px 14px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: 14, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </>
              )}
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Email *</div>
              <input type="email" placeholder="contact@monclub.fr" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} style={{ width: '100%', padding: '12px 14px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: 14, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit' }} />
              {authMode === 'signup' && (
                <>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Confirmer l'email *</div>
                  <input type="email" placeholder="contact@monclub.fr" value={form.emailConfirm} onChange={e => setForm(p => ({...p, emailConfirm: e.target.value}))} style={{ width: '100%', padding: '12px 14px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: 14, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </>
              )}
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Mot de passe *</div>
              <input type="password" placeholder="Minimum 6 caractères" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} onKeyDown={e => e.key === 'Enter' && handleAuth()} style={{ width: '100%', padding: '12px 14px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: 14, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit' }} />
              {authMode === 'signup' && (
                <>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Tournois organisés par an <span style={{ color: '#334155' }}>(facultatif)</span></div>
                  <select value={form.tournoiCount} onChange={e => setForm(p => ({...p, tournoiCount: e.target.value}))} style={{ width: '100%', padding: '12px 14px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: form.tournoiCount ? '#f1f5f9' : '#475569', fontSize: 14, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit' }}>
                    <option value="" style={{background:'#1e293b'}}>Sélectionner...</option>
                    <option value="0" style={{background:'#1e293b'}}>Aucun pour l'instant</option>
                    <option value="1" style={{background:'#1e293b'}}>1 tournoi</option>
                    <option value="2-3" style={{background:'#1e293b'}}>2 à 3 tournois</option>
                    <option value="4-5" style={{background:'#1e293b'}}>4 à 5 tournois</option>
                    <option value="6+" style={{background:'#1e293b'}}>6 tournois et plus</option>
                  </select>
                </>
              )}
              <button onClick={handleAuth} disabled={loading} style={{ width: '100%', padding: '14px', background: spaceMode==='licencie'?'#22d3ee':'#a3e635', color: '#060a12', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
                {loading ? 'Chargement...' : authMode === 'signup' ? 'Créer mon espace club' : spaceMode==='licencie' ? 'Accéder à mon espace licencié' : 'Se connecter'}
              </button>
              {spaceMode === 'licencie' && (
                <p style={{ fontSize:11, color:'#475569', textAlign:'center', marginTop:10, lineHeight:1.5 }}>
                  L'accès licencié se fait sur invitation de votre club.<br/>Utilisez l'email avec lequel vous avez été invité.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#030507', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/logo%20app/8891B8C3-D2AB-4CE4-AA8B-5A740A9FD062.png" alt="FootPlanner" style={{ height: 28, width: 'auto' }} />
            <span style={{ fontWeight: 900, fontSize: 15 }}>FOOT<span style={{ color: '#a3e635' }}>PLANNER</span></span>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <a href="/?page=cgu" style={{ color: '#475569', fontSize: 13, textDecoration: 'none' }}>CGU</a>
            <a href="/?page=privacy" style={{ color: '#475569', fontSize: 13, textDecoration: 'none' }}>Confidentialité</a>
            <a href="mailto:contact@footplanner.fr" style={{ color: '#475569', fontSize: 13, textDecoration: 'none' }}>contact@footplanner.fr</a>
          </div>
          <div style={{ fontSize: 12, color: '#334155' }}>© 2026 FootPlanner · Fait avec ⚽ en France</div>
        </div>
      </footer>

    </div>
  );
}
