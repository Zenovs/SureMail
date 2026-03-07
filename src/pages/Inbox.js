import React, { useState, useEffect, useCallback } from 'react';
import EmailListItem from '../components/EmailListItem';
import LoadingSpinner from '../components/LoadingSpinner';

const Inbox = ({ onEmailSelect }) => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUid, setSelectedUid] = useState(null);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!window.electronAPI) {
        // Demo-Modus ohne Electron
        setEmails([
          {
            uid: 1,
            subject: 'Willkommen bei CoreMail',
            from: 'support@coremail.app',
            date: new Date(),
            seen: false,
            hasAttachments: false,
            preview: 'Vielen Dank für die Installation von CoreMail Desktop...'
          }
        ]);
        setLoading(false);
        return;
      }

      const result = await window.electronAPI.fetchEmails({ folder: 'INBOX', limit: 50 });
      
      if (result.success) {
        setEmails(result.emails);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleEmailClick = (email) => {
    setSelectedUid(email.uid);
    onEmailSelect(email);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-dark-600 bg-dark-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-100">📥 Posteingang</h2>
            <p className="text-sm text-gray-500 mt-1">
              {emails.length} E-Mails
            </p>
          </div>
          <button
            onClick={fetchEmails}
            disabled={loading}
            className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            Aktualisieren
          </button>
        </div>
      </header>

      {/* E-Mail Liste */}
      <div className="flex-1 overflow-y-auto email-list">
        {loading ? (
          <LoadingSpinner message="E-Mails werden geladen..." />
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="text-red-400 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-200 mb-2">Fehler</h3>
            <p className="text-gray-400 text-center max-w-md mb-4">{error}</p>
            <button
              onClick={fetchEmails}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 h-full">
            <div className="text-gray-600 text-6xl mb-4">📬</div>
            <h3 className="text-lg font-medium text-gray-400">Keine E-Mails</h3>
            <p className="text-gray-500 text-sm">Dein Posteingang ist leer</p>
          </div>
        ) : (
          <div>
            {emails.map((email) => (
              <EmailListItem
                key={email.uid}
                email={email}
                isSelected={selectedUid === email.uid}
                onClick={() => handleEmailClick(email)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
