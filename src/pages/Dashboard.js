import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../context/AccountContext';

function Dashboard({ onNavigate, onSelectAccount }) {
  const { currentTheme } = useTheme();
  const { accounts, categories, getAccountsByCategory, accountStats, updateAccountStats } = useAccounts();
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({ total: 0, unread: 0 });
  const c = currentTheme.colors;

  useEffect(() => {
    fetchAllStats();
  }, [accounts]);

  const fetchAllStats = async () => {
    if (!window.electronAPI || accounts.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let total = 0;
    let unread = 0;

    for (const account of accounts) {
      try {
        const result = await window.electronAPI.fetchEmailsForAccount(account.id, { limit: 100 });
        if (result.success) {
          const stats = {
            total: result.emails.length,
            unread: result.emails.filter(e => !e.seen).length
          };
          updateAccountStats(account.id, stats);
          total += stats.total;
          unread += stats.unread;
        }
      } catch (e) {
        console.error('Error fetching stats for', account.name, e);
      }
    }

    setTotalStats({ total, unread });
    setLoading(false);
  };

  const getCategoryStats = (categoryId) => {
    const categoryAccounts = getAccountsByCategory(categoryId);
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

  return (
    <div className={`flex-1 p-6 overflow-auto ${c.bg}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${c.text} mb-2`}>Dashboard</h1>
          <p className={c.textSecondary}>Übersicht über alle E-Mail-Konten</p>
        </div>

        {/* Gesamtstatistik */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-8`}>
          <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
            <div className={`text-sm ${c.textSecondary} mb-1`}>Konten</div>
            <div className={`text-3xl font-bold ${c.text}`}>{accounts.length}</div>
          </div>
          <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
            <div className={`text-sm ${c.textSecondary} mb-1`}>Gesamt E-Mails</div>
            <div className={`text-3xl font-bold ${c.text}`}>
              {loading ? '...' : totalStats.total}
            </div>
          </div>
          <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
            <div className={`text-sm ${c.textSecondary} mb-1`}>Ungelesen</div>
            <div className={`text-3xl font-bold ${c.accent}`}>
              {loading ? '...' : totalStats.unread}
            </div>
          </div>
        </div>

        {/* Kategorien */}
        <h2 className={`text-xl font-semibold ${c.text} mb-4`}>Nach Kategorien</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {categories.map(category => {
            const stats = getCategoryStats(category.id);
            const categoryAccounts = getAccountsByCategory(category.id);
            
            return (
              <div key={category.id} className={`${c.card} ${c.border} border rounded-xl p-5`}>
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <h3 className={`font-semibold ${c.text}`}>{category.name}</h3>
                </div>
                <div className="flex justify-between mb-4">
                  <div>
                    <span className={`text-2xl font-bold ${c.accent}`}>{stats.unread}</span>
                    <span className={`text-sm ml-1 ${c.textSecondary}`}>ungelesen</span>
                  </div>
                  <div className={c.textSecondary}>
                    {categoryAccounts.length} Konto{categoryAccounts.length !== 1 ? 'en' : ''}
                  </div>
                </div>
                <div className="space-y-2">
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
                        <span className={`${c.accent} text-xs`}>
                          {accountStats[acc.id].unread} neu
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Schnellzugriff Konten */}
        {accounts.length === 0 && (
          <div className={`${c.card} ${c.border} border rounded-xl p-8 text-center`}>
            <div className="text-5xl mb-4">📧</div>
            <h3 className={`text-xl font-semibold ${c.text} mb-2`}>Keine Konten konfiguriert</h3>
            <p className={`${c.textSecondary} mb-6`}>
              Füge dein erstes E-Mail-Konto hinzu, um loszulegen.
            </p>
            <button
              onClick={() => onNavigate('accounts')}
              className={`px-6 py-3 ${c.accentBg} ${c.accentHover} text-white rounded-lg transition-colors`}
            >
              Konto hinzufügen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
