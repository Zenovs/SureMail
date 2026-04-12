import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const AccountContext = createContext();
const AccountStatsContext = createContext();

const defaultCategories = [
  { id: 'work', name: 'Arbeit', color: '#3b82f6' },
  { id: 'personal', name: 'Privat', color: '#22c55e' },
  { id: 'other', name: 'Sonstiges', color: '#8b5cf6' }
];

export function AccountProvider({ children }) {
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [activeAccountId, setActiveAccountId] = useState(null);
  const [accountStats, setAccountStats] = useState({});

  useEffect(() => {
    loadAccountsAndCategories();
  }, []);

  const loadAccountsAndCategories = useCallback(async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.loadAccounts();
      if (result.success) {
        setAccounts(result.accounts || []);
        setCategories(result.categories || defaultCategories);
        if (result.accounts?.length > 0) {
          setActiveAccountId(prev => prev || result.accounts[0].id);
        }
      }
    }
  }, []);

  const saveAccountsAndCategories = useCallback(async (newAccounts, newCategories) => {
    if (window.electronAPI) {
      await window.electronAPI.saveAccounts({
        accounts: newAccounts,
        categories: newCategories
      });
    }
  }, []);

  const addAccount = useCallback(async (account) => {
    const newAccount = { ...account, id: `acc_${Date.now()}` };
    setAccounts(prev => {
      const newAccounts = [...prev, newAccount];
      saveAccountsAndCategories(newAccounts, categories);
      return newAccounts;
    });
    setActiveAccountId(prev => prev || newAccount.id);
    return newAccount;
  }, [categories, saveAccountsAndCategories]);

  const updateAccount = useCallback(async (id, updates) => {
    setAccounts(prev => {
      const newAccounts = prev.map(acc => acc.id === id ? { ...acc, ...updates } : acc);
      saveAccountsAndCategories(newAccounts, categories);
      return newAccounts;
    });
  }, [categories, saveAccountsAndCategories]);

  const deleteAccount = useCallback(async (id) => {
    setAccounts(prev => {
      const newAccounts = prev.filter(acc => acc.id !== id);
      saveAccountsAndCategories(newAccounts, categories);
      return newAccounts;
    });
    setActiveAccountId(prev => {
      if (prev !== id) return prev;
      return accounts.find(acc => acc.id !== id)?.id || null;
    });
  }, [accounts, categories, saveAccountsAndCategories]);

  const addCategory = useCallback(async (category) => {
    const newCategory = { ...category, id: `cat_${Date.now()}` };
    setCategories(prev => {
      const newCategories = [...prev, newCategory];
      saveAccountsAndCategories(accounts, newCategories);
      return newCategories;
    });
    return newCategory;
  }, [accounts, saveAccountsAndCategories]);

  const updateCategory = useCallback(async (id, updates) => {
    setCategories(prev => {
      const newCategories = prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat);
      saveAccountsAndCategories(accounts, newCategories);
      return newCategories;
    });
  }, [accounts, saveAccountsAndCategories]);

  const deleteCategory = useCallback(async (id) => {
    setCategories(prev => {
      const newCategories = prev.filter(cat => cat.id !== id);
      setAccounts(accs => {
        const newAccounts = accs.map(acc =>
          acc.categoryId === id ? { ...acc, categoryId: 'other' } : acc
        );
        saveAccountsAndCategories(newAccounts, newCategories);
        return newAccounts;
      });
      return newCategories;
    });
  }, [saveAccountsAndCategories]);

  const getActiveAccount = useCallback(() => {
    return accounts.find(acc => acc.id === activeAccountId) || null;
  }, [accounts, activeAccountId]);

  const getAccountsByCategory = useCallback((categoryId) => {
    return accounts.filter(acc => acc.categoryId === categoryId);
  }, [accounts]);

  const updateAccountStats = useCallback((accountId, stats) => {
    setAccountStats(prev => ({ ...prev, [accountId]: stats }));
  }, []);

  // Memoized context value — only re-creates when actual data changes,
  // preventing all consumers from re-rendering on unrelated state updates.
  const value = useMemo(() => ({
    accounts,
    categories,
    activeAccountId,
    setActiveAccountId,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    updateCategory,
    deleteCategory,
    getActiveAccount,
    getAccountsByCategory,
    updateAccountStats,
    refreshAccounts: loadAccountsAndCategories
  }), [
    accounts, categories, activeAccountId,
    addAccount, updateAccount, deleteAccount,
    addCategory, updateCategory, deleteCategory,
    getActiveAccount, getAccountsByCategory,
    updateAccountStats, loadAccountsAndCategories
  ]);

  // accountStats in separate context so badge updates don't re-render
  // components that only need accounts/categories (e.g. folder list, sidebar).
  const statsValue = useMemo(() => accountStats, [accountStats]);

  return (
    <AccountContext.Provider value={value}>
      <AccountStatsContext.Provider value={statsValue}>
        {children}
      </AccountStatsContext.Provider>
    </AccountContext.Provider>
  );
}

export function useAccounts() {
  const context = useContext(AccountContext);
  if (!context) throw new Error('useAccounts must be used within AccountProvider');
  return context;
}

export function useAccountStats() {
  const context = useContext(AccountStatsContext);
  if (context === undefined) throw new Error('useAccountStats must be used within AccountProvider');
  return context;
}
