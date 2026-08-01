// ─── MailApi — zentrale Fassade für alle Mail-Aktionen (v6.11.0) ─────────────
//
// EINE Stelle entscheidet, ob ein Konto über Microsoft Graph oder IMAP/SMTP
// angesprochen wird. Vorher war die `account.type === 'microsoft'`-Weiche an
// über 15 Stellen im Renderer dupliziert — exakt diese Fehlerklasse
// verursachte die Bugs v6.9.3 (Als-gelesen-Markieren rief bei M365-Konten den
// IMAP-Handler) und v6.9.6 (Vollansicht laden/löschen defekt bei M365).
//
// Konvention: Jede Funktion nimmt das ACCOUNT-OBJEKT (nicht nur die Id),
// damit der Dispatch hier passieren kann. Rückgaben sind die unveränderten
// IPC-Ergebnisse ({ success, ... }).

export function isGraphAccount(account) {
  return account?.type === 'microsoft';
}

// Graziöser Fehler statt TypeError, falls (noch) kein Konto aktiv ist —
// z.B. während des Konto-Ladens oder direkt nach dem Entfernen eines Kontos.
const noAccount = () => Promise.resolve({ success: false, error: 'Kein aktives Konto' });

export const MailApi = {
  isGraph: isGraphAccount,

  // ── Lesen ──────────────────────────────────────────────────────────────────
  fetchOne(account, uid, folder = 'INBOX') {
    if (!account?.id) return noAccount();
    return isGraphAccount(account)
      ? window.electronAPI.fetchGraphEmail(account.id, uid)
      : window.electronAPI.fetchEmailForAccount(account.id, uid, folder);
  },

  // ── Status ─────────────────────────────────────────────────────────────────
  markRead(account, uid, isRead, folder = 'INBOX') {
    if (!account?.id) return noAccount();
    return isGraphAccount(account)
      ? window.electronAPI.markGraphAsRead(account.id, uid, isRead)
      : window.electronAPI.markAsRead(account.id, uid, isRead, folder);
  },

  // ── Verschieben / Löschen (Outlook-Semantik, v6.10.0) ─────────────────────
  trash(account, uid, folder = 'INBOX') {
    if (!account?.id) return noAccount();
    return isGraphAccount(account)
      ? window.electronAPI.trashGraphEmail(account.id, uid)
      : window.electronAPI.trashEmail(account.id, uid, folder);
  },

  archive(account, uid, folder = 'INBOX') {
    if (!account?.id) return noAccount();
    return isGraphAccount(account)
      ? window.electronAPI.archiveGraphEmail(account.id, uid)
      : window.electronAPI.archiveEmail(account.id, uid, folder);
  },

  deletePermanent(account, uid, folder = 'INBOX') {
    if (!account?.id) return noAccount();
    return isGraphAccount(account)
      ? window.electronAPI.deleteGraphEmail(account.id, uid)
      : window.electronAPI.deleteEmail(account.id, uid, folder);
  },

  move(account, uid, fromFolder, destFolder) {
    if (!account?.id) return noAccount();
    return isGraphAccount(account)
      ? window.electronAPI.moveGraphEmail(account.id, uid, destFolder)
      : window.electronAPI.moveEmail(account.id, uid, fromFolder, destFolder);
  },

  // Rückgängig für trash()/archive(): verschiebt die Mail zurück in den
  // Ausgangsordner. Graph liefert beim Move die neue Message-Id (`newId`);
  // IMAP vergibt beim Verschieben eine neue UID, darum wird die Mail dort
  // per Message-ID-Header im Zielordner gesucht (imap:findAndMove).
  undoMove(account, moveResult, backToFolder, messageId) {
    if (!account?.id) return noAccount();
    if (isGraphAccount(account)) {
      const dest = backToFolder === 'INBOX' ? 'inbox' : backToFolder;
      return window.electronAPI.moveGraphEmail(account.id, moveResult.newId, dest);
    }
    return window.electronAPI.findAndMoveEmail(account.id, moveResult.destFolder, backToFolder, messageId);
  },

  // ── Senden ─────────────────────────────────────────────────────────────────
  send(account, emailData) {
    if (!account?.id) return noAccount();
    return isGraphAccount(account)
      ? window.electronAPI.sendGraphEmail(account.id, emailData)
      : window.electronAPI.sendEmailForAccount(account.id, emailData);
  },

  // ── Ordner ─────────────────────────────────────────────────────────────────
  listFolders(account) {
    if (!account?.id) return noAccount();
    return isGraphAccount(account)
      ? window.electronAPI.listGraphFolders(account.id)
      : window.electronAPI.listFolders(account.id);
  },

  createFolder(account, name) {
    if (!account?.id) return noAccount();
    return isGraphAccount(account)
      ? window.electronAPI.createGraphFolder(account.id, name, null)
      : window.electronAPI.createFolder(account.id, name);
  },

  renameFolder(account, folderPath, newName) {
    if (!account?.id) return noAccount();
    return isGraphAccount(account)
      ? window.electronAPI.renameGraphFolder(account.id, folderPath, newName)
      : window.electronAPI.renameFolder(account.id, folderPath, newName);
  },

  deleteFolder(account, folderPath) {
    if (!account?.id) return noAccount();
    return isGraphAccount(account)
      ? window.electronAPI.deleteGraphFolder(account.id, folderPath)
      : window.electronAPI.deleteFolder(account.id, folderPath);
  },
};

export default MailApi;
