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

// ============ OAUTH2 CONFIGURATION (v1.13.2) ============
// Microsoft OAuth2 settings for IMAP/SMTP access
// v1.13.1: Changed from Thunderbird client ID to Microsoft Office public client ID
// v1.13.2: Support for custom Azure AD App Registration (user-provided Client-ID)
const OAUTH2_CONFIG = {
  microsoft: {
    // Default: Microsoft Office Desktop Apps public client ID (no admin consent required)
    // v1.13.2: Can be overridden by user-provided Client-ID from Azure AD App Registration
    clientId: 'd3590ed6-52b3-4102-aeff-aad2292ab01c', // Microsoft Office native client (default)
    authEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    // v1.13.1: Optimized scopes - user-delegated permissions only
    scopes: [
      'https://outlook.office365.com/IMAP.AccessAsUser.All',
      'https://outlook.office365.com/SMTP.Send',
      'offline_access',
      'openid',
      'email',
      'profile'
    ],
    redirectPort: 8847, // Port for OAuth callback
    redirectUri: 'http://localhost:8847/oauth/callback'
  }
};

// Track active OAuth servers
let oauthServer = null;
let oauthState = null;
let oauthCodeVerifier = null;

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

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));
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
});

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

function getIconPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'icon.png');
  }
  return path.join(__dirname, 'assets/icon.png');
}

// ============ OAUTH2 FUNCTIONS (v1.10.0) ============

// Generate PKCE code verifier and challenge
function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

// Generate state for CSRF protection
function generateState() {
  return crypto.randomBytes(16).toString('hex');
}

// Start OAuth2 flow for Microsoft
// v1.13.2: Added optional customClientId parameter for Azure AD App Registration
let activeCustomClientId = null; // Track active custom Client-ID for token exchange

async function startMicrosoftOAuth(customClientId = null) {
  return new Promise((resolve, reject) => {
    const config = OAUTH2_CONFIG.microsoft;
    // v1.13.2: Use custom Client-ID if provided, otherwise fall back to default
    const effectiveClientId = customClientId || config.clientId;
    activeCustomClientId = customClientId; // Store for token exchange
    console.log(`[OAuth2] Using Client-ID: ${effectiveClientId}${customClientId ? ' (custom)' : ' (default)'}`);
    
    // Generate PKCE and state
    const pkce = generatePKCE();
    oauthCodeVerifier = pkce.verifier;
    oauthState = generateState();
    
    // Build authorization URL
    const authParams = new URLSearchParams({
      client_id: effectiveClientId,
      response_type: 'code',
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      state: oauthState,
      code_challenge: pkce.challenge,
      code_challenge_method: 'S256',
      response_mode: 'query',
      prompt: 'select_account'
    });
    
    const authUrl = `${config.authEndpoint}?${authParams.toString()}`;
    
    // Create HTTP server for callback
    if (oauthServer) {
      try {
        oauthServer.close();
      } catch (e) {}
    }
    
    oauthServer = http.createServer(async (req, res) => {
      const parsedUrl = url.parse(req.url, true);
      
      if (parsedUrl.pathname === '/oauth/callback') {
        const { code, state, error, error_description } = parsedUrl.query;
        
        // Send response to browser
        const responseHtml = error 
          ? `<html><head><style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#1a1a1a;color:#f00}</style></head><body><div style="text-align:center"><h1>❌ Fehler</h1><p>${error_description || error}</p><p>Sie können dieses Fenster schließen.</p></div></body></html>`
          : `<html><head><style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#1a1a1a;color:#0f0}</style></head><body><div style="text-align:center"><h1>✅ Anmeldung erfolgreich!</h1><p>Sie können dieses Fenster jetzt schließen.</p></div></body></html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(responseHtml);
        
        // Close server
        setTimeout(() => {
          if (oauthServer) {
            oauthServer.close();
            oauthServer = null;
          }
        }, 1000);
        
        if (error) {
          reject(new Error(error_description || error));
          return;
        }
        
        // Verify state
        if (state !== oauthState) {
          reject(new Error('Ungültiger State-Parameter (CSRF-Schutz)'));
          return;
        }
        
        try {
          // Exchange code for tokens
          const tokens = await exchangeCodeForTokens(code, 'microsoft');
          resolve(tokens);
        } catch (err) {
          reject(err);
        }
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });
    
    oauthServer.listen(config.redirectPort, '127.0.0.1', () => {
      console.log(`[OAuth2] Callback server started on port ${config.redirectPort}`);
      // Open browser for authentication
      shell.openExternal(authUrl);
    });
    
    oauthServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Port ${config.redirectPort} ist bereits in Verwendung. Bitte schließen Sie andere OAuth-Fenster und versuchen Sie es erneut.`));
      } else {
        reject(err);
      }
    });
    
    // Timeout after 5 minutes
    setTimeout(() => {
      if (oauthServer) {
        oauthServer.close();
        oauthServer = null;
        reject(new Error('OAuth2-Timeout: Anmeldung abgebrochen'));
      }
    }, 300000);
  });
}

// Exchange authorization code for tokens
// v1.13.2: Uses activeCustomClientId if set during startMicrosoftOAuth
async function exchangeCodeForTokens(code, provider) {
  const config = OAUTH2_CONFIG[provider];
  // v1.13.2: Use custom Client-ID if active
  const effectiveClientId = (provider === 'microsoft' && activeCustomClientId) ? activeCustomClientId : config.clientId;
  
  const tokenParams = new URLSearchParams({
    client_id: effectiveClientId,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: config.redirectUri,
    code_verifier: oauthCodeVerifier
  });
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'login.microsoftonline.com',
      path: '/common/oauth2/v2.0/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(tokenParams.toString())
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const tokenData = JSON.parse(data);
          
          if (tokenData.error) {
            reject(new Error(tokenData.error_description || tokenData.error));
            return;
          }
          
          // Parse ID token for user info (email)
          let email = '';
          if (tokenData.id_token) {
            try {
              const payload = JSON.parse(Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString());
              email = payload.preferred_username || payload.email || payload.upn || '';
            } catch (e) {
              console.log('[OAuth2] Could not parse id_token:', e.message);
            }
          }
          
          resolve({
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresIn: tokenData.expires_in,
            expiresAt: Date.now() + (tokenData.expires_in * 1000),
            email: email,
            provider: provider
          });
        } catch (e) {
          reject(new Error('Fehler beim Parsen der Token-Antwort'));
        }
      });
    });
    
    req.on('error', (err) => {
      reject(new Error('Token-Anfrage fehlgeschlagen: ' + err.message));
    });
    
    req.write(tokenParams.toString());
    req.end();
  });
}

// Refresh OAuth2 tokens
// v1.13.2: Added optional customClientId parameter
async function refreshOAuthTokens(refreshToken, provider, customClientId = null) {
  const config = OAUTH2_CONFIG[provider];
  // v1.13.2: Use custom Client-ID if provided
  const effectiveClientId = (provider === 'microsoft' && customClientId) ? customClientId : config.clientId;
  
  const tokenParams = new URLSearchParams({
    client_id: effectiveClientId,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: config.scopes.join(' ')
  });
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'login.microsoftonline.com',
      path: '/common/oauth2/v2.0/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(tokenParams.toString())
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const tokenData = JSON.parse(data);
          
          if (tokenData.error) {
            reject(new Error(tokenData.error_description || tokenData.error));
            return;
          }
          
          resolve({
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token || refreshToken, // Use new token or keep old
            expiresIn: tokenData.expires_in,
            expiresAt: Date.now() + (tokenData.expires_in * 1000),
            provider: provider
          });
        } catch (e) {
          reject(new Error('Fehler beim Parsen der Token-Antwort'));
        }
      });
    });
    
    req.on('error', (err) => {
      reject(new Error('Token-Refresh fehlgeschlagen: ' + err.message));
    });
    
    req.write(tokenParams.toString());
    req.end();
  });
}

// Get valid access token (refresh if needed)
async function getValidAccessToken(accountId) {
  const account = getAccountById(accountId);
  
  if (!account || !account.oauth2) {
    return null;
  }
  
  const oauth = account.oauth2;
  
  // Check if token is still valid (with 5 min buffer)
  if (oauth.expiresAt && Date.now() < (oauth.expiresAt - 300000)) {
    return oauth.accessToken;
  }
  
  // Need to refresh
  if (!oauth.refreshToken) {
    throw new Error('Kein Refresh-Token verfügbar. Bitte erneut anmelden.');
  }
  
  console.log('[OAuth2] Refreshing access token for account:', accountId);
  
  try {
    // v1.13.2: Pass custom Client-ID if stored in account
    const newTokens = await refreshOAuthTokens(oauth.refreshToken, oauth.provider || 'microsoft', oauth.customClientId || null);
    
    // Update account with new tokens
    const accounts = store.get('accounts', []);
    const accountIndex = accounts.findIndex(acc => acc.id === accountId);
    
    if (accountIndex !== -1) {
      accounts[accountIndex].oauth2 = {
        ...accounts[accountIndex].oauth2,
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresAt: newTokens.expiresAt
      };
      store.set('accounts', accounts);
    }
    
    return newTokens.accessToken;
  } catch (err) {
    console.error('[OAuth2] Token refresh failed:', err.message);
    throw err;
  }
}

// Create XOAUTH2 token string for IMAP/SMTP
function createXOAuth2Token(email, accessToken) {
  // Format: user=<email>\x01auth=Bearer <token>\x01\x01
  const authString = `user=${email}\x01auth=Bearer ${accessToken}\x01\x01`;
  return Buffer.from(authString).toString('base64');
}

// Get IMAP configuration for account (supports both password and OAuth2)
// v1.12.1: Fixed OAuth2 configuration with correct TLS and timeout settings
async function getImapConfigForAccount(account) {
  // Check if OAuth2 is configured and valid
  if (account.oauth2 && account.oauth2.accessToken) {
    try {
      const accessToken = await getValidAccessToken(account.id);
      const email = account.oauth2.email || account.imap.username;
      const xoauth2Token = createXOAuth2Token(email, accessToken);
      
      console.log('[OAuth2] Creating IMAP config for:', email);
      
      return {
        imap: {
          user: email,
          xoauth2: xoauth2Token,
          host: account.imap.host || 'outlook.office365.com',
          port: parseInt(account.imap.port) || 993,
          tls: true, // v1.12.1: Always use TLS for OAuth2
          tlsOptions: {
            rejectUnauthorized: false,
            servername: account.imap.host || 'outlook.office365.com'
          },
          authTimeout: 30000, // v1.12.1: Increased timeout for OAuth2
          connTimeout: 30000
        },
        isOAuth2: true
      };
    } catch (err) {
      console.error('[OAuth2] Failed to get config, falling back to password:', err.message);
      // Fall back to password auth if OAuth2 fails
    }
  }
  
  // Standard password authentication
  return {
    imap: {
      user: account.imap.username,
      password: account.imap.password,
      host: account.imap.host,
      port: parseInt(account.imap.port),
      tls: account.imap.tls !== false,
      tlsOptions: account.imap.tls !== false ? {
        rejectUnauthorized: false,
        servername: account.imap.host
      } : undefined,
      authTimeout: 20000,
      connTimeout: 20000
    },
    isOAuth2: false
  };
}

// Get SMTP transporter for account (supports both password and OAuth2)
async function getSmtpTransporterForAccount(account) {
  // Check if OAuth2 is configured
  if (account.oauth2 && account.oauth2.accessToken) {
    try {
      const accessToken = await getValidAccessToken(account.id);
      const email = account.oauth2.email || account.smtp.fromEmail || account.imap.username;
      
      return {
        transporter: nodemailer.createTransport({
          host: account.smtp.host || 'smtp.office365.com',
          port: parseInt(account.smtp.port) || 587,
          secure: account.smtp.secure === true,
          auth: {
            type: 'OAuth2',
            user: email,
            accessToken: accessToken
          },
          tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false
          }
        }),
        fromEmail: email,
        isOAuth2: true
      };
    } catch (err) {
      console.error('[OAuth2] Failed to get SMTP config, falling back to password:', err.message);
    }
  }
  
  // Standard password authentication
  const smtpConfig = {
    host: account.smtp.host,
    port: parseInt(account.smtp.port),
    secure: account.smtp.secure === true,
    auth: {
      user: account.smtp.username,
      pass: account.smtp.password
    }
  };
  
  // Add STARTTLS if port is 587 and not secure
  if (parseInt(account.smtp.port) === 587 && !account.smtp.secure) {
    smtpConfig.requireTLS = true;
    smtpConfig.tls = {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    };
  }
  
  return {
    transporter: nodemailer.createTransport(smtpConfig),
    fromEmail: account.smtp.fromEmail || account.smtp.username,
    isOAuth2: false
  };
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
          const hasUpdate = compareVersions(latestVersion, APP_VERSION) > 0;
          
          if (hasUpdate && !silent && mainWindow) {
            mainWindow.webContents.send('update:available', {
              version: latestVersion,
              notes: release.body || '',
              downloadUrl: release.assets?.[0]?.browser_download_url || release.html_url
            });
          }
          
          resolve({
            success: true,
            currentVersion: APP_VERSION,
            latestVersion,
            hasUpdate,
            releaseNotes: release.body || '',
            downloadUrl: release.assets?.[0]?.browser_download_url || release.html_url,
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

function showNotification(title, body, onClick = null) {
  if (!Notification.isSupported()) {
    console.log('Notifications not supported');
    return;
  }

  const notification = new Notification({
    title,
    body,
    icon: getIconPath(),
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

// === APP INFO ===
ipcMain.handle('app:getVersion', () => APP_VERSION);

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
    // Verify file exists and is executable
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'Update-Datei nicht gefunden' };
    }
    
    const stats = fs.statSync(filePath);
    if (stats.size < 1000) {
      return { success: false, error: 'Update-Datei ist beschädigt' };
    }

    // v1.16.0: Create backup of current AppImage
    const currentAppImage = process.env.APPIMAGE;
    if (currentAppImage && fs.existsSync(currentAppImage)) {
      try {
        const backupDir = path.join(app.getPath('userData'), 'backups');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        const backupPath = path.join(backupDir, `CoreMail-Desktop-backup-${APP_VERSION}.AppImage`);
        fs.copyFileSync(currentAppImage, backupPath);
        console.log('Backup created:', backupPath);
        
        // Keep only last 3 backups
        const backups = fs.readdirSync(backupDir)
          .filter(f => f.startsWith('CoreMail-Desktop-backup-'))
          .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
          .sort((a, b) => b.time - a.time);
        
        if (backups.length > 3) {
          backups.slice(3).forEach(b => {
            try {
              fs.unlinkSync(path.join(backupDir, b.name));
            } catch (e) {}
          });
        }
      } catch (backupError) {
        console.error('Backup error (non-fatal):', backupError.message);
      }
    }
    
    // Ensure file is executable
    try {
      fs.chmodSync(filePath, 0o755);
    } catch (e) {
      console.error('chmod error:', e);
    }
    
    // Start the new AppImage using spawn (more reliable than shell.openPath for AppImages)
    console.log('Starting update from:', filePath);
    
    const child = spawn(filePath, [], {
      detached: true,
      stdio: 'ignore',
      env: { ...process.env, APPIMAGE_EXTRACT_AND_RUN: '0' }
    });
    
    child.unref();
    
    child.on('error', (err) => {
      console.error('Failed to start update:', err);
      // Fallback to shell.openPath
      shell.openPath(filePath);
    });
    
    // Quit the current app after a short delay to allow new instance to start
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

// === OAUTH2 (v1.10.0, v1.13.2: custom Client-ID support) ===
ipcMain.handle('oauth2:startMicrosoft', async (event, customClientId) => {
  try {
    console.log('[OAuth2] Starting Microsoft OAuth flow...');
    if (customClientId) {
      console.log(`[OAuth2] Custom Client-ID provided: ${customClientId}`);
    }
    const tokens = await startMicrosoftOAuth(customClientId || null);
    console.log('[OAuth2] Authentication successful for:', tokens.email);
    return { 
      success: true, 
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        email: tokens.email,
        provider: tokens.provider
      }
    };
  } catch (error) {
    console.error('[OAuth2] Error:', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('oauth2:refreshToken', async (event, accountId) => {
  try {
    const accessToken = await getValidAccessToken(accountId);
    return { success: true, accessToken };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('oauth2:testConnection', async (event, accountId) => {
  try {
    const account = getAccountById(accountId);
    
    if (!account || !account.oauth2) {
      return { success: false, error: 'Kein OAuth2-Konto' };
    }
    
    // Get valid token (refresh if needed)
    const accessToken = await getValidAccessToken(accountId);
    const email = account.oauth2.email || account.imap.username;
    
    // Test IMAP connection with XOAUTH2
    const xoauth2Token = createXOAuth2Token(email, accessToken);
    
    const config = {
      imap: {
        user: email,
        xoauth2: xoauth2Token,
        host: 'outlook.office365.com',
        port: 993,
        tls: true,
        authTimeout: 15000
      }
    };
    
    const connection = await imapSimple.connect(config);
    await connection.end();
    
    return { success: true, message: 'OAuth2-Verbindung erfolgreich!' };
  } catch (error) {
    console.error('[OAuth2] Test connection failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('oauth2:revokeAccount', async (event, accountId) => {
  try {
    // Remove OAuth2 tokens from account
    const accounts = store.get('accounts', []);
    const accountIndex = accounts.findIndex(acc => acc.id === accountId);
    
    if (accountIndex !== -1 && accounts[accountIndex].oauth2) {
      delete accounts[accountIndex].oauth2;
      store.set('accounts', accounts);
    }
    
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
ipcMain.handle('imap:fetchEmailsForAccount', async (event, accountId, options = {}) => {
  const account = getAccountById(accountId);
  
  if (!account) {
    return { success: false, error: 'Konto nicht gefunden' };
  }

  const { folder = 'INBOX', limit = 50 } = options;

  try {
    // v1.10.0: Use OAuth2-aware config helper
    const config = await getImapConfigForAccount(account);

    const connection = await imapSimple.connect(config);
    await connection.openBox(folder);

    const searchCriteria = ['ALL'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: false,
      struct: true
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    const emails = [];
    
    // Track unread count for notifications
    let unreadCount = 0;
    const previousUnread = store.get(`unreadCount_${accountId}`, 0);
    
    for (const message of messages.slice(-limit).reverse()) {
      try {
        const all = message.parts.find(p => p.which === '');
        const parsed = await simpleParser(all.body);
        const isUnread = !message.attributes.flags.includes('\\Seen');
        
        if (isUnread) unreadCount++;
        
        emails.push({
          uid: message.attributes.uid,
          subject: parsed.subject || '(Kein Betreff)',
          from: parsed.from?.text || 'Unbekannt',
          fromName: parsed.from?.value?.[0]?.name || parsed.from?.text?.split('<')[0]?.trim() || 'Unbekannt',
          to: parsed.to?.text || '',
          date: parsed.date || new Date(),
          seen: !isUnread,
          hasAttachments: parsed.attachments && parsed.attachments.length > 0,
          preview: parsed.text ? parsed.text.substring(0, 100) + '...' : ''
        });
      } catch (e) {
        console.error('Fehler beim Parsen einer E-Mail:', e);
      }
    }

    // Check for new unread emails and notify
    const settings = store.get('appSettings', {});
    if (settings.notificationsEnabled !== false && unreadCount > previousUnread) {
      const newEmails = emails.filter(e => !e.seen).slice(0, unreadCount - previousUnread);
      for (const email of newEmails) {
        showNotification(
          `Neue E-Mail von ${email.fromName}`,
          email.subject,
          () => {
            if (mainWindow) {
              mainWindow.show();
              mainWindow.focus();
              mainWindow.webContents.send('email:open', { accountId, uid: email.uid });
            }
          }
        );
      }
    }
    
    store.set(`unreadCount_${accountId}`, unreadCount);

    await connection.end();
    return { success: true, emails, unreadCount };
  } catch (error) {
    console.error('IMAP Fehler:', error);
    return { success: false, error: error.message };
  }
});

// Fetch single email for specific account
// v1.10.0: OAuth2 support for single email fetch
ipcMain.handle('imap:fetchEmailForAccount', async (event, accountId, uid) => {
  const account = getAccountById(accountId);
  
  if (!account) {
    return { success: false, error: 'Konto nicht gefunden' };
  }

  try {
    // v1.10.0: Use OAuth2-aware config helper
    const config = await getImapConfigForAccount(account);

    const connection = await imapSimple.connect(config);
    await connection.openBox('INBOX');

    const searchCriteria = [['UID', uid]];
    const fetchOptions = {
      bodies: [''],
      markSeen: true,
      struct: true
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    
    if (messages.length === 0) {
      await connection.end();
      return { success: false, error: 'E-Mail nicht gefunden' };
    }

    const message = messages[0];
    const all = message.parts.find(p => p.which === '');
    const parsed = await simpleParser(all.body);

    const attachments = parsed.attachments.map(att => ({
      filename: att.filename,
      contentType: att.contentType,
      size: att.size,
      content: att.content.toString('base64')
    }));

    await connection.end();
    
    return {
      success: true,
      email: {
        uid: uid,
        subject: parsed.subject || '(Kein Betreff)',
        from: parsed.from?.text || 'Unbekannt',
        to: parsed.to?.text || '',
        cc: parsed.cc?.text || '',
        date: parsed.date || new Date(),
        html: parsed.html || null,
        text: parsed.text || '',
        attachments
      }
    };
  } catch (error) {
    console.error('IMAP Fehler:', error);
    return { success: false, error: error.message };
  }
});

// Legacy fetch emails (for backward compatibility)
ipcMain.handle('imap:fetchEmails', async (event, { folder = 'INBOX', limit = 50 }) => {
  const imapSettings = store.get('imapSettings');
  
  if (!imapSettings) {
    return { success: false, error: 'Keine IMAP-Einstellungen konfiguriert' };
  }

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

    const connection = await imapSimple.connect(config);
    await connection.openBox(folder);

    const searchCriteria = ['ALL'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: false,
      struct: true
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    const emails = [];
    
    for (const message of messages.slice(-limit).reverse()) {
      try {
        const all = message.parts.find(p => p.which === '');
        const parsed = await simpleParser(all.body);
        
        emails.push({
          uid: message.attributes.uid,
          subject: parsed.subject || '(Kein Betreff)',
          from: parsed.from?.text || 'Unbekannt',
          to: parsed.to?.text || '',
          date: parsed.date || new Date(),
          seen: message.attributes.flags.includes('\\Seen'),
          hasAttachments: parsed.attachments && parsed.attachments.length > 0,
          preview: parsed.text ? parsed.text.substring(0, 100) + '...' : ''
        });
      } catch (e) {
        console.error('Fehler beim Parsen einer E-Mail:', e);
      }
    }

    await connection.end();
    return { success: true, emails };
  } catch (error) {
    console.error('IMAP Fehler:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('imap:fetchEmail', async (event, uid) => {
  const imapSettings = store.get('imapSettings');
  
  if (!imapSettings) {
    return { success: false, error: 'Keine IMAP-Einstellungen konfiguriert' };
  }

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

    const connection = await imapSimple.connect(config);
    await connection.openBox('INBOX');

    const searchCriteria = [['UID', uid]];
    const fetchOptions = {
      bodies: [''],
      markSeen: true,
      struct: true
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    
    if (messages.length === 0) {
      await connection.end();
      return { success: false, error: 'E-Mail nicht gefunden' };
    }

    const message = messages[0];
    const all = message.parts.find(p => p.which === '');
    const parsed = await simpleParser(all.body);

    const attachments = parsed.attachments.map(att => ({
      filename: att.filename,
      contentType: att.contentType,
      size: att.size,
      content: att.content.toString('base64')
    }));

    await connection.end();
    
    return {
      success: true,
      email: {
        uid: uid,
        subject: parsed.subject || '(Kein Betreff)',
        from: parsed.from?.text || 'Unbekannt',
        to: parsed.to?.text || '',
        cc: parsed.cc?.text || '',
        date: parsed.date || new Date(),
        html: parsed.html || null,
        text: parsed.text || '',
        attachments
      }
    };
  } catch (error) {
    console.error('IMAP Fehler:', error);
    return { success: false, error: error.message };
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
    const { transporter, fromEmail } = await getSmtpTransporterForAccount(account);

    const mailOptions = {
      from: fromEmail,
      to: emailData.to,
      subject: emailData.subject,
      text: finalText,
      html: finalHtml,
      attachments: emailData.attachments || []
    };

    await transporter.sendMail(mailOptions);
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
    const config = await getImapConfigForAccount(account);

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
    const config = await getImapConfigForAccount(account);

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
    const config = await getImapConfigForAccount(account);

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
  
  if (!account) {
    return { success: false, error: 'Konto nicht gefunden' };
  }

  try {
    const config = await getImapConfigForAccount(account);

    const connection = await imapSimple.connect(config);
    const boxes = await connection.getBoxes();
    
    // Convert boxes to flat array with folder info
    const parseFolders = (boxes, prefix = '') => {
      let folders = [];
      for (const name in boxes) {
        const box = boxes[name];
        const fullPath = prefix ? `${prefix}${box.delimiter || '/'}${name}` : name;
        
        // Determine folder type
        let type = 'folder';
        const nameLower = name.toLowerCase();
        if (nameLower === 'inbox') type = 'inbox';
        else if (nameLower.includes('sent') || nameLower.includes('gesendet')) type = 'sent';
        else if (nameLower.includes('draft') || nameLower.includes('entwu')) type = 'drafts';
        else if (nameLower.includes('trash') || nameLower.includes('papierkorb') || nameLower.includes('deleted')) type = 'trash';
        else if (nameLower.includes('spam') || nameLower.includes('junk')) type = 'spam';
        else if (nameLower.includes('archive') || nameLower.includes('archiv')) type = 'archive';
        
        folders.push({
          name,
          path: fullPath,
          type,
          delimiter: box.delimiter || '/',
          children: box.children ? parseFolders(box.children, fullPath) : []
        });
      }
      return folders;
    };
    
    const folders = parseFolders(boxes);
    await connection.end();
    
    return { success: true, folders };
  } catch (error) {
    console.error('IMAP Folders Fehler:', error);
    return { success: false, error: error.message };
  }
});

// Fetch emails from specific folder
// v1.10.0: OAuth2 support
ipcMain.handle('imap:fetchEmailsFromFolder', async (event, accountId, folder, options = {}) => {
  const account = getAccountById(accountId);
  
  if (!account) {
    return { success: false, error: 'Konto nicht gefunden' };
  }

  const { limit = 50, offset = 0 } = options;

  try {
    const config = await getImapConfigForAccount(account);

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

    const paginatedMessages = messages.slice(offset, offset + limit);
    
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
      hasMore: offset + limit < messages.length
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

  const results = [];
  const errors = [];
  const searchTerm = query.toLowerCase().trim();

  for (const account of searchableAccounts) {
    try {
      const config = await getImapConfigForAccount(account);
      const connection = await imapSimple.connect(config);
      
      // Get folders to search
      let foldersToSearch = folders.length > 0 ? folders : ['INBOX'];
      
      // If searching all folders, get folder list
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
          
          // Build IMAP search criteria
          const searchCriteria = buildSearchCriteria(searchTerm, filters);
          
          const fetchOptions = {
            bodies: ['HEADER', 'TEXT', ''],
            markSeen: false,
            struct: true
          };

          const messages = await connection.search(searchCriteria, fetchOptions);
          
          // Filter and process results
          for (const message of messages.slice(-100)) { // Limit per folder
            try {
              const all = message.parts.find(p => p.which === '');
              const parsed = await simpleParser(all.body);
              
              // Apply additional filters in memory
              if (matchesFilters(parsed, message, filters, searchTerm)) {
                const isUnread = !message.attributes.flags.includes('\\Seen');
                const isFlagged = message.attributes.flags.includes('\\Flagged');
                
                results.push({
                  uid: message.attributes.uid,
                  accountId: account.id,
                  accountName: account.name,
                  folder: folder,
                  subject: parsed.subject || '(Kein Betreff)',
                  from: parsed.from?.text || 'Unbekannt',
                  fromName: parsed.from?.value?.[0]?.name || parsed.from?.text?.split('<')[0]?.trim() || 'Unbekannt',
                  fromEmail: parsed.from?.value?.[0]?.address || '',
                  to: parsed.to?.text || '',
                  date: parsed.date || new Date(),
                  seen: !isUnread,
                  flagged: isFlagged,
                  hasAttachments: parsed.attachments && parsed.attachments.length > 0,
                  preview: parsed.text ? parsed.text.substring(0, 200).replace(/\n/g, ' ') + '...' : '',
                  matchedIn: getMatchedFields(parsed, searchTerm)
                });
              }
            } catch (e) {
              // Skip unparseable emails
            }
          }
        } catch (folderErr) {
          // Some folders may not be accessible
          console.log(`Could not search folder ${folder}:`, folderErr.message);
        }
      }
      
      await connection.end();
    } catch (accountErr) {
      errors.push({
        accountId: account.id,
        accountName: account.name,
        error: accountErr.message
      });
    }
  }

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
