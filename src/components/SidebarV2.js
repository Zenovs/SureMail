import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../context/AccountContext';

function SidebarV2({ currentView, onNavigate }) {
  const { currentTheme } = useTheme();
  const { categories, getAccountsByCategory, activeAccountId, setActiveAccountId } = useAccounts();
  const [expandedCategories, setExpandedCategories] = useState(['work', 'personal', 'other']);
  const c = currentTheme.colors;

  const toggleCategory = (catId) => {
    setExpandedCategories(prev => 
      prev.includes(catId) 
        ? prev.filter(id => id !== catId)
        : [...prev, catId]
    );
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'inbox', label: 'Posteingang', icon: '📥' },
    { id: 'compose', label: 'Verfassen', icon: '✏️' },
  ];

  const bottomItems = [
    { id: 'accounts', label: 'Konten', icon: '👤' },
    { id: 'settings', label: 'Einstellungen', icon: '⚙️' },
  ];

  return (
    <aside className={`w-64 ${c.sidebar} ${c.border} border-r flex flex-col h-full`}>
      {/* Logo */}
      <div className={`p-4 ${c.border} border-b`}>
        <h1 className={`text-xl font-bold ${c.accent}`}>CoreMail</h1>
        <span className={`text-xs ${c.textSecondary}`}>v1.1.0</span>
      </div>

      {/* Main Navigation */}
      <nav className="p-3 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              currentView === item.id
                ? `${c.accentBg} text-white`
                : `${c.text} ${c.hover}`
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Kategorien mit Konten */}
      <div className={`flex-1 overflow-auto p-3 ${c.border} border-t`}>
        <div className={`text-xs uppercase tracking-wide ${c.textSecondary} mb-2 px-2`}>
          Konten
        </div>
        {categories.map(category => {
          const accounts = getAccountsByCategory(category.id);
          const isExpanded = expandedCategories.includes(category.id);
          
          return (
            <div key={category.id} className="mb-1">
              <button
                onClick={() => toggleCategory(category.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg ${c.hover} ${c.text} text-sm`}
              >
                <span className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: category.color }}
                />
                <span>{category.name}</span>
                <span className={`ml-auto text-xs ${c.textSecondary}`}>{accounts.length}</span>
              </button>
              
              {isExpanded && accounts.length > 0 && (
                <div className="ml-5 mt-1 space-y-0.5">
                  {accounts.map(account => (
                    <button
                      key={account.id}
                      onClick={() => {
                        setActiveAccountId(account.id);
                        onNavigate('inbox');
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        activeAccountId === account.id
                          ? `${c.bgTertiary} ${c.accent}`
                          : `${c.textSecondary} ${c.hover}`
                      }`}
                    >
                      {account.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Navigation */}
      <div className={`p-3 ${c.border} border-t space-y-1`}>
        {bottomItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
              currentView === item.id
                ? `${c.bgTertiary} ${c.accent}`
                : `${c.textSecondary} ${c.hover}`
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

export default SidebarV2;
