import React, { createContext, useContext, useState, useEffect } from 'react';

const AccountContext = createContext();

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

  const loadAccountsAndCategories = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.loadAccounts();
      if (result.success) {
        setAccounts(result.accounts || []);
        setCategories(result.categories || defaultCategories);
        if (result.accounts?.length > 0 && !activeAccountId) {
          setActiveAccountId(result.accounts[0].id);
        }
      }
    }
  };

  const saveAccountsAndCategories = async (newAccounts, newCategories) => {
    if (window.electronAPI) {
      await window.electronAPI.saveAccounts({
        accounts: newAccounts,
        categories: newCategories
      });
    }
  };

  const addAccount = async (account) => {
    const newAccount = {
      ...account,
      id: `acc_${Date.now()}`
    };
    const newAccounts = [...accounts, newAccount];
    setAccounts(newAccounts);
    await saveAccountsAndCategories(newAccounts, categories);
    if (!activeAccountId) {
      setActiveAccountId(newAccount.id);
    }
    return newAccount;
  };

  const updateAccount = async (id, updates) => {
    const newAccounts = accounts.map(acc => 
      acc.id === id ? { ...acc, ...updates } : acc
    );
    setAccounts(newAccounts);
    await saveAccountsAndCategories(newAccounts, categories);
  };

  const deleteAccount = async (id) => {
    const newAccounts = accounts.filter(acc => acc.id !== id);
    setAccounts(newAccounts);
    await saveAccountsAndCategories(newAccounts, categories);
    if (activeAccountId === id) {
      setActiveAccountId(newAccounts[0]?.id || null);
    }
  };

  const addCategory = async (category) => {
    const newCategory = {
      ...category,
      id: `cat_${Date.now()}`
    };
    const newCategories = [...categories, newCategory];
    setCategories(newCategories);
    await saveAccountsAndCategories(accounts, newCategories);
    return newCategory;
  };

  const updateCategory = async (id, updates) => {
    const newCategories = categories.map(cat => 
      cat.id === id ? { ...cat, ...updates } : cat
    );
    setCategories(newCategories);
    await saveAccountsAndCategories(accounts, newCategories);
  };

  const deleteCategory = async (id) => {
    const newCategories = categories.filter(cat => cat.id !== id);
    setCategories(newCategories);
    // Move accounts to 'other'
    const newAccounts = accounts.map(acc => 
      acc.categoryId === id ? { ...acc, categoryId: 'other' } : acc
    );
    setAccounts(newAccounts);
    await saveAccountsAndCategories(newAccounts, newCategories);
  };

  const getActiveAccount = () => {
    return accounts.find(acc => acc.id === activeAccountId) || null;
  };

  const getAccountsByCategory = (categoryId) => {
    return accounts.filter(acc => acc.categoryId === categoryId);
  };

  const updateAccountStats = (accountId, stats) => {
    setAccountStats(prev => ({ ...prev, [accountId]: stats }));
  };

  return (
    <AccountContext.Provider value={{
      accounts,
      categories,
      activeAccountId,
      accountStats,
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
    }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccounts() {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccounts must be used within AccountProvider');
  }
  return context;
}
