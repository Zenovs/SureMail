const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // App Info (v1.2)
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getAppSettings: () => ipcRenderer.invoke('app:getSettings'),
  saveAppSettings: (settings) => ipcRenderer.invoke('app:saveSettings', settings),
  
  // Updates (v1.2)
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: (url) => ipcRenderer.invoke('update:download', url),
  installUpdate: (filePath) => ipcRenderer.invoke('update:install', filePath),
  openDownloads: () => ipcRenderer.invoke('update:openDownloads'),
  onUpdateAvailable: (callback) => ipcRenderer.on('update:available', (event, data) => callback(data)),
  onUpdateProgress: (callback) => ipcRenderer.on('update:progress', (event, data) => callback(data)),
  
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
  fetchEmailForAccount: (accountId, uid) => ipcRenderer.invoke('imap:fetchEmailForAccount', accountId, uid),
  
  // SMTP
  testSmtp: (settings) => ipcRenderer.invoke('smtp:test', settings),
  sendEmail: (emailData) => ipcRenderer.invoke('smtp:send', emailData),
  sendEmailForAccount: (accountId, emailData) => ipcRenderer.invoke('smtp:sendForAccount', accountId, emailData)
});
