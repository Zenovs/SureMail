import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Globe, Key, Link, CheckSquare, Square } from 'lucide-react';

const LANGUAGES = [
  { code: 'DE', name: 'Deutsch' },
  { code: 'EN', name: 'Englisch' },
  { code: 'FR', name: 'Französisch' },
  { code: 'IT', name: 'Italienisch' },
  { code: 'ES', name: 'Spanisch' },
  { code: 'PT', name: 'Portugiesisch' },
  { code: 'NL', name: 'Niederländisch' },
  { code: 'PL', name: 'Polnisch' },
  { code: 'RU', name: 'Russisch' },
  { code: 'ZH', name: 'Chinesisch' },
  { code: 'JA', name: 'Japanisch' },
  { code: 'TR', name: 'Türkisch' },
  { code: 'AR', name: 'Arabisch' },
  { code: 'UK', name: 'Ukrainisch' },
];

const DEFAULT_SETTINGS = {
  service: 'deepl',
  deeplFree: true,
  apiKey: '',
  customApiUrl: '',
  enabledLanguages: ['DE', 'EN'],
};

function TranslationSettings() {
  const { currentTheme } = useTheme();
  const c = currentTheme.colors;

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    const load = async () => {
      const s = await window.electronAPI?.translationGetSettings?.();
      if (s) setSettings({ ...DEFAULT_SETTINGS, ...s });
    };
    load();
  }, []);

  const save = async (newSettings) => {
    setSettings(newSettings);
    await window.electronAPI?.translationSaveSettings?.(newSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleLanguage = (code) => {
    const current = settings.enabledLanguages || [];
    const updated = current.includes(code)
      ? current.filter(l => l !== code)
      : [...current, code];
    save({ ...settings, enabledLanguages: updated });
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await window.electronAPI?.translationTranslate?.({
        text: 'Hello, this is a test.',
        targetLang: 'DE',
      });
      if (result?.success) {
        setTestResult({ ok: true, text: result.translatedText });
      } else {
        setTestResult({ ok: false, error: result?.error || 'Unbekannter Fehler' });
      }
    } catch (e) {
      setTestResult({ ok: false, error: e.message });
    }
    setTesting(false);
  };

  return (
    <div className="space-y-6">
      {/* Dienst-Auswahl */}
      <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
        <div className="flex items-center gap-2 mb-4">
          <Globe className={`w-5 h-5 ${c.accent}`} />
          <h3 className={`text-lg font-semibold ${c.text}`}>Übersetzungsdienst</h3>
        </div>

        <div className="space-y-3">
          {/* DeepL */}
          <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
            settings.service === 'deepl'
              ? `${c.accentBg} border-transparent`
              : `${c.bgSecondary} ${c.border} hover:border-opacity-60`
          }`}>
            <input
              type="radio"
              name="service"
              value="deepl"
              checked={settings.service === 'deepl'}
              onChange={() => save({ ...settings, service: 'deepl' })}
              className="mt-1"
            />
            <div>
              <div className={`font-medium ${settings.service === 'deepl' ? 'text-white' : c.text}`}>
                DeepL
              </div>
              <div className={`text-sm ${settings.service === 'deepl' ? 'text-white/70' : c.textSecondary}`}>
                Hochqualitative Übersetzungen — beliebt für europäische Sprachen
              </div>
              {settings.service === 'deepl' && (
                <div className="mt-3 flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.deeplFree !== false}
                      onChange={e => save({ ...settings, deeplFree: e.target.checked })}
                    />
                    Free-API verwenden
                  </label>
                  <span className="text-xs text-white/50">(api-free.deepl.com)</span>
                </div>
              )}
            </div>
          </label>

          {/* Google */}
          <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
            settings.service === 'google'
              ? `${c.accentBg} border-transparent`
              : `${c.bgSecondary} ${c.border} hover:border-opacity-60`
          }`}>
            <input
              type="radio"
              name="service"
              value="google"
              checked={settings.service === 'google'}
              onChange={() => save({ ...settings, service: 'google' })}
              className="mt-1"
            />
            <div>
              <div className={`font-medium ${settings.service === 'google' ? 'text-white' : c.text}`}>
                Google Translate
              </div>
              <div className={`text-sm ${settings.service === 'google' ? 'text-white/70' : c.textSecondary}`}>
                Google Cloud Translation API — unterstützt über 100 Sprachen
              </div>
            </div>
          </label>

          {/* Custom */}
          <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
            settings.service === 'custom'
              ? `${c.accentBg} border-transparent`
              : `${c.bgSecondary} ${c.border} hover:border-opacity-60`
          }`}>
            <input
              type="radio"
              name="service"
              value="custom"
              checked={settings.service === 'custom'}
              onChange={() => save({ ...settings, service: 'custom' })}
              className="mt-1"
            />
            <div className="flex-1">
              <div className={`font-medium ${settings.service === 'custom' ? 'text-white' : c.text}`}>
                Eigene API
              </div>
              <div className={`text-sm ${settings.service === 'custom' ? 'text-white/70' : c.textSecondary}`}>
                Eigenen Übersetzungs-Endpunkt verwenden (POST, JSON: text + targetLang)
              </div>
              {settings.service === 'custom' && (
                <div className="mt-3 flex items-center gap-2">
                  <Link className="w-4 h-4 text-white/60 flex-shrink-0" />
                  <input
                    type="text"
                    value={settings.customApiUrl}
                    onChange={e => save({ ...settings, customApiUrl: e.target.value })}
                    placeholder="https://meine-api.example.com/translate"
                    className="flex-1 bg-white/10 text-white placeholder-white/40 text-sm rounded-lg px-3 py-1.5 outline-none border border-white/20 focus:border-white/40"
                  />
                </div>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* API-Schlüssel */}
      {settings.service !== 'custom' && (
        <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Key className={`w-5 h-5 ${c.accent}`} />
            <h3 className={`text-lg font-semibold ${c.text}`}>API-Schlüssel</h3>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg ${c.bgSecondary} ${c.border} border`}>
            <Key className={`w-4 h-4 ${c.textSecondary} flex-shrink-0`} />
            <input
              type="password"
              value={settings.apiKey}
              onChange={e => save({ ...settings, apiKey: e.target.value })}
              placeholder={
                settings.service === 'deepl'
                  ? 'DeepL API-Key (z. B. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx)'
                  : 'Google Cloud API-Key'
              }
              className={`flex-1 bg-transparent text-sm ${c.text} outline-none placeholder:${c.textSecondary}`}
            />
          </div>
          <p className={`text-xs ${c.textSecondary} mt-2`}>
            {settings.service === 'deepl'
              ? 'API-Key unter deepl.com/pro → API → Account abrufen.'
              : 'API-Key unter console.cloud.google.com → APIs & Dienste → Anmeldedaten.'}
          </p>
        </div>
      )}

      {/* Zielsprachen */}
      <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
        <div className="flex items-center gap-2 mb-1">
          <Globe className={`w-5 h-5 ${c.accent}`} />
          <h3 className={`text-lg font-semibold ${c.text}`}>Zielsprachen</h3>
        </div>
        <p className={`text-sm ${c.textSecondary} mb-4`}>
          Aktivierte Sprachen erscheinen im Übersetzen-Dropdown beim Lesen einer E-Mail.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map(lang => {
            const active = (settings.enabledLanguages || []).includes(lang.code);
            return (
              <button
                key={lang.code}
                onClick={() => toggleLanguage(lang.code)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? `${c.accentBg} text-white`
                    : `${c.bgSecondary} ${c.text} ${c.hover}`
                }`}
              >
                {active
                  ? <CheckSquare className="w-4 h-4 flex-shrink-0" />
                  : <Square className="w-4 h-4 flex-shrink-0 opacity-40" />
                }
                <span>{lang.name}</span>
                <span className={`ml-auto text-xs ${active ? 'text-white/60' : c.textSecondary}`}>{lang.code}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Verbindung testen */}
      <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
        <h3 className={`text-lg font-semibold ${c.text} mb-3`}>Verbindung testen</h3>
        <button
          onClick={testConnection}
          disabled={testing || (!settings.apiKey && settings.service !== 'custom')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${c.accentBg} ${c.accentHover} text-white disabled:opacity-40`}
        >
          {testing ? 'Teste...' : 'Test senden'}
        </button>
        {testResult && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${
            testResult.ok ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {testResult.ok
              ? <>Erfolg: <span className="font-medium">"{testResult.text}"</span></>
              : <>Fehler: {testResult.error}</>
            }
          </div>
        )}
      </div>

      {saved && (
        <div className="text-sm text-green-400 text-center">Einstellungen gespeichert ✓</div>
      )}
    </div>
  );
}

export default TranslationSettings;
