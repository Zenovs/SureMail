import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useDashboard } from '../../context/DashboardContext';

function WidgetWrapper({ widget, children }) {
  const { currentTheme } = useTheme();
  const { isEditMode, removeWidget, updateWidgetSize } = useDashboard();
  const c = currentTheme.colors;

  const sizeOptions = [
    { id: 'small', label: 'S' },
    { id: 'medium', label: 'M' },
    { id: 'large', label: 'L' }
  ];

  return (
    <div className={`h-full ${c.card} ${c.border} border rounded-xl overflow-hidden flex flex-col transition-all ${isEditMode ? 'ring-2 ring-cyan-500/50' : ''}`}>
      {/* Widget Header */}
      <div className={`flex items-center justify-between px-4 py-3 ${c.border} border-b bg-opacity-50`}>
        <div className="flex items-center gap-2">
          {isEditMode && (
            <span className="cursor-move text-gray-400 hover:text-gray-200 drag-handle">⠿</span>
          )}
          <h3 className={`font-semibold ${c.text} text-sm`}>{widget.title}</h3>
        </div>
        {isEditMode && (
          <div className="flex items-center gap-2">
            {/* Größen-Auswahl */}
            <div className="flex gap-1">
              {sizeOptions.map(size => (
                <button
                  key={size.id}
                  onClick={() => updateWidgetSize(widget.id, size.id)}
                  className={`w-6 h-6 rounded text-xs font-bold transition-colors ${
                    widget.size === size.id
                      ? `${c.accentBg} text-white`
                      : `${c.bgSecondary} ${c.textSecondary} hover:${c.accent}`
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
            {/* Löschen */}
            <button
              onClick={() => removeWidget(widget.id)}
              className="w-6 h-6 rounded bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors text-xs"
            >
              ✕
            </button>
          </div>
        )}
      </div>
      
      {/* Widget Content */}
      <div className="flex-1 p-4 overflow-auto">
        {children}
      </div>
    </div>
  );
}

export default WidgetWrapper;
