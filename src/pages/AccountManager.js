import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../context/AccountContext';

function AccountManager() {
  const { currentTheme } = useTheme();
  const { accounts, categories, addAccount, updateAccount, deleteAccount, addCategory, deleteCategory } = useAccounts();
  const [editingAccount, setEditingAccount] = useState(null);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [testing, setTesting] = useState({ imap: false, smtp: false });
  const [testResults, setTestResults] = useState({ imap: null, smtp: null });
  const c = currentTheme.colors;

  const [accountForm, setAccountForm] = useState({
    name: '',
    categoryId: 'work',
    imap: { host: '', port: '993', username: '', password: '', tls: true },
    smtp: { host: '', port: '465', username: '', password: '', secure: true, fromEmail: '' }
  });

  const [categoryForm, setCategoryForm] = useState({ name: '', color: '#3b82f6' });

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
  };

  const handleEditAccount = (account) => {
    setAccountForm(account);
    setEditingAccount(account.id);
    setShowAccountForm(true);
  };

  const handleSaveAccount = async () => {
    if (editingAccount) {
      await updateAccount(editingAccount, accountForm);
    } else {
      await addAccount(accountForm);
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
                      <div className={`font-medium ${c.text}`}>{account.name}</div>
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
                      type="text"
                      placeholder="Benutzername"
                      value={accountForm.imap.username}
                      onChange={e => setAccountForm(f => ({ ...f, imap: { ...f.imap, username: e.target.value }}))}
                      className={`px-3 py-2 rounded-lg ${c.input} text-sm`}
                    />
                    <input
                      type="password"
                      placeholder="Passwort"
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
                      className={`px-3 py-1 text-sm ${c.accentBg} text-white rounded`}
                    >
                      {testing.imap ? 'Teste...' : 'Testen'}
                    </button>
                  </div>
                  {testResults.imap && (
                    <div className={`mt-2 text-sm ${testResults.imap.success ? 'text-green-400' : 'text-red-400'}`}>
                      {testResults.imap.success ? '✓ Verbindung OK' : `✗ ${testResults.imap.error}`}
                    </div>
                  )}
                </div>

                {/* SMTP */}
                <div className={`${c.bgTertiary} p-4 rounded-lg`}>
                  <h4 className={`font-medium ${c.text} mb-3`}>SMTP (Versand)</h4>
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
                      placeholder="Port (465)"
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
                      placeholder="Passwort"
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
                      SSL/TLS
                    </label>
                    <button
                      onClick={handleTestSmtp}
                      disabled={testing.smtp}
                      className={`px-3 py-1 text-sm ${c.accentBg} text-white rounded`}
                    >
                      {testing.smtp ? 'Teste...' : 'Testen'}
                    </button>
                  </div>
                  {testResults.smtp && (
                    <div className={`mt-2 text-sm ${testResults.smtp.success ? 'text-green-400' : 'text-red-400'}`}>
                      {testResults.smtp.success ? '✓ Verbindung OK' : `✗ ${testResults.smtp.error}`}
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
