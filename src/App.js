import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Inbox from './pages/Inbox';
import ComposeEmail from './pages/ComposeEmail';
import Settings from './pages/Settings';
import EmailView from './pages/EmailView';

function App() {
  const [currentView, setCurrentView] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [settings, setSettings] = useState({ imap: {}, smtp: {} });
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.loadSettings();
      if (result.success && result.data) {
        setSettings(result.data);
        setIsConfigured(
          result.data.imap?.host && 
          result.data.imap?.username && 
          result.data.imap?.password
        );
      }
    }
  };

  const handleEmailSelect = (email) => {
    setSelectedEmail(email);
    setCurrentView('emailView');
  };

  const handleBack = () => {
    setSelectedEmail(null);
    setCurrentView('inbox');
  };

  const renderContent = () => {
    if (!isConfigured && currentView !== 'settings') {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 bg-dark-800 rounded-lg border border-dark-600 max-w-md">
            <div className="text-cyan-400 text-6xl mb-4">⚙️</div>
            <h2 className="text-xl font-semibold text-gray-100 mb-2">
              Willkommen bei CoreMail
            </h2>
            <p className="text-gray-400 mb-6">
              Bitte konfiguriere zuerst deine IMAP- und SMTP-Einstellungen, um E-Mails zu empfangen und zu senden.
            </p>
            <button
              onClick={() => setCurrentView('settings')}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
            >
              Einstellungen öffnen
            </button>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'inbox':
        return <Inbox onEmailSelect={handleEmailSelect} />;
      case 'compose':
        return <ComposeEmail onBack={() => setCurrentView('inbox')} />;
      case 'settings':
        return (
          <Settings 
            settings={settings} 
            onSave={(newSettings) => {
              setSettings(newSettings);
              setIsConfigured(true);
            }} 
          />
        );
      case 'emailView':
        return (
          <EmailView 
            email={selectedEmail} 
            onBack={handleBack}
            onReply={() => setCurrentView('compose')}
          />
        );
      default:
        return <Inbox onEmailSelect={handleEmailSelect} />;
    }
  };

  return (
    <div className="flex h-screen bg-dark-900">
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView}
        isConfigured={isConfigured}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
