/**
 * UpdateManager.js - Auto-Update-Verwaltung für CoreMail Desktop (v1.16.0)
 * 
 * Verwaltet automatische Updates:
 * - Periodische Update-Checks (alle 24 Stunden)
 * - Update-Benachrichtigungen
 * - Download und Installation
 * - Update-Einstellungen
 */

const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 Stunden in Millisekunden
const STORAGE_KEY = 'coremailUpdateSettings';
const LAST_CHECK_KEY = 'coremailLastUpdateCheck';
const DISMISSED_VERSION_KEY = 'coremailDismissedVersion';

/**
 * Default Update-Einstellungen
 */
export const DEFAULT_UPDATE_SETTINGS = {
  autoCheckUpdates: true,
  autoDownload: false,
  autoInstall: false,
  showNotifications: true,
  checkInterval: UPDATE_CHECK_INTERVAL
};

/**
 * Lädt Update-Einstellungen aus localStorage
 */
export function loadUpdateSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_UPDATE_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error loading update settings:', e);
  }
  return DEFAULT_UPDATE_SETTINGS;
}

/**
 * Speichert Update-Einstellungen in localStorage
 */
export function saveUpdateSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (e) {
    console.error('Error saving update settings:', e);
    return false;
  }
}

/**
 * Prüft ob ein Update-Check fällig ist
 */
export function isUpdateCheckDue() {
  try {
    const settings = loadUpdateSettings();
    if (!settings.autoCheckUpdates) return false;
    
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    if (!lastCheck) return true;
    
    const lastCheckTime = parseInt(lastCheck, 10);
    const now = Date.now();
    
    return (now - lastCheckTime) >= settings.checkInterval;
  } catch (e) {
    return true;
  }
}

/**
 * Markiert den Update-Check als durchgeführt
 */
export function markUpdateChecked() {
  localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
}

/**
 * Prüft ob eine Version bereits abgelehnt wurde
 */
export function isVersionDismissed(version) {
  try {
    const dismissed = localStorage.getItem(DISMISSED_VERSION_KEY);
    return dismissed === version;
  } catch (e) {
    return false;
  }
}

/**
 * Markiert eine Version als abgelehnt ("Nicht mehr anzeigen")
 */
export function dismissVersion(version) {
  localStorage.setItem(DISMISSED_VERSION_KEY, version);
}

/**
 * Setzt die abgelehnte Version zurück
 */
export function resetDismissedVersion() {
  localStorage.removeItem(DISMISSED_VERSION_KEY);
}

/**
 * Update-Status Typen
 */
export const UpdateStatus = {
  IDLE: 'idle',
  CHECKING: 'checking',
  UPDATE_AVAILABLE: 'update_available',
  DOWNLOADING: 'downloading',
  DOWNLOADED: 'downloaded',
  INSTALLING: 'installing',
  UP_TO_DATE: 'up_to_date',
  ERROR: 'error'
};

/**
 * Formatiert Bytes in lesbare Größe
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Vergleicht zwei Versionen
 * @returns {number} 1 wenn v1 > v2, -1 wenn v1 < v2, 0 wenn gleich
 */
export function compareVersions(v1, v2) {
  const parts1 = v1.replace('v', '').split('.').map(Number);
  const parts2 = v2.replace('v', '').split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

/**
 * Update Manager Klasse
 */
class UpdateManagerClass {
  constructor() {
    this.status = UpdateStatus.IDLE;
    this.updateInfo = null;
    this.progress = 0;
    this.downloadedPath = null;
    this.error = null;
    this.listeners = new Set();
    this.checkInterval = null;
  }

  /**
   * Registriert einen Listener für Update-Events
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Benachrichtigt alle Listener
   */
  notify() {
    const state = {
      status: this.status,
      updateInfo: this.updateInfo,
      progress: this.progress,
      downloadedPath: this.downloadedPath,
      error: this.error
    };
    this.listeners.forEach(cb => cb(state));
  }

  /**
   * Startet den Auto-Update-Check-Intervall
   */
  startAutoCheck() {
    const settings = loadUpdateSettings();
    
    if (!settings.autoCheckUpdates) return;

    // Initialer Check nach 5 Sekunden
    setTimeout(() => {
      if (isUpdateCheckDue()) {
        this.checkForUpdates(true);
      }
    }, 5000);

    // Regelmäßiger Check
    this.checkInterval = setInterval(() => {
      if (isUpdateCheckDue()) {
        this.checkForUpdates(true);
      }
    }, 60 * 60 * 1000); // Jede Stunde prüfen ob 24h vergangen
  }

  /**
   * Stoppt den Auto-Update-Check
   */
  stopAutoCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Prüft auf Updates
   */
  async checkForUpdates(silent = false) {
    if (this.status === UpdateStatus.CHECKING) return;
    
    this.status = UpdateStatus.CHECKING;
    this.error = null;
    if (!silent) this.notify();

    try {
      const result = await window.electronAPI.checkForUpdates();
      markUpdateChecked();
      
      if (result.success) {
        if (result.hasUpdate) {
          const settings = loadUpdateSettings();
          
          // Prüfen ob Version abgelehnt wurde
          if (silent && isVersionDismissed(result.latestVersion)) {
            this.status = UpdateStatus.IDLE;
            this.notify();
            return result;
          }
          
          this.status = UpdateStatus.UPDATE_AVAILABLE;
          this.updateInfo = result;
          window.electronAPI?.logAdd?.('update',
            `Update verfügbar: v${result.latestVersion}`,
            `Aktuelle Version: v${result.currentVersion}`
          ).catch?.(() => {});

          // Auto-Download wenn aktiviert
          if (settings.autoDownload) {
            this.downloadUpdate();
          }
        } else {
          this.status = UpdateStatus.UP_TO_DATE;
          this.updateInfo = result;
        }
      } else {
        this.status = UpdateStatus.ERROR;
        this.error = result.error;
      }
    } catch (e) {
      this.status = UpdateStatus.ERROR;
      this.error = e.message;
    }

    this.notify();
    return this.updateInfo;
  }

  /**
   * Lädt das Update herunter
   */
  async downloadUpdate() {
    if (!this.updateInfo?.downloadUrl) {
      this.error = 'Keine Download-URL verfügbar';
      this.status = UpdateStatus.ERROR;
      this.notify();
      return;
    }

    this.status = UpdateStatus.DOWNLOADING;
    this.progress = 0;
    this.notify();

    // Progress-Listener
    const progressHandler = (data) => {
      this.progress = data.progress;
      this.notify();
    };
    
    if (window.electronAPI?.onUpdateProgress) {
      window.electronAPI.onUpdateProgress(progressHandler);
    }

    try {
      const result = await window.electronAPI.downloadUpdate(this.updateInfo.downloadUrl);
      
      if (result.success) {
        this.status = UpdateStatus.DOWNLOADED;
        this.downloadedPath = result.filePath;
        this.progress = 100;
        
        // Auto-Install wenn aktiviert
        const settings = loadUpdateSettings();
        if (settings.autoInstall) {
          setTimeout(() => this.installUpdate(), 1000);
        }
      } else {
        this.status = UpdateStatus.ERROR;
        this.error = result.error;
      }
    } catch (e) {
      this.status = UpdateStatus.ERROR;
      this.error = e.message;
    }

    this.notify();
  }

  /**
   * Installiert das heruntergeladene Update
   */
  async installUpdate() {
    if (!this.downloadedPath) {
      this.error = 'Kein Update zum Installieren';
      this.status = UpdateStatus.ERROR;
      this.notify();
      return;
    }

    this.status = UpdateStatus.INSTALLING;
    this.notify();
    window.electronAPI?.logAdd?.('update',
      `Update wird installiert: v${this.updateInfo?.latestVersion || '?'}`,
      ''
    ).catch?.(() => {});

    try {
      const result = await window.electronAPI.installUpdate(this.downloadedPath);
      
      if (!result.success) {
        this.status = UpdateStatus.ERROR;
        this.error = result.error;
        this.notify();
      }
      // Bei Erfolg wird die App neugestartet
    } catch (e) {
      this.status = UpdateStatus.ERROR;
      this.error = e.message;
      this.notify();
    }
  }

  /**
   * Setzt den Update-Manager zurück
   */
  reset() {
    this.status = UpdateStatus.IDLE;
    this.updateInfo = null;
    this.progress = 0;
    this.downloadedPath = null;
    this.error = null;
    this.notify();
  }
}

// Singleton-Instanz
const UpdateManager = new UpdateManagerClass();

export default UpdateManager;
