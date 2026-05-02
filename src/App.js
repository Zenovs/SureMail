import React, { useState, useEffect, useCallback, Component, useRef } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AccountProvider, useAccounts } from './context/AccountContext';
import { SidebarProvider } from './context/SidebarContext';
import { SearchProvider, useSearch } from './context/SearchContext';
import SidebarV2 from './components/SidebarV2';
import GlobalSearch from './components/GlobalSearch';
import UpdateNotification from './components/UpdateNotification';
import InboxSplitView from './pages/InboxSplitView';
import ComposeEmail from './pages/ComposeEmail';
import SettingsV2 from './pages/SettingsV2';
import Logbuch from './pages/Logbuch';
import AccountManager from './pages/AccountManager';
import EmailView from './pages/EmailView';
import CalendarView from './pages/CalendarView';
import { applySavedFont } from './pages/FontSettings';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[CoreMail] Render error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', color: '#e5e7eb', padding: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Ansicht konnte nicht geladen werden</h2>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '24px', textAlign: 'center', maxWidth: '400px' }}>
            {this.state.error?.message || 'Unbekannter Fehler'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ padding: '8px 20px', background: '#0891b2', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}
          >
            Erneut versuchen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

applySavedFont();

const bgSaveToIndexedDB = async (accountId, folder, emails) => {
  try {
    const request = indexedDB.open('CoreMailDB', 1);
    await new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('emails', 'readwrite');
        const store = tx.objectStore('emails');
        store.put({ id: `${accountId}:${folder}`, accountId, folder, emails, timestamp: Date.now() });
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(tx.error); };
      };
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('emails')) {
          db.createObjectStore('emails', { keyPath: 'id' });
        }
      };
    });
  } catch (e) {
    console.error('[BGSync] IndexedDB write error:', e);
  }
};

const REFRESH_INTERVALS_APP = { '1': 60000, '5': 300000, '10': 600000, '15': 900000, '30': 1800000, 'manual': 0 };

function AppContent() {
  const { currentTheme } = useTheme();
  const { setActiveAccountId, accounts, updateAccountStats } = useAccounts();
  const { openSearch, toggleSearch } = useSearch();
  const [currentView, setCurrentView] = useState('inbox');
  const [fullViewEmail, setFullViewEmail] = useState(null);
  const [currentFolder, setCurrentFolder] = useState('INBOX');
  const [composeData, setComposeData] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncErrorToast, setSyncErrorToast] = useState(null);
  const syncErrorTimerRef = useRef(null);
  const c = currentTheme.colors;

  useEffect(() => {
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        openSearch();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleSearch, openSearch]);

  useEffect(() => {
    if (!accounts || accounts.length === 0) return;

    const getInterval = () => {
      const saved = localStorage.getItem('emailSettings.refreshInterval') || '5';
      return REFRESH_INTERVALS_APP[saved] || 0;
    };

    const syncAllAccounts = async () => {
      if (!window.electronAPI) return;
      if (document.hidden) return;
      if (!navigator.onLine) return;

      const localStorageEnabled = localStorage.getItem('emailSettings.localStorageEnabled') !== 'false';

      for (const account of accounts) {
        try {
          let result;
          if (account.type === 'microsoft') {
            result = await window.electronAPI.fetchGraphEmails(account.id, { folder: 'INBOX', limit: 50, skip: 0 });
          } else {
            result = await window.electronAPI.fetchEmailsForAccount(account.id, { limit: 50, offset: 0 });
          }
          if (result?.success && result.emails?.length > 0) {
            if (localStorageEnabled) {
              await bgSaveToIndexedDB(account.id, 'INBOX', result.emails);
            }
            const unread = result.emails.filter(e => !e.seen).length;
            updateAccountStats(account.id, { unread, total: result.emails.length });
            window.dispatchEvent(new CustomEvent('coremail:bgSync', {
              detail: { accountId: account.id, folder: 'INBOX', emails: result.emails }
            }));
          }
        } catch (e) {
          console.error('[BGSync] Error for account', account.id, e);
          setSyncErrorToast({ accountName: account.name || account.id, message: e.message });
          if (syncErrorTimerRef.current) clearTimeout(syncErrorTimerRef.current);
          syncErrorTimerRef.current = setTimeout(() => setSyncErrorToast(null), 5000);
        }
      }
    };

    const interval = getInterval();
    if (interval <= 0) return;

    const jitter = Math.random() * 10000;
    console.log(`[BGSync] Starting background sync every ${interval / 1000}s (+${Math.round(jitter/1000)}s jitter) for ${accounts.length} account(s)`);
    let syncIntervalId = null;
    const firstTimeout = setTimeout(() => {
      syncAllAccounts();
      syncIntervalId = setInterval(syncAllAccounts, interval);
    }, jitter);
    return () => {
      clearTimeout(firstTimeout);
      if (syncIntervalId) clearInterval(syncIntervalId);
      console.log('[BGSync] Background sync stopped');
    };
  }, [accounts]);

  const handleFullView = (email, folder = 'INBOX') => {
    setFullViewEmail(email);
    setCurrentFolder(folder);
    setCurrentView('emailView');
  };

  const handleBackFromEmail = () => {
    setFullViewEmail(null);
    setCurrentView('inbox');
  };

  const handleReply = (email, options = {}) => {
    setComposeData({
      type: options.forward ? 'forward' : (options.replyAll ? 'replyAll' : 'reply'),
      originalEmail: email
    });
    setCurrentView('compose');
  };

  const handleReplyAll = (email) => {
    handleReply(email, { replyAll: true });
  };

  const handleForward = (email) => {
    handleReply(email, { forward: true });
  };

  const handleSelectEmailFromSearch = useCallback((email) => {
    setActiveAccountId(email.accountId);
    setFullViewEmail(email);
    setCurrentFolder(email.folder || 'INBOX');
    setCurrentView('emailView');
  }, [setActiveAccountId]);

  const renderContent = () => {
    switch (currentView) {
      case 'inbox':
        return <InboxSplitView onFullView={handleFullView} onNavigate={setCurrentView} />;
      case 'compose':
        return (
          <ComposeEmail
            onBack={() => { setComposeData(null); setCurrentView('inbox'); }}
            composeData={composeData}
          />
        );
      case 'settings':
        return <SettingsV2 />;
      case 'accounts':
        return <AccountManager />;
      case 'logbuch':
        return <Logbuch />;
      case 'calendar':
        return <CalendarView />;
      case 'emailView':
        return (
          <EmailView
            email={fullViewEmail}
            onBack={handleBackFromEmail}
            onReply={handleReply}
            onReplyAll={handleReplyAll}
            onForward={handleForward}
            currentFolder={currentFolder}
          />
        );
      default:
        return <InboxSplitView onFullView={handleFullView} onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className={`flex flex-col h-screen ${c.bg}`}>
      {!isOnline && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600/90 text-white text-sm font-medium flex-shrink-0 z-50">
          <span>📡</span>
          <span>Keine Internetverbindung — E-Mails werden offline angezeigt</span>
        </div>
      )}
      {syncErrorToast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 bg-red-900/90 border border-red-500/40 text-red-200 text-sm rounded-xl shadow-lg max-w-sm">
          <span>⚠️</span>
          <span>Sync fehlgeschlagen für <strong>{syncErrorToast.accountName}</strong></span>
          <button onClick={() => setSyncErrorToast(null)} className="ml-auto opacity-60 hover:opacity-100">✕</button>
        </div>
      )}
      <ErrorBoundary>
      <div className="flex flex-1 overflow-hidden min-h-0">
      <SidebarV2 currentView={currentView} onNavigate={setCurrentView} />
      <main className="flex-1 flex flex-col overflow-hidden min-h-0">
        <ErrorBoundary>
          {renderContent()}
        </ErrorBoundary>
      </main>
      <GlobalSearch onSelectEmail={handleSelectEmailFromSearch} />
      <UpdateNotification onOpenSettings={() => setCurrentView('settings')} />
      </div>
      </ErrorBoundary>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AccountProvider>
        <SidebarProvider>
          <SearchProvider>
            <AppContent />
          </SearchProvider>
        </SidebarProvider>
      </AccountProvider>
    </ThemeProvider>
  );
}

export default App;
