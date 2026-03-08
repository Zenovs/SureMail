import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import WidgetWrapper from './WidgetWrapper';

function QuickActionsWidget({ widget, onNavigate }) {
  const { currentTheme } = useTheme();
  const c = currentTheme.colors;

  const actions = [
    { id: 'compose', icon: '✏️', label: 'E-Mail verfassen', view: 'compose' },
    { id: 'inbox', icon: '📥', label: 'Posteingang', view: 'inbox' },
    { id: 'accounts', icon: '👤', label: 'Konten verwalten', view: 'accounts' },
    { id: 'settings', icon: '⚙️', label: 'Einstellungen', view: 'settings' }
  ];

  const isSmall = widget.size === 'small';

  return (
    <WidgetWrapper widget={widget}>
      <div className={`grid ${isSmall ? 'grid-cols-2 gap-2' : 'grid-cols-2 md:grid-cols-4 gap-3'} h-full`}>
        {actions.map(action => (
          <button
            key={action.id}
            onClick={() => onNavigate(action.view)}
            className={`flex flex-col items-center justify-center p-3 rounded-lg ${c.hover} ${c.bgSecondary} transition-all hover:scale-105`}
          >
            <span className="text-2xl mb-2">{action.icon}</span>
            <span className={`text-xs ${c.text} text-center`}>{action.label}</span>
          </button>
        ))}
      </div>
    </WidgetWrapper>
  );
}

export default QuickActionsWidget;
