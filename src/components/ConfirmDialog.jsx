import React from 'react';
import { AlertCircle, Sparkles } from 'lucide-react';
import { styles } from '../styles/styles';

// ============================================================
// ConfirmDialog — utilisée via askConfirm() pour remplacer
// le confirm() natif qui ne marche pas dans la WebView mobile
// ============================================================
export function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onCancel }) {
  return (
    <div style={styles.confirmOverlay} onClick={onCancel}>
      <div style={styles.confirmCard} onClick={(e) => e.stopPropagation()}>
        <div style={{
          ...styles.confirmIcon,
          background: (danger ? '#f87171' : '#a3e635') + '15',
          borderColor: (danger ? '#f87171' : '#a3e635') + '40',
        }}>
          {danger
            ? <AlertCircle size={20} color="#f87171" />
            : <Sparkles size={20} color="#a3e635" />}
        </div>
        <div style={styles.confirmTitle}>{title}</div>
        <div style={styles.confirmMessage}>{message}</div>
        <div style={styles.confirmActions}>
          <button onClick={onCancel} style={{ ...styles.btnSecondary, flex: 1, padding: '12px' }}>
            Annuler
          </button>
          <button
            onClick={onConfirm}
            style={{
              ...(danger ? styles.btnDanger : styles.btnPrimary),
              flex: 1,
              padding: '12px',
            }}
          >
            {confirmLabel || 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}
