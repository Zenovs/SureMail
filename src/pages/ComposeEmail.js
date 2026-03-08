import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../context/AccountContext';

function ComposeEmail({ onBack }) {
  const { currentTheme } = useTheme();
  const { activeAccountId, getActiveAccount, accounts } = useAccounts();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(activeAccountId);
  const c = currentTheme.colors;

  const [form, setForm] = useState({
    to: '',
    subject: '',
    body: ''
  });

  const handleSend = async () => {
    if (!form.to || !form.subject) {
      setError('Bitte Empfänger und Betreff ausfüllen');
      return;
    }

    setSending(true);
    setError(null);

    try {
      let result;
      if (selectedAccountId && window.electronAPI.sendEmailForAccount) {
        result = await window.electronAPI.sendEmailForAccount(selectedAccountId, {
          to: form.to,
          subject: form.subject,
          text: form.body,
          html: `<p>${form.body.replace(/\n/g, '</p><p>')}</p>`
        });
      } else {
        result = await window.electronAPI.sendEmail({
          to: form.to,
          subject: form.subject,
          text: form.body,
          html: `<p>${form.body.replace(/\n/g, '</p><p>')}</p>`
        });
      }

      if (result.success) {
        setSuccess(true);
        setTimeout(() => onBack(), 2000);
      } else {
        setError(result.error);
      }
    } catch (e) {
      setError(e.message);
    }

    setSending(false);
  };

  const account = getActiveAccount();

  return (
    <div className={`flex-1 flex flex-col ${c.bg}`}>
      {/* Header */}
      <header className={`px-6 py-4 ${c.border} border-b ${c.bgSecondary}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className={`p-2 ${c.hover} rounded-lg transition-colors ${c.textSecondary}`}
            >
              ←
            </button>
            <h2 className={`text-lg font-semibold ${c.text}`}>Neue E-Mail</h2>
          </div>
          <button
            onClick={handleSend}
            disabled={sending || success}
            className={`px-6 py-2 ${c.accentBg} ${c.accentHover} text-white rounded-lg transition-colors disabled:opacity-50`}
          >
            {sending ? 'Sende...' : success ? '✓ Gesendet!' : 'Senden'}
          </button>
        </div>
      </header>

      {/* Form */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-3xl mx-auto space-y-4">
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-600 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-900/20 border border-green-600 rounded-lg text-green-400">
              E-Mail erfolgreich gesendet!
            </div>
          )}

          {/* Account Auswahl */}
          {accounts.length > 1 && (
            <div className={`${c.bgSecondary} ${c.border} border rounded-lg p-4`}>
              <label className={`block text-sm ${c.textSecondary} mb-2`}>Von:</label>
              <select
                value={selectedAccountId || ''}
                onChange={e => setSelectedAccountId(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg ${c.input} focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.smtp.fromEmail || acc.smtp.username})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* An */}
          <div className={`${c.bgSecondary} ${c.border} border rounded-lg p-4`}>
            <label className={`block text-sm ${c.textSecondary} mb-2`}>An:</label>
            <input
              type="email"
              value={form.to}
              onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
              placeholder="empfaenger@example.com"
              className={`w-full px-4 py-2 rounded-lg ${c.input} focus:outline-none focus:ring-2 focus:ring-cyan-500`}
            />
          </div>

          {/* Betreff */}
          <div className={`${c.bgSecondary} ${c.border} border rounded-lg p-4`}>
            <label className={`block text-sm ${c.textSecondary} mb-2`}>Betreff:</label>
            <input
              type="text"
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="Betreff eingeben..."
              className={`w-full px-4 py-2 rounded-lg ${c.input} focus:outline-none focus:ring-2 focus:ring-cyan-500`}
            />
          </div>

          {/* Body */}
          <div className={`${c.bgSecondary} ${c.border} border rounded-lg p-4`}>
            <label className={`block text-sm ${c.textSecondary} mb-2`}>Nachricht:</label>
            <textarea
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder="Nachricht schreiben..."
              rows={12}
              className={`w-full px-4 py-3 rounded-lg ${c.input} focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComposeEmail;
