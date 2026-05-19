import React, { useState } from 'react';
import { Crown, Flag, Shield, Eye, Check, ShieldCheck, Lock, UserCheck } from 'lucide-react';
import { PageHeader } from './MatchCards';
import { styles } from '../styles/styles';

const ROLES = {
  organizer: { label: 'Organisateur', icon: Crown, color: '#f59e0b', desc: 'Configurer le tournoi, équipes, scores, planning.' },
  referee: { label: 'Arbitre', icon: Flag, color: '#22d3ee', desc: 'Saisir et valider les scores des matchs.' },
  coach: { label: 'Coach', icon: Shield, color: '#a78bfa', desc: 'Suivre les équipes en lecture seule.' },
  spectator: { label: 'Spectateur', icon: Eye, color: '#94a3b8', desc: 'Consulter scores, classements, suivre des équipes.' },
};

// ============================================================
// RoleSwitcher
//
// Logique multi-tenant Supabase :
// - L'utilisateur connecté qui est owner du tournoi peut basculer librement.
// - Un visiteur (non-owner) ne peut pas devenir organizer ; pour devenir
//   referee il doit saisir le code arbitre qui matche tournament.refereeCode.
// - Le rôle est uniquement un mode d'affichage local — RLS reste l'autorité.
// ============================================================
export function RoleSwitcher({
  role, setRole, setView, tournament, user,
  refereeCode, lockRole, handleRefereeCodeSubmit,
}) {
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [error, setError] = useState('');

  // L'utilisateur est-il propriétaire de ce tournoi ?
  const isOwner = user && tournament && tournament.ownerId === user.id;

  // Rôles "débloqués" pour ce device :
  // - owner : tous
  // - non-owner avec refereeCode valide : referee + coach + spectator
  // - non-owner sans code : coach + spectator
  let unlocked = ['spectator', 'coach'];
  if (isOwner) {
    unlocked = ['organizer', 'referee', 'coach', 'spectator'];
  } else if (refereeCode) {
    unlocked = ['referee', 'coach', 'spectator'];
  }

  const visibleRoles = Object.entries(ROLES).filter(([k]) => unlocked.includes(k));
  const hasStaffAccess = unlocked.includes('referee') || unlocked.includes('organizer');

  const submitCode = () => {
    setError('');
    const ok = handleRefereeCodeSubmit(codeInput.trim().toUpperCase());
    if (ok) {
      setShowCodeInput(false);
      setCodeInput('');
      setView('dashboard');
    } else {
      setError('Code arbitre invalide.');
    }
  };

  return (
    <div style={{ paddingBottom: 130 }}>
      <PageHeader
        title="Rôle actif"
        subtitle="Choisis ton point de vue dans l'app"
        icon={UserCheck}
        accent="#22d3ee"
      />

      <div style={styles.cardStack}>
        {visibleRoles.map(([key, r]) => {
          const Icon = r.icon;
          const active = role === key;
          const isStaff = key === 'organizer' || key === 'referee';
          return (
            <div key={key} style={{ position: 'relative' }}>
              <button
                onClick={() => { setRole(key); setView('dashboard'); }}
                style={{
                  ...styles.roleCard,
                  borderColor: active ? r.color : '#1e293b',
                  background: active ? r.color + '0d' : 'rgba(15,23,42,0.4)',
                  width: '100%',
                }}
              >
                <div style={{ ...styles.roleIcon, background: r.color + '15', borderColor: r.color + '55' }}>
                  <Icon size={20} color={r.color} strokeWidth={2.2} />
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {r.label}
                    {isStaff && <ShieldCheck size={11} color="#34d399" />}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{r.desc}</div>
                </div>
                {active && <div style={{ ...styles.activeMark, color: r.color }}><Check size={16} /></div>}
              </button>
              {key === 'referee' && !isOwner && refereeCode && !active && (
                <button
                  onClick={(e) => { e.stopPropagation(); lockRole('referee'); }}
                  style={styles.roleLockBtn}
                  title="Verrouiller ce rôle"
                >
                  <Lock size={11} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Saisie du code arbitre — uniquement si non-owner et pas encore débloqué */}
      {!isOwner && (
        <section style={styles.section}>
          {!showCodeInput ? (
            <button onClick={() => setShowCodeInput(true)} style={styles.staffAccessTrigger}>
              <ShieldCheck size={13} color="#64748b" />
              <span>{hasStaffAccess ? 'Ressaisir un code' : 'Accès staff (code arbitre)'}</span>
            </button>
          ) : (
            <div style={styles.staffAccessBox}>
              <div style={styles.staffAccessTitle}>
                <ShieldCheck size={13} color="#22d3ee" /> CODE ARBITRE
              </div>
              <div style={styles.staffAccessDesc}>
                Saisis le code communiqué par l'organisateur pour pouvoir saisir les scores.
              </div>
              <input
                autoFocus
                value={codeInput}
                onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && submitCode()}
                placeholder="EX: ARB-1234"
                style={{
                  ...styles.input,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: 1,
                  textAlign: 'center',
                  fontSize: 15,
                }}
              />
              {error && <span style={styles.fieldError}>{error}</span>}
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button
                  onClick={() => { setShowCodeInput(false); setCodeInput(''); setError(''); }}
                  style={{ ...styles.btnSecondary, flex: 1, padding: '11px' }}
                >
                  Annuler
                </button>
                <button onClick={submitCode} style={{ ...styles.btnPrimary, flex: 1, padding: '11px' }}>
                  Valider
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
