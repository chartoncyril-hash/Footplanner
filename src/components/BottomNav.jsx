import React from 'react';
import { Activity, Trophy, Users, Calendar, Star, Goal as Whistle } from 'lucide-react';
import { styles } from '../styles/styles';

// ============================================================
// BottomNav — navigation du bas
// Onglets adaptés au rôle (pas de "grisé", on masque vraiment)
// ============================================================
export function BottomNav({ view, setView, role, followedTeamIds }) {
  let items;
  if (role === 'organizer') {
    items = [
      { id: 'dashboard', label: 'Live', icon: Activity },
      { id: 'matches', label: 'Matchs', icon: Whistle },
      { id: 'standings', label: 'Classement', icon: Trophy },
      { id: 'teams', label: 'Équipes', icon: Users },
      { id: 'schedule', label: 'Calendrier', icon: Calendar },
    ];
  } else if (role === 'referee') {
    items = [
      { id: 'dashboard', label: 'Live', icon: Activity },
      { id: 'matches', label: 'Matchs', icon: Whistle },
      { id: 'standings', label: 'Classement', icon: Trophy },
      { id: 'teams', label: 'Équipes', icon: Users },
    ];
  } else {
    // coach / spectator : pas d'onglet "Équipes", à la place "Mes équipes"
    items = [
      { id: 'dashboard', label: 'Live', icon: Activity },
      { id: 'matches', label: 'Matchs', icon: Whistle },
      { id: 'standings', label: 'Classement', icon: Trophy },
      { id: 'follow', label: 'Mes équipes', icon: Star, badge: (followedTeamIds || []).length },
    ];
  }

  return (
    <nav style={styles.bottomNav}>
      {items.map(i => {
        const Icon = i.icon;
        const active = view === i.id;
        return (
          <button
            key={i.id}
            onClick={() => setView(i.id)}
            style={{ ...styles.navBtn, ...(active ? styles.navBtnActive : {}) }}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              {i.badge > 0 && (
                <span style={styles.navBadge}>{i.badge}</span>
              )}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, marginTop: 2 }}>
              {i.label.toUpperCase()}
            </span>
            {active && <div style={styles.navIndicator} />}
          </button>
        );
      })}
    </nav>
  );
}
