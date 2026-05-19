import React, { useState } from 'react';
import { Zap, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { BackgroundFX } from './LoadingScreen';
import { styles } from '../styles/styles';

// ============================================================
// AuthScreen — login / signup Supabase
// Affiché tant que user === null
// ============================================================
export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const valid = email.trim() && password.length >= 6 && (mode === 'signin' || displayName.trim());

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      if (mode === 'signin') {
        await signIn({ email: email.trim(), password });
      } else {
        await signUp({ email: email.trim(), password, displayName: displayName.trim() });
      }
    } catch (err) {
      setError(translateError(err.message));
    } finally {
      setSubmitting(false);
    }
  };

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
          <div style={styles.onbTitle}>
            {mode === 'signin' ? 'Connexion' : 'Créer un compte'}
          </div>
          <div style={styles.onbSubtitle}>
            {mode === 'signin'
              ? 'Connecte-toi pour gérer tes tournois.'
              : 'Crée ton compte d\'organisateur pour démarrer un premier tournoi.'}
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
            {mode === 'signup' && (
              <label style={styles.field}>
                <span style={styles.fieldLabel}>
                  <User size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Nom affiché
                </span>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Jean Dupont"
                  style={styles.input}
                  autoComplete="name"
                />
              </label>
            )}

            <label style={styles.field}>
              <span style={styles.fieldLabel}>
                <Mail size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@club.fr"
                style={styles.input}
                autoComplete="email"
                autoFocus
              />
            </label>

            <label style={styles.field}>
              <span style={styles.fieldLabel}>
                <Lock size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Mot de passe
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6 caractères minimum"
                style={styles.input}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </label>

            {error && <div style={{ ...styles.fieldError, textAlign: 'center', marginTop: 4 }}>{error}</div>}

            <button
              type="submit"
              disabled={!valid || submitting}
              style={{ ...styles.btnPrimary, marginTop: 6, opacity: (valid && !submitting) ? 1 : 0.4 }}
            >
              {submitting
                ? 'Patiente…'
                : (
                  <>
                    {mode === 'signin' ? 'Se connecter' : 'Créer mon compte'}
                    <ArrowRight size={16} />
                  </>
                )}
            </button>
          </form>

          <div style={styles.onbDivider}>
            <div style={styles.onbDividerLine} />
            <span style={styles.onbDividerText}>OU</span>
            <div style={styles.onbDividerLine} />
          </div>

          <button
            type="button"
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
            style={styles.btnSecondary}
          >
            {mode === 'signin' ? 'Créer un nouveau compte' : 'J\'ai déjà un compte'}
          </button>

          <div style={{ ...styles.onbHint, marginTop: 14, textAlign: 'center' }}>
            En continuant, tu acceptes les <strong style={{ color: '#cbd5e1' }}>conditions d'utilisation</strong> et la <strong style={{ color: '#cbd5e1' }}>politique de confidentialité</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}

function translateError(msg) {
  if (!msg) return 'Une erreur est survenue.';
  const lower = msg.toLowerCase();
  if (lower.includes('invalid login')) return 'Email ou mot de passe incorrect.';
  if (lower.includes('already registered')) return 'Un compte existe déjà avec cet email.';
  if (lower.includes('email not confirmed')) return 'Email non confirmé — vérifie ta boîte mail.';
  if (lower.includes('password')) return 'Mot de passe trop court (6 caractères minimum).';
  if (lower.includes('rate limit')) return 'Trop de tentatives, réessaie dans une minute.';
  return msg;
}
