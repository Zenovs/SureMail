import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

const EmailView = ({ email, onBack, onReply }) => {
  const [fullEmail, setFullEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFullEmail = async () => {
      if (!email) return;
      
      setLoading(true);
      setError(null);

      try {
        if (!window.electronAPI) {
          // Demo-Modus
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
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner message="E-Mail wird geladen..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-red-400 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-200 mb-2">Fehler beim Laden</h3>
        <p className="text-gray-400 text-center max-w-md mb-4">{error}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg transition-colors"
        >
          Zurück zum Posteingang
        </button>
      </div>
    );
  }

  if (!fullEmail) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b border-dark-600 bg-dark-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors text-gray-400 hover:text-gray-200"
          >
            ←
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-100 truncate">
              {fullEmail.subject}
            </h2>
          </div>
          <button
            onClick={onReply}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            ↩️ Antworten
          </button>
        </div>
      </header>

      {/* E-Mail Meta */}
      <div className="px-6 py-4 border-b border-dark-700 bg-dark-800/50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-lg">
              {fullEmail.from.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-100">{fullEmail.from}</span>
            </div>
            <div className="text-sm text-gray-500">
              <span>An: {fullEmail.to}</span>
              {fullEmail.cc && <span> • CC: {fullEmail.cc}</span>}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatDate(fullEmail.date)}
            </div>
          </div>
        </div>
      </div>

      {/* E-Mail Inhalt */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {fullEmail.html ? (
            <div 
              className="email-content bg-white text-gray-800 p-6 rounded-lg"
              dangerouslySetInnerHTML={{ __html: fullEmail.html }}
            />
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300 bg-dark-800 p-6 rounded-lg">
              {fullEmail.text}
            </pre>
          )}

          {/* Anhänge */}
          {fullEmail.attachments && fullEmail.attachments.length > 0 && (
            <div className="mt-6 pt-6 border-t border-dark-700">
              <h3 className="text-sm font-medium text-gray-400 mb-3">
                📎 Anhänge ({fullEmail.attachments.length})
              </h3>
              <div className="grid gap-2">
                {fullEmail.attachments.map((att, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-dark-800 rounded-lg border border-dark-700 hover:border-cyan-600/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div>
                        <p className="text-sm text-gray-200">{att.filename}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(att.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadAttachment(att)}
                      className="px-3 py-1 bg-dark-700 hover:bg-dark-600 text-cyan-400 rounded text-sm transition-colors"
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
