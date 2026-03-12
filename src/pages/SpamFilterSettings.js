import React, { useState, useEffect } from 'react';
import { Shield, Plus, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getSpamFilterSettings, saveSpamFilterSettings, TAG_STYLES } from '../utils/SpamFilter';

function SpamFilterSettings() {
  const { currentTheme } = useTheme();
  const c = currentTheme.colors;
  
  const [settings, setSettings] = useState({
    enabled: true,
    sensitivity: 'medium',
    whitelist: [],
    blacklist: [],
    autoMoveToSpam: false,
    showTags: true
  });
  
  const [newWhitelist, setNewWhitelist] = useState('');
  const [newBlacklist, setNewBlacklist] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loaded = getSpamFilterSettings();
    setSettings(loaded);
  }, []);

  const handleSave = () => {
    saveSpamFilterSettings(settings);
    // Also persist to electron-store if available
    if (window.electronAPI?.saveSpamFilterSettings) {
      window.electronAPI.saveSpamFilterSettings(settings);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateSetting = (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveSpamFilterSettings(updated);
  };

  const addToWhitelist = () => {
    const entry = newWhitelist.trim().toLowerCase();
    if (entry && !settings.whitelist.includes(entry)) {
      updateSetting('whitelist', [...settings.whitelist, entry]);
      setNewWhitelist('');
    }
  };

  const removeFromWhitelist = (entry) => {
    updateSetting('whitelist', settings.whitelist.filter(e => e !== entry));
  };

  const addToBlacklist = () => {
    const entry = newBlacklist.trim().toLowerCase();
    if (entry && !settings.blacklist.includes(entry)) {
      updateSetting('blacklist', [...settings.blacklist, entry]);
      setNewBlacklist('');
    }
  };

  const removeFromBlacklist = (entry) => {
    updateSetting('blacklist', settings.blacklist.filter(e => e !== entry));
  };

  return (
    <div className="space-y-6">
      {/* Enable/Disable */}
      <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className={`w-6 h-6 ${settings.enabled ? 'text-green-400' : c.textSecondary}`} />
            <div>
              <h3 className={`text-lg font-semibold ${c.text}`}>Spam-Filter</h3>
              <p className={`text-sm ${c.textSecondary}`}>
                Automatische Erkennung von Spam, Werbung und schädlichen Mails
              </p>
            </div>
          </div>
          <button
            onClick={() => updateSetting('enabled', !settings.enabled)}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
              settings.enabled ? 'bg-green-500' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                settings.enabled ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {settings.enabled && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(TAG_STYLES).filter(([key]) => key !== 'sicher').map(([key, style]) => (
              <div key={key} className={`p-3 rounded-lg border ${style.bgColor} ${style.borderColor}`}>
                <div className={`text-sm font-medium ${style.textColor}`}>{style.label}</div>
                <div className={`text-xs ${style.textColor} opacity-75 mt-1`}>{style.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {settings.enabled && (
        <>
          {/* Sensitivity */}
          <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
            <h3 className={`text-lg font-semibold ${c.text} mb-4`}>🎚️ Empfindlichkeit</h3>
            <p className={`text-sm ${c.textSecondary} mb-4`}>
              Bestimmt, wie streng der Spam-Filter E-Mails bewertet.
            </p>
            <div className="flex gap-3">
              {[
                { id: 'low', name: 'Niedrig', desc: 'Nur sehr offensichtlicher Spam', icon: '🟢' },
                { id: 'medium', name: 'Mittel', desc: 'Ausgewogene Erkennung (empfohlen)', icon: '🟡' },
                { id: 'high', name: 'Hoch', desc: 'Strenge Filterung, mehr False Positives', icon: '🔴' }
              ].map(level => (
                <button
                  key={level.id}
                  onClick={() => updateSetting('sensitivity', level.id)}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${
                    settings.sensitivity === level.id
                      ? `${c.accentBg} border-transparent text-white`
                      : `${c.border} ${c.hover}`
                  }`}
                >
                  <div className="text-lg mb-1">{level.icon}</div>
                  <div className={`font-medium text-sm ${settings.sensitivity === level.id ? 'text-white' : c.text}`}>
                    {level.name}
                  </div>
                  <div className={`text-xs mt-1 ${settings.sensitivity === level.id ? 'text-white/75' : c.textSecondary}`}>
                    {level.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Show Tags Toggle */}
          <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
            <h3 className={`text-lg font-semibold ${c.text} mb-4`}>🏷️ Anzeige</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-medium ${c.text}`}>Tags in E-Mail-Liste anzeigen</div>
                  <div className={`text-sm ${c.textSecondary}`}>Zeigt Warnungen neben dem "Neu"-Badge</div>
                </div>
                <button
                  onClick={() => updateSetting('showTags', !settings.showTags)}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                    settings.showTags ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    settings.showTags ? 'translate-x-8' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Whitelist */}
          <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
            <h3 className={`text-lg font-semibold ${c.text} mb-2`}>
              <CheckCircle className="w-5 h-5 inline-block mr-2 text-green-400" />
              Whitelist — Vertrauenswürdige Absender
            </h3>
            <p className={`text-sm ${c.textSecondary} mb-4`}>
              E-Mails von diesen Absendern werden nie als Spam markiert.
            </p>
            
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newWhitelist}
                onChange={(e) => setNewWhitelist(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addToWhitelist()}
                placeholder="z.B. chef@firma.de oder firma.de"
                className={`flex-1 px-4 py-2 ${c.input} rounded-lg text-sm`}
              />
              <button
                onClick={addToWhitelist}
                disabled={!newWhitelist.trim()}
                className={`px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors flex items-center gap-1 disabled:opacity-50`}
              >
                <Plus className="w-4 h-4" /> Hinzufügen
              </button>
            </div>
            
            {settings.whitelist.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {settings.whitelist.map(entry => (
                  <span
                    key={entry}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500/15 text-green-400 border border-green-500/30 rounded-full text-sm"
                  >
                    {entry}
                    <button
                      onClick={() => removeFromWhitelist(entry)}
                      className="hover:text-green-200 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${c.textSecondary} italic`}>
                Keine Einträge. Füge vertrauenswürdige Absender hinzu.
              </p>
            )}
          </div>

          {/* Blacklist */}
          <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
            <h3 className={`text-lg font-semibold ${c.text} mb-2`}>
              <AlertTriangle className="w-5 h-5 inline-block mr-2 text-red-400" />
              Blacklist — Blockierte Absender
            </h3>
            <p className={`text-sm ${c.textSecondary} mb-4`}>
              E-Mails von diesen Absendern werden immer als Spam markiert.
            </p>
            
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newBlacklist}
                onChange={(e) => setNewBlacklist(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addToBlacklist()}
                placeholder="z.B. spam@example.com oder example.xyz"
                className={`flex-1 px-4 py-2 ${c.input} rounded-lg text-sm`}
              />
              <button
                onClick={addToBlacklist}
                disabled={!newBlacklist.trim()}
                className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors flex items-center gap-1 disabled:opacity-50`}
              >
                <Plus className="w-4 h-4" /> Hinzufügen
              </button>
            </div>
            
            {settings.blacklist.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {settings.blacklist.map(entry => (
                  <span
                    key={entry}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/15 text-red-400 border border-red-500/30 rounded-full text-sm"
                  >
                    {entry}
                    <button
                      onClick={() => removeFromBlacklist(entry)}
                      className="hover:text-red-200 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${c.textSecondary} italic`}>
                Keine Einträge. Füge blockierte Absender hinzu.
              </p>
            )}
          </div>

          {/* Tips */}
          <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
            <h3 className={`text-lg font-semibold ${c.text} mb-4`}>💡 Tipps</h3>
            <ul className={`space-y-2 text-sm ${c.textSecondary}`}>
              <li>• <strong className={c.text}>Whitelist:</strong> Trage hier deine wichtigsten Kontakte ein, um False Positives zu vermeiden</li>
              <li>• <strong className={c.text}>Empfindlichkeit "Mittel"</strong> ist für die meisten Nutzer die beste Wahl</li>
              <li>• <strong className={c.text}>Spam-Tags</strong> erscheinen neben dem "Neu"-Badge in der E-Mail-Liste</li>
              <li>• <strong className={c.text}>Warnbanner</strong> werden in der E-Mail-Vorschau angezeigt</li>
              <li>• Der Filter analysiert: Betreff, Absender, Inhalt, Links und Anhänge</li>
              <li>• Kategorien: 📢 Werbung (harmlos), 🚫 Spam, ⚠️ Schädlich (Phishing), 🦠 Virus (gefährliche Anhänge)</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default SpamFilterSettings;
