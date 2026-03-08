import React, { useState, useEffect } from 'react';
import { useTheme, themes } from '../context/ThemeContext';
import UpdateSettings from './UpdateSettings';
import NotificationSettings from './NotificationSettings';
import SignatureEditor from './SignatureEditor';

function SettingsV2() {
  const { theme, currentTheme, changeTheme } = useTheme();
  const c = currentTheme.colors;
  const [activeTab, setActiveTab] = useState('general');
  const [downloadPath, setDownloadPath] = useState('');
  const [appVersion, setAppVersion] = useState('...');

  useEffect(() => {
    loadDownloadPath();
    loadAppVersion();
  }, []);

  const loadAppVersion = async () => {
    if (window.electronAPI?.getVersion) {
      const version = await window.electronAPI.getVersion();
      setAppVersion(version);
    }
  };

  const loadDownloadPath = async () => {
    if (window.electronAPI?.getAppSettings) {
      const settings = await window.electronAPI.getAppSettings();
      setDownloadPath(settings.downloadPath || '');
    }
  };

  const selectDownloadFolder = async () => {
    if (window.electronAPI?.selectDownloadFolder) {
      const result = await window.electronAPI.selectDownloadFolder();
      if (result.success) {
        setDownloadPath(result.path);
        const settings = await window.electronAPI.getAppSettings();
        await window.electronAPI.saveAppSettings({ ...settings, downloadPath: result.path });
      }
    }
  };

  const tabs = [
    { id: 'general', name: 'Allgemein', icon: '⚙️' },
    { id: 'notifications', name: 'Benachrichtigungen', icon: '🔔' },
    { id: 'signatures', name: 'Signaturen', icon: '✍️' },
    { id: 'downloads', name: 'Downloads', icon: '📁' },
    { id: 'updates', name: 'Updates', icon: '🔄' },
  ];

  const themeOptions = [
    { id: 'dark', name: 'Dark', desc: 'Dunkles Design mit Cyan-Akzenten', preview: 'bg-gray-900' },
    { id: 'light', name: 'Light', desc: 'Helles Design mit blauen Akzenten', preview: 'bg-white' },
    { id: 'minimal', name: 'Minimal', desc: 'Minimalistisch in Schwarz/Weiß', preview: 'bg-gray-100' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            {/* Theme Selection */}
            <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
              <h3 className={`text-lg font-semibold ${c.text} mb-4`}>Design</h3>
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
            </div>

            {/* Info */}
            <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
              <h3 className={`text-lg font-semibold ${c.text} mb-4`}>Über CoreMail</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={c.textSecondary}>Version</span>
                  <span className={`${c.accent} font-semibold`}>{appVersion}</span>
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
            </div>

            {/* Hinweise */}
            <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
              <h3 className={`text-lg font-semibold ${c.text} mb-4`}>Hinweise</h3>
              <ul className={`space-y-2 text-sm ${c.textSecondary}`}>
                <li>• E-Mail-Konten werden unter "Konten" verwaltet</li>
                <li>• Passwörter werden verschlüsselt gespeichert</li>
                <li>• Für Gmail: App-Passwörter erforderlich</li>
                <li>• Tastaturkürzel: ↑↓ für E-Mail-Navigation</li>
              </ul>
            </div>

            {/* Changelog */}
            <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
              <h3 className={`text-lg font-semibold ${c.text} mb-4`}>Neu in v1.2.0</h3>
              <ul className={`space-y-2 text-sm ${c.textSecondary}`}>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">🔄</span>
                  <span>Update-Funktion: Automatische Update-Prüfung und Installation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">🔔</span>
                  <span>Desktop-Benachrichtigungen bei neuen E-Mails</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">📎</span>
                  <span>Verbesserte Anhang-Verwaltung mit Vorschau</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">✍️</span>
                  <span>E-Mail-Signaturen mit Rich-Text-Editor</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">🎨</span>
                  <span>Neues App-Icon</span>
                </li>
              </ul>
            </div>
          </div>
        );
      
      case 'notifications':
        return <NotificationSettings />;
      
      case 'signatures':
        return <SignatureEditor />;
      
      case 'downloads':
        return (
          <div className="space-y-6">
            <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
              <h3 className={`text-lg font-semibold ${c.text} mb-4`}>Download-Einstellungen</h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm ${c.textSecondary} mb-2`}>
                    Standard Download-Ordner
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={downloadPath}
                      readOnly
                      className={`flex-1 px-4 py-2 ${c.input} rounded-lg`}
                      placeholder="~/Downloads"
                    />
                    <button
                      onClick={selectDownloadFolder}
                      className={`px-4 py-2 ${c.accentBg} ${c.accentHover} text-white rounded-lg transition-colors`}
                    >
                      Ändern
                    </button>
                  </div>
                  <p className={`text-xs ${c.textSecondary} mt-2`}>
                    Hier werden Anhänge und Updates gespeichert
                  </p>
                </div>
              </div>
            </div>

            <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
              <h3 className={`text-lg font-semibold ${c.text} mb-4`}>Anhänge</h3>
              <ul className={`space-y-2 text-sm ${c.textSecondary}`}>
                <li>• Anhänge können einzeln oder alle auf einmal heruntergeladen werden</li>
                <li>• Bilder und PDFs werden mit Vorschau angezeigt</li>
                <li>• Klicke auf "Öffnen" um Dateien mit der Standard-App zu öffnen</li>
              </ul>
            </div>
          </div>
        );
      
      case 'updates':
        return <UpdateSettings />;
      
      default:
        return null;
    }
  };

  return (
    <div className={`flex-1 flex ${c.bg}`}>
      {/* Sidebar */}
      <div className={`w-56 ${c.bgSecondary} ${c.border} border-r p-4`}>
        <h2 className={`text-lg font-bold ${c.text} mb-4 px-3`}>Einstellungen</h2>
        <nav className="space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? `${c.accentBg} text-white`
                  : `${c.hover} ${c.text}`
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <h1 className={`text-2xl font-bold ${c.text} mb-6`}>
            {tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.name}
          </h1>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default SettingsV2;
