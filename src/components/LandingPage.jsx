import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

// ============================================================
// LandingPage — page marketing + auth (signin / signup)
// ============================================================
export function LandingPage() {
  const { signIn, signUp } = useAuth();
  const [isMobile, setIsMobile] = React.useState(typeof window !== 'undefined' && window.innerWidth < 900);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
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
  const [cookiesBanner, setCookiesBanner] = React.useState(() => !localStorage.getItem('fp_cookies_ok'));
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - 68);
    if ('scrollBehavior' in document.documentElement.style) {
      window.scrollTo({ top, behavior: 'smooth' });
    } else {
      document.documentElement.scrollTop = top;
      document.body.scrollTop = top;
    }
  };

  return (
    <div style={S.page}>
      {/* NAV */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <img src="https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/logo%20app/8891B8C3-D2AB-4CE4-AA8B-5A740A9FD062.png" alt="FootPlanner logo" style={{height:48,width:'auto'}} />
            <div style={S.logo}><span style={{color:'#fff'}}>FOOT</span><span style={{color:'#a3e635'}}>PLANNER</span></div>
          </div>
          {!isMobile && (
            <div style={{display:'flex',gap:16,alignItems:'center'}}>
              <a style={S.navLink} onClick={() => scrollTo('features')}>Fonctionnalites</a>
              <a style={S.navLink} onClick={() => scrollTo('bigscreen')}>Grand ecran</a>
              <a style={S.navLink} onClick={() => scrollTo('formats')}>Formats</a>
            </div>
          )}
          <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0}}>
            <button style={{...S.btnGhost, fontSize:12, padding:'7px 12px', whiteSpace:'nowrap'}} onClick={() => { setAuthMode('signin'); setTimeout(() => scrollTo('auth'), 150); }}>Connexion</button>
            <button style={{...S.btnCyan, fontSize:12, padding:'7px 12px', whiteSpace:'nowrap'}} onClick={() => { setAuthMode('signup'); setTimeout(() => scrollTo('auth'), 150); }}>Bêta gratuite</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{...S.hero, backgroundImage:"url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&q=80')", backgroundSize:'cover', backgroundPosition:'center', position:'relative'}}>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg, rgba(6,10,18,0.92) 0%, rgba(6,10,18,0.75) 50%, rgba(6,10,18,0.92) 100%)'}}></div>
        <div style={{...S.container, position:'relative', zIndex:1}}>
          <div style={{...S.heroGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 60}}>
            <div>
              <div style={S.badge}><span style={S.badgeDot}></span>BETA OUVERTE — 100% gratuit</div>
              <h1 style={S.h1}>Gerez votre club<br/>et vos tournois<br/>sans <span style={{color:'#a3e635'}}>prise de tete.</span></h1>
              <p style={S.heroSub}>FootPlanner genere automatiquement vos poules, calendriers et phases finales. Vous gerez les scores en direct. Le classement se fait tout seul.</p>
              <div style={S.heroFeats}>
                {['Calendrier automatique','Scores en direct','Affichage grand ecran','Multi-categories','100% Cloud','Concu en France'].map(f => (
                  <div key={f} style={S.heroFeat}><span style={S.dot}></span>{f}</div>
                ))}
              </div>
              <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                <button style={S.btnCyanLg} onClick={() => { setAuthMode('signup'); setTimeout(() => scrollTo('auth'), 80); }}>Demarrer gratuitement →</button>
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
            <div style={S.sectionLabel}>Plateforme complète</div>
            <h2 style={S.h2}>Gérez votre club de A à Z</h2>
            <p style={S.sectionSub}>FootPlanner couvre tous les aspects de l'organisation de votre club et de vos tournois.</p>
          </div>
          <div style={{marginBottom:32}}>
            <div style={{fontSize:11,fontWeight:700,color:'#a3e635',letterSpacing:2,textTransform:'uppercase',marginBottom:16}}>Disponible maintenant</div>
            <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:16}}>
              {[
                {icon:'⚙️',c:'#a3e635',t:'Gestion de tournois',d:'Poules, calendriers, phases finales, scores en direct. Standard, Croisé ou Champions League.'},
                {icon:'📝',c:'#a3e635',t:'Inscriptions en ligne',d:'Page publique brandée à vos couleurs. Les clubs s\'inscrivent, vous validez et gérez les paiements.'},
                {icon:'🏷️',c:'#a3e635',t:'Table de marque',d:'Accueil des équipes le jour J : présence, maillots, paiements, joueurs. Tout en un écran.'},
                {icon:'🖥️',c:'#f59e0b',t:'Affichage grand écran',d:'Diffusez matchs en cours, classements et sponsors sur vos écrans TV en mode régie automatique.'},
                {icon:'👥',c:'#818cf8',t:'Bibliothèque de clubs',d:'Sauvegardez vos clubs pour les réimporter en un clic. Fini la saisie répétitive.'},
                {icon:'📄',c:'#34d399',t:'Documents & QR Code',d:'Affiche QR code pour spectateurs, planning PDF pour les terrains, résumé compact.'},
              ].map(f => (
                <div key={f.t} style={{...S.featCard,borderLeft:`3px solid ${f.c}`}}>
                  <div style={{...S.featIcon,background:`${f.c}15`,color:f.c}}>{f.icon}</div>
                  <h3 style={S.featTitle}>{f.t}</h3>
                  <p style={S.featDesc}>{f.d}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'#475569',letterSpacing:2,textTransform:'uppercase',marginBottom:16}}>Bientôt disponibles</div>
            <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)',gap:12}}>
              {[
                {icon:'🍺',t:'Buvette & Finances',d:'Gérez vos ventes et recettes'},
                {icon:'🙋',t:'Bénévoles & Staff',d:'Planifiez vos bénévoles'},
                {icon:'💬',t:'Communication',d:'Annonces et messagerie club'},
                {icon:'📊',t:'Stats & Rapports',d:'Bilans et historiques'},
                {icon:'📋',t:'Plans de jeu',d:'Fiches tactiques par match'},
                {icon:'📸',t:'Médias & Galerie',d:'Photos et partage'},
                {icon:'🏆',t:'Classement saison',d:'Suivi saison complète'},
                {icon:'📱',t:'App mobile',d:'iOS et Android'},
              ].map(f => (
                <div key={f.t} style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:16,opacity:0.7}}>
                  <div style={{fontSize:24,marginBottom:8}}>{f.icon}</div>
                  <div style={{fontSize:13,fontWeight:700,color:'#64748b',marginBottom:4}}>{f.t}</div>
                  <div style={{fontSize:11,color:'#334155'}}>{f.d}</div>
                  <div style={{marginTop:8,fontSize:10,color:'#475569',fontWeight:700,background:'rgba(255,255,255,0.04)',borderRadius:4,padding:'2px 6px',display:'inline-block'}}>BIENTÔT</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* BIGSCREEN */}
      <section id="bigscreen" style={{...S.section,background:'#0c1120',borderTop:'1px solid rgba(255,255,255,0.06)',borderBottom:'1px solid rgba(255,255,255,0.06)',backgroundImage:"url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1600&q=80')",backgroundSize:'cover',backgroundPosition:'center',position:'relative'}}>
        <div style={{position:'absolute',inset:0,background:'rgba(12,17,32,0.88)'}}></div>
        <div style={{...S.container,position:'relative',zIndex:1}}>
          <div style={{...S.heroGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 60}}>
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
          <div style={{display:'grid',gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',gap:16}}>
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

      {/* BETA VISION */}
      <section style={{padding:'80px 0',background:'linear-gradient(135deg,rgba(163,230,53,0.04) 0%,rgba(129,140,248,0.04) 100%)',borderTop:'1px solid rgba(163,230,53,0.1)',borderBottom:'1px solid rgba(163,230,53,0.1)'}}>
        <div style={S.container}>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:isMobile?32:60,alignItems:'center'}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:'#a3e635',letterSpacing:2,textTransform:'uppercase',marginBottom:16}}>🚀 Version Beta</div>
              <h2 style={{fontSize:isMobile?28:36,fontWeight:900,color:'#f1f5f9',lineHeight:1.2,marginBottom:20}}>Construisons l'outil de référence ensemble</h2>
              <p style={{fontSize:15,color:'#94a3b8',lineHeight:1.8,marginBottom:16}}>FootPlanner est en version beta et compte sur ses utilisateurs pour grandir et évoluer jour après jour. Chaque retour, chaque suggestion nous aide à construire l'outil de référence des clubs de football.</p>
              <p style={{fontSize:15,color:'#94a3b8',lineHeight:1.8,marginBottom:28}}>En rejoignant la beta, vous accédez à toutes les fonctionnalités gratuitement et participez activement à la construction d'un outil fait par et pour les clubs.</p>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {['100% gratuit pendant toute la beta','Nouvelles fonctionnalités chaque semaine','Support direct et réactif par email','Votre avis compte vraiment — on vous écoute'].map(f => (
                  <div key={f} style={{display:'flex',alignItems:'center',gap:10,fontSize:14,color:'#94a3b8'}}>
                    <span style={{width:20,height:20,borderRadius:'50%',background:'rgba(163,230,53,0.15)',border:'1px solid rgba(163,230,53,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#a3e635',flexShrink:0}}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(163,230,53,0.15)',borderRadius:24,padding:32}}>
              <div style={{textAlign:'center',marginBottom:24}}>
                <div style={{fontSize:48,marginBottom:8}}>⚽</div>
                <h3 style={{fontSize:20,fontWeight:800,color:'#f1f5f9',marginBottom:8}}>Rejoignez la communauté</h3>
                <p style={{fontSize:13,color:'#64748b'}}>Des clubs qui nous font déjà confiance pour gérer leurs tournois</p>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24}}>
                {[{v:'100%',l:'Gratuit en beta'},{v:'∞',l:'Tournois illimités'},{v:'0€',l:'Sans engagement'},{v:'24/7',l:'Accessible partout'}].map(s => (
                  <div key={s.l} style={{textAlign:'center',padding:16,background:'rgba(163,230,53,0.05)',borderRadius:12,border:'1px solid rgba(163,230,53,0.1)'}}>
                    <div style={{fontSize:24,fontWeight:900,color:'#a3e635'}}>{s.v}</div>
                    <div style={{fontSize:11,color:'#64748b',marginTop:4}}>{s.l}</div>
                  </div>
                ))}
              </div>
              <button style={{...S.btnCyan,width:'100%',padding:'14px',fontSize:15,borderRadius:12}} onClick={() => {setAuthMode('signup');setTimeout(() => scrollTo('auth'), 80);}}>
                Rejoindre la beta gratuitement →
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* AUTH SECTION */}
      <section id="auth" style={{...S.section,background:'#0c1120',borderTop:'1px solid rgba(255,255,255,0.06)',scrollMarginTop:'68px'}}>
        <div style={{...S.container,maxWidth:authMode === 'signup' ? 1200 : 1200}}>
          <div style={{...S.heroGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 60}}>
            <div>
              <div style={S.sectionLabel}>Beta gratuite</div>
              <h2 style={S.h2}>Pret a simplifier vos <span style={{color:'#a3e635'}}>tournois ?</span></h2>
              <p style={{...S.sectionSub,marginBottom:32}}>Creez votre compte en 30 secondes. Aucune carte bancaire. Toutes les fonctionnalites sont accessibles gratuitement pendant la beta.</p>
              <div style={{display:'grid',gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)',gap:16}}>
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
                {success && (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#f1f5f9', marginBottom: 12 }}>Bienvenue dans FootPlanner !</div>
      <div style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.7, marginBottom: 24 }}>
        Votre compte a été créé avec succès.<br/>
        <strong style={{ color: '#a3e635' }}>Vérifiez votre email</strong> pour activer votre compte.
      </div>
      <div style={{ padding: '16px 20px', background: 'rgba(163,230,53,0.08)', border: '1px solid rgba(163,230,53,0.2)', borderRadius: 12, fontSize: 13, color: '#94a3b8' }}>
        Un email de confirmation a été envoyé à <strong style={{ color: '#f1f5f9' }}>{form.email}</strong>
      </div>
    </div>
  )}

                    {(!authMode || authMode === 'signup') && !success && (
                      <div>
                        <div style={S.formGroup}>
                          <label style={S.label}>Nom du club *</label>
                          <input style={S.input} placeholder="Ex: US Feillens, FC Manziat..." value={form.club} onChange={e => update('club', e.target.value)} />
                        </div>
                        <div style={{...S.formRow, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'}}>
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
                          En vous inscrivant, vous acceptez nos <a href="/?page=cgu" style={{color:'#a3e635'}}>CGU</a> et notre <a href="/?page=privacy" style={{color:'#a3e635'}}>politique de confidentialite</a>.
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
          <div style={{...S.footerGrid, gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr 1fr', gap: isMobile ? 24 : 40}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <img src="https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/logo%20app/8891B8C3-D2AB-4CE4-AA8B-5A740A9FD062.png" alt="FootPlanner logo" style={{height:36,width:'auto'}} />
                <div style={S.logo}><span style={{color:'#fff'}}>FOOT</span><span style={{color:'#a3e635'}}>PLANNER</span></div>
              </div>
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
              <a href="/?page=cgu" style={S.footerLink}>CGU</a>
              <a href="/?page=privacy" style={S.footerLink}>Politique de confidentialite</a>
            </div>
          </div>
          <div style={S.footerBottom}>
            <span>© 2026 FootPlanner. Tous droits reserves.</span>
            <span>Fait avec ⚽ en France</span>
          </div>
        </div>
      </footer>
      {cookiesBanner && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, maxWidth: 600 }}>
            FootPlanner utilise des cookies techniques nécessaires au fonctionnement du service. En continuant, vous acceptez notre <a href="/?page=privacy" style={{ color: '#a3e635' }}>politique de confidentialité</a>.
          </p>
          <button onClick={() => { localStorage.setItem('fp_cookies_ok', '1'); setCookiesBanner(false); }} style={{ padding: '8px 20px', background: '#a3e635', color: '#060a12', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            J'accepte
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================
const S = {
  page: { background: '#060a12', color: '#f1f5f9', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", minHeight: '100vh', maxWidth: '100vw' },
  container: { maxWidth: 1200, margin: '0 auto', padding: '0 16px', boxSizing: 'border-box', width: '100%' },

  // NAV
  nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, padding: '10px 0', background: 'rgba(6,10,18,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  navInner: { maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'nowrap', minWidth: 0 },
  logo: { fontSize: 16, fontWeight: 900, letterSpacing: 1, cursor: 'pointer', whiteSpace: 'nowrap' },
  navLinks: { display: 'flex', gap: 32, fontSize: 14, fontWeight: 600, color: '#94a3b8' },
  navLink: { cursor: 'pointer', transition: 'color 0.2s' },

  // BUTTONS
  btnGhost: { padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.06)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", transition: 'all 0.2s' },
  btnCyan: { padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: '#a3e635', color: '#060a12', border: 'none', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", transition: 'all 0.2s' },
  btnCyanLg: { padding: '14px 32px', borderRadius: 10, fontWeight: 700, fontSize: 16, cursor: 'pointer', background: '#a3e635', color: '#060a12', border: 'none', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" },
  btnOutlineLg: { padding: '14px 32px', borderRadius: 10, fontWeight: 700, fontSize: 16, cursor: 'pointer', background: 'transparent', color: '#a3e635', border: '1.5px solid #a3e635', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" },

  // HERO
  hero: { padding: '100px 0 60px', position: 'relative', overflowX: 'hidden' },
  heroGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#a3e635', marginBottom: 24, letterSpacing: 0.5 },
  badgeDot: { width: 6, height: 6, background: '#a3e635', borderRadius: '50%', display: 'inline-block' },
  h1: { fontSize: 56, fontWeight: 900, lineHeight: 1.1, letterSpacing: -1, marginBottom: 20 },
  heroSub: { fontSize: 16, color: '#94a3b8', lineHeight: 1.7, marginBottom: 32, maxWidth: '100%' },
  heroFeats: { display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 40 },
  heroFeat: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#94a3b8' },
  dot: { width: 6, height: 6, background: '#a3e635', borderRadius: '50%', display: 'inline-block' },

  // GLOW
  glowLine: { height: 1, background: 'linear-gradient(90deg, transparent, #a3e635, transparent)', opacity: 0.3 },

  // SECTION
  section: { padding: '60px 0' },
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