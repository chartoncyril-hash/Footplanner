import React, { useState } from 'react';
import {
  Settings, ArrowLeft, Hash, ShieldCheck, Trophy, MapPin,
  Edit3, Check, RefreshCw, LogOut, Calendar, Award, Sparkles,
  Lock, Star, Play, Zap,
} from 'lucide-react';
import { PageHeader } from './MatchCards';
import { FieldText, FieldRow } from './form/Fields';
import {
  BonusToggle, RankingByCategory, CategoryDurations, KnockoutToggle,
  FieldsEditor, ScoringInput, AnnouncementsManager, SponsorsManager,
} from './SettingsParts';
import { useAnnouncements, useSponsors } from '../hooks/useTournamentSecondary';
import { tournamentService } from '../services/tournamentService';
import { styles } from '../styles/styles';

const ALL_CATEGORIES = ['U7', 'U9', 'U11', 'U13', 'U15', 'U17', 'Senior'];

// ============================================================
// SettingsView — réglages complets du tournoi
// ============================================================
export function SettingsView({
  tournament, role, setView,
  closeTournament, signOut, updateTournament,
  askConfirm, closeConfirm,
}) {
  const [copied, setCopied] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');

  // Hooks données
  const annHook = useAnnouncements(tournament.id);
  const spHook = useSponsors(tournament.id);

  if (role !== 'organizer') {
    return (
      <div style={{ paddingBottom: 130 }}>
        <PageHeader title="Réglages" icon={Settings} accent="#34d399" />
        <div style={styles.lockedBox}>
          <Lock size={28} color="#64748b" />
          <div style={{ fontSize: 14, fontWeight: 700, color: '#cbd5e1', marginTop: 8 }}>
            Accès restreint
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Seul l'organisateur peut configurer le tournoi
          </div>
        </div>
      </div>
    );
  }

  // Helpers
  const [toast, setToast] = useState(null);
  const showToast = (message, isError = false) => {
    setToast({ message, isError, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  };

  const safeUpdate = async (patch) => {
    setError('');
    try {
      await updateTournament(patch);
      showToast('✓ Modifications enregistrées');
    } catch (e) {
      setError(e.message || 'Erreur de sauvegarde.');
      showToast('Erreur lors de l\'enregistrement', true);
    }
  };

  const copy = (text, key) => {
    try {
      navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    } catch {}
  };

  const regenAccessCode = async () => {
    setRegenerating(true);
    try {
      await safeUpdate({ accessCode: tournamentService.generateAccessCode() });
    } finally { setRegenerating(false); }
  };

  const regenRefereeCode = async () => {
    setRegenerating(true);
    try {
      await safeUpdate({ refereeCode: tournamentService.generateRefereeCode() });
    } finally { setRegenerating(false); }
  };

  const scoring = tournament.scoring || { win: 3, draw: 1, loss: 0 };
  const bonuses = tournament.bonuses || {};
  const fairplay = bonuses.fairplay || { enabled: false, points: 1 };
  const cleanSheet = bonuses.cleanSheet || { enabled: false, points: 1 };

  return (
    <div style={{ paddingBottom: 130 }}>
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          padding: '12px 20px',
          background: toast.isError ? '#fb7185' : '#22c55e',
          color: '#0a0e1a',
          borderRadius: 10,
          fontWeight: 800,
          fontSize: 13,
          letterSpacing: 0.5,
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          zIndex: 10000,
        }}>
          {toast.message}
        </div>
      )}
      <button onClick={() => setView('dashboard')} style={styles.backBtn}>
        <ArrowLeft size={16} /> Retour au tournoi
      </button>

      <PageHeader
        title="Réglages tournoi"
        subtitle="Configuration complète"
        icon={Settings}
        accent="#34d399"
      />

      {error && (
        <div style={{ ...styles.fieldError, marginBottom: 10, textAlign: 'center' }}>{error}</div>
      )}

      {/* === IDENTITÉ === */}
      <SettingCard title="IDENTITÉ DU TOURNOI" icon={Trophy} color="#22d3ee">
        <FieldText
          label="Nom"
          value={tournament.name || ''}
          onChange={(v) => safeUpdate({ name: v })}
        />
        <FieldText
          label="Lieu"
          value={tournament.location || ''}
          onChange={(v) => safeUpdate({ location: v })}
          placeholder="Ex : Stade Municipal — Ville-sur-Loire"
        />
        <FieldRow>
          <FieldText
            label="Date"
            type="date"
            value={tournament.date || ''}
            onChange={(v) => safeUpdate({ date: v })}
          />
          <FieldText
            label="Heure début"
            type="time"
            value={(tournament.startTime || '09:00').slice(0, 5)}
            onChange={(v) => safeUpdate({ startTime: v })}
          />
        </FieldRow>
      </SettingCard>

      {/* === CATÉGORIES === */}
      <SettingCard title="CATÉGORIES DU TOURNOI" icon={Calendar} color="#a78bfa">
        {Array.isArray(tournament.categories) && tournament.categories.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {tournament.categories.map(cat => (
              <span
                key={cat}
                style={{
                  padding: '4px 10px',
                  background: 'rgba(167,139,250,0.15)',
                  border: '1px solid rgba(167,139,250,0.4)',
                  borderRadius: 6,
                  color: '#a78bfa',
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                }}
              >
                {cat}
              </span>
            ))}
          </div>
        ) : (
          <div style={{
            padding: 12,
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(255,255,255,0.08)',
            borderRadius: 8,
            textAlign: 'center',
            color: '#64748b',
            fontSize: 11,
            marginBottom: 10,
          }}>
            Aucune categorie definie
          </div>
        )}
        <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.5 }}>
          Pour ajouter, modifier ou supprimer des categories, utilise le bouton "Gerer les categories" dans la barre laterale, ou ouvre les parametres du tournoi (icone engrenage).
        </div>
      </SettingCard>

      {/* === CLASSEMENT PAR CATÉGORIE === */}
      <SettingCard title="CLASSEMENT PAR CATÉGORIE" icon={Trophy} color="#facc15">
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, lineHeight: 1.4 }}>
          Active ou désactive le classement pour chaque catégorie. Recommandé OFF en U7/U9 (football d'animation).
        </div>
        <RankingByCategory
          rankings={tournament.rankingByCategory || {}}
          categories={tournament.categories || []}
          onChange={(v) => safeUpdate({ rankingByCategory: v })}
        />
      </SettingCard>

      {/* === DURÉES PAR CATÉGORIE === */}
      <SettingCard title="DURÉE DES MATCHS" icon={Calendar} color="#22d3ee">
        <CategoryDurations
          durations={tournament.categoryDurations || {}}
          categories={tournament.categories || []}
          onChange={(v) => safeUpdate({ categoryDurations: v })}
        />
        <FieldText
          label="Pause entre matchs (min)"
          type="number"
          value={tournament.breakBetweenMatches ?? 3}
          onChange={(v) => safeUpdate({ breakBetweenMatches: parseInt(v) || 0 })}
        />
      </SettingCard>

      {/* === TERRAINS === */}
      <SettingCard title="TERRAINS DISPONIBLES" icon={MapPin} color="#34d399">
        <FieldsEditor
          fields={tournament.fields || ['T1', 'T2', 'T3', 'T4']}
          onChange={(v) => safeUpdate({ fields: v })}
        />
      </SettingCard>

      {/* === LANCEMENT DES MATCHS === */}
      <SettingCard title="LANCEMENT DES MATCHS" icon={Play} color="#22d3ee">
        <div style={{ ...styles.bonusRow, borderColor: tournament.autoKickoff !== false ? '#22d3ee55' : '#1e293b' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.bonusLabel}>Coup d'envoi automatique</div>
            <div style={styles.bonusDesc}>
              Les matchs passent automatiquement en LIVE à l'heure prévue. Désactive si tu préfères les lancer manuellement.
            </div>
          </div>
          <button
            onClick={() => safeUpdate({ autoKickoff: tournament.autoKickoff === false })}
            style={{ ...styles.switch, background: tournament.autoKickoff !== false ? '#22d3ee' : '#334155' }}
          >
            <div style={{ ...styles.switchKnob, transform: tournament.autoKickoff !== false ? 'translateX(16px)' : 'translateX(0)' }} />
          </button>
        </div>
        {tournament.autoKickoff !== false && (
          <div style={{ ...styles.helpBox, borderColor: '#facc1555', background: 'rgba(250,204,21,0.06)' }}>
            <Zap size={12} color="#facc15" />
            <span>
              <strong style={{ color: '#facc15' }}>Important :</strong> garde l'app ouverte sur l'ordinateur de l'organisateur pour que les coups d'envoi se déclenchent.
            </span>
          </div>
        )}
      </SettingCard>
      
      {/* === FORMAT (PHASE FINALE) === */}
      <SettingCard title="FORMAT DU TOURNOI" icon={Trophy} color="#f59e0b">
        <KnockoutToggle
          enabled={tournament.hasKnockout}
          onToggle={(v) => safeUpdate({ hasKnockout: v })}
          topN={tournament.knockoutFromTopN || 2}
          onTopN={(v) => safeUpdate({ knockoutFromTopN: v })}
          hasThirdPlace={tournament.hasThirdPlace !== false}
          onThirdPlace={(v) => safeUpdate({ hasThirdPlace: v })}
          hasConsolation={tournament.hasConsolation === true}
          onConsolation={(v) => safeUpdate({ hasConsolation: v })}
          knockoutFormat={tournament.knockoutFormat || 'standard'}
          onKnockoutFormat={(v) => safeUpdate({ knockoutFormat: v })}
          knockoutFields={tournament.knockoutFields}
          onKnockoutFields={(v) => safeUpdate({ knockoutFields: v })}
          tournamentFields={Array.isArray(tournament.fields) ? tournament.fields : []}
        />
      </SettingCard>

      {/* === BARÈME === */}
      <SettingCard title="BARÈME DE POINTS" icon={Award} color="#a78bfa">
        <div style={styles.scoringRow}>
          <ScoringInput
            label="VICTOIRE"
            value={scoring.win}
            color="#34d399"
            onChange={(v) => safeUpdate({ scoring: { ...scoring, win: v } })}
          />
          <ScoringInput
            label="NUL"
            value={scoring.draw}
            color="#facc15"
            onChange={(v) => safeUpdate({ scoring: { ...scoring, draw: v } })}
          />
          <ScoringInput
            label="DÉFAITE"
            value={scoring.loss}
            color="#f87171"
            onChange={(v) => safeUpdate({ scoring: { ...scoring, loss: v } })}
          />
        </div>
      </SettingCard>

      {/* === BONUS === */}
      <SettingCard title="BONUS" icon={Star} color="#facc15">
        <BonusToggle
          label="Bonus fair-play"
          desc="Points additionnels si l'équipe respecte le fair-play sur le match."
          enabled={fairplay.enabled}
          points={fairplay.points}
          onToggle={(v) => safeUpdate({ bonuses: { ...bonuses, fairplay: { ...fairplay, enabled: v } } })}
          onPoints={(v) => safeUpdate({ bonuses: { ...bonuses, fairplay: { ...fairplay, points: v } } })}
        />
        <BonusToggle
          label="Bonus clean sheet"
          desc="Points additionnels si l'équipe ne prend aucun but."
          enabled={cleanSheet.enabled}
          points={cleanSheet.points}
          onToggle={(v) => safeUpdate({ bonuses: { ...bonuses, cleanSheet: { ...cleanSheet, enabled: v } } })}
          onPoints={(v) => safeUpdate({ bonuses: { ...bonuses, cleanSheet: { ...cleanSheet, points: v } } })}
        />
      </SettingCard>

      {/* === CODES D'ACCÈS === */}
      <SettingCard title="CODE D'ACCÈS SPECTATEUR" icon={Hash} color="#22d3ee">
        <CodeDisplay
          code={tournament.accessCode}
          color="#22d3ee"
          copied={copied === 'access'}
          onCopy={() => copy(tournament.accessCode, 'access')}
          onRegenerate={regenAccessCode}
          regenerating={regenerating}
        />
        <div style={styles.helpBox}>
          <Sparkles size={12} color="#22d3ee" />
          <span>Communique ce code aux spectateurs ou affiche-le sous forme de QR sur place.</span>
        </div>
      </SettingCard>

      <SettingCard title="CODE ARBITRE" icon={ShieldCheck} color="#f59e0b">
        <CodeDisplay
          code={tournament.refereeCode}
          color="#f59e0b"
          copied={copied === 'ref'}
          onCopy={() => copy(tournament.refereeCode, 'ref')}
          onRegenerate={regenRefereeCode}
          regenerating={regenerating}
        />
        <div style={styles.helpBox}>
          <Sparkles size={12} color="#f59e0b" />
          <span>À partager avec les arbitres pour leur permettre de saisir les scores.</span>
        </div>
      </SettingCard>

      {/* === ANNONCES === */}
      <SettingCard title="ANNONCES À DIFFUSER" icon={Sparkles} color="#22d3ee">
        <AnnouncementsManager
          announcements={annHook.list}
          onAdd={annHook.create}
          onRemove={annHook.remove}
        />
      </SettingCard>

      {/* === SPONSORS === */}
      <SettingCard title="SPONSORS DU TOURNOI" icon={Award} color="#a78bfa">
        <SponsorsManager
          sponsors={spHook.list}
          library={spHook.library}
          onAdd={spHook.create}
          onRemove={spHook.remove}
          onImport={spHook.importFromLibrary}
          onRemoveLibrary={spHook.removeLibrary}
        />
      </SettingCard>

      {/* === CYCLE DE VIE === */}
      <SettingCard title="CYCLE DE VIE" icon={Trophy} color="#fb7185">
        <button onClick={closeTournament} style={styles.btnSecondary}>
          <Trophy size={14} /> Archiver ce tournoi
        </button>
      </SettingCard>

      {/* === COMPTE === */}
      <SettingCard title="COMPTE" icon={LogOut} color="#94a3b8">
        <button onClick={signOut} style={styles.btnSecondary}>
          <LogOut size={14} /> Se déconnecter
        </button>
      </SettingCard>
    </div>
  );
}

// ============================================================
// SettingCard — wrapper visuel d'une section de réglages
// ============================================================
function SettingCard({ title, icon: Icon, color, children }) {
  return (
    <section style={styles.section}>
      <div style={{ ...styles.sectionHeader, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ ...styles.sectionIconBox, background: color + '15', borderColor: color + '40' }}>
            <Icon size={13} color={color} strokeWidth={2.5} />
          </div>
          <span style={styles.sectionTitle}>{title}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </section>
  );
}

// ============================================================
// CodeDisplay — affichage + copie + régénération d'un code
// ============================================================
function CodeDisplay({ code, color, copied, onCopy, onRegenerate, regenerating }) {
  return (
    <>
      <div
        style={{
          padding: '14px',
          background: color + '0e',
          border: `1px solid ${color}33`,
          borderRadius: 10,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 28, fontWeight: 800, letterSpacing: 5, color,
            fontFamily: "'JetBrains Mono', monospace",
            textShadow: `0 0 20px ${color}40`,
          }}
        >
          {code || '—'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onCopy} style={{ ...styles.btnSecondary, flex: 1 }}>
          {copied
            ? <><Check size={13} color="#34d399" /> Copié</>
            : <><Edit3 size={13} /> Copier</>}
        </button>
        <button onClick={onRegenerate} disabled={regenerating} style={{ ...styles.btnSecondary, flex: 1 }}>
          <RefreshCw size={13} /> {regenerating ? '…' : 'Régénérer'}
        </button>
      </div>
    </>
  );
}
