import React, { useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { Crest } from './Crest';
import { FieldText, FieldRow } from './form/Fields';
import { styles } from '../styles/styles';

// ============================================================
// MatchEditor — modal plein écran d'édition de match
// (matchs de poule manuels uniquement — les knockouts sont auto-générés)
// ============================================================
export function MatchEditor({
  match, teams, fields, pools, onSave, onDelete, onCancel,
}) {
  const [home, setHome] = useState(match?.home || teams[0]?.id || '');
  const [away, setAway] = useState(match?.away || teams[1]?.id || '');
  const [pool, setPool] = useState(
    match?.pool
    || teams.find(t => t.id === (match?.home || teams[0]?.id))?.pool
    || pools[0] || 'A'
  );
  const [field, setField] = useState(match?.field || fields[0] || 'T1');
  const [time, setTime] = useState((match?.time || '09:00').slice(0, 5));
  const [round, setRound] = useState(match?.round || 1);
  const [referee, setReferee] = useState(match?.referee || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const homeTeam = teams.find(t => t.id === home);
  const awayTeam = teams.find(t => t.id === away);
  const valid = home && away && home !== away && field && time;

  const handleSave = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError('');
    try {
      await onSave({
        id: match?.id,
        home,
        away,
        pool,
        field,
        time,
        round: parseInt(round) || 1,
        referee,
        phase: match?.phase || 'pool',
        // En cas de modification, on garde score/status/fairplay
        ...(match ? {
          scoreHome: match.scoreHome,
          scoreAway: match.scoreAway,
          status: match.status,
          fairplayHome: match.fairplayHome,
          fairplayAway: match.fairplayAway,
        } : {}),
      });
    } catch (e) {
      setError(e.message || 'Erreur d\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.fullscreenSheet}>
      <div style={styles.sheetHead}>
        <button onClick={onCancel} style={styles.sheetBack}>
          <X size={18} />
        </button>
        <span style={styles.sheetTitle}>
          {match ? 'Modifier le match' : 'Nouveau match'}
        </span>
        <button
          onClick={handleSave}
          disabled={!valid || saving}
          style={{ ...styles.sheetSave, opacity: (valid && !saving) ? 1 : 0.35 }}
        >
          {saving ? '…' : (match ? 'ENREGISTRER' : 'CRÉER')}
        </button>
      </div>

      <div style={styles.sheetBody}>
        {homeTeam && awayTeam && (
          <div style={styles.matchPreview}>
            <div style={styles.previewSide}>
              <Crest team={homeTeam} size="lg" />
              <div style={styles.previewName}>{homeTeam.name}</div>
            </div>
            <div style={styles.previewVs}>VS</div>
            <div style={styles.previewSide}>
              <Crest team={awayTeam} size="lg" />
              <div style={styles.previewName}>{awayTeam.name}</div>
            </div>
          </div>
        )}

        <div style={styles.field}>
          <span style={styles.fieldLabel}>Équipe 1</span>
          <select
            value={home}
            onChange={(e) => {
              setHome(e.target.value);
              const t = teams.find(x => x.id === e.target.value);
              if (t) setPool(t.pool);
            }}
            style={styles.input}
          >
            {teams.map(t => (
              <option key={t.id} value={t.id}>
                {t.isHost ? '★ ' : ''}{t.name} (P.{t.pool})
              </option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
          <span style={styles.fieldLabel}>Équipe 2</span>
          <select
            value={away}
            onChange={(e) => setAway(e.target.value)}
            style={styles.input}
          >
            {teams.filter(t => t.id !== home).map(t => (
              <option key={t.id} value={t.id}>
                {t.isHost ? '★ ' : ''}{t.name} (P.{t.pool})
              </option>
            ))}
          </select>
          {home === away && (
            <span style={styles.fieldError}>Choisis deux équipes différentes</span>
          )}
        </div>

        <FieldRow>
          <div style={styles.field}>
            <span style={styles.fieldLabel}>Terrain</span>
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              style={styles.input}
            >
              {fields.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <FieldText label="Heure" type="time" value={time} onChange={setTime} />
        </FieldRow>

        <FieldRow>
          <div style={styles.field}>
            <span style={styles.fieldLabel}>Poule</span>
            <select
              value={pool}
              onChange={(e) => setPool(e.target.value)}
              style={styles.input}
            >
              {pools.map(p => <option key={p} value={p}>Poule {p}</option>)}
            </select>
          </div>
          <FieldText label="Tour / Journée" type="number" value={round} onChange={setRound} />
        </FieldRow>

        <FieldText
          label="Arbitre (optionnel)"
          value={referee}
          onChange={setReferee}
          placeholder="Nom de l'arbitre"
        />

        {error && (
          <div style={{ ...styles.fieldError, textAlign: 'center', marginTop: 4 }}>{error}</div>
        )}

        <button
          onClick={handleSave}
          disabled={!valid || saving}
          style={{ ...styles.btnPrimary, marginTop: 8, opacity: (valid && !saving) ? 1 : 0.4 }}
        >
          <Save size={14} /> {saving ? 'Enregistrement…' : (match ? 'ENREGISTRER LE MATCH' : 'CRÉER LE MATCH')}
        </button>

        {onDelete && (
          <button onClick={onDelete} style={{ ...styles.btnDanger, marginTop: 4 }}>
            <Trash2 size={14} /> Supprimer ce match
          </button>
        )}
      </div>
    </div>
  );
}
