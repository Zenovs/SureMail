import React from 'react';

const EmailListItem = ({ email, isSelected, onClick, isSentFolder }) => {
  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    if (isToday) {
      return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-dark-700 cursor-pointer transition-all hover:bg-dark-700 ${
        isSelected ? 'bg-dark-700 border-l-2 border-l-cyan-400' : ''
      } ${!email.seen ? 'bg-dark-800' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Absender / Empfänger */}
          <div className="flex items-center gap-2 mb-1">
            {!email.seen && (
              <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0"></div>
            )}
            <span className={`text-sm truncate ${
              !email.seen ? 'text-gray-100 font-semibold' : 'text-gray-400'
            }`}>
              {isSentFolder ? `An: ${email.to || email.from}` : email.from}
            </span>
          </div>
          
          {/* Betreff */}
          <h3 className={`text-sm truncate mb-1 ${
            !email.seen ? 'text-gray-200 font-medium' : 'text-gray-400'
          }`}>
            {email.subject}
          </h3>
          
          {/* Vorschau */}
          <p className="text-xs text-gray-500 truncate">
            {email.preview}
          </p>
        </div>

        {/* Datum & Anhänge */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-xs text-gray-500">
            {formatDate(email.date)}
          </span>
          {email.hasAttachments && (
            <span className="text-gray-500" title="Hat Anhänge">
              📎
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailListItem;
