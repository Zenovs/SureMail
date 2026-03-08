import React from 'react';
import { useTheme, themes } from '../context/ThemeContext';

function SettingsV2() {
  const { theme, currentTheme, changeTheme } = useTheme();
  const c = currentTheme.colors;

  const themeOptions = [
    { id: 'dark', name: 'Dark', desc: 'Dunkles Design mit Cyan-Akzenten', preview: 'bg-gray-900' },
    { id: 'light', name: 'Light', desc: 'Helles Design mit blauen Akzenten', preview: 'bg-white' },
    { id: 'minimal', name: 'Minimal', desc: 'Minimalistisch in Schwarz/Weiß', preview: 'bg-gray-100' },
  ];

  return (
    <div className={`flex-1 p-6 overflow-auto ${c.bg}`}>
      <div className="max-w-2xl mx-auto">
        <h1 className={`text-2xl font-bold ${c.text} mb-6`}>Einstellungen</h1>

        {/* Theme Selection */}
        <section className={`${c.card} ${c.border} border rounded-xl p-6 mb-6`}>
          <h2 className={`text-lg font-semibold ${c.text} mb-4`}>Design</h2>
          <div className="grid grid-cols-3 gap-4">
            {themeOptions.map(t => (
              <button
                key={t.id}
                onClick={() => changeTheme(t.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  theme === t.id 
                    ? 'border-cyan-500 ring-2 ring-cyan-500/20' 
                    : `${c.border} hover:border-gray-400`
                }`}
              >
                <div className={`w-full h-16 rounded-lg ${t.preview} border ${c.border} mb-3`} />
                <div className={`font-medium ${c.text}`}>{t.name}</div>
                <div className={`text-xs ${c.textSecondary} mt-1`}>{t.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Info */}
        <section className={`${c.card} ${c.border} border rounded-xl p-6 mb-6`}>
          <h2 className={`text-lg font-semibold ${c.text} mb-4`}>Über CoreMail</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className={c.textSecondary}>Version</span>
              <span className={c.text}>1.1.0</span>
            </div>
            <div className="flex justify-between">
              <span className={c.textSecondary}>Electron</span>
              <span className={c.text}>28.x</span>
            </div>
            <div className="flex justify-between">
              <span className={c.textSecondary}>Node.js</span>
              <span className={c.text}>20.x</span>
            </div>
          </div>
        </section>

        {/* Hinweise */}
        <section className={`${c.card} ${c.border} border rounded-xl p-6`}>
          <h2 className={`text-lg font-semibold ${c.text} mb-4`}>Hinweise</h2>
          <ul className={`space-y-2 text-sm ${c.textSecondary}`}>
            <li>• E-Mail-Konten werden unter "Konten" verwaltet</li>
            <li>• Passwörter werden verschlüsselt gespeichert</li>
            <li>• Für Gmail: App-Passwörter erforderlich</li>
            <li>• Tastaturkürzel: ↑↓ für E-Mail-Navigation</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default SettingsV2;
