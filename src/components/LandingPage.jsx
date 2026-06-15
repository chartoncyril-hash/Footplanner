import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { Trophy, Users, Tent, CalendarDays, MessageSquare, Handshake, ClipboardList, BarChart2, MonitorPlay, Crown, Goal } from 'lucide-react';

// ============================================================
// LandingPage v3 — "Tout votre club. Un seul terrain."
// Hero immersif stade + sombre premium néon · mobile-first
// Modal auth unifié · animations scroll · mockups réels
// ============================================================

const LOGO =
  "https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/logo%20app/8891B8C3-D2AB-4CE4-AA8B-5A740A9FD062.png";
const STADIUM =
  "https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?w=1920&q=80";

const SHOTS = {
  dashboard:
    "https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/landingpage/hub.png",
  calendrier:
    "https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/landingpage/Dashboard_tournois.png",
  classement:
    "https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/landingpage/Dashboard_tournois.png",
  licencies:
    "https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/landingpage/Licencies.png",
  sponsors:
    "https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/landingpage/hub.png",
  inscriptions:
    "https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/landingpage/arborescence_phases_finales.png",
  regie:
    "https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/landingpage/saisie_score_carton.png",
  mobile:
    "https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/landingpage/compo_equipe.png",
  spectateur:
    "https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/landingpage/Capture%20decran%20mobile%20spectateur.png",
  spectateurClassement:
    "https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/landingpage/Capture%20ecran%20mobile%20classement.png",
  spectateurInfo:
    "https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/landingpage/Capture%20ecran%20info.png",
  tablemarque:
    "https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/landingpage/saisie_score_carton.png",
};

// Hook : révèle un élément au scroll
function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, shown];
}

// Compteur animé
function Counter({ target, duration = 1800, suffix = "" }) {
  const [val, setVal] = useState(0);
  const [ref, shown] = useReveal();
  useEffect(() => {
    if (!shown) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [shown, target, duration]);
  return (
    <span ref={ref}>
      {val.toLocaleString("fr-FR")}
      {suffix}
    </span>
  );
}

export function LandingPage() {
  const { signIn, signUp } = useAuth();
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("signup");
  const [scrolled, setScrolled] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  useEffect(() => {
    const h = (e) => {
      let t = e.target;
      if (!t) return;
      if (t.closest && t.closest('[data-lightbox]')) return;
      let src = null;
      // Cas 1 : clic direct sur l'image
      if (t.tagName === 'IMG' && t.src && t.src.includes('landingpage/')) src = t.src;
      // Cas 2 : clic sur un calque au-dessus de l'image (overlay) → chercher l'image voisine
      else {
        let node = t;
        for (let i = 0; i < 2 && node && !src; i++) {
          const img = node.querySelector ? node.querySelector('img[src*="landingpage/"]') : null;
          if (img) src = img.src;
          node = node.parentElement;
        }
      }
      if (src) setLightbox(src);
    };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    clubName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const u = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openAuth = (mode) => {
    setAuthMode(mode);
    setError("");
    setShowAuth(true);
  };

  const submit = async () => {
    setError("");
    if (!form.email.trim()) return setError("Entrez votre email");
    if (form.password.length < 6)
      return setError("Mot de passe : 6 caractères minimum");
    if (authMode === "signup") {
      if (!form.clubName.trim()) return setError("Entrez le nom de votre club");
      if (form.password !== form.confirmPassword)
        return setError("Les mots de passe ne correspondent pas");
    }
    setLoading(true);
    try {
      if (authMode === "signup")
        await signUp({
          email: form.email.trim(),
          password: form.password,
          clubName: form.clubName.trim(),
        });
      else await signIn({ email: form.email.trim(), password: form.password });
    } catch (e) {
      setError(e.message || "Une erreur est survenue");
    }
    setLoading(false);
  };

  const C = {
    bg: "#060a12",
    ink: "#f1f5f9",
    sub: "#94a3b8",
    dim: "#64748b",
    neon: "#a3e635",
    cyan: "#22d3ee",
    line: "rgba(255,255,255,0.08)",
  };

  return (
    <div
      style={{
        background: C.bg,
        color: C.ink,
        fontFamily: "'Manrope', system-ui, sans-serif",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes floatUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes heroGlow { 0%,100% { opacity:0.5; } 50% { opacity:0.9; } }
        @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
        .reveal { opacity:0; }
        .reveal.in { animation: floatUp 0.7s cubic-bezier(0.22,1,0.36,1) forwards; }
        img[src*="landingpage/"] { cursor: zoom-in; }
        .lp-link:hover { color:#a3e635 !important; }
        .lp-btn-primary:hover { transform:translateY(-2px); box-shadow:0 12px 40px rgba(163,230,53,0.35) !important; }
        .lp-btn-primary { transition:all 0.2s ease; }
        .lp-module:hover { transform:translateY(-6px); border-color:rgba(163,230,53,0.4) !important; }
        .lp-module { transition:all 0.25s ease; }
        .lp-mock { transition:all 0.4s cubic-bezier(0.22,1,0.36,1); }
        * { scroll-behavior:smooth; }
        @media (prefers-reduced-motion: reduce) { .reveal,.reveal.in { animation:none; opacity:1; } }
      `}</style>

      {/* ════════════ NAV ════════════ */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          background: scrolled ? "rgba(6,10,18,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled
            ? `1px solid ${C.line}`
            : "1px solid transparent",
          transition: "all 0.3s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src={LOGO}
            alt="FootPlanner"
            style={{ height: 40, width: "auto", objectFit: "contain" }}
          />
          <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: -0.5 }}>
            FOOT<span style={{ color: C.neon }}>PLANNER</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={() => openAuth("signin")}
            style={{
              padding: "9px 16px",
              background: "transparent",
              color: C.sub,
              border: "none",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            className="lp-link"
          >
            Connexion
          </button>
          <button
            onClick={() => openAuth("signup")}
            className="lp-btn-primary"
            style={{
              padding: "9px 18px",
              background: C.neon,
              color: "#060a12",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {isMobile ? "Essayer" : "Commencer"}
          </button>
        </div>
      </nav>

      {/* ════════════ HERO ════════════ */}
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "100px 20px 60px",
          overflow: "hidden",
        }}
      >
        {/* Fond stade */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url('${STADIUM}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.18,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at 50% 0%, rgba(163,230,53,0.12), transparent 60%), linear-gradient(180deg, rgba(6,10,18,0.6) 0%, ${C.bg} 85%)`,
          }}
        />
        {/* Halo néon animé */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
            height: 600,
            background:
              "radial-gradient(circle, rgba(163,230,53,0.15), transparent 70%)",
            filter: "blur(60px)",
            animation: "heroGlow 6s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 2, maxWidth: 880 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 16px",
              background: "rgba(163,230,53,0.1)",
              border: "1px solid rgba(163,230,53,0.25)",
              borderRadius: 30,
              fontSize: 13,
              fontWeight: 700,
              color: C.neon,
              marginBottom: 28,
              animation: "floatUp 0.6s ease forwards",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: C.neon,
                boxShadow: "0 0 10px rgba(163,230,53,0.8)",
              }}
            />
            Gratuit pendant la beta · Sans carte bancaire
          </div>

          <h1
            style={{
              fontSize: isMobile ? 44 : 76,
              fontWeight: 900,
              lineHeight: 1.04,
              letterSpacing: isMobile ? -1.5 : -3,
              margin: "0 0 24px",
              animation: "floatUp 0.7s ease 0.1s forwards",
              opacity: 0,
            }}
          >
            Tout votre club.
            <br />
            <span
              style={{
                background: `linear-gradient(120deg, ${C.neon}, ${C.cyan})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Un seul terrain.
            </span>
          </h1>

          <p
            style={{
              fontSize: isMobile ? 17 : 21,
              color: C.sub,
              lineHeight: 1.6,
              maxWidth: 600,
              margin: "0 auto 40px",
              animation: "floatUp 0.7s ease 0.2s forwards",
              opacity: 0,
            }}
          >
            Licenciés, tournois, stages, planning, communication. La plateforme
            qui réunit toute la vie de votre club de football au même endroit.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 14,
              justifyContent: "center",
              alignItems: "center",
              animation: "floatUp 0.7s ease 0.3s forwards",
              opacity: 0,
            }}
          >
            <button
              onClick={() => openAuth("signup")}
              className="lp-btn-primary"
              style={{
                padding: "17px 38px",
                background: C.neon,
                color: "#060a12",
                border: "none",
                borderRadius: 14,
                fontSize: 17,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 8px 30px rgba(163,230,53,0.25)",
                width: isMobile ? "100%" : "auto",
              }}
            >
              Créer mon club gratuitement
            </button>
            <button
              onClick={() => openAuth("signin")}
              style={{
                padding: "17px 28px",
                background: "transparent",
                color: C.ink,
                border: `1px solid ${C.line}`,
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                width: isMobile ? "100%" : "auto",
              }}
              className="lp-link"
            >
              J'ai déjà un compte
            </button>
          </div>
        </div>

        {/* Mockup dashboard flottant */}
        <div
          className="reveal in"
          style={{
            position: "relative",
            zIndex: 2,
            marginTop: 60,
            maxWidth: 1000,
            width: "100%",
            animationDelay: "0.4s",
          }}
        >
          <div
            style={{
              position: "relative",
              borderRadius: isMobile ? 12 : 18,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow:
                "0 40px 120px rgba(0,0,0,0.6), 0 0 80px rgba(163,230,53,0.08)",
            }}
          >
            <div
              style={{
                height: 36,
                background: "#0c1322",
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "0 14px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                <span
                  key={c}
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: c,
                  }}
                />
              ))}
              <div
                style={{
                  marginLeft: 12,
                  fontSize: 11,
                  color: C.dim,
                  fontFamily: "monospace",
                }}
              >
                footplanner.fr
              </div>
            </div>
            <img
              src={SHOTS.dashboard}
              alt="Tableau de bord FootPlanner"
              style={{ width: "100%", display: "block" }}
            />
          </div>
        </div>
      </section>

      {/* ════════════ BANDE CONFIANCE ════════════ */}
      <section
        style={{
          borderTop: `1px solid ${C.line}`,
          borderBottom: `1px solid ${C.line}`,
          padding: "40px 20px",
          background: "rgba(255,255,255,0.015)",
        }}
      >
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
            gap: 24,
          }}
        >
          {[
            {
              v: (
                <>
                  <Counter target={14966} />
                </>
              ),
              l: "Clubs français intégrés",
            },
            { v: "9", l: "Modules de gestion" },
            { v: "100%", l: "Gratuit en beta" },
            { v: "∞", l: "Tournois & licenciés" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: isMobile ? 28 : 38,
                  fontWeight: 900,
                  color: C.neon,
                  letterSpacing: -1,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {s.v}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: C.dim,
                  fontWeight: 600,
                  marginTop: 4,
                }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════ 3 CIBLES ════════════ */}
      <Section
        C={C}
        isMobile={isMobile}
        eyebrow="Pensé pour tous"
        title="Une plateforme, trois métiers"
        sub="Que vous dirigiez, organisiez ou entraîniez — FootPlanner s'adapte à votre rôle."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)",
            gap: 20,
            marginTop: 48,
          }}
        >
          {[
            {
              tag: "Présidents & dirigeants",
              icon: <Crown size={22} color="#a3e635" />,
              d: "Pilotez les licenciés, sponsors, finances et la communication du club depuis un tableau de bord unique.",
              shot: SHOTS.licencies,
              color: C.neon,
            },
            {
              tag: "Organisateurs de tournois",
              icon: "🏆",
              d: "Créez vos tournois, gérez inscriptions et poules, diffusez les scores en direct sur grand écran.",
              shot: SHOTS.classement,
              color: C.cyan,
            },
            {
              tag: "Coachs & éducateurs",
              icon: <Goal size={22} color="#f472b6" />,
              d: "Convoquez vos joueurs, suivez les présences, communiquez avec les parents et gérez les compositions.",
              shot: SHOTS.mobile,
              color: "#f472b6",
            },
          ].map((b, i) => (
            <RoleCard key={i} {...b} C={C} delay={i * 0.1} />
          ))}
        </div>
      </Section>

      {/* ════════════ SHOWCASE PRODUIT ════════════ */}
      <Section
        C={C}
        isMobile={isMobile}
        eyebrow="L'écosystème complet"
        title="Neuf modules, zéro compromis"
        sub="Tout ce dont votre club a besoin, dans une seule application — sans jongler entre dix outils."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)",
            gap: 16,
            marginTop: 48,
          }}
        >
          {[
            {
              icon: "🏆",
              t: "Tournois",
              d: "Poules, calendriers, phases finales, scores en direct.",
              c: C.neon,
            },
            {
              icon: <Users size={24} color="#fb7185" />,
              t: "Licenciés",
              d: "Photos, certificats médicaux, données RGPD sécurisées.",
              c: "#fb7185",
            },
            {
              icon: <Tent size={24} color="#f97316" />,
              t: "Stages",
              d: "Inscriptions en ligne et relances automatiques.",
              c: "#f97316",
            },
            {
              icon: <CalendarDays size={24} color="#22d3ee" />,
              t: "Planning",
              d: "Agenda club partagé, mobile et imprimable.",
              c: C.cyan,
            },
            {
              icon: <MessageSquare size={24} color="#f472b6" />,
              t: "Communication",
              d: "Événements, sondages, présences, covoiturage.",
              c: "#f472b6",
            },
            {
              icon: <Handshake size={24} color="#f59e0b" />,
              t: "Sponsors",
              d: "Logos, contrats et bibliothèque documentaire.",
              c: "#f59e0b",
            },
            {
              icon: <ClipboardList size={24} color="#818cf8" />,
              t: "Inscriptions",
              d: "Page publique brandée à vos couleurs.",
              c: "#818cf8",
            },
            {
              icon: <BarChart2 size={24} color="#34d399" />,
              t: "Table de marque",
              d: "Scores, cartons et présences en temps réel.",
              c: "#34d399",
            },
            {
              icon: <MonitorPlay size={24} color="#f97316" />,
              t: "Régie écran",
              d: "Diffusez matchs et classements sur vos TV.",
              c: "#f97316",
            },
          ].map((m, i) => (
            <ModuleCard key={i} {...m} C={C} delay={(i % 3) * 0.08} />
          ))}
        </div>
      </Section>

      {/* ════════════ SHOWCASE VISUEL ALTERNÉ ════════════ */}
      <Section
        C={C}
        isMobile={isMobile}
        eyebrow="Le produit en action"
        title="Conçu pour être beau et rapide"
      >
        {[
          {
            t: "Un tableau de bord qui va à l'essentiel",
            d: "Vos tournois en cours, le planning du jour et vos modules — tout est accessible en un coup d'œil dès la connexion.",
            shot: SHOTS.dashboard,
            flip: false,
          },
          {
            t: "Des phases finales générées en un clic",
            d: "Quarts, demies, finale : l'arborescence se construit automatiquement à partir de vos poules. Zéro papier, zéro erreur.",
            shot: SHOTS.inscriptions,
            flip: true,
          },
          {
            t: "La table de marque en temps réel",
            d: "Scores, buteurs, cartons : saisissez tout en direct depuis le bord du terrain, les classements se mettent à jour instantanément.",
            shot: SHOTS.regie,
            flip: false,
          },
        ].map((row, i) => (
          <ShowcaseRow key={i} {...row} C={C} isMobile={isMobile} />
        ))}
        <MobileTrio C={C} isMobile={isMobile} />
      </Section>

            {/* ════════════ SECTION VIDÉO COMPOSITIONS ════════════ */}
      <section style={{ padding: isMobile ? '70px 20px' : '100px 20px', maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#a3e635', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Vu en action</div>
        <h2 style={{ fontSize: isMobile ? 30 : 44, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.1, margin: '0 0 16px' }}>
          Composez vos équipes <span style={{ color: '#a3e635' }}>comme un pro</span>
        </h2>
        <p style={{ fontSize: isMobile ? 15 : 17, color: '#94a3b8', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.6 }}>
          Glissez vos joueurs sur le terrain, choisissez la formation, partagez avec votre staff. Tout en temps réel.
        </p>
        <div style={{ borderRadius: isMobile ? 12 : 18, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 40px 100px rgba(0,0,0,0.55), 0 0 60px rgba(163,230,53,0.07)' }}>
          <div style={{ height: 34, background: '#0c1322', display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e' }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
          </div>
          <video autoPlay loop muted playsInline preload="metadata" style={{ width: '100%', display: 'block' }}>
            <source src="https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/landingpage/compo_equipe_video.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      {/* ════════════ CTA FINAL ════════════ */}
      <section
        style={{
          padding: isMobile ? "80px 20px" : "120px 20px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(163,230,53,0.1), transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <div
          className="reveal in"
          style={{ position: "relative", maxWidth: 640, margin: "0 auto" }}
        >
          <h2
            style={{
              fontSize: isMobile ? 34 : 52,
              fontWeight: 900,
              letterSpacing: -1.5,
              lineHeight: 1.1,
              marginBottom: 20,
            }}
          >
            Prêt à réunir
            <br />
            <span style={{ color: C.neon }}>toute la vie de votre club ?</span>
          </h2>
          <p
            style={{
              fontSize: 17,
              color: C.sub,
              marginBottom: 36,
              lineHeight: 1.6,
            }}
          >
            Rejoignez les clubs qui ont déjà fait le choix de la simplicité.
            Gratuit, sans engagement.
          </p>
          <button
            onClick={() => openAuth("signup")}
            className="lp-btn-primary"
            style={{
              padding: "18px 44px",
              background: C.neon,
              color: "#060a12",
              border: "none",
              borderRadius: 14,
              fontSize: 18,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 8px 30px rgba(163,230,53,0.3)",
            }}
          >
            Créer mon club gratuitement
          </button>
          <div style={{ marginTop: 18, fontSize: 13, color: C.dim }}>
            Accès immédiat · Aucune carte requise · Support réactif
          </div>
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer
        style={{
          borderTop: `1px solid ${C.line}`,
          padding: "40px 20px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <img src={LOGO} alt="" style={{ height: 32 }} />
          <span style={{ fontWeight: 900, fontSize: 15 }}>
            FOOT<span style={{ color: C.neon }}>PLANNER</span>
          </span>
        </div>
        <div
          style={{
            display: "flex",
            gap: 20,
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <a
            href="/?page=cgu"
            style={{ color: C.dim, fontSize: 13, textDecoration: "none" }}
            className="lp-link"
          >
            CGU
          </a>
          <a
            href="/?page=privacy"
            style={{ color: C.dim, fontSize: 13, textDecoration: "none" }}
            className="lp-link"
          >
            Confidentialité
          </a>
          <a
            href="mailto:contact@footplanner.fr"
            style={{ color: C.dim, fontSize: 13, textDecoration: "none" }}
            className="lp-link"
          >
            Contact
          </a>
        </div>
        <div style={{ fontSize: 12, color: C.dim }}>
          © {new Date().getFullYear()} FootPlanner · Gérez votre club de
          football
        </div>
      </footer>

      {/* ════════════ MODAL AUTH ════════════ */}
      {lightbox && (
        <div data-lightbox="1" onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(2,5,12,0.92)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'zoom-out' }}>
          <img src={lightbox} alt="" style={{ maxWidth: '95%', maxHeight: '92%', borderRadius: 12, objectFit: 'contain', boxShadow: '0 40px 120px rgba(0,0,0,0.8)' }} />
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 18, right: 18, width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#f1f5f9', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {showAuth && (
        <AuthModal
          C={C}
          authMode={authMode}
          setAuthMode={setAuthMode}
          form={form}
          u={u}
          error={error}
          loading={loading}
          onSubmit={submit}
          onClose={() => setShowAuth(false)}
        />
      )}
    </div>
  );
}

// ── Section wrapper avec reveal ──
function Section({ C, isMobile, eyebrow, title, sub, children }) {
  const [ref, shown] = useReveal();
  return (
    <section
      ref={ref}
      className={`reveal${shown ? " in" : ""}`}
      style={{
        padding: isMobile ? "70px 20px" : "100px 20px",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
        {eyebrow && (
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.neon,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            {eyebrow}
          </div>
        )}
        <h2
          style={{
            fontSize: isMobile ? 32 : 46,
            fontWeight: 900,
            letterSpacing: -1.5,
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          {title}
        </h2>
        {sub && (
          <p
            style={{
              fontSize: isMobile ? 16 : 18,
              color: C.sub,
              lineHeight: 1.6,
              marginTop: 16,
            }}
          >
            {sub}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

// ── Carte rôle (3 cibles) ──
function RoleCard({ tag, icon, d, shot, color, C, delay }) {
  const [ref, shown] = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal${shown ? " in" : ""} lp-module`}
      style={{
        animationDelay: `${delay}s`,
        background: "rgba(255,255,255,0.025)",
        border: `1px solid ${C.line}`,
        borderRadius: 18,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          position: "relative",
          height: 180,
          overflow: "hidden",
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <img
          src={shot}
          alt={tag}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, transparent 40%, rgba(6,10,18,0.9))`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            width: 44,
            height: 44,
            borderRadius: 12,
            background: `${color}22`,
            border: `1px solid ${color}55`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            backdropFilter: "blur(8px)",
          }}
        >
          {icon}
        </div>
      </div>
      <div style={{ padding: "20px 22px" }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: C.ink,
            marginBottom: 8,
          }}
        >
          {tag}
        </div>
        <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.6 }}>{d}</div>
      </div>
    </div>
  );
}

// ── Carte module ──
function ModuleCard({ icon, t, d, c, C, delay }) {
  const [ref, shown] = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal${shown ? " in" : ""} lp-module`}
      style={{
        animationDelay: `${delay}s`,
        background: "rgba(255,255,255,0.025)",
        border: `1px solid ${C.line}`,
        borderRadius: 16,
        padding: "24px 22px",
        borderTop: `2px solid ${c}`,
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 12,
          background: `${c}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          marginBottom: 16,
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>{t}</div>
      <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.55 }}>{d}</div>
    </div>
  );
}

// ── Ligne showcase alternée ──
function MobileTrio({ C, isMobile }) {
  const [ref, shown] = useReveal();
  const phone = (src, rotate, z, ty, scale, ml, mr) => (
    React.createElement('div', {
      style: {
        position: 'relative', width: isMobile ? 116 : 190, flexShrink: 0,
        transform: 'rotate(' + rotate + 'deg) translateY(' + ty + 'px) scale(' + scale + ')',
        zIndex: z, marginLeft: ml, marginRight: mr,
      },
    },
      React.createElement('div', {
        style: {
          borderRadius: 30, padding: 7,
          background: 'linear-gradient(145deg,#1c2233,#0a0e18)',
          boxShadow: '0 30px 70px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
        },
      },
        React.createElement('div', {
          style: { borderRadius: 24, overflow: 'hidden', background: '#0c1322', position: 'relative' },
        },
          React.createElement('div', {
            style: {
              position: 'absolute', top: 9, left: '50%', transform: 'translateX(-50%)',
              width: 54, height: 5, background: '#000', borderRadius: 3, zIndex: 2,
            },
          }),
          React.createElement('img', { src, alt: '', style: { width: '100%', display: 'block' } })
        )
      )
    )
  );
  const mlmr = isMobile ? -24 : -38;
  return React.createElement('div', {
    ref, className: 'reveal' + (shown ? ' in' : ''),
    style: { marginTop: 64 },
  },
    React.createElement('div', { style: { textAlign: 'center', maxWidth: 640, margin: '0 auto 36px' } },
      React.createElement('h3', {
        style: { fontSize: isMobile ? 24 : 30, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.2, marginBottom: 14 },
      }, 'Le tournoi dans la poche des spectateurs'),
      React.createElement('p', {
        style: { fontSize: 16, color: C.sub, lineHeight: 1.7 },
      }, 'Un simple QR code et chaque parent suit les scores en direct, le classement de sa poule et toutes les infos pratiques — lieu, contact, accès Google Maps — depuis son téléphone. Aucune inscription, aucune appli à installer.')
    ),
    React.createElement('div', {
      style: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
    },
      phone(SHOTS.spectateurClassement, -9, 1, 28, 0.85, 0, mlmr),
      phone(SHOTS.spectateur, 0, 3, 0, 1, 0, 0),
      phone(SHOTS.spectateurInfo, 9, 1, 28, 0.85, mlmr, 0)
    )
  );
}

function ShowcaseRow({ t, d, shot, flip, C, isMobile }) {
  const [ref, shown] = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal${shown ? " in" : ""}`}
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: isMobile ? 28 : 60,
        alignItems: "center",
        marginTop: 64,
      }}
    >
      <div style={{ order: flip && !isMobile ? 2 : 1 }}>
        <h3
          style={{
            fontSize: isMobile ? 24 : 30,
            fontWeight: 800,
            letterSpacing: -0.8,
            lineHeight: 1.2,
            marginBottom: 14,
          }}
        >
          {t}
        </h3>
        <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.7 }}>{d}</p>
      </div>
      <div style={{ order: flip && !isMobile ? 1 : 2 }}>
        <div
          className="lp-mock"
          style={{
            borderRadius: 14,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              height: 30,
              background: "#0c1322",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "0 12px",
            }}
          >
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <span
                key={c}
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: c,
                }}
              />
            ))}
          </div>
          <img src={shot} alt={t} style={{ width: "100%", display: "block" }} />
        </div>
      </div>
    </div>
  );
}

// ── Modal d'authentification unifié ──
function AuthModal({
  C,
  authMode,
  setAuthMode,
  form,
  u,
  error,
  loading,
  onSubmit,
  onClose,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, []);

  const inp = {
    width: "100%",
    padding: "13px 15px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 11,
    color: C.ink,
    fontSize: 15,
    fontFamily: "inherit",
    boxSizing: "border-box",
    outline: "none",
  };
  const lbl = {
    fontSize: 12,
    fontWeight: 700,
    color: C.sub,
    marginBottom: 7,
    display: "block",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(2,5,12,0.8)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        animation: "floatUp 0.3s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "linear-gradient(160deg, #0e1626, #0a0e1a)",
          border: "1px solid rgba(163,230,53,0.2)",
          borderRadius: 22,
          padding: 32,
          boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 18,
            right: 18,
            width: 34,
            height: 34,
            borderRadius: 9,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: C.sub,
            cursor: "pointer",
            fontSize: 17,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>

        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <img src={LOGO} alt="" style={{ height: 48, marginBottom: 12 }} />
          <h3
            style={{
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: -0.5,
              margin: 0,
            }}
          >
            {authMode === "signup"
              ? "Créez votre club"
              : "Content de vous revoir"}
          </h3>
          <p style={{ fontSize: 14, color: C.sub, margin: "6px 0 0" }}>
            {authMode === "signup"
              ? "Quelques secondes suffisent"
              : "Connectez-vous à votre espace"}
          </p>
        </div>

        {/* Toggle */}
        <div
          style={{
            display: "flex",
            gap: 5,
            padding: 5,
            background: "rgba(255,255,255,0.04)",
            borderRadius: 12,
            marginBottom: 24,
          }}
        >
          {[
            { k: "signup", l: "Inscription" },
            { k: "signin", l: "Connexion" },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setAuthMode(t.k)}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 9,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 14,
                fontWeight: 700,
                transition: "all 0.2s",
                background: authMode === t.k ? C.neon : "transparent",
                color: authMode === t.k ? "#060a12" : C.sub,
              }}
            >
              {t.l}
            </button>
          ))}
        </div>

        {error && (
          <div
            style={{
              padding: "11px 14px",
              background: "rgba(251,113,133,0.1)",
              border: "1px solid rgba(251,113,133,0.25)",
              borderRadius: 10,
              fontSize: 13,
              color: "#fb7185",
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {authMode === "signup" && (
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Nom du club</label>
            <input
              style={inp}
              value={form.clubName}
              onChange={(e) => u("clubName", e.target.value)}
              placeholder="US Bâgé, FC Lyon..."
            />
          </div>
        )}
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Email</label>
          <input
            style={inp}
            type="email"
            value={form.email}
            onChange={(e) => u("email", e.target.value)}
            placeholder="vous@club.fr"
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Mot de passe</label>
          <input
            style={inp}
            type="password"
            value={form.password}
            onChange={(e) => u("password", e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && authMode === "signin" && onSubmit()
            }
            placeholder="••••••••"
          />
        </div>
        {authMode === "signup" && (
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Confirmer le mot de passe</label>
            <input
              style={inp}
              type="password"
              value={form.confirmPassword}
              onChange={(e) => u("confirmPassword", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              placeholder="••••••••"
            />
          </div>
        )}

        <button
          onClick={onSubmit}
          disabled={loading}
          className="lp-btn-primary"
          style={{
            width: "100%",
            padding: "15px",
            background: C.neon,
            color: "#060a12",
            border: "none",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 800,
            cursor: loading ? "wait" : "pointer",
            fontFamily: "inherit",
            marginTop: 6,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? "Un instant…"
            : authMode === "signup"
              ? "Créer mon club"
              : "Se connecter"}
        </button>

        {authMode === "signin" && (
          <p
            style={{
              fontSize: 12,
              color: C.dim,
              textAlign: "center",
              marginTop: 16,
              lineHeight: 1.5,
            }}
          >
            Licencié ou parent ? Connectez-vous avec l'email reçu par votre
            club.
          </p>
        )}
        {authMode === "signup" && (
          <p
            style={{
              fontSize: 11,
              color: C.dim,
              textAlign: "center",
              marginTop: 16,
              lineHeight: 1.5,
            }}
          >
            En créant un compte, vous acceptez nos{" "}
            <a href="/?page=cgu" style={{ color: C.neon }}>
              CGU
            </a>{" "}
            et notre{" "}
            <a href="/?page=privacy" style={{ color: C.neon }}>
              politique de confidentialité
            </a>
            .
          </p>
        )}
      </div>
    </div>
  );
}
