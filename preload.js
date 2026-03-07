const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Einstellungen
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  
  // IMAP
  testImap: (settings) => ipcRenderer.invoke('imap:test', settings),
  fetchEmails: (options) => ipcRenderer.invoke('imap:fetchEmails', options),
  fetchEmail: (uid) => ipcRenderer.invoke('imap:fetchEmail', uid),
  
  // SMTP
  testSmtp: (settings) => ipcRenderer.invoke('smtp:test', settings),
  sendEmail: (emailData) => ipcRenderer.invoke('smtp:send', emailData)
});
