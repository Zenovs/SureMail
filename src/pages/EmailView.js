import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';

const EmailView = ({ email, onBack, onReply }) => {
  const { currentTheme } = useTheme();
  const [fullEmail, setFullEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const c = currentTheme.colors;

  useEffect(() => {
    const fetchFullEmail = async () => {
      if (!email) return;
      
      // If email already has html/text, use it directly (from split view)
      if (email.html || email.text) {
        setFullEmail(email);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);

      try {
        if (!window.electronAPI) {
          setFullEmail({
            ...email,
            html: '<p>Dies ist eine Demo-E-Mail.</p>',
            text: 'Dies ist eine Demo-E-Mail.',
            attachments: []
          });
          setLoading(false);
          return;
        }

        const result = await window.electronAPI.fetchEmail(email.uid);
        
        if (result.success) {
          setFullEmail(result.email);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFullEmail();
  }, [email]);

  const formatDate = (date) => {
    return new Date(date).toLocaleString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadAttachment = (attachment) => {
    const link = document.createElement('a');
    link.href = `data:${attachment.contentType};base64,${attachment.content}`;
    link.download = attachment.filename;
    link.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${c.bg}`}>
        <LoadingSpinner message="E-Mail wird geladen..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center p-8 ${c.bg}`}>
        <div className="text-red-400 text-4xl mb-4">⚠️</div>
        <h3 className={`text-lg font-medium ${c.text} mb-2`}>Fehler beim Laden</h3>
        <p className={`${c.textSecondary} text-center max-w-md mb-4`}>{error}</p>
        <button
          onClick={onBack}
          className={`px-4 py-2 ${c.bgTertiary} ${c.hover} ${c.text} rounded-lg transition-colors`}
        >
          Zurück zum Posteingang
        </button>
      </div>
    );
  }

  if (!fullEmail) return null;

  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${c.bg}`}>
      {/* Header */}
      <header className={`px-6 py-4 ${c.border} border-b ${c.bgSecondary}`}>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className={`p-2 ${c.hover} rounded-lg transition-colors ${c.textSecondary} hover:${c.text}`}
          >
            ←
          </button>
          <div className="flex-1">
            <h2 className={`text-lg font-semibold ${c.text} truncate`}>
              {fullEmail.subject}
            </h2>
          </div>
          <button
            onClick={onReply}
            className={`px-4 py-2 ${c.accentBg} ${c.accentHover} text-white rounded-lg transition-colors flex items-center gap-2`}
          >
            ↩️ Antworten
          </button>
        </div>
      </header>

      {/* E-Mail Meta */}
      <div className={`px-6 py-4 ${c.border} border-b ${c.bgSecondary}`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 ${c.accentBg} rounded-full flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-semibold text-lg">
              {fullEmail.from.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-medium ${c.text}`}>{fullEmail.from}</span>
            </div>
            <div className={`text-sm ${c.textSecondary}`}>
              <span>An: {fullEmail.to}</span>
              {fullEmail.cc && <span> • CC: {fullEmail.cc}</span>}
            </div>
            <div className={`text-xs ${c.textSecondary} mt-1`}>
              {formatDate(fullEmail.date)}
            </div>
          </div>
        </div>
      </div>

      {/* E-Mail Inhalt */}
      <div className={`flex-1 overflow-y-auto p-6 ${c.bg}`}>
        <div className="max-w-4xl mx-auto">
          {fullEmail.html ? (
            <div 
              className="email-content bg-white text-gray-800 p-6 rounded-lg"
              dangerouslySetInnerHTML={{ __html: fullEmail.html }}
            />
          ) : (
            <pre className={`whitespace-pre-wrap font-mono text-sm ${c.text} ${c.bgSecondary} p-6 rounded-lg`}>
              {fullEmail.text}
            </pre>
          )}

          {/* Anhänge */}
          {fullEmail.attachments && fullEmail.attachments.length > 0 && (
            <div className={`mt-6 pt-6 ${c.border} border-t`}>
              <h3 className={`text-sm font-medium ${c.textSecondary} mb-3`}>
                📎 Anhänge ({fullEmail.attachments.length})
              </h3>
              <div className="grid gap-2">
                {fullEmail.attachments.map((att, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 ${c.bgSecondary} rounded-lg ${c.border} border hover:border-cyan-600/50 transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div>
                        <p className={`text-sm ${c.text}`}>{att.filename}</p>
                        <p className={`text-xs ${c.textSecondary}`}>{formatFileSize(att.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadAttachment(att)}
                      className={`px-3 py-1 ${c.bgTertiary} ${c.hover} ${c.accent} rounded text-sm transition-colors`}
                    >
                      ⬇️ Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailView;
