import React, { useEffect, useState, useCallback } from 'react';
import { Time, TrashCan, Email, ArrowLeft, MailAll } from '@carbon/icons-react';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../context/AccountContext';
import LoadingSpinner from '../components/LoadingSpinner';

// v6.6.0: Erinnerungen-Übersicht. Listet aktive Snoozes, bietet "Jetzt anzeigen" (cancel)
// und "Mail öffnen" (Vollansicht).
function SnoozedView({ onOpenEmail }) {
  const { currentTheme } = useTheme();
  const { accounts } = useAccounts();
  const c = currentTheme.colors;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const refresh = useCallback(async () => {
    if (!window.electronAPI?.snoozeList) { setLoading(false); return; }
    setLoading(true);
    try {
      const r = await window.electronAPI.snoozeList();
      if (r?.success) setItems(r.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Live-Tick alle 30s aktualisiert "in 12 Min" Anzeigen + entfernt abgelaufene
  useEffect(() => {
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, [refresh]);

  // Bei Wake-Up-Event: Liste neu laden (gewachte Mails verschwinden)
  useEffect(() => {
    if (!window.electronAPI?.onSnoozeWoke) return;
    window.electronAPI.onSnoozeWoke(refresh);
    return () => window.electronAPI?.removeSnoozeListeners?.();
  }, [refresh]);

  const handleCancel = useCallback(async (id) => {
    if (!window.electronAPI?.snoozeCancel) return;
    setActionId(id);
    await window.electronAPI.snoozeCancel(id);
    setItems(prev => prev.filter(s => s.id !== id));
    setActionId(null);
  }, []);

  const handleOpen = useCallback(async (snz) => {
    // Cancel + Vollansicht öffnen — Mail erscheint sofort wieder im Posteingang
    await window.electronAPI.snoozeCancel(snz.id);
    setItems(prev => prev.filter(s => s.id !== snz.id));
    if (onOpenEmail) onOpenEmail({ accountId: snz.accountId, folder: snz.folder, uid: snz.uid });
  }, [onOpenEmail]);

  const formatRelative = (wakeAt) => {
    const diff = wakeAt - Date.now();
    if (diff <= 0) return 'in Kürze';
    const min = Math.floor(diff / 60000);
    if (min < 60) return `in ${min} Min.`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `in ${hrs} Std.`;
    const days = Math.floor(hrs / 24);
    return `in ${days} Tag${days === 1 ? '' : 'en'}`;
  };

  const formatAbsolute = (wakeAt) => {
    const d = new Date(wakeAt);
    return d.toLocaleString('de-DE', {
      weekday: 'short', day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getAccountLabel = (id) => {
    const a = accounts.find(x => x.id === id);
    return a?.displayName || a?.name || id;
  };

  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${c.bg}`}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-auto ${c.bg}`}>
      <div className="max-w-3xl mx-auto p-6">
        <header className="flex items-center gap-3 mb-6">
          <Time size={28} className={c.accent} />
          <div>
            <h1 className={`text-2xl font-semibold ${c.text}`}>Erinnerungen</h1>
            <p className={`text-sm ${c.textSecondary}`}>
              {items.length === 0 ? 'Keine aktiven Erinnerungen' : `${items.length} Mail${items.length === 1 ? '' : 's'} gesnoozt`}
            </p>
          </div>
        </header>

        {items.length === 0 ? (
          <div className={`${c.bgSecondary} ${c.border} border rounded-xl p-8 text-center`}>
            <MailAll size={48} className={`mx-auto mb-3 ${c.textSecondary}`} />
            <p className={`text-sm ${c.textSecondary}`}>
              Du hast aktuell nichts gesnoozt. Wähle im Posteingang eine Mail und klick auf <span className={c.accent}>Erinnern</span>, um sie auf später zu legen.
            </p>
          </div>
        ) : (
          <ul className={`${c.bgSecondary} ${c.border} border rounded-xl divide-y ${c.border}`}>
            {items.map(snz => (
              <li key={snz.id} className="px-4 py-3 flex items-center gap-3">
                <Time size={20} className={`${c.textSecondary} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${c.text} truncate`}>
                    {snz.subject || '(Kein Betreff)'}
                  </p>
                  <p className={`text-xs ${c.textSecondary} truncate`}>
                    {snz.from || ''}{snz.from ? ' · ' : ''}{getAccountLabel(snz.accountId)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-medium ${c.accent}`}>{formatRelative(snz.wakeAt)}</p>
                  <p className={`text-xs ${c.textSecondary}`}>{formatAbsolute(snz.wakeAt)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleOpen(snz)}
                    className={`p-2 ${c.hover} rounded-lg ${c.textSecondary} hover:${c.accent}`}
                    title="Mail öffnen"
                  >
                    <Email size={16} />
                  </button>
                  <button
                    onClick={() => handleCancel(snz.id)}
                    disabled={actionId === snz.id}
                    className={`p-2 ${c.hover} rounded-lg ${c.textSecondary} hover:text-red-400 disabled:opacity-40`}
                    title="Erinnerung abbrechen"
                  >
                    <TrashCan size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default SnoozedView;
