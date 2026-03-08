import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAccounts } from '../../context/AccountContext';
import WidgetWrapper from './WidgetWrapper';

function CategoryWidget({ widget, onNavigate, onSelectAccount }) {
  const { currentTheme } = useTheme();
  const { categories, getAccountsByCategory, accountStats } = useAccounts();
  const c = currentTheme.colors;

  const category = categories.find(cat => cat.id === widget.config.categoryId);
  const categoryAccounts = category ? getAccountsByCategory(category.id) : [];

  const getCategoryStats = () => {
    let total = 0;
    let unread = 0;
    categoryAccounts.forEach(acc => {
      const stats = accountStats[acc.id];
      if (stats) {
        total += stats.total;
        unread += stats.unread;
      }
    });
    return { total, unread };
  };

  if (!category) {
    return (
      <WidgetWrapper widget={widget}>
        <div className={`flex items-center justify-center h-full ${c.textSecondary}`}>
          <span>Kategorie nicht gefunden</span>
        </div>
      </WidgetWrapper>
    );
  }

  const stats = getCategoryStats();
  const isSmall = widget.size === 'small';

  return (
    <WidgetWrapper widget={widget}>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ backgroundColor: category.color }}
          />
          <div>
            <div className={`font-semibold ${c.text}`}>{category.name}</div>
            <div className={`text-xs ${c.textSecondary}`}>{categoryAccounts.length} Konten</div>
          </div>
          <div className="ml-auto text-right">
            <div className={`text-lg font-bold ${c.accent}`}>{stats.unread}</div>
            <div className={`text-xs ${c.textSecondary}`}>ungelesen</div>
          </div>
        </div>
        
        {!isSmall && (
          <div className="flex-1 space-y-2 overflow-auto">
            {categoryAccounts.map(acc => (
              <button
                key={acc.id}
                onClick={() => {
                  onSelectAccount(acc.id);
                  onNavigate('inbox');
                }}
                className={`w-full text-left px-3 py-2 rounded-lg ${c.hover} ${c.text} text-sm flex justify-between items-center transition-colors`}
              >
                <span>{acc.name}</span>
                {accountStats[acc.id] && (
                  <span className={`${c.accent} text-xs px-2 py-1 rounded ${c.bgSecondary}`}>
                    {accountStats[acc.id].unread} neu
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </WidgetWrapper>
  );
}

export default CategoryWidget;
