const { app, BrowserWindow, ipcMain, Notification, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const { execSync } = require('child_process');
const Store = require('electron-store');
const imapSimple = require('imap-simple');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');

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

app.whenReady().then(createWindow);

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

    // Follow redirects
    const download = (url) => {
      https.get(url, {
        headers: { 'User-Agent': 'CoreMail-Desktop' }
      }, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          download(response.headers.location);
          return;
        }

        const totalSize = parseInt(response.headers['content-length'], 10);
        let downloadedSize = 0;
        const file = fs.createWriteStream(filePath);

        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          const progress = Math.round((downloadedSize / totalSize) * 100);
          if (mainWindow) {
            mainWindow.webContents.send('update:progress', { progress, downloaded: downloadedSize, total: totalSize });
          }
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          // Make executable
          try {
            fs.chmodSync(filePath, 0o755);
          } catch (e) {
            console.error('chmod error:', e);
          }
          resolve({ success: true, filePath });
        });

        file.on('error', (err) => {
          fs.unlink(filePath, () => {});
          reject(err);
        });
      }).on('error', reject);
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
    // Open the new AppImage
    shell.openPath(filePath);
    // Quit the current app
    setTimeout(() => app.quit(), 1000);
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

// Fetch emails for specific account
ipcMain.handle('imap:fetchEmailsForAccount', async (event, accountId, options = {}) => {
  const account = getAccountById(accountId);
  
  if (!account) {
    return { success: false, error: 'Konto nicht gefunden' };
  }

  const { folder = 'INBOX', limit = 50 } = options;

  try {
    const config = {
      imap: {
        user: account.imap.username,
        password: account.imap.password,
        host: account.imap.host,
        port: parseInt(account.imap.port),
        tls: account.imap.tls !== false,
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
ipcMain.handle('imap:fetchEmailForAccount', async (event, accountId, uid) => {
  const account = getAccountById(accountId);
  
  if (!account) {
    return { success: false, error: 'Konto nicht gefunden' };
  }

  try {
    const config = {
      imap: {
        user: account.imap.username,
        password: account.imap.password,
        host: account.imap.host,
        port: parseInt(account.imap.port),
        tls: account.imap.tls !== false,
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
    const transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: parseInt(account.smtp.port),
      secure: account.smtp.secure !== false,
      auth: {
        user: account.smtp.username,
        pass: account.smtp.password
      }
    });

    const mailOptions = {
      from: account.smtp.fromEmail || account.smtp.username,
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
