import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

// ============================================================
// LandingPage — page marketing + auth (signin / signup)
// ============================================================
export function LandingPage() {
  const { signIn, signUp } = useAuth();
  const [authMode, setAuthMode] = useState(null); // null | 'signin' | 'signup'
  const [form, setForm] = useState({ club: '', firstName: '', lastName: '', email: '', phone: '', password: '', password2: '', tournoisPerYear: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSignUp = async () => {
    if (!form.club.trim()) {
      setError('Le nom du club est obligatoire.');
      return;
    }
    if (!form.firstName.trim() || !form.email.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres.');
      return;
    }
    if (form.password !== form.password2) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setSubmitting(true); setError('');
    try {
      await signUp({ email: form.email.trim(), password: form.password, firstName: form.firstName.trim(), lastName: form.lastName.trim(), club: form.club.trim(), phone: form.phone.trim(), tournoisPerYear: form.tournoisPerYear });
        setSuccess('Compte cree avec succes ! Verifiez votre email pour confirmer votre inscription.');
      } catch (e) {
      setError(e.message || 'Erreur lors de l\'inscription.');
    } finally { setSubmitting(false); }
  };

  const handleSignIn = async () => {
    if (!form.email.trim() || !form.password) {
      setError('Veuillez remplir email et mot de passe.');
      return;
    }
    setSubmitting(true); setError('');
    try {
      await signIn({ email: form.email.trim(), password: form.password });
    } catch (e) {
      setError(e.message || 'Erreur de connexion.');
    } finally { setSubmitting(false); }
  };

  // Scroll to section
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={S.page}>
      {/* NAV */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <div style={S.logo}><span style={{color:'#fff'}}>FOOT</span><span style={{color:'#a3e635'}}>PLANNER</span></div>
          <div style={S.navLinks}>
            <a style={S.navLink} onClick={() => scrollTo('features')}>Fonctionnalites</a>
            <a style={S.navLink} onClick={() => scrollTo('bigscreen')}>Grand ecran</a>
            <a style={S.navLink} onClick={() => scrollTo('formats')}>Formats</a>
          </div>
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <button style={S.btnGhost} onClick={() => { setAuthMode('signin'); scrollTo('auth'); }}>Se connecter</button>
            <button style={S.btnCyan} onClick={() => { setAuthMode('signup'); scrollTo('auth'); }}>Rejoindre la beta</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={S.hero}>
        <div style={S.container}>
          <div style={S.heroGrid}>
            <div>
              <div style={S.badge}><span style={S.badgeDot}></span>BETA OUVERTE — 100% gratuit</div>
              <h1 style={S.h1}>Vos tournois,<br/>sans <span style={{color:'#a3e635'}}>prise de tete.</span></h1>
              <p style={S.heroSub}>FootPlanner genere automatiquement vos poules, calendriers et phases finales. Vous gerez les scores en direct. Le classement se fait tout seul.</p>
              <div style={S.heroFeats}>
                {['Calendrier automatique','Scores en direct','Affichage grand ecran','Multi-categories','100% Cloud','Concu en France'].map(f => (
                  <div key={f} style={S.heroFeat}><span style={S.dot}></span>{f}</div>
                ))}
              </div>
              <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                <button style={S.btnCyanLg} onClick={() => { setAuthMode('signup'); scrollTo('auth'); }}>Demarrer gratuitement →</button>
                <button style={S.btnOutlineLg} onClick={() => scrollTo('features')}>Voir les fonctionnalites</button>
              </div>
            </div>
            {/* MOCKUP */}
            <div style={S.mockupWrap}>
              <div style={S.browser}>
                <div style={S.browserBar}>
                  <div style={{...S.browserDot,background:'#ff5f57'}}></div>
                  <div style={{...S.browserDot,background:'#febc2e'}}></div>
                  <div style={{...S.browserDot,background:'#28c840'}}></div>
                  <span style={S.browserUrl}>footplanner.fr/tournoi/summer-cup</span>
                </div>
                <div style={{padding:16}}>
                  <div style={S.mockStats}>
                    {[{v:'4',l:'En direct'},{v:'28',l:'Matchs'},{v:'16',l:'Equipes'},{v:'4',l:'Poules'}].map(s => (
                      <div key={s.l} style={S.mockStat}><div style={S.mockStatVal}>{s.v}</div><div style={S.mockStatLbl}>{s.l}</div></div>
                    ))}
                  </div>
                  <div style={S.mockLive}>
                    <div style={S.mockLiveHeader}><span style={S.mockLiveBadge}>EN DIRECT</span><span style={{fontSize:11,fontWeight:800,color:'#f1f5f9'}}>Matchs en cours</span></div>
                    {[{h:'OL Lyon',a:'Marseille',s:'2 - 1',ch:'#f59e0b',ca:'#a3e635',f:'T1'},{h:'Paris SG',a:'St-Etienne',s:'0 - 0',ch:'#ef4444',ca:'#34d399',f:'T2'}].map(m => (
                      <div key={m.f} style={S.mockMatch}>
                        <div style={S.mockTeam}><div style={{...S.mockCrest,background:m.ch}}>{m.h.slice(0,2).toUpperCase()}</div>{m.h}</div>
                        <div style={S.mockScore}>{m.s}</div>
                        <div style={S.mockTeam}><div style={{...S.mockCrest,background:m.ca}}>{m.a.slice(0,2).toUpperCase()}</div>{m.a}</div>
                        <div style={S.mockField}>{m.f}</div>
                      </div>
                    ))}
                  </div>
                  <div style={S.mockStandings}>
                    <div style={{fontWeight:800,fontSize:11,color:'#a3e635',marginBottom:6}}>Classement — Poule A</div>
                    {[{n:'OL Lyon',p:9},{n:'Marseille',p:6},{n:'Paris SG',p:4},{n:'St-Etienne',p:1}].map((r,i) => (
                      <div key={r.n} style={S.mockRow}>
                        <span style={{width:16,fontWeight:900,color:i<2?'#a3e635':'#64748b',fontSize:10}}>{i+1}</span>
                        <span style={{flex:1,fontWeight:700,color:'#f1f5f9',fontSize:10}}>{r.n}</span>
                        <span style={{width:24,textAlign:'center',fontWeight:900,color:'#facc15',fontSize:10,fontFamily:"'JetBrains Mono',monospace"}}>{r.p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={S.glowLine}></div>

      {/* FEATURES */}
      <section id="features" style={S.section}>
        <div style={S.container}>
          <div style={S.sectionHeader}>
            <div style={S.sectionLabel}>Fonctionnalites</div>
            <h2 style={S.h2}>Tout ce qu'il faut. Rien de superflu.</h2>
            <p style={S.sectionSub}>FootPlanner gere l'ensemble de votre tournoi du tirage des poules au coup de sifflet final.</p>
          </div>
          <div style={S.featGrid}>
            {[
              {icon:'⚙️',c:'#a3e635',t:'Phases automatisees',d:'Poules, eliminatoires, finales... Generees automatiquement. Standard, Croise ou Champions League / Europa League.'},
              {icon:'📱',c:'#a3e635',t:'Scores en direct',d:'Saisissez les scores depuis votre telephone. Classements et qualifications se mettent a jour instantanement.'},
              {icon:'🖥️',c:'#f59e0b',t:'Affichage grand ecran',d:'Un ecran TV dans le hall ? FootPlanner affiche matchs en cours, classements et prochaines rencontres en mode regie.'},
              {icon:'📋',c:'#818cf8',t:'Multi-categories',d:'Gerez U7, U9, U11, U13 et Seniors dans le meme tournoi. Chaque categorie a ses propres poules et classements.'},
              {icon:'🏟️',c:'#34d399',t:'Gestion des terrains',d:'Attribuez les terrains aux matchs. En phase finale, choisissez quels terrains utiliser.'},
              {icon:'🤝',c:'#fb7185',t:'Gestion des sponsors',d:'Ajoutez vos partenaires. Leurs logos defilent sur l\'ecran de presentation.'},
            ].map(f => (
              <div key={f.t} style={S.featCard}>
                <div style={{...S.featIcon,background:`${f.c}15`,color:f.c}}>{f.icon}</div>
                <h3 style={S.featTitle}>{f.t}</h3>
                <p style={S.featDesc}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={S.glowLine}></div>

      {/* BIGSCREEN */}
      <section id="bigscreen" style={{...S.section,background:'#0c1120',borderTop:'1px solid rgba(255,255,255,0.06)',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={S.container}>
          <div style={S.heroGrid}>
            <div>
              <div style={S.sectionLabel}>Affichage live</div>
              <h2 style={S.h2}>Votre tournoi sur <span style={{color:'#a3e635'}}>grand ecran.</span></h2>
              <p style={{...S.sectionSub,marginBottom:32}}>Offrez a vos spectateurs une experience immersive. Scores en direct, classements et sponsors defilent automatiquement.</p>
              {['Grille adaptive : plusieurs matchs en simultane','Diaporama automatique (classements, resultats, prochains matchs)','Mode multi-fenetres : gerez ET diffusez en meme temps','Bandeau sponsors defilant'].map(f => (
                <div key={f} style={{display:'flex',alignItems:'center',gap:10,fontSize:14,fontWeight:600,marginBottom:10}}><span style={{color:'#a3e635'}}>✓</span>{f}</div>
              ))}
            </div>
            <div>
              <div style={S.mockTv}>
                <div style={{padding:12,display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  <div style={{gridColumn:'1/-1',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 8px',borderBottom:'1px solid rgba(255,255,255,0.04)',marginBottom:4}}>
                    <span style={{fontSize:14,fontWeight:900,color:'#a3e635'}}>SUMMER CUP 2026</span>
                    <span style={{fontSize:9,color:'#64748b',fontWeight:700}}>4 matchs en cours</span>
                  </div>
                  {[{h:'OL Lyon',a:'Paris SG',sh:3,sa:1,f:'T1'},{h:'Marseille',a:'St-Etienne',sh:2,sa:2,f:'T2'},{h:'Monaco',a:'Lille',sh:1,sa:0,f:'T3'},{h:'Rennes',a:'Nantes',sh:0,sa:1,f:'T4'}].map(m => (
                    <div key={m.f} style={S.tvMatch}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                        <span style={S.tvLive}>LIVE</span>
                        <span style={{fontSize:9,color:'#facc15',fontFamily:"'JetBrains Mono',monospace",fontWeight:800}}>{m.f}</span>
                      </div>
                      <div style={S.tvTeam}><span style={{fontWeight:800,fontSize:11}}>{m.h}</span><span style={S.tvScore}>{m.sh}</span></div>
                      <div style={{height:1,background:'rgba(255,255,255,0.06)',margin:'3px 0'}}></div>
                      <div style={S.tvTeam}><span style={{fontWeight:800,fontSize:11}}>{m.a}</span><span style={S.tvScore}>{m.sa}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={S.glowLine}></div>

      {/* FORMATS */}
      <section id="formats" style={S.section}>
        <div style={S.container}>
          <div style={S.sectionHeader}>
            <div style={S.sectionLabel}>Formats</div>
            <h2 style={S.h2}>Adapte a votre tournoi.</h2>
            <p style={S.sectionSub}>Petits tournois locaux ou grandes competitions. De 4 a 32 equipes.</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {[
              {i:'🏆',t:'Standard',d:'Croisement classique : 1er Poule A vs 2e Poule B.'},
              {i:'🔀',t:'Croise',d:'Chaque poule garde ses equipes en phase finale.'},
              {i:'⭐',t:'Champions / Europa League',d:'Deux coupes separees : les 1ers dans Champions, les 2es dans Europa.'},
              {i:'🥇',t:'Consolation 5e-8e',d:'Les perdants des quarts s\'affrontent pour le classement.'},
              {i:'🥉',t:'Petite finale',d:'Match pour la 3e place entre les perdants des demi-finales.'},
              {i:'📐',t:'Terrains configurables',d:'Choisissez quels terrains utiliser en phase finale.'},
            ].map(f => (
              <div key={f.t} style={S.formatCard}>
                <div style={{fontSize:28,flexShrink:0}}>{f.i}</div>
                <div><h3 style={{fontSize:15,fontWeight:800,marginBottom:4}}>{f.t}</h3><p style={{fontSize:12,color:'#94a3b8',lineHeight:1.5}}>{f.d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={S.glowLine}></div>

      {/* AUTH SECTION */}
      <section id="auth" style={{...S.section,background:'#0c1120',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{...S.container,maxWidth:authMode === 'signup' ? 1200 : 1200}}>
          <div style={S.heroGrid}>
            <div>
              <div style={S.sectionLabel}>Beta gratuite</div>
              <h2 style={S.h2}>Pret a simplifier vos <span style={{color:'#a3e635'}}>tournois ?</span></h2>
              <p style={{...S.sectionSub,marginBottom:32}}>Creez votre compte en 30 secondes. Aucune carte bancaire. Toutes les fonctionnalites sont accessibles gratuitement pendant la beta.</p>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
                {[{v:'100%',l:'Gratuit en beta'},{v:'∞',l:'Tournois illimites'},{v:'0',l:'Engagement requis'}].map(s => (
                  <div key={s.l} style={S.statCard}><div style={S.statVal}>{s.v}</div><div style={S.statLbl}>{s.l}</div></div>
                ))}
              </div>
            </div>
            <div>
              {/* TABS */}
              <div style={S.authCard}>
                <div style={S.authTabs}>
                  <button
                    style={{...S.authTab,...((!authMode || authMode==='signup') ? S.authTabActive : {})}}
                    onClick={() => { setAuthMode('signup'); setError(''); }}
                  >Creer un compte</button>
                  <button
                    style={{...S.authTab,...(authMode==='signin' ? S.authTabActive : {})}}
                    onClick={() => { setAuthMode('signin'); setError(''); }}
                  >Se connecter</button>
                </div>

                {error && <div style={S.error}>{error}</div>}
                {success && <div style={{...S.error,background:'rgba(34,211,238,0.1)',border:'1px solid rgba(34,211,238,0.3)',color:'#a3e635'}}>{success}</div>}

                    {(!authMode || authMode === 'signup') && (
                      <div>
                        <div style={S.formGroup}>
                          <label style={S.label}>Nom du club *</label>
                          <input style={S.input} placeholder="Ex: US Feillens, FC Manziat..." value={form.club} onChange={e => update('club', e.target.value)} />
                        </div>
                        <div style={S.formRow}>
                          <div style={S.formGroup}>
                            <label style={S.label}>Prenom *</label>
                            <input style={S.input} placeholder="Votre prenom" value={form.firstName} onChange={e => update('firstName', e.target.value)} />
                          </div>
                          <div style={S.formGroup}>
                            <label style={S.label}>Nom</label>
                            <input style={S.input} placeholder="Votre nom" value={form.lastName} onChange={e => update('lastName', e.target.value)} />
                          </div>
                        </div>
                        <div style={S.formGroup}>
                          <label style={S.label}>Adresse email *</label>
                          <input style={S.input} type="email" placeholder="vous@votreclub.fr" value={form.email} onChange={e => update('email', e.target.value)} />
                        </div>
                        <div style={S.formGroup}>
                          <label style={S.label}>Mot de passe *</label>
                          <input style={S.input} type="password" placeholder="Minimum 6 caracteres" value={form.password} onChange={e => update('password', e.target.value)} />
                        </div>
                        <div style={S.formGroup}>
                          <label style={S.label}>Confirmer le mot de passe *</label>
                          <input style={S.input} type="password" placeholder="Saisissez a nouveau le mot de passe" value={form.password2} onChange={e => update('password2', e.target.value)} />
                        </div>
                        <div style={S.formGroup}>
                          <label style={S.label}>Telephone</label>
                          <input style={S.input} type="tel" placeholder="06 12 34 56 78" value={form.phone} onChange={e => update('phone', e.target.value)} />
                        </div>
                        <div style={S.formGroup}>
                          <label style={S.label}>Combien de tournois organisez-vous par an ?</label>
                          <select style={S.input} value={form.tournoisPerYear} onChange={e => update('tournoisPerYear', e.target.value)}>
                            <option value="">Selectionnez...</option>
                            <option value="1">1 tournoi</option>
                            <option value="2-3">2 a 3 tournois</option>
                            <option value="4-6">4 a 6 tournois</option>
                            <option value="7+">7 tournois ou plus</option>
                          </select>
                        </div>
                        <button style={{...S.btnCyan,width:'100%',padding:'14px',fontSize:16,marginTop:8}} onClick={handleSignUp} disabled={submitting}>
                          {submitting ? 'Creation en cours...' : 'Creer mon compte gratuitement →'}
                        </button>
                        <div style={S.legal}>
                          En vous inscrivant, vous acceptez nos <a href="#" style={{color:'#a3e635'}}>conditions</a> et notre <a href="#" style={{color:'#a3e635'}}>politique de confidentialite</a>.
                        </div>
                      </div>
                    )}

                {authMode === 'signin' && (
                  <div>
                    <div style={S.formGroup}>
                      <label style={S.label}>Adresse email</label>
                      <input style={S.input} type="email" placeholder="vous@votreclub.fr" value={form.email} onChange={e => update('email', e.target.value)} />
                    </div>
                    <div style={S.formGroup}>
                      <label style={S.label}>Mot de passe</label>
                      <input style={S.input} type="password" placeholder="Votre mot de passe" value={form.password} onChange={e => update('password', e.target.value)} />
                    </div>
                    <button style={{...S.btnCyan,width:'100%',padding:'14px',fontSize:16,marginTop:8}} onClick={handleSignIn} disabled={submitting}>
                      {submitting ? 'Connexion en cours...' : 'Se connecter'}
                    </button>
                    <div style={{textAlign:'center',marginTop:12}}>
                      <a href="#" style={{fontSize:12,color:'#a3e635',fontWeight:600}}>Mot de passe oublie ?</a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={S.footer}>
        <div style={S.container}>
          <div style={S.footerGrid}>
            <div>
              <div style={S.logo}><span style={{color:'#fff'}}>FOOT</span><span style={{color:'#a3e635'}}>PLANNER</span></div>
              <p style={{fontSize:12,color:'#64748b',lineHeight:1.6,maxWidth:280,marginTop:8}}>La plateforme nouvelle generation pour organiser vos tournois de football.</p>
              <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#94a3b8',marginTop:12,fontWeight:600}}>🇫🇷 Concu et heberge en France</div>
            </div>
            <div>
              <h4 style={S.footerTitle}>Produit</h4>
              <a href="#features" style={S.footerLink}>Fonctionnalites</a>
              <a href="#formats" style={S.footerLink}>Formats</a>
              <a href="#" style={S.footerLink}>Tarifs</a>
            </div>
            <div>
              <h4 style={S.footerTitle}>Ressources</h4>
              <a href="#" style={S.footerLink}>Centre d'aide</a>
              <a href="#" style={S.footerLink}>FAQ</a>
              <a href="#" style={S.footerLink}>Blog</a>
            </div>
            <div>
              <h4 style={S.footerTitle}>Legal</h4>
              <a href="#" style={S.footerLink}>Conditions d'utilisation</a>
              <a href="#" style={S.footerLink}>Confidentialite</a>
              <a href="#" style={S.footerLink}>Mentions legales</a>
            </div>
          </div>
          <div style={S.footerBottom}>
            <span>© 2026 FootPlanner. Tous droits reserves.</span>
            <span>Fait avec ⚽ en France</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================
const S = {
  page: { background: '#060a12', color: '#f1f5f9', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", minHeight: '100vh', overflowX: 'hidden' },
  container: { maxWidth: 1200, margin: '0 auto', padding: '0 24px' },

  // NAV
  nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, padding: '16px 0', background: 'rgba(6,10,18,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  navInner: { maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontSize: 22, fontWeight: 900, letterSpacing: 1, cursor: 'pointer' },
  navLinks: { display: 'flex', gap: 32, fontSize: 14, fontWeight: 600, color: '#94a3b8' },
  navLink: { cursor: 'pointer', transition: 'color 0.2s' },

  // BUTTONS
  btnGhost: { padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.06)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", transition: 'all 0.2s' },
  btnCyan: { padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: '#a3e635', color: '#060a12', border: 'none', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", transition: 'all 0.2s' },
  btnCyanLg: { padding: '14px 32px', borderRadius: 10, fontWeight: 700, fontSize: 16, cursor: 'pointer', background: '#a3e635', color: '#060a12', border: 'none', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" },
  btnOutlineLg: { padding: '14px 32px', borderRadius: 10, fontWeight: 700, fontSize: 16, cursor: 'pointer', background: 'transparent', color: '#a3e635', border: '1.5px solid #a3e635', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" },

  // HERO
  hero: { padding: '140px 0 80px', position: 'relative' },
  heroGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#a3e635', marginBottom: 24, letterSpacing: 0.5 },
  badgeDot: { width: 6, height: 6, background: '#a3e635', borderRadius: '50%', display: 'inline-block' },
  h1: { fontSize: 56, fontWeight: 900, lineHeight: 1.1, letterSpacing: -1, marginBottom: 20 },
  heroSub: { fontSize: 18, color: '#94a3b8', lineHeight: 1.7, marginBottom: 32, maxWidth: 480 },
  heroFeats: { display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 40 },
  heroFeat: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#94a3b8' },
  dot: { width: 6, height: 6, background: '#a3e635', borderRadius: '50%', display: 'inline-block' },

  // GLOW
  glowLine: { height: 1, background: 'linear-gradient(90deg, transparent, #a3e635, transparent)', opacity: 0.3 },

  // SECTION
  section: { padding: '100px 0' },
  sectionHeader: { textAlign: 'center', marginBottom: 60 },
  sectionLabel: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#a3e635', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 },
  h2: { fontSize: 42, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1.15, marginBottom: 16 },
  sectionSub: { fontSize: 16, color: '#94a3b8', maxWidth: 560, lineHeight: 1.7, margin: '0 auto' },

  // FEATURES
  featGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 },
  featCard: { background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 28, transition: 'all 0.3s' },
  featIcon: { width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 },
  featTitle: { fontSize: 17, fontWeight: 800, marginBottom: 8 },
  featDesc: { fontSize: 13, color: '#94a3b8', lineHeight: 1.6 },

  // FORMATS
  formatCard: { display: 'flex', gap: 16, padding: 24, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, transition: 'all 0.3s' },

  // MOCKUP
  mockupWrap: { position: 'relative' },
  browser: { background: '#0c1120', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' },
  browserBar: { padding: '12px 16px', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.04)' },
  browserDot: { width: 8, height: 8, borderRadius: '50%' },
  browserUrl: { marginLeft: 12, padding: '4px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 4, fontSize: 11, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" },
  mockStats: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 },
  mockStat: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 10, textAlign: 'center' },
  mockStatVal: { fontSize: 20, fontWeight: 900, color: '#a3e635' },
  mockStatLbl: { fontSize: 9, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  mockLive: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 10, marginBottom: 10 },
  mockLiveHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  mockLiveBadge: { padding: '2px 8px', background: '#ef4444', color: 'white', borderRadius: 3, fontSize: 8, fontWeight: 800, letterSpacing: 0.5 },
  mockMatch: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' },
  mockTeam: { display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 10 },
  mockCrest: { width: 16, height: 16, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 900, color: '#060a12' },
  mockScore: { fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: 14, color: '#a3e635' },
  mockField: { fontSize: 8, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" },
  mockStandings: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 10 },
  mockRow: { display: 'flex', gap: 8, padding: '3px 0', fontSize: 9, color: '#94a3b8' },

  // TV MOCKUP
  mockTv: { background: '#060a12', border: '3px solid #333', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' },
  tvMatch: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 10, padding: 12 },
  tvLive: { padding: '2px 6px', background: '#ef4444', color: 'white', fontSize: 7, fontWeight: 800, borderRadius: 3, letterSpacing: 0.5 },
  tvTeam: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' },
  tvScore: { fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: 18, color: '#a3e635' },

  // AUTH
  authCard: { background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 36 },
  authTabs: { display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 4 },
  authTab: { flex: 1, padding: '10px 16px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'transparent', color: '#64748b', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", transition: 'all 0.2s' },
  authTabActive: { background: 'rgba(34,211,238,0.12)', color: '#a3e635' },
  error: { padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#fb7185', fontSize: 13, fontWeight: 600, marginBottom: 16 },
  formGroup: { marginBottom: 16 },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6, letterSpacing: 0.3 },
  input: { width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, color: '#f1f5f9', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  legal: { fontSize: 10, color: '#64748b', textAlign: 'center', marginTop: 12, lineHeight: 1.5 },

  // STATS
  statCard: { textAlign: 'center', padding: 28, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20 },
  statVal: { fontSize: 40, fontWeight: 900, color: '#a3e635', fontFamily: "'JetBrains Mono', monospace", letterSpacing: -1 },
  statLbl: { fontSize: 13, color: '#94a3b8', fontWeight: 600, marginTop: 4 },

  // FOOTER
  footer: { padding: '60px 0 32px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  footerGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 },
  footerTitle: { fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  footerLink: { display: 'block', fontSize: 13, color: '#64748b', padding: '3px 0', textDecoration: 'none' },
  footerBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: '#64748b' },
};