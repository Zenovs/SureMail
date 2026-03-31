import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { RefreshCw, Trash2, Download, Search, X } from 'lucide-react';

const TYPE_CONFIG = {
  app_start:       { label: 'App-Start',     icon: '🚀', color: 'text-cyan-400' },
  email_received:  { label: 'Empfangen',     icon: '📥', color: 'text-green-400' },
  email_sent:      { label: 'Gesendet',      icon: '📤', color: 'text-blue-400' },
  settings:        { label: 'Einstellungen', icon: '⚙️', color: 'text-yellow-400' },
  update:          { label: 'Update',        icon: '🔄', color: 'text-purple-400' },
  error:           { label: 'Fehler',        icon: '⚠️', color: 'text-red-400' },
  info:            { label: 'Info',          icon: 'ℹ️', color: 'text-gray-400' },
};

const FILTERS = [
  { id: 'all',             label: 'Alle' },
  { id: 'email_received',  label: 'Empfangen' },
  { id: 'email_sent',      label: 'Gesendet' },
  { id: 'settings',        label: 'Einstellungen' },
  { id: 'update',          label: 'Updates' },
  { id: 'error',           label: 'Fehler' },
];

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('de-CH', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  } catch { return iso; }
}

function Logbuch() {
  const { currentTheme } = useTheme();
  const c = currentTheme.colors;

  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.logGetAll();
      setEntries(res.entries || []);
    } catch (e) {
      console.error('[Logbuch] load error:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleClear = async () => {
    if (!window.confirm('Logbuch wirklich leeren?')) return;
    await window.electronAPI.logClear();
    setEntries([]);
  };

  const handleExport = () => {
    const lines = entries.map(e =>
      `[${formatDate(e.timestamp)}] [${(TYPE_CONFIG[e.type]?.label || e.type).toUpperCase()}] ${e.title}${e.detail ? ' — ' + e.detail : ''}`
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coremail-log-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = entries.filter(e => {
    if (filter !== 'all' && e.type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.title.toLowerCase().includes(q) || (e.detail || '').toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {};
  FILTERS.forEach(f => {
    counts[f.id] = f.id === 'all' ? entries.length : entries.filter(e => e.type === f.id).length;
  });

  return (
    <div className={`flex flex-col h-full ${c.bg}`}>
      {/* Header */}
      <div className={`px-6 py-4 ${c.border} border-b flex items-center justify-between`}>
        <div>
          <h2 className={`text-xl font-bold ${c.text}`}>Logbuch</h2>
          <p className={`text-sm ${c.textSecondary} mt-0.5`}>
            {entries.length} Einträge protokolliert
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className={`p-2 rounded-lg ${c.hover} ${c.textSecondary} transition-colors`}
            title="Aktualisieren"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExport}
            className={`p-2 rounded-lg ${c.hover} ${c.textSecondary} transition-colors`}
            title="Als .txt exportieren"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleClear}
            className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
            title="Logbuch leeren"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter + Suche */}
      <div className={`px-6 py-3 ${c.border} border-b space-y-3`}>
        {/* Suchfeld */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${c.bgSecondary} ${c.border} border`}>
          <Search className={`w-4 h-4 ${c.textSecondary} flex-shrink-0`} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Einträge durchsuchen..."
            className={`flex-1 bg-transparent text-sm ${c.text} outline-none placeholder:${c.textSecondary}`}
          />
          {search && (
            <button onClick={() => setSearch('')} className={c.textSecondary}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {/* Filter-Chips */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === f.id
                  ? `${c.accentBg} text-white`
                  : `${c.bgSecondary} ${c.textSecondary} ${c.hover}`
              }`}
            >
              {f.label}
              {counts[f.id] > 0 && (
                <span className="ml-1.5 opacity-70">{counts[f.id]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Einträge */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className={`flex items-center justify-center h-32 ${c.textSecondary}`}>
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Lade Logbuch...
          </div>
        ) : filtered.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-32 ${c.textSecondary}`}>
            <span className="text-3xl mb-2">📋</span>
            <span className="text-sm">Keine Einträge gefunden</span>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((entry, idx) => {
              const cfg = TYPE_CONFIG[entry.type] || TYPE_CONFIG.info;
              const isExpanded = expanded === entry.id;
              return (
                <div
                  key={entry.id}
                  className={`px-6 py-3 cursor-pointer transition-colors ${c.hover} ${
                    idx === 0 ? '' : ''
                  }`}
                  onClick={() => setExpanded(isExpanded ? null : entry.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <span className="text-base mt-0.5 flex-shrink-0">{cfg.icon}</span>
                    {/* Inhalt */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold ${cfg.color} uppercase tracking-wide`}>
                          {cfg.label}
                        </span>
                        <span className={`text-xs ${c.textSecondary}`}>
                          {formatDate(entry.timestamp)}
                        </span>
                      </div>
                      <p className={`text-sm ${c.text} mt-0.5 truncate`}>{entry.title}</p>
                      {entry.detail && isExpanded && (
                        <p className={`text-xs ${c.textSecondary} mt-1 whitespace-pre-wrap break-words`}>
                          {entry.detail}
                        </p>
                      )}
                      {entry.detail && !isExpanded && (
                        <p className={`text-xs ${c.textSecondary} mt-0.5 truncate`}>{entry.detail}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Logbuch;
