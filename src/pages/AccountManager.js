import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Settings, Mail, Loader, LogIn, Shield, RefreshCw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../context/AccountContext';

// v1.10.0: Server Presets with OAuth2 support for Microsoft
const SERVER_PRESETS = [
  { 
    id: 'custom', 
    name: 'Benutzerdefiniert',
    icon: '⚙️',
    imap: { host: '', port: '993', tls: true },
    smtp: { host: '', port: '465', secure: true }
  },
  { 
    id: 'gmail', 
    name: 'Gmail',
    icon: '📧',
    imap: { host: 'imap.gmail.com', port: '993', tls: true },
    smtp: { host: 'smtp.gmail.com', port: '465', secure: true },
    note: 'Erfordert App-Passwort',
    help: 'https://support.google.com/accounts/answer/185833'
  },
  { 
    id: 'outlook', 
    name: 'Outlook.com / Hotmail',
    icon: '📬',
    imap: { host: 'outlook.office365.com', port: '993', tls: true },
    smtp: { host: 'smtp.office365.com', port: '587', secure: false, starttls: true },
    note: 'Outlook.com, Hotmail, Live.com',
    autoFillUsername: true,
    supportsOAuth2: true  // v1.10.0: OAuth2 available
  },
  { 
    id: 'exchange', 
    name: 'Microsoft 365 / Exchange',
    icon: '🏢',
    imap: { host: 'outlook.office365.com', port: '993', tls: true },
    smtp: { host: 'smtp.office365.com', port: '587', secure: false, starttls: true },
    note: 'Für Firmen-Exchange mit IMAP aktiviert',
    help: 'https://support.microsoft.com/de-de/office/pop-imap-und-smtp-einstellungen',
    autoFillUsername: true,
    supportsOAuth2: true  // v1.10.0: OAuth2 available
  },
  { 
    id: 'icloud', 
    name: 'iCloud Mail',
    icon: '☁️',
    imap: { host: 'imap.mail.me.com', port: '993', tls: true },
    smtp: { host: 'smtp.mail.me.com', port: '587', secure: false, starttls: true },
    note: 'Erfordert App-Passwort',
    help: 'https://support.apple.com/de-de/HT204397'
  },
  { 
    id: 'yahoo', 
    name: 'Yahoo Mail',
    icon: '📨',
    imap: { host: 'imap.mail.yahoo.com', port: '993', tls: true },
    smtp: { host: 'smtp.mail.yahoo.com', port: '465', secure: true },
    note: 'Erfordert App-Passwort',
    help: 'https://help.yahoo.com/kb/SLN15241.html'
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
  
  // v1.10.0: OAuth2 state
  const [oauth2Status, setOauth2Status] = useState({ loading: false, error: null, success: false });
  const [useOAuth2, setUseOAuth2] = useState(false);
  const [oauth2Tokens, setOauth2Tokens] = useState(null);

  const [accountForm, setAccountForm] = useState({
    name: '',
    categoryId: 'work',
    imap: { host: '', port: '993', username: '', password: '', tls: true },
    smtp: { host: '', port: '465', username: '', password: '', secure: true, fromEmail: '' }
  });

  const [categoryForm, setCategoryForm] = useState({ name: '', color: '#3b82f6' });

  // v1.8.2: Apply preset with improved auto-fill
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

  // v1.8.2: Auto-fill username from email
  const handleEmailChange = (email) => {
    const preset = SERVER_PRESETS.find(p => p.id === selectedPreset);
    const shouldAutoFill = preset?.autoFillUsername;
    
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

  // v1.8.2: Quick setup - copy credentials between IMAP and SMTP
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

  // v1.10.0: OAuth2 Microsoft Login
  const handleMicrosoftOAuth2Login = async () => {
    setOauth2Status({ loading: true, error: null, success: false });
    try {
      const result = await window.electronAPI.oauth2StartMicrosoft();
      if (result.success) {
        setOauth2Tokens(result.tokens);
        setOauth2Status({ loading: false, error: null, success: true });
        
        // Auto-fill form with OAuth2 data
        setAccountForm(f => ({
          ...f,
          name: f.name || `Microsoft (${result.tokens.email})`,
          imap: {
            ...f.imap,
            host: 'outlook.office365.com',
            port: '993',
            username: result.tokens.email,
            password: '', // OAuth2 doesn't use password
            tls: true
          },
          smtp: {
            ...f.smtp,
            host: 'smtp.office365.com',
            port: '587',
            username: result.tokens.email,
            password: '', // OAuth2 doesn't use password
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
    // v1.10.0: Reset OAuth2 state
    setOauth2Status({ loading: false, error: null, success: false });
    setOauth2Tokens(null);
    setUseOAuth2(false);
  };

  const handleEditAccount = (account) => {
    setAccountForm(account);
    setEditingAccount(account.id);
    setShowAccountForm(true);
    // v1.10.0: Check if account uses OAuth2
    if (account.oauth2) {
      setUseOAuth2(true);
      setOauth2Tokens(account.oauth2);
      setOauth2Status({ loading: false, error: null, success: true });
    }
  };

  const handleSaveAccount = async () => {
    // v1.10.0: Include OAuth2 tokens if available
    const accountData = { ...accountForm };
    if (useOAuth2 && oauth2Tokens) {
      accountData.oauth2 = {
        accessToken: oauth2Tokens.accessToken,
        refreshToken: oauth2Tokens.refreshToken,
        expiresAt: oauth2Tokens.expiresAt,
        email: oauth2Tokens.email,
        provider: oauth2Tokens.provider || 'microsoft'
      };
    }
    
    if (editingAccount) {
      await updateAccount(editingAccount, accountData);
    } else {
      await addAccount(accountData);
    }
    resetForm();
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
          <button
            onClick={() => setShowAccountForm(true)}
            className={`px-4 py-2 ${c.accentBg} ${c.accentHover} text-white rounded-lg transition-colors`}
          >
            + Neues Konto
          </button>
        </div>

        {/* Kategorien */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-lg font-semibold ${c.text}`}>Kategorien</h2>
            <button
              onClick={() => setShowCategoryForm(true)}
              className={`text-sm ${c.accent} hover:underline`}
            >
              + Kategorie
            </button>
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
                        {/* v1.10.0: OAuth2 badge */}
                        {account.oauth2 && (
                          <span className="px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            OAuth2
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

                {/* v1.8.0: Server Preset Selector */}
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
                    {SERVER_PRESETS.find(p => p.id === selectedPreset)?.note && (
                      <p className={`text-xs ${c.textSecondary} mt-2 flex items-center gap-1`}>
                        ℹ️ {SERVER_PRESETS.find(p => p.id === selectedPreset)?.note}
                      </p>
                    )}
                  </div>
                )}

                {/* v1.10.0: OAuth2 Panel for Microsoft */}
                {(selectedPreset === 'outlook' || selectedPreset === 'exchange' || (editingAccount && accountForm.oauth2)) && (
                  <div className={`${c.bgTertiary} p-4 rounded-lg border-2 ${oauth2Status.success ? 'border-green-500/50' : 'border-blue-500/50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`font-medium ${c.text} flex items-center gap-2`}>
                        <Shield className="w-4 h-4 text-blue-400" />
                        Microsoft OAuth2 Anmeldung
                      </h4>
                      {oauth2Status.success && (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Verbunden
                        </span>
                      )}
                    </div>
                    
                    {!oauth2Status.success ? (
                      <div className="space-y-3">
                        <p className={`text-sm ${c.textSecondary}`}>
                          Melden Sie sich sicher mit Ihrem Microsoft-Konto an. Es öffnet sich ein Browser-Fenster zur Anmeldung.
                        </p>
                        <button
                          onClick={handleMicrosoftOAuth2Login}
                          disabled={oauth2Status.loading}
                          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                          {oauth2Status.loading ? (
                            <>
                              <Loader className="w-5 h-5 animate-spin" />
                              Browser öffnet sich...
                            </>
                          ) : (
                            <>
                              <LogIn className="w-5 h-5" />
                              Mit Microsoft anmelden
                            </>
                          )}
                        </button>
                        {oauth2Status.error && (
                          <div className="text-sm text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {oauth2Status.error}
                          </div>
                        )}
                        <p className={`text-xs ${c.textSecondary}`}>
                          💡 OAuth2 ist sicherer als Passwort-basierte Anmeldung und funktioniert auch wenn 2FA aktiviert ist.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className={`flex items-center gap-3 p-3 ${c.card} rounded-lg`}>
                          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                            <Mail className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <p className={`font-medium ${c.text}`}>{oauth2Tokens?.email}</p>
                            <p className={`text-xs ${c.textSecondary}`}>OAuth2 verbunden</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleMicrosoftOAuth2Login}
                            className={`flex-1 px-3 py-2 text-sm ${c.hover} ${c.text} rounded-lg flex items-center justify-center gap-1`}
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
                            className="px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded-lg"
                          >
                            Trennen
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Toggle between OAuth2 and Password */}
                    {!oauth2Status.success && (
                      <div className={`mt-3 pt-3 border-t ${c.border}`}>
                        <button
                          onClick={() => setUseOAuth2(!useOAuth2)}
                          className={`text-xs ${c.textSecondary} hover:${c.accent}`}
                        >
                          {useOAuth2 ? '↩️ Stattdessen Passwort verwenden' : '🔒 OAuth2 überspringen (nicht empfohlen)'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* IMAP - v1.10.0: Hide password field when OAuth2 is active */}
                <div className={`${c.bgTertiary} p-4 rounded-lg ${oauth2Status.success ? 'opacity-75' : ''}`}>
                  <h4 className={`font-medium ${c.text} mb-3 flex items-center justify-between`}>
                    IMAP (Empfang)
                    {oauth2Status.success && (
                      <span className="text-xs text-blue-400 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        OAuth2 aktiv
                      </span>
                    )}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Host (z.B. imap.gmail.com)"
                      value={accountForm.imap.host}
                      onChange={e => setAccountForm(f => ({ ...f, imap: { ...f.imap, host: e.target.value }}))}
                      className={`px-3 py-2 rounded-lg ${c.input} text-sm`}
                      disabled={oauth2Status.success}
                    />
                    <input
                      type="text"
                      placeholder="Port (993)"
                      value={accountForm.imap.port}
                      onChange={e => setAccountForm(f => ({ ...f, imap: { ...f.imap, port: e.target.value }}))}
                      className={`px-3 py-2 rounded-lg ${c.input} text-sm`}
                      disabled={oauth2Status.success}
                    />
                    <input
                      type="email"
                      placeholder="E-Mail-Adresse"
                      value={accountForm.imap.username}
                      onChange={e => handleEmailChange(e.target.value)}
                      className={`px-3 py-2 rounded-lg ${c.input} text-sm`}
                      disabled={oauth2Status.success}
                    />
                    {!oauth2Status.success && (
                      <input
                        type="password"
                        placeholder="Passwort"
                        value={accountForm.imap.password}
                        onChange={e => setAccountForm(f => ({ ...f, imap: { ...f.imap, password: e.target.value }}))}
                        className={`px-3 py-2 rounded-lg ${c.input} text-sm`}
                      />
                    )}
                    {oauth2Status.success && (
                      <div className={`px-3 py-2 rounded-lg ${c.input} text-sm text-green-400 flex items-center gap-1`}>
                        <CheckCircle className="w-4 h-4" />
                        OAuth2 Token
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <label className={`flex items-center gap-2 ${c.textSecondary} text-sm`}>
                      <input
                        type="checkbox"
                        checked={accountForm.imap.tls}
                        onChange={e => setAccountForm(f => ({ ...f, imap: { ...f.imap, tls: e.target.checked }}))}
                        disabled={oauth2Status.success}
                      />
                      TLS/SSL
                    </label>
                    {!oauth2Status.success && (
                      <button
                        onClick={handleTestImap}
                        disabled={testing.imap}
                        className={`px-3 py-1 text-sm ${c.accentBg} text-white rounded flex items-center gap-1`}
                      >
                        {testing.imap ? <Loader className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        {testing.imap ? 'Teste...' : 'Testen'}
                      </button>
                    )}
                  </div>
                  {testResults.imap && !oauth2Status.success && (
                    <div className={`mt-2 text-sm flex items-center gap-1 ${testResults.imap.success ? 'text-green-400' : 'text-red-400'}`}>
                      {testResults.imap.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {testResults.imap.success ? 'Verbindung OK' : testResults.imap.error}
                    </div>
                  )}
                </div>

                {/* SMTP - v1.10.0: OAuth2 support */}
                <div className={`${c.bgTertiary} p-4 rounded-lg ${oauth2Status.success ? 'opacity-75' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`font-medium ${c.text} flex items-center gap-2`}>
                      SMTP (Versand)
                      {oauth2Status.success && (
                        <span className="text-xs text-blue-400 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          OAuth2 aktiv
                        </span>
                      )}
                    </h4>
                    {!oauth2Status.success && (
                      <button
                        onClick={copyImapToSmtp}
                        className={`text-xs ${c.accent} hover:underline flex items-center gap-1`}
                        title="IMAP-Zugangsdaten übernehmen"
                      >
                        <Mail className="w-3 h-3" />
                        Von IMAP kopieren
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Host (z.B. smtp.gmail.com)"
                      value={accountForm.smtp.host}
                      onChange={e => setAccountForm(f => ({ ...f, smtp: { ...f.smtp, host: e.target.value }}))}
                      className={`px-3 py-2 rounded-lg ${c.input} text-sm`}
                      disabled={oauth2Status.success}
                    />
                    <input
                      type="text"
                      placeholder="Port (465 oder 587)"
                      value={accountForm.smtp.port}
                      onChange={e => setAccountForm(f => ({ ...f, smtp: { ...f.smtp, port: e.target.value }}))}
                      className={`px-3 py-2 rounded-lg ${c.input} text-sm`}
                      disabled={oauth2Status.success}
                    />
                    <input
                      type="text"
                      placeholder="Benutzername"
                      value={accountForm.smtp.username}
                      onChange={e => setAccountForm(f => ({ ...f, smtp: { ...f.smtp, username: e.target.value }}))}
                      className={`px-3 py-2 rounded-lg ${c.input} text-sm`}
                      disabled={oauth2Status.success}
                    />
                    {!oauth2Status.success && (
                      <input
                        type="password"
                        placeholder="Passwort"
                        value={accountForm.smtp.password}
                        onChange={e => setAccountForm(f => ({ ...f, smtp: { ...f.smtp, password: e.target.value }}))}
                        className={`px-3 py-2 rounded-lg ${c.input} text-sm`}
                      />
                    )}
                    {oauth2Status.success && (
                      <div className={`px-3 py-2 rounded-lg ${c.input} text-sm text-green-400 flex items-center gap-1`}>
                        <CheckCircle className="w-4 h-4" />
                        OAuth2 Token
                      </div>
                    )}
                    <input
                      type="email"
                      placeholder="Absender E-Mail"
                      value={accountForm.smtp.fromEmail}
                      onChange={e => setAccountForm(f => ({ ...f, smtp: { ...f.smtp, fromEmail: e.target.value }}))}
                      className={`col-span-2 px-3 py-2 rounded-lg ${c.input} text-sm`}
                      disabled={oauth2Status.success}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <label className={`flex items-center gap-2 ${c.textSecondary} text-sm`}>
                      <input
                        type="checkbox"
                        checked={accountForm.smtp.secure}
                        onChange={e => setAccountForm(f => ({ ...f, smtp: { ...f.smtp, secure: e.target.checked }}))}
                        disabled={oauth2Status.success}
                      />
                      SSL/TLS {accountForm.smtp.port === '587' && <span className="text-xs text-yellow-400">(STARTTLS)</span>}
                    </label>
                    {!oauth2Status.success && (
                      <button
                        onClick={handleTestSmtp}
                        disabled={testing.smtp}
                        className={`px-3 py-1 text-sm ${c.accentBg} text-white rounded flex items-center gap-1`}
                      >
                        {testing.smtp ? <Loader className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        {testing.smtp ? 'Teste...' : 'Testen'}
                      </button>
                    )}
                  </div>
                  {testResults.smtp && !oauth2Status.success && (
                    <div className={`mt-2 text-sm flex items-center gap-1 ${testResults.smtp.success ? 'text-green-400' : 'text-red-400'}`}>
                      {testResults.smtp.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {testResults.smtp.success ? 'Verbindung OK' : testResults.smtp.error}
                    </div>
                  )}
                </div>

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
      </div>
    </div>
  );
}

export default AccountManager;
