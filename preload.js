const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // App Info (v1.2)
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  openDevTools: () => ipcRenderer.invoke('app:openDevTools'),
  getAppSettings: () => ipcRenderer.invoke('app:getSettings'),
  saveAppSettings: (settings) => ipcRenderer.invoke('app:saveSettings', settings),
  
  // Theme Icons (v2.2.0)
  setThemeIcon: (themeName) => ipcRenderer.invoke('theme:setIcon', themeName),
  getAvailableThemeIcons: () => ipcRenderer.invoke('theme:getAvailableIcons'),
  
  // Updates (v1.16.0 - Auto-Update)
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: (url) => ipcRenderer.invoke('update:download', url),
  installUpdate: (filePath) => ipcRenderer.invoke('update:install', filePath),
  openDownloads: () => ipcRenderer.invoke('update:openDownloads'),
  verifyUpdateFile: (filePath) => ipcRenderer.invoke('update:verifyFile', filePath),
  getBackups: () => ipcRenderer.invoke('update:getBackups'),
  restoreBackup: (backupPath) => ipcRenderer.invoke('update:restoreBackup', backupPath),
  onUpdateAvailable: (callback) => ipcRenderer.on('update:available', (event, data) => callback(data)),
  onUpdateProgress: (callback) => ipcRenderer.on('update:progress', (event, data) => callback(data)),
  onUpdateRestartRequired: (callback) => ipcRenderer.on('update:restart-required', () => callback()),
  
  // Ollama Installation (v1.6.0)
  checkOllamaInstalled: () => ipcRenderer.invoke('ollama:checkInstalled'),
  installOllama: () => ipcRenderer.invoke('ollama:install'),
  startOllamaService: () => ipcRenderer.invoke('ollama:startService'),
  downloadOllamaModel: (modelName) => ipcRenderer.invoke('ollama:downloadModel', modelName),
  onOllamaProgress: (callback) => ipcRenderer.on('ollama:progress', (event, data) => callback(data)),
  removeOllamaProgressListener: () => ipcRenderer.removeAllListeners('ollama:progress'),
  
  // Notifications (v1.2)
  showNotification: (data) => ipcRenderer.invoke('notification:show', data),
  setBadgeCount: (count) => ipcRenderer.invoke('notification:setBadge', count),
  onEmailOpen: (callback) => ipcRenderer.on('email:open', (event, data) => callback(data)),
  
  // Signatures (v1.2)
  saveSignatures: (signatures) => ipcRenderer.invoke('signatures:save', signatures),
  loadSignatures: () => ipcRenderer.invoke('signatures:load'),
  
  // Attachments (v1.2)
  saveAllAttachments: (attachments) => ipcRenderer.invoke('attachment:saveAll', attachments),
  openFile: (filePath) => ipcRenderer.invoke('attachment:openFile', filePath),
  selectDownloadFolder: () => ipcRenderer.invoke('attachment:selectDownloadFolder'),
  
  // Accounts & Categories (v1.1)
  saveAccounts: (data) => ipcRenderer.invoke('accounts:save', data),
  loadAccounts: () => ipcRenderer.invoke('accounts:load'),
  
  // Legacy Settings (v1.0 compatibility)
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  
  // IMAP
  testImap: (settings) => ipcRenderer.invoke('imap:test', settings),
  fetchEmails: (options) => ipcRenderer.invoke('imap:fetchEmails', options),
  fetchEmail: (uid) => ipcRenderer.invoke('imap:fetchEmail', uid),
  
  // IMAP for specific account (v1.1)
  fetchEmailsForAccount: (accountId, options) => ipcRenderer.invoke('imap:fetchEmailsForAccount', accountId, options),
  fetchEmailForAccount: (accountId, uid, folder) => ipcRenderer.invoke('imap:fetchEmailForAccount', accountId, uid, folder),
  
  // IMAP Operations v1.8.0
  deleteEmail: (accountId, uid, folder) => ipcRenderer.invoke('imap:deleteEmail', accountId, uid, folder),
  markAsRead: (accountId, uid, isRead, folder) => ipcRenderer.invoke('imap:markAsRead', accountId, uid, isRead, folder),
  moveEmail: (accountId, uid, sourceFolder, destFolder) => ipcRenderer.invoke('imap:moveEmail', accountId, uid, sourceFolder, destFolder),
  listFolders: (accountId) => ipcRenderer.invoke('imap:listFolders', accountId),
  fetchEmailsFromFolder: (accountId, folder, options) => ipcRenderer.invoke('imap:fetchEmailsFromFolder', accountId, folder, options),
  
  // SMTP
  testSmtp: (settings) => ipcRenderer.invoke('smtp:test', settings),
  sendEmail: (emailData) => ipcRenderer.invoke('smtp:send', emailData),
  sendEmailForAccount: (accountId, emailData) => ipcRenderer.invoke('smtp:sendForAccount', accountId, emailData),
  
  // Global Search (v1.13.0)
  globalSearch: (params) => ipcRenderer.invoke('search:globalSearch', params),
  quickSearch: (params) => ipcRenderer.invoke('search:quickSearch', params),
  updateSearchCache: (data) => ipcRenderer.invoke('search:updateCache', data),
  
  // Spam Filter (v1.14.0)
  saveSpamFilterSettings: (settings) => ipcRenderer.invoke('spamfilter:saveSettings', settings),
  loadSpamFilterSettings: () => ipcRenderer.invoke('spamfilter:loadSettings'),
  saveSpamAnalysis: (accountId, data) => ipcRenderer.invoke('spamfilter:saveAnalysis', accountId, data),
  loadSpamAnalysis: (accountId) => ipcRenderer.invoke('spamfilter:loadAnalysis', accountId),

  // Microsoft Exchange / Microsoft 365 via Graph API (v2.9.0)
  microsoftLogin: (clientId) => ipcRenderer.invoke('msauth:startLogin', { clientId }),
  microsoftRelogin: (accountId) => ipcRenderer.invoke('msauth:relogin', accountId),
  microsoftLogout: (accountId) => ipcRenderer.invoke('msauth:logout', accountId),

  // Microsoft Graph – Email operations
  fetchGraphEmails: (accountId, options) => ipcRenderer.invoke('graph:fetchEmails', accountId, options),
  fetchGraphEmail: (accountId, messageId) => ipcRenderer.invoke('graph:fetchEmail', accountId, messageId),
  sendGraphEmail: (accountId, emailData) => ipcRenderer.invoke('graph:sendEmail', accountId, emailData),
  deleteGraphEmail: (accountId, messageId) => ipcRenderer.invoke('graph:deleteEmail', accountId, messageId),
  markGraphAsRead: (accountId, messageId, isRead) => ipcRenderer.invoke('graph:markAsRead', accountId, messageId, isRead),
  moveGraphEmail: (accountId, messageId, destFolderId) => ipcRenderer.invoke('graph:moveEmail', accountId, messageId, destFolderId),
  listGraphFolders: (accountId) => ipcRenderer.invoke('graph:listFolders', accountId),

  // Logbuch (v3.0.12)
  logAdd: (type, title, detail) => ipcRenderer.invoke('log:add', { type, title, detail }),
  logGetAll: () => ipcRenderer.invoke('log:getAll'),
  logClear: () => ipcRenderer.invoke('log:clear'),

  // Übersetzung
  translationGetSettings: () => ipcRenderer.invoke('translation:getSettings'),
  translationSaveSettings: (settings) => ipcRenderer.invoke('translation:saveSettings', settings),
  translationTranslate: ({ text, targetLang }) => ipcRenderer.invoke('translation:translate', { text, targetLang }),

  // Zeitversetztes Senden
  scheduledAdd: (emailData) => ipcRenderer.invoke('scheduled:add', emailData),
  scheduledList: () => ipcRenderer.invoke('scheduled:list'),
  scheduledCancel: (id) => ipcRenderer.invoke('scheduled:cancel', id),

  // Kalender (v4.4.0)
  calendarGetEvents: (accountId, options) => ipcRenderer.invoke('calendar:getEvents', accountId, options),
  calendarCreateEvent: (accountId, eventData) => ipcRenderer.invoke('calendar:createEvent', accountId, eventData),
  calendarUpdateEvent: (accountId, eventId, eventData) => ipcRenderer.invoke('calendar:updateEvent', accountId, eventId, eventData),
  calendarDeleteEvent: (accountId, eventId) => ipcRenderer.invoke('calendar:deleteEvent', accountId, eventId),
});
