const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const imapSimple = require('imap-simple');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');

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
    icon: path.join(__dirname, 'assets/icon.png')
  });

  // In Entwicklung: localhost, in Produktion: build-Ordner
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

// ============ IPC HANDLERS ============

// Einstellungen speichern
ipcMain.handle('settings:save', async (event, settings) => {
  try {
    store.set('imapSettings', settings.imap);
    store.set('smtpSettings', settings.smtp);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Einstellungen laden
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

// IMAP Verbindung testen
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

// E-Mails abrufen
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

    // Letzte X E-Mails abrufen
    const searchCriteria = ['ALL'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: false,
      struct: true
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    
    // Nach Datum sortieren (neueste zuerst)
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

// Einzelne E-Mail abrufen
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

// E-Mail senden
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
      html: emailData.html
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'E-Mail erfolgreich gesendet!' };
  } catch (error) {
    console.error('SMTP Fehler:', error);
    return { success: false, error: error.message };
  }
});

// SMTP Verbindung testen
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
