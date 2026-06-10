import React from 'react';
import { MinusCircle, PlusCircle } from 'lucide-react';
import { styles } from '../../styles/styles';

// ============================================================
// Primitives de formulaire — réutilisées par tous les éditeurs
// ============================================================

export function FieldText({ label, value, onChange, type = 'text', placeholder, multiline = false, disabled = false }) {
  return (
    <label style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={4}
          style={{ ...styles.input, minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={styles.input}
        />
      )}
    </label>
  );
}

export function FieldRow({ children }) {
  return <div style={{ display: 'flex', gap: 10 }}>{children}</div>;
}

export function FieldSelect({ label, value, options, onChange }) {
  const opts = options.map(o => typeof o === 'string' ? { v: o, l: o } : o);
  return (
    <label style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={styles.input}>
        {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}

export function ScoringInput({ label, value, color, onChange }) {
  return (
    <div style={styles.scoringTile}>
      <div style={styles.scoringLabel}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={() => onChange(Math.max(0, value - 1))} style={styles.epBtn}>
          <MinusCircle size={14} />
        </button>
        <span style={{ fontSize: 22, fontWeight: 800, color, minWidth: 28, textAlign: 'center' }}>
          {value}
        </span>
        <button onClick={() => onChange(value + 1)} style={styles.epBtn}>
          <PlusCircle size={14} />
        </button>
      </div>
    </div>
  );
}

// Switch on/off réutilisable
export function Switch({ checked, onChange, color = '#a3e635' }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{ ...styles.switch, background: checked ? color : '#334155' }}
    >
      <div style={{ ...styles.switchKnob, transform: checked ? 'translateX(16px)' : 'translateX(0)' }} />
    </button>
  );
}
