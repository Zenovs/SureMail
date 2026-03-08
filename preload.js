const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
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
