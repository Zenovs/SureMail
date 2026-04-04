const { app, BrowserWindow, ipcMain, Notification, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const url = require('url');
const { execSync, spawn } = require('child_process');
const Store = require('electron-store');
const imapSimple = require('imap-simple');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');



// ============ SANDBOX FIX (v3.0.9) ============
// Required for AppImage on Ubuntu/GNOME where FUSE sandbox is not available
// Must be called before app.whenReady()
app.commandLine.appendSwitch('no-sandbox');

// ============ GPU/OPENGL FIX (v1.5.2) ============
// Completely disable GPU/OpenGL to prevent "GetVSyncParametersIfAvailable() failed" errors
// This MUST be called before app.whenReady() - it's the most reliable fix
app.disableHardwareAcceleration();

// Additional command line flags for complete GPU suppression
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('disable-frame-rate-limit');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor');
app.commandLine.appendSwitch('use-gl', 'swiftshader');
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');

// Suppress GPU-related logging
app.commandLine.appendSwitch('disable-logging');
app.commandLine.appendSwitch('log-level', '3'); // Only fatal errors

// App Version - read from package.json
const APP_VERSION = require('./package.json').version;
const GITHUB_REPO = 'Zenovs/coremail';

// Verschlüsselte Speicherung
const store = new Store({
  encryptionKey: 'coremail-secure-key-v1',
  name: 'coremail-config'
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#0a0a0a',
    icon: path.join(__dirname, 'assets/icon.png'),
    title: 'CoreMail Desktop'
  });

  const isDev = process.env.NODE_ENV === 'development';
  
  // Debug logging for loading issues (v2.4.1)
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`[CoreMail] Failed to load: ${errorCode} - ${errorDescription}`);
    console.error(`[CoreMail] URL: ${validatedURL}`);
  });
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[CoreMail] Page loaded successfully');
  });
  
  // Handle render process crashes (v2.4.1)
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('[CoreMail] Render process gone:', details.reason);
    // Attempt to reload
    if (details.reason !== 'killed') {
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.reload();
        }
      }, 1000);
    }
  });
  
  mainWindow.webContents.on('unresponsive', () => {
    console.error('[CoreMail] Window became unresponsive');
  });
  
  mainWindow.webContents.on('responsive', () => {
    console.log('[CoreMail] Window is responsive again');
  });
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Production: Load from build directory (v2.4.1 - improved path handling)
    const indexPath = path.join(__dirname, 'build', 'index.html');
    console.log('[CoreMail] Loading production build from:', indexPath);
    
    // Check if file exists
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath).catch(err => {
        console.error('[CoreMail] Error loading index.html:', err);
      });
    } else {
      console.error('[CoreMail] index.html not found at:', indexPath);
      // Show error in window
      mainWindow.loadURL(`data:text/html,<h1>Error: Build not found</h1><p>Please run 'npm run build' first.</p>`);
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Auto-Update Check on startup if enabled
  const settings = store.get('appSettings', {});
  if (settings.autoCheckUpdates !== false) {
    setTimeout(() => {
      checkForUpdates(true); // Silent check
    }, 5000);
  }
}

// ============ AUTO-START OLLAMA (v1.7.1) ============
async function autoStartOllama() {
  // Only try to start if Ollama is installed
  if (!isOllamaInstalled()) {
    console.log('[Ollama] Not installed, skipping auto-start');
    return;
  }

  // Check if already running
  if (await isOllamaRunning()) {
    console.log('[Ollama] Already running');
    return;
  }

  console.log('[Ollama] Installed but not running, starting automatically...');

  // Try systemctl first (silent)
  try {
    execSync('systemctl --user start ollama 2>/dev/null', { stdio: 'ignore' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (await isOllamaRunning()) {
      console.log('[Ollama] Started via systemctl');
      return;
    }
  } catch {
    // Ignore systemctl errors
  }

  // Fallback: start ollama serve in background
  try {
    const ollamaProcess = spawn('ollama', ['serve'], {
      detached: true,
      stdio: 'ignore'
    });
    ollamaProcess.unref();
    console.log('[Ollama] Started via ollama serve');
  } catch (err) {
    console.log('[Ollama] Could not auto-start:', err.message);
  }
}

app.whenReady().then(async () => {
  createWindow();
  // Auto-start Ollama in background (non-blocking)
  setTimeout(() => autoStartOllama(), 2000);
  // Sync system launcher icons in background (non-blocking)
  setTimeout(() => syncSystemIcons(), 3000);
  // Logbuch: App-Start protokollieren
  addLogEntry('app_start', `CoreMail v${APP_VERSION} gestartet`, `Plattform: ${process.platform}`);
});

// v3.0.3: Refresh Linux system launcher icons from GitHub so the correct icon
// appears in the app drawer after an in-app update (no re-install needed).
function syncSystemIcons() {
  if (process.platform !== 'linux') return;
  try {
    const { execFile } = require('child_process');
    const os = require('os');
    const home = os.homedir();
    const ICON_BASE = 'https://raw.githubusercontent.com/Zenovs/coremail/initial-code/public/icons';
    const SIZES = [16, 32, 64, 128, 256, 512];
    const APP_VERSION = app.getVersion();
    const versionKey = `iconsVersion`;
    const storedVersion = store.get(versionKey, '0');

    // Only update if app version changed (avoids unnecessary network requests)
    if (storedVersion === APP_VERSION) return;

    const downloadFile = (url, dest) => new Promise((resolve) => {
      const file = fs.createWriteStream(dest);
      https.get(url, (res) => {
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', () => { file.close(); resolve(); });
    });

    (async () => {
      try {
        for (const sz of SIZES) {
          const dir = path.join(home, `.local/share/icons/hicolor/${sz}x${sz}/apps`);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          await downloadFile(`${ICON_BASE}/icon-${sz}.png`, path.join(dir, 'coremail.png'));
        }
        // pixmaps (used as absolute icon path in .desktop file)
        const pixDir = path.join(home, '.local/share/pixmaps');
        if (!fs.existsSync(pixDir)) fs.mkdirSync(pixDir, { recursive: true });
        const pixIconPath = path.join(pixDir, 'coremail.png');
        await downloadFile(`${ICON_BASE}/icon-256.png`, pixIconPath);

        // Rewrite .desktop file — env-Prefix setzt APPIMAGE_EXTRACT_AND_RUN=1 für GNOME-Kompatibilität
        const desktopDir = path.join(home, '.local/share/applications');
        const desktopFile = path.join(desktopDir, 'coremail.desktop');
        const appImagePath = path.join(home, '.local/bin/coremail-desktop');
        if (fs.existsSync(desktopFile)) {
          const desktopContent = [
            '[Desktop Entry]',
            'Version=1.0',
            'Type=Application',
            'Name=CoreMail Desktop',
            'Comment=E-Mail Client für Linux',
            `Exec=env APPIMAGE_EXTRACT_AND_RUN=1 ${appImagePath} --no-sandbox`,
            `Icon=${pixIconPath}`,
            'Terminal=false',
            'Categories=Network;Email;Office;',
            'StartupNotify=true',
            'StartupWMClass=coremail-desktop',
            'Keywords=email;mail;imap;smtp;',
            ''
          ].join('\n');
          fs.writeFileSync(desktopFile, desktopContent);
        }

        // Refresh caches
        execFile('gtk-update-icon-cache', ['-f', path.join(home, '.local/share/icons/hicolor')], () => {});
        execFile('update-desktop-database', [path.join(home, '.local/share/applications')], () => {});

        store.set(versionKey, APP_VERSION);
        console.log('[Icons] System launcher icons updated to v' + APP_VERSION);
      } catch (e) {
        console.warn('[Icons] Could not update system icons:', e.message);
      }
    })();
  } catch (e) {
    console.warn('[Icons] syncSystemIcons error:', e.message);
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ============ HELPER FUNCTIONS ============

function getAccountById(accountId) {
  const accounts = store.get('accounts', []);
  return accounts.find(acc => acc.id === accountId);
}

// v2.0.0: IMAP-Konfiguration für ein Konto erstellen
function getImapConfigForAccount(account) {
  return {
    imap: {
      user: account.imap.username,
      password: account.imap.password,
      host: account.imap.host,
      port: parseInt(account.imap.port) || 993,
      tls: account.imap.tls !== false,
      authTimeout: 15000,
      connTimeout: 30000,
      tlsOptions: { rejectUnauthorized: false }
    }
  };
}

// v2.8.4: Find the Sent folder by \Sent attribute or common names
async function findSentFolderName(connection) {
  try {
    const boxes = await connection.getBoxes();
    const COMMON_SENT = ['Sent', 'Sent Items', 'Sent Mail', '[Gmail]/Sent Mail',
      'INBOX.Sent', 'Gesendet', 'INBOX.Gesendet', 'Gesendete Elemente'];

    const search = (boxes, prefix) => {
      for (const [name, box] of Object.entries(boxes)) {
        const sep = box.delimiter || '/';
        const fullName = prefix ? `${prefix}${sep}${name}` : name;
        if (box.attribs && (box.attribs.includes('\\Sent') || box.attribs.includes('\\sent')))
          return fullName;
        if (box.children) {
          const found = search(box.children, fullName);
          if (found) return found;
        }
      }
      return null;
    };

    const byAttrib = search(boxes, '');
    if (byAttrib) return byAttrib;

    // Collect all folder names and try common patterns
    const allNames = [];
    const collect = (boxes, prefix) => {
      for (const [name, box] of Object.entries(boxes)) {
        const sep = box.delimiter || '/';
        const fullName = prefix ? `${prefix}${sep}${name}` : name;
        allNames.push(fullName);
        if (box.children) collect(box.children, fullName);
      }
    };
    collect(boxes, '');

    for (const common of COMMON_SENT) {
      const found = allNames.find(n => n.toLowerCase() === common.toLowerCase());
      if (found) return found;
    }
    return null;
  } catch (e) {
    console.error('[Sent] findSentFolderName error:', e);
    return null;
  }
}

// v2.1.0: SMTP-Transporter für ein Konto erstellen (mit Anzeigename-Unterstützung)
function getSmtpTransporterForAccount(account) {
  const smtp = account.smtp;
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: parseInt(smtp.port),
    secure: smtp.secure !== false,
    auth: {
      user: smtp.username,
      pass: smtp.password
    }
  });

  const email = smtp.fromEmail || smtp.username;
  const displayName = account.displayName ? account.displayName.replace(/["\\\r\n]/g, '') : '';
  const fromEmail = displayName ? `"${displayName}" <${email}>` : email;

  return { transporter, fromEmail };
}

// v2.3.0: Improved icon path resolution
function getIconPath() {
  if (app.isPackaged) {
    // Try multiple locations for packaged app
    const locations = [
      path.join(process.resourcesPath, 'icon.png'),
      path.join(process.resourcesPath, 'app.asar', 'assets', 'icon.png'),
      path.join(__dirname, 'assets', 'icon.png')
    ];
    for (const loc of locations) {
      if (fs.existsSync(loc)) {
        return loc;
      }
    }
  }
  return path.join(__dirname, 'assets', 'icon.png');
}

// v2.3.0: Get notification icon (transparent background)
function getNotificationIconPath() {
  const iconName = 'notification.png';
  
  if (app.isPackaged) {
    const locations = [
      path.join(process.resourcesPath, iconName),
      path.join(process.resourcesPath, 'app.asar', 'assets', iconName),
      path.join(__dirname, 'assets', iconName)
    ];
    for (const loc of locations) {
      if (fs.existsSync(loc)) {
        return loc;
      }
    }
  }
  
  const devPath = path.join(__dirname, 'assets', iconName);
  if (fs.existsSync(devPath)) {
    return devPath;
  }
  
  // Fallback to regular icon if notification icon not found
  return getIconPath();
}

// ============ UPDATE FUNCTIONS ============

async function checkForUpdates(silent = false) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_REPO}/releases/latest`,
      headers: {
        'User-Agent': 'CoreMail-Desktop',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const release = JSON.parse(data);
          const latestVersion = release.tag_name?.replace('v', '') || '';
          // Only report an update if a real downloadable AppImage asset exists
          const appImageAsset = (release.assets || []).find(a =>
            a.name && a.name.toLowerCase().endsWith('.appimage') && a.browser_download_url
          );
          const hasUpdate = compareVersions(latestVersion, APP_VERSION) > 0 && !!appImageAsset;
          const downloadUrl = appImageAsset ? appImageAsset.browser_download_url : null;

          if (hasUpdate && !silent && mainWindow) {
            mainWindow.webContents.send('update:available', {
              version: latestVersion,
              notes: release.body || '',
              downloadUrl
            });
          }

          resolve({
            success: true,
            currentVersion: APP_VERSION,
            latestVersion,
            hasUpdate,
            releaseNotes: release.body || '',
            downloadUrl,
            publishedAt: release.published_at
          });
        } catch (e) {
          resolve({ success: false, error: 'Fehler beim Parsen der Release-Info', currentVersion: APP_VERSION });
        }
      });
    }).on('error', (e) => {
      resolve({ success: false, error: e.message, currentVersion: APP_VERSION });
    });
  });
}

function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

async function downloadUpdate(downloadUrl) {
  return new Promise((resolve, reject) => {
    const downloadDir = app.getPath('downloads');
    const filename = `CoreMail-Desktop-update.AppImage`;
    const filePath = path.join(downloadDir, filename);
    
    // Remove existing file if present
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.log('Could not remove existing file:', e.message);
    }

    let redirectCount = 0;
    const MAX_REDIRECTS = 10;

    // Follow redirects with proper HTTP/HTTPS handling
    const download = (url) => {
      if (redirectCount++ > MAX_REDIRECTS) {
        reject(new Error('Zu viele Weiterleitungen'));
        return;
      }

      const protocol = url.startsWith('https') ? https : http;
      
      const request = protocol.get(url, {
        headers: { 
          'User-Agent': 'CoreMail-Desktop',
          'Accept': 'application/octet-stream'
        },
        timeout: 30000
      }, (response) => {
        // Handle redirects
        if (response.statusCode === 302 || response.statusCode === 301 || response.statusCode === 307) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            // Handle relative URLs
            const finalUrl = redirectUrl.startsWith('http') ? redirectUrl : new URL(redirectUrl, url).href;
            download(finalUrl);
            return;
          }
        }

        // Check for HTTP errors
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP-Fehler: ${response.statusCode}`));
          return;
        }

        // Get total size - handle missing Content-Length
        const totalSize = parseInt(response.headers['content-length'], 10);
        const hasValidSize = !isNaN(totalSize) && totalSize > 0;
        let downloadedSize = 0;
        
        const file = fs.createWriteStream(filePath);

        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          
          // Calculate progress - handle unknown size
          let progress;
          if (hasValidSize) {
            progress = Math.round((downloadedSize / totalSize) * 100);
          } else {
            // Show downloaded MB instead of percentage
            progress = Math.min(99, Math.round(downloadedSize / (1024 * 1024))); // MB downloaded as "progress"
          }
          
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('update:progress', { 
              progress, 
              downloaded: downloadedSize, 
              total: hasValidSize ? totalSize : downloadedSize,
              hasValidSize
            });
          }
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close(() => {
            // Verify file was downloaded
            try {
              const stats = fs.statSync(filePath);
              if (stats.size < 1000) {
                fs.unlinkSync(filePath);
                reject(new Error('Download unvollständig - Datei zu klein'));
                return;
              }
              
              // Make executable
              fs.chmodSync(filePath, 0o755);
              console.log('Update downloaded successfully:', filePath, 'Size:', stats.size);
              resolve({ success: true, filePath, size: stats.size });
            } catch (e) {
              reject(new Error('Datei konnte nicht verifiziert werden: ' + e.message));
            }
          });
        });

        file.on('error', (err) => {
          fs.unlink(filePath, () => {});
          reject(new Error('Schreibfehler: ' + err.message));
        });

        response.on('error', (err) => {
          file.close();
          fs.unlink(filePath, () => {});
          reject(new Error('Download-Fehler: ' + err.message));
        });
      });

      request.on('error', (err) => {
        reject(new Error('Verbindungsfehler: ' + err.message));
      });

      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Download-Timeout'));
      });
    };

    download(downloadUrl);
  });
}

// ============ NOTIFICATION FUNCTIONS ============

// v2.3.0: Updated to use notification icon with transparent background
function showNotification(title, body, onClick = null) {
  if (!Notification.isSupported()) {
    console.log('Notifications not supported');
    return;
  }

  const notification = new Notification({
    title,
    body,
    icon: getNotificationIconPath(),
    silent: store.get('appSettings.notificationSound', true) === false
  });

  if (onClick) {
    notification.on('click', onClick);
  }

  notification.show();
  return notification;
}

function updateBadgeCount(count) {
  if (process.platform === 'linux') {
    // Linux uses Unity/GNOME launcher API
    if (app.setBadgeCount) {
      app.setBadgeCount(count);
    }
  }
}

// ============ OLLAMA INSTALLATION (v1.6.0) ============

// Check if Ollama is installed
function isOllamaInstalled() {
  try {
    execSync('which ollama', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Check if Ollama is running
async function isOllamaRunning() {
  return new Promise((resolve) => {
    http.get('http://localhost:11434/api/tags', { timeout: 2000 }, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

// Install Ollama
async function installOllama(progressCallback) {
  return new Promise((resolve, reject) => {
    progressCallback({ step: 'checking', message: 'Prüfe Systemvoraussetzungen...' });
    
    // Check if curl is available
    try {
      execSync('which curl', { stdio: 'ignore' });
    } catch {
      reject(new Error('curl ist nicht installiert. Bitte installiere curl zuerst.'));
      return;
    }

    progressCallback({ step: 'downloading', message: 'Lade Ollama herunter...' });
    
    // Download and install Ollama
    const installProcess = spawn('sh', ['-c', 'curl -fsSL https://ollama.com/install.sh | sh'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    installProcess.stdout.on('data', (data) => {
      output += data.toString();
      progressCallback({ step: 'installing', message: 'Installiere Ollama...', detail: data.toString().trim() });
    });

    installProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    installProcess.on('close', (code) => {
      if (code === 0 && isOllamaInstalled()) {
        progressCallback({ step: 'installed', message: 'Ollama erfolgreich installiert!' });
        resolve({ success: true });
      } else {
        reject(new Error(errorOutput || 'Installation fehlgeschlagen. Code: ' + code));
      }
    });

    installProcess.on('error', (err) => {
      reject(new Error('Installation konnte nicht gestartet werden: ' + err.message));
    });
  });
}

// Start Ollama service
async function startOllamaService(progressCallback) {
  progressCallback({ step: 'starting', message: 'Starte Ollama-Dienst...' });
  
  return new Promise((resolve, reject) => {
    // First try systemctl
    try {
      execSync('systemctl --user start ollama 2>/dev/null || true', { stdio: 'ignore' });
    } catch {
      // Ignore systemctl errors
    }

    // Wait a moment for systemctl
    setTimeout(async () => {
      if (await isOllamaRunning()) {
        resolve({ success: true });
        return;
      }

      // Fallback: start ollama serve in background
      const ollamaProcess = spawn('ollama', ['serve'], {
        detached: true,
        stdio: 'ignore'
      });
      ollamaProcess.unref();

      // Wait for service to start
      let attempts = 0;
      const checkInterval = setInterval(async () => {
        attempts++;
        if (await isOllamaRunning()) {
          clearInterval(checkInterval);
          progressCallback({ step: 'running', message: 'Ollama-Dienst läuft!' });
          resolve({ success: true });
        } else if (attempts > 15) {
          clearInterval(checkInterval);
          reject(new Error('Ollama-Dienst konnte nicht gestartet werden. Versuche: ollama serve'));
        }
      }, 1000);
    }, 1000);
  });
}

// Download the default model
async function downloadOllamaModel(modelName, progressCallback) {
  progressCallback({ step: 'model_download', message: `Lade KI-Modell "${modelName}" herunter...`, progress: 0 });
  
  return new Promise((resolve, reject) => {
    const pullProcess = spawn('ollama', ['pull', modelName], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    pullProcess.stdout.on('data', (data) => {
      const output = data.toString();
      // Try to parse progress from output
      const match = output.match(/(\d+)%/);
      if (match) {
        progressCallback({ 
          step: 'model_download', 
          message: `Lade KI-Modell "${modelName}" herunter...`,
          progress: parseInt(match[1]),
          detail: output.trim()
        });
      }
    });

    pullProcess.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('pulling')) {
        progressCallback({ step: 'model_download', message: 'Lade Modelldateien...', detail: output.trim() });
      }
    });

    pullProcess.on('close', (code) => {
      if (code === 0) {
        progressCallback({ step: 'model_ready', message: `Modell "${modelName}" bereit!`, progress: 100 });
        resolve({ success: true });
      } else {
        reject(new Error('Modell konnte nicht heruntergeladen werden.'));
      }
    });

    pullProcess.on('error', (err) => {
      reject(new Error('Modell-Download fehlgeschlagen: ' + err.message));
    });
  });
}

// ============ IPC HANDLERS ============

// === THEME ICON MANAGEMENT (v2.2.0) ===
const THEME_ICONS = {
  dark: 'dark.png',
  light: 'light.png',
  minimal: 'minimal.png',
  morphismus: 'morphismus.png',
  glas: 'glas.png',
  retro: 'retro.png',
  foundations: 'foundations.png',
  nerd: 'dark.png',
  colorful: 'dark.png',
  indie: 'dark.png'
};

// v2.3.0: Fixed icon path resolution for packaged apps
function getIconPathForTheme(themeName) {
  const iconFile = THEME_ICONS[themeName] || THEME_ICONS['dark'];
  
  if (app.isPackaged) {
    // In packaged app, icons are in resources/build/icons/themes/
    const resourcePath = path.join(process.resourcesPath, 'app.asar', 'build', 'icons', 'themes', iconFile);
    if (fs.existsSync(resourcePath)) {
      return resourcePath;
    }
    // Fallback: try without asar
    const fallbackPath = path.join(process.resourcesPath, 'build', 'icons', 'themes', iconFile);
    if (fs.existsSync(fallbackPath)) {
      return fallbackPath;
    }
    // Last fallback: try __dirname (unpacked)
    return path.join(__dirname, 'build', 'icons', 'themes', iconFile);
  } else {
    // Development mode
    return path.join(__dirname, 'public', 'icons', 'themes', iconFile);
  }
}

function updateWindowIcon(themeName) {
  if (!mainWindow) return false;
  
  const iconPath = getIconPathForTheme(themeName);
  
  if (fs.existsSync(iconPath)) {
    try {
      mainWindow.setIcon(iconPath);
      console.log(`[Theme] Icon updated to: ${themeName}`);
      return true;
    } catch (error) {
      console.error(`[Theme] Failed to set icon: ${error.message}`);
      return false;
    }
  } else {
    console.warn(`[Theme] Icon not found: ${iconPath}`);
    return false;
  }
}

ipcMain.handle('theme:setIcon', async (event, themeName) => {
  const success = updateWindowIcon(themeName);
  return { success, theme: themeName };
});

ipcMain.handle('theme:getAvailableIcons', async () => {
  return Object.keys(THEME_ICONS);
});

// === APP INFO ===
ipcMain.handle('app:getVersion', () => APP_VERSION);

ipcMain.handle('app:openDevTools', () => {
  if (mainWindow) mainWindow.webContents.openDevTools();
});

ipcMain.handle('app:getSettings', () => {
  return store.get('appSettings', {
    autoCheckUpdates: true,
    notificationsEnabled: true,
    notificationSound: true,
    downloadPath: app.getPath('downloads')
  });
});

ipcMain.handle('app:saveSettings', async (event, settings) => {
  store.set('appSettings', settings);
  return { success: true };
});

// === UPDATE ===
ipcMain.handle('update:check', async () => {
  return await checkForUpdates(false);
});

ipcMain.handle('update:download', async (event, downloadUrl) => {
  try {
    const result = await downloadUpdate(downloadUrl);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update:install', async (event, filePath) => {
  try {
    // Verify file exists
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'Update-Datei nicht gefunden' };
    }

    const stats = fs.statSync(filePath);
    if (stats.size < 1024 * 1024) { // AppImage must be at least 1 MB
      return { success: false, error: `Update-Datei zu klein (${stats.size} Bytes) – kein gültiges AppImage` };
    }

    // Validate ELF magic bytes: AppImage starts with 0x7f 'E' 'L' 'F'
    const fd = fs.openSync(filePath, 'r');
    const magic = Buffer.alloc(4);
    fs.readSync(fd, magic, 0, 4, 0);
    fs.closeSync(fd);
    if (magic[0] !== 0x7f || magic[1] !== 0x45 || magic[2] !== 0x4c || magic[3] !== 0x46) {
      return { success: false, error: 'Heruntergeladene Datei ist kein gültiges AppImage (falsche Magic Bytes) – bitte manuell von GitHub herunterladen' };
    }

    // Determine install target: prefer APPIMAGE env var, fall back to install.sh location
    const installTarget = process.env.APPIMAGE || path.join(process.env.HOME, '.local', 'bin', 'coremail-desktop');

    // Backup current AppImage before replacing
    if (fs.existsSync(installTarget)) {
      try {
        const backupDir = path.join(app.getPath('userData'), 'backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        const backupPath = path.join(backupDir, `CoreMail-Desktop-backup-${APP_VERSION}.AppImage`);
        fs.copyFileSync(installTarget, backupPath);
        console.log('Backup created:', backupPath);
        // Keep only last 3 backups
        const backups = fs.readdirSync(backupDir)
          .filter(f => f.startsWith('CoreMail-Desktop-backup-'))
          .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
          .sort((a, b) => b.time - a.time);
        if (backups.length > 3) {
          backups.slice(3).forEach(b => { try { fs.unlinkSync(path.join(backupDir, b.name)); } catch(e) {} });
        }
      } catch (backupError) {
        console.error('Backup error (non-fatal):', backupError.message);
      }
    }

    // Replace via temp file + rename to avoid ETXTBSY (cannot overwrite running executable on Linux)
    const tmpTarget = installTarget + '.new';
    try {
      fs.copyFileSync(filePath, tmpTarget);
      fs.chmodSync(tmpTarget, 0o755);
      if (fs.existsSync(installTarget)) fs.unlinkSync(installTarget); // unlink frees the inode; running process keeps its fd
      fs.renameSync(tmpTarget, installTarget);
      console.log('AppImage successfully replaced at:', installTarget);
    } catch (replaceError) {
      // Clean up temp file if something went wrong
      try { fs.unlinkSync(tmpTarget); } catch(e) {}
      return { success: false, error: 'Konnte AppImage nicht ersetzen: ' + replaceError.message };
    }

    // Launch the newly installed AppImage
    console.log('Launching new version from:', installTarget);
    const child = spawn(installTarget, [], {
      detached: true,
      stdio: 'ignore',
      env: { ...process.env, APPIMAGE_EXTRACT_AND_RUN: '0' }
    });
    child.unref();
    child.on('error', (err) => {
      console.error('Failed to launch new version:', err);
      shell.openPath(installTarget);
    });

    // Quit current instance after new one has time to start
    setTimeout(() => {
      app.quit();
    }, 1500);
    
    return { success: true };
  } catch (error) {
    console.error('Update install error:', error);
    return { success: false, error: error.message };
  }
});

// v1.16.0: Get SHA256 hash of a file
ipcMain.handle('update:verifyFile', async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'Datei nicht gefunden' };
    }
    
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    return new Promise((resolve) => {
      stream.on('data', data => hash.update(data));
      stream.on('end', () => {
        resolve({ success: true, sha256: hash.digest('hex') });
      });
      stream.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// v1.16.0: Get list of backups
ipcMain.handle('update:getBackups', async () => {
  try {
    const backupDir = path.join(app.getPath('userData'), 'backups');
    if (!fs.existsSync(backupDir)) {
      return { success: true, backups: [] };
    }
    
    const backups = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('CoreMail-Desktop-backup-'))
      .map(f => {
        const filePath = path.join(backupDir, f);
        const stats = fs.statSync(filePath);
        const version = f.match(/backup-(.+)\.AppImage/)?.[1] || 'unknown';
        return {
          name: f,
          path: filePath,
          version,
          size: stats.size,
          date: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return { success: true, backups };
  } catch (error) {
    return { success: false, error: error.message, backups: [] };
  }
});

// v1.16.0: Restore from backup
ipcMain.handle('update:restoreBackup', async (event, backupPath) => {
  try {
    if (!fs.existsSync(backupPath)) {
      return { success: false, error: 'Backup nicht gefunden' };
    }
    
    fs.chmodSync(backupPath, 0o755);
    
    const child = spawn(backupPath, [], {
      detached: true,
      stdio: 'ignore',
      env: { ...process.env, APPIMAGE_EXTRACT_AND_RUN: '0' }
    });
    
    child.unref();
    
    setTimeout(() => {
      app.quit();
    }, 1500);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update:openDownloads', () => {
  shell.openPath(app.getPath('downloads'));
});

// === NOTIFICATIONS ===
ipcMain.handle('notification:show', async (event, { title, body }) => {
  const settings = store.get('appSettings', {});
  if (settings.notificationsEnabled === false) {
    return { success: false, reason: 'disabled' };
  }
  
  showNotification(title, body, () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  return { success: true };
});

ipcMain.handle('notification:setBadge', async (event, count) => {
  updateBadgeCount(count);
  return { success: true };
});

// === OLLAMA INSTALLATION (v1.6.0) ===
ipcMain.handle('ollama:checkInstalled', async () => {
  const installed = isOllamaInstalled();
  const running = await isOllamaRunning();
  return { installed, running };
});

ipcMain.handle('ollama:install', async (event) => {
  const progressCallback = (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('ollama:progress', data);
    }
  };

  try {
    // Step 1: Install Ollama
    await installOllama(progressCallback);
    
    // Step 2: Start Ollama service
    await startOllamaService(progressCallback);
    
    // Step 3: Download default model
    await downloadOllamaModel('llama3.2:1b', progressCallback);
    
    progressCallback({ step: 'complete', message: 'Ollama ist bereit!' });
    return { success: true };
  } catch (error) {
    progressCallback({ step: 'error', message: error.message });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ollama:startService', async (event) => {
  const progressCallback = (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('ollama:progress', data);
    }
  };

  try {
    await startOllamaService(progressCallback);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ollama:downloadModel', async (event, modelName) => {
  const progressCallback = (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('ollama:progress', data);
    }
  };

  try {
    await downloadOllamaModel(modelName, progressCallback);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// === SPAM FILTER (v1.14.0) ===
ipcMain.handle('spamfilter:saveSettings', async (event, settings) => {
  store.set('spamFilterSettings', settings);
  return { success: true };
});

ipcMain.handle('spamfilter:loadSettings', async () => {
  return {
    success: true,
    settings: store.get('spamFilterSettings', {
      enabled: true,
      sensitivity: 'medium',
      whitelist: [],
      blacklist: [],
      autoMoveToSpam: false,
      showTags: true
    })
  };
});

ipcMain.handle('spamfilter:saveAnalysis', async (event, accountId, analysisData) => {
  const key = `spamAnalysis:${accountId}`;
  store.set(key, analysisData);
  return { success: true };
});

ipcMain.handle('spamfilter:loadAnalysis', async (event, accountId) => {
  const key = `spamAnalysis:${accountId}`;
  return {
    success: true,
    analysis: store.get(key, {})
  };
});

// === SIGNATURES ===
ipcMain.handle('signatures:save', async (event, signatures) => {
  store.set('signatures', signatures);
  return { success: true };
});

ipcMain.handle('signatures:load', async () => {
  return {
    success: true,
    signatures: store.get('signatures', {})
  };
});

// === ATTACHMENT DOWNLOAD ===
ipcMain.handle('attachment:saveAll', async (event, attachments) => {
  const settings = store.get('appSettings', {});
  const downloadPath = settings.downloadPath || app.getPath('downloads');
  
  const results = [];
  for (const att of attachments) {
    try {
      const filePath = path.join(downloadPath, att.filename);
      const buffer = Buffer.from(att.content, 'base64');
      fs.writeFileSync(filePath, buffer);
      results.push({ filename: att.filename, success: true, path: filePath });
    } catch (error) {
      results.push({ filename: att.filename, success: false, error: error.message });
    }
  }
  return { success: true, results };
});

ipcMain.handle('attachment:openFile', async (event, filePath) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('attachment:selectDownloadFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Download-Ordner auswählen'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return { success: true, path: result.filePaths[0] };
  }
  return { success: false, canceled: true };
});

// === ACCOUNTS & CATEGORIES ===

ipcMain.handle('accounts:save', async (event, data) => {
  try {
    // v2.9.0: Migrate Microsoft token cache from tempId to real account id
    const prevAccounts = store.get('accounts', []);
    const prevIds = new Set(prevAccounts.map(a => a.id));

    for (const acc of (data.accounts || [])) {
      if (acc.type === 'microsoft' && acc.microsoft?.tempId && !prevIds.has(acc.id)) {
        // New Microsoft account – move token cache from tempId key to real account id key
        const tempKey = `msalCache_${acc.microsoft.tempId}`;
        const realKey = `msalCache_${acc.id}`;
        const cached = store.get(tempKey);
        if (cached) {
          store.set(realKey, cached);
          store.delete(tempKey);
        }
        // Remove tempId from stored account (no longer needed)
        delete acc.microsoft.tempId;
      }
    }

    store.set('accounts', data.accounts);
    store.set('categories', data.categories);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('accounts:load', async () => {
  try {
    return {
      success: true,
      accounts: store.get('accounts', []),
      categories: store.get('categories', [
        { id: 'work', name: 'Arbeit', color: '#3b82f6' },
        { id: 'personal', name: 'Privat', color: '#22c55e' },
        { id: 'other', name: 'Sonstiges', color: '#8b5cf6' }
      ])
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// === LEGACY SETTINGS (for backward compatibility) ===

ipcMain.handle('settings:save', async (event, settings) => {
  try {
    store.set('imapSettings', settings.imap);
    store.set('smtpSettings', settings.smtp);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('settings:load', async () => {
  try {
    return {
      success: true,
      data: {
        imap: store.get('imapSettings', {}),
        smtp: store.get('smtpSettings', {})
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// === IMAP OPERATIONS ===

ipcMain.handle('imap:test', async (event, settings) => {
  try {
    const config = {
      imap: {
        user: settings.username,
        password: settings.password,
        host: settings.host,
        port: parseInt(settings.port),
        tls: settings.tls !== false,
        authTimeout: 10000
      }
    };
    
    const connection = await imapSimple.connect(config);
    await connection.end();
    return { success: true, message: 'Verbindung erfolgreich!' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Fetch emails for specific account (v1.10.0: OAuth2 support)
// v2.3.1: Fixed IMAP fetch to load ALL emails (no limit by default)
ipcMain.handle('imap:fetchEmailsForAccount', async (event, accountId, options = {}) => {
  const account = getAccountById(accountId);
  
  if (!account) {
    return { success: false, error: 'Konto nicht gefunden' };
  }

  // v2.3.1: Changed default limit from 50 to 0 (0 = no limit, fetch all emails)
  const { folder = 'INBOX', limit = 0, offset = 0 } = options;

  let connection;
  try {
    const config = getImapConfigForAccount(account);
    connection = await imapSimple.connect(config);
    await connection.openBox(folder);

    const searchCriteria = ['ALL'];
    // v2.8.3: Header-only fetch for fast listing (full body only when viewing email)
    const fetchOptions = {
      bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
      markSeen: false,
      struct: true
    };

    const messages = await connection.search(searchCriteria, fetchOptions);

    // Sort newest first (by UID descending — higher UID = newer)
    messages.sort((a, b) => b.attributes.uid - a.attributes.uid);

    const allMessages = messages;
    const messagesToProcess = limit > 0 ? allMessages.slice(offset, offset + limit) : allMessages.slice(offset);

    // Track unread count for notifications
    let unreadCount = 0;
    const previousUnread = store.get(`unreadCount_${accountId}`, 0);

    const emails = messagesToProcess.map(msg => {
      const header = msg.parts.find(p => p.which.includes('HEADER'));
      const h = header?.body || {};
      const isUnread = !msg.attributes.flags.includes('\\Seen');
      if (isUnread) unreadCount++;

      const fromRaw = (h.from || ['Unbekannt'])[0];
      const fromMatch = fromRaw.match(/^(.*?)\s*<(.+?)>$/);
      const fromName = fromMatch
        ? fromMatch[1].replace(/^["']+|["']+$/g, '').trim() || fromMatch[2]
        : fromRaw.split('@')[0].trim();

      return {
        uid: msg.attributes.uid,
        subject: (h.subject || ['(Kein Betreff)'])[0],
        from: fromRaw,
        fromName,
        to: (h.to || [''])[0],
        date: msg.attributes.date || (h.date ? new Date(h.date[0]) : new Date()),
        seen: !isUnread,
        hasAttachments: Array.isArray(msg.attributes.struct) &&
          msg.attributes.struct.some(p => p.disposition?.type?.toLowerCase() === 'attachment'),
        preview: ''
      };
    });

    // Check for new unread emails and notify
    const settings = store.get('appSettings', {});
    if (settings.notificationsEnabled !== false && unreadCount > previousUnread) {
      const newCount = unreadCount - previousUnread;
      const newEmails = emails.filter(e => !e.seen).slice(0, newCount);
      const focusApp = () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } };

      if (newCount > 5) {
        // Gebündelte Benachrichtigung
        showNotification(
          `${newCount} neue E-Mails`,
          newEmails.slice(0, 3).map(e => `• ${e.fromName}: ${e.subject}`).join('\n') +
            (newCount > 3 ? `\n• … und ${newCount - 3} weitere` : ''),
          focusApp
        );
      } else {
        // Einzelne Benachrichtigung pro Mail
        for (const email of newEmails) {
          showNotification(
            `Neue E-Mail von ${email.fromName}`,
            email.subject,
            () => {
              focusApp();
              mainWindow.webContents.send('email:open', { accountId, uid: email.uid });
            }
          );
        }
      }
    }

    store.set(`unreadCount_${accountId}`, unreadCount);

    return {
      success: true,
      emails,
      unreadCount,
      total: allMessages.length,
      hasMore: limit > 0 ? (offset + limit < allMessages.length) : false
    };
  } catch (error) {
    console.error('IMAP Fehler:', error);
    return { success: false, error: error.message };
  } finally {
    if (connection) try { await connection.end(); } catch (_) {}
  }
});

// Fetch single email for specific account
// v1.10.0: OAuth2 support for single email fetch
ipcMain.handle('imap:fetchEmailForAccount', async (event, accountId, uid, folder = 'INBOX') => {
  const account = getAccountById(accountId);
  if (!account) return { success: false, error: 'Konto nicht gefunden' };

  let connection;
  try {
    const config = getImapConfigForAccount(account);
    connection = await imapSimple.connect(config);
    await connection.openBox(folder);

    const messages = await connection.search([['UID', uid]], { bodies: [''], markSeen: true, struct: true });
    if (messages.length === 0) return { success: false, error: 'E-Mail nicht gefunden' };

    const all = messages[0].parts.find(p => p.which === '');
    const parsed = await simpleParser(all.body);

    return {
      success: true,
      email: {
        uid,
        subject: parsed.subject || '(Kein Betreff)',
        from: parsed.from?.text || 'Unbekannt',
        to: parsed.to?.text || '',
        cc: parsed.cc?.text || '',
        date: parsed.date || new Date(),
        html: parsed.html || null,
        text: parsed.text || '',
        attachments: parsed.attachments.map(att => ({
          filename: att.filename,
          contentType: att.contentType,
          size: att.size,
          content: att.content.toString('base64')
        }))
      }
    };
  } catch (error) {
    console.error('IMAP Fehler:', error);
    return { success: false, error: error.message };
  } finally {
    if (connection) try { await connection.end(); } catch (_) {}
  }
});

// Legacy fetch emails (for backward compatibility)
// Perf: header-only fetch, limit defaults to 100 most recent
ipcMain.handle('imap:fetchEmails', async (event, { folder = 'INBOX', limit = 100 }) => {
  const imapSettings = store.get('imapSettings');
  if (!imapSettings) return { success: false, error: 'Keine IMAP-Einstellungen konfiguriert' };

  let connection;
  try {
    const config = {
      imap: {
        user: imapSettings.username,
        password: imapSettings.password,
        host: imapSettings.host,
        port: parseInt(imapSettings.port),
        tls: imapSettings.tls !== false,
        authTimeout: 15000
      }
    };
    connection = await imapSimple.connect(config);
    await connection.openBox(folder);

    const searchCriteria = ['ALL'];
    // Perf: header-only — no body/text loaded during listing
    const fetchOptions = {
      bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
      markSeen: false,
      struct: true
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    messages.sort((a, b) => b.attributes.uid - a.attributes.uid);

    const messagesToProcess = limit > 0 ? messages.slice(0, limit) : messages;

    const emails = messagesToProcess.map(message => {
      try {
        const header = message.parts.find(p => p.which.includes('HEADER'));
        const h = header?.body || {};
        const fromRaw = (h.from || ['Unbekannt'])[0];
        const fromMatch = fromRaw.match(/^(.*?)\s*<(.+?)>$/);
        const fromName = fromMatch
          ? fromMatch[1].replace(/^["']+|["']+$/g, '').trim() || fromMatch[2]
          : fromRaw.split('@')[0].trim();
        return {
          uid: message.attributes.uid,
          subject: (h.subject || ['(Kein Betreff)'])[0],
          from: fromName,
          fromEmail: fromMatch ? fromMatch[2] : fromRaw,
          to: (h.to || [''])[0],
          date: h.date ? new Date(h.date[0]) : new Date(),
          seen: message.attributes.flags.includes('\\Seen'),
          hasAttachments: (message.attributes.struct || []).some(
            p => p.disposition?.type?.toLowerCase() === 'attachment'
          ),
          preview: ''
        };
      } catch (e) {
        console.error('Fehler beim Parsen einer E-Mail:', e);
        return null;
      }
    }).filter(Boolean);

    return { success: true, emails, hasMore: messages.length > limit };
  } catch (error) {
    console.error('IMAP Fehler:', error);
    return { success: false, error: error.message };
  } finally {
    if (connection) try { await connection.end(); } catch (_) {}
  }
});

ipcMain.handle('imap:fetchEmail', async (event, uid) => {
  const imapSettings = store.get('imapSettings');
  if (!imapSettings) return { success: false, error: 'Keine IMAP-Einstellungen konfiguriert' };

  let connection;
  try {
    const config = {
      imap: {
        user: imapSettings.username,
        password: imapSettings.password,
        host: imapSettings.host,
        port: parseInt(imapSettings.port),
        tls: imapSettings.tls !== false,
        authTimeout: 15000
      }
    };
    connection = await imapSimple.connect(config);
    await connection.openBox('INBOX');

    const messages = await connection.search([['UID', uid]], { bodies: [''], markSeen: true, struct: true });
    if (messages.length === 0) return { success: false, error: 'E-Mail nicht gefunden' };

    const all = messages[0].parts.find(p => p.which === '');
    const parsed = await simpleParser(all.body);

    return {
      success: true,
      email: {
        uid,
        subject: parsed.subject || '(Kein Betreff)',
        from: parsed.from?.text || 'Unbekannt',
        to: parsed.to?.text || '',
        cc: parsed.cc?.text || '',
        date: parsed.date || new Date(),
        html: parsed.html || null,
        text: parsed.text || '',
        attachments: parsed.attachments.map(att => ({
          filename: att.filename,
          contentType: att.contentType,
          size: att.size,
          content: att.content.toString('base64')
        }))
      }
    };
  } catch (error) {
    console.error('IMAP Fehler:', error);
    return { success: false, error: error.message };
  } finally {
    if (connection) try { await connection.end(); } catch (_) {}
  }
});

// === SMTP OPERATIONS ===

ipcMain.handle('smtp:send', async (event, emailData) => {
  const smtpSettings = store.get('smtpSettings');
  
  if (!smtpSettings) {
    return { success: false, error: 'Keine SMTP-Einstellungen konfiguriert' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port: parseInt(smtpSettings.port),
      secure: smtpSettings.secure !== false,
      auth: {
        user: smtpSettings.username,
        pass: smtpSettings.password
      }
    });

    const mailOptions = {
      from: smtpSettings.fromEmail || smtpSettings.username,
      to: emailData.to,
      cc: emailData.cc || undefined,
      bcc: emailData.bcc || undefined,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
      attachments: emailData.attachments || []
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'E-Mail erfolgreich gesendet!' };
  } catch (error) {
    console.error('SMTP Fehler:', error);
    return { success: false, error: error.message };
  }
});

// Send email for specific account
// v1.10.0: OAuth2 support for SMTP
ipcMain.handle('smtp:sendForAccount', async (event, accountId, emailData) => {
  const account = getAccountById(accountId);
  
  if (!account) {
    return { success: false, error: 'Konto nicht gefunden' };
  }

  // Get signature if enabled
  const signatures = store.get('signatures', {});
  let finalHtml = emailData.html || `<p>${(emailData.text || '').replace(/\n/g, '</p><p>')}</p>`;
  let finalText = emailData.text || '';
  
  if (emailData.useSignature !== false && signatures[accountId]) {
    const sig = signatures[accountId];
    if (sig.enabled && sig.html) {
      finalHtml += `<br><br>${sig.html}`;
      finalText += `\n\n${sig.text || ''}`;
    }
  }

  try {
    // v1.10.0: Use OAuth2-aware SMTP transporter
    const { transporter, fromEmail: defaultFrom } = getSmtpTransporterForAccount(account);

    // v2.8.2: Allow per-email sender name override
    let fromEmail = defaultFrom;
    if (emailData.fromName !== undefined) {
      const emailAddr = account.smtp.fromEmail || account.smtp.username;
      const safeName = (emailData.fromName || '').replace(/["\\\r\n]/g, '').trim();
      fromEmail = safeName ? `"${safeName}" <${emailAddr}>` : emailAddr;
    }

    const mailOptions = {
      from: fromEmail,
      to: emailData.to,
      cc: emailData.cc || undefined,
      bcc: emailData.bcc || undefined,
      subject: emailData.subject,
      text: finalText,
      html: finalHtml,
      attachments: emailData.attachments || []
    };

    await transporter.sendMail(mailOptions);

    // v2.8.4: Append sent email to IMAP Sent folder
    try {
      const streamTransport = nodemailer.createTransport({ streamTransport: true, newline: 'unix' });
      const info = await streamTransport.sendMail(mailOptions);
      const chunks = [];
      await new Promise((resolve, reject) => {
        info.message.on('data', c => chunks.push(c));
        info.message.on('end', resolve);
        info.message.on('error', reject);
      });
      const rawMessage = Buffer.concat(chunks);

      const imapConfig = getImapConfigForAccount(account);
      const imapConn = await imapSimple.connect(imapConfig);
      const sentFolder = await findSentFolderName(imapConn);
      if (sentFolder) {
        await new Promise((resolve, reject) => {
          imapConn.imap.append(rawMessage, { mailbox: sentFolder, flags: ['\\Seen'], date: new Date() },
            err => err ? reject(err) : resolve());
        });
      }
      imapConn.end();
    } catch (appendErr) {
      console.error('[Sent] Failed to save to Sent folder:', appendErr);
    }

    return { success: true, message: 'E-Mail erfolgreich gesendet!' };
  } catch (error) {
    console.error('SMTP Fehler:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('smtp:test', async (event, settings) => {
  try {
    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: parseInt(settings.port),
      secure: settings.secure !== false,
      auth: {
        user: settings.username,
        pass: settings.password
      }
    });

    await transporter.verify();
    return { success: true, message: 'SMTP-Verbindung erfolgreich!' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ============ NEW v1.8.0 IMAP OPERATIONS ============

// Delete email
// v1.10.0: OAuth2 support for delete
ipcMain.handle('imap:deleteEmail', async (event, accountId, uid, folder = 'INBOX') => {
  const account = getAccountById(accountId);
  
  if (!account) {
    return { success: false, error: 'Konto nicht gefunden' };
  }

  try {
    const config = getImapConfigForAccount(account);

    const connection = await imapSimple.connect(config);
    await connection.openBox(folder);
    
    // Add \Deleted flag and expunge
    await connection.addFlags(uid, ['\\Deleted'], { uid: true });
    await connection.imap.expunge();
    
    await connection.end();
    return { success: true, message: 'E-Mail gelöscht' };
  } catch (error) {
    console.error('IMAP Delete Fehler:', error);
    return { success: false, error: error.message };
  }
});

// Mark email as read/unread
// v1.10.0: OAuth2 support
ipcMain.handle('imap:markAsRead', async (event, accountId, uid, isRead = true, folder = 'INBOX') => {
  const account = getAccountById(accountId);
  
  if (!account) {
    return { success: false, error: 'Konto nicht gefunden' };
  }

  try {
    const config = getImapConfigForAccount(account);

    const connection = await imapSimple.connect(config);
    await connection.openBox(folder);
    
    if (isRead) {
      await connection.addFlags(uid, ['\\Seen'], { uid: true });
    } else {
      await connection.delFlags(uid, ['\\Seen'], { uid: true });
    }
    
    await connection.end();
    return { success: true, message: isRead ? 'Als gelesen markiert' : 'Als ungelesen markiert' };
  } catch (error) {
    console.error('IMAP Mark Fehler:', error);
    return { success: false, error: error.message };
  }
});

// Move email to folder
// v1.10.0: OAuth2 support
ipcMain.handle('imap:moveEmail', async (event, accountId, uid, sourceFolder, destFolder) => {
  const account = getAccountById(accountId);
  
  if (!account) {
    return { success: false, error: 'Konto nicht gefunden' };
  }

  try {
    const config = getImapConfigForAccount(account);

    const connection = await imapSimple.connect(config);
    await connection.openBox(sourceFolder);
    
    // Copy to destination folder
    await connection.imap.copy(uid, destFolder, { uid: true });
    
    // Delete from source folder
    await connection.addFlags(uid, ['\\Deleted'], { uid: true });
    await connection.imap.expunge();
    
    await connection.end();
    return { success: true, message: 'E-Mail verschoben' };
  } catch (error) {
    console.error('IMAP Move Fehler:', error);
    return { success: false, error: error.message };
  }
});

// List folders for account
// v1.10.0: OAuth2 support
ipcMain.handle('imap:listFolders', async (event, accountId) => {
  const account = getAccountById(accountId);
  if (!account) return { success: false, error: 'Konto nicht gefunden' };

  let connection;
  try {
    const config = getImapConfigForAccount(account);
    connection = await imapSimple.connect(config);
    const boxes = await connection.getBoxes();

    const parseFolders = (boxMap, prefix = '') => {
      const folders = [];
      for (const name in boxMap) {
        const box = boxMap[name];
        const sep = box.delimiter || '/';
        const fullPath = prefix ? `${prefix}${sep}${name}` : name;
        const nameLower = name.toLowerCase();
        let type = 'folder';
        if (nameLower === 'inbox') type = 'inbox';
        else if (nameLower.includes('sent') || nameLower.includes('gesendet') || nameLower.includes('sent items')) type = 'sent';
        else if (nameLower.includes('draft') || nameLower.includes('entwu')) type = 'drafts';
        else if (nameLower.includes('trash') || nameLower.includes('papierkorb') || nameLower.includes('deleted') || nameLower.includes('gelöscht')) type = 'trash';
        else if (nameLower.includes('spam') || nameLower.includes('junk')) type = 'spam';
        else if (nameLower.includes('archive') || nameLower.includes('archiv')) type = 'archive';
        folders.push({
          name,
          path: fullPath,
          type,
          delimiter: sep,
          children: box.children ? parseFolders(box.children, fullPath) : []
        });
      }
      return folders;
    };

    const folders = parseFolders(boxes);
    return { success: true, folders };
  } catch (error) {
    console.error('IMAP Folders Fehler:', error);
    return { success: false, error: error.message };
  } finally {
    if (connection) try { connection.end(); } catch (_) {}
  }
});

// Fetch emails from specific folder
// v1.10.0: OAuth2 support
// v2.3.1: Fixed to load ALL emails by default (limit = 0 means no limit)
ipcMain.handle('imap:fetchEmailsFromFolder', async (event, accountId, folder, options = {}) => {
  const account = getAccountById(accountId);
  
  if (!account) {
    return { success: false, error: 'Konto nicht gefunden' };
  }

  // v2.3.1: Changed default limit from 50 to 0 (0 = no limit, fetch all emails)
  const { limit = 0, offset = 0 } = options;

  try {
    const config = getImapConfigForAccount(account);

    const connection = await imapSimple.connect(config);
    
    try {
      await connection.openBox(folder);
    } catch (err) {
      await connection.end();
      return { success: false, error: `Ordner "${folder}" konnte nicht geöffnet werden` };
    }

    const searchCriteria = ['ALL'];
    const fetchOptions = {
      bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
      markSeen: false,
      struct: true
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    
    // Sort by date descending and apply pagination
    messages.sort((a, b) => {
      const dateA = new Date(a.attributes?.date || 0);
      const dateB = new Date(b.attributes?.date || 0);
      return dateB - dateA;
    });

    // v2.3.1: If limit is 0, return all messages; otherwise apply pagination
    const paginatedMessages = limit > 0 ? messages.slice(offset, offset + limit) : messages.slice(offset);
    
    const emails = paginatedMessages.map(msg => {
      const header = msg.parts.find(p => p.which.includes('HEADER'));
      const headerLines = header?.body || {};
      
      return {
        uid: msg.attributes.uid,
        subject: (headerLines.subject || ['(Kein Betreff)'])[0],
        from: (headerLines.from || ['Unbekannt'])[0],
        to: (headerLines.to || [''])[0],
        date: msg.attributes.date || (headerLines.date || [new Date()])[0],
        seen: msg.attributes.flags?.includes('\\Seen') || false,
        hasAttachment: !!msg.attributes.struct?.find(p => p.disposition?.type === 'attachment'),
        preview: ''
      };
    });

    await connection.end();
    
    return { 
      success: true, 
      emails,
      folder,
      total: messages.length,
      // v2.3.1: hasMore is always false if limit is 0 (all loaded)
      hasMore: limit > 0 ? (offset + limit < messages.length) : false
    };
  } catch (error) {
    console.error('IMAP Fetch Folder Fehler:', error);
    return { success: false, error: error.message };
  }
});



// ============ GLOBAL SEARCH (v1.13.0) ============
// Search emails across all accounts and folders with advanced filters

ipcMain.handle('search:globalSearch', async (event, searchParams) => {
  const {
    query,
    accountIds = [], // Empty = all accounts
    folders = [],    // Empty = all folders
    filters = {}     // Advanced filters
  } = searchParams;

  if (!query || query.trim().length < 2) {
    return { success: false, error: 'Suchbegriff muss mindestens 2 Zeichen haben' };
  }

  const accounts = store.get('accounts', []);
  const searchableAccounts = accountIds.length > 0 
    ? accounts.filter(a => accountIds.includes(a.id))
    : accounts;

  if (searchableAccounts.length === 0) {
    return { success: false, error: 'Keine Konten zum Durchsuchen gefunden' };
  }

  const searchTerm = query.toLowerCase().trim();

  // Perf: search all accounts in parallel (one IMAP connection per account)
  const accountResults = await Promise.all(searchableAccounts.map(async (account) => {
    const accountEmails = [];
    try {
      const config = getImapConfigForAccount(account);
      const connection = await imapSimple.connect(config);

      let foldersToSearch = folders.length > 0 ? folders : ['INBOX'];
      if (folders.length === 0 || folders.includes('*')) {
        try {
          const boxes = await connection.getBoxes();
          foldersToSearch = extractFolderPaths(boxes);
        } catch (e) {
          foldersToSearch = ['INBOX'];
        }
      }

      for (const folder of foldersToSearch) {
        try {
          await connection.openBox(folder);
          const searchCriteria = buildSearchCriteria(searchTerm, filters);
          const fetchOptions = {
            bodies: ['HEADER', 'TEXT', ''],
            markSeen: false,
            struct: true
          };
          const messages = await connection.search(searchCriteria, fetchOptions);

          // Perf: parse matching messages in parallel (limit 100 per folder)
          const parsed = await Promise.all(
            messages.slice(-100).map(async (message) => {
              try {
                const all = message.parts.find(p => p.which === '');
                return { message, parsed: await simpleParser(all.body) };
              } catch (e) {
                return null;
              }
            })
          );

          for (const entry of parsed) {
            if (!entry) continue;
            const { message, parsed: p } = entry;
            if (matchesFilters(p, message, filters, searchTerm)) {
              const isUnread = !message.attributes.flags.includes('\\Seen');
              accountEmails.push({
                uid: message.attributes.uid,
                accountId: account.id,
                accountName: account.name,
                folder,
                subject: p.subject || '(Kein Betreff)',
                from: p.from?.text || 'Unbekannt',
                fromName: p.from?.value?.[0]?.name || p.from?.text?.split('<')[0]?.trim() || 'Unbekannt',
                fromEmail: p.from?.value?.[0]?.address || '',
                to: p.to?.text || '',
                date: p.date || new Date(),
                seen: !isUnread,
                flagged: message.attributes.flags.includes('\\Flagged'),
                hasAttachments: p.attachments && p.attachments.length > 0,
                preview: p.text ? p.text.substring(0, 200).replace(/\n/g, ' ') + '...' : '',
                matchedIn: getMatchedFields(p, searchTerm)
              });
            }
          }
        } catch (folderErr) {
          console.log(`Could not search folder ${folder}:`, folderErr.message);
        }
      }

      await connection.end();
    } catch (accountErr) {
      console.error(`Search error for account ${account.name}:`, accountErr.message);
    }
    return accountEmails;
  }));

  const results = accountResults.flat();
  const errors = [];

  // Sort results by date (newest first)
  results.sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    success: true,
    results: results.slice(0, 200), // Limit total results
    totalFound: results.length,
    errors: errors.length > 0 ? errors : undefined,
    searchedAccounts: searchableAccounts.length,
    query: searchTerm
  };
});

// Helper: Extract all folder paths from IMAP boxes
function extractFolderPaths(boxes, prefix = '') {
  const paths = [];
  for (const [name, box] of Object.entries(boxes)) {
    const fullPath = prefix ? `${prefix}${box.delimiter || '/'}${name}` : name;
    paths.push(fullPath);
    if (box.children) {
      paths.push(...extractFolderPaths(box.children, fullPath));
    }
  }
  return paths;
}

// Helper: Build IMAP search criteria
function buildSearchCriteria(searchTerm, filters) {
  const criteria = [];
  
  // Text search - use OR for multiple fields
  // Note: IMAP search is case-insensitive
  if (searchTerm) {
    criteria.push(['OR', 
      ['OR', 
        ['SUBJECT', searchTerm],
        ['FROM', searchTerm]
      ],
      ['OR',
        ['TO', searchTerm],
        ['BODY', searchTerm]
      ]
    ]);
  }
  
  // Date filters
  if (filters.dateFrom) {
    criteria.push(['SINCE', new Date(filters.dateFrom)]);
  }
  if (filters.dateTo) {
    criteria.push(['BEFORE', new Date(filters.dateTo)]);
  }
  
  // Read/Unread filter
  if (filters.unreadOnly === true) {
    criteria.push('UNSEEN');
  }
  
  // Flagged filter
  if (filters.flaggedOnly === true) {
    criteria.push('FLAGGED');
  }
  
  // Has attachments - Note: Not all IMAP servers support this
  // We'll filter in memory instead
  
  return criteria.length > 0 ? criteria : ['ALL'];
}

// Helper: Check if email matches filters (in-memory filtering)
function matchesFilters(parsed, message, filters, searchTerm) {
  // Check attachments filter
  if (filters.hasAttachments === true) {
    if (!parsed.attachments || parsed.attachments.length === 0) {
      return false;
    }
  }
  
  // Additional text matching for better precision
  const subject = (parsed.subject || '').toLowerCase();
  const from = (parsed.from?.text || '').toLowerCase();
  const to = (parsed.to?.text || '').toLowerCase();
  const body = (parsed.text || '').toLowerCase();
  const html = (parsed.html || '').toLowerCase();
  
  // Must match at least one field
  const matchesText = 
    subject.includes(searchTerm) ||
    from.includes(searchTerm) ||
    to.includes(searchTerm) ||
    body.includes(searchTerm) ||
    html.includes(searchTerm);
  
  return matchesText;
}

// Helper: Get which fields matched the search term
function getMatchedFields(parsed, searchTerm) {
  const matched = [];
  
  if ((parsed.subject || '').toLowerCase().includes(searchTerm)) {
    matched.push('subject');
  }
  if ((parsed.from?.text || '').toLowerCase().includes(searchTerm)) {
    matched.push('from');
  }
  if ((parsed.to?.text || '').toLowerCase().includes(searchTerm)) {
    matched.push('to');
  }
  if ((parsed.text || '').toLowerCase().includes(searchTerm) ||
      (parsed.html || '').toLowerCase().includes(searchTerm)) {
    matched.push('body');
  }
  
  return matched;
}

// Quick search - Search in local cache first (faster)
ipcMain.handle('search:quickSearch', async (event, { query, limit = 20 }) => {
  if (!query || query.trim().length < 2) {
    return { success: true, suggestions: [] };
  }
  
  const searchTerm = query.toLowerCase().trim();
  const cachedEmails = store.get('emailCache', []);
  
  // Search in cached emails
  const suggestions = cachedEmails
    .filter(email => {
      const subject = (email.subject || '').toLowerCase();
      const from = (email.from || '').toLowerCase();
      return subject.includes(searchTerm) || from.includes(searchTerm);
    })
    .slice(0, limit)
    .map(email => ({
      uid: email.uid,
      accountId: email.accountId,
      subject: email.subject,
      from: email.from,
      date: email.date
    }));
  
  return { success: true, suggestions };
});

// Cache emails for quick search
ipcMain.handle('search:updateCache', async (event, { accountId, emails }) => {
  try {
    const cache = store.get('emailCache', []);

    // Remove old entries for this account
    const filtered = cache.filter(e => e.accountId !== accountId);

    // Add new entries
    const newEntries = emails.map(e => ({
      ...e,
      accountId,
      cachedAt: new Date().toISOString()
    }));

    // Keep cache manageable (max 1000 entries)
    const updated = [...newEntries, ...filtered].slice(0, 1000);
    store.set('emailCache', updated);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});


// ============================================================
// MICROSOFT EXCHANGE / MICROSOFT 365 via Graph API (v2.9.0)
// ============================================================

const msalInstances = {}; // clientId → PublicClientApplication

const MS_GRAPH_SCOPES = [
  'https://graph.microsoft.com/Mail.ReadWrite',
  'https://graph.microsoft.com/Mail.Send',
  'https://graph.microsoft.com/User.Read',
  'offline_access'
];

const GRAPH_FOLDER_MAP = {
  'INBOX': 'inbox',
  'Sent': 'sentitems',
  'Drafts': 'drafts',
  'Deleted': 'deleteditems',
  'Trash': 'deleteditems',
  'Junk': 'junkemail',
  'Spam': 'junkemail',
  'Archive': 'archive'
};

function getMsalApp(clientId, tenantId) {
  const instanceKey = tenantId ? `${clientId}_${tenantId}` : clientId;
  if (!msalInstances[instanceKey]) {
    const msal = require('@azure/msal-node');
    const authority = tenantId
      ? `https://login.microsoftonline.com/${tenantId}`
      : 'https://login.microsoftonline.com/common';
    msalInstances[instanceKey] = new msal.PublicClientApplication({
      auth: { clientId, authority },
      system: {
        loggerOptions: {
          loggerCallback: () => {},
          piiLoggingEnabled: false,
          logLevel: 3
        }
      }
    });
  }
  return msalInstances[instanceKey];
}

async function getGraphAccessToken(accountId) {
  const account = getAccountById(accountId);
  if (!account || account.type !== 'microsoft') throw new Error('Kein Microsoft-Konto');

  const clientId = account.microsoft.clientId;
  const tenantId = account.microsoft.tenantId || null;
  const pca = getMsalApp(clientId, tenantId);

  // Restore token cache from store
  const cacheKey = `msalCache_${accountId}`;
  const cachedData = store.get(cacheKey, '');
  if (cachedData) {
    pca.getTokenCache().deserialize(cachedData);
  }

  const msalAccounts = await pca.getTokenCache().getAllAccounts();
  if (msalAccounts.length === 0) {
    throw new Error('TOKEN_EXPIRED');
  }

  const result = await pca.acquireTokenSilent({
    scopes: MS_GRAPH_SCOPES,
    account: msalAccounts[0]
  });

  // Persist refreshed cache
  store.set(cacheKey, pca.getTokenCache().serialize());
  return result.accessToken;
}

async function graphRequest(accountId, method, apiPath, body) {
  const fetch = require('node-fetch');
  const token = await getGraphAccessToken(accountId);

  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const resp = await fetch(`https://graph.microsoft.com/v1.0${apiPath}`, opts);

  if (resp.status === 204) return null; // No content (DELETE/PATCH)
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Graph ${resp.status}: ${errText.slice(0, 200)}`);
  }
  return resp.json();
}

function normalizeGraphEmail(msg) {
  const fromName = msg.from?.emailAddress?.name || '';
  const fromAddr = msg.from?.emailAddress?.address || '';
  return {
    uid: msg.id,
    subject: msg.subject || '(Kein Betreff)',
    from: fromName ? `${fromName} <${fromAddr}>` : fromAddr,
    fromName,
    to: (msg.toRecipients || []).map(r => r.emailAddress?.address).filter(Boolean).join(', '),
    date: msg.receivedDateTime || new Date().toISOString(),
    seen: msg.isRead === true,
    hasAttachments: msg.hasAttachments === true,
    preview: msg.bodyPreview ? msg.bodyPreview.substring(0, 80).trim() : '',
    flags: msg.isRead ? ['\\Seen'] : []
  };
}

// --- IPC: Microsoft OAuth2 Login ---
ipcMain.handle('msauth:startLogin', async (event, { clientId }) => {
  try {
    const msal = require('@azure/msal-node');
    // Fresh instance for login (avoids stale cache issues)
    const pca = new msal.PublicClientApplication({
      auth: {
        clientId,
        authority: 'https://login.microsoftonline.com/common'
      }
    });

    const result = await pca.acquireTokenInteractive({
      scopes: MS_GRAPH_SCOPES,
      openBrowser: async (authUrl) => {
        await shell.openExternal(authUrl);
      },
      successTemplate: '<html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#0d1117;color:#e6edf3"><h2 style="color:#3fb950">✅ Anmeldung erfolgreich!</h2><p>Du kannst dieses Fenster schließen und zu CoreMail zurückkehren.</p></body></html>',
      errorTemplate: '<html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#0d1117;color:#e6edf3"><h2 style="color:#f85149">❌ Anmeldung fehlgeschlagen</h2><p>{error}</p></body></html>'
    });

    // Fetch display name and email via Graph
    const fetch = require('node-fetch');
    const userResp = await fetch('https://graph.microsoft.com/v1.0/me?$select=displayName,mail,userPrincipalName', {
      headers: { 'Authorization': `Bearer ${result.accessToken}` }
    });
    const userInfo = await userResp.json();
    const email = userInfo.mail || userInfo.userPrincipalName || result.account.username || '';
    const displayName = userInfo.displayName || email;

    // Temporary ID used until account is saved; caller replaces with final ID
    const tempId = `ms_${Date.now()}`;
    store.set(`msalCache_${tempId}`, pca.getTokenCache().serialize());

    const tenantId = result.account?.tenantId || result.idTokenClaims?.tid || null;
    return { success: true, email, displayName, tempId, clientId, tenantId };
  } catch (error) {
    console.error('[MSAuth] Login error:', error.message);
    return { success: false, error: error.message };
  }
});

// --- IPC: Re-login (token refresh after expiry) ---
ipcMain.handle('msauth:relogin', async (event, accountId) => {
  try {
    const account = getAccountById(accountId);
    if (!account?.microsoft?.clientId) return { success: false, error: 'Kein Microsoft-Konto' };

    const msal = require('@azure/msal-node');
    const reloginTenantId = account.microsoft.tenantId || null;
    const reloginAuthority = reloginTenantId
      ? `https://login.microsoftonline.com/${reloginTenantId}`
      : 'https://login.microsoftonline.com/common';
    const pca = new msal.PublicClientApplication({
      auth: { clientId: account.microsoft.clientId, authority: reloginAuthority }
    });

    const result = await pca.acquireTokenInteractive({
      scopes: MS_GRAPH_SCOPES,
      openBrowser: async (authUrl) => { await shell.openExternal(authUrl); },
      successTemplate: '<html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#0d1117;color:#e6edf3"><h2 style="color:#3fb950">✅ Erneut angemeldet!</h2><p>Du kannst dieses Fenster schließen.</p></body></html>',
      errorTemplate: '<html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#0d1117;color:#e6edf3"><h2 style="color:#f85149">❌ Fehler</h2><p>{error}</p></body></html>'
    });

    store.set(`msalCache_${accountId}`, pca.getTokenCache().serialize());
    const reloginInstanceKey = reloginTenantId ? `${account.microsoft.clientId}_${reloginTenantId}` : account.microsoft.clientId;
    msalInstances[reloginInstanceKey] = pca; // update cached instance
    return { success: true };
  } catch (error) {
    console.error('[MSAuth] Relogin error:', error.message);
    return { success: false, error: error.message };
  }
});

// --- IPC: Logout (clear tokens) ---
ipcMain.handle('msauth:logout', async (event, accountId) => {
  try {
    const account = getAccountById(accountId);
    if (account?.microsoft?.clientId) delete msalInstances[account.microsoft.clientId];
    store.delete(`msalCache_${accountId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// --- IPC: Graph – Fetch emails from folder ---
ipcMain.handle('graph:fetchEmails', async (event, accountId, { folder = 'INBOX', limit = 50, skip = 0 } = {}) => {
  try {
    const graphFolder = GRAPH_FOLDER_MAP[folder] || folder;
    const select = 'id,subject,from,toRecipients,receivedDateTime,isRead,hasAttachments,bodyPreview';
    const data = await graphRequest(
      accountId, 'GET',
      `/me/mailFolders/${graphFolder}/messages?$top=${limit}&$skip=${skip}&$select=${select}&$orderby=receivedDateTime desc`
    );
    const emails = (data?.value || []).map(normalizeGraphEmail);
    return { success: true, emails, hasMore: !!(data['@odata.nextLink']), total: emails.length };
  } catch (error) {
    console.error('[Graph] fetchEmails:', error.message);
    if (error.message === 'TOKEN_EXPIRED') return { success: false, error: 'TOKEN_EXPIRED', emails: [] };
    return { success: false, error: error.message, emails: [] };
  }
});

// --- IPC: Graph – Fetch single email with body ---
ipcMain.handle('graph:fetchEmail', async (event, accountId, messageId) => {
  try {
    const data = await graphRequest(
      accountId, 'GET',
      `/me/messages/${messageId}?$select=id,subject,from,toRecipients,ccRecipients,bccRecipients,receivedDateTime,isRead,hasAttachments,body&$expand=attachments`
    );
    const email = {
      ...normalizeGraphEmail(data),
      html: data.body?.contentType?.toLowerCase() === 'html' ? data.body.content : null,
      text: data.body?.contentType?.toLowerCase() === 'text' ? data.body.content : null,
      cc: (data.ccRecipients || []).map(r => r.emailAddress?.address).filter(Boolean).join(', '),
      bcc: (data.bccRecipients || []).map(r => r.emailAddress?.address).filter(Boolean).join(', '),
      attachments: (data.attachments || []).map(att => ({
        filename: att.name,
        size: att.size,
        contentType: att.contentType,
        content: att.contentBytes || null, // keep as base64 string for saveAllAttachments
        id: att.id
      }))
    };
    return { success: true, email };
  } catch (error) {
    console.error('[Graph] fetchEmail:', error.message);
    return { success: false, error: error.message };
  }
});

// --- IPC: Graph – Send email ---
ipcMain.handle('graph:sendEmail', async (event, accountId, emailData) => {
  try {
    const parseAddrs = (str) => (str || '').split(/[,;]/).map(s => s.trim()).filter(Boolean)
      .map(addr => ({ emailAddress: { address: addr } }));

    const message = {
      subject: emailData.subject || '(Kein Betreff)',
      body: {
        contentType: emailData.html ? 'html' : 'text',
        content: emailData.html || emailData.text || ''
      },
      toRecipients: parseAddrs(emailData.to),
      ccRecipients: parseAddrs(emailData.cc),
      bccRecipients: parseAddrs(emailData.bcc)
    };

    await graphRequest(accountId, 'POST', '/me/sendMail', { message, saveToSentItems: true });
    return { success: true };
  } catch (error) {
    console.error('[Graph] sendEmail:', error.message);
    return { success: false, error: error.message };
  }
});

// --- IPC: Graph – Delete email ---
ipcMain.handle('graph:deleteEmail', async (event, accountId, messageId) => {
  try {
    await graphRequest(accountId, 'DELETE', `/me/messages/${messageId}`);
    return { success: true };
  } catch (error) {
    console.error('[Graph] deleteEmail:', error.message);
    return { success: false, error: error.message };
  }
});

// --- IPC: Graph – Mark as read/unread ---
ipcMain.handle('graph:markAsRead', async (event, accountId, messageId, isRead) => {
  try {
    await graphRequest(accountId, 'PATCH', `/me/messages/${messageId}`, { isRead });
    return { success: true };
  } catch (error) {
    console.error('[Graph] markAsRead:', error.message);
    return { success: false, error: error.message };
  }
});

// --- IPC: Graph – Move email ---
ipcMain.handle('graph:moveEmail', async (event, accountId, messageId, destinationFolderId) => {
  try {
    const result = await graphRequest(accountId, 'POST', `/me/messages/${messageId}/move`, {
      destinationId: destinationFolderId
    });
    return { success: true, newId: result?.id };
  } catch (error) {
    console.error('[Graph] moveEmail:', error.message);
    return { success: false, error: error.message };
  }
});

// --- IPC: Graph – List mail folders ---
ipcMain.handle('graph:listFolders', async (event, accountId) => {
  try {
    const data = await graphRequest(
      accountId, 'GET',
      '/me/mailFolders?$top=50&$select=id,displayName,unreadItemCount,totalItemCount,wellKnownName'
    );
    const folderOrder = ['inbox', 'sentitems', 'drafts', 'deleteditems', 'junkemail', 'archive'];
    const folders = (data?.value || [])
      .map(f => ({
        id: f.id,
        name: f.displayName,
        path: f.id,
        wellKnown: f.wellKnownName || null,
        unread: f.unreadItemCount || 0,
        total: f.totalItemCount || 0,
        type: f.wellKnownName || 'folder'
      }))
      .sort((a, b) => {
        const ai = folderOrder.indexOf(a.wellKnown);
        const bi = folderOrder.indexOf(b.wellKnown);
        if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
    return { success: true, folders };
  } catch (error) {
    console.error('[Graph] listFolders:', error.message);
    if (error.message === 'TOKEN_EXPIRED') return { success: false, error: 'TOKEN_EXPIRED' };
    return { success: false, error: error.message };
  }
});

// ============================================================
// LOGBUCH (v3.0.12)
// ============================================================

const LOG_KEY = 'appLog';
const LOG_MAX = 2000;

function addLogEntry(type, title, detail = '') {
  try {
    const entries = store.get(LOG_KEY, []);
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      type,
      title,
      detail
    };
    entries.unshift(entry);
    if (entries.length > LOG_MAX) entries.splice(LOG_MAX);
    store.set(LOG_KEY, entries);
  } catch (e) {
    console.error('[Log] addLogEntry error:', e.message);
  }
}

ipcMain.handle('log:add', async (event, { type, title, detail }) => {
  addLogEntry(type, title, detail || '');
  return { success: true };
});

ipcMain.handle('log:getAll', async () => {
  return { success: true, entries: store.get(LOG_KEY, []) };
});

ipcMain.handle('log:clear', async () => {
  store.set(LOG_KEY, []);
  return { success: true };
});

// ============================================================
// ÜBERSETZUNG
// ============================================================

const TRANSLATION_KEY = 'translationSettings';
const TRANSLATION_DEFAULTS = {
  service: 'deepl',
  deeplFree: true,
  apiKey: '',
  customApiUrl: '',
  enabledLanguages: ['DE', 'EN'],
};

ipcMain.handle('translation:getSettings', async () => {
  return { ...TRANSLATION_DEFAULTS, ...store.get(TRANSLATION_KEY, {}) };
});

ipcMain.handle('translation:saveSettings', async (event, settings) => {
  store.set(TRANSLATION_KEY, settings);
  return { success: true };
});

ipcMain.handle('translation:translate', async (event, { text, targetLang }) => {
  const fetch = require('node-fetch');
  const s = { ...TRANSLATION_DEFAULTS, ...store.get(TRANSLATION_KEY, {}) };

  if (!text || !targetLang) return { success: false, error: 'Kein Text oder Zielsprache angegeben' };

  try {
    if (s.service === 'deepl') {
      if (!s.apiKey) return { success: false, error: 'Kein DeepL API-Key konfiguriert' };
      const base = s.deeplFree !== false
        ? 'https://api-free.deepl.com'
        : 'https://api.deepl.com';
      const res = await fetch(`${base}/v2/translate`, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${s.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: [text], target_lang: targetLang }),
      });
      if (!res.ok) {
        const errBody = await res.text();
        return { success: false, error: `DeepL Fehler ${res.status}: ${errBody}` };
      }
      const data = await res.json();
      const translatedText = data?.translations?.[0]?.text || '';
      return { success: true, translatedText };

    } else if (s.service === 'google') {
      if (!s.apiKey) return { success: false, error: 'Kein Google API-Key konfiguriert' };
      const url = `https://translation.googleapis.com/language/translate/v2?key=${s.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, target: targetLang.toLowerCase(), format: 'text' }),
      });
      if (!res.ok) {
        const errBody = await res.text();
        return { success: false, error: `Google Fehler ${res.status}: ${errBody}` };
      }
      const data = await res.json();
      const translatedText = data?.data?.translations?.[0]?.translatedText || '';
      return { success: true, translatedText };

    } else if (s.service === 'custom') {
      if (!s.customApiUrl) return { success: false, error: 'Keine Custom-API-URL konfiguriert' };
      const res = await fetch(s.customApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang }),
      });
      if (!res.ok) {
        const errBody = await res.text();
        return { success: false, error: `API Fehler ${res.status}: ${errBody}` };
      }
      const data = await res.json();
      const translatedText = data?.translatedText || data?.text || data?.result || '';
      if (!translatedText) return { success: false, error: 'Antwort enthält kein Übersetzungsfeld' };
      return { success: true, translatedText };

    } else {
      return { success: false, error: 'Unbekannter Übersetzungsdienst' };
    }
  } catch (e) {
    console.error('[Translation] error:', e.message);
    return { success: false, error: e.message };
  }
});
