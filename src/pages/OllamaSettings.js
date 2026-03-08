import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useOllama } from '../context/OllamaContext';

const RECOMMENDED_MODELS = [
  { name: 'llama3.2:1b', size: '~1.3 GB', desc: 'Kompakt & schnell, ideal für einfache Aufgaben' },
  { name: 'llama3.2:3b', size: '~2 GB', desc: 'Ausgewogen, gute Qualität bei moderater Größe' },
  { name: 'mistral:7b', size: '~4 GB', desc: 'Sehr fähig, ideal für komplexe Aufgaben' },
  { name: 'gemma2:2b', size: '~1.6 GB', desc: 'Google-Modell, schnell und effizient' },
  { name: 'phi3:mini', size: '~2.3 GB', desc: 'Microsoft-Modell, kompakt aber leistungsfähig' },
  { name: 'qwen2:1.5b', size: '~1 GB', desc: 'Alibaba-Modell, sehr schnell' },
];

const OllamaSettings = () => {
  const { currentTheme } = useTheme();
  const { 
    isAvailable, 
    isChecking,
    installedModels, 
    activeModel, 
    downloadProgress,
    checkOllama,
    pullModel,
    deleteModel,
    changeModel
  } = useOllama();
  
  const [customModel, setCustomModel] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const c = currentTheme.colors;

  const handlePullModel = async (modelName) => {
    await pullModel(modelName);
  };

  const handleDeleteModel = async (modelName) => {
    if (deleteConfirm === modelName) {
      await deleteModel(modelName);
      setDeleteConfirm(null);
      if (activeModel === modelName && installedModels.length > 1) {
        const otherModel = installedModels.find(m => m.name !== modelName);
        if (otherModel) changeModel(otherModel.name);
      }
    } else {
      setDeleteConfirm(modelName);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return 'N/A';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Status Section */}
      <div className={`p-4 rounded-xl ${c.bg} border ${c.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isAvailable ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <h3 className={`font-semibold ${c.text}`}>Ollama Status</h3>
              <p className={`text-sm ${c.textMuted}`}>
                {isChecking ? 'Prüfe Verbindung...' : 
                 isAvailable ? 'Läuft und bereit' : 'Nicht verfügbar'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${
              isChecking ? 'bg-yellow-500 animate-pulse' :
              isAvailable ? 'bg-green-500' : 'bg-red-500'
            }`}></span>
            <button
              onClick={checkOllama}
              className={`px-3 py-1.5 rounded-lg text-sm ${c.bgSecondary} hover:${c.bgHover} ${c.text} transition-colors`}
            >
              Neu prüfen
            </button>
          </div>
        </div>
      </div>

      {/* Installation Help when not available */}
      {!isAvailable && !isChecking && (
        <div className={`p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30`}>
          <h4 className={`font-medium text-yellow-400 mb-2`}>Ollama installieren</h4>
          <p className={`text-sm ${c.textMuted} mb-3`}>
            Ollama ist nicht installiert oder läuft nicht. Führe folgenden Befehl im Terminal aus:
          </p>
          <div className={`p-3 rounded-lg ${c.bg} font-mono text-sm ${c.text} mb-3`}>
            curl -fsSL https://ollama.com/install.sh | sh
          </div>
          <p className={`text-sm ${c.textMuted}`}>
            Nach der Installation starte Ollama mit: <code className="bg-gray-700/50 px-2 py-0.5 rounded">ollama serve</code>
          </p>
        </div>
      )}

      {/* Installed Models */}
      {isAvailable && (
        <>
          <div className={`p-4 rounded-xl ${c.bg} border ${c.border}`}>
            <h4 className={`font-medium ${c.text} mb-4`}>Installierte Modelle</h4>
            
            {installedModels.length === 0 ? (
              <p className={`text-sm ${c.textMuted} text-center py-4`}>
                Keine Modelle installiert. Lade ein Modell herunter, um zu beginnen.
              </p>
            ) : (
              <div className="space-y-2">
                {installedModels.map((model) => (
                  <div
                    key={model.name}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      activeModel === model.name ? 'bg-cyan-500/10 border border-cyan-500/30' : c.bgSecondary
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🧠</span>
                      <div>
                        <p className={`font-medium ${c.text}`}>{model.name}</p>
                        <p className={`text-xs ${c.textMuted}`}>
                          {formatSize(model.size)} • Geändert: {new Date(model.modified_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeModel === model.name ? (
                        <span className="px-2 py-1 rounded text-xs bg-cyan-500/20 text-cyan-400">
                          Aktiv
                        </span>
                      ) : (
                        <button
                          onClick={() => changeModel(model.name)}
                          className="px-3 py-1.5 rounded-lg text-sm bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                        >
                          Auswählen
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteModel(model.name)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          deleteConfirm === model.name
                            ? 'bg-red-500 text-white'
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        }`}
                      >
                        {deleteConfirm === model.name ? 'Bestätigen' : 'Löschen'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Download Progress */}
          {downloadProgress && (
            <div className={`p-4 rounded-xl ${c.bg} border ${c.border}`}>
              <h4 className={`font-medium ${c.text} mb-3`}>Download läuft...</h4>
              <div className="flex items-center gap-3">
                <span className="text-xl animate-spin">⬇️</span>
                <div className="flex-1">
                  <p className={`text-sm ${c.text} mb-1`}>{downloadProgress.model}</p>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                      style={{ width: `${downloadProgress.progress}%` }}
                    ></div>
                  </div>
                  <p className={`text-xs ${c.textMuted} mt-1`}>
                    {downloadProgress.status} • {downloadProgress.progress}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recommended Models */}
          <div className={`p-4 rounded-xl ${c.bg} border ${c.border}`}>
            <h4 className={`font-medium ${c.text} mb-4`}>Empfohlene Modelle</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {RECOMMENDED_MODELS.map((model) => {
                const isInstalled = installedModels.some(m => m.name.startsWith(model.name.split(':')[0]));
                return (
                  <div
                    key={model.name}
                    className={`p-3 rounded-lg ${c.bgSecondary} border ${c.border}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`font-medium ${c.text}`}>{model.name}</p>
                        <p className={`text-xs ${c.textMuted} mt-0.5`}>{model.size}</p>
                        <p className={`text-xs ${c.textMuted} mt-1`}>{model.desc}</p>
                      </div>
                      {isInstalled ? (
                        <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">
                          ✓ Installiert
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePullModel(model.name)}
                          disabled={!!downloadProgress}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            downloadProgress
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                          }`}
                        >
                          Laden
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Model Download */}
          <div className={`p-4 rounded-xl ${c.bg} border ${c.border}`}>
            <h4 className={`font-medium ${c.text} mb-3`}>Anderes Modell installieren</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="z.B. codellama:7b oder phi3:medium"
                className={`flex-1 px-4 py-2 rounded-lg ${c.bgSecondary} ${c.text} border ${c.border} focus:border-cyan-500 focus:outline-none text-sm`}
              />
              <button
                onClick={() => {
                  if (customModel.trim()) {
                    handlePullModel(customModel.trim());
                    setCustomModel('');
                  }
                }}
                disabled={!customModel.trim() || !!downloadProgress}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  customModel.trim() && !downloadProgress
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Installieren
              </button>
            </div>
            <p className={`text-xs ${c.textMuted} mt-2`}>
              Alle verfügbaren Modelle findest du auf <a href="https://ollama.com/library" className="text-cyan-400 hover:underline" target="_blank" rel="noreferrer">ollama.com/library</a>
            </p>
          </div>
        </>
      )}

      {/* Tips */}
      <div className={`p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20`}>
        <h4 className={`font-medium text-cyan-400 mb-2`}>💡 Tipps</h4>
        <ul className={`text-sm ${c.textMuted} space-y-1`}>
          <li>• <strong>llama3.2:1b</strong> ist ideal für ältere Computer und schnelle Antworten</li>
          <li>• <strong>mistral:7b</strong> bietet bessere Qualität, benötigt aber mehr RAM (8GB+)</li>
          <li>• Größere Modelle liefern bessere Ergebnisse, sind aber langsamer</li>
          <li>• Du kannst mehrere Modelle installieren und zwischen ihnen wechseln</li>
        </ul>
      </div>
    </div>
  );
};

export default OllamaSettings;
