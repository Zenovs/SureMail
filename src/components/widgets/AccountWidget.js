import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAccounts } from '../../context/AccountContext';
import WidgetWrapper from './WidgetWrapper';

function AccountWidget({ widget, onNavigate, onSelectAccount }) {
  const { currentTheme } = useTheme();
  const { accounts, accountStats, updateAccountStats } = useAccounts();
  const [loading, setLoading] = useState(true);
  const c = currentTheme.colors;

  const account = accounts.find(a => a.id === widget.config.accountId);
  const stats = account ? accountStats[account.id] : null;

  useEffect(() => {
    if (account) {
      fetchAccountStats();
    }
  }, [account]);

  const fetchAccountStats = async () => {
    if (!window.electronAPI || !account) return;
    setLoading(true);
    try {
      const result = await window.electronAPI.fetchEmailsForAccount(account.id, { limit: 50 });
      if (result.success) {
        updateAccountStats(account.id, {
          total: result.emails.length,
          unread: result.emails.filter(e => !e.seen).length
        });
      }
    } catch (e) {
      console.error('Error fetching account stats:', e);
    }
    setLoading(false);
  };

  if (!account) {
    return (
      <WidgetWrapper widget={widget}>
        <div className={`flex items-center justify-center h-full ${c.textSecondary}`}>
          <span>Konto nicht gefunden</span>
        </div>
      </WidgetWrapper>
    );
  }

  const isLarge = widget.size === 'large';

  return (
    <WidgetWrapper widget={widget}>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
            {account.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className={`font-semibold ${c.text}`}>{account.name}</div>
            <div className={`text-xs ${c.textSecondary}`}>{account.email || account.imapUser}</div>
          </div>
        </div>
        
        <div className={`grid ${isLarge ? 'grid-cols-2' : 'grid-cols-1'} gap-3 mb-4`}>
          <div className={`${c.bgSecondary} rounded-lg p-3`}>
            <span className={`text-xs ${c.textSecondary}`}>E-Mails</span>
            <div className={`text-xl font-bold ${c.text}`}>{loading ? '...' : stats?.total || 0}</div>
          </div>
          <div className={`${c.bgSecondary} rounded-lg p-3`}>
            <span className={`text-xs ${c.textSecondary}`}>Ungelesen</span>
            <div className={`text-xl font-bold ${c.accent}`}>{loading ? '...' : stats?.unread || 0}</div>
          </div>
        </div>
        
        <button
          onClick={() => {
            onSelectAccount(account.id);
            onNavigate('inbox');
          }}
          className={`mt-auto w-full py-2 px-4 ${c.accentBg} ${c.accentHover} text-white rounded-lg transition-colors text-sm`}
        >
          📥 Posteingang öffnen
        </button>
      </div>
    </WidgetWrapper>
  );
}

export default AccountWidget;
