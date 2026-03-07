import React, { useState } from 'react';

const ComposeEmail = ({ onBack }) => {
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setStatus(null);

    try {
      if (!window.electronAPI) {
        // Demo-Modus
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStatus({ type: 'success', message: 'E-Mail erfolgreich gesendet! (Demo)' });
        setFormData({ to: '', subject: '', message: '' });
        return;
      }

      const result = await window.electronAPI.sendEmail({
        to: formData.to,
        subject: formData.subject,
        text: formData.message,
        html: `<p>${formData.message.replace(/\n/g, '<br>')}</p>`
      });

      if (result.success) {
        setStatus({ type: 'success', message: 'E-Mail erfolgreich gesendet!' });
        setFormData({ to: '', subject: '', message: '' });
      } else {
        setStatus({ type: 'error', message: result.error });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-dark-600 bg-dark-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors text-gray-400 hover:text-gray-200"
          >
            ←
          </button>
          <h2 className="text-xl font-semibold text-gray-100">✏️ Neue E-Mail</h2>
        </div>
      </header>

      {/* Formular */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-4">
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

          {/* An */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              An
            </label>
            <input
              type="email"
              name="to"
              value={formData.to}
              onChange={handleChange}
              required
              placeholder="empfaenger@example.com"
              className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>

          {/* Betreff */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Betreff
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              placeholder="Betreff eingeben..."
              className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>

          {/* Nachricht */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Nachricht
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={12}
              placeholder="Deine Nachricht..."
              className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {sending ? (
                <>
                  <span className="animate-spin">⚪</span>
                  Wird gesendet...
                </>
              ) : (
                <>
                  📨 Senden
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComposeEmail;
