import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

function UpdateSettings() {
  const { currentTheme } = useTheme();
  const c = currentTheme.colors;
  
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [currentVersion, setCurrentVersion] = useState('...');
  const [error, setError] = useState(null);
  const [downloadedPath, setDownloadedPath] = useState(null);
  const [settings, setSettings] = useState({
    autoCheckUpdates: true
  });

  useEffect(() => {
    loadSettings();
    loadCurrentVersion();
    
    // Listen for update progress
    if (window.electronAPI?.onUpdateProgress) {
      window.electronAPI.onUpdateProgress((data) => {
        setProgress(data.progress);
      });
    }
  }, []);

  const loadCurrentVersion = async () => {
    if (window.electronAPI?.getVersion) {
      const version = await window.electronAPI.getVersion();
      setCurrentVersion(version);
    }
  };

  const loadSettings = async () => {
    if (window.electronAPI?.getAppSettings) {
      const result = await window.electronAPI.getAppSettings();
      setSettings(prev => ({ ...prev, ...result }));
    }
  };

  const saveSettings = async (newSettings) => {
    setSettings(newSettings);
    if (window.electronAPI?.saveAppSettings) {
      await window.electronAPI.saveAppSettings(newSettings);
    }
  };

  const checkForUpdates = async () => {
    setChecking(true);
    setError(null);
    setUpdateInfo(null);
    
    try {
      const result = await window.electronAPI.checkForUpdates();
      if (result.success) {
        setUpdateInfo(result);
      } else {
        setError(result.error || 'Fehler beim Prüfen auf Updates');
      }
    } catch (e) {
      setError(e.message);
    }
    
    setChecking(false);
  };

  const downloadUpdate = async () => {
    if (!updateInfo?.downloadUrl) return;
    
    setDownloading(true);
    setProgress(0);
    setError(null);
    
    try {
      const result = await window.electronAPI.downloadUpdate(updateInfo.downloadUrl);
      if (result.success) {
        setDownloadedPath(result.filePath);
      } else {
        setError(result.error || 'Download fehlgeschlagen');
      }
    } catch (e) {
      setError(e.message);
    }
    
    setDownloading(false);
  };

  const installUpdate = async () => {
    if (!downloadedPath) return;
    
    try {
      await window.electronAPI.installUpdate(downloadedPath);
    } catch (e) {
      setError(e.message);
    }
  };

  const openDownloads = () => {
    window.electronAPI?.openDownloads();
  };

  return (
    <div className="space-y-6">
      {/* Current Version */}
      <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
        <h3 className={`text-lg font-semibold ${c.text} mb-4`}>Aktuelle Version</h3>
        <div className="flex items-center justify-between">
          <div>
            <span className={`text-2xl font-bold ${c.accent}`}>v{currentVersion}</span>
            <p className={`text-sm ${c.textSecondary} mt-1`}>CoreMail Desktop</p>
          </div>
          <button
            onClick={checkForUpdates}
            disabled={checking}
            className={`px-6 py-2 ${c.accentBg} ${c.accentHover} text-white rounded-lg transition-colors disabled:opacity-50`}
          >
            {checking ? 'Prüfe...' : 'Nach Updates suchen'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-600 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Update Available */}
      {updateInfo?.hasUpdate && (
        <div className={`${c.card} ${c.border} border rounded-xl p-6 border-cyan-500`}>
          <div className="flex items-start gap-4">
            <div className="text-3xl">🎉</div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${c.text} mb-2`}>
                Update verfügbar: v{updateInfo.latestVersion}
              </h3>
              
              {updateInfo.releaseNotes && (
                <div className={`text-sm ${c.textSecondary} mb-4 whitespace-pre-wrap max-h-40 overflow-auto`}>
                  {updateInfo.releaseNotes}
                </div>
              )}
              
              {!downloading && !downloadedPath && (
                <button
                  onClick={downloadUpdate}
                  className={`px-6 py-2 ${c.accentBg} ${c.accentHover} text-white rounded-lg transition-colors`}
                >
                  ⬇️ Jetzt herunterladen
                </button>
              )}
              
              {downloading && (
                <div className="space-y-2">
                  <div className={`w-full h-3 ${c.bgTertiary} rounded-full overflow-hidden`}>
                    <div 
                      className="h-full bg-cyan-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className={`text-sm ${c.textSecondary}`}>
                    Download: {progress}%
                  </p>
                </div>
              )}
              
              {downloadedPath && (
                <div className="space-y-3">
                  <p className={`text-sm text-green-400`}>
                    ✓ Download abgeschlossen
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={installUpdate}
                      className={`px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors`}
                    >
                      🚀 Update installieren
                    </button>
                    <button
                      onClick={openDownloads}
                      className={`px-4 py-2 ${c.bgTertiary} ${c.hover} ${c.text} rounded-lg transition-colors`}
                    >
                      📁 Download-Ordner öffnen
                    </button>
                  </div>
                  <p className={`text-xs ${c.textSecondary}`}>
                    Hinweis: Die App wird nach der Installation neu gestartet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Update */}
      {updateInfo && !updateInfo.hasUpdate && (
        <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
          <div className="flex items-center gap-4">
            <div className="text-3xl">✅</div>
            <div>
              <h3 className={`text-lg font-semibold ${c.text}`}>
                Sie verwenden die neueste Version
              </h3>
              <p className={`text-sm ${c.textSecondary}`}>
                CoreMail Desktop v{currentVersion}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Update Settings */}
      <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
        <h3 className={`text-lg font-semibold ${c.text} mb-4`}>Update-Einstellungen</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.autoCheckUpdates}
            onChange={(e) => saveSettings({ ...settings, autoCheckUpdates: e.target.checked })}
            className="w-5 h-5 rounded accent-cyan-500"
          />
          <div>
            <span className={c.text}>Automatisch nach Updates suchen</span>
            <p className={`text-sm ${c.textSecondary}`}>
              Beim Start der App wird auf neue Versionen geprüft
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}

export default UpdateSettings;
