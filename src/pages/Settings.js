import React, { useState, useEffect } from 'react';

const Settings = ({ settings: initialSettings, onSave }) => {
  const [imapSettings, setImapSettings] = useState({
    host: '',
    port: '993',
    username: '',
    password: '',
    tls: true
  });

  const [smtpSettings, setSmtpSettings] = useState({
    host: '',
    port: '465',
    username: '',
    password: '',
    secure: true,
    fromEmail: ''
  });

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState({ imap: false, smtp: false });
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (initialSettings) {
      if (initialSettings.imap) {
        setImapSettings(prev => ({ ...prev, ...initialSettings.imap }));
      }
      if (initialSettings.smtp) {
        setSmtpSettings(prev => ({ ...prev, ...initialSettings.smtp }));
      }
    }
  }, [initialSettings]);

  const handleImapChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setImapSettings(prev => ({ ...prev, [e.target.name]: value }));
  };

  const handleSmtpChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSmtpSettings(prev => ({ ...prev, [e.target.name]: value }));
  };

  const testImap = async () => {
    setTesting(prev => ({ ...prev, imap: true }));
    setStatus(null);

    try {
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStatus({ type: 'success', message: 'IMAP-Verbindung erfolgreich! (Demo)' });
        return;
      }

      const result = await window.electronAPI.testImap(imapSettings);
      
      if (result.success) {
        setStatus({ type: 'success', message: '✅ IMAP-Verbindung erfolgreich!' });
      } else {
        setStatus({ type: 'error', message: `❌ IMAP-Fehler: ${result.error}` });
      }
    } catch (err) {
      setStatus({ type: 'error', message: `❌ Fehler: ${err.message}` });
    } finally {
      setTesting(prev => ({ ...prev, imap: false }));
    }
  };

  const testSmtp = async () => {
    setTesting(prev => ({ ...prev, smtp: true }));
    setStatus(null);

    try {
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStatus({ type: 'success', message: 'SMTP-Verbindung erfolgreich! (Demo)' });
        return;
      }

      const result = await window.electronAPI.testSmtp(smtpSettings);
      
      if (result.success) {
        setStatus({ type: 'success', message: '✅ SMTP-Verbindung erfolgreich!' });
      } else {
        setStatus({ type: 'error', message: `❌ SMTP-Fehler: ${result.error}` });
      }
    } catch (err) {
      setStatus({ type: 'error', message: `❌ Fehler: ${err.message}` });
    } finally {
      setTesting(prev => ({ ...prev, smtp: false }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);

    try {
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setStatus({ type: 'success', message: '✅ Einstellungen gespeichert! (Demo)' });
        onSave({ imap: imapSettings, smtp: smtpSettings });
        return;
      }

      const result = await window.electronAPI.saveSettings({
        imap: imapSettings,
        smtp: smtpSettings
      });

      if (result.success) {
        setStatus({ type: 'success', message: '✅ Einstellungen erfolgreich gespeichert!' });
        onSave({ imap: imapSettings, smtp: smtpSettings });
      } else {
        setStatus({ type: 'error', message: `Fehler: ${result.error}` });
      }
    } catch (err) {
      setStatus({ type: 'error', message: `Fehler: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors";

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-dark-600 bg-dark-800">
        <h2 className="text-xl font-semibold text-gray-100">⚙️ Einstellungen</h2>
        <p className="text-sm text-gray-500 mt-1">
          Konfiguriere deine IMAP- und SMTP-Einstellungen
        </p>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Status */}
          {status && (
            <div className={`p-4 rounded-lg ${
              status.type === 'success' 
                ? 'bg-green-900/30 border border-green-600/50 text-green-400'
                : 'bg-red-900/30 border border-red-600/50 text-red-400'
            }`}>
              {status.message}
            </div>
          )}

          {/* IMAP Settings */}
          <section className="bg-dark-800 rounded-lg border border-dark-600 p-6">
            <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center gap-2">
              📥 IMAP-Einstellungen
              <span className="text-xs text-gray-500 font-normal">(zum Empfangen)</span>
            </h3>

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Host</label>
                  <input
                    type="text"
                    name="host"
                    value={imapSettings.host}
                    onChange={handleImapChange}
                    placeholder="imap.example.com"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Port</label>
                  <input
                    type="text"
                    name="port"
                    value={imapSettings.port}
                    onChange={handleImapChange}
                    placeholder="993"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Benutzername / E-Mail</label>
                <input
                  type="text"
                  name="username"
                  value={imapSettings.username}
                  onChange={handleImapChange}
                  placeholder="deine@email.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Passwort</label>
                <input
                  type="password"
                  name="password"
                  value={imapSettings.password}
                  onChange={handleImapChange}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    name="tls"
                    checked={imapSettings.tls}
                    onChange={handleImapChange}
                    className="w-4 h-4 rounded bg-dark-700 border-dark-500 text-cyan-500 focus:ring-cyan-500"
                  />
                  TLS/SSL verwenden
                </label>

                <button
                  type="button"
                  onClick={testImap}
                  disabled={testing.imap}
                  className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-cyan-400 rounded-lg transition-colors disabled:opacity-50"
                >
                  {testing.imap ? 'Teste...' : '🔌 Verbindung testen'}
                </button>
              </div>
            </div>
          </section>

          {/* SMTP Settings */}
          <section className="bg-dark-800 rounded-lg border border-dark-600 p-6">
            <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center gap-2">
              📤 SMTP-Einstellungen
              <span className="text-xs text-gray-500 font-normal">(zum Senden)</span>
            </h3>

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Host</label>
                  <input
                    type="text"
                    name="host"
                    value={smtpSettings.host}
                    onChange={handleSmtpChange}
                    placeholder="smtp.example.com"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Port</label>
                  <input
                    type="text"
                    name="port"
                    value={smtpSettings.port}
                    onChange={handleSmtpChange}
                    placeholder="465"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Benutzername</label>
                <input
                  type="text"
                  name="username"
                  value={smtpSettings.username}
                  onChange={handleSmtpChange}
                  placeholder="deine@email.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Passwort</label>
                <input
                  type="password"
                  name="password"
                  value={smtpSettings.password}
                  onChange={handleSmtpChange}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Absender-E-Mail (optional)</label>
                <input
                  type="email"
                  name="fromEmail"
                  value={smtpSettings.fromEmail}
                  onChange={handleSmtpChange}
                  placeholder="deine@email.com"
                  className={inputClass}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    name="secure"
                    checked={smtpSettings.secure}
                    onChange={handleSmtpChange}
                    className="w-4 h-4 rounded bg-dark-700 border-dark-500 text-cyan-500 focus:ring-cyan-500"
                  />
                  SSL/TLS verwenden
                </label>

                <button
                  type="button"
                  onClick={testSmtp}
                  disabled={testing.smtp}
                  className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-cyan-400 rounded-lg transition-colors disabled:opacity-50"
                >
                  {testing.smtp ? 'Teste...' : '🔌 Verbindung testen'}
                </button>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              {saving ? 'Speichere...' : '💾 Einstellungen speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
