import React, { useState, useEffect, useCallback, memo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Clock, MapPin, User, Trash2, Edit2, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../context/AccountContext';

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

const SHOW_AS_COLORS = {
  busy: 'bg-cyan-500',
  tentative: 'bg-yellow-500',
  free: 'bg-green-500',
  oof: 'bg-red-500',
  workingElsewhere: 'bg-purple-500',
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  // 0=Sun → convert to Mon-based
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatTime(dateStr, isAllDay) {
  if (isAllDay || !dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
}

function toLocalDatetimeValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Event Form Modal ─────────────────────────────────────────────────────────
const EventModal = memo(({ event, defaultDate, onSave, onDelete, onClose, c }) => {
  const isNew = !event?.id;
  const pad = n => String(n).padStart(2, '0');
  const defaultStart = defaultDate
    ? `${defaultDate.getFullYear()}-${pad(defaultDate.getMonth()+1)}-${pad(defaultDate.getDate())}T09:00`
    : toLocalDatetimeValue(new Date().toISOString());
  const defaultEnd = defaultDate
    ? `${defaultDate.getFullYear()}-${pad(defaultDate.getMonth()+1)}-${pad(defaultDate.getDate())}T10:00`
    : toLocalDatetimeValue(new Date(Date.now() + 3600000).toISOString());

  const [title, setTitle] = useState(event?.title || '');
  const [start, setStart] = useState(event ? toLocalDatetimeValue(event.start) : defaultStart);
  const [end, setEnd] = useState(event ? toLocalDatetimeValue(event.end) : defaultEnd);
  const [location, setLocation] = useState(event?.location || '');
  const [notes, setNotes] = useState(event?.preview || '');
  const [isAllDay, setIsAllDay] = useState(event?.isAllDay || false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onSave({
      id: event?.id,
      title: title.trim(),
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      location,
      notes,
      isAllDay,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className={`${c.bgSecondary} ${c.border} border rounded-xl shadow-2xl w-full max-w-md mx-4 p-5`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold ${c.text}`}>{isNew ? 'Neuer Termin' : 'Termin bearbeiten'}</h3>
          <button onClick={onClose} className={`p-1 rounded-lg ${c.hover} ${c.textSecondary}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Titel"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={`w-full px-3 py-2 ${c.bgTertiary} ${c.text} ${c.border} border rounded-lg text-sm focus:outline-none focus:border-cyan-500`}
            autoFocus
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allday"
              checked={isAllDay}
              onChange={e => setIsAllDay(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="allday" className={`text-sm ${c.textSecondary}`}>Ganztägig</label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={`text-xs ${c.textSecondary} mb-1 block`}>Start</label>
              <input
                type={isAllDay ? 'date' : 'datetime-local'}
                value={isAllDay ? start.slice(0, 10) : start}
                onChange={e => setStart(e.target.value)}
                className={`w-full px-2 py-1.5 ${c.bgTertiary} ${c.text} ${c.border} border rounded-lg text-xs focus:outline-none focus:border-cyan-500`}
              />
            </div>
            <div>
              <label className={`text-xs ${c.textSecondary} mb-1 block`}>Ende</label>
              <input
                type={isAllDay ? 'date' : 'datetime-local'}
                value={isAllDay ? end.slice(0, 10) : end}
                onChange={e => setEnd(e.target.value)}
                className={`w-full px-2 py-1.5 ${c.bgTertiary} ${c.text} ${c.border} border rounded-lg text-xs focus:outline-none focus:border-cyan-500`}
              />
            </div>
          </div>

          <input
            type="text"
            placeholder="Ort (optional)"
            value={location}
            onChange={e => setLocation(e.target.value)}
            className={`w-full px-3 py-2 ${c.bgTertiary} ${c.text} ${c.border} border rounded-lg text-sm focus:outline-none focus:border-cyan-500`}
          />

          <textarea
            placeholder="Notizen (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 ${c.bgTertiary} ${c.text} ${c.border} border rounded-lg text-sm focus:outline-none focus:border-cyan-500 resize-none`}
          />
        </div>

        <div className="flex items-center justify-between mt-4">
          {!isNew && onDelete ? (
            <button
              onClick={() => onDelete(event.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" /> Löschen
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button onClick={onClose} className={`px-4 py-1.5 rounded-lg text-sm ${c.bgTertiary} ${c.text} ${c.hover}`}>
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm bg-cyan-500 hover:bg-cyan-600 text-white disabled:opacity-50"
            >
              {saving ? '…' : <><Check className="w-3.5 h-3.5" /> Speichern</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Day Cell ─────────────────────────────────────────────────────────────────
const DayCell = memo(({ date, today, events, isCurrentMonth, onDayClick, onEventClick, c }) => {
  const isToday = isSameDay(date, today);
  const dayEvents = events.filter(e => {
    const eStart = new Date(e.start);
    return isSameDay(eStart, date) || (e.isAllDay && new Date(e.end) > date && eStart <= date);
  });

  return (
    <div
      className={`min-h-[90px] p-1 border-b border-r ${c.border} cursor-pointer transition-colors ${
        isCurrentMonth ? c.hover : 'opacity-40'
      }`}
      onClick={() => onDayClick(date)}
    >
      <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
        isToday ? 'bg-cyan-500 text-white' : c.textSecondary
      }`}>
        {date.getDate()}
      </div>
      <div className="space-y-0.5 overflow-hidden">
        {dayEvents.slice(0, 3).map(e => (
          <div
            key={e.id}
            onClick={ev => { ev.stopPropagation(); onEventClick(e); }}
            className={`text-xs px-1.5 py-0.5 rounded truncate text-white cursor-pointer hover:opacity-80 ${SHOW_AS_COLORS[e.showAs] || 'bg-cyan-500'}`}
            title={e.title}
          >
            {!e.isAllDay && <span className="opacity-80 mr-1">{formatTime(e.start)}</span>}
            {e.title}
          </div>
        ))}
        {dayEvents.length > 3 && (
          <div className={`text-xs ${c.textSecondary} pl-1`}>+{dayEvents.length - 3} weitere</div>
        )}
      </div>
    </div>
  );
});

// ── Main Calendar View ────────────────────────────────────────────────────────
export default function CalendarView() {
  const { currentTheme } = useTheme();
  const { accounts, activeAccountId } = useAccounts();
  const c = currentTheme.colors;

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editEvent, setEditEvent] = useState(null); // null=closed, {}=new, event=edit
  const [defaultDate, setDefaultDate] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Only M365 accounts support calendar
  const m365Accounts = accounts.filter(a => a.type === 'microsoft');

  useEffect(() => {
    if (m365Accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(activeAccountId && m365Accounts.find(a => a.id === activeAccountId)
        ? activeAccountId
        : m365Accounts[0].id);
    }
  }, [m365Accounts, activeAccountId, selectedAccount]);

  const loadEvents = useCallback(async () => {
    if (!selectedAccount) return;
    setLoading(true);
    setError(null);
    try {
      const startDate = new Date(viewYear, viewMonth, 1).toISOString();
      const endDate = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59).toISOString();
      const result = await window.electronAPI.calendarGetEvents(selectedAccount, { startDate, endDate });
      if (result.success) {
        setEvents(result.events);
      } else {
        const msg = result.error || '';
        if (msg === 'TOKEN_EXPIRED' || msg.includes('TOKEN_EXPIRED')) {
          setError('Microsoft-Token abgelaufen. Bitte das Konto erneut verbinden: Einstellungen → Kontenverwaltung → Erneut anmelden.');
        } else if (msg.includes('403') || msg.includes('AccessDenied')) {
          setError('Kalender-Zugriff verweigert. Bitte das Microsoft-Konto erneut verbinden (Einstellungen → Kontenverwaltung → Erneut anmelden), damit die Kalender-Berechtigungen neu beantragt werden.');
        } else {
          setError(msg || 'Fehler beim Laden der Termine');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedAccount, viewYear, viewMonth]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const handleDayClick = (date) => {
    setDefaultDate(date);
    setEditEvent({});
  };

  const handleEventClick = (event) => {
    setDefaultDate(null);
    setEditEvent(event);
  };

  const handleSave = async (data) => {
    try {
      let result;
      if (data.id) {
        result = await window.electronAPI.calendarUpdateEvent(selectedAccount, data.id, data);
      } else {
        result = await window.electronAPI.calendarCreateEvent(selectedAccount, data);
      }
      if (result.success) {
        setEditEvent(null);
        loadEvents();
      } else {
        alert('Fehler: ' + result.error);
      }
    } catch (err) {
      alert('Fehler: ' + err.message);
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm('Termin wirklich löschen?')) return;
    try {
      const result = await window.electronAPI.calendarDeleteEvent(selectedAccount, eventId);
      if (result.success) {
        setEditEvent(null);
        loadEvents();
      } else {
        alert('Fehler: ' + result.error);
      }
    } catch (err) {
      alert('Fehler: ' + err.message);
    }
  };

  // Build calendar grid
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const daysInPrev = getDaysInMonth(viewYear, viewMonth - 1 < 0 ? 11 : viewMonth - 1);
  const cells = [];

  // Prev month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = viewMonth === 0
      ? new Date(viewYear - 1, 11, daysInPrev - i)
      : new Date(viewYear, viewMonth - 1, daysInPrev - i);
    cells.push({ date: d, isCurrentMonth: false });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(viewYear, viewMonth, d), isCurrentMonth: true });
  }
  // Next month leading days
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const dt = viewMonth === 11
      ? new Date(viewYear + 1, 0, d)
      : new Date(viewYear, viewMonth + 1, d);
    cells.push({ date: dt, isCurrentMonth: false });
  }

  if (m365Accounts.length === 0) {
    return (
      <div className={`flex-1 flex items-center justify-center ${c.bg}`}>
        <div className="text-center">
          <div className="text-5xl mb-4">📅</div>
          <h3 className={`font-semibold ${c.text} mb-2`}>Kein Microsoft 365-Konto verbunden</h3>
          <p className={`text-sm ${c.textSecondary}`}>Der Kalender ist nur mit Microsoft 365-Konten verfügbar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${c.bg}`}>
      {/* Header */}
      <div className={`p-4 ${c.border} border-b flex items-center justify-between gap-4 flex-wrap`}>
        <div className="flex items-center gap-3">
          <button onClick={handlePrevMonth} className={`p-1.5 rounded-lg ${c.hover} ${c.textSecondary}`}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className={`font-semibold ${c.text} text-lg w-44 text-center`}>
            {MONTHS[viewMonth]} {viewYear}
          </h2>
          <button onClick={handleNextMonth} className={`p-1.5 rounded-lg ${c.hover} ${c.textSecondary}`}>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); }}
            className={`px-3 py-1 rounded-lg text-xs ${c.bgTertiary} ${c.text} ${c.hover} ${c.border} border`}
          >
            Heute
          </button>
        </div>

        <div className="flex items-center gap-2">
          {m365Accounts.length > 1 && (
            <select
              value={selectedAccount || ''}
              onChange={e => setSelectedAccount(e.target.value)}
              className={`px-2 py-1.5 text-xs ${c.bgTertiary} ${c.text} ${c.border} border rounded-lg focus:outline-none`}
            >
              {m365Accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => { setDefaultDate(today); setEditEvent({}); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            <Plus className="w-4 h-4" /> Neuer Termin
          </button>
        </div>
      </div>

      {/* Error / Loading */}
      {error && (
        <div className="px-4 py-2 bg-red-900/20 border-b border-red-500/30">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        {/* Day headers */}
        <div className={`grid grid-cols-7 border-b ${c.border} sticky top-0 ${c.bgSecondary} z-10`}>
          {DAYS.map(day => (
            <div key={day} className={`py-2 text-center text-xs font-medium ${c.textSecondary} border-r ${c.border} last:border-r-0`}>
              {day}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="relative">
          <div className="grid grid-cols-7">
            {cells.map((cell, idx) => (
              <DayCell
                key={idx}
                date={cell.date}
                today={today}
                events={events}
                isCurrentMonth={cell.isCurrentMonth}
                onDayClick={handleDayClick}
                onEventClick={handleEventClick}
                c={c}
              />
            ))}
          </div>

          {loading && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className={`${c.bgSecondary} ${c.border} border rounded-xl px-6 py-4 text-sm ${c.text}`}>
                Lade Termine…
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Detail / Edit Modal */}
      {editEvent !== null && (
        <EventModal
          event={editEvent?.id ? editEvent : null}
          defaultDate={defaultDate}
          onSave={handleSave}
          onDelete={editEvent?.id ? handleDelete : null}
          onClose={() => setEditEvent(null)}
          c={c}
        />
      )}
    </div>
  );
}
