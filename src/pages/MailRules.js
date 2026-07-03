import React, { useEffect, useState, useCallback } from 'react';
import { Filter, Add, Edit, TrashCan, Close, Checkmark, Play, InProgress } from '@carbon/icons-react';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../context/AccountContext';
import LoadingSpinner from '../components/LoadingSpinner';

// v6.6.0: Mail-Regeln / Filter — Verwalten + auf bestehende Mails anwenden.
// Schema einer Regel siehe main.js (RULES_KEY).

const FIELDS = [
  { id: 'from',    label: 'Absender' },
  { id: 'to',      label: 'Empfänger' },
  { id: 'subject', label: 'Betreff' }
];

const OPS = [
  { id: 'contains',   label: 'enthält' },
  { id: 'equals',     label: 'ist exakt' },
  { id: 'startsWith', label: 'beginnt mit' },
  { id: 'endsWith',   label: 'endet auf' }
];

const ACTION_TYPES = [
  { id: 'markRead',     label: 'Als gelesen markieren' },
  { id: 'moveToFolder', label: 'In Ordner verschieben' },
  { id: 'delete',       label: 'Löschen' },
  { id: 'snoozeHours',  label: 'Snoozen für X Stunden' }
];

const emptyRule = () => ({
  id: null,
  name: '',
  enabled: true,
  appliesToAccount: 'all',
  matchAll: true,
  conditions: [{ field: 'from', op: 'contains', value: '' }],
  actions: [{ type: 'markRead' }]
});

function MailRules() {
  const { currentTheme } = useTheme();
  const { accounts } = useAccounts();
  const c = currentTheme.colors;
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);   // null oder Regel-Objekt
  const [savingId, setSavingId] = useState(null);
  const [applyingId, setApplyingId] = useState(null);
  const [applyResult, setApplyResult] = useState(null); // { ruleName, total, applied } | null
  const [error, setError] = useState(null);
  const [foldersByAccount, setFoldersByAccount] = useState({}); // { accountId: [{name, path}] }

  const load = useCallback(async () => {
    if (!window.electronAPI?.rulesList) { setLoading(false); return; }
    setLoading(true);
    try {
      const r = await window.electronAPI.rulesList();
      if (r?.success) setRules(r.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Folder-Liste lazy laden, wenn der Editor moveToFolder zeigt.
  // WICHTIG: muss VOR dem useEffect unten definiert sein — die Referenz im
  // Dependency-Array warf sonst beim Rendern einen TDZ-ReferenceError
  // ("Cannot access before initialization") und crashte die ganze Seite.
  const loadFoldersForAccount = useCallback(async (accountId) => {
    if (foldersByAccount[accountId]) return;
    const acc = accounts.find(a => a.id === accountId);
    if (!acc || !window.electronAPI) return;
    try {
      const result = acc.type === 'microsoft'
        ? await window.electronAPI.listGraphFolders(accountId)
        : await window.electronAPI.listFolders(accountId);
      const flat = [];
      const walk = (arr, prefix = '') => {
        for (const f of arr || []) {
          const display = prefix ? `${prefix} / ${f.name}` : f.name;
          flat.push({ path: f.path, name: display });
          if (f.children?.length) walk(f.children, display);
        }
      };
      walk(result?.folders || []);
      setFoldersByAccount(prev => ({ ...prev, [accountId]: flat }));
    } catch (_) {
      setFoldersByAccount(prev => ({ ...prev, [accountId]: [] }));
    }
  }, [accounts, foldersByAccount]);

  // v6.6.2: Folder-Listen für alle Konten laden, die Regeln mit moveToFolder haben.
  // Damit die Regel-Übersicht den Ordner-NAMEN statt der rohen Graph-ID/IMAP-Pfad zeigt.
  useEffect(() => {
    const need = new Set();
    for (const r of rules) {
      const moveActs = (r.actions || []).filter(a => a.type === 'moveToFolder');
      if (moveActs.length === 0) continue;
      if (r.appliesToAccount === 'all') {
        accounts.forEach(a => need.add(a.id));
      } else if (r.appliesToAccount) {
        need.add(r.appliesToAccount);
      }
    }
    for (const accId of need) {
      if (!foldersByAccount[accId]) loadFoldersForAccount(accId);
    }
  }, [rules, accounts, foldersByAccount, loadFoldersForAccount]);

  // Hilfs-Lookup: Folder-Pfad/-ID → menschenlesbarer Name. Fällt auf einen
  // generischen Hinweis zurück, falls die Folder-Liste noch nicht geladen
  // ist oder der Ordner inzwischen gelöscht wurde.
  const folderLabelFor = useCallback((accountId, folderPath) => {
    if (!folderPath) return 'Ordner';
    const tryAccounts = accountId === 'all' ? accounts.map(a => a.id) : [accountId];
    for (const accId of tryAccounts) {
      const list = foldersByAccount[accId];
      if (!list) continue;
      const hit = list.find(f => f.path === folderPath);
      if (hit) return hit.name;
    }
    // Heuristik: alles was nicht wie ein lesbarer Pfad aussieht (>40 Zeichen
    // und keine slash-Struktur) ist mit hoher Wahrscheinlichkeit eine Graph-ID
    // → versteckter Fallback statt unleserliche Folge zu zeigen.
    if (folderPath.length > 40 && !folderPath.includes('/')) return 'Ordner';
    return folderPath;
  }, [accounts, foldersByAccount]);

  const startEdit = (rule = null) => {
    const draft = rule ? JSON.parse(JSON.stringify(rule)) : emptyRule();
    setEditing(draft);
    if (draft.appliesToAccount !== 'all') loadFoldersForAccount(draft.appliesToAccount);
  };

  const cancelEdit = () => { setEditing(null); setError(null); };

  const validate = (r) => {
    if (!r.name?.trim()) return 'Name fehlt';
    if (!r.conditions.length) return 'Mindestens eine Bedingung';
    for (const c of r.conditions) {
      if (!c.value?.trim()) return 'Bedingung ohne Wert';
    }
    if (!r.actions.length) return 'Mindestens eine Aktion';
    for (const a of r.actions) {
      if (a.type === 'moveToFolder' && !a.folder) return 'Zielordner fehlt';
      if (a.type === 'snoozeHours' && (!a.hours || a.hours <= 0)) return 'Snooze-Stunden fehlen';
    }
    return null;
  };

  const save = async () => {
    const err = validate(editing);
    if (err) { setError(err); return; }
    setSavingId(editing.id || 'new');
    setError(null);
    const r = await window.electronAPI.rulesSave(editing);
    setSavingId(null);
    if (r?.success) {
      setEditing(null);
      load();
    } else {
      setError(r?.error || 'Speichern fehlgeschlagen');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Diese Regel wirklich löschen?')) return;
    await window.electronAPI.rulesDelete(id);
    load();
  };

  const toggleEnabled = async (rule) => {
    const next = { ...rule, enabled: !rule.enabled };
    setSavingId(rule.id);
    await window.electronAPI.rulesSave(next);
    setSavingId(null);
    load();
  };

  const applyNow = async (rule) => {
    // Wenn Regel auf "alle" zielt, müssen wir pro Konto laufen
    const targets = rule.appliesToAccount === 'all'
      ? accounts.map(a => a.id)
      : [rule.appliesToAccount];
    setApplyingId(rule.id);
    let total = 0, applied = 0;
    for (const accId of targets) {
      const r = await window.electronAPI.rulesApplyNow(accId, 'INBOX');
      if (r?.success) { total += r.total || 0; applied += r.applied || 0; }
    }
    setApplyingId(null);
    setApplyResult({ ruleName: rule.name, total, applied });
    setTimeout(() => setApplyResult(null), 6000);
  };

  // Editor-Helfer
  const setField = (path, value) => {
    setEditing(prev => {
      const next = { ...prev };
      const segs = path.split('.');
      let cur = next;
      for (let i = 0; i < segs.length - 1; i++) {
        const s = segs[i];
        cur[s] = Array.isArray(cur[s]) ? [...cur[s]] : { ...cur[s] };
        cur = cur[s];
      }
      cur[segs[segs.length - 1]] = value;
      return next;
    });
  };
  const updateCondition = (idx, key, val) => setField(`conditions.${idx}.${key}`, val);
  const updateAction = (idx, key, val) => setField(`actions.${idx}.${key}`, val);
  const addCondition = () => setEditing(p => ({ ...p, conditions: [...p.conditions, { field: 'subject', op: 'contains', value: '' }] }));
  const removeCondition = (i) => setEditing(p => ({ ...p, conditions: p.conditions.filter((_, k) => k !== i) }));
  const addAction = () => setEditing(p => ({ ...p, actions: [...p.actions, { type: 'markRead' }] }));
  const removeAction = (i) => setEditing(p => ({ ...p, actions: p.actions.filter((_, k) => k !== i) }));

  const ruleSummary = (rule) => {
    const condText = rule.conditions.map(cn => {
      const f = FIELDS.find(x => x.id === cn.field)?.label || cn.field;
      const o = OPS.find(x => x.id === cn.op)?.label || cn.op;
      return `${f} ${o} "${cn.value}"`;
    }).join(rule.matchAll === false ? ' ODER ' : ' UND ');
    const actText = rule.actions.map(a => {
      if (a.type === 'moveToFolder') return `→ ${folderLabelFor(rule.appliesToAccount, a.folder)}`;
      if (a.type === 'snoozeHours')  return `⏱ ${a.hours} Std.`;
      return ACTION_TYPES.find(x => x.id === a.type)?.label || a.type;
    }).join(', ');
    return { condText, actText };
  };

  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${c.bg}`}>
        <LoadingSpinner />
      </div>
    );
  }

  // Folder-Liste fürs Editor-Dropdown
  const editorAccountId = editing?.appliesToAccount;
  const editorFolders = editorAccountId && editorAccountId !== 'all'
    ? (foldersByAccount[editorAccountId] || [])
    : [];

  return (
    <div className={`flex-1 overflow-auto ${c.bg}`}>
      <div className="max-w-3xl mx-auto p-6">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Filter size={28} className={c.accent} />
            <div>
              <h1 className={`text-2xl font-semibold ${c.text}`}>Mail-Regeln</h1>
              <p className={`text-sm ${c.textSecondary}`}>
                {rules.length === 0 ? 'Noch keine Regeln' : `${rules.length} Regel${rules.length === 1 ? '' : 'n'} aktiv`}
              </p>
            </div>
          </div>
          <button
            onClick={() => startEdit(null)}
            className={`px-3 py-2 ${c.accentBg} ${c.accentHover} text-white rounded-lg text-sm flex items-center gap-2`}
          >
            <Add size={16} /> Neue Regel
          </button>
        </header>

        {applyResult && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
            "{applyResult.ruleName}" angewendet — {applyResult.applied} von {applyResult.total} Mails verarbeitet.
          </div>
        )}

        {/* Liste */}
        {rules.length === 0 && !editing ? (
          <div className={`${c.bgSecondary} ${c.border} border rounded-xl p-8 text-center`}>
            <Filter size={48} className={`mx-auto mb-3 ${c.textSecondary}`} />
            <p className={`text-sm ${c.textSecondary}`}>
              Noch keine Regeln. Mit Regeln kannst du z.B. Newsletter automatisch in einen Ordner verschieben oder Mails von bestimmten Absendern als gelesen markieren.
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {rules.map(rule => {
              const sum = ruleSummary(rule);
              const accLabel = rule.appliesToAccount === 'all'
                ? 'Alle Konten'
                : (accounts.find(a => a.id === rule.appliesToAccount)?.displayName || rule.appliesToAccount);
              return (
                <div key={rule.id} className={`${c.bgSecondary} ${c.border} border rounded-xl p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium ${c.text} truncate`}>{rule.name}</h3>
                        {!rule.enabled && (
                          <span className={`text-xs px-2 py-0.5 rounded ${c.bgTertiary} ${c.textSecondary}`}>deaktiviert</span>
                        )}
                      </div>
                      <p className={`text-xs ${c.textSecondary} mb-1`}>{accLabel}</p>
                      <p className={`text-sm ${c.text}`}>
                        <span className={c.textSecondary}>Wenn </span>{sum.condText}
                        <span className={c.textSecondary}> dann </span>{sum.actText}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => toggleEnabled(rule)}
                        disabled={savingId === rule.id}
                        className={`p-2 ${c.hover} rounded-lg ${rule.enabled ? c.accent : c.textSecondary}`}
                        title={rule.enabled ? 'Deaktivieren' : 'Aktivieren'}
                      >
                        {savingId === rule.id ? <InProgress size={16} className="animate-spin" /> : <Checkmark size={16} />}
                      </button>
                      <button
                        onClick={() => applyNow(rule)}
                        disabled={applyingId === rule.id || !rule.enabled}
                        className={`p-2 ${c.hover} rounded-lg ${c.textSecondary} disabled:opacity-40`}
                        title="Jetzt auf Posteingang anwenden"
                      >
                        {applyingId === rule.id ? <InProgress size={16} className="animate-spin" /> : <Play size={16} />}
                      </button>
                      <button
                        onClick={() => startEdit(rule)}
                        className={`p-2 ${c.hover} rounded-lg ${c.textSecondary}`}
                        title="Bearbeiten"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => remove(rule.id)}
                        className={`p-2 ${c.hover} rounded-lg ${c.textSecondary} hover:text-red-400`}
                        title="Löschen"
                      >
                        <TrashCan size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Editor */}
        {editing && (
          <div className={`${c.bgSecondary} ${c.border} border rounded-xl p-5 mb-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${c.text}`}>
                {editing.id ? 'Regel bearbeiten' : 'Neue Regel'}
              </h2>
              <button onClick={cancelEdit} className={`p-1 ${c.hover} rounded ${c.textSecondary}`}>
                <Close size={18} />
              </button>
            </div>

            {error && (
              <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
            )}

            {/* Name */}
            <label className={`block text-xs font-medium ${c.textSecondary} mb-1`}>Name</label>
            <input
              type="text"
              value={editing.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="z.B. Newsletter archivieren"
              className={`w-full px-3 py-2 ${c.bgTertiary} ${c.text} ${c.border} border rounded-lg text-sm outline-none mb-3`}
            />

            {/* Konto */}
            <label className={`block text-xs font-medium ${c.textSecondary} mb-1`}>Anwenden auf</label>
            <select
              value={editing.appliesToAccount}
              onChange={(e) => {
                setField('appliesToAccount', e.target.value);
                if (e.target.value !== 'all') loadFoldersForAccount(e.target.value);
              }}
              className={`w-full px-3 py-2 ${c.bgTertiary} ${c.text} ${c.border} border rounded-lg text-sm outline-none mb-4`}
            >
              <option value="all">Alle Konten</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.displayName || a.name || a.id}</option>
              ))}
            </select>

            {/* Bedingungen */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className={`text-xs font-medium ${c.textSecondary}`}>Bedingungen</label>
                <select
                  value={editing.matchAll === false ? 'or' : 'and'}
                  onChange={(e) => setField('matchAll', e.target.value === 'and')}
                  className={`px-2 py-1 ${c.bgTertiary} ${c.text} ${c.border} border rounded text-xs outline-none`}
                >
                  <option value="and">Alle erfüllen (UND)</option>
                  <option value="or">Eine genügt (ODER)</option>
                </select>
              </div>
              {editing.conditions.map((cn, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <select
                    value={cn.field}
                    onChange={(e) => updateCondition(i, 'field', e.target.value)}
                    className={`px-2 py-1.5 ${c.bgTertiary} ${c.text} ${c.border} border rounded-md text-sm outline-none`}
                  >
                    {FIELDS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                  <select
                    value={cn.op}
                    onChange={(e) => updateCondition(i, 'op', e.target.value)}
                    className={`px-2 py-1.5 ${c.bgTertiary} ${c.text} ${c.border} border rounded-md text-sm outline-none`}
                  >
                    {OPS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                  <input
                    type="text"
                    value={cn.value}
                    onChange={(e) => updateCondition(i, 'value', e.target.value)}
                    placeholder="Wert"
                    className={`flex-1 px-2 py-1.5 ${c.bgTertiary} ${c.text} ${c.border} border rounded-md text-sm outline-none`}
                  />
                  {editing.conditions.length > 1 && (
                    <button onClick={() => removeCondition(i)} className={`p-1.5 ${c.hover} rounded ${c.textSecondary} hover:text-red-400`}>
                      <Close size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addCondition} className={`text-xs ${c.accent} hover:underline flex items-center gap-1`}>
                <Add size={12} /> Bedingung hinzufügen
              </button>
            </div>

            {/* Aktionen */}
            <div className="mb-4">
              <label className={`block text-xs font-medium ${c.textSecondary} mb-2`}>Aktionen</label>
              {editing.actions.map((a, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <select
                    value={a.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      const next = { type: newType };
                      if (newType === 'moveToFolder') next.folder = '';
                      if (newType === 'snoozeHours')  next.hours = 24;
                      setField(`actions.${i}`, next);
                    }}
                    className={`px-2 py-1.5 ${c.bgTertiary} ${c.text} ${c.border} border rounded-md text-sm outline-none`}
                  >
                    {ACTION_TYPES.map(at => <option key={at.id} value={at.id}>{at.label}</option>)}
                  </select>

                  {a.type === 'moveToFolder' && (
                    editorAccountId === 'all' ? (
                      <input
                        type="text"
                        value={a.folder || ''}
                        onChange={(e) => updateAction(i, 'folder', e.target.value)}
                        placeholder="Ordner-Name (für alle Konten gleich)"
                        className={`flex-1 px-2 py-1.5 ${c.bgTertiary} ${c.text} ${c.border} border rounded-md text-sm outline-none`}
                      />
                    ) : (
                      <select
                        value={a.folder || ''}
                        onChange={(e) => updateAction(i, 'folder', e.target.value)}
                        className={`flex-1 px-2 py-1.5 ${c.bgTertiary} ${c.text} ${c.border} border rounded-md text-sm outline-none`}
                      >
                        <option value="">— Ordner wählen —</option>
                        {editorFolders.map(f => <option key={f.path} value={f.path}>{f.name}</option>)}
                      </select>
                    )
                  )}

                  {a.type === 'snoozeHours' && (
                    <input
                      type="number"
                      min="1"
                      value={a.hours || 24}
                      onChange={(e) => updateAction(i, 'hours', parseInt(e.target.value, 10) || 0)}
                      className={`w-20 px-2 py-1.5 ${c.bgTertiary} ${c.text} ${c.border} border rounded-md text-sm outline-none`}
                    />
                  )}

                  {editing.actions.length > 1 && (
                    <button onClick={() => removeAction(i)} className={`p-1.5 ${c.hover} rounded ${c.textSecondary} hover:text-red-400`}>
                      <Close size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addAction} className={`text-xs ${c.accent} hover:underline flex items-center gap-1`}>
                <Add size={12} /> Aktion hinzufügen
              </button>
            </div>

            {/* Save / Cancel */}
            <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
              <button
                onClick={cancelEdit}
                className={`px-4 py-2 ${c.bgTertiary} ${c.hover} ${c.text} text-sm rounded-lg`}
              >
                Abbrechen
              </button>
              <button
                onClick={save}
                disabled={savingId !== null}
                className={`px-4 py-2 ${c.accentBg} ${c.accentHover} text-white text-sm rounded-lg disabled:opacity-50 flex items-center gap-2`}
              >
                {savingId ? <InProgress size={14} className="animate-spin" /> : <Checkmark size={14} />}
                Speichern
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MailRules;
