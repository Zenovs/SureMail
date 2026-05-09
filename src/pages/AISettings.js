import React, { useEffect, useState } from 'react';
import { Bot, Checkmark, Close, InProgress, View, ViewOff } from '@carbon/icons-react';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';

// v6.6.0: AI-Konfiguration. Lokal (Ollama) oder Anthropic Cloud.
function AISettings() {
  const { currentTheme } = useTheme();
  const c = currentTheme.colors;
  const [s, setS] = useState(null);
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState(null); // {success, error?, warning?}
  const [testing, setTesting] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (!window.electronAPI?.aiGetSettings) return;
    window.electronAPI.aiGetSettings().then(r => { if (r?.success) setS(r.settings); });
  }, []);

  const update = (patch) => setS(prev => ({ ...prev, ...patch }));

  const saveAndTest = async () => {
    setTesting(true);
    setTestResult(null);
    await window.electronAPI.aiSaveSettings(s);
    const r = await window.electronAPI.aiTestConnection();
    setTesting(false);
    setTestResult(r);
    if (r?.success && !r.warning) {
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    }
  };

  const saveOnly = async () => {
    await window.electronAPI.aiSaveSettings(s);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2500);
  };

  if (!s) {
    return (
      <div className={`flex-1 flex items-center justify-center ${c.bg}`}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-auto ${c.bg}`}>
      <div className="max-w-2xl mx-auto p-6">
        <header className="flex items-center gap-3 mb-6">
          <Bot size={28} className={c.accent} />
          <div>
            <h1 className={`text-2xl font-semibold ${c.text}`}>AI-Assistent</h1>
            <p className={`text-sm ${c.textSecondary}`}>
              Konfiguration für Triage, Antwortvorschläge und Extraktion. Lokal mit Ollama (privat) oder via Anthropic Cloud.
            </p>
          </div>
        </header>

        {/* Aktivierung */}
        <div className={`${c.bgSecondary} ${c.border} border rounded-xl p-4 mb-4`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={s.enabled}
              onChange={(e) => update({ enabled: e.target.checked })}
              className="mt-1"
            />
            <div>
              <p className={`text-sm font-medium ${c.text}`}>AI-Features aktivieren</p>
              <p className={`text-xs ${c.textSecondary}`}>Wenn deaktiviert, werden keine Mails an einen LLM geschickt.</p>
            </div>
          </label>
        </div>

        {/* Provider */}
        <div className={`${c.bgSecondary} ${c.border} border rounded-xl p-4 mb-4`}>
          <p className={`text-xs font-medium ${c.textSecondary} mb-2`}>Provider</p>
          <div className="flex gap-2">
            <button
              onClick={() => update({ provider: 'ollama' })}
              className={`flex-1 px-3 py-2 rounded-lg text-sm border ${
                s.provider === 'ollama'
                  ? `${c.accentBg} text-white border-transparent`
                  : `${c.bgTertiary} ${c.text} ${c.border}`
              }`}
            >
              Ollama (lokal, privat)
            </button>
            <button
              onClick={() => update({ provider: 'anthropic' })}
              className={`flex-1 px-3 py-2 rounded-lg text-sm border ${
                s.provider === 'anthropic'
                  ? `${c.accentBg} text-white border-transparent`
                  : `${c.bgTertiary} ${c.text} ${c.border}`
              }`}
            >
              Anthropic Claude (Cloud)
            </button>
          </div>
        </div>

        {/* Provider-spezifische Konfig */}
        {s.provider === 'ollama' ? (
          <div className={`${c.bgSecondary} ${c.border} border rounded-xl p-4 mb-4 space-y-3`}>
            <div>
              <label className={`block text-xs font-medium ${c.textSecondary} mb-1`}>Endpoint</label>
              <input
                type="text"
                value={s.ollamaEndpoint}
                onChange={(e) => update({ ollamaEndpoint: e.target.value })}
                placeholder="http://localhost:11434"
                className={`w-full px-3 py-2 ${c.bgTertiary} ${c.text} ${c.border} border rounded-lg text-sm outline-none font-mono`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium ${c.textSecondary} mb-1`}>Model</label>
              <input
                type="text"
                value={s.ollamaModel}
                onChange={(e) => update({ ollamaModel: e.target.value })}
                placeholder="llama3.1:8b"
                className={`w-full px-3 py-2 ${c.bgTertiary} ${c.text} ${c.border} border rounded-lg text-sm outline-none font-mono`}
              />
              <p className={`text-xs ${c.textSecondary} mt-1`}>
                Vorschläge: <span className="font-mono">llama3.1:8b</span>, <span className="font-mono">qwen2.5:7b</span>, <span className="font-mono">mistral-nemo</span>. Vorher pullen mit <span className="font-mono">ollama pull &lt;model&gt;</span>.
              </p>
            </div>
            <div className={`text-xs ${c.textSecondary} p-3 ${c.bgTertiary} rounded-lg`}>
              💡 Mails verlassen dein Gerät nie. Setup: <span className="font-mono">brew install ollama</span> → <span className="font-mono">ollama serve</span> → <span className="font-mono">ollama pull llama3.1:8b</span>
            </div>
          </div>
        ) : (
          <div className={`${c.bgSecondary} ${c.border} border rounded-xl p-4 mb-4 space-y-3`}>
            <div>
              <label className={`block text-xs font-medium ${c.textSecondary} mb-1`}>API-Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={s.anthropicApiKey}
                  onChange={(e) => update({ anthropicApiKey: e.target.value })}
                  placeholder="sk-ant-..."
                  className={`w-full px-3 py-2 pr-10 ${c.bgTertiary} ${c.text} ${c.border} border rounded-lg text-sm outline-none font-mono`}
                />
                <button
                  onClick={() => setShowKey(v => !v)}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 ${c.textSecondary} hover:${c.text}`}
                  title={showKey ? 'Verbergen' : 'Anzeigen'}
                >
                  {showKey ? <ViewOff size={16} /> : <View size={16} />}
                </button>
              </div>
              <p className={`text-xs ${c.textSecondary} mt-1`}>
                Wird verschlüsselt im electron-store gespeichert. Hol dir einen Key bei console.anthropic.com.
              </p>
            </div>
            <div>
              <label className={`block text-xs font-medium ${c.textSecondary} mb-1`}>Model</label>
              <select
                value={s.anthropicModel}
                onChange={(e) => update({ anthropicModel: e.target.value })}
                className={`w-full px-3 py-2 ${c.bgTertiary} ${c.text} ${c.border} border rounded-lg text-sm outline-none`}
              >
                <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (schnell + günstig)</option>
                <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (ausgewogen)</option>
                <option value="claude-opus-4-7">Claude Opus 4.7 (max. Qualität)</option>
              </select>
            </div>
            <div className={`text-xs ${c.textSecondary} p-3 ${c.bgTertiary} rounded-lg`}>
              ⚠️ Mail-Inhalte gehen an Anthropic. Für maximale Privatsphäre nutze Ollama.
            </div>
          </div>
        )}

        {/* Test- und Save-Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={saveAndTest}
            disabled={testing || !s.enabled}
            className={`px-4 py-2 ${c.accentBg} ${c.accentHover} text-white text-sm rounded-lg flex items-center gap-2 disabled:opacity-50`}
          >
            {testing ? <InProgress size={14} className="animate-spin" /> : <Checkmark size={14} />}
            Speichern + Verbindung testen
          </button>
          <button
            onClick={saveOnly}
            className={`px-4 py-2 ${c.bgTertiary} ${c.hover} ${c.text} text-sm rounded-lg`}
          >
            Nur speichern
          </button>
          {savedFlash && <span className="text-sm text-green-400 flex items-center gap-1"><Checkmark size={14} /> gespeichert</span>}
        </div>

        {testResult && (
          <div className={`mt-3 p-3 rounded-lg text-sm flex items-start gap-2 ${
            testResult.success
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {testResult.success ? <Checkmark size={16} className="flex-shrink-0 mt-0.5" /> : <Close size={16} className="flex-shrink-0 mt-0.5" />}
            <span>
              {testResult.success
                ? (testResult.warning ? `Verbunden, aber: ${testResult.warning}` : 'Verbindung erfolgreich!')
                : `Test fehlgeschlagen: ${testResult.error}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default AISettings;
