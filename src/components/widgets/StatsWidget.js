import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAccounts } from '../../context/AccountContext';
import WidgetWrapper from './WidgetWrapper';

function StatsWidget({ widget }) {
  const { currentTheme } = useTheme();
  const { accounts, accountStats, updateAccountStats } = useAccounts();
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({ total: 0, unread: 0 });
  const c = currentTheme.colors;

  useEffect(() => {
    fetchStats();
  }, [accounts]);

  const fetchStats = async () => {
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

  const isSmall = widget.size === 'small';

  return (
    <WidgetWrapper widget={widget}>
      <div className={`grid ${isSmall ? 'grid-cols-1 gap-2' : 'grid-cols-3 gap-4'} h-full`}>
        <div className={`flex flex-col justify-center ${isSmall ? 'items-start' : 'items-center'} ${c.bgSecondary} rounded-lg p-3`}>
          <span className={`text-xs ${c.textSecondary} mb-1`}>Konten</span>
          <span className={`text-2xl font-bold ${c.text}`}>{accounts.length}</span>
        </div>
        <div className={`flex flex-col justify-center ${isSmall ? 'items-start' : 'items-center'} ${c.bgSecondary} rounded-lg p-3`}>
          <span className={`text-xs ${c.textSecondary} mb-1`}>E-Mails</span>
          <span className={`text-2xl font-bold ${c.text}`}>{loading ? '...' : totalStats.total}</span>
        </div>
        <div className={`flex flex-col justify-center ${isSmall ? 'items-start' : 'items-center'} ${c.bgSecondary} rounded-lg p-3`}>
          <span className={`text-xs ${c.textSecondary} mb-1`}>Ungelesen</span>
          <span className={`text-2xl font-bold ${c.accent}`}>{loading ? '...' : totalStats.unread}</span>
        </div>
      </div>
    </WidgetWrapper>
  );
}

export default StatsWidget;
