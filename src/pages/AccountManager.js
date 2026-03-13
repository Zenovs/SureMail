import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, AlertCircle, Settings, Mail, Loader, LogIn, Shield, RefreshCw, ChevronDown, ChevronUp, HelpCircle, ExternalLink, Key, Zap, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../context/AccountContext';

// v1.15.0: Microsoft domains for auto-detection
const MICROSOFT_DOMAINS = [
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'outlook.de', 'hotmail.de', 'live.de',
  'outlook.co.uk', 'hotmail.co.uk', 'live.co.uk',
  'outlook.fr', 'hotmail.fr', 'live.fr',
  'outlook.it', 'hotmail.it', 'live.it',
  'outlook.es', 'hotmail.es', 'live.es',
  'outlook.at', 'hotmail.at', 'live.at',
  'outlook.ch', 'hotmail.ch', 'live.ch'
];

// v1.15.0: Check if email is Microsoft
const isMicrosoftEmail = (email) => {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return MICROSOFT_DOMAINS.includes(domain);
};

// v1.15.0: Server Presets with OAuth2 support for Microsoft
const SERVER_PRESETS = [
  { 
    id: 'custom', 
    name: 'Benutzerdefiniert',
    icon: '⚙️',
    imap: { host: '', port: '993', tls: true },
    smtp: { host: '', port: '465', secure: true }
  },
  { 
    id: 'microsoft', 
    name: 'Microsoft 365 / Outlook',
    icon: '📬',
    imap: { host: 'outlook.office365.com', port: '993', tls: true },
    smtp: { host: 'smtp.office365.com', port: '587', secure: false, starttls: true },
    note: 'Outlook.com, Hotmail, Live.com, Microsoft 365',
    autoFillUsername: true,
    supportsOAuth2: true,
    requiresAppPassword: true,
    appPasswordHelp: 'https://account.microsoft.com/security'
  },
  { 
    id: 'gmail', 
    name: 'Gmail',
    icon: '📧',
    imap: { host: 'imap.gmail.com', port: '993', tls: true },
    smtp: { host: 'smtp.gmail.com', port: '465', secure: true },
    note: 'Erfordert App-Passwort',
    help: 'https://support.google.com/accounts/answer/185833',
    autoFillUsername: true,
    requiresAppPassword: true
  },
  { 
    id: 'icloud', 
    name: 'iCloud Mail',
    icon: '☁️',
    imap: { host: 'imap.mail.me.com', port: '993', tls: true },
    smtp: { host: 'smtp.mail.me.com', port: '587', secure: false, starttls: true },
    note: 'Erfordert App-Passwort',
    help: 'https://support.apple.com/de-de/HT204397',
    requiresAppPassword: true
  },
  { 
    id: 'yahoo', 
    name: 'Yahoo Mail',
    icon: '📨',
    imap: { host: 'imap.mail.yahoo.com', port: '993', tls: true },
    smtp: { host: 'smtp.mail.yahoo.com', port: '465', secure: true },
    note: 'Erfordert App-Passwort',
    help: 'https://help.yahoo.com/kb/SLN15241.html',
    requiresAppPassword: true
  },
  { 
    id: 'gmx', 
    name: 'GMX',
    icon: '📩',
    imap: { host: 'imap.gmx.net', port: '993', tls: true },
    smtp: { host: 'mail.gmx.net', port: '587', secure: false, starttls: true }
  },
  { 
    id: 'webde', 
    name: 'WEB.DE',
    icon: '📪',
    imap: { host: 'imap.web.de', port: '993', tls: true },
    smtp: { host: 'smtp.web.de', port: '587', secure: false, starttls: true }
  },
  { 
    id: 'ionos', 
    name: 'IONOS / 1&1',
    icon: '🌐',
    imap: { host: 'imap.ionos.de', port: '993', tls: true },
    smtp: { host: 'smtp.ionos.de', port: '587', secure: false, starttls: true }
  }
];

// v1.15.0: Microsoft App-Password Help Modal Component
function MicrosoftAppPasswordHelp({ isOpen, onClose, c }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] overflow-auto py-8">
      <div className={`${c.card} ${c.border} border rounded-xl p-6 w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${c.text} flex items-center gap-2`}>
            <Key className="w-5 h-5 text-blue-400" />
            App-Passwort für Microsoft erstellen
          </h3>
          <button onClick={onClose} className={`${c.textSecondary} hover:${c.text} text-xl`}>×</button>
        </div>
        
        <div className="space-y-4">
          {/* Info Banner */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className={`text-sm ${c.text}`}>
              <strong>Warum App-Passwort?</strong> Microsoft erlaubt keinen direkten IMAP/SMTP-Zugriff mit dem normalen Passwort. 
              Ein App-Passwort ist ein spezielles Passwort nur für diese App.
            </p>
          </div>
          
          {/* Steps */}
          <div className="space-y-3">
            <h4 className={`font-medium ${c.text}`}>Schritt-für-Schritt-Anleitung:</h4>
            
            <div className={`p-3 ${c.bgTertiary} rounded-lg`}>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <div>
                  <p className={`font-medium ${c.text}`}>Microsoft-Sicherheit öffnen</p>
                  <p className={`text-sm ${c.textSecondary}`}>Gehe zu deinem Microsoft-Konto:</p>
                  <a 
                    href="https://account.microsoft.com/security" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-400 hover:underline text-sm mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    account.microsoft.com/security
                  </a>
                </div>
              </div>
            </div>
            
            <div className={`p-3 ${c.bgTertiary} rounded-lg`}>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <div>
                  <p className={`font-medium ${c.text}`}>Zwei-Faktor-Authentifizierung aktivieren</p>
                  <p className={`text-sm ${c.textSecondary}`}>
                    Falls noch nicht aktiv: Klicke auf "Zweistufige Überprüfung" → "Aktivieren"
                  </p>
                </div>
              </div>
            </div>
            
            <div className={`p-3 ${c.bgTertiary} rounded-lg`}>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <div>
                  <p className={`font-medium ${c.text}`}>App-Passwort erstellen</p>
                  <p className={`text-sm ${c.textSecondary}`}>
                    Unter "Erweiterte Sicherheitsoptionen" → "App-Kennwörter" → "Neues App-Kennwort erstellen"
                  </p>
                </div>
              </div>
            </div>
            
            <div className={`p-3 ${c.bgTertiary} rounded-lg`}>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                <div>
                  <p className={`font-medium ${c.text}`}>Passwort kopieren</p>
                  <p className={`text-sm ${c.textSecondary}`}>
                    Das generierte Passwort (z.B. "xxxx xxxx xxxx xxxx") kopieren und hier einfügen
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Warning */}
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className={`text-sm ${c.text} flex items-start gap-2`}>
              <span className="text-lg">⚠️</span>
              <span>
                <strong>Wichtig:</strong> Das App-Passwort wird nur einmal angezeigt. 
                Speichere es sicher ab oder füge es direkt in CoreMail ein.
              </span>
            </p>
          </div>
          
          {/* Alternative */}
          <div className="pt-3 border-t border-gray-600">
            <p className={`text-xs ${c.textSecondary}`}>
              <strong>Alternative:</strong> Wenn App-Passwörter nicht verfügbar sind (z.B. Firmen-Konten), 
              kann OAuth2 verwendet werden. Dies erfordert jedoch eine eigene Azure AD App-Registrierung.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <button 
            onClick={onClose}
            className={`px-4 py-2 ${c.accentBg} text-white rounded-lg hover:opacity-90 transition-opacity`}
          >
            Verstanden
          </button>
        </div>
      </div>
    </div>
  );
}

// v1.15.0: Quick Microsoft Setup Modal
function MicrosoftQuickSetup({ isOpen, onClose, onComplete, c }) {
  const [email, setEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  
  if (!isOpen) return null;
  
  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const imapConfig = {
        host: 'outlook.office365.com',
        port: '993',
        username: email,
        password: appPassword,
        tls: true
      };
      const result = await window.electronAPI.testImap(imapConfig);
      setTestResult(result);
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    }
    setTesting(false);
  };
  
  const handleComplete = () => {
    if (testResult?.success) {
      onComplete({
        name: `Microsoft (${email.split('@')[0]})`,
        email,
        appPassword,
        imap: {
          host: 'outlook.office365.com',
          port: '993',
          username: email,
          password: appPassword,
          tls: true
        },
        smtp: {
          host: 'smtp.office365.com',
          port: '587',
          username: email,
          password: appPassword,
          secure: false,
          fromEmail: email
        }
      });
      onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
      <div className={`${c.card} ${c.border} border rounded-xl p-6 w-full max-w-md mx-4`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${c.text} flex items-center gap-2`}>
            <Zap className="w-5 h-5 text-yellow-400" />
            Microsoft-Konto Schnelleinrichtung
          </h3>
          <button onClick={onClose} className={`${c.textSecondary} hover:${c.text} text-xl`}>×</button>
        </div>
        
        {/* Recommended Badge */}
        <div className="mb-4 p-2 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
          <span className="text-sm text-green-400 font-medium">✓ Empfohlene Methode - Einfach & Sicher</span>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className={`block text-sm ${c.textSecondary} mb-1`}>E-Mail-Adresse</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@outlook.com"
              className={`w-full px-4 py-3 rounded-lg ${c.input} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={`text-sm ${c.textSecondary}`}>App-Passwort</label>
              <button
                onClick={() => setShowHelp(true)}
                className="text-xs text-blue-400 hover:underline flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" />
                Wie erstelle ich ein App-Passwort?
              </button>
            </div>
            <input
              type="password"
              value={appPassword}
              onChange={e => setAppPassword(e.target.value)}
              placeholder="xxxx xxxx xxxx xxxx"
              className={`w-full px-4 py-3 rounded-lg ${c.input} focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono`}
            />
          </div>
          
          {/* Test Result */}
          {testResult && (
            <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <div className={`flex items-center gap-2 ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                {testResult.success ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span className="font-medium">{testResult.success ? 'Verbindung erfolgreich!' : 'Verbindung fehlgeschlagen'}</span>
              </div>
              {!testResult.success && testResult.error && (
                <p className="text-sm text-red-300 mt-1">{testResult.error}</p>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleTest}
              disabled={!email || !appPassword || testing}
              className={`flex-1 px-4 py-3 border ${c.border} ${c.hover} rounded-lg ${c.text} flex items-center justify-center gap-2 disabled:opacity-50`}
            >
              {testing ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {testing ? 'Teste...' : 'Verbindung testen'}
            </button>
            <button
              onClick={handleComplete}
              disabled={!testResult?.success}
              className={`flex-1 px-4 py-3 ${c.accentBg} text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50`}
            >
              <Zap className="w-4 h-4" />
              Konto hinzufügen
            </button>
          </div>
          
          {/* Info */}
          <div className={`text-xs ${c.textSecondary} text-center pt-2`}>
            Server werden automatisch konfiguriert (outlook.office365.com)
          </div>
        </div>
        
        {/* Help Modal */}
        <MicrosoftAppPasswordHelp isOpen={showHelp} onClose={() => setShowHelp(false)} c={c} />
      </div>
    </div>
  );
}

function AccountManager() {
  const { currentTheme } = useTheme();
  const { accounts, categories, addAccount, updateAccount, deleteAccount, addCategory, deleteCategory } = useAccounts();
  const [editingAccount, setEditingAccount] = useState(null);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [testing, setTesting] = useState({ imap: false, smtp: false });
  const [testResults, setTestResults] = useState({ imap: null, smtp: null });
  const [selectedPreset, setSelectedPreset] = useState('custom');
  const c = currentTheme.colors;
  
  // v1.15.0: Quick setup modals
  const [showMicrosoftQuickSetup, setShowMicrosoftQuickSetup] = useState(false);
  const [showAppPasswordHelp, setShowAppPasswordHelp] = useState(false);
  const [authMethod, setAuthMethod] = useState('imap'); // 'imap' or 'oauth2'
  
  const [accountForm, setAccountForm] = useState({
    name: '',
    categoryId: 'work',
    imap: { host: '', port: '993', username: '', password: '', tls: true },
    smtp: { host: '', port: '465', username: '', password: '', secure: true, fromEmail: '' }
  });

  // OAuth2 state
  const [oauth2Status, setOauth2Status] = useState({ loading: false, error: null, success: false });
  const [useOAuth2, setUseOAuth2] = useState(false);
  const [oauth2Tokens, setOauth2Tokens] = useState(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [customClientId, setCustomClientId] = useState('');
  const [showAzureAdHelp, setShowAzureAdHelp] = useState(false);

  const currentPreset = useMemo(() => {
    return SERVER_PRESETS.find(p => p.id === selectedPreset);
  }, [selectedPreset]);
  
  const showOAuth2Panel = useMemo(() => {
    return currentPreset?.supportsOAuth2 || (editingAccount && accountForm?.oauth2);
  }, [currentPreset, editingAccount, accountForm]);

  const [categoryForm, setCategoryForm] = useState({ name: '', color: '#3b82f6' });

  // v1.15.0: Auto-detect Microsoft email and apply preset
  const handleEmailChange = (email) => {
    const preset = SERVER_PRESETS.find(p => p.id === selectedPreset);
    const shouldAutoFill = preset?.autoFillUsername;
    
    // v1.15.0: Auto-detect Microsoft domains
    if (isMicrosoftEmail(email) && selectedPreset === 'custom') {
      applyPreset('microsoft');
    }
    
    setAccountForm(f => ({
      ...f,
      imap: {
        ...f.imap,
        username: email
      },
      smtp: {
        ...f.smtp,
        username: shouldAutoFill ? email : f.smtp.username,
        fromEmail: email
      }
    }));
  };

  const applyPreset = (presetId) => {
    setSelectedPreset(presetId);
    const preset = SERVER_PRESETS.find(p => p.id === presetId);
    if (preset && presetId !== 'custom') {
      setAccountForm(f => ({
        ...f,
        imap: {
          ...f.imap,
          host: preset.imap.host,
          port: preset.imap.port,
          tls: preset.imap.tls
        },
        smtp: {
          ...f.smtp,
          host: preset.smtp.host,
          port: preset.smtp.port,
          secure: preset.smtp.secure
        }
      }));
    }
  };

  const copyImapToSmtp = () => {
    setAccountForm(f => ({
      ...f,
      smtp: {
        ...f.smtp,
        username: f.imap.username,
        password: f.imap.password
      }
    }));
  };

  // OAuth2 Microsoft Login
  const handleMicrosoftOAuth2Login = async () => {
    setOauth2Status({ loading: true, error: null, success: false });
    try {
      const clientIdToUse = customClientId.trim() || null;
      const result = await window.electronAPI.oauth2StartMicrosoft(clientIdToUse);
      if (result.success) {
        setOauth2Tokens(result.tokens);
        setOauth2Status({ loading: false, error: null, success: true });
        
        setAccountForm(f => ({
          ...f,
          name: f.name || `Microsoft (${result.tokens.email})`,
          imap: {
            ...f.imap,
            host: 'outlook.office365.com',
            port: '993',
            username: result.tokens.email,
            password: '',
            tls: true
          },
          smtp: {
            ...f.smtp,
            host: 'smtp.office365.com',
            port: '587',
            username: result.tokens.email,
            password: '',
            secure: false,
            fromEmail: result.tokens.email
          }
        }));
      } else {
        setOauth2Status({ loading: false, error: result.error, success: false });
      }
    } catch (err) {
      setOauth2Status({ loading: false, error: err.message, success: false });
    }
  };

  const resetForm = () => {
    setAccountForm({
      name: '',
      categoryId: 'work',
      imap: { host: '', port: '993', username: '', password: '', tls: true },
      smtp: { host: '', port: '465', username: '', password: '', secure: true, fromEmail: '' }
    });
    setEditingAccount(null);
    setShowAccountForm(false);
    setTestResults({ imap: null, smtp: null });
    setSelectedPreset('custom');
    setOauth2Status({ loading: false, error: null, success: false });
    setOauth2Tokens(null);
    setUseOAuth2(false);
    setShowAdvancedSettings(false);
    setCustomClientId('');
    setShowAzureAdHelp(false);
    setAuthMethod('imap');
  };

  const handleEditAccount = (account) => {
    setAccountForm(account);
    setEditingAccount(account.id);
    setShowAccountForm(true);
    if (account.oauth2) {
      setUseOAuth2(true);
      setOauth2Tokens(account.oauth2);
      setOauth2Status({ loading: false, error: null, success: true });
      setAuthMethod('oauth2');
      if (account.oauth2.customClientId) {
        setCustomClientId(account.oauth2.customClientId);
      }
    }
  };

  const handleSaveAccount = async () => {
    const accountData = { ...accountForm };
    if (useOAuth2 && oauth2Tokens) {
      accountData.oauth2 = {
        accessToken: oauth2Tokens.accessToken,
        refreshToken: oauth2Tokens.refreshToken,
        expiresAt: oauth2Tokens.expiresAt,
        email: oauth2Tokens.email,
        provider: oauth2Tokens.provider || 'microsoft',
        customClientId: customClientId.trim() || null
      };
    }
    
    if (editingAccount) {
      await updateAccount(editingAccount, accountData);
    } else {
      await addAccount(accountData);
    }
    resetForm();
  };

  // v1.15.0: Handle Microsoft Quick Setup completion
  const handleMicrosoftQuickSetupComplete = async (data) => {
    const accountData = {
      name: data.name,
      categoryId: 'work',
      imap: data.imap,
      smtp: data.smtp
    };
    await addAccount(accountData);
    setShowMicrosoftQuickSetup(false);
  };

  const handleTestImap = async () => {
    setTesting(t => ({ ...t, imap: true }));
    const result = await window.electronAPI.testImap(accountForm.imap);
    setTestResults(r => ({ ...r, imap: result }));
    setTesting(t => ({ ...t, imap: false }));
  };

  const handleTestSmtp = async () => {
    setTesting(t => ({ ...t, smtp: true }));
    const result = await window.electronAPI.testSmtp(accountForm.smtp);
    setTestResults(r => ({ ...r, smtp: result }));
    setTesting(t => ({ ...t, smtp: false }));
  };

  const handleAddCategory = async () => {
    if (categoryForm.name) {
      await addCategory(categoryForm);
      setCategoryForm({ name: '', color: '#3b82f6' });
      setShowCategoryForm(false);
    }
  };

  return (
    <div className={`flex-1 p-6 overflow-auto ${c.bg}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-2xl font-bold ${c.text}`}>Kontenverwaltung</h1>
          <div className="flex gap-2">
            {/* v1.15.0: Microsoft Quick Add Button */}
            <button
              onClick={() => setShowMicrosoftQuickSetup(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Microsoft hinzufügen
            </button>
            <button
              onClick={() => setShowAccountForm(true)}
              className={`px-4 py-2 ${c.accentBg} ${c.accentHover} text-white rounded-lg transition-colors`}
            >
              + Neues Konto
            </button>
          </div>
        </div>

        {/* v1.15.0: Quick Setup Info Banner */}
        <div className={`mb-6 p-4 ${c.card} ${c.border} border rounded-xl`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className={`font-medium ${c.text}`}>Neu: Vereinfachte Microsoft-Integration</h3>
              <p className={`text-sm ${c.textSecondary} mt-1`}>
                Mit "Microsoft hinzufügen" kannst du dein Outlook/Hotmail-Konto in nur 2 Schritten einrichten. 
                Alles andere wird automatisch konfiguriert!
              </p>
            </div>
          </div>
        </div>

        {/* Kategorien */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-lg font-semibold ${c.text}`}>Kategorien</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCategoryForm(true)}
                className={`text-sm ${c.accent} hover:underline`}
              >
                + Kategorie
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <div 
                key={cat.id} 
                className={`flex items-center gap-2 px-3 py-1.5 ${c.card} ${c.border} border rounded-full`}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className={c.text}>{cat.name}</span>
                {!['work', 'personal', 'other'].includes(cat.id) && (
                  <button 
                    onClick={() => deleteCategory(cat.id)}
                    className="text-red-400 hover:text-red-300 ml-1"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className={`mt-3 flex items-center gap-2 text-sm ${c.textSecondary}`}>
            <span>💡</span>
            <span>Kategorien bearbeiten (Name, Farbe, Icon)?</span>
            <span className={`${c.accent} font-medium`}>→ Einstellungen → Kategorien</span>
          </div>
        </div>

        {/* Kategorie hinzufügen Modal */}
        {showCategoryForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`${c.card} ${c.border} border rounded-xl p-6 w-96`}>
              <h3 className={`text-lg font-semibold ${c.text} mb-4`}>Neue Kategorie</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={categoryForm.name}
                  onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))}
                  className={`w-full px-4 py-2 rounded-lg ${c.input} focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                />
                <div className="flex items-center gap-3">
                  <span className={c.textSecondary}>Farbe:</span>
                  <input
                    type="color"
                    value={categoryForm.color}
                    onChange={e => setCategoryForm(f => ({ ...f, color: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowCategoryForm(false)} className={`px-4 py-2 ${c.textSecondary}`}>
                    Abbrechen
                  </button>
                  <button onClick={handleAddCategory} className={`px-4 py-2 ${c.accentBg} text-white rounded-lg`}>
                    Speichern
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Kontenliste */}
        <h2 className={`text-lg font-semibold ${c.text} mb-4`}>E-Mail-Konten</h2>
        {accounts.length === 0 ? (
          <div className={`${c.card} ${c.border} border rounded-xl p-8 text-center`}>
            <p className={c.textSecondary}>Noch keine Konten hinzugefügt.</p>
            <p className={`text-sm ${c.textSecondary} mt-2`}>
              Klicke auf "Microsoft hinzufügen" für eine schnelle Einrichtung.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map(account => {
              const cat = categories.find(c => c.id === account.categoryId);
              return (
                <div key={account.id} className={`${c.card} ${c.border} border rounded-xl p-4 flex items-center justify-between`}>
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat?.color || '#888' }} />
                    <div>
                      <div className={`font-medium ${c.text} flex items-center gap-2`}>
                        {account.name}
                        {account.oauth2 && (
                          <span className="px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            OAuth2
                          </span>
                        )}
                        {!account.oauth2 && isMicrosoftEmail(account.imap?.username) && (
                          <span className="px-1.5 py-0.5 text-xs bg-green-500/20 text-green-400 rounded flex items-center gap-1">
                            <Key className="w-3 h-3" />
                            App-Passwort
                          </span>
                        )}
                      </div>
                      <div className={`text-sm ${c.textSecondary}`}>{account.imap.username}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditAccount(account)}
                      className={`px-3 py-1.5 text-sm ${c.hover} ${c.text} rounded-lg transition-colors`}
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => deleteAccount(account.id)}
                      className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Account Form Modal */}
        {showAccountForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto py-8">
            <div className={`${c.card} ${c.border} border rounded-xl p-6 w-full max-w-2xl mx-4`}>
              <h3 className={`text-xl font-semibold ${c.text} mb-6`}>
                {editingAccount ? 'Konto bearbeiten' : 'Neues Konto'}
              </h3>
              
              <div className="space-y-6">
                {/* Basis-Infos */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm ${c.textSecondary} mb-1`}>Kontoname</label>
                    <input
                      type="text"
                      value={accountForm.name}
                      onChange={e => setAccountForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="z.B. Firma E-Mail"
                      className={`w-full px-4 py-2 rounded-lg ${c.input} focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm ${c.textSecondary} mb-1`}>Kategorie</label>
                    <select
                      value={accountForm.categoryId}
                      onChange={e => setAccountForm(f => ({ ...f, categoryId: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg ${c.input} focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Server Preset Selector */}
                {!editingAccount && (
                  <div className={`${c.bgTertiary} p-4 rounded-lg`}>
                    <h4 className={`font-medium ${c.text} mb-3`}>Server-Vorlage</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {SERVER_PRESETS.map(preset => (
                        <button
                          key={preset.id}
                          onClick={() => applyPreset(preset.id)}
                          className={`p-3 rounded-lg text-left transition-colors ${
                            selectedPreset === preset.id
                              ? `${c.accentBg} text-white`
                              : `${c.card} ${c.border} border ${c.hover}`
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{preset.icon}</span>
                            <span className={`text-sm font-medium ${selectedPreset === preset.id ? 'text-white' : c.text}`}>
                              {preset.name}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {currentPreset?.note && (
                      <p className={`text-xs ${c.textSecondary} mt-2 flex items-center gap-1`}>
                        ℹ️ {currentPreset.note}
                      </p>
                    )}
                  </div>
                )}

                {/* v1.15.0: Auth Method Selection for Microsoft */}
                {showOAuth2Panel && !editingAccount && (
                  <div className={`p-4 rounded-lg border ${c.border} ${c.card}`}>
                    <h4 className={`font-medium ${c.text} mb-3 flex items-center gap-2`}>
                      <Shield className="w-5 h-5 text-blue-400" />
                      Authentifizierungsmethode
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* IMAP/SMTP Option */}
                      <button
                        onClick={() => setAuthMethod('imap')}
                        className={`p-4 rounded-lg text-left transition-all ${
                          authMethod === 'imap' 
                            ? 'bg-green-500/20 border-2 border-green-500' 
                            : `${c.bgTertiary} border-2 border-transparent hover:border-gray-600`
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Key className={`w-5 h-5 ${authMethod === 'imap' ? 'text-green-400' : c.textSecondary}`} />
                          <span className={`font-medium ${authMethod === 'imap' ? 'text-green-400' : c.text}`}>
                            IMAP/SMTP
                          </span>
                          <span className="px-1.5 py-0.5 text-xs bg-green-500/30 text-green-400 rounded">
                            EMPFOHLEN
                          </span>
                        </div>
                        <p className={`text-xs ${c.textSecondary}`}>
                          Mit App-Passwort. Einfach einzurichten, keine Azure AD App nötig.
                        </p>
                      </button>
                      
                      {/* OAuth2 Option */}
                      <button
                        onClick={() => setAuthMethod('oauth2')}
                        className={`p-4 rounded-lg text-left transition-all ${
                          authMethod === 'oauth2' 
                            ? 'bg-blue-500/20 border-2 border-blue-500' 
                            : `${c.bgTertiary} border-2 border-transparent hover:border-gray-600`
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className={`w-5 h-5 ${authMethod === 'oauth2' ? 'text-blue-400' : c.textSecondary}`} />
                          <span className={`font-medium ${authMethod === 'oauth2' ? 'text-blue-400' : c.text}`}>
                            OAuth2
                          </span>
                          <span className="px-1.5 py-0.5 text-xs bg-yellow-500/30 text-yellow-400 rounded">
                            ERWEITERT
                          </span>
                        </div>
                        <p className={`text-xs ${c.textSecondary}`}>
                          Erfordert eigene Azure AD App-Registrierung.
                        </p>
                      </button>
                    </div>
                  </div>
                )}

                {/* IMAP/SMTP with App-Password Help (for Microsoft) */}
                {(authMethod === 'imap' || !showOAuth2Panel) && (
                  <>
                    {/* v1.15.0: App-Password Info for Microsoft */}
                    {selectedPreset === 'microsoft' && !editingAccount && (
                      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className={`text-sm ${c.text}`}>
                              <strong>Microsoft erfordert ein App-Passwort</strong> für IMAP/SMTP-Zugriff.
                            </p>
                            <button
                              onClick={() => setShowAppPasswordHelp(true)}
                              className="mt-2 text-sm text-blue-400 hover:underline flex items-center gap-1"
                            >
                              <HelpCircle className="w-4 h-4" />
                              Wie erstelle ich ein App-Passwort?
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* IMAP */}
                    <div className={`${c.bgTertiary} p-4 rounded-lg`}>
                      <h4 className={`font-medium ${c.text} mb-3`}>IMAP (Empfang)</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Host (z.B. imap.gmail.com)"
                          value={accountForm.imap.host}
                          onChange={e => setAccountForm(f => ({ ...f, imap: { ...f.imap, host: e.target.value }}))}
                          className={`px-3 py-2 rounded-lg ${c.input} text-sm`}
                        />
                        <input
                          type="text"
                          placeholder="Port (993)"
                          value={accountForm.imap.port}
                          onChange={e => setAccountForm(f => ({ ...f, imap: { ...f.imap, port: e.target.value }}))}
                          className={`px-3 py-2 rounded-lg ${c.input} text-sm`}
                        />
                        <input
                          type="email"
                          placeholder="E-Mail-Adresse"
                          value={accountForm.imap.username}
                          onChange={e => handleEmailChange(e.target.value)}
                          className={`px-3 py-2 rounded-lg ${c.input} text-sm`}
                        />
                        <input
                          type="password"
                          placeholder={currentPreset?.requiresAppPassword ? "App-Passwort" : "Passwort"}
                          value={accountForm.imap.password}
                          onChange={e => setAccountForm(f => ({ ...f, imap: { ...f.imap, password: e.target.value }}))}
                          className={`px-3 py-2 rounded-lg ${c.input} text-sm`}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <label className={`flex items-center gap-2 ${c.textSecondary} text-sm`}>
                          <input
                            type="checkbox"
                            checked={accountForm.imap.tls}
                            onChange={e => setAccountForm(f => ({ ...f, imap: { ...f.imap, tls: e.target.checked }}))}
                          />
                          TLS/SSL
                        </label>
                        <button
                          onClick={handleTestImap}
                          disabled={testing.imap}
                          className={`px-3 py-1 text-sm ${c.accentBg} text-white rounded flex items-center gap-1`}
                        >
                          {testing.imap ? <Loader className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                          {testing.imap ? 'Teste...' : 'Testen'}
                        </button>
                      </div>
                      {testResults.imap && (
                        <div className={`mt-2 text-sm flex items-center gap-1 ${testResults.imap.success ? 'text-green-400' : 'text-red-400'}`}>
                          {testResults.imap.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                          {testResults.imap.success ? 'Verbindung OK' : testResults.imap.error}
                        </div>
                      )}
                    </div>

                    {/* SMTP */}
                    <div className={`${c.bgTertiary} p-4 rounded-lg`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className={`font-medium ${c.text}`}>SMTP (Versand)</h4>
                        <button
                          onClick={copyImapToSmtp}
                          className={`text-xs ${c.accent} hover:underline flex items-center gap-1`}
                        >
                          <Mail className="w-3 h-3" />
                          Von IMAP kopieren
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Host (z.B. smtp.gmail.com)"
                          value={accountForm.smtp.host}
                          onChange={e => setAccountForm(f => ({ ...f, smtp: { ...f.smtp, host: e.target.value }}))}
                          className={`px-3 py-2 rounded-lg ${c.input} text-sm`}
                        />
                        <input
                          type="text"
                          placeholder="Port (465 oder 587)"
                          value={accountForm.smtp.port}
                          onChange={e => setAccountForm(f => ({ ...f, smtp: { ...f.smtp, port: e.target.value }}))}
                          className={`px-3 py-2 rounded-lg ${c.input} text-sm`}
                        />
                        <input
                          type="text"
                          placeholder="Benutzername"
                          value={accountForm.smtp.username}
                          onChange={e => setAccountForm(f => ({ ...f, smtp: { ...f.smtp, username: e.target.value }}))}
                          className={`px-3 py-2 rounded-lg ${c.input} text-sm`}
                        />
                        <input
                          type="password"
                          placeholder={currentPreset?.requiresAppPassword ? "App-Passwort" : "Passwort"}
                          value={accountForm.smtp.password}
                          onChange={e => setAccountForm(f => ({ ...f, smtp: { ...f.smtp, password: e.target.value }}))}
                          className={`px-3 py-2 rounded-lg ${c.input} text-sm`}
                        />
                        <input
                          type="email"
                          placeholder="Absender E-Mail"
                          value={accountForm.smtp.fromEmail}
                          onChange={e => setAccountForm(f => ({ ...f, smtp: { ...f.smtp, fromEmail: e.target.value }}))}
                          className={`col-span-2 px-3 py-2 rounded-lg ${c.input} text-sm`}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <label className={`flex items-center gap-2 ${c.textSecondary} text-sm`}>
                          <input
                            type="checkbox"
                            checked={accountForm.smtp.secure}
                            onChange={e => setAccountForm(f => ({ ...f, smtp: { ...f.smtp, secure: e.target.checked }}))}
                          />
                          SSL/TLS {accountForm.smtp.port === '587' && <span className="text-xs text-yellow-400">(STARTTLS)</span>}
                        </label>
                        <button
                          onClick={handleTestSmtp}
                          disabled={testing.smtp}
                          className={`px-3 py-1 text-sm ${c.accentBg} text-white rounded flex items-center gap-1`}
                        >
                          {testing.smtp ? <Loader className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                          {testing.smtp ? 'Teste...' : 'Testen'}
                        </button>
                      </div>
                      {testResults.smtp && (
                        <div className={`mt-2 text-sm flex items-center gap-1 ${testResults.smtp.success ? 'text-green-400' : 'text-red-400'}`}>
                          {testResults.smtp.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                          {testResults.smtp.success ? 'Verbindung OK' : testResults.smtp.error}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* OAuth2 Panel */}
                {showOAuth2Panel && authMethod === 'oauth2' && (
                  <div className={`p-4 rounded-lg border-2 ${oauth2Status.success ? 'border-green-500/50 bg-green-900/10' : 'border-blue-500 bg-blue-900/20'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`font-medium ${c.text} flex items-center gap-2`}>
                        <Shield className="w-5 h-5 text-blue-400" />
                        Microsoft OAuth2 Anmeldung
                      </h4>
                      {oauth2Status.success && (
                        <span className="text-sm text-green-400 flex items-center gap-1 font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Verbunden
                        </span>
                      )}
                    </div>
                    
                    {/* Warning about Azure AD */}
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-4">
                      <p className={`text-sm ${c.text} flex items-start gap-2`}>
                        <span className="text-lg">⚠️</span>
                        <span>
                          <strong>Hinweis:</strong> OAuth2 erfordert eine eigene Azure AD App-Registrierung. 
                          Für die meisten Benutzer ist IMAP/SMTP mit App-Passwort einfacher.
                        </span>
                      </p>
                    </div>
                    
                    {!oauth2Status.success ? (
                      <div className="space-y-4">
                        {/* Azure AD Custom Client-ID */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <label className={`text-sm ${c.textSecondary}`}>
                              Azure AD Client-ID (erforderlich)
                            </label>
                            <button
                              onClick={() => setShowAzureAdHelp(!showAzureAdHelp)}
                              className={`${c.textSecondary} hover:text-blue-400 transition-colors`}
                            >
                              <HelpCircle className="w-4 h-4" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={customClientId}
                            onChange={e => setCustomClientId(e.target.value)}
                            placeholder="d3590ed6-52b3-4102-aeff-aad2292ab01c"
                            className={`w-full px-3 py-2 rounded-lg ${c.input} text-sm font-mono`}
                          />
                        </div>

                        {showAzureAdHelp && (
                          <div className={`p-3 rounded-lg border ${c.border} ${c.card} text-sm space-y-2`}>
                            <h5 className={`font-medium ${c.text}`}>🔧 Azure AD App-Registrierung</h5>
                            <ol className={`list-decimal list-inside space-y-1 ${c.textSecondary}`}>
                              <li>Öffne <a href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Azure Portal → App-Registrierungen</a></li>
                              <li>Erstelle eine neue App-Registrierung</li>
                              <li>Setze Redirect URI auf: <code className="text-xs bg-black/30 px-1 rounded">http://localhost:8847/oauth/callback</code></li>
                              <li>Füge API-Berechtigungen hinzu (Mail.Read, Mail.ReadWrite, Mail.Send, IMAP.AccessAsUser.All, SMTP.Send)</li>
                              <li>Kopiere die Client-ID und füge sie hier ein</li>
                            </ol>
                          </div>
                        )}
                        
                        <button
                          onClick={handleMicrosoftOAuth2Login}
                          disabled={oauth2Status.loading || !customClientId.trim()}
                          className="w-full px-4 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg hover:shadow-blue-500/25 text-lg font-medium"
                        >
                          {oauth2Status.loading ? (
                            <>
                              <Loader className="w-6 h-6 animate-spin" />
                              Browser öffnet sich...
                            </>
                          ) : (
                            <>
                              <LogIn className="w-6 h-6" />
                              Mit Microsoft anmelden
                            </>
                          )}
                        </button>
                        
                        {oauth2Status.error && (
                          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-400 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {oauth2Status.error}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className={`flex items-center gap-3 p-3 ${c.card} rounded-lg border ${c.border}`}>
                          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                            <Mail className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <p className={`font-medium ${c.text}`}>{oauth2Tokens?.email}</p>
                            <p className={`text-xs text-green-400`}>✓ OAuth2 verbunden</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleMicrosoftOAuth2Login}
                            className={`flex-1 px-3 py-2 text-sm ${c.hover} ${c.text} rounded-lg flex items-center justify-center gap-1 border ${c.border}`}
                          >
                            <RefreshCw className="w-4 h-4" />
                            Neu verbinden
                          </button>
                          <button
                            onClick={() => {
                              setOauth2Status({ loading: false, error: null, success: false });
                              setOauth2Tokens(null);
                              setUseOAuth2(false);
                            }}
                            className="px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded-lg border border-red-500/30"
                          >
                            Trennen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <button onClick={resetForm} className={`px-4 py-2 ${c.textSecondary}`}>
                    Abbrechen
                  </button>
                  <button 
                    onClick={handleSaveAccount}
                    className={`px-6 py-2 ${c.accentBg} ${c.accentHover} text-white rounded-lg transition-colors`}
                  >
                    Speichern
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* v1.15.0: Microsoft Quick Setup Modal */}
        <MicrosoftQuickSetup 
          isOpen={showMicrosoftQuickSetup} 
          onClose={() => setShowMicrosoftQuickSetup(false)}
          onComplete={handleMicrosoftQuickSetupComplete}
          c={c}
        />

        {/* v1.15.0: App Password Help Modal */}
        <MicrosoftAppPasswordHelp 
          isOpen={showAppPasswordHelp} 
          onClose={() => setShowAppPasswordHelp(false)} 
          c={c} 
        />
      </div>
    </div>
  );
}

export default AccountManager;
