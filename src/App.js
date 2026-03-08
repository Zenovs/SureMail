import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AccountProvider, useAccounts } from './context/AccountContext';
import { SidebarProvider } from './context/SidebarContext';
import { DashboardProvider } from './context/DashboardContext';
import { OllamaProvider, useOllama } from './context/OllamaContext';
import SidebarV2 from './components/SidebarV2';
import ChatWidget from './components/ChatWidget';
import OllamaInstaller from './components/OllamaInstaller';
import Dashboard from './pages/Dashboard';
import InboxSplitView from './pages/InboxSplitView';
import ComposeEmail from './pages/ComposeEmail';
import SettingsV2 from './pages/SettingsV2';
import AccountManager from './pages/AccountManager';
import EmailView from './pages/EmailView';

function AppContent() {
  const { currentTheme } = useTheme();
  const { setActiveAccountId } = useAccounts();
  const { isAvailable, isChecking, checkOllama } = useOllama();
  const [currentView, setCurrentView] = useState('dashboard');
  const [fullViewEmail, setFullViewEmail] = useState(null);
  const [showOllamaInstaller, setShowOllamaInstaller] = useState(false);
  const c = currentTheme.colors;

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

  const handleFullView = (email) => {
    setFullViewEmail(email);
    setCurrentView('emailView');
  };

  const handleBackFromEmail = () => {
    setFullViewEmail(null);
    setCurrentView('inbox');
  };

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
        return <InboxSplitView onFullView={handleFullView} />;
      case 'compose':
        return <ComposeEmail onBack={() => setCurrentView('inbox')} />;
      case 'settings':
        return <SettingsV2 />;
      case 'accounts':
        return <AccountManager />;
      case 'emailView':
        return (
          <EmailView 
            email={fullViewEmail}
            onBack={handleBackFromEmail}
            onReply={() => setCurrentView('compose')}
          />
        );
      default:
        return <Dashboard onNavigate={setCurrentView} onSelectAccount={setActiveAccountId} />;
    }
  };

  return (
    <div className={`flex h-screen ${c.bg}`}>
      <SidebarV2 currentView={currentView} onNavigate={setCurrentView} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </main>
      <ChatWidget />
      
      {/* Ollama Installer Modal */}
      <OllamaInstaller 
        isOpen={showOllamaInstaller}
        onClose={() => setShowOllamaInstaller(false)}
        onInstallComplete={handleOllamaInstallComplete}
      />
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
              <AppContent />
            </OllamaProvider>
          </DashboardProvider>
        </SidebarProvider>
      </AccountProvider>
    </ThemeProvider>
  );
}

export default App;
