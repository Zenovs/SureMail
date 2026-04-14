import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  RefreshCw, Mail, Calendar, Send, Inbox, Brain,
  AlertCircle, CheckCircle2, ChevronRight, Settings, MapPin,
  MessageSquare, User, Sparkles, Trash2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAccounts, useAccountStats } from '../context/AccountContext';
import { useOllama } from '../context/OllamaContext';

const OLLAMA_BASE_URL  = 'http://localhost:11434';
const BRIEF_CACHE_KEY  = 'coremail:dashboard-brief';
const CHAT_HISTORY_KEY = 'coremail:dashboard-chat';

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatEventTime(ev) {
  if (ev.isAllDay) return 'Ganztägig';
  return new Date(ev.start).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
}

function readCachedEmails(accountId) {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('CoreMailDB', 1);
      req.onerror = () => resolve([]);
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('emails')) { db.close(); resolve([]); return; }
        const tx = db.transaction('emails', 'readonly');
        const getReq = tx.objectStore('emails').get(`${accountId}:INBOX`);
        getReq.onsuccess = () => { db.close(); resolve(getReq.result?.emails || []); };
        getReq.onerror  = () => { db.close(); resolve([]); };
      };
    } catch { resolve([]); }
  });
}

function Skel({ className, style }) {
  return <div className={`animate-pulse rounded-lg ${className}`} style={style} />;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard({ onNavigate, onSelectAccount }) {
  const { currentTheme } = useTheme();
  const { accounts, setActiveAccountId } = useAccounts();
  const accountStats = useAccountStats();
  const { isAvailable, activeModel } = useOllama();
  const c = currentTheme.colors;

  const [now, setNow]                   = useState(new Date());
  const [aiLoading, setAiLoading]       = useState(false);
  const [aiError, setAiError]           = useState(null);
  const [calEvents, setCalEvents]       = useState([]);
  const [calLoading, setCalLoading]     = useState(false);
  const [calReady, setCalReady]         = useState(false);
  const abortRef   = useRef(null);
  const briefDone  = useRef(false);

  // ── Chat state ──────────────────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || '[]');
      // Only restore messages from today
      const today = new Date().toDateString();
      return Array.isArray(saved) && saved.length > 0 && saved[0]?.date === today
        ? saved[0].messages
        : [];
    } catch { return []; }
  });
  const [chatInput, setChatInput]       = useState('');
  const [chatLoading, setChatLoading]   = useState(false);
  const [chatError, setChatError]       = useState(null);
  const chatAbortRef  = useRef(null);
  const chatScrollRef = useRef(null);
  const chatInputRef  = useRef(null);

  // Persist chat history (today only)
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify([{
        date: new Date().toDateString(),
        messages: chatMessages.slice(-40) // keep last 40 messages
      }]));
    } catch { /* quota */ }
  }, [chatMessages]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  // ── Restore cached brief from localStorage ──────────────────────────────
  const today = new Date().toDateString();
  const [aiBrief, setAiBriefState] = useState(() => {
    try {
      const c = JSON.parse(localStorage.getItem(BRIEF_CACHE_KEY) || 'null');
      return (c?.date === today && c?.text) ? c.text : '';
    } catch { return ''; }
  });
  const setAiBrief = useCallback((text) => {
    setAiBriefState(text);
    if (text) {
      try { localStorage.setItem(BRIEF_CACHE_KEY, JSON.stringify({ text, date: today })); }
      catch { /* quota */ }
    }
  }, [today]);

  // ── Live clock (1-minute tick) ──────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  // ── Calendar: today's events ────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const m365 = accounts.find(a => a.type === 'microsoft');
      if (!m365 || !window.electronAPI?.calendarGetEvents) return;
      setCalLoading(true);
      try {
        const s = new Date(); s.setHours(0, 0, 0, 0);
        const e = new Date(); e.setHours(23, 59, 59, 999);
        const res = await window.electronAPI.calendarGetEvents(m365.id, {
          startDate: s.toISOString(), endDate: e.toISOString()
        });
        if (res?.success) {
          setCalEvents(res.events.sort((a, b) => new Date(a.start) - new Date(b.start)));
        }
      } catch (err) {
        console.error('[Dashboard] Calendar:', err);
      } finally {
        setCalLoading(false);
        setCalReady(true);
      }
    };
    if (accounts.length > 0) load();
    else setCalReady(true);
  }, [accounts]);

  // ── Collect recent unread emails from IndexedDB ─────────────────────────
  const getUnread = useCallback(async () => {
    const all = [];
    for (const acc of accounts.slice(0, 4)) {
      const emails = await readCachedEmails(acc.id);
      emails
        .filter(e => !e.seen)
        .slice(0, 4)
        .forEach(e => all.push({ from: e.from, subject: e.subject, preview: (e.preview || '').slice(0, 80) }));
    }
    return all.slice(0, 8);
  }, [accounts]);

  // ── Build context string for AI ─────────────────────────────────────────
  const buildContext = useCallback(async () => {
    const emails  = await getUnread();
    const total   = Object.values(accountStats).reduce((s, x) => s + (x?.unread || 0), 0);
    const dateStr = new Date().toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = new Date().toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });

    const emailLines = emails.length > 0
      ? emails.map(e => `- Von: ${e.from}, Betreff: "${e.subject}"${e.preview ? `, Inhalt: ${e.preview}` : ''}`).join('\n')
      : 'Keine ungelesenen E-Mails.';

    const calLines = calEvents.length > 0
      ? calEvents.map(ev => {
          const time = formatEventTime(ev);
          const end  = ev.isAllDay ? '' : ` – ${new Date(ev.end).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}`;
          const loc  = ev.location ? ` | Ort: ${ev.location}` : '';
          const org  = ev.organizer ? ` | Organisator: ${ev.organizer}` : '';
          const prev = ev.preview   ? ` | Info: ${ev.preview.slice(0, 100)}` : '';
          return `- ${time}${end}: ${ev.title}${loc}${org}${prev}`;
        }).join('\n')
      : 'Keine Termine heute.';

    return { dateStr, timeStr, total, emailLines, calLines };
  }, [calEvents, accountStats, getUnread]);

  // ── AI daily brief via Ollama /api/chat streaming ─────────────────────
  const generateBrief = useCallback(async () => {
    if (!isAvailable) return;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setAiLoading(true);
    setAiError(null);
    setAiBrief('');

    try {
      const { dateStr, total, emailLines, calLines } = await buildContext();

      const messages = [
        {
          role: 'system',
          content:
`Du bist mein persönlicher Tagesassistent. Deine wichtigste Aufgabe: mir einen klaren Überblick geben, was ich heute erledigen muss.
Analysiere meine Termine und E-Mails und leite daraus konkrete Aufgaben und Prioritäten ab.
Sprich mich direkt mit "du" an. Schreibe fliessend und klar — wie ein guter Assistent, nicht wie eine Maschine.
Antworte immer auf Deutsch. Keine Aufzählungszeichen, keine Bullet-Points.
Struktur: 1) Was steht heute an (Termine + daraus entstehende Aufgaben), 2) Was muss ich aufgrund der E-Mails tun, 3) Meine wichtigste Priorität für heute.`
        },
        {
          role: 'user',
          content:
`Heute ist ${dateStr}. Ich habe ${total} ungelesene E-Mail${total !== 1 ? 's' : ''}.

Meine heutigen Kalendereinträge:
${calLines}

Meine ungelesenen E-Mails:
${emailLines}

Was muss ich heute tun? Erstelle mein persönliches Tagesbriefing mit konkreten Aufgaben und Prioritäten. Maximal 4 kurze Absätze.`
        }
      ];

      const resp = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({ model: activeModel, messages, stream: true })
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        throw new Error(errText || `HTTP ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const dec    = new TextDecoder();
      let   text   = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split('\n').filter(Boolean)) {
          try {
            const j = JSON.parse(line);
            if (j.message?.content) { text += j.message.content; setAiBrief(text); }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setAiError(`KI-Fehler: ${err.message}`);
      }
    } finally {
      setAiLoading(false);
    }
  }, [isAvailable, activeModel, buildContext]);

  // Auto-generate once when Ollama + accounts + calendar are all ready.
  useEffect(() => {
    if (!isAvailable || accounts.length === 0 || !calReady || briefDone.current) return;
    briefDone.current = true;
    try {
      const cached = JSON.parse(localStorage.getItem(BRIEF_CACHE_KEY) || 'null');
      if (cached?.date === new Date().toDateString() && cached?.text) return;
    } catch { /* continue */ }
    generateBrief();
  }, [isAvailable, accounts.length, calReady]); // eslint-disable-line

  // ── AI Chat ─────────────────────────────────────────────────────────────
  const sendChatMessage = useCallback(async () => {
    const input = chatInput.trim();
    if (!input || !isAvailable || chatLoading) return;

    setChatInput('');
    setChatError(null);

    const userMsg = { role: 'user', content: input, ts: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);

    if (chatAbortRef.current) chatAbortRef.current.abort();
    chatAbortRef.current = new AbortController();
    setChatLoading(true);

    // Placeholder for streaming assistant message
    const assistantId = Date.now() + 1;
    setChatMessages(prev => [...prev, { role: 'assistant', content: '', ts: assistantId, streaming: true }]);

    try {
      const { dateStr, timeStr, total, emailLines, calLines } = await buildContext();

      // Build conversation history for context (last 10 messages, excluding the streaming placeholder)
      const history = chatMessages
        .filter(m => !m.streaming)
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const systemPrompt =
`Du bist mein persönlicher KI-Assistent direkt in meiner E-Mail-App CoreMail.
Du hast Zugriff auf meinen heutigen Kalender und meine ungelesenen E-Mails.
Beantworte meine Fragen direkt, präzise und auf Deutsch.
Sprich mich mit "du" an. Antworte kurz und auf den Punkt — kein Blabla.
Wenn ich nach Terminen oder Personen frage, schau in den Kalendereinträgen nach.
Wenn ich nach E-Mails oder Absendern frage, schau in den E-Mail-Daten nach.

Heutiges Datum: ${dateStr}, Uhrzeit: ${timeStr}
Ungelesene E-Mails gesamt: ${total}

MEINE HEUTIGEN KALENDEREINTRÄGE:
${calLines}

MEINE UNGELESENEN E-MAILS:
${emailLines}`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: input }
      ];

      const resp = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: chatAbortRef.current.signal,
        body: JSON.stringify({ model: activeModel, messages, stream: true })
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        throw new Error(errText || `HTTP ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const dec    = new TextDecoder();
      let   text   = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split('\n').filter(Boolean)) {
          try {
            const j = JSON.parse(line);
            if (j.message?.content) {
              text += j.message.content;
              setChatMessages(prev => prev.map(m =>
                m.ts === assistantId ? { ...m, content: text } : m
              ));
            }
          } catch { /* skip malformed */ }
        }
      }

      // Mark streaming done
      setChatMessages(prev => prev.map(m =>
        m.ts === assistantId ? { ...m, streaming: false } : m
      ));
    } catch (err) {
      if (err.name !== 'AbortError') {
        setChatError(`Fehler: ${err.message}`);
        setChatMessages(prev => prev.filter(m => m.ts !== assistantId));
      }
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, isAvailable, chatLoading, chatMessages, activeModel, buildContext]);

  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const clearChat = () => {
    setChatMessages([]);
    setChatError(null);
    localStorage.removeItem(CHAT_HISTORY_KEY);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      chatAbortRef.current?.abort();
    };
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────
  const greeting = () => {
    const h = now.getHours();
    if (h < 5)  return 'Gute Nacht';
    if (h < 12) return 'Guten Morgen';
    if (h < 17) return 'Guten Tag';
    if (h < 22) return 'Guten Abend';
    return 'Gute Nacht';
  };
  const totalUnread  = Object.values(accountStats).reduce((s, x) => s + (x?.unread || 0), 0);
  const hasMicrosoft = accounts.some(a => a.type === 'microsoft');

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`flex-1 overflow-auto ${c.bg}`}>
      <div className="max-w-6xl mx-auto p-6 space-y-5">

        {/* ── Hero header ─────────────────────────────────────────────── */}
        <div className={`rounded-2xl p-6 ${c.card} ${c.border} border`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className={`text-xs font-medium uppercase tracking-widest ${c.textSecondary} mb-1.5`}>
                {now.toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <h1 className={`text-3xl font-bold ${c.text} mb-3`}>{greeting()}</h1>
              <div className="flex flex-wrap items-center gap-4">
                <span className={`inline-flex items-center gap-1.5 text-sm ${totalUnread > 0 ? 'text-blue-400' : c.textSecondary}`}>
                  <Mail className="w-4 h-4" />
                  {totalUnread > 0 ? <><strong>{totalUnread}</strong>&nbsp;ungelesen</> : 'Keine ungelesenen Mails'}
                </span>
                <span className={`inline-flex items-center gap-1.5 text-sm ${calEvents.length > 0 ? 'text-cyan-400' : c.textSecondary}`}>
                  <Calendar className="w-4 h-4" />
                  {calEvents.length > 0
                    ? <><strong>{calEvents.length}</strong>&nbsp;Termin{calEvents.length !== 1 ? 'e' : ''} heute</>
                    : 'Keine Termine heute'}
                </span>
                <span className={`inline-flex items-center gap-1.5 text-sm ${c.textSecondary}`}>
                  <Inbox className="w-4 h-4" />
                  {accounts.length}&nbsp;Konto{accounts.length !== 1 ? 'en' : ''}
                </span>
              </div>
            </div>
            <div className={`text-4xl font-mono font-light tabular-nums ${c.accent} flex-shrink-0`}>
              {now.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* ── AI Brief + Calendar grid ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* AI Brief — 3/5 */}
          <div className={`lg:col-span-3 rounded-2xl p-5 ${c.card} ${c.border} border flex flex-col min-h-[220px]`}>
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h2 className={`text-sm font-semibold ${c.text}`}>KI-Tagesbriefing</h2>
                  <p className={`text-xs ${c.textSecondary}`}>
                    {isAvailable ? activeModel : 'Ollama nicht aktiv'}
                  </p>
                </div>
              </div>
              {isAvailable && (
                <button
                  onClick={generateBrief}
                  disabled={aiLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${c.bgTertiary} ${c.text} ${c.hover} disabled:opacity-40 transition-colors border ${c.border}`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                  {aiLoading ? 'Generiere…' : 'Aktualisieren'}
                </button>
              )}
            </div>

            <div className="flex-1">
              {!isAvailable && (
                <div className={`flex items-start gap-3 p-4 rounded-xl ${c.bgTertiary}`}>
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className={`text-sm font-medium ${c.text} mb-0.5`}>Ollama nicht erreichbar</p>
                    <p className={`text-xs ${c.textSecondary}`}>
                      Starte Ollama:{' '}
                      <code className="font-mono text-cyan-400">ollama serve</code>
                    </p>
                  </div>
                </div>
              )}

              {aiError && !aiLoading && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-300">{aiError}</p>
                </div>
              )}

              {aiLoading && !aiBrief && (
                <div className="space-y-2.5 pt-1">
                  {[85, 70, 92, 62, 78].map((w, i) => (
                    <Skel key={i} className={c.bgTertiary} style={{ height: 14, width: `${w}%` }} />
                  ))}
                </div>
              )}

              {aiBrief && (
                <p className={`text-sm ${c.text} leading-relaxed whitespace-pre-wrap`}>
                  {aiBrief}
                  {aiLoading && (
                    <span className="inline-block w-1.5 h-4 bg-cyan-400 ml-0.5 rounded-sm animate-pulse align-text-bottom" />
                  )}
                </p>
              )}

              {isAvailable && !aiLoading && !aiBrief && !aiError && accounts.length === 0 && (
                <p className={`text-sm ${c.textSecondary} italic`}>
                  Füge ein Konto hinzu, damit die KI deine Mails zusammenfassen kann.
                </p>
              )}
            </div>
          </div>

          {/* Calendar today — 2/5 */}
          <div className={`lg:col-span-2 rounded-2xl p-5 ${c.card} ${c.border} border flex flex-col min-h-[220px]`}>
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-purple-400" />
                </div>
                <h2 className={`text-sm font-semibold ${c.text}`}>Heute</h2>
              </div>
              <button
                onClick={() => onNavigate('calendar')}
                className={`text-xs ${c.accent} hover:opacity-70 flex items-center gap-0.5 transition-opacity`}
              >
                Alle <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex-1">
              {!hasMicrosoft && (
                <div className="text-center py-8">
                  <Calendar className={`w-8 h-8 mx-auto mb-2 opacity-20 ${c.text}`} />
                  <p className={`text-xs ${c.textSecondary}`}>Nur für Microsoft 365-Konten</p>
                </div>
              )}
              {hasMicrosoft && calLoading && (
                <div className="space-y-2.5">
                  {[1, 2, 3].map(i => (
                    <Skel key={i} className={c.bgTertiary} style={{ height: 48, width: '100%' }} />
                  ))}
                </div>
              )}
              {hasMicrosoft && !calLoading && calEvents.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-9 h-9 mx-auto mb-2 text-green-500 opacity-40" />
                  <p className={`text-sm ${c.textSecondary}`}>Heute frei — keine Termine</p>
                </div>
              )}
              {hasMicrosoft && !calLoading && calEvents.length > 0 && (
                <div className="space-y-2 overflow-auto max-h-[260px] pr-1">
                  {calEvents.map(ev => {
                    const isPast = !ev.isAllDay && new Date(ev.end) < now;
                    return (
                      <div key={ev.id}
                        className={`flex items-start gap-3 p-2.5 rounded-xl ${c.bgTertiary} transition-opacity ${isPast ? 'opacity-40' : ''}`}>
                        <div className="flex-shrink-0 min-w-[48px] text-right pt-0.5">
                          <span className="text-xs font-mono text-cyan-400 font-medium">
                            {formatEventTime(ev)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium truncate ${c.text}`}>{ev.title}</p>
                          {ev.location && (
                            <p className={`text-xs ${c.textSecondary} truncate flex items-center gap-1 mt-0.5`}>
                              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                              {ev.location}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── KI-Chat ──────────────────────────────────────────────────────── */}
        <div className={`rounded-2xl ${c.card} ${c.border} border flex flex-col`} style={{ minHeight: 360 }}>
          {/* Header */}
          <div className={`flex items-center justify-between px-5 py-4 border-b ${c.border} flex-shrink-0`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h2 className={`text-sm font-semibold ${c.text}`}>KI-Assistent</h2>
                <p className={`text-xs ${c.textSecondary}`}>
                  {isAvailable
                    ? 'Frag mich zu deinen Terminen, Mails oder was auch immer'
                    : 'Ollama nicht aktiv — starte mit: ollama serve'}
                </p>
              </div>
            </div>
            {chatMessages.length > 0 && (
              <button
                onClick={clearChat}
                title="Verlauf löschen"
                className={`p-1.5 rounded-lg ${c.hover} ${c.textSecondary} hover:text-red-400 transition-colors`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Messages */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
            style={{ maxHeight: 400 }}
          >
            {chatMessages.length === 0 && !chatLoading && (
              <div className="h-full flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className={`w-10 h-10 mb-3 opacity-20 ${c.text}`} />
                <p className={`text-sm ${c.textSecondary} mb-4`}>
                  Stell mir eine Frage zu deinen Terminen oder Mails
                </p>
                {/* Suggestion chips */}
                {isAvailable && (
                  <div className="flex flex-wrap gap-2 justify-center max-w-md">
                    {[
                      'Welche Termine habe ich heute noch?',
                      'Gibt es dringende E-Mails?',
                      'Wann ist mein nächster Termin?',
                      'Was muss ich heute noch erledigen?',
                    ].map(suggestion => (
                      <button
                        key={suggestion}
                        onClick={() => { setChatInput(suggestion); chatInputRef.current?.focus(); }}
                        className={`text-xs px-3 py-1.5 rounded-full ${c.bgTertiary} ${c.text} ${c.hover} border ${c.border} transition-colors`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-cyan-600/80 text-white rounded-br-sm'
                      : `${c.bgTertiary} ${c.text} rounded-bl-sm border ${c.border}`
                  }`}
                >
                  {msg.content
                    ? <span className="whitespace-pre-wrap">{msg.content}</span>
                    : <span className="flex gap-1 items-center py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                  }
                  {msg.streaming && msg.content && (
                    <span className="inline-block w-1 h-3.5 bg-current ml-0.5 rounded-sm animate-pulse align-text-bottom opacity-70" />
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-600/20 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                )}
              </div>
            ))}

            {chatError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{chatError}</p>
              </div>
            )}
          </div>

          {/* Input */}
          <div className={`px-4 py-3 border-t ${c.border} flex-shrink-0`}>
            <div className="flex gap-2 items-end">
              <textarea
                ref={chatInputRef}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder={isAvailable ? 'Frag mich etwas… (Enter zum Senden, Shift+Enter für Zeilenumbruch)' : 'Ollama nicht aktiv'}
                disabled={!isAvailable || chatLoading}
                rows={1}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm resize-none ${c.input} border disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all`}
                style={{ maxHeight: 120, minHeight: 42 }}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
              <button
                onClick={sendChatMessage}
                disabled={!isAvailable || chatLoading || !chatInput.trim()}
                className="w-10 h-10 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Account cards ────────────────────────────────────────────────── */}
        <div className={`rounded-2xl p-5 ${c.card} ${c.border} border`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                <Inbox className="w-4 h-4 text-blue-400" />
              </div>
              <h2 className={`text-sm font-semibold ${c.text}`}>Kontenübersicht</h2>
            </div>
            <button
              onClick={() => onNavigate('accounts')}
              className={`text-xs ${c.accent} hover:opacity-70 flex items-center gap-0.5 transition-opacity`}
            >
              Verwalten <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <Mail className={`w-10 h-10 mx-auto mb-3 opacity-20 ${c.text}`} />
              <p className={`text-sm ${c.textSecondary} mb-4`}>Noch kein Konto eingerichtet</p>
              <button
                onClick={() => onNavigate('accounts')}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Konto hinzufügen
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {accounts.map(account => {
                const stats  = accountStats[account.id];
                const unread = stats?.unread || 0;
                const total  = stats?.total  || 0;
                return (
                  <button
                    key={account.id}
                    onClick={() => {
                      setActiveAccountId?.(account.id);
                      onSelectAccount?.(account.id);
                      onNavigate('inbox');
                    }}
                    className={`group flex items-center gap-3 p-3.5 rounded-xl ${c.bgTertiary} ${c.hover} text-left border ${c.border} hover:border-cyan-500/30 transition-all`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-white/5 flex items-center justify-center flex-shrink-0">
                      {account.type === 'microsoft' ? (
                        <svg viewBox="0 0 21 21" className="w-5 h-5" fill="none">
                          <rect x="1"  y="1"  width="9" height="9" fill="#f25022"/>
                          <rect x="11" y="1"  width="9" height="9" fill="#7fba00"/>
                          <rect x="1"  y="11" width="9" height="9" fill="#00a4ef"/>
                          <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                        </svg>
                      ) : (
                        <Mail className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${c.text}`}>{account.displayName || account.name}</p>
                      <p className={`text-xs ${c.textSecondary} truncate`}>
                        {total > 0 ? `${total} Mails gecacht` : 'Keine Mails gecacht'}
                      </p>
                    </div>
                    {unread > 0 && (
                      <span className="flex-shrink-0 min-w-[22px] h-5 px-1.5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Quick actions ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Verfassen',     icon: Send,     action: 'compose',  col: 'text-cyan-400',   bg: 'bg-cyan-500/10',   hb: 'hover:border-cyan-500/30' },
            { label: 'Posteingang',   icon: Inbox,    action: 'inbox',    col: 'text-blue-400',   bg: 'bg-blue-500/10',   hb: 'hover:border-blue-500/30' },
            { label: 'Kalender',      icon: Calendar, action: 'calendar', col: 'text-purple-400', bg: 'bg-purple-500/10', hb: 'hover:border-purple-500/30' },
            { label: 'Einstellungen', icon: Settings, action: 'settings', col: 'text-gray-400',   bg: 'bg-white/5',       hb: 'hover:border-white/20' },
          ].map(({ label, icon: Icon, action, col, bg, hb }) => (
            <button
              key={action}
              onClick={() => onNavigate(action)}
              className={`group flex items-center gap-3 p-4 rounded-xl ${c.card} ${c.border} border ${hb} ${c.hover} transition-all`}
            >
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${col}`} />
              </div>
              <span className={`text-sm font-medium ${c.text} flex-1 text-left`}>{label}</span>
              <ChevronRight className={`w-4 h-4 ${c.textSecondary} opacity-0 group-hover:opacity-60 transition-opacity`} />
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
