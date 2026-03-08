import React, { useState, useEffect } from 'react';
import { Mail, MailOpen, MousePointer } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const MARK_AS_READ_OPTIONS = [
  { id: 'onClick', name: 'Beim Klick', desc: 'E-Mail wird beim Auswählen als gelesen markiert', icon: MousePointer },
  { id: 'onOpen', name: 'Beim Öffnen', desc: 'E-Mail wird beim Öffnen in Vollansicht als gelesen markiert', icon: Mail },
  { id: 'iconOnly', name: 'Nur durch Icon', desc: 'E-Mail wird nur durch Klick auf das Gelesen-Icon markiert', icon: MailOpen },
];

function EmailSettings() {
  const { currentTheme } = useTheme();
  const c = currentTheme.colors;
  const [markAsReadMode, setMarkAsReadMode] = useState('onClick');

  useEffect(() => {
    const saved = localStorage.getItem('emailSettings.markAsReadMode');
    if (saved) {
      setMarkAsReadMode(saved);
    }
  }, []);

  const handleChange = (mode) => {
    setMarkAsReadMode(mode);
    localStorage.setItem('emailSettings.markAsReadMode', mode);
  };

  return (
    <div className="space-y-6">
      {/* Mark as Read Settings */}
      <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
        <h3 className={`text-lg font-semibold ${c.text} mb-2`}>Als gelesen markieren</h3>
        <p className={`text-sm ${c.textSecondary} mb-4`}>
          Wann sollen E-Mails automatisch als gelesen markiert werden?
        </p>

        <div className="space-y-3">
          {MARK_AS_READ_OPTIONS.map(option => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => handleChange(option.id)}
                className={`w-full p-4 rounded-xl border-2 transition-colors flex items-start gap-4 text-left ${
                  markAsReadMode === option.id
                    ? `${c.accentBorder || 'border-cyan-500'} ${c.bgTertiary}`
                    : `${c.border} ${c.hover}`
                }`}
              >
                <div className={`p-2 rounded-lg ${markAsReadMode === option.id ? c.accentBg : c.bgSecondary}`}>
                  <Icon className={`w-5 h-5 ${markAsReadMode === option.id ? 'text-white' : c.textSecondary}`} />
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${c.text}`}>{option.name}</div>
                  <div className={`text-sm ${c.textSecondary} mt-1`}>{option.desc}</div>
                </div>
                {markAsReadMode === option.id && (
                  <div className={`w-3 h-3 rounded-full ${c.accentBg} mt-2`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tips */}
      <div className={`${c.bgSecondary} ${c.border} border rounded-xl p-6`}>
        <h4 className={`font-medium ${c.text} mb-3`}>💡 Hinweis</h4>
        <p className={`text-sm ${c.textSecondary}`}>
          Diese Einstellung beeinflusst, wie E-Mails in der Listenansicht als gelesen markiert werden. 
          Du kannst E-Mails jederzeit manuell als gelesen/ungelesen markieren.
        </p>
      </div>
    </div>
  );
}

export default EmailSettings;
