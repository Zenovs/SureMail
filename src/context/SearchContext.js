import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const SearchContext = createContext();

export function SearchProvider({ children }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [searchStats, setSearchStats] = useState(null);
  const [filters, setFilters] = useState({
    accountIds: [],
    folders: [],
    dateFrom: null,
    dateTo: null,
    unreadOnly: false,
    flaggedOnly: false,
    hasAttachments: false
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const debounceRef = useRef(null);

  // Open/Close search panel
  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setSuggestions([]);
    setSearchError(null);
    setSearchStats(null);
  }, []);

  const toggleSearch = useCallback(() => {
    if (isSearchOpen) {
      closeSearch();
    } else {
      openSearch();
    }
  }, [isSearchOpen, openSearch, closeSearch]);

  // Quick search (autocomplete)
  const performQuickSearch = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const result = await window.electronAPI?.quickSearch({ query, limit: 10 });
      if (result?.success) {
        setSuggestions(result.suggestions || []);
      }
    } catch (error) {
      console.error('Quick search error:', error);
    }
  }, []);

  // Debounced quick search
  const debouncedQuickSearch = useCallback((query) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      performQuickSearch(query);
    }, 300);
  }, [performQuickSearch]);

  // Full search
  const performSearch = useCallback(async (query, customFilters = null) => {
    if (!query || query.trim().length < 2) {
      setSearchError('Suchbegriff muss mindestens 2 Zeichen haben');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setSuggestions([]);

    try {
      const activeFilters = customFilters || filters;
      const result = await window.electronAPI?.globalSearch({
        query: query.trim(),
        accountIds: activeFilters.accountIds,
        folders: activeFilters.folders.length > 0 ? activeFilters.folders : ['*'], // Search all folders by default
        filters: {
          dateFrom: activeFilters.dateFrom,
          dateTo: activeFilters.dateTo,
          unreadOnly: activeFilters.unreadOnly,
          flaggedOnly: activeFilters.flaggedOnly,
          hasAttachments: activeFilters.hasAttachments
        }
      });

      if (result?.success) {
        setSearchResults(result.results || []);
        setSearchStats({
          totalFound: result.totalFound,
          searchedAccounts: result.searchedAccounts,
          query: result.query,
          errors: result.errors
        });
      } else {
        setSearchError(result?.error || 'Suche fehlgeschlagen');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(error.message || 'Suche fehlgeschlagen');
    } finally {
      setIsSearching(false);
    }
  }, [filters]);

  // Update search query with debounced quick search
  const updateSearchQuery = useCallback((query) => {
    setSearchQuery(query);
    debouncedQuickSearch(query);
  }, [debouncedQuickSearch]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      accountIds: [],
      folders: [],
      dateFrom: null,
      dateTo: null,
      unreadOnly: false,
      flaggedOnly: false,
      hasAttachments: false
    });
  }, []);

  // Update individual filter
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const value = {
    // State
    isSearchOpen,
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    suggestions,
    searchStats,
    filters,
    showFilters,
    
    // Actions
    openSearch,
    closeSearch,
    toggleSearch,
    performSearch,
    updateSearchQuery,
    setShowFilters,
    updateFilter,
    resetFilters,
    setSearchResults
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
