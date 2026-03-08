import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../context/AccountContext';

function ComposeEmail({ onBack, replyTo = null }) {
  const { currentTheme } = useTheme();
  const { activeAccountId, getActiveAccount, accounts } = useAccounts();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(activeAccountId);
  const [signatures, setSignatures] = useState({});
  const [useSignature, setUseSignature] = useState(true);
  const [showSignaturePreview, setShowSignaturePreview] = useState(false);
  
  // Attachments state
  const [attachments, setAttachments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  
  const c = currentTheme.colors;

  const [form, setForm] = useState({
    to: replyTo?.from || '',
    cc: '',
    bcc: '',
    subject: replyTo ? `Re: ${replyTo.subject}` : '',
    body: ''
  });

  useEffect(() => {
    loadSignatures();
  }, []);

  useEffect(() => {
    // Update signature preview when account changes
    setShowSignaturePreview(false);
  }, [selectedAccountId]);

  const loadSignatures = async () => {
    if (window.electronAPI?.loadSignatures) {
      const result = await window.electronAPI.loadSignatures();
      if (result.success) {
        setSignatures(result.signatures);
      }
    }
  };

  const currentSignature = signatures[selectedAccountId];
  const hasSignature = currentSignature?.enabled && currentSignature?.html;

  // ============ ATTACHMENT HANDLING ============
  
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
  };

  const addFiles = (files) => {
    const newAttachments = files.map(file => {
      // Read file as base64
      const reader = new FileReader();
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(prev => ({ ...prev, [id]: progress }));
        }
      };
      
      reader.onload = (event) => {
        setAttachments(prev => prev.map(att => 
          att.id === id 
            ? { ...att, content: event.target.result.split(',')[1], loaded: true }
            : att
        ));
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[id];
          return newProgress;
        });
      };
      
      reader.readAsDataURL(file);
      
      return {
        id,
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
        content: null,
        loaded: false
      };
    });
    
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  // Drag and Drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're actually leaving the drop zone
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      addFiles(files);
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

  const getTotalSize = () => {
    return attachments.reduce((sum, att) => sum + att.size, 0);
  };

  // ============ SEND EMAIL ============

  const handleSend = async () => {
    if (!form.to || !form.subject) {
      setError('Bitte Empfänger und Betreff ausfüllen');
      return;
    }

    // Check if all attachments are loaded
    const pendingAttachments = attachments.filter(att => !att.loaded);
    if (pendingAttachments.length > 0) {
      setError('Bitte warten, bis alle Anhänge geladen sind');
      return;
    }

    setSending(true);
    setError(null);

    try {
      let bodyHtml = `<p>${form.body.replace(/\n/g, '</p><p>')}</p>`;
      let bodyText = form.body;

      // Append signature if enabled
      if (useSignature && hasSignature) {
        bodyHtml += `<br><br>${currentSignature.html}`;
        bodyText += `\n\n${currentSignature.text || ''}`;
      }

      const emailData = {
        to: form.to,
        cc: form.cc || undefined,
        bcc: form.bcc || undefined,
        subject: form.subject,
        text: bodyText,
        html: bodyHtml,
        attachments: attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        }))
      };

      let result;
      if (selectedAccountId && window.electronAPI.sendEmailForAccount) {
        result = await window.electronAPI.sendEmailForAccount(selectedAccountId, emailData);
      } else {
        result = await window.electronAPI.sendEmail(emailData);
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
    <div 
      ref={dropZoneRef}
      className={`flex-1 flex flex-col ${c.bg} relative drop-zone ${isDragging ? 'drag-over' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-cyan-500/10 border-4 border-dashed border-cyan-500 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className={`text-center ${c.text}`}>
            <div className="text-6xl mb-4">📎</div>
            <p className="text-xl font-semibold">Dateien hier ablegen</p>
            <p className={`text-sm ${c.textSecondary} mt-2`}>Unterstützt: Bilder, PDFs, Dokumente und mehr</p>
          </div>
        </div>
      )}

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
          <div className="flex items-center gap-3">
            {attachments.length > 0 && (
              <span className={`text-sm ${c.textSecondary}`}>
                📎 {attachments.length} ({formatFileSize(getTotalSize())})
              </span>
            )}
            <button
              onClick={handleSend}
              disabled={sending || success}
              className={`px-6 py-2 ${c.accentBg} ${c.accentHover} text-white rounded-lg transition-colors disabled:opacity-50`}
            >
              {sending ? 'Sende...' : success ? '✓ Gesendet!' : '📤 Senden'}
            </button>
          </div>
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
              ✓ E-Mail erfolgreich gesendet!
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

          {/* An, CC, BCC */}
          <div className={`${c.bgSecondary} ${c.border} border rounded-lg p-4`}>
            <label className={`block text-sm ${c.textSecondary} mb-2`}>An:</label>
            <input
              type="email"
              value={form.to}
              onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
              placeholder="empfaenger@example.com"
              className={`w-full px-4 py-2 rounded-lg ${c.input} focus:outline-none focus:ring-2 focus:ring-cyan-500`}
            />
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className={`block text-xs ${c.textSecondary} mb-1`}>CC:</label>
                <input
                  type="email"
                  value={form.cc}
                  onChange={e => setForm(f => ({ ...f, cc: e.target.value }))}
                  placeholder="cc@example.com"
                  className={`w-full px-3 py-1.5 rounded ${c.input} text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                />
              </div>
              <div>
                <label className={`block text-xs ${c.textSecondary} mb-1`}>BCC:</label>
                <input
                  type="email"
                  value={form.bcc}
                  onChange={e => setForm(f => ({ ...f, bcc: e.target.value }))}
                  placeholder="bcc@example.com"
                  className={`w-full px-3 py-1.5 rounded ${c.input} text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                />
              </div>
            </div>
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

          {/* Attachments */}
          <div className={`${c.bgSecondary} ${c.border} border rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-3">
              <label className={`text-sm ${c.textSecondary}`}>📎 Anhänge</label>
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`px-3 py-1.5 ${c.bgTertiary} ${c.hover} ${c.text} rounded text-sm transition-colors`}
              >
                + Dateien hinzufügen
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            
            {attachments.length === 0 ? (
              <div className={`border-2 border-dashed ${c.border} rounded-lg p-6 text-center`}>
                <div className="text-3xl mb-2">📎</div>
                <p className={`${c.textSecondary} text-sm`}>
                  Ziehe Dateien hierher oder klicke "Dateien hinzufügen"
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {attachments.map(att => (
                  <div 
                    key={att.id}
                    className={`flex items-center justify-between p-3 ${c.bgTertiary} rounded-lg`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl flex-shrink-0">
                        {getFileIcon(att.contentType, att.filename)}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-sm ${c.text} truncate`}>{att.filename}</p>
                        <p className={`text-xs ${c.textSecondary}`}>{formatFileSize(att.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!att.loaded && uploadProgress[att.id] !== undefined && (
                        <div className="w-20 h-1.5 bg-gray-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-cyan-500 transition-all upload-progress-bar"
                            style={{ width: `${uploadProgress[att.id]}%` }}
                          />
                        </div>
                      )}
                      {att.loaded && (
                        <span className="text-green-400 text-xs">✓</span>
                      )}
                      <button
                        onClick={() => removeAttachment(att.id)}
                        className={`p-1 ${c.hover} rounded text-red-400 hover:text-red-300`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                <p className={`text-xs ${c.textSecondary} mt-2`}>
                  Gesamt: {formatFileSize(getTotalSize())}
                </p>
              </div>
            )}
          </div>

          {/* Body */}
          <div className={`${c.bgSecondary} ${c.border} border rounded-lg p-4`}>
            <label className={`block text-sm ${c.textSecondary} mb-2`}>Nachricht:</label>
            <textarea
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder="Nachricht schreiben..."
              rows={10}
              className={`w-full px-4 py-3 rounded-lg ${c.input} focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none`}
            />
          </div>

          {/* Signature Toggle */}
          {hasSignature && (
            <div className={`${c.bgSecondary} ${c.border} border rounded-lg p-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="useSignature"
                    checked={useSignature}
                    onChange={e => setUseSignature(e.target.checked)}
                    className="w-5 h-5 rounded accent-cyan-500"
                  />
                  <label htmlFor="useSignature" className={`${c.text} cursor-pointer`}>
                    ✍️ Signatur anhängen
                  </label>
                </div>
                <button
                  onClick={() => setShowSignaturePreview(!showSignaturePreview)}
                  className={`text-sm ${c.accent} hover:underline`}
                >
                  {showSignaturePreview ? 'Verbergen' : 'Vorschau'}
                </button>
              </div>
              
              {showSignaturePreview && useSignature && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <p className={`text-xs ${c.textSecondary} mb-2`}>Signatur-Vorschau:</p>
                  <div 
                    className="p-3 bg-white rounded text-gray-800 text-sm"
                    dangerouslySetInnerHTML={{ __html: currentSignature.html }}
                  />
                </div>
              )}
            </div>
          )}

          {/* No Signature Hint */}
          {!hasSignature && (
            <div className={`${c.bgSecondary} ${c.border} border rounded-lg p-4`}>
              <p className={`text-sm ${c.textSecondary}`}>
                💡 Tipp: Du kannst unter Einstellungen → Signaturen eine E-Mail-Signatur erstellen.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ComposeEmail;
