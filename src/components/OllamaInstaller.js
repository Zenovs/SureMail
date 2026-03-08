import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Download, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const STEPS = {
  checking: { icon: Loader2, color: 'text-blue-400', spin: true },
  downloading: { icon: Download, color: 'text-cyan-400', spin: false },
  installing: { icon: Loader2, color: 'text-cyan-400', spin: true },
  installed: { icon: Check, color: 'text-green-400', spin: false },
  starting: { icon: Loader2, color: 'text-yellow-400', spin: true },
  running: { icon: Check, color: 'text-green-400', spin: false },
  model_download: { icon: Download, color: 'text-purple-400', spin: false },
  model_ready: { icon: Check, color: 'text-green-400', spin: false },
  complete: { icon: Check, color: 'text-green-400', spin: false },
  error: { icon: AlertCircle, color: 'text-red-400', spin: false }
};

const OllamaInstaller = ({ isOpen, onClose, onInstallComplete }) => {
  const { currentTheme } = useTheme();
  const c = currentTheme.colors;
  
  const [status, setStatus] = useState('idle'); // idle, checking, installing, complete, error
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [ollamaStatus, setOllamaStatus] = useState({ installed: false, running: false });

  // Check Ollama status on mount
  useEffect(() => {
    if (isOpen) {
      checkOllamaStatus();
    }
  }, [isOpen]);

  // Listen for progress updates
  useEffect(() => {
    if (window.electronAPI?.onOllamaProgress) {
      window.electronAPI.onOllamaProgress((data) => {
        setProgress(data);
        if (data.step === 'error') {
          setError(data.message);
          setStatus('error');
        } else if (data.step === 'complete') {
          setStatus('complete');
        }
      });

      return () => {
        if (window.electronAPI?.removeOllamaProgressListener) {
          window.electronAPI.removeOllamaProgressListener();
        }
      };
    }
  }, []);

  const checkOllamaStatus = async () => {
    setStatus('checking');
    try {
      if (window.electronAPI?.checkOllamaInstalled) {
        const result = await window.electronAPI.checkOllamaInstalled();
        setOllamaStatus(result);
        setStatus('idle');
        
        if (result.installed && result.running) {
          // Already ready
          setStatus('complete');
          setProgress({ step: 'complete', message: 'Ollama ist bereits installiert und läuft!' });
        }
      }
    } catch (err) {
      setStatus('idle');
    }
  };

  const handleInstall = useCallback(async () => {
    setStatus('installing');
    setError(null);
    setProgress({ step: 'checking', message: 'Starte Installation...' });

    try {
      const result = await window.electronAPI.installOllama();
      if (result.success) {
        setStatus('complete');
        if (onInstallComplete) {
          onInstallComplete();
        }
      } else {
        setError(result.error);
        setStatus('error');
      }
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [onInstallComplete]);

  const handleStartService = useCallback(async () => {
    setStatus('installing');
    setProgress({ step: 'starting', message: 'Starte Ollama-Dienst...' });

    try {
      const result = await window.electronAPI.startOllamaService();
      if (result.success) {
        setStatus('complete');
        setProgress({ step: 'complete', message: 'Ollama-Dienst läuft!' });
        if (onInstallComplete) {
          onInstallComplete();
        }
      } else {
        setError(result.error);
        setStatus('error');
      }
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [onInstallComplete]);

  const handleClose = () => {
    if (status !== 'installing') {
      onClose();
    }
  };

  const handleSkip = () => {
    // Mark as skipped in settings
    if (window.electronAPI?.saveAppSettings) {
      window.electronAPI.getAppSettings().then(settings => {
        window.electronAPI.saveAppSettings({
          ...settings,
          ollamaInstallSkipped: true
        });
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  const currentStep = STEPS[progress?.step] || STEPS.checking;
  const StepIcon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-lg mx-4 rounded-2xl ${c.card} border ${c.border} shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${c.text}`}>KI-Assistent einrichten</h2>
              <p className={`text-sm ${c.textSecondary}`}>Lokale KI mit Ollama</p>
            </div>
          </div>
          {status !== 'installing' && (
            <button
              onClick={handleClose}
              className={`p-2 rounded-lg ${c.hover} transition-colors`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Initial State - Ollama not installed */}
          {status === 'idle' && !ollamaStatus.installed && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-cyan-400" />
              </div>
              <h3 className={`text-lg font-semibold ${c.text} mb-2`}>Ollama wird benötigt</h3>
              <p className={`text-sm ${c.textSecondary} mb-6`}>
                Für den KI-Assistenten wird Ollama benötigt. Möchtest du es jetzt installieren?
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={handleInstall}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Jetzt installieren
                </button>
                <button
                  onClick={handleSkip}
                  className={`w-full py-3 px-4 rounded-xl ${c.bgSecondary} ${c.text} font-medium ${c.hover} transition-colors`}
                >
                  Später installieren
                </button>
              </div>

              <p className={`text-xs ${c.textSecondary} mt-4`}>
                Die Installation benötigt ca. 1.5 GB Speicherplatz.
              </p>
            </div>
          )}

          {/* Installed but not running */}
          {status === 'idle' && ollamaStatus.installed && !ollamaStatus.running && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-yellow-400" />
              </div>
              <h3 className={`text-lg font-semibold ${c.text} mb-2`}>Ollama nicht aktiv</h3>
              <p className={`text-sm ${c.textSecondary} mb-6`}>
                Ollama ist installiert, aber der Dienst läuft nicht. Möchtest du ihn starten?
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={handleStartService}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Ollama starten
                </button>
                <button
                  onClick={handleSkip}
                  className={`w-full py-3 px-4 rounded-xl ${c.bgSecondary} ${c.text} font-medium ${c.hover} transition-colors`}
                >
                  Später starten
                </button>
              </div>
            </div>
          )}

          {/* Installing / Progress */}
          {(status === 'installing' || status === 'checking') && progress && (
            <div className="text-center">
              <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-cyan-500/20 flex items-center justify-center`}>
                <StepIcon className={`w-10 h-10 ${currentStep.color} ${currentStep.spin ? 'animate-spin' : ''}`} />
              </div>
              
              <h3 className={`text-lg font-semibold ${c.text} mb-2`}>{progress.message}</h3>
              
              {progress.detail && (
                <p className={`text-sm ${c.textSecondary} mb-4 font-mono`}>{progress.detail}</p>
              )}
              
              {/* Progress Bar */}
              {progress.progress !== undefined && (
                <div className="mt-4">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                  <p className={`text-sm ${c.textSecondary} mt-2`}>{progress.progress}%</p>
                </div>
              )}

              <p className={`text-xs ${c.textSecondary} mt-4`}>
                Bitte warte, bis die Installation abgeschlossen ist...
              </p>
            </div>
          )}

          {/* Complete */}
          {status === 'complete' && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-green-500/20 flex items-center justify-center">
                <Check className="w-10 h-10 text-green-400" />
              </div>
              <h3 className={`text-lg font-semibold ${c.text} mb-2`}>Installation erfolgreich!</h3>
              <p className={`text-sm ${c.textSecondary} mb-6`}>
                Der KI-Assistent ist jetzt einsatzbereit. Du findest ihn unten rechts im Chat-Widget.
              </p>
              
              <button
                onClick={handleClose}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:from-green-400 hover:to-emerald-500 transition-all"
              >
                Los geht's!
              </button>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h3 className={`text-lg font-semibold ${c.text} mb-2`}>Installation fehlgeschlagen</h3>
              <p className={`text-sm text-red-400 mb-4`}>{error}</p>
              
              <div className={`p-4 rounded-xl ${c.bgSecondary} text-left mb-4`}>
                <p className={`text-sm ${c.text} font-medium mb-2`}>Manuelle Installation:</p>
                <code className={`text-xs ${c.textSecondary} block bg-black/30 p-2 rounded font-mono`}>
                  curl -fsSL https://ollama.com/install.sh | sh
                </code>
                <p className={`text-xs ${c.textSecondary} mt-2`}>
                  Danach starte: <code className="bg-black/30 px-1 rounded">ollama serve</code>
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => { setStatus('idle'); setError(null); }}
                  className={`flex-1 py-3 px-4 rounded-xl ${c.bgSecondary} ${c.text} font-medium ${c.hover} transition-colors`}
                >
                  Erneut versuchen
                </button>
                <button
                  onClick={handleSkip}
                  className={`flex-1 py-3 px-4 rounded-xl ${c.bgSecondary} ${c.text} font-medium ${c.hover} transition-colors`}
                >
                  Überspringen
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t border-white/10 ${c.bgSecondary}`}>
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className={c.textSecondary}>Powered by</span>
            <a 
              href="https://ollama.com" 
              target="_blank" 
              rel="noreferrer"
              className="text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Ollama
            </a>
            <span className={c.textSecondary}>• Alle Daten bleiben lokal</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OllamaInstaller;
