import { useEffect } from 'react';

/**
 * Ruft onEscape auf, solange die Komponente gemountet ist (= Modal offen).
 * Einheitlicher Escape-Support für Overlays, konsistent mit GlobalSearch.
 */
export default function EscapeCloser({ onEscape }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onEscape();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onEscape]);
  return null;
}
