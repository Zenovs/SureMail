import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../context/AccountContext';
import { useSidebar } from '../context/SidebarContext';

function SidebarV2({ currentView, onNavigate }) {
  const { currentTheme } = useTheme();
  const { categories, getAccountsByCategory, activeAccountId, setActiveAccountId } = useAccounts();
  const { settings, updateWidth, isResizing, setIsResizing } = useSidebar();
  const [expandedCategories, setExpandedCategories] = useState(['work', 'personal', 'other']);
  const [appVersion, setAppVersion] = useState('...');
  const sidebarRef = useRef(null);
  const c = currentTheme.colors;

  // Load version dynamically from package.json via Electron
  useEffect(() => {
    const loadVersion = async () => {
      if (window.electronAPI?.getVersion) {
        const version = await window.electronAPI.getVersion();
        setAppVersion(version);
      }
    };
    loadVersion();
  }, []);

  // Resize Handler
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, [setIsResizing]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      updateWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, updateWidth, setIsResizing]);

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

  // Icons-Only Mode
  const isIconsOnly = settings.iconsOnly && !isResizing;
  const displayWidth = settings.collapsed ? 64 : (isIconsOnly ? 64 : settings.width);

  return (
    <aside 
      ref={sidebarRef}
      className={`${c.sidebar} ${c.border} border-r flex flex-col h-full relative select-none`}
      style={{ 
        width: displayWidth,
        minWidth: settings.minWidth,
        maxWidth: settings.maxWidth,
        transition: isResizing ? 'none' : 'width 0.2s ease-out'
      }}
    >
      {/* Logo */}
      <div className={`p-4 ${c.border} border-b`}>
        {isIconsOnly || settings.collapsed ? (
          <div className="flex justify-center">
            <span className="text-2xl">📧</span>
          </div>
        ) : (
          <>
            <h1 className={`text-xl font-bold ${c.accent}`}>CoreMail</h1>
            <span className={`text-xs ${c.textSecondary}`}>v{appVersion}</span>
          </>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="p-3 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            title={isIconsOnly || settings.collapsed ? item.label : ''}
            className={`w-full flex items-center ${isIconsOnly || settings.collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-colors ${
              currentView === item.id
                ? `${c.accentBg} text-white`
                : `${c.text} ${c.hover}`
            }`}
          >
            <span>{item.icon}</span>
            {!isIconsOnly && !settings.collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Kategorien mit Konten */}
      {!isIconsOnly && !settings.collapsed && (
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
                  <span className="truncate">{category.name}</span>
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
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors truncate ${
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
      )}

      {/* Collapsed/Icons-only spacer */}
      {(isIconsOnly || settings.collapsed) && <div className="flex-1" />}

      {/* Bottom Navigation */}
      <div className={`p-3 ${c.border} border-t space-y-1`}>
        {bottomItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            title={isIconsOnly || settings.collapsed ? item.label : ''}
            className={`w-full flex items-center ${isIconsOnly || settings.collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition-colors text-sm ${
              currentView === item.id
                ? `${c.bgTertiary} ${c.accent}`
                : `${c.textSecondary} ${c.hover}`
            }`}
          >
            <span>{item.icon}</span>
            {!isIconsOnly && !settings.collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`absolute top-0 right-0 w-1 h-full cursor-col-resize group hover:bg-cyan-500/50 transition-colors ${
          isResizing ? 'bg-cyan-500' : 'bg-transparent'
        }`}
      >
        <div className={`absolute top-1/2 right-0 transform -translate-y-1/2 w-4 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
          isResizing ? 'opacity-100' : ''
        }`}>
          <div className={`w-1 h-6 rounded ${c.bgSecondary}`} />
        </div>
      </div>
    </aside>
  );
}

export default SidebarV2;
