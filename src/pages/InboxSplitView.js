import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../context/AccountContext';
import LoadingSpinner from '../components/LoadingSpinner';

function InboxSplitView({ onFullView }) {
  const { currentTheme } = useTheme();
  const { activeAccountId, getActiveAccount } = useAccounts();
  const [emails, setEmails] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState(null);
  const c = currentTheme.colors;

  const fetchEmails = useCallback(async () => {
    if (!window.electronAPI || !activeAccountId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.fetchEmailsForAccount(activeAccountId, { limit: 50 });
      if (result.success) {
        setEmails(result.emails);
        if (result.emails.length > 0) {
          loadEmailPreview(result.emails[0].uid);
        }
      } else {
        setError(result.error);
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [activeAccountId]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const loadEmailPreview = async (uid) => {
    if (!window.electronAPI || !activeAccountId) return;
    
    setLoadingPreview(true);
    try {
      const result = await window.electronAPI.fetchEmailForAccount(activeAccountId, uid);
      if (result.success) {
        setSelectedEmail(result.email);
      }
    } catch (e) {
      console.error('Error loading email preview', e);
    }
    setLoadingPreview(false);
  };

  const handleSelectEmail = (index) => {
    setSelectedIndex(index);
    if (emails[index]) {
      loadEmailPreview(emails[index].uid);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' && selectedIndex < emails.length - 1) {
        handleSelectEmail(selectedIndex + 1);
      } else if (e.key === 'ArrowUp' && selectedIndex > 0) {
        handleSelectEmail(selectedIndex - 1);
      } else if (e.key === 'Enter' && selectedEmail) {
        onFullView(selectedEmail);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, emails, selectedEmail, onFullView]);

  const account = getActiveAccount();

  if (!activeAccountId) {
    return (
      <div className={`flex-1 flex items-center justify-center ${c.bg}`}>
        <div className={`text-center ${c.textSecondary}`}>
          <div className="text-5xl mb-4">📧</div>
          <p>Wähle ein Konto aus der Sidebar</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${c.bg}`}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex-1 flex items-center justify-center ${c.bg}`}>
        <div className="text-center">
          <div className="text-red-400 text-5xl mb-4">⚠️</div>
          <p className="text-red-400">{error}</p>
          <button onClick={fetchEmails} className={`mt-4 px-4 py-2 ${c.accentBg} text-white rounded-lg`}>
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex ${c.bg}`}>
      {/* Email List */}
      <div className={`w-1/3 min-w-[300px] ${c.bgSecondary} ${c.border} border-r flex flex-col`}>
        <div className={`p-4 ${c.border} border-b`}>
          <h2 className={`font-semibold ${c.text}`}>{account?.name || 'Posteingang'}</h2>
          <p className={`text-sm ${c.textSecondary}`}>{emails.length} E-Mails</p>
        </div>
        <div className="flex-1 overflow-auto">
          {emails.length === 0 ? (
            <div className={`p-8 text-center ${c.textSecondary}`}>
              Keine E-Mails
            </div>
          ) : (
            emails.map((email, index) => (
              <div
                key={email.uid}
                onClick={() => handleSelectEmail(index)}
                className={`p-4 cursor-pointer transition-colors ${c.border} border-b ${
                  index === selectedIndex ? c.bgTertiary : c.hover
                } ${!email.seen ? 'font-medium' : ''}`}
              >
                <div className={`text-sm truncate ${c.text} ${!email.seen ? c.accent : ''}`}>
                  {email.from}
                </div>
                <div className={`text-sm truncate ${c.text} mt-1`}>
                  {email.subject}
                </div>
                <div className={`text-xs ${c.textSecondary} mt-1 truncate`}>
                  {email.preview}
                </div>
                <div className={`text-xs ${c.textSecondary} mt-2`}>
                  {new Date(email.date).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Email Preview */}
      <div className={`flex-1 flex flex-col ${c.bg}`}>
        {loadingPreview ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : selectedEmail ? (
          <>
            <div className={`p-4 ${c.bgSecondary} ${c.border} border-b`}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className={`text-xl font-semibold ${c.text} mb-2`}>
                    {selectedEmail.subject}
                  </h2>
                  <p className={`${c.textSecondary} text-sm`}>Von: {selectedEmail.from}</p>
                  <p className={`${c.textSecondary} text-sm`}>An: {selectedEmail.to}</p>
                  <p className={`${c.textSecondary} text-xs mt-1`}>
                    {new Date(selectedEmail.date).toLocaleString('de-DE')}
                  </p>
                </div>
                <button
                  onClick={() => onFullView(selectedEmail)}
                  className={`px-4 py-2 ${c.accentBg} ${c.accentHover} text-white rounded-lg text-sm transition-colors`}
                >
                  Vollansicht →
                </button>
              </div>
            </div>
            <div className={`flex-1 overflow-auto p-6 ${c.bg}`}>
              {selectedEmail.html ? (
                <div
                  className="email-content"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                  style={{ 
                    backgroundColor: 'white', 
                    color: 'black', 
                    padding: '16px', 
                    borderRadius: '8px',
                    minHeight: '200px'
                  }}
                />
              ) : (
                <pre className={`${c.text} whitespace-pre-wrap font-sans`}>
                  {selectedEmail.text}
                </pre>
              )}
              {selectedEmail.attachments?.length > 0 && (
                <div className={`mt-6 pt-4 ${c.border} border-t`}>
                  <h4 className={`font-medium ${c.text} mb-2`}>Anhänge ({selectedEmail.attachments.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmail.attachments.map((att, i) => (
                      <div key={i} className={`px-3 py-2 ${c.bgTertiary} ${c.border} border rounded-lg text-sm ${c.text}`}>
                        📎 {att.filename}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={`flex-1 flex items-center justify-center ${c.textSecondary}`}>
            Wähle eine E-Mail aus
          </div>
        )}
      </div>
    </div>
  );
}

export default InboxSplitView;
