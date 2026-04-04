import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../context/AccountContext';
import { useOllama } from '../context/OllamaContext';

// ─── HTML-Vorlagen ───────────────────────────────────────────────────────────
const HTML_TEMPLATES = [
  {
    id: 'blank',
    name: 'Leer',
    icon: '📄',
    html: '<p></p>',
  },
  {
    id: 'formal',
    name: 'Formeller Brief',
    icon: '💼',
    html: `<p>Sehr geehrte Damen und Herren,</p>
<p>ich schreibe Ihnen bezüglich <em>[Thema]</em>.</p>
<p>[Ihr Text hier]</p>
<p>Für Rückfragen stehe ich Ihnen gerne zur Verfügung.</p>
<p>Mit freundlichen Grüßen</p>`,
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    icon: '📰',
    html: `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
  <h2 style="color:#0891b2;border-bottom:2px solid #0891b2;padding-bottom:8px">Betreff des Newsletters</h2>
  <p>Hallo,</p>
  <p>hier sind unsere neuesten Informationen für Sie:</p>
  <h3 style="color:#0891b2">Abschnitt 1</h3>
  <p>Inhalt des ersten Abschnitts...</p>
  <h3 style="color:#0891b2">Abschnitt 2</h3>
  <p>Inhalt des zweiten Abschnitts...</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="color:#999;font-size:12px">Sie erhalten diese E-Mail, weil Sie sich für unseren Newsletter angemeldet haben.</p>
</div>`,
  },
  {
    id: 'offer',
    name: 'Angebot',
    icon: '💰',
    html: `<p>Sehr geehrte Damen und Herren,</p>
<p>wir freuen uns, Ihnen folgendes Angebot zu unterbreiten:</p>
<table style="border-collapse:collapse;width:100%;margin:16px 0;font-size:14px">
  <thead>
    <tr style="background:#0891b2;color:white">
      <th style="padding:10px;text-align:left;border:1px solid #0891b2">Position</th>
      <th style="padding:10px;text-align:left;border:1px solid #0891b2">Beschreibung</th>
      <th style="padding:10px;text-align:right;border:1px solid #0891b2">Preis</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:8px;border:1px solid #ddd">1</td>
      <td style="padding:8px;border:1px solid #ddd">Leistung/Produkt</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right">€ 0,00</td>
    </tr>
    <tr style="background:#f9f9f9">
      <td colspan="2" style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold">Gesamt (netto)</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold">€ 0,00</td>
    </tr>
  </tbody>
</table>
<p>Dieses Angebot ist gültig bis [Datum].</p>
<p>Mit freundlichen Grüßen</p>`,
  },
  {
    id: 'custom',
    name: 'HTML einfügen',
    icon: '🧩',
    html: null, // will open paste dialog
  },
];

// ─── Toolbar-Konfiguration ────────────────────────────────────────────────────
const TOOLBAR = [
  [
    { cmd: 'bold',         icon: <strong>B</strong>, title: 'Fett (Ctrl+B)' },
    { cmd: 'italic',       icon: <em>I</em>,          title: 'Kursiv (Ctrl+I)' },
    { cmd: 'underline',    icon: <span style={{textDecoration:'underline'}}>U</span>, title: 'Unterstrichen (Ctrl+U)' },
    { cmd: 'strikeThrough',icon: <span style={{textDecoration:'line-through'}}>S</span>, title: 'Durchgestrichen' },
  ],
  [
    { cmd: 'insertOrderedList',   icon: '1.', title: 'Nummerierte Liste' },
    { cmd: 'insertUnorderedList', icon: '•',  title: 'Aufzählungsliste' },
  ],
  [
    { cmd: 'justifyLeft',   icon: '⬛⬜', title: 'Links' },
    { cmd: 'justifyCenter', icon: '⬜⬛', title: 'Zentriert' },
    { cmd: 'justifyRight',  icon: '⬜⬛', title: 'Rechts' },
  ],
  [
    { cmd: 'removeFormat', icon: '✕', title: 'Formatierung entfernen' },
  ],
];

const HEADINGS = [
  { label: 'Normal', tag: 'div' },
  { label: 'H1',     tag: 'h1' },
  { label: 'H2',     tag: 'h2' },
  { label: 'H3',     tag: 'h3' },
];

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getFileIcon = (contentType, filename) => {
  if (contentType.startsWith('image/')) return '🖼️';
  if (contentType === 'application/pdf') return '📕';
  if (contentType.includes('word') || filename?.endsWith('.docx')) return '📘';
  if (contentType.includes('excel') || filename?.endsWith('.xlsx')) return '📗';
  if (contentType.includes('zip') || contentType.includes('archive')) return '📦';
  if (contentType.startsWith('video/')) return '🎬';
  if (contentType.startsWith('audio/')) return '🎵';
  return '📄';
};

// ─── E-Mail-Tag-Eingabe ───────────────────────────────────────────────────────
function EmailTagInput({ label, tags, onChange, placeholder, c, isLarge = false }) {
  const [inputValue, setInputValue] = React.useState('');
  const inputRef = React.useRef(null);

  const isValidEmail = (val) => val.includes('@') && val.includes('.');

  const addTag = (val) => {
    // Support paste with multiple addresses (comma/semicolon separated)
    const parts = val.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
    const newTags = parts.filter(p => isValidEmail(p) && !tags.includes(p));
    if (newTags.length > 0) onChange([...tags, ...newTags]);
    setInputValue('');
  };

  const removeTag = (index) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',' || e.key === ';' || e.key === 'Tab') && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue.trim());
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) addTag(inputValue.trim());
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    addTag(pasted);
  };

  return (
    <div className="flex items-start gap-3">
      <label className={`${isLarge ? 'text-sm' : 'text-xs'} ${c.textSecondary} w-16 flex-shrink-0 pt-2`}>
        {label}
      </label>
      <div
        className={`flex-1 flex flex-wrap gap-1.5 px-3 py-2 rounded-lg ${c.input} focus-within:ring-2 focus-within:ring-cyan-500 cursor-text min-h-[36px]`}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-md text-xs font-medium flex-shrink-0"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(i); }}
              className="hover:text-white hover:bg-cyan-500/40 rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 bg-transparent outline-none text-sm min-w-[140px]"
          style={{ minWidth: tags.length > 0 ? '80px' : '140px' }}
        />
      </div>
    </div>
  );
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────
function ComposeEmail({ onBack, replyTo: replyToProp = null, composeData = null }) {
  const { currentTheme } = useTheme();
  const { activeAccountId, getActiveAccount, accounts } = useAccounts();
  const { isAvailable: aiAvailable, suggestReply, improveText } = useOllama();
  const c = currentTheme.colors;

  // Normalise: App.js passes composeData, some callers pass replyTo directly
  const replyTo = replyToProp || composeData?.originalEmail || null;
  const isForward = composeData?.type === 'forward';
  const isReplyAll = composeData?.type === 'replyAll';

  // --- Formularfelder ---
  const replyToAddr = isReplyAll
    ? [replyTo?.from, ...(replyTo?.cc ? replyTo.cc.split(',').map(s => s.trim()) : [])].filter(Boolean)
    : replyTo?.from ? [replyTo.from] : [];
  const [toTags,  setToTags]  = useState(isForward ? [] : replyToAddr);
  const [ccTags,  setCcTags]  = useState([]);
  const [bccTags, setBccTags] = useState([]);
  const [form, setForm] = useState({
    subject: replyTo
      ? (isForward ? `Fwd: ${replyTo.subject}` : `Re: ${replyTo.subject}`)
      : '',
  });
  const [selectedAccountId, setSelectedAccountId] = useState(activeAccountId);
  const [senderName, setSenderName] = useState('');

  // --- Editor ---
  const editorRef  = useRef(null);
  const [editorMode,  setEditorMode]  = useState('richtext'); // 'richtext' | 'html' | 'preview'
  const [htmlSource,  setHtmlSource]  = useState('');

  // --- Templates ---
  const [showTemplates,  setShowTemplates]  = useState(false);
  const [customHtmlPaste, setCustomHtmlPaste] = useState('');
  const [showCustomPaste, setShowCustomPaste] = useState(false);

  // --- Senden & Undo ---
  const [sending, setSending] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);
  const [undoCountdown, setUndoCountdown] = useState(null);
  const undoTimerRef = useRef(null);
  const undoCancelledRef = useRef(false);

  // --- Anhänge ---
  const [attachments,    setAttachments]    = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isDragging,     setIsDragging]     = useState(false);
  const fileInputRef = useRef(null);
  const dropZoneRef  = useRef(null);

  // --- Signatur ---
  const [signatures,           setSignatures]           = useState({});
  const [useSignature,         setUseSignature]         = useState(true);
  const [showSignaturePreview, setShowSignaturePreview] = useState(false);

  // --- KI ---
  const [showAiPanel,  setShowAiPanel]  = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiLoading,    setAiLoading]    = useState(false);

  // ── Initialisierung ─────────────────────────────────────────────────────────
  useEffect(() => {
    loadSignatures();
  }, []);

  // Absendername aus Konto übernehmen
  useEffect(() => {
    const acc = accounts.find(a => a.id === selectedAccountId);
    setSenderName(acc?.displayName || '');
  }, [selectedAccountId, accounts]);

  // Antwort-Zitat / Weiterleitung in Editor einfügen
  useEffect(() => {
    if (editorRef.current && replyTo) {
      const quoted = replyTo.html
        ? replyTo.html
        : (replyTo.text || '').replace(/\n/g, '<br>');
      if (isForward) {
        editorRef.current.innerHTML =
          `<p></p><br><hr><p><strong>Weitergeleitete Nachricht</strong><br>Von: ${replyTo.from || ''}<br>Betreff: ${replyTo.subject || ''}</p>${quoted}`;
      } else {
        editorRef.current.innerHTML =
          `<p></p><br><blockquote style="border-left:3px solid #555;padding-left:1em;color:#888;margin:0 0 0 0.5em">${quoted}</blockquote>`;
      }
    }
  }, []); // eslint-disable-line

  const loadSignatures = async () => {
    if (window.electronAPI?.loadSignatures) {
      const result = await window.electronAPI.loadSignatures();
      if (result.success) setSignatures(result.signatures);
    }
  };

  const currentSignature = signatures[selectedAccountId];
  const hasSignature = currentSignature?.enabled && currentSignature?.html;

  // ── Editor-Modus wechseln ───────────────────────────────────────────────────
  const switchMode = (mode) => {
    if (mode === editorMode) return;

    // Capture current HTML before any state change
    let currentHtml = htmlSource;
    if (editorMode === 'richtext' && editorRef.current) {
      currentHtml = editorRef.current.innerHTML;
      setHtmlSource(currentHtml);
    }

    setEditorMode(mode);

    // When switching to richtext: editorRef.current is null now (div not yet in DOM).
    // Schedule restore AFTER React re-renders and attaches the ref.
    if (mode === 'richtext') {
      setTimeout(() => {
        if (editorRef.current) editorRef.current.innerHTML = currentHtml;
      }, 50);
    }
  };

  const getEditorHtml = useCallback(() => {
    if (editorMode === 'html') return htmlSource;
    return editorRef.current?.innerHTML || '';
  }, [editorMode, htmlSource]);

  const getEditorText = useCallback(() => {
    if (editorMode === 'html') return htmlSource.replace(/<[^>]*>/g, '');
    return editorRef.current?.innerText || '';
  }, [editorMode, htmlSource]);

  const getPreviewHtml = useCallback(() => {
    let html = getEditorHtml();
    if (useSignature && hasSignature) {
      html += `<hr style="margin:20px 0;border:none;border-top:1px solid #ddd"><div>${currentSignature.html}</div>`;
    }
    return html;
  }, [getEditorHtml, useSignature, hasSignature, currentSignature]);

  // ── Formatierung ─────────────────────────────────────────────────────────────
  const execFormat = (cmd, value = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
  };

  const insertLink = () => {
    const url = prompt('URL eingeben:', 'https://');
    if (url) execFormat('createLink', url);
  };

  const applyHeading = (tag) => {
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, tag);
  };

  const setFontColor = (color) => {
    execFormat('foreColor', color);
  };

  // ── Templates ────────────────────────────────────────────────────────────────
  const insertTemplate = (tpl) => {
    if (tpl.id === 'custom') {
      setShowCustomPaste(true);
      return;
    }
    if (editorMode === 'html') {
      setHtmlSource(tpl.html);
    } else if (editorRef.current) {
      editorRef.current.innerHTML = tpl.html;
      editorRef.current.focus();
    }
    setShowTemplates(false);
  };

  const applyCustomHtml = () => {
    if (editorMode === 'html') {
      setHtmlSource(customHtmlPaste);
    } else if (editorRef.current) {
      editorRef.current.innerHTML = customHtmlPaste;
      editorRef.current.focus();
      setHtmlSource(customHtmlPaste);
    }
    setShowCustomPaste(false);
    setShowTemplates(false);
    setCustomHtmlPaste('');
  };

  // ── Anhänge ──────────────────────────────────────────────────────────────────
  const addFiles = (files) => {
    const newAttachments = files.map(file => {
      const reader = new FileReader();
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      reader.onprogress = (ev) => {
        if (ev.lengthComputable) {
          setUploadProgress(prev => ({ ...prev, [id]: Math.round((ev.loaded / ev.total) * 100) }));
        }
      };
      reader.onload = (ev) => {
        setAttachments(prev => prev.map(a =>
          a.id === id ? { ...a, content: ev.target.result.split(',')[1], loaded: true } : a
        ));
        setUploadProgress(prev => { const n = { ...prev }; delete n[id]; return n; });
      };
      reader.readAsDataURL(file);
      return { id, filename: file.name, contentType: file.type || 'application/octet-stream', size: file.size, content: null, loaded: false };
    });
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) setIsDragging(false);
  };
  const handleDragOver  = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop      = (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) addFiles(files);
  };

  const getTotalSize = () => attachments.reduce((s, a) => s + a.size, 0);

  // ── KI ───────────────────────────────────────────────────────────────────────
  const handleAiSuggestReply = async () => {
    if (!replyTo || aiLoading) return;
    setAiLoading(true); setAiSuggestion('');
    const emailContent = replyTo.text || replyTo.html?.replace(/<[^>]*>/g, '') || '';
    const s = await suggestReply(emailContent, replyTo.subject, replyTo.from);
    setAiSuggestion(s || 'Fehler: Konnte keinen Vorschlag generieren.');
    setAiLoading(false);
  };

  const handleAiImprove = async (instruction) => {
    const text = getEditorText();
    if (!text.trim() || aiLoading) return;
    setAiLoading(true); setAiSuggestion('');
    const improved = await improveText(text, instruction);
    setAiSuggestion(improved || 'Fehler: Text konnte nicht verbessert werden.');
    setAiLoading(false);
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    const html = aiSuggestion.replace(/\n/g, '<br>');
    if (editorMode === 'html') {
      setHtmlSource(html);
    } else if (editorRef.current) {
      editorRef.current.innerHTML = html;
    }
    setAiSuggestion(''); setShowAiPanel(false);
  };

  // ── Undo Send ────────────────────────────────────────────────────────────────
  const cancelSend = () => {
    undoCancelledRef.current = true;
    clearInterval(undoTimerRef.current);
    setUndoCountdown(null);
  };

  // ── Senden ───────────────────────────────────────────────────────────────────
  const handleSend = async (scheduledAt = null) => {
    if (toTags.length === 0) { setError('Bitte mindestens einen Empfänger eingeben'); return; }
    if (!form.subject) { setError('Bitte Betreff ausfüllen'); return; }
    if (attachments.some(a => !a.loaded)) { setError('Bitte warten, bis alle Anhänge geladen sind'); return; }

    let bodyHtml = getEditorHtml();
    let bodyText = getEditorText();
    if (useSignature && hasSignature) {
      bodyHtml += `<br><br>${currentSignature.html}`;
      bodyText += `\n\n${currentSignature.text || ''}`;
    }
    const emailData = {
      fromName: senderName,
      to: toTags.join(', '),
      cc: ccTags.length > 0 ? ccTags.join(', ') : undefined,
      bcc: bccTags.length > 0 ? bccTags.join(', ') : undefined,
      subject: form.subject,
      text: bodyText,
      html: bodyHtml,
      attachments: attachments.map(a => ({ filename: a.filename, content: a.content, contentType: a.contentType })),
    };
    const activeAcc = accounts.find(a => a.id === selectedAccountId);

    // Zeitversetzt senden
    if (scheduledAt) {
      const result = await window.electronAPI.scheduledAdd({
        ...emailData,
        sendAt: scheduledAt,
        accountId: selectedAccountId,
        accountType: activeAcc?.type || 'imap',
      });
      if (result?.success) { setSuccess(true); setTimeout(() => onBack(), 2000); }
      else setError(result?.error || 'Planung fehlgeschlagen');
      return;
    }

    // Undo-Send: 5-Sekunden-Fenster
    setError(null);
    undoCancelledRef.current = false;
    setUndoCountdown(5);
    let remaining = 5;
    undoTimerRef.current = setInterval(() => {
      remaining -= 1;
      setUndoCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(undoTimerRef.current);
        setUndoCountdown(null);
        if (!undoCancelledRef.current) executeSend(emailData, activeAcc);
      }
    }, 1000);
  };

  const executeSend = async (emailData, activeAcc) => {
    setSending(true); setError(null);
    try {
      let result;
      if (activeAcc?.type === 'microsoft') {
        result = await window.electronAPI.sendGraphEmail(selectedAccountId, emailData);
      } else if (selectedAccountId && window.electronAPI.sendEmailForAccount) {
        result = await window.electronAPI.sendEmailForAccount(selectedAccountId, emailData);
      } else {
        result = await window.electronAPI.sendEmail(emailData);
      }

      if (result.success) {
        setSuccess(true);
        window.electronAPI.logAdd('email_sent',
          `E-Mail gesendet: ${form.subject || '(kein Betreff)'}`,
          `An: ${toTags.join(', ')}${ccTags.length ? ' | CC: ' + ccTags.join(', ') : ''}${attachments.length ? ' | ' + attachments.length + ' Anhang/Anhänge' : ''}`
        ).catch(() => {});
        setTimeout(() => onBack(), 2000);
      } else setError(result.error);
    } catch (e) { setError(e.message); }
    setSending(false);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      ref={dropZoneRef}
      className={`flex-1 flex flex-col ${c.bg} relative`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag-Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-cyan-500/10 border-4 border-dashed border-cyan-500 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className={`text-center ${c.text}`}>
            <div className="text-6xl mb-4">📎</div>
            <p className="text-xl font-semibold">Dateien hier ablegen</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`px-6 py-3 ${c.border} border-b ${c.bgSecondary} flex-shrink-0`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className={`p-2 ${c.hover} rounded-lg ${c.textSecondary}`}>←</button>
            <h2 className={`text-base font-semibold ${c.text}`}>{isForward ? 'Weiterleiten' : replyTo ? 'Antworten' : 'Neue E-Mail'}</h2>
          </div>
          <div className="flex items-center gap-2">
            {attachments.length > 0 && (
              <span className={`text-xs ${c.textSecondary}`}>📎 {attachments.length} ({formatFileSize(getTotalSize())})</span>
            )}
            {/* Templates Button */}
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${showTemplates ? 'bg-cyan-500/30 text-cyan-400' : `${c.bgTertiary} ${c.hover} ${c.textSecondary}`}`}
            >
              🧩 Vorlagen
            </button>
            {aiAvailable && (
              <button
                onClick={() => setShowAiPanel(!showAiPanel)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                  showAiPanel ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" /> KI
              </button>
            )}
            {/* Zeitversetzt senden */}
            <div className="relative">
              <button
                onClick={() => setShowSchedulePicker(p => !p)}
                disabled={sending || success || undoCountdown !== null}
                title="Zeitversetzt senden"
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${c.bgSecondary} ${c.border} border ${c.text} ${c.hover} disabled:opacity-40`}
              >
                🕐
              </button>
              {showSchedulePicker && (
                <div className={`absolute right-0 bottom-full mb-2 p-3 rounded-xl shadow-xl ${c.bg} ${c.border} border z-50 min-w-[260px]`}>
                  <p className={`text-xs font-medium ${c.text} mb-2`}>Senden um:</p>
                  <input
                    type="datetime-local"
                    value={scheduleDateTime}
                    onChange={e => setScheduleDateTime(e.target.value)}
                    min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                    className={`w-full text-sm rounded-lg px-3 py-1.5 ${c.bgSecondary} ${c.text} ${c.border} border outline-none`}
                  />
                  <button
                    onClick={() => {
                      if (!scheduleDateTime) return;
                      handleSend(new Date(scheduleDateTime).getTime());
                      setShowSchedulePicker(false);
                    }}
                    disabled={!scheduleDateTime}
                    className={`mt-2 w-full py-1.5 rounded-lg text-sm text-white ${c.accentBg} ${c.accentHover} disabled:opacity-40 transition-colors`}
                  >
                    Einplanen
                  </button>
                </div>
              )}
            </div>

            {/* Senden / Undo */}
            <button
              onClick={() => handleSend()}
              disabled={sending || success || undoCountdown !== null}
              className={`px-5 py-1.5 ${c.accentBg} ${c.accentHover} text-white rounded-lg text-sm transition-colors disabled:opacity-50`}
            >
              {sending ? 'Sende...' : success ? '✓ Gesendet!' : '📤 Senden'}
            </button>
          </div>
        </div>
      </header>

      {/* Hauptbereich */}
      <div className="flex flex-1 min-h-0">
        {/* Formular (scrollbar) */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="max-w-3xl mx-auto space-y-3">

            {/* Undo-Send Banner */}
            {undoCountdown !== null && (
              <div className="flex items-center justify-between p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                <span className="text-sm text-blue-300">
                  📤 E-Mail wird in <strong>{undoCountdown}s</strong> gesendet…
                </span>
                <button
                  onClick={cancelSend}
                  className="px-3 py-1 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            )}

            {/* Fehler / Erfolg */}
            {error && <div className="p-3 bg-red-900/20 border border-red-600 rounded-lg text-red-400 text-sm">{error}</div>}
            {success && <div className="p-3 bg-green-900/20 border border-green-600 rounded-lg text-green-400 text-sm">✓ E-Mail erfolgreich gesendet!</div>}

            {/* Von-Bereich */}
            <div className={`${c.bgSecondary} ${c.border} border rounded-lg p-4 space-y-3`}>
              <div className="flex items-start gap-3">
                <span className={`text-sm ${c.textSecondary} w-16 flex-shrink-0 mt-2`}>Von:</span>
                <div className="flex-1 space-y-2">
                  {/* Konto-Auswahl */}
                  {accounts.length > 1 ? (
                    <select
                      value={selectedAccountId || ''}
                      onChange={e => setSelectedAccountId(e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-lg ${c.input} text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.smtp.fromEmail || acc.smtp.username}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className={`text-sm ${c.textSecondary}`}>
                      {accounts[0]?.smtp?.fromEmail || accounts[0]?.smtp?.username || '–'}
                    </div>
                  )}
                  {/* Absendername-Override */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${c.textSecondary} flex-shrink-0`}>Angezeigter Name:</span>
                    <input
                      type="text"
                      value={senderName}
                      onChange={e => setSenderName(e.target.value)}
                      placeholder="z. B. Max Mustermann"
                      className={`flex-1 px-3 py-1 rounded ${c.input} text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* An / CC / BCC — Tag-Eingabe */}
            <div className={`${c.bgSecondary} ${c.border} border rounded-lg p-4 space-y-2`}>
              <EmailTagInput
                label="An:"
                tags={toTags}
                onChange={setToTags}
                placeholder="empfaenger@example.com — Enter oder Komma zum Hinzufügen"
                c={c}
                isLarge
              />
              <EmailTagInput
                label="CC:"
                tags={ccTags}
                onChange={setCcTags}
                placeholder="cc@example.com"
                c={c}
              />
              <EmailTagInput
                label="BCC:"
                tags={bccTags}
                onChange={setBccTags}
                placeholder="bcc@example.com"
                c={c}
              />
            </div>

            {/* Betreff */}
            <div className={`${c.bgSecondary} ${c.border} border rounded-lg p-4`}>
              <div className="flex items-center gap-3">
                <label className={`text-sm ${c.textSecondary} w-16 flex-shrink-0`}>Betreff:</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Betreff eingeben..."
                  className={`flex-1 px-3 py-1.5 rounded-lg ${c.input} text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                />
              </div>
            </div>

            {/* Anhänge */}
            <div className={`${c.bgSecondary} ${c.border} border rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${c.textSecondary}`}>📎 Anhänge</span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`px-3 py-1 ${c.bgTertiary} ${c.hover} ${c.text} rounded text-xs transition-colors`}
                >
                  + Hinzufügen
                </button>
                <input ref={fileInputRef} type="file" multiple onChange={e => addFiles(Array.from(e.target.files))} className="hidden" />
              </div>
              {attachments.length === 0 ? (
                <div className={`border-2 border-dashed ${c.border} rounded-lg p-4 text-center`}>
                  <p className={`${c.textSecondary} text-xs`}>Ziehe Dateien hierher oder klicke "Hinzufügen"</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {attachments.map(att => (
                    <div key={att.id} className={`flex items-center justify-between p-2 ${c.bgTertiary} rounded-lg`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span>{getFileIcon(att.contentType, att.filename)}</span>
                        <div className="min-w-0">
                          <p className={`text-xs ${c.text} truncate`}>{att.filename}</p>
                          <p className={`text-xs ${c.textSecondary}`}>{formatFileSize(att.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {!att.loaded && uploadProgress[att.id] !== undefined && (
                          <div className="w-16 h-1 bg-gray-600 rounded-full">
                            <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${uploadProgress[att.id]}%` }} />
                          </div>
                        )}
                        {att.loaded && <span className="text-green-400 text-xs">✓</span>}
                        <button onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                          className={`p-0.5 ${c.hover} rounded text-red-400 text-xs`}>✕</button>
                      </div>
                    </div>
                  ))}
                  <p className={`text-xs ${c.textSecondary}`}>Gesamt: {formatFileSize(getTotalSize())}</p>
                </div>
              )}
            </div>

            {/* Nachricht / Editor */}
            <div className={`${c.bgSecondary} ${c.border} border rounded-lg overflow-hidden`}>
              {/* Editor-Tabs */}
              <div className={`flex items-center gap-0 border-b ${c.border} ${c.bgTertiary}`}>
                {[
                  { id: 'richtext', label: '✏️ Bearbeiten' },
                  { id: 'html',    label: '<> HTML' },
                  { id: 'preview', label: '👁 Vorschau' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => switchMode(tab.id)}
                    className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 ${
                      editorMode === tab.id
                        ? 'border-cyan-500 text-cyan-400'
                        : `border-transparent ${c.textSecondary} hover:text-cyan-400`
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Toolbar (nur im richtext-Modus) */}
              {editorMode === 'richtext' && (
                <div className={`flex flex-wrap items-center gap-1 px-3 py-2 border-b ${c.border} ${c.bg}`}>
                  {/* Überschriften */}
                  <select
                    onChange={e => applyHeading(e.target.value)}
                    defaultValue="div"
                    className={`px-2 py-1 rounded text-xs ${c.input} focus:outline-none mr-1`}
                  >
                    {HEADINGS.map(h => <option key={h.tag} value={h.tag}>{h.label}</option>)}
                  </select>

                  {/* Trennlinie */}
                  <div className={`w-px h-5 ${c.border} border-l mx-1`} />

                  {/* Format-Buttons */}
                  {TOOLBAR.map((group, gi) => (
                    <React.Fragment key={gi}>
                      {group.map((btn, bi) => (
                        <button
                          key={bi}
                          onMouseDown={e => { e.preventDefault(); execFormat(btn.cmd); }}
                          title={btn.title}
                          className={`w-7 h-7 flex items-center justify-center rounded text-xs ${c.hover} ${c.textSecondary} hover:text-cyan-400 transition-colors`}
                        >
                          {btn.icon}
                        </button>
                      ))}
                      {gi < TOOLBAR.length - 1 && (
                        <div className={`w-px h-5 ${c.border} border-l mx-1`} />
                      )}
                    </React.Fragment>
                  ))}

                  <div className={`w-px h-5 ${c.border} border-l mx-1`} />

                  {/* Link */}
                  <button
                    onMouseDown={e => { e.preventDefault(); insertLink(); }}
                    title="Link einfügen"
                    className={`w-7 h-7 flex items-center justify-center rounded text-xs ${c.hover} ${c.textSecondary} hover:text-cyan-400`}
                  >
                    🔗
                  </button>

                  {/* Schriftfarbe */}
                  <div className="relative flex items-center" title="Schriftfarbe">
                    <input
                      type="color"
                      defaultValue="#ffffff"
                      onChange={e => setFontColor(e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0.5"
                      title="Schriftfarbe"
                    />
                  </div>
                </div>
              )}

              {/* Editor-Inhalt */}
              {editorMode === 'richtext' && (
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  className={`w-full min-h-64 p-4 ${c.text} focus:outline-none overflow-y-auto`}
                  style={{ fontSize: '14px', lineHeight: '1.6', maxHeight: '480px' }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      // Standardverhalten: neuer <p>-Block statt <br>
                    }
                  }}
                />
              )}

              {editorMode === 'html' && (
                <textarea
                  value={htmlSource}
                  onChange={e => setHtmlSource(e.target.value)}
                  placeholder="<p>HTML-Quellcode eingeben...</p>"
                  className={`w-full min-h-64 p-4 ${c.input} font-mono text-xs focus:outline-none resize-none border-0`}
                  style={{ minHeight: '320px', maxHeight: '480px' }}
                />
              )}

              {editorMode === 'preview' && (
                <div className="p-4 bg-white" style={{ minHeight: '320px', maxHeight: '480px', overflowY: 'auto' }}>
                  <div
                    className="text-gray-800 text-sm"
                    dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                  />
                </div>
              )}
            </div>

            {/* Signatur */}
            {hasSignature && (
              <div className={`${c.bgSecondary} ${c.border} border rounded-lg p-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="useSignature"
                      checked={useSignature}
                      onChange={e => setUseSignature(e.target.checked)}
                      className="w-4 h-4 rounded accent-cyan-500"
                    />
                    <label htmlFor="useSignature" className={`${c.text} cursor-pointer text-sm`}>✍️ Signatur anhängen</label>
                  </div>
                  <button
                    onClick={() => setShowSignaturePreview(!showSignaturePreview)}
                    className={`text-xs ${c.accent} hover:underline`}
                  >
                    {showSignaturePreview ? 'Verbergen' : 'Vorschau'}
                  </button>
                </div>
                {showSignaturePreview && useSignature && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="p-3 bg-white rounded text-gray-800 text-sm"
                      dangerouslySetInnerHTML={{ __html: currentSignature.html }} />
                  </div>
                )}
              </div>
            )}

            {!hasSignature && (
              <p className={`text-xs ${c.textSecondary} text-center`}>
                💡 Tipp: Unter Einstellungen → Signaturen kannst du eine E-Mail-Signatur erstellen.
              </p>
            )}
          </div>
        </div>

        {/* KI-Panel */}
        {showAiPanel && aiAvailable && (
          <div className={`w-72 ${c.bgSecondary} ${c.border} border-l flex flex-col flex-shrink-0`}>
            <div className={`p-4 border-b ${c.border} flex items-center justify-between`}>
              <h3 className={`font-semibold ${c.text} flex items-center gap-2 text-sm`}>
                <MessageCircle className="w-4 h-4" /> KI-Assistent
              </h3>
              <button onClick={() => setShowAiPanel(false)} className={`${c.textSecondary} hover:${c.text} text-sm`}>✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="space-y-2">
                {replyTo && (
                  <button onClick={handleAiSuggestReply} disabled={aiLoading}
                    className={`w-full px-3 py-2 rounded-lg text-left text-sm flex items-center gap-2 ${aiLoading ? 'opacity-50 cursor-not-allowed' : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'}`}>
                    💬 Antwort vorschlagen
                  </button>
                )}
                {[
                  ['✨ Verbessern', 'Verbessere und mache professioneller'],
                  ['📝 Kürzen', 'Kürze den Text und mache ihn prägnanter'],
                  ['💼 Förmlicher', 'Mache den Text förmlicher und geschäftlicher'],
                  ['😊 Freundlicher', 'Mache den Text freundlicher und lockerer'],
                ].map(([label, instruction]) => (
                  <button key={label} onClick={() => handleAiImprove(instruction)} disabled={aiLoading}
                    className={`w-full px-3 py-2 rounded-lg text-left text-sm flex items-center gap-2 ${aiLoading ? 'opacity-50 cursor-not-allowed' : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'}`}>
                    {label}
                  </button>
                ))}
              </div>
              {aiLoading && (
                <div className="flex items-center gap-2 text-purple-400 justify-center py-2">
                  <span className="animate-spin text-sm">⏳</span>
                  <span className="text-xs">KI denkt nach...</span>
                </div>
              )}
              {aiSuggestion && (
                <div className="space-y-2">
                  <p className={`text-xs ${c.textSecondary}`}>Vorschlag:</p>
                  <div className={`p-3 rounded-lg ${c.bg} border ${c.border} max-h-48 overflow-y-auto`}>
                    <p className={`text-xs ${c.text} whitespace-pre-wrap`}>{aiSuggestion}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={applyAiSuggestion}
                      className="flex-1 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-xs font-medium">
                      ✓ Übernehmen
                    </button>
                    <button onClick={() => setAiSuggestion('')}
                      className={`px-3 py-1.5 ${c.bgTertiary} ${c.text} rounded-lg text-xs`}>
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Vorlagen-Panel (Overlay) */}
      {showTemplates && (
        <div className="absolute inset-0 z-40 flex items-start justify-center pt-20 bg-black/40" onClick={() => setShowTemplates(false)}>
          <div
            className={`${c.bgSecondary} ${c.border} border rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`px-5 py-4 border-b ${c.border} flex items-center justify-between`}>
              <h3 className={`font-semibold ${c.text}`}>🧩 HTML-Vorlage auswählen</h3>
              <button onClick={() => setShowTemplates(false)} className={`${c.textSecondary} hover:${c.text}`}>✕</button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {HTML_TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => insertTemplate(tpl)}
                  className={`p-4 ${c.bgTertiary} ${c.hover} rounded-xl text-left border ${c.border} transition-colors group`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{tpl.icon}</span>
                    <span className={`font-medium ${c.text} text-sm`}>{tpl.name}</span>
                  </div>
                  {tpl.html && (
                    <div className="bg-white rounded p-2 text-xs text-gray-700 max-h-20 overflow-hidden pointer-events-none select-none"
                      dangerouslySetInnerHTML={{ __html: tpl.html }} />
                  )}
                  {!tpl.html && (
                    <p className={`text-xs ${c.textSecondary}`}>Eigenes HTML einfügen</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom-HTML-Paste-Dialog */}
      {showCustomPaste && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`${c.bgSecondary} ${c.border} border rounded-xl shadow-2xl w-full max-w-2xl mx-4`}>
            <div className={`px-5 py-4 border-b ${c.border} flex items-center justify-between`}>
              <h3 className={`font-semibold ${c.text}`}>🧩 HTML einfügen</h3>
              <button onClick={() => { setShowCustomPaste(false); setCustomHtmlPaste(''); }} className={`${c.textSecondary}`}>✕</button>
            </div>
            <div className="p-5 space-y-4">
              <textarea
                value={customHtmlPaste}
                onChange={e => setCustomHtmlPaste(e.target.value)}
                placeholder="HTML-Code hier einfügen..."
                className={`w-full h-56 px-4 py-3 rounded-lg ${c.input} font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none`}
                autoFocus
              />
              {customHtmlPaste && (
                <div>
                  <p className={`text-xs ${c.textSecondary} mb-2`}>Vorschau:</p>
                  <div className="bg-white rounded-lg p-3 max-h-40 overflow-y-auto">
                    <div className="text-gray-800 text-sm" dangerouslySetInnerHTML={{ __html: customHtmlPaste }} />
                  </div>
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setShowCustomPaste(false); setCustomHtmlPaste(''); }}
                  className={`px-4 py-2 ${c.bgTertiary} ${c.text} rounded-lg text-sm`}>
                  Abbrechen
                </button>
                <button onClick={applyCustomHtml} disabled={!customHtmlPaste.trim()}
                  className={`px-4 py-2 ${c.accentBg} ${c.accentHover} text-white rounded-lg text-sm disabled:opacity-50`}>
                  Einfügen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComposeEmail;
