import { useState, useEffect } from 'react';

// ============================================================
// useIsDesktop — détecte si l'écran est "desktop" (≥ 1024px)
// Recalcule automatiquement au redimensionnement de la fenêtre.
// Utilisé pour bascule entre layout mobile et layout desktop.
// ============================================================

const DESKTOP_BREAKPOINT = 1024;

export function useIsDesktop() {
  // SSR safe : window n'existe pas côté serveur
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= DESKTOP_BREAKPOINT;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isDesktop;
}