import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, AlertCircle, Settings, Mail, Loader, Shield, RefreshCw, ChevronDown, ChevronUp, HelpCircle, ExternalLink, Key, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../context/AccountContext';

// v2.0.0: Server Presets - Nur IMAP/SMTP (OAuth2 entfernt)
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
    note: 'Outlook.com, Hotmail, Live.com, Microsoft 365 - Erfordert App-Passwort',
    autoFillUsername: true,
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
  
  const [accountForm, setAccountForm] = useState({
    name: '',
    categoryId: 'work',
    imap: { host: '', port: '993', username: '', password: '', tls: true },
    smtp: { host: '', port: '465', username: '', password: '', secure: true, fromEmail: '' }
  });

  const currentPreset = useMemo(() => {
    return SERVER_PRESETS.find(p => p.id === selectedPreset);
  }, [selectedPreset]);

  const [categoryForm, setCategoryForm] = useState({ name: '', color: '#3b82f6' });

  // v2.0.0: Vereinfachte Email-Behandlung (keine Microsoft-Auto-Detection)
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
  };

  const handleEditAccount = (account) => {
    setAccountForm(account);
    setEditingAccount(account.id);
    setShowAccountForm(true);
  };

  const handleSaveAccount = async () => {
    const accountData = { ...accountForm };
    
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

        {/* v2.0.0: Info Banner - Nur IMAP/SMTP */}
        <div className={`mb-6 p-4 ${c.card} ${c.border} border rounded-xl`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h3 className={`font-medium ${c.text}`}>CoreMail Desktop - IMAP/SMTP E-Mail-Client</h3>
              <p className={`text-sm ${c.textSecondary} mt-1`}>
                Füge deine IMAP/SMTP-Konten hinzu. Wähle eine Server-Vorlage für automatische Konfiguration 
                oder gib die Einstellungen manuell ein. Für Microsoft, Gmail, iCloud und Yahoo wird ein App-Passwort benötigt.
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
              Klicke auf "+ Neues Konto" um ein IMAP/SMTP-Konto hinzuzufügen.
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
                        <span className="px-1.5 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          IMAP/SMTP
                        </span>
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
                    {currentPreset?.help && (
                      <a 
                        href={currentPreset.help} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-cyan-400 hover:underline flex items-center gap-1 mt-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        App-Passwort-Anleitung
                      </a>
                    )}
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
