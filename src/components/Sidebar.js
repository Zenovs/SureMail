import React from 'react';

const Sidebar = ({ currentView, onNavigate, isConfigured }) => {
  const navItems = [
    { id: 'inbox', label: 'Posteingang', icon: '📥', disabled: !isConfigured },
    { id: 'compose', label: 'Neue E-Mail', icon: '✏️', disabled: !isConfigured },
    { id: 'settings', label: 'Einstellungen', icon: '⚙️', disabled: false }
  ];

  return (
    <aside className="w-64 bg-dark-800 border-r border-dark-600 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-dark-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-100">CoreMail</h1>
            <p className="text-xs text-gray-500">Desktop v1.0</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => !item.disabled && onNavigate(item.id)}
                disabled={item.disabled}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  currentView === item.id
                    ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-600/50 glow-cyan'
                    : item.disabled
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-400 hover:bg-dark-700 hover:text-gray-200'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Status */}
      <div className="p-4 border-t border-dark-600">
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
          <span className="text-gray-500">
            {isConfigured ? 'Verbunden' : 'Nicht konfiguriert'}
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
