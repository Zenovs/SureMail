import React, { useState, useEffect, useCallback, Component } from 'react';

// v2.7.6: Global error boundary to catch render crashes (shows error instead of black window)
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
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AccountProvider, useAccounts } from './context/AccountContext';
import { SidebarProvider } from './context/SidebarContext';
import { DashboardProvider } from './context/DashboardContext';
import { OllamaProvider, useOllama } from './context/OllamaContext';
import { SearchProvider, useSearch } from './context/SearchContext';
import SidebarV2 from './components/SidebarV2';
import ChatWidget from './components/ChatWidget';
import OllamaInstaller from './components/OllamaInstaller';
import GlobalSearch from './components/GlobalSearch';
import UpdateNotification from './components/UpdateNotification';
import Dashboard from './pages/Dashboard';
import InboxSplitView from './pages/InboxSplitView';
import ComposeEmail from './pages/ComposeEmail';
import SettingsV2 from './pages/SettingsV2';
import AccountManager from './pages/AccountManager';
import EmailView from './pages/EmailView';
import { applySavedFont } from './pages/FontSettings';

// v1.11.0: Apply saved font on app load
applySavedFont();

function AppContent() {
  const { currentTheme } = useTheme();
  const { setActiveAccountId } = useAccounts();
  const { isAvailable, isChecking, checkOllama, setCurrentEmailContext } = useOllama();
  const { openSearch, toggleSearch } = useSearch();
  const [currentView, setCurrentView] = useState('dashboard');
  const [fullViewEmail, setFullViewEmail] = useState(null);
  const [currentFolder, setCurrentFolder] = useState('INBOX');
  const [composeData, setComposeData] = useState(null); // v1.8.0: For reply/forward
  const [showOllamaInstaller, setShowOllamaInstaller] = useState(false);
  const c = currentTheme.colors;

  // v1.13.0: Global search keyboard shortcut (Ctrl+K or Cmd+K)
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

  // Check if we should show the Ollama installer on first start
  useEffect(() => {
    const checkFirstStart = async () => {
      // Wait for Ollama check to complete
      if (isChecking) return;

      // If Ollama is already available, don't show installer
      if (isAvailable) return;

      // Check if user has skipped installation before
      if (window.electronAPI?.getAppSettings) {
        const settings = await window.electronAPI.getAppSettings();
        if (settings.ollamaInstallSkipped) return;
        if (settings.ollamaInstallerShown) return;

        // Show installer on first start
        setShowOllamaInstaller(true);
        
        // Mark that we've shown the installer
        await window.electronAPI.saveAppSettings({
          ...settings,
          ollamaInstallerShown: true
        });
      }
    };

    checkFirstStart();
  }, [isAvailable, isChecking]);

  const handleOllamaInstallComplete = () => {
    checkOllama();
  };

  const handleFullView = (email, folder = 'INBOX') => {
    setFullViewEmail(email);
    setCurrentFolder(folder);
    setCurrentEmailContext(email); // v1.8.0: Set email context for AI
    setCurrentView('emailView');
  };

  const handleBackFromEmail = () => {
    setFullViewEmail(null);
    setCurrentEmailContext(null); // v1.8.0: Clear email context
    setCurrentView('inbox');
  };

  // v1.8.0: Handle reply, reply all, forward
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

  // v1.13.0: Handle email selection from search
  const handleSelectEmailFromSearch = useCallback((email) => {
    setActiveAccountId(email.accountId);
    setFullViewEmail(email);
    setCurrentFolder(email.folder || 'INBOX');
    setCurrentEmailContext(email);
    setCurrentView('emailView');
  }, [setActiveAccountId, setCurrentEmailContext]);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            onNavigate={setCurrentView} 
            onSelectAccount={setActiveAccountId}
          />
        );
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
        return <Dashboard onNavigate={setCurrentView} onSelectAccount={setActiveAccountId} />;
    }
  };

  return (
    <div className={`flex h-screen ${c.bg}`}>
      <SidebarV2 currentView={currentView} onNavigate={setCurrentView} />
      <main className="flex-1 flex flex-col overflow-hidden min-h-0">
        <ErrorBoundary>
          {renderContent()}
        </ErrorBoundary>
      </main>
      <ChatWidget />
      
      {/* v1.13.0: Global Search Modal */}
      <GlobalSearch onSelectEmail={handleSelectEmailFromSearch} />
      
      {/* Ollama Installer Modal */}
      <OllamaInstaller 
        isOpen={showOllamaInstaller}
        onClose={() => setShowOllamaInstaller(false)}
        onInstallComplete={handleOllamaInstallComplete}
      />
      
      {/* v1.16.0: Update Notification */}
      <UpdateNotification onOpenSettings={() => setCurrentView('settings')} />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AccountProvider>
        <SidebarProvider>
          <DashboardProvider>
            <OllamaProvider>
              <SearchProvider>
                <AppContent />
              </SearchProvider>
            </OllamaProvider>
          </DashboardProvider>
        </SidebarProvider>
      </AccountProvider>
    </ThemeProvider>
  );
}

export default App;
