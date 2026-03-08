import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useOllama } from '../context/OllamaContext';
import LoadingSpinner from '../components/LoadingSpinner';

const EmailView = ({ email, onBack, onReply }) => {
  const { currentTheme } = useTheme();
  const { isAvailable: aiAvailable, summarizeEmail, isGenerating: aiGenerating } = useOllama();
  const [fullEmail, setFullEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
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

  const downloadAttachment = async (attachment, index) => {
    setDownloadProgress(prev => ({ ...prev, [index]: 'downloading' }));
    
    try {
      const link = document.createElement('a');
      link.href = `data:${attachment.contentType};base64,${attachment.content}`;
      link.download = attachment.filename;
      link.click();
      
      setDownloadProgress(prev => ({ ...prev, [index]: 'done' }));
      setTimeout(() => {
        setDownloadProgress(prev => ({ ...prev, [index]: null }));
      }, 2000);
    } catch (e) {
      setDownloadProgress(prev => ({ ...prev, [index]: 'error' }));
    }
  };

  const downloadAllAttachments = async () => {
    if (!fullEmail?.attachments?.length) return;
    
    setDownloadingAll(true);
    
    try {
      if (window.electronAPI?.saveAllAttachments) {
        const result = await window.electronAPI.saveAllAttachments(fullEmail.attachments);
        if (result.success) {
          // Show success for all
          fullEmail.attachments.forEach((_, i) => {
            setDownloadProgress(prev => ({ ...prev, [i]: 'done' }));
          });
          setTimeout(() => setDownloadProgress({}), 2000);
        }
      } else {
        // Fallback: download one by one
        for (let i = 0; i < fullEmail.attachments.length; i++) {
          await downloadAttachment(fullEmail.attachments[i], i);
          await new Promise(r => setTimeout(r, 500)); // Small delay between downloads
        }
      }
    } catch (e) {
      console.error('Download error:', e);
    }
    
    setDownloadingAll(false);
  };

  const openAttachment = async (attachment) => {
    // For images and PDFs, show preview
    if (attachment.contentType.startsWith('image/') || attachment.contentType === 'application/pdf') {
      setPreviewAttachment(attachment);
    } else {
      // Download and open with system app
      downloadAttachment(attachment, -1);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (contentType, filename) => {
    if (contentType.startsWith('image/')) return '🖼️';
    if (contentType === 'application/pdf') return '📕';
    if (contentType.includes('word') || filename?.endsWith('.doc') || filename?.endsWith('.docx')) return '📘';
    if (contentType.includes('excel') || filename?.endsWith('.xls') || filename?.endsWith('.xlsx')) return '📗';
    if (contentType.includes('powerpoint') || filename?.endsWith('.ppt') || filename?.endsWith('.pptx')) return '📙';
    if (contentType.includes('zip') || contentType.includes('archive')) return '📦';
    if (contentType.startsWith('video/')) return '🎬';
    if (contentType.startsWith('audio/')) return '🎵';
    if (contentType.includes('text')) return '📝';
    return '📄';
  };

  const isPreviewable = (contentType) => {
    return contentType.startsWith('image/') || contentType === 'application/pdf';
  };

  const handleSummarize = async () => {
    if (!fullEmail || summarizing) return;
    
    setSummarizing(true);
    setAiSummary(null);
    
    const emailContent = fullEmail.text || fullEmail.html?.replace(/<[^>]*>/g, '') || '';
    const summary = await summarizeEmail(emailContent, fullEmail.subject);
    
    if (summary) {
      setAiSummary(summary);
    } else {
      setAiSummary('Fehler: Zusammenfassung konnte nicht erstellt werden.');
    }
    
    setSummarizing(false);
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
          <div className="flex items-center gap-2">
            {aiAvailable && (
              <button
                onClick={handleSummarize}
                disabled={summarizing}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  summarizing
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400'
                }`}
                title="Mit KI zusammenfassen"
              >
                {summarizing ? (
                  <>
                    <span className="animate-spin">⏳</span> Lädt...
                  </>
                ) : (
                  <>
                    🤖 Zusammenfassen
                  </>
                )}
              </button>
            )}
            <button
              onClick={onReply}
              className={`px-4 py-2 ${c.accentBg} ${c.accentHover} text-white rounded-lg transition-colors flex items-center gap-2`}
            >
              ↩️ Antworten
            </button>
          </div>
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

      {/* AI Summary */}
      {aiSummary && (
        <div className={`mx-6 mt-4 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30`}>
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-purple-400 flex items-center gap-2">
              🤖 KI-Zusammenfassung
            </h4>
            <button
              onClick={() => setAiSummary(null)}
              className={`text-sm ${c.textMuted} hover:${c.text}`}
            >
              ✕
            </button>
          </div>
          <p className={`text-sm ${c.text} leading-relaxed`}>{aiSummary}</p>
        </div>
      )}

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
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-medium ${c.textSecondary}`}>
                  📎 Anhänge ({fullEmail.attachments.length})
                </h3>
                <button
                  onClick={downloadAllAttachments}
                  disabled={downloadingAll}
                  className={`px-3 py-1 ${c.accentBg} ${c.accentHover} text-white text-sm rounded transition-colors disabled:opacity-50`}
                >
                  {downloadingAll ? '⏳ Lade...' : '⬇️ Alle herunterladen'}
                </button>
              </div>
              
              <div className="grid gap-3">
                {fullEmail.attachments.map((att, index) => (
                  <div
                    key={index}
                    className={`${c.bgSecondary} rounded-lg ${c.border} border overflow-hidden`}
                  >
                    {/* Preview for images */}
                    {att.contentType.startsWith('image/') && (
                      <div 
                        className="w-full h-32 bg-gray-900 flex items-center justify-center cursor-pointer"
                        onClick={() => setPreviewAttachment(att)}
                      >
                        <img 
                          src={`data:${att.contentType};base64,${att.content}`}
                          alt={att.filename}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    )}
                    
                    {/* Preview for PDFs - first page */}
                    {att.contentType === 'application/pdf' && (
                      <div 
                        className="w-full h-32 bg-red-900/20 flex items-center justify-center cursor-pointer"
                        onClick={() => setPreviewAttachment(att)}
                      >
                        <div className="text-center">
                          <div className="text-4xl mb-2">📕</div>
                          <span className={`text-xs ${c.textSecondary}`}>Klicken für Vorschau</span>
                        </div>
                      </div>
                    )}
                    
                    {/* File info bar */}
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl flex-shrink-0">{getFileIcon(att.contentType, att.filename)}</span>
                        <div className="min-w-0">
                          <p className={`text-sm ${c.text} truncate`}>{att.filename}</p>
                          <p className={`text-xs ${c.textSecondary}`}>
                            {formatFileSize(att.size)} • {att.contentType.split('/')[1]?.toUpperCase() || 'Datei'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {downloadProgress[index] === 'done' ? (
                          <span className="text-green-400 text-sm">✓ Geladen</span>
                        ) : downloadProgress[index] === 'downloading' ? (
                          <span className="text-cyan-400 text-sm">⏳</span>
                        ) : downloadProgress[index] === 'error' ? (
                          <span className="text-red-400 text-sm">✕ Fehler</span>
                        ) : (
                          <>
                            {isPreviewable(att.contentType) && (
                              <button
                                onClick={() => setPreviewAttachment(att)}
                                className={`px-3 py-1 ${c.bgTertiary} ${c.hover} ${c.textSecondary} rounded text-sm transition-colors`}
                              >
                                👁️ Vorschau
                              </button>
                            )}
                            <button
                              onClick={() => downloadAttachment(att, index)}
                              className={`px-3 py-1 ${c.bgTertiary} ${c.hover} ${c.accent} rounded text-sm transition-colors`}
                            >
                              ⬇️ Download
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attachment Preview Modal */}
      {previewAttachment && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8"
          onClick={() => setPreviewAttachment(null)}
        >
          <div 
            className={`max-w-4xl max-h-full ${c.card} rounded-xl overflow-hidden`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between p-4 ${c.border} border-b`}>
              <h3 className={`font-medium ${c.text}`}>{previewAttachment.filename}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadAttachment(previewAttachment, -1)}
                  className={`px-3 py-1 ${c.accentBg} ${c.accentHover} text-white rounded text-sm transition-colors`}
                >
                  ⬇️ Download
                </button>
                <button
                  onClick={() => setPreviewAttachment(null)}
                  className={`p-2 ${c.hover} rounded-lg transition-colors ${c.textSecondary}`}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 max-h-[70vh] overflow-auto bg-gray-900">
              {previewAttachment.contentType.startsWith('image/') ? (
                <img 
                  src={`data:${previewAttachment.contentType};base64,${previewAttachment.content}`}
                  alt={previewAttachment.filename}
                  className="max-w-full mx-auto"
                />
              ) : previewAttachment.contentType === 'application/pdf' ? (
                <iframe
                  src={`data:application/pdf;base64,${previewAttachment.content}`}
                  className="w-full h-[60vh]"
                  title={previewAttachment.filename}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailView;
