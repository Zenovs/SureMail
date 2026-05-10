import { useState, useCallback, useRef, useEffect } from 'react';

// v6.6.2: Hook für 3-Mode-Panels mit Hover-Expand.
//
// Modi:
//   'auto'   — eingeklappt, expandiert beim Hover, kollabiert beim Verlassen
//   'open'   — bleibt expandiert
//   'closed' — bleibt eingeklappt (auch beim Hover)
//
// Persistenz: localStorage[storageKey]. Default = 'auto'.
//
// Usage:
//   const panel = usePanelMode('panel.sidebar');
//   <div {...panel.hoverProps} style={{ width: panel.isExpanded ? 240 : 56 }}>
//   <button onClick={panel.cycleMode} title={panel.tooltip}>{panel.icon}</button>
//
// Mouse-Leave hat einen kleinen Delay (180ms), damit ein versehentlicher
// Mouseout (Cursor zwischen zwei Spalten) das Panel nicht sofort schliesst.

export const PANEL_MODES = ['auto', 'open', 'closed'];

const COLLAPSE_DELAY_MS = 180;

export function usePanelMode(storageKey, defaultMode = 'auto') {
  const [mode, setModeState] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return PANEL_MODES.includes(saved) ? saved : defaultMode;
    } catch { return defaultMode; }
  });
  const [hovered, setHovered] = useState(false);
  const collapseTimerRef = useRef(null);

  const setMode = useCallback((next) => {
    if (!PANEL_MODES.includes(next)) return;
    setModeState(next);
    try { localStorage.setItem(storageKey, next); } catch {}
  }, [storageKey]);

  const cycleMode = useCallback(() => {
    setMode(PANEL_MODES[(PANEL_MODES.indexOf(mode) + 1) % PANEL_MODES.length]);
  }, [mode, setMode]);

  const onMouseEnter = useCallback(() => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
    setHovered(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    collapseTimerRef.current = setTimeout(() => setHovered(false), COLLAPSE_DELAY_MS);
  }, []);

  useEffect(() => () => {
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
  }, []);

  const isExpanded = mode === 'open' || (mode === 'auto' && hovered);
  const isAuto    = mode === 'auto';
  const isPinned  = mode === 'open';
  const isClosed  = mode === 'closed';

  const tooltip = mode === 'auto'
    ? 'Auto · Klicken: festpinnen'
    : mode === 'open'
      ? 'Festgepinnt · Klicken: einklappen'
      : 'Eingeklappt · Klicken: Auto-Hover';

  return {
    mode, setMode, cycleMode,
    isExpanded, isAuto, isPinned, isClosed,
    hoverProps: { onMouseEnter, onMouseLeave },
    tooltip
  };
}

// Kleines Icon-Indicator-Mapping für den Toggle-Button.
// Nutzt Carbon Pin / Locked / SidebarOpen — Konsumenten suchen sich was passendes.
export function panelModeLabel(mode) {
  return mode === 'auto' ? 'Auto' : mode === 'open' ? 'Pin' : 'Klein';
}
