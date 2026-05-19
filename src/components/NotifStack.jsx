import React from 'react';
import {
  Clock, Activity, Target, ShieldCheck, Flag, AlertCircle, Sparkles, X,
} from 'lucide-react';
import { styles } from '../styles/styles';

// ============================================================
// NotifStack — pile de toasts en haut de l'écran
// 3 max visibles, auto-dismiss après 5s, clic = ouvre le match concerné
// ============================================================
const KIND_META = {
  soon: { color: '#f59e0b', icon: Clock, label: 'BIENTÔT' },
  start: { color: '#22d3ee', icon: Activity, label: "C'EST PARTI" },
  score: { color: '#34d399', icon: Target, label: 'BUT' },
  end: { color: '#a78bfa', icon: ShieldCheck, label: 'TERMINÉ' },
  ref_soon: { color: '#f59e0b', icon: Flag, label: 'À VOUS' },
  ref_remind: { color: '#fb7185', icon: AlertCircle, label: 'PENSEZ-Y' },
  info: { color: '#22d3ee', icon: Sparkles, label: 'INFO' },
};

export function NotifStack({ notifs, teams, onDismiss, onTap }) {
  if (!notifs || notifs.length === 0) return null;

  return (
    <div style={styles.notifStack}>
      {notifs.slice(-3).map(n => {
        const meta = KIND_META[n.kind] || KIND_META.info;
        const Icon = meta.icon;
        const home = teams.find(t => t.id === n.homeId);
        const away = teams.find(t => t.id === n.awayId);
        return (
          <div
            key={n.id}
            style={{
              ...styles.notifCard,
              borderColor: meta.color + '55',
              boxShadow: `0 8px 24px ${meta.color}30`,
            }}
            onClick={() => { if (n.matchId) onTap?.(n.matchId); onDismiss(n.id); }}
          >
            <div
              style={{
                ...styles.notifIcon,
                background: meta.color + '20',
                borderColor: meta.color + '60',
              }}
            >
              <Icon size={14} color={meta.color} strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...styles.notifLabel, color: meta.color }}>{meta.label}</div>
              <div style={styles.notifTitle}>{n.title}</div>
              {home && away && (
                <div style={styles.notifTeams}>{home.short} vs {away.short}</div>
              )}
              {n.message && <div style={styles.notifMessage}>{n.message}</div>}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
              style={styles.notifClose}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
