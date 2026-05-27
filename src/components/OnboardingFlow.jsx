import React, { useState, useEffect } from 'react';
import {
  Zap, Plus, ChevronRight, Trophy, CircleDot, MapPin, Activity, Check,
} from 'lucide-react';
import { BackgroundFX } from './LoadingScreen';
import { tournamentService } from '../services/tournamentService';
import { styles } from '../styles/styles';

// ============================================================
// OnboardingFlow — flow d'entrée complet
//
// Étapes :
//   - welcome (intro courte)
//   - legal (mentions légales / RGPD à valider)
//   - permissions (notifs / caméra)
//   - mine (si tournois existants) OU choice (créer / rejoindre)
//   - code (saisie code spectateur)
//
// Les 3 premières étapes ne sont affichées qu'une seule fois
// (persistées en localStorage). Au lancement suivant, on saute
// directement à mine/choice.
// ============================================================
const ONBOARDING_KEY = 'footplanner_onboarding_v1';

function readOnboarding() {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeOnboarding(data) {
  try {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(data));
  } catch {}
}

export function OnboardingFlow({
  onAccessCodeSubmit, onCreateTournament, myTournaments, onPickTournament,
}) {
  const persisted = readOnboarding();
  const initialStep = persisted?.done
    ? (myTournaments?.length > 0 ? 'mine' : 'choice')
    : 'welcome';

  const [step, setStep] = useState(initialStep);
  const [legalAccepted, setLegalAccepted] = useState(persisted?.legalAccepted || false);
  const [notifGranted, setNotifGranted] = useState(persisted?.notifGranted ?? null);
  const [cameraGranted, setCameraGranted] = useState(persisted?.cameraGranted ?? null);

  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Si l'utilisateur a déjà fait l'onboarding et a maintenant des tournois,
  // bascule automatiquement de 'choice' vers 'mine'
  useEffect(() => {
    if (step === 'choice' && myTournaments?.length > 0) {
      setStep('mine');
    }
  }, [myTournaments, step]);

  const finishOnboarding = () => {
    writeOnboarding({
      done: true,
      legalAccepted,
      notifGranted,
      cameraGranted,
      completedAt: Date.now(),
    });
    setStep(myTournaments?.length > 0 ? 'mine' : 'choice');
  };

  const handleCodeSubmit = async () => {
    setCodeError('');
    setSubmitting(true);
    try {
      const t = await tournamentService.getByAccessCode(code);
      if (!t) {
        setCodeError("Code inconnu. Vérifie auprès de l'organisation.");
        return;
      }
      onAccessCodeSubmit(code.trim().toUpperCase());
    } catch (e) {
      setCodeError(e.message || 'Erreur réseau.');
    } finally {
      setSubmitting(false);
    }
  };

  // Indicateur de progression visuelle pour les 3 premières étapes
  const onboardingSteps = ['welcome', 'legal', 'permissions'];
  const showDots = onboardingSteps.includes(step);

  return (
    <div style={styles.app}>
      <BackgroundFX />
      <div style={styles.onboardingWrap}>
        <div style={styles.onboardingCard}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ ...styles.logoMark, width: 56, height: 56, borderRadius: 14 }}>
              <Zap size={28} strokeWidth={2.5} color="#0a0a0a" />
            </div>
          </div>

          {showDots && (
            <div style={styles.onbDots}>
              {onboardingSteps.map(s => (
                <div
                  key={s}
                  style={{
                    ...styles.onbDot,
                    background: step === s
                      ? '#a3e635'
                      : (onboardingSteps.indexOf(step) > onboardingSteps.indexOf(s) ? '#a3e63544' : '#1e293b'),
                  }}
                />
              ))}
            </div>
          )}

          {step === 'welcome' && (
            <>
              <div style={styles.onbTitle}>Bienvenue sur FOOTPLANNER</div>
              <div style={styles.onbSubtitle}>
                L'app des tournois de foot départementaux. Scores live, classements, notifications de tes équipes préférées.
              </div>
              <button onClick={() => setStep('legal')} style={{ ...styles.btnPrimary, marginTop: 24 }}>
                Commencer <ChevronRight size={16} />
              </button>
            </>
          )}

          {step === 'legal' && (
            <>
              <div style={styles.onbTitle}>Mentions légales</div>
              <div style={styles.legalScroll}>
                <p style={styles.legalP}>
                  <strong>Éditeur</strong><br />
                  FootPlanner — Application de gestion de tournois de football amateur. Tous droits réservés.
                </p>
                <p style={styles.legalP}>
                  <strong>Données personnelles (RGPD)</strong><br />
                  L'application traite uniquement les données nécessaires au fonctionnement du tournoi : email, nom des équipes, scores, identifiants techniques. Aucune donnée n'est partagée avec des tiers à des fins commerciales. Tu disposes d'un droit d'accès, de rectification et de suppression de tes données conformément au règlement européen 2016/679.
                </p>
                <p style={styles.legalP}>
                  <strong>Hébergement</strong><br />
                  Les données sont hébergées sur Supabase (UE), avec authentification chiffrée et politiques de sécurité au niveau base de données (Row Level Security).
                </p>
                <p style={styles.legalP}>
                  <strong>Propriété intellectuelle</strong><br />
                  Les logos, photos d'équipes et marques affichés appartiennent à leurs propriétaires respectifs.
                </p>
                <p style={styles.legalP}>
                  <strong>Cookies</strong><br />
                  L'application n'utilise pas de cookies de suivi. Seul un jeton d'authentification est stocké localement pour maintenir ta session.
                </p>
                <p style={styles.legalP}>
                  <strong>Conditions d'utilisation</strong><br />
                  En utilisant cette application, tu t'engages à respecter le fair-play sportif, à ne pas saisir d'informations diffamatoires ou fausses, et à respecter les autres utilisateurs.
                </p>
                <p style={styles.legalP}>
                  <strong>Contact</strong><br />
                  Pour toute question relative aux données personnelles : contact@footplanner.fr
                </p>
              </div>
              <label style={styles.legalCheck} onClick={() => setLegalAccepted(!legalAccepted)}>
                <div
                  style={{
                    ...styles.legalCheckbox,
                    background: legalAccepted ? '#a3e635' : 'transparent',
                    borderColor: legalAccepted ? '#a3e635' : '#475569',
                  }}
                >
                  {legalAccepted && <Check size={12} color="#0a0a0a" strokeWidth={3} />}
                </div>
                <span>J'ai lu et j'accepte les mentions légales et les conditions d'utilisation.</span>
              </label>
              <button
                onClick={() => setStep('permissions')}
                disabled={!legalAccepted}
                style={{ ...styles.btnPrimary, marginTop: 14, opacity: legalAccepted ? 1 : 0.4 }}
              >
                Continuer <ChevronRight size={16} />
              </button>
            </>
          )}

          {step === 'permissions' && (
            <>
              <div style={styles.onbTitle}>Autorisations</div>
              <div style={styles.onbSubtitle}>
                Accorde ces accès pour profiter pleinement de l'application. Tu pourras les modifier à tout moment dans les réglages de ton téléphone.
              </div>

              <div style={styles.permCard}>
                <div style={{ ...styles.permIcon, background: '#a3e63515', borderColor: '#a3e63544' }}>
                  <Activity size={18} color="#a3e635" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.permTitle}>Notifications</div>
                  <div style={styles.permDesc}>
                    Avant les matchs, scores en direct de tes équipes, annonces de l'organisation.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => setNotifGranted(false)}
                    style={{
                      ...styles.permBtn,
                      background: notifGranted === false ? 'rgba(100,116,139,0.2)' : 'transparent',
                      color: notifGranted === false ? '#94a3b8' : '#64748b',
                    }}
                  >
                    Non
                  </button>
                  <button
                    onClick={() => setNotifGranted(true)}
                    style={{
                      ...styles.permBtn,
                      background: notifGranted === true ? 'rgba(34,211,238,0.15)' : 'transparent',
                      color: notifGranted === true ? '#a3e635' : '#64748b',
                      borderColor: notifGranted === true ? '#a3e63555' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    Autoriser
                  </button>
                </div>
              </div>

              <div style={styles.permCard}>
                <div style={{ ...styles.permIcon, background: '#818cf815', borderColor: '#818cf844' }}>
                  <CircleDot size={18} color="#818cf8" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.permTitle}>Caméra</div>
                  <div style={styles.permDesc}>
                    Pour scanner le QR code des futurs tournois et changer rapidement de tournoi.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => setCameraGranted(false)}
                    style={{
                      ...styles.permBtn,
                      background: cameraGranted === false ? 'rgba(100,116,139,0.2)' : 'transparent',
                      color: cameraGranted === false ? '#94a3b8' : '#64748b',
                    }}
                  >
                    Non
                  </button>
                  <button
                    onClick={() => setCameraGranted(true)}
                    style={{
                      ...styles.permBtn,
                      background: cameraGranted === true ? 'rgba(167,139,250,0.15)' : 'transparent',
                      color: cameraGranted === true ? '#818cf8' : '#64748b',
                      borderColor: cameraGranted === true ? '#818cf855' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    Autoriser
                  </button>
                </div>
              </div>

              <button onClick={finishOnboarding} style={{ ...styles.btnPrimary, marginTop: 14 }}>
                <Check size={16} /> ENTRER DANS L'APPLICATION
              </button>
            </>
          )}

          {step === 'mine' && (
            <>
              <div style={styles.onbTitle}>Tes tournois</div>
              <div style={styles.onbSubtitle}>
                Reprends un tournoi en cours, ou démarres-en un nouveau.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18, maxHeight: 280, overflowY: 'auto' }}>
                {myTournaments.map(t => (
                  <button
                    key={t.id}
                    onClick={() => onPickTournament(t.id)}
                    style={styles.archiveCard || { padding: 12, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, textAlign: 'left' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <div
                        style={{
                          color: t.status === 'archived' ? '#94a3b8' : '#a3e635',
                          borderColor: (t.status === 'archived' ? '#94a3b8' : '#a3e635') + '55',
                          background: (t.status === 'archived' ? '#94a3b8' : '#a3e635') + '15',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          padding: '2px 6px',
                          fontSize: 9,
                          fontWeight: 800,
                          letterSpacing: 1,
                          borderRadius: 4,
                          border: '1px solid',
                        }}
                      >
                        {t.status === 'archived' ? <Trophy size={9} /> : <CircleDot size={9} />}
                        {t.status === 'archived' ? 'ARCHIVÉ' : 'EN COURS'}
                      </div>
                      {t.date && (
                        <span style={{ fontSize: 10, color: '#64748b' }}>
                          {new Date(t.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{t.name}</div>
                    {t.location && (
                      <div style={{ fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                        <MapPin size={9} /> {t.location}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div style={styles.onbDivider}>
                <div style={styles.onbDividerLine} />
                <span style={styles.onbDividerText}>OU</span>
                <div style={styles.onbDividerLine} />
              </div>

              <button onClick={() => setStep('code')} style={styles.btnSecondary}>
                Rejoindre via un code spectateur
              </button>
              <button onClick={onCreateTournament} style={{ ...styles.btnPrimary, marginTop: 6 }}>
                <Plus size={16} /> Nouveau tournoi
              </button>
            </>
          )}

          {step === 'choice' && (
            <>
              <div style={styles.onbTitle}>Bienvenue</div>
              <div style={styles.onbSubtitle}>
                Tu organises un tournoi ou tu viens en spectateur ?
              </div>

              <button onClick={onCreateTournament} style={{ ...styles.btnPrimary, marginTop: 18 }}>
                <Plus size={16} /> Créer un tournoi
              </button>

              <div style={styles.onbDivider}>
                <div style={styles.onbDividerLine} />
                <span style={styles.onbDividerText}>OU</span>
                <div style={styles.onbDividerLine} />
              </div>

              <button onClick={() => setStep('code')} style={styles.btnSecondary}>
                Rejoindre via un code (spectateur)
              </button>
            </>
          )}

          {step === 'code' && (
            <>
              <div style={styles.onbTitle}>Code du tournoi</div>
              <div style={styles.onbSubtitle}>
                Saisis le code communiqué par l'organisation.
              </div>
              <input
                autoFocus
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase().slice(0, 8)); setCodeError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
                placeholder="EX : DEMO26"
                style={{
                  ...styles.input,
                  marginTop: 18,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: 4,
                  textAlign: 'center',
                  padding: '16px',
                }}
              />
              {codeError && (
                <div style={{ ...styles.fieldError, marginTop: 8, textAlign: 'center' }}>{codeError}</div>
              )}
              <button
                onClick={handleCodeSubmit}
                disabled={!code.trim() || submitting}
                style={{ ...styles.btnPrimary, marginTop: 12, opacity: (code.trim() && !submitting) ? 1 : 0.4 }}
              >
                {submitting ? 'Vérification…' : <>Valider <ChevronRight size={16} /></>}
              </button>
              <button
                onClick={() => setStep(myTournaments?.length > 0 ? 'mine' : 'choice')}
                style={{ ...styles.btnSecondary, marginTop: 8 }}
              >
                Retour
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
