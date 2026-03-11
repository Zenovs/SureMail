import React, { useMemo } from 'react';
import { Mail, MailOpen, Paperclip, Flag, Clock, User, Folder, ArrowRight, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function SearchResults({ results, isSearching, query, onSelectEmail }) {
  const { currentTheme } = useTheme();
  const c = currentTheme.colors;

  // Group results by account
  const groupedResults = useMemo(() => {
    const groups = {};
    results.forEach(email => {
      const key = email.accountId;
      if (!groups[key]) {
        groups[key] = {
          accountId: email.accountId,
          accountName: email.accountName,
          emails: []
        };
      }
      groups[key].emails.push(email);
    });
    return Object.values(groups);
  }, [results]);

  // Highlight search term in text
  const highlightText = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const lowerText = text.toLowerCase();
    const lowerTerm = searchTerm.toLowerCase();
    const index = lowerText.indexOf(lowerTerm);
    
    if (index === -1) return text;
    
    return (
      <>
        {text.substring(0, index)}
        <mark className="bg-orange-500/40 text-white rounded px-0.5">
          {text.substring(index, index + searchTerm.length)}
        </mark>
        {text.substring(index + searchTerm.length)}
      </>
    );
  };

  // Format date
  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    
    if (diff < 24 * 60 * 60 * 1000) {
      return d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return d.toLocaleDateString('de-CH', { weekday: 'short' });
    }
    return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  // Get match indicator
  const getMatchIndicator = (matchedIn) => {
    if (!matchedIn || matchedIn.length === 0) return null;
    
    const labels = {
      subject: 'Betreff',
      from: 'Absender',
      to: 'Empfänger',
      body: 'Text'
    };
    
    return (
      <div className="flex gap-1 mt-1">
        {matchedIn.map(field => (
          <span 
            key={field}
            className="px-1.5 py-0.5 text-xs rounded bg-orange-500/20 text-orange-400"
          >
            {labels[field] || field}
          </span>
        ))}
      </div>
    );
  };

  // Loading state
  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" />
        <p className={`${c.textSecondary}`}>Durchsuche alle Postfächer...</p>
        <p className={`${c.textSecondary} text-sm mt-1`}>Dies kann einige Sekunden dauern</p>
      </div>
    );
  }

  // No results
  if (results.length === 0 && query) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Mail className={`w-12 h-12 ${c.textSecondary} mb-4 opacity-50`} />
        <p className={`${c.text} text-lg`}>Keine Mails gefunden</p>
        <p className={`${c.textSecondary} text-sm mt-1`}>Versuche andere Suchbegriffe oder Filter</p>
      </div>
    );
  }

  // Empty state (no search yet)
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Mail className={`w-12 h-12 ${c.textSecondary} mb-4 opacity-30`} />
        <p className={`${c.textSecondary}`}>Gib einen Suchbegriff ein</p>
        <p className={`${c.textSecondary} text-sm mt-1`}>Suche nach Betreff, Absender oder Inhalt</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-700/50">
      {groupedResults.map(group => (
        <div key={group.accountId}>
          {/* Account Header */}
          <div className={`px-4 py-2 ${c.bg} sticky top-0 z-10 flex items-center gap-2`}>
            <User className={`w-4 h-4 ${c.accent}`} />
            <span className={`${c.text} font-medium text-sm`}>{group.accountName}</span>
            <span className={`${c.textSecondary} text-xs`}>({group.emails.length} Treffer)</span>
          </div>
          
          {/* Emails */}
          {group.emails.map((email, idx) => (
            <button
              key={`${email.uid}-${idx}`}
              onClick={() => onSelectEmail?.(email)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-700/30 transition-colors flex items-start gap-3 group`}
            >
              {/* Read/Unread Icon */}
              <div className="pt-1 flex-shrink-0">
                {email.seen ? (
                  <MailOpen className={`w-5 h-5 ${c.textSecondary}`} />
                ) : (
                  <Mail className="w-5 h-5 text-orange-500" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Subject */}
                <div className={`${email.seen ? c.text : 'text-white font-medium'} truncate`}>
                  {highlightText(email.subject, query)}
                </div>
                
                {/* From */}
                <div className={`${c.textSecondary} text-sm truncate mt-0.5`}>
                  {highlightText(email.fromName, query)}
                  {email.fromEmail && (
                    <span className="opacity-70"> &lt;{email.fromEmail}&gt;</span>
                  )}
                </div>
                
                {/* Preview */}
                <div className={`${c.textSecondary} text-xs truncate mt-1 opacity-70`}>
                  {highlightText(email.preview, query)}
                </div>

                {/* Match Indicator */}
                {getMatchIndicator(email.matchedIn)}
              </div>

              {/* Meta Info */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {/* Date */}
                <div className={`${c.textSecondary} text-xs flex items-center gap-1`}>
                  <Clock className="w-3 h-3" />
                  {formatDate(email.date)}
                </div>

                {/* Folder */}
                <div className={`${c.textSecondary} text-xs flex items-center gap-1`}>
                  <Folder className="w-3 h-3" />
                  {email.folder}
                </div>

                {/* Flags */}
                <div className="flex gap-1">
                  {email.hasAttachments && (
                    <Paperclip className={`w-3 h-3 ${c.textSecondary}`} />
                  )}
                  {email.flagged && (
                    <Flag className="w-3 h-3 text-yellow-500" />
                  )}
                </div>
              </div>

              {/* Arrow on hover */}
              <ArrowRight className={`w-5 h-5 ${c.textSecondary} opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1`} />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
