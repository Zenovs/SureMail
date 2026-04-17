import { useState, useEffect, useCallback, useRef } from 'react';
import {
  RefreshCw, Mail, Calendar, Send, Inbox, Brain,
  AlertCircle, CheckCircle2, ChevronRight, Settings, MapPin,
  MessageSquare, User, Sparkles, Trash2, Bell,
  Plus, X, Eye, Clock, ChevronDown, ChevronUp,
  Bot, Play
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAccounts, useAccountStats } from '../context/AccountContext';
import { useOllama } from '../context/OllamaContext';

const OLLAMA_BASE_URL   = 'http://localhost:11434';
const BRIEF_CACHE_KEY   = 'coremail:dashboard-brief';
const CHAT_HISTORY_KEY  = 'coremail:dashboard-chat';
const WATCH_LIST_KEY    = 'coremail:watch-list';
const NOTIFIED_KEY      = 'coremail:notified-ids';
const AUTO_RULES_KEY    = 'coremail:auto-rules';
const AUTO_PROCESSED_KEY = 'coremail:auto-processed';
const BRIEF_TTL_MS      = 60 * 60 * 1000; // 1 hour

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

function loadWatchList() {
  try { return JSON.parse(localStorage.getItem(WATCH_LIST_KEY) || '[]'); }
  catch { return []; }
}
function saveWatchList(list) {
  try { localStorage.setItem(WATCH_LIST_KEY, JSON.stringify(list)); } catch { /* quota */ }
}
function loadNotifiedIds() {
  try { return new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveNotifiedIds(set) {
  try {
    const arr = [...set].slice(-200); // keep last 200 to avoid bloat
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(arr));
  } catch { /* quota */ }
}
function loadAutoRules() {
  try { return JSON.parse(localStorage.getItem(AUTO_RULES_KEY) || '[]'); }
  catch { return []; }
}
function saveAutoRules(list) {
  try { localStorage.setItem(AUTO_RULES_KEY, JSON.stringify(list)); } catch { /* quota */ }
}
function loadProcessedIds() {
  try { return new Set(JSON.parse(localStorage.getItem(AUTO_PROCESSED_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveProcessedIds(set) {
  try {
    const arr = [...set].slice(-1000);
    localStorage.setItem(AUTO_PROCESSED_KEY, JSON.stringify(arr));
  } catch { /* quota */ }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard({ onNavigate, onSelectAccount }) {
  const { currentTheme } = useTheme();
  const { accounts, setActiveAccountId } = useAccounts();
  const accountStats = useAccountStats();
  const { isAvailable, isAiEnabled, activeModel } = useOllama();
  const showAi = isAiEnabled && isAvailable;
  const c = currentTheme.colors;

  const [now, setNow]                   = useState(new Date());
  const [aiLoading, setAiLoading]       = useState(false);
  const [aiError, setAiError]           = useState(null);
  const [calEvents, setCalEvents]       = useState([]);       // today
  const [upcomingEvents, setUpcoming]   = useState([]);       // next 7 days
  const [calLoading, setCalLoading]     = useState(false);
  const [calReady, setCalReady]         = useState(false);
  const abortRef   = useRef(null);
  const briefDone  = useRef(false);

  // ── Watch list ──────────────────────────────────────────────────────────────
  const [watchList, setWatchListState]  = useState(loadWatchList);
  const [watchInput, setWatchInput]     = useState('');
  const [showWatches, setShowWatches]   = useState(false);

  // ── Auto-rules ─────────────────────────────────────────────────────────────
  const [autoRules, setAutoRulesState]  = useState(loadAutoRules);
  const [ruleInput, setRuleInput]       = useState('');
  const [showRules, setShowRules]       = useState(false);
  const [rulesRunning, setRulesRunning] = useState(false);
  const [rulesLog, setRulesLog]         = useState('');
  const notifiedIdsRef = useRef(loadNotifiedIds());
  const notifiedEventsRef = useRef(new Set()); // event IDs notified this session

  const setWatchList = useCallback((list) => {
    setWatchListState(list);
    saveWatchList(list);
  }, []);

  const addWatch = useCallback(() => {
    const text = watchInput.trim();
    if (!text) return;
    const entry = { id: Date.now().toString(), text, addedAt: new Date().toISOString() };
    setWatchList([...watchList, entry]);
    setWatchInput('');
  }, [watchInput, watchList, setWatchList]);

  const removeWatch = useCallback((id) => {
    setWatchList(watchList.filter(w => w.id !== id));
  }, [watchList, setWatchList]);

  // ── Auto-rules callbacks ────────────────────────────────────────────────────
  const setAutoRules = useCallback((list) => {
    setAutoRulesState(list);
    saveAutoRules(list);
  }, []);

  const addRule = useCallback(() => {
    const text = ruleInput.trim();
    if (!text) return;
    setAutoRules([...autoRules, { id: Date.now().toString(), text, enabled: true, addedAt: new Date().toISOString() }]);
    setRuleInput('');
  }, [ruleInput, autoRules, setAutoRules]);

  const removeRule = useCallback((id) => {
    setAutoRules(autoRules.filter(r => r.id !== id));
  }, [autoRules, setAutoRules]);

  const toggleRule = useCallback((id) => {
    setAutoRules(autoRules.map(r => r.id === id ? { ...r, enabled: r.enabled === false } : r));
  }, [autoRules, setAutoRules]);

  const runAutoRules = useCallback(async () => {
    if (!showAi) return;
    const enabledRules = autoRules.filter(r => r.enabled !== false);
    if (enabledRules.length === 0) return;

    const allEmails = await getAllEmails();
    const processed = loadProcessedIds();
    const newEmails = allEmails.filter(e => !processed.has(`${e.accountId}:${e.uid}`));

    // Mark all as processed regardless — avoids re-checking on next sync
    allEmails.forEach(e => processed.add(`${e.accountId}:${e.uid}`));
    saveProcessedIds(processed);

    if (newEmails.length === 0) return;

    setRulesRunning(true);
    setRulesLog('');
    try {
      const rulesText = enabledRules.map((r, i) => `${i + 1}. ${r.text}`).join('\n');
      const emailsText = newEmails.slice(0, 30).map(e => {
        const acc = accounts.find(a => a.id === e.accountId);
        const accountType = acc?.type === 'microsoft' ? 'graph' : 'imap';
        return `uid:"${e.uid}" accountId:"${e.accountId}" accountType:"${accountType}" from:"${e.from}" subject:"${e.subject}" preview:"${(e.preview || '').slice(0, 80)}"`;
      }).join('\n');

      const messages = [
        {
          role: 'system',
          content: `Du bist ein E-Mail-Automatisierungs-Assistent. Wende die Regeln auf die E-Mails an.
Antworte NUR mit einem JSON-Array, kein anderer Text, keine Erklärungen, kein Markdown.
Mögliche Aktionen:
- move: { "action":"move", "uid":"...", "accountId":"...", "accountType":"imap|graph", "destFolder":"Ordnername" }
- markRead: { "action":"markRead", "uid":"...", "accountId":"...", "accountType":"imap|graph" }
Wenn keine Regel zutrifft: []`
        },
        {
          role: 'user',
          content: `REGELN:\n${rulesText}\n\nE-MAILS:\n${emailsText}\n\nJSON-Array mit Aktionen:`
        }
      ];

      const resp = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: activeModel, messages, stream: false })
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const content = data.message?.content || '[]';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) { setRulesLog(`Keine Aktionen (${newEmails.length} geprüft)`); return; }
      const actions = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(actions) || actions.length === 0) {
        setRulesLog(`Keine Aktionen (${newEmails.length} geprüft)`);
        return;
      }

      let done = 0;
      for (const act of actions) {
        try {
          const { action, uid, accountId, accountType, destFolder } = act;
          if (action === 'move' && destFolder) {
            if (accountType === 'graph') {
              const res = await window.electronAPI.listGraphFolders(accountId);
              const folder = (res?.folders || []).find(f => f.name.toLowerCase() === destFolder.toLowerCase());
              if (folder) { await window.electronAPI.moveGraphEmail(accountId, uid, folder.id); done++; }
            } else {
              await window.electronAPI.moveEmail(accountId, uid, 'INBOX', destFolder);
              done++;
            }
          } else if (action === 'markRead') {
            if (accountType === 'graph') {
              await window.electronAPI.markGraphAsRead(accountId, uid, true);
            } else {
              await window.electronAPI.markAsRead(accountId, uid, true, 'INBOX');
            }
            done++;
          }
        } catch (e) { console.error('[AutoRules] action failed:', e); }
      }
      setRulesLog(`${done} Aktion${done !== 1 ? 'en' : ''} ausgeführt`);
    } catch (err) {
      console.error('[AutoRules]', err);
      setRulesLog(`Fehler: ${err.message}`);
    } finally {
      setRulesRunning(false);
    }
  }, [showAi, autoRules, getAllEmails, accounts, activeModel]);

  // Run auto-rules on every background sync
  useEffect(() => {
    const handler = () => runAutoRules();
    window.addEventListener('coremail:bgSync', handler);
    return () => window.removeEventListener('coremail:bgSync', handler);
  }, [runAutoRules]);

  // ── Chat state ──────────────────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || '[]');
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
        messages: chatMessages.slice(-40)
      }]));
    } catch { /* quota */ }
  }, [chatMessages]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  // ── Restore cached brief (1h TTL) ──────────────────────────────────────
  const [aiBrief, setAiBriefState] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(BRIEF_CACHE_KEY) || 'null');
      return (cached?.ts && Date.now() - cached.ts < BRIEF_TTL_MS && cached?.text) ? cached.text : '';
    } catch { return ''; }
  });
  const [briefLastUpdated, setBriefLastUpdated] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(BRIEF_CACHE_KEY) || 'null');
      return cached?.ts || null;
    } catch { return null; }
  });
  const setAiBrief = useCallback((text) => {
    setAiBriefState(text);
    if (text) {
      const ts = Date.now();
      setBriefLastUpdated(ts);
      try { localStorage.setItem(BRIEF_CACHE_KEY, JSON.stringify({ text, ts })); }
      catch { /* quota */ }
    }
  }, []);

  // ── Live clock ──────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  // ── Calendar: today + next 7 days ───────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const m365 = accounts.find(a => a.type === 'microsoft');
      if (!m365 || !window.electronAPI?.calendarGetEvents) { setCalReady(true); return; }
      setCalLoading(true);
      try {
        // Today
        const s = new Date(); s.setHours(0, 0, 0, 0);
        const e = new Date(); e.setHours(23, 59, 59, 999);
        const resT = await window.electronAPI.calendarGetEvents(m365.id, {
          startDate: s.toISOString(), endDate: e.toISOString()
        });
        if (resT?.success) {
          setCalEvents(resT.events.sort((a, b) => new Date(a.start) - new Date(b.start)));
        }
        // Next 7 days (tomorrow → +7)
        const s7 = new Date(); s7.setDate(s7.getDate() + 1); s7.setHours(0, 0, 0, 0);
        const e7 = new Date(); e7.setDate(e7.getDate() + 7); e7.setHours(23, 59, 59, 999);
        const res7 = await window.electronAPI.calendarGetEvents(m365.id, {
          startDate: s7.toISOString(), endDate: e7.toISOString()
        });
        if (res7?.success) {
          setUpcoming(res7.events.sort((a, b) => new Date(a.start) - new Date(b.start)));
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

  // ── Collect ALL recent emails from IndexedDB ────────────────────────────
  const getAllEmails = useCallback(async () => {
    const all = [];
    for (const acc of accounts) {
      const emails = await readCachedEmails(acc.id);
      const sorted = [...emails].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      sorted.slice(0, 50).forEach(e => all.push({
        uid: e.uid || '',
        account: acc.displayName || acc.name || acc.email || acc.id,
        accountId: acc.id,
        from: e.from || '',
        to: e.to || '',
        subject: e.subject || '',
        preview: (e.preview || e.text || '').slice(0, 500),
        date: e.date ? new Date(e.date).toLocaleString('de-CH', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '',
        rawDate: e.date || null,
        seen: !!e.seen,
      }));
    }
    return all.sort((a, b) => new Date(b.rawDate || 0) - new Date(a.rawDate || 0)).slice(0, 150);
  }, [accounts]);

  // ── Proactive notifications ─────────────────────────────────────────────
  const checkNotifications = useCallback(async () => {
    if (!window.electronAPI?.showNotification) return;
    const emails = await getAllEmails();
    const notifiedIds = notifiedIdsRef.current;
    const currentWatchList = loadWatchList();

    // 1. New unread emails matching watch list
    for (const email of emails) {
      if (email.seen) continue;
      const uid = email.uid || `${email.account}:${email.subject}:${email.date}`;
      if (notifiedIds.has(uid)) continue;

      // Check if matches any watch entry
      const matched = currentWatchList.find(w => {
        const q = w.text.toLowerCase();
        return (
          email.from.toLowerCase().includes(q) ||
          email.subject.toLowerCase().includes(q) ||
          email.preview.toLowerCase().includes(q)
        );
      });

      if (matched) {
        notifiedIds.add(uid);
        saveNotifiedIds(notifiedIds);
        window.electronAPI.showNotification({
          title: `📬 Erwartete Mail erhalten`,
          body: `Von: ${email.from}\nBetreff: ${email.subject}`
        }).catch(() => {});
      }

      // Notify all new unread emails (deduplicated)
      if (!matched) {
        notifiedIds.add(uid);
        saveNotifiedIds(notifiedIds);
        window.electronAPI.showNotification({
          title: `Neue E-Mail: ${email.subject}`,
          body: `Von: ${email.from}`
        }).catch(() => {});
      }
    }

    // 2. Upcoming appointments (within 30 minutes)
    const allEvents = [...calEvents, ...upcomingEvents];
    const nowMs = Date.now();
    for (const ev of allEvents) {
      if (ev.isAllDay) continue;
      const startMs = new Date(ev.start).getTime();
      const diffMin = (startMs - nowMs) / 60000;
      if (diffMin > 0 && diffMin <= 30 && !notifiedEventsRef.current.has(ev.id)) {
        notifiedEventsRef.current.add(ev.id);
        const timeStr = new Date(ev.start).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
        window.electronAPI.showNotification({
          title: `📅 Termin in ${Math.round(diffMin)} Minuten`,
          body: `${ev.title}${ev.location ? ` · ${ev.location}` : ''} um ${timeStr}`
        }).catch(() => {});
      }
    }
  }, [getAllEmails, calEvents, upcomingEvents]);

  // Listen to background sync events → check notifications
  useEffect(() => {
    const handler = () => checkNotifications();
    window.addEventListener('coremail:bgSync', handler);
    return () => window.removeEventListener('coremail:bgSync', handler);
  }, [checkNotifications]);

  // Also check every 10 minutes for upcoming appointments
  useEffect(() => {
    const id = setInterval(() => checkNotifications(), 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [checkNotifications]);

  // ── Build context string for AI ─────────────────────────────────────────
  const buildContext = useCallback(async () => {
    const emails  = await getAllEmails();
    const unreadCount = Object.values(accountStats).reduce((s, x) => s + (x?.unread || 0), 0);
    const dateStr = new Date().toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = new Date().toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });

    const emailLines = emails.length > 0
      ? emails.map(e =>
          `- [${e.seen ? 'gelesen' : 'UNGELESEN'}] ${e.date} | Konto: ${e.account} | Von: ${e.from}${e.to ? ` | An: ${e.to}` : ''} | Betreff: "${e.subject}"${e.preview ? ` | Inhalt: ${e.preview}` : ''}`
        ).join('\n')
      : 'Keine E-Mails im Cache.';

    const fmtEvent = (ev) => {
      const time = formatEventTime(ev);
      const end  = ev.isAllDay ? '' : ` – ${new Date(ev.end).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}`;
      const loc  = ev.location ? ` | Ort: ${ev.location}` : '';
      const org  = ev.organizer ? ` | Organisator: ${ev.organizer}` : '';
      const prev = ev.preview   ? ` | Info: ${ev.preview.slice(0, 150)}` : '';
      return `- ${time}${end}: ${ev.title}${loc}${org}${prev}`;
    };

    const calLines = calEvents.length > 0
      ? calEvents.map(fmtEvent).join('\n')
      : 'Keine Termine heute.';

    const upcomingLines = upcomingEvents.length > 0
      ? upcomingEvents.slice(0, 15).map(ev => {
          const day = new Date(ev.start).toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'short' });
          return `- ${day} ${fmtEvent(ev).slice(2)}`;
        }).join('\n')
      : 'Keine weiteren Termine diese Woche.';

    const watchLines = watchList.length > 0
      ? watchList.map(w => `- "${w.text}"`).join('\n')
      : 'Keine Einträge.';

    return {
      dateStr, timeStr, unreadCount,
      emailLines, calLines, upcomingLines, watchLines,
      emailCount: emails.length,
      watchCount: watchList.length,
    };
  }, [calEvents, upcomingEvents, accountStats, getAllEmails, watchList]);

  // ── AI daily brief via Ollama streaming ────────────────────────────────
  const generateBrief = useCallback(async () => {
    if (!isAvailable) return;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setAiLoading(true);
    setAiError(null);
    setAiBrief('');

    try {
      const { dateStr, timeStr, unreadCount, calLines, upcomingLines, watchLines, watchCount } = await buildContext();

      // Only unread emails for the brief — keeps it short and relevant
      const unreadEmails = (await getAllEmails()).filter(e => !e.seen);
      const unreadLines = unreadEmails.length > 0
        ? unreadEmails.slice(0, 10).map(e => `- ${e.date} | Von: ${e.from} | "${e.subject}"${e.preview ? ` — ${e.preview.slice(0, 120)}` : ''}`).join('\n')
        : 'Keine ungelesenen E-Mails.';

      const messages = [
        {
          role: 'system',
          content:
`Du bist mein KI-Sekretär. Fasse in maximal 3 kurzen Absätzen zusammen:
1. Nächste Termine (heute + diese Woche) — nur die relevantesten, mit Uhrzeit
2. Ungelesene E-Mails — nur die wichtigsten, kurz
3. ${watchCount > 0 ? 'Status meiner erwarteten Mails (eingetroffen oder ausstehend)' : 'Meine wichtigste Priorität jetzt'}
Sprich mich mit "du" an. Kein Fliesstext, keine langen Erklärungen. Datum: ${dateStr}, ${timeStr} Uhr.
${watchCount > 0 ? `\nICH ERWARTE: ${watchLines}` : ''}`
        },
        {
          role: 'user',
          content:
`HEUTIGE TERMINE:
${calLines}

NÄCHSTE TERMINE (diese Woche):
${upcomingLines}

UNGELESENE E-MAILS (${unreadCount} total):
${unreadLines}`
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

  // Auto-generate on load (skip if cache is fresh < 1h)
  useEffect(() => {
    if (!isAvailable || accounts.length === 0 || !calReady || briefDone.current) return;
    briefDone.current = true;
    try {
      const cached = JSON.parse(localStorage.getItem(BRIEF_CACHE_KEY) || 'null');
      if (cached?.ts && Date.now() - cached.ts < BRIEF_TTL_MS && cached?.text) return;
    } catch { /* continue */ }
    generateBrief();
  }, [isAvailable, accounts.length, calReady]); // eslint-disable-line

  // Auto-refresh every hour
  useEffect(() => {
    if (!isAvailable) return;
    const id = setInterval(() => {
      if (!document.hidden) generateBrief();
    }, BRIEF_TTL_MS);
    return () => clearInterval(id);
  }, [isAvailable, generateBrief]);

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

    const assistantId = Date.now() + 1;
    setChatMessages(prev => [...prev, { role: 'assistant', content: '', ts: assistantId, streaming: true }]);

    try {
      const { dateStr, timeStr, unreadCount, emailLines, calLines, upcomingLines, watchLines, emailCount, watchCount } = await buildContext();

      const history = chatMessages
        .filter(m => !m.streaming)
        .slice(-12)
        .map(m => ({ role: m.role, content: m.content }));

      const systemPrompt =
`Du bist mein persönlicher KI-Sekretär direkt in meiner E-Mail-App CoreMail.
Du hast VOLLSTÄNDIGEN Zugriff auf meinen Kalender (heute + nächste 7 Tage) und meine letzten ${emailCount} E-Mails (gelesen und ungelesen).
Beantworte Fragen direkt, präzise und auf Deutsch. Sprich mich mit "du" an.
WICHTIG: Wenn ich nach einer Person frage, durchsuche ALLE E-Mails — nicht nur ungelesene.
Wenn ich frage ob ich auf eine Antwort warte: gleiche mit meinen Watch-Einträgen und der E-Mail-Liste ab.

Datum: ${dateStr}, ${timeStr} Uhr | Ungelesen: ${unreadCount} | Total: ${emailCount} E-Mails

HEUTIGE TERMINE:
${calLines}

TERMINE DIESE WOCHE:
${upcomingLines}

${watchCount > 0 ? `ICH ERWARTE DIESE E-MAILS/ANTWORTEN:\n${watchLines}\n` : ''}
MEINE LETZTEN E-MAILS (gelesen und ungelesen, neueste zuerst):
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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  };
  const handleWatchKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addWatch(); }
  };
  const handleRuleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addRule(); }
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
                {upcomingEvents.length > 0 && (
                  <span className={`inline-flex items-center gap-1.5 text-sm text-purple-400`}>
                    <Clock className="w-4 h-4" />
                    <strong>{upcomingEvents.length}</strong>&nbsp;diese Woche
                  </span>
                )}
                {watchList.length > 0 && (
                  <span className={`inline-flex items-center gap-1.5 text-sm text-amber-400`}>
                    <Eye className="w-4 h-4" />
                    <strong>{watchList.length}</strong>&nbsp;beobachtet
                  </span>
                )}
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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">

          {/* AI Brief — 3/5 */}
          <div className={`lg:col-span-3 rounded-2xl p-5 ${c.card} ${c.border} border flex flex-col gap-4`}>
            {/* Header */}
            <div className="flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h2 className={`text-sm font-semibold ${c.text}`}>KI-Tipps · Termine & wichtige Mails</h2>
                  <p className={`text-xs ${c.textSecondary}`}>
                    {showAi ? activeModel : (!isAiEnabled ? 'KI deaktiviert' : 'Ollama nicht aktiv')}
                    {briefLastUpdated && !aiLoading && (
                      <span className="ml-2 opacity-60">
                        · {new Date(briefLastUpdated).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {showAi && (
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

            {/* Brief content */}
            <div className="flex-1">
              {!showAi && (
                <div className={`flex items-start gap-3 p-4 rounded-xl ${c.bgTertiary}`}>
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    {!isAiEnabled ? (
                      <>
                        <p className={`text-sm font-medium ${c.text} mb-0.5`}>KI-Funktionen deaktiviert</p>
                        <p className={`text-xs ${c.textSecondary}`}>Aktiviere den KI-Assistenten unter Einstellungen → Allgemein</p>
                      </>
                    ) : (
                      <>
                        <p className={`text-sm font-medium ${c.text} mb-0.5`}>Ollama nicht erreichbar</p>
                        <p className={`text-xs ${c.textSecondary}`}>
                          Starte Ollama:{' '}
                          <code className="font-mono text-cyan-400">ollama serve</code>
                        </p>
                      </>
                    )}
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
              {showAi && !aiLoading && !aiBrief && !aiError && accounts.length === 0 && (
                <p className={`text-sm ${c.textSecondary} italic`}>
                  Füge ein Konto hinzu, damit die KI deine Mails zusammenfassen kann.
                </p>
              )}
            </div>

            {/* Watch list section */}
            <div className={`border-t ${c.border} pt-3`}>
              <button
                onClick={() => setShowWatches(v => !v)}
                className={`flex items-center gap-2 text-xs font-medium ${c.textSecondary} hover:${c.text} transition-colors w-full`}
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400">Erwarte ich</span>
                {watchList.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">{watchList.length}</span>
                )}
                <span className="ml-auto">
                  {showWatches ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              </button>

              {showWatches && (
                <div className="mt-3 space-y-2">
                  <p className={`text-xs ${c.textSecondary}`}>
                    Trage ein, worauf du wartest — Absender, Thema oder Stichwort. Die KI meldet, sobald es eintrifft.
                  </p>
                  {/* Existing watches */}
                  {watchList.map(w => (
                    <div key={w.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${c.bgTertiary} border ${c.border}`}>
                      <Bell className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className={`text-xs flex-1 ${c.text}`}>{w.text}</span>
                      <button
                        onClick={() => removeWatch(w.id)}
                        className={`p-0.5 rounded ${c.textSecondary} hover:text-red-400 transition-colors`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {/* Add new watch */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={watchInput}
                      onChange={e => setWatchInput(e.target.value)}
                      onKeyDown={handleWatchKeyDown}
                      placeholder="z.B. Angebot von Max Muster, Rechnung April…"
                      className={`flex-1 px-3 py-2 rounded-lg text-xs ${c.input} border focus:outline-none focus:ring-1 focus:ring-amber-500/50`}
                    />
                    <button
                      onClick={addWatch}
                      disabled={!watchInput.trim()}
                      className="px-3 py-2 rounded-lg bg-amber-500/80 hover:bg-amber-500 disabled:opacity-40 text-white transition-colors flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── KI-Automatik-Regeln ───────────────────────────────────── */}
            <div className={`border-t ${c.border} pt-3`}>
              <button
                onClick={() => setShowRules(v => !v)}
                className={`flex items-center gap-2 text-xs font-medium ${c.textSecondary} transition-colors w-full`}
              >
                <Bot className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-violet-400">KI-Automatik</span>
                {autoRules.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-xs">
                    {autoRules.filter(r => r.enabled !== false).length}/{autoRules.length}
                  </span>
                )}
                {rulesRunning && <RefreshCw className="w-3 h-3 text-violet-400 animate-spin ml-1" />}
                {rulesLog && !rulesRunning && (
                  <span className="ml-1 text-xs text-green-400 truncate max-w-[140px]">{rulesLog}</span>
                )}
                <span className="ml-auto flex items-center gap-2">
                  {showAi && autoRules.filter(r => r.enabled !== false).length > 0 && (
                    <span
                      role="button"
                      onClick={e => { e.stopPropagation(); runAutoRules(); }}
                      className={`p-0.5 rounded text-violet-400 hover:text-violet-300 transition-colors ${rulesRunning ? 'opacity-40 pointer-events-none' : ''}`}
                      title="Regeln jetzt ausführen"
                    >
                      <Play className="w-3 h-3" />
                    </span>
                  )}
                  {showRules ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              </button>

              {showRules && (
                <div className="mt-3 space-y-2">
                  <p className={`text-xs ${c.textSecondary}`}>
                    Regeln in natürlicher Sprache — die KI führt sie bei jedem Sync automatisch aus.
                  </p>
                  {autoRules.map(r => (
                    <div key={r.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${c.bgTertiary} border ${r.enabled !== false ? 'border-violet-500/25' : c.border}`}>
                      <button
                        onClick={() => toggleRule(r.id)}
                        title={r.enabled !== false ? 'Deaktivieren' : 'Aktivieren'}
                        className={`flex-shrink-0 w-3.5 h-3.5 rounded border transition-colors flex items-center justify-center ${
                          r.enabled !== false ? 'bg-violet-500 border-violet-500' : `${c.bgTertiary} border-gray-500`
                        }`}
                      >
                        {r.enabled !== false && <span className="text-white text-[8px] leading-none">✓</span>}
                      </button>
                      <span className={`text-xs flex-1 ${r.enabled !== false ? c.text : c.textSecondary}`}>{r.text}</span>
                      <button
                        onClick={() => removeRule(r.id)}
                        className={`p-0.5 rounded ${c.textSecondary} hover:text-red-400 transition-colors`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ruleInput}
                      onChange={e => setRuleInput(e.target.value)}
                      onKeyDown={handleRuleKeyDown}
                      placeholder='z.B. Verschiebe Mails von @xyz.ch in Ordner "xyz"'
                      className={`flex-1 px-3 py-2 rounded-lg text-xs ${c.input} border focus:outline-none focus:ring-1 focus:ring-violet-500/50`}
                    />
                    <button
                      onClick={addRule}
                      disabled={!ruleInput.trim()}
                      className="px-3 py-2 rounded-lg bg-violet-500/80 hover:bg-violet-500 disabled:opacity-40 text-white transition-colors flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {!showAi && (
                    <p className={`text-xs ${c.textSecondary} italic`}>
                      KI (Ollama) muss aktiv sein um Regeln auszuführen.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Calendar today + upcoming — 2/5 */}
          <div className={`lg:col-span-2 rounded-2xl p-5 ${c.card} ${c.border} border flex flex-col gap-4`}>
            {/* Today */}
            <div>
              <div className="flex items-center justify-between mb-3">
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

              {!hasMicrosoft && (
                <div className="text-center py-6">
                  <Calendar className={`w-8 h-8 mx-auto mb-2 opacity-20 ${c.text}`} />
                  <p className={`text-xs ${c.textSecondary}`}>Nur für Microsoft 365-Konten</p>
                </div>
              )}
              {hasMicrosoft && calLoading && (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skel key={i} className={c.bgTertiary} style={{ height: 44, width: '100%' }} />
                  ))}
                </div>
              )}
              {hasMicrosoft && !calLoading && calEvents.length === 0 && (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500 opacity-40" />
                  <p className={`text-sm ${c.textSecondary}`}>Heute frei</p>
                </div>
              )}
              {hasMicrosoft && !calLoading && calEvents.length > 0 && (
                <div className="space-y-2">
                  {calEvents.map(ev => {
                    const isPast = !ev.isAllDay && new Date(ev.end) < now;
                    const isSoon = !ev.isAllDay && !isPast && (new Date(ev.start) - now) < 30 * 60 * 1000;
                    return (
                      <div key={ev.id}
                        className={`flex items-start gap-3 p-2.5 rounded-xl ${isSoon ? 'bg-amber-500/10 border border-amber-500/20' : c.bgTertiary} transition-opacity ${isPast ? 'opacity-40' : ''}`}>
                        <div className="flex-shrink-0 min-w-[44px] text-right pt-0.5">
                          <span className={`text-xs font-mono font-medium ${isSoon ? 'text-amber-400' : 'text-cyan-400'}`}>
                            {formatEventTime(ev)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium truncate ${c.text}`}>
                            {isSoon && <span className="text-amber-400 mr-1">⚡</span>}
                            {ev.title}
                          </p>
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

            {/* Upcoming (next 7 days) */}
            {hasMicrosoft && upcomingEvents.length > 0 && (
              <div className={`border-t ${c.border} pt-3`}>
                <p className={`text-xs font-medium ${c.textSecondary} mb-2 flex items-center gap-1.5`}>
                  <Clock className="w-3.5 h-3.5" /> Diese Woche
                </p>
                <div className="space-y-1.5">
                  {upcomingEvents.slice(0, 5).map(ev => {
                    const day = new Date(ev.start).toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'short' });
                    return (
                      <div key={ev.id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${c.bgTertiary}`}>
                        <span className={`text-xs font-mono text-purple-400 flex-shrink-0 w-16`}>{day}</span>
                        <span className={`text-xs truncate ${c.text}`}>{ev.title}</span>
                      </div>
                    );
                  })}
                  {upcomingEvents.length > 5 && (
                    <p className={`text-xs ${c.textSecondary} text-center`}>+{upcomingEvents.length - 5} weitere</p>
                  )}
                </div>
              </div>
            )}
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
                <h2 className={`text-sm font-semibold ${c.text}`}>KI-Sekretär</h2>
                <p className={`text-xs ${c.textSecondary}`}>
                  {showAi
                    ? 'Frag mich zu Terminen, Mails, Prioritäten — ich kenne deinen vollen Kontext'
                    : (!isAiEnabled ? 'KI deaktiviert — aktivierbar unter Einstellungen' : 'Ollama nicht aktiv — starte mit: ollama serve')}
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
                  Ich kenne deine Termine und Mails — frag mich einfach
                </p>
                {showAi && (
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    {[
                      'Was sind meine dringendsten Aufgaben heute?',
                      'Warte ich auf eine wichtige Antwort?',
                      'Welche Termine habe ich diese Woche?',
                      'Gibt es ungelesene Mails die ich kennen muss?',
                      'Bereite mich auf meinen nächsten Termin vor',
                      'Schreib eine Zusammenfassung meines Tages',
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
                placeholder={showAi ? 'Frag mich etwas… (Enter zum Senden, Shift+Enter für Zeilenumbruch)' : (!isAiEnabled ? 'KI deaktiviert' : 'Ollama nicht aktiv')}
                disabled={!showAi || chatLoading}
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
                disabled={!showAi || chatLoading || !chatInput.trim()}
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
