import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { Trash2, Mail, MailOpen, RefreshCw, Inbox, Send, FileText, Trash, AlertCircle, Archive, Folder, GripVertical, Shield, CheckSquare, Square, XSquare } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../context/AccountContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { getCurrentFont } from './FontSettings';
import { analyzeEmails, getSpamFilterSettings, TAG_STYLES } from '../utils/SpamFilter';

// v1.11.1: Google Fonts list for email content styling
const GOOGLE_FONTS = {
  'inter': 'Inter',
  'roboto': 'Roboto',
  'opensans': 'Open Sans',
  'lato': 'Lato',
  'montserrat': 'Montserrat',
  'poppins': 'Poppins',
  'sourcesans': 'Source Sans 3',
  'raleway': 'Raleway',
  'ubuntu': 'Ubuntu',
  'nunito': 'Nunito',
  'firacode': 'Fira Code',
  'jetbrains': 'JetBrains Mono'
};

// Folder column width constants (v1.8.1)
const FOLDER_MIN_WIDTH = 150;
const FOLDER_MAX_WIDTH = 350;
const FOLDER_DEFAULT_WIDTH = 192;

// v1.12.2: Email list column width constants (resizable)
const EMAIL_LIST_MIN_WIDTH = 100;
const EMAIL_LIST_MAX_WIDTH = 600;
const EMAIL_LIST_DEFAULT_WIDTH = 350;

// v1.12.0: Preview column width constants (reduced min from 200 to 100)
const PREVIEW_MIN_WIDTH = 100;
const PREVIEW_MAX_WIDTH = 800;
const PREVIEW_DEFAULT_WIDTH = 450;

// Email cache for performance (v1.8.0)
const emailCache = new Map();
const folderCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// v1.8.2: Refresh interval mapping
const REFRESH_INTERVALS = {
  '1': 60000,
  '5': 300000,
  '10': 600000,
  '15': 900000,
  '30': 1800000,
  'manual': 0
};

// v1.8.2: IndexedDB for local email storage
const DB_NAME = 'CoreMailDB';
const DB_VERSION = 1;

const openEmailDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('emails')) {
        const store = db.createObjectStore('emails', { keyPath: 'id' });
        store.createIndex('accountId', 'accountId', { unique: false });
        store.createIndex('folder', 'folder', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

const saveEmailsToIndexedDB = async (accountId, folder, emails) => {
  try {
    const db = await openEmailDB();
    const tx = db.transaction('emails', 'readwrite');
    const store = tx.objectStore('emails');
    
    const id = `${accountId}:${folder}`;
    await store.put({
      id,
      accountId,
      folder,
      emails,
      timestamp: Date.now()
    });
    
    db.close();
  } catch (e) {
    console.error('Failed to save to IndexedDB:', e);
  }
};

const loadEmailsFromIndexedDB = async (accountId, folder) => {
  try {
    const db = await openEmailDB();
    const tx = db.transaction('emails', 'readonly');
    const store = tx.objectStore('emails');
    
    const id = `${accountId}:${folder}`;
    const result = await new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    return result;
  } catch (e) {
    console.error('Failed to load from IndexedDB:', e);
    return null;
  }
};

// v1.12.1: Remove deleted email from IndexedDB to prevent re-fetching
const removeEmailFromIndexedDB = async (accountId, folder, uid) => {
  try {
    const db = await openEmailDB();
    const tx = db.transaction('emails', 'readwrite');
    const store = tx.objectStore('emails');
    
    const id = `${accountId}:${folder}`;
    const result = await new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (result && result.emails) {
      // Filter out the deleted email
      result.emails = result.emails.filter(e => e.uid !== uid);
      result.timestamp = Date.now();
      await store.put(result);
    }
    
    db.close();
  } catch (e) {
    console.error('Failed to remove email from IndexedDB:', e);
  }
};

// v1.14.0: Spam Tag Badge component
const SpamTagBadge = memo(({ category }) => {
  if (!category || category === 'sicher') return null;
  const style = TAG_STYLES[category];
  if (!style) return null;
  
  return (
    <span 
      className={`inline-flex items-center px-1.5 py-0.5 text-xs rounded-full font-medium border ${style.bgColor} ${style.textColor} ${style.borderColor}`}
      title={style.description}
    >
      {style.label}
    </span>
  );
});

// v2.3.0: Improved Email List Item with multi-select checkbox
// v1.14.0: Added spam filter tags
const EmailListItem = memo(({ email, index, isSelected, isChecked, onSelect, onCheckboxChange, onDelete, onToggleRead, c, actionLoading, spamAnalysis, showCheckboxes }) => {
  const isUnread = !email.seen;
  const spamCategory = spamAnalysis?.category;
  const spamTags = spamAnalysis?.tags || [];
  
  // v1.14.0: Border color based on spam category
  const getBorderColor = () => {
    if (spamCategory === 'virus') return 'border-l-red-600';
    if (spamCategory === 'schaedlich') return 'border-l-yellow-500';
    if (spamCategory === 'spam') return 'border-l-red-400';
    if (spamCategory === 'werbung') return 'border-l-orange-400';
    if (isUnread) return 'border-l-blue-500';
    return 'border-l-transparent';
  };
  
  // v2.3.0: Handle checkbox click
  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    onCheckboxChange(email.uid, e.shiftKey);
  };
  
  return (
    <div
      onClick={() => onSelect(index)}
      className={`p-3 cursor-pointer transition-all ${c.border} border-b relative group
        ${isSelected ? c.bgTertiary : isChecked ? 'bg-cyan-500/10' : isUnread ? 'bg-blue-500/5 hover:bg-blue-500/10' : c.hover}
        ${getBorderColor()}
      `}
      style={{ borderLeftWidth: '3px', minHeight: '60px' }}
    >
      <div className="flex items-start justify-between gap-2">
        {/* v2.3.0: Checkbox for multi-select */}
        {showCheckboxes && (
          <div 
            className="flex-shrink-0 mt-0.5"
            onClick={handleCheckboxClick}
          >
            {isChecked ? (
              <CheckSquare className={`w-5 h-5 ${c.accent} cursor-pointer`} />
            ) : (
              <Square className={`w-5 h-5 ${c.textSecondary} hover:${c.accent} cursor-pointer`} />
            )}
          </div>
        )}
        
        <div className="flex-1 min-w-0 overflow-hidden">
          {/* Sender with unread indicator - v1.12.2: text wrapping */}
          <div 
            className={`text-sm flex items-start gap-2 ${isUnread ? `${c.accent} font-semibold` : c.text}`}
            style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
          >
            {isUnread && (
              <span className="inline-flex items-center justify-center w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse mt-1.5" />
            )}
            <span style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>{email.from}</span>
          </div>
          
          {/* Subject - v1.12.2: text wrapping enabled */}
          <div 
            className={`text-sm mt-1 ${isUnread ? `${c.text} font-semibold` : c.text}`}
            style={{ overflowWrap: 'break-word', wordBreak: 'break-word', lineHeight: '1.4' }}
          >
            {email.subject}
          </div>
          
          {/* Preview - v1.12.2: text wrapping enabled */}
          <div 
            className={`text-xs ${c.textSecondary} mt-1`}
            style={{ overflowWrap: 'break-word', wordBreak: 'break-word', lineHeight: '1.3' }}
          >
            {email.preview}
          </div>
          
          {/* Date, unread badge, and spam tags (v1.14.0) */}
          <div className={`text-xs ${c.textSecondary} mt-2 flex items-center gap-2 flex-wrap`}>
            <span>
              {new Date(email.date).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {isUnread && (
              <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full font-medium">
                Neu
              </span>
            )}
            {/* v1.14.0: Spam filter tags */}
            {spamCategory && spamCategory !== 'sicher' && (
              <SpamTagBadge category={spamCategory} />
            )}
          </div>
        </div>
        
        {/* Quick Actions (visible on hover) */}
        <div className={`flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleRead(email.uid, email.seen); }}
            className={`p-1.5 ${c.hover} rounded transition-colors ${c.textSecondary} hover:${c.text}`}
            title={email.seen ? 'Als ungelesen markieren' : 'Als gelesen markieren'}
          >
            {actionLoading === `read-${email.uid}` ? (
              <span className="animate-spin text-xs">⏳</span>
            ) : email.seen ? (
              <Mail className="w-4 h-4" />
            ) : (
              <MailOpen className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(email.uid); }}
            className={`p-1.5 ${c.hover} rounded transition-colors text-red-400 hover:text-red-300 hover:bg-red-900/20`}
            title="Löschen"
          >
            {actionLoading === `delete-${email.uid}` ? (
              <span className="animate-spin text-xs">⏳</span>
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

// Folder icon helper
const getFolderIcon = (type) => {
  switch (type) {
    case 'inbox': return <Inbox className="w-4 h-4" />;
    case 'sent': return <Send className="w-4 h-4" />;
    case 'drafts': return <FileText className="w-4 h-4" />;
    case 'trash': return <Trash className="w-4 h-4" />;
    case 'spam': return <AlertCircle className="w-4 h-4" />;
    case 'archive': return <Archive className="w-4 h-4" />;
    default: return <Folder className="w-4 h-4" />;
  }
};

function InboxSplitView({ onFullView }) {
  const { currentTheme } = useTheme();
  const { activeAccountId, getActiveAccount, updateAccountStats } = useAccounts();
  const [emails, setEmails] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState('INBOX');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const c = currentTheme.colors;
  
  // v2.3.0: Multi-Select State
  const [selectedUids, setSelectedUids] = useState(new Set());
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [lastClickedIndex, setLastClickedIndex] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  // Resizable folder column (v1.8.1)
  const [folderWidth, setFolderWidth] = useState(() => {
    const saved = localStorage.getItem('inbox.folderColumnWidth');
    return saved ? parseInt(saved, 10) : FOLDER_DEFAULT_WIDTH;
  });
  const [isResizingFolder, setIsResizingFolder] = useState(false);
  
  // v1.12.2: Resizable email list column
  const [emailListWidth, setEmailListWidth] = useState(() => {
    const saved = localStorage.getItem('inbox.emailListColumnWidth');
    return saved ? parseInt(saved, 10) : EMAIL_LIST_DEFAULT_WIDTH;
  });
  const [isResizingEmailList, setIsResizingEmailList] = useState(false);
  
  // v1.11.0: Resizable preview column
  const [previewWidth, setPreviewWidth] = useState(() => {
    const saved = localStorage.getItem('inbox.previewColumnWidth');
    return saved ? parseInt(saved, 10) : PREVIEW_DEFAULT_WIDTH;
  });
  const [isResizingPreview, setIsResizingPreview] = useState(false);
  
  // Handle column resize (v1.12.2: added email list resizing)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingFolder) {
        const newWidth = Math.max(FOLDER_MIN_WIDTH, Math.min(FOLDER_MAX_WIDTH, e.clientX - 60));
        setFolderWidth(newWidth);
      }
      if (isResizingEmailList) {
        // Calculate email list width from left edge of email list column
        const emailListStart = 60 + folderWidth; // sidebar + folder column
        const newWidth = Math.max(EMAIL_LIST_MIN_WIDTH, Math.min(EMAIL_LIST_MAX_WIDTH, e.clientX - emailListStart));
        setEmailListWidth(newWidth);
      }
      if (isResizingPreview) {
        // Calculate from right side
        const newWidth = Math.max(PREVIEW_MIN_WIDTH, Math.min(PREVIEW_MAX_WIDTH, window.innerWidth - e.clientX));
        setPreviewWidth(newWidth);
      }
    };
    
    const handleMouseUp = () => {
      if (isResizingFolder) {
        setIsResizingFolder(false);
        localStorage.setItem('inbox.folderColumnWidth', folderWidth.toString());
      }
      if (isResizingEmailList) {
        setIsResizingEmailList(false);
        localStorage.setItem('inbox.emailListColumnWidth', emailListWidth.toString());
      }
      if (isResizingPreview) {
        setIsResizingPreview(false);
        localStorage.setItem('inbox.previewColumnWidth', previewWidth.toString());
      }
    };
    
    if (isResizingFolder || isResizingEmailList || isResizingPreview) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingFolder, isResizingEmailList, isResizingPreview, folderWidth, emailListWidth, previewWidth]);

  // Generate cache key
  const getCacheKey = useCallback((accountId, folder) => `${accountId}:${folder}`, []);

  // Load folders for account
  const loadFolders = useCallback(async () => {
    if (!window.electronAPI || !activeAccountId) return;
    
    // Check cache first
    const cacheKey = `folders:${activeAccountId}`;
    const cached = folderCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setFolders(cached.data);
      return;
    }
    
    setLoadingFolders(true);
    try {
      const result = await window.electronAPI.listFolders(activeAccountId);
      if (result.success) {
        setFolders(result.folders);
        folderCache.set(cacheKey, { data: result.folders, timestamp: Date.now() });
      }
    } catch (err) {
      console.error('Error loading folders:', err);
    }
    setLoadingFolders(false);
  }, [activeAccountId]);

  // v1.8.2: Fetch emails with caching and IndexedDB (stale-while-revalidate)
  const fetchEmails = useCallback(async (useCache = true) => {
    if (!window.electronAPI || !activeAccountId) {
      setLoading(false);
      return;
    }

    const cacheKey = getCacheKey(activeAccountId, currentFolder);
    const localStorageEnabled = localStorage.getItem('emailSettings.localStorageEnabled') !== 'false';
    
    // Check memory cache first
    if (useCache) {
      const cached = emailCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setEmails(cached.data);
        setHasMore(cached.hasMore);
        setLoading(false);
        if (cached.data.length > 0) {
          loadEmailPreview(cached.data[0].uid);
        }
        return;
      }
    }

    // v1.8.2: Try IndexedDB first (stale-while-revalidate)
    if (localStorageEnabled && useCache) {
      const localData = await loadEmailsFromIndexedDB(activeAccountId, currentFolder);
      if (localData && localData.emails?.length > 0) {
        // Show cached data immediately
        setEmails(localData.emails);
        setLoading(false);
        if (localData.emails.length > 0) {
          loadEmailPreview(localData.emails[0].uid);
        }
        // Continue to fetch fresh data in background
      }
    }

    setError(null);
    if (!localStorageEnabled || !useCache) {
      setLoading(true);
    }

    try {
      let result;
      if (currentFolder === 'INBOX') {
        result = await window.electronAPI.fetchEmailsForAccount(activeAccountId, { limit: 50 });
      } else {
        result = await window.electronAPI.fetchEmailsFromFolder(activeAccountId, currentFolder, { limit: 50 });
      }
      
      if (result.success) {
        setEmails(result.emails);
        setHasMore(result.hasMore || false);
        
        // Update memory cache
        emailCache.set(cacheKey, { 
          data: result.emails, 
          hasMore: result.hasMore,
          timestamp: Date.now() 
        });
        
        // v1.8.2: Save to IndexedDB for offline access
        if (localStorageEnabled) {
          saveEmailsToIndexedDB(activeAccountId, currentFolder, result.emails);
        }
        
        if (result.emails.length > 0) {
          loadEmailPreview(result.emails[0].uid);
        } else {
          setSelectedEmail(null);
        }
      } else {
        setError(result.error);
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [activeAccountId, currentFolder, getCacheKey]);

  // Load more emails (pagination)
  const loadMoreEmails = useCallback(async () => {
    if (!window.electronAPI || !activeAccountId || loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      let result;
      if (currentFolder === 'INBOX') {
        result = await window.electronAPI.fetchEmailsForAccount(activeAccountId, { 
          limit: 50, 
          offset: emails.length 
        });
      } else {
        result = await window.electronAPI.fetchEmailsFromFolder(activeAccountId, currentFolder, { 
          limit: 50, 
          offset: emails.length 
        });
      }
      
      if (result.success) {
        const newEmails = [...emails, ...result.emails];
        setEmails(newEmails);
        setHasMore(result.hasMore || false);
        
        // Update cache
        const cacheKey = getCacheKey(activeAccountId, currentFolder);
        emailCache.set(cacheKey, { 
          data: newEmails, 
          hasMore: result.hasMore,
          timestamp: Date.now() 
        });
      }
    } catch (e) {
      console.error('Error loading more emails:', e);
    }
    setLoadingMore(false);
  }, [activeAccountId, currentFolder, emails, hasMore, loadingMore, getCacheKey]);

  // Initial load
  useEffect(() => {
    setCurrentFolder('INBOX');
    setSelectedIndex(0);
    setSelectedEmail(null);
    loadFolders();
    fetchEmails(true);
  }, [activeAccountId]);

  // Load emails when folder changes
  useEffect(() => {
    setSelectedIndex(0);
    setSelectedEmail(null);
    fetchEmails(true);
  }, [currentFolder, fetchEmails]);

  // v1.8.2: Auto-refresh interval
  useEffect(() => {
    const getRefreshInterval = () => {
      const saved = localStorage.getItem('emailSettings.refreshInterval') || '5';
      return REFRESH_INTERVALS[saved] || 0;
    };

    let intervalId = null;
    const setupInterval = () => {
      const interval = getRefreshInterval();
      if (interval > 0 && activeAccountId) {
        intervalId = setInterval(() => {
          console.log('[AutoRefresh] Fetching emails...');
          fetchEmails(false); // Force refresh, don't use cache
        }, interval);
      }
    };

    setupInterval();

    // Listen for settings changes
    const handleSettingsChange = (e) => {
      if (e.detail?.refreshInterval) {
        if (intervalId) clearInterval(intervalId);
        setupInterval();
      }
    };
    window.addEventListener('emailSettingsChanged', handleSettingsChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener('emailSettingsChanged', handleSettingsChange);
    };
  }, [activeAccountId, fetchEmails]);

  const loadEmailPreview = async (uid) => {
    if (!window.electronAPI || !activeAccountId) return;
    
    setLoadingPreview(true);
    try {
      const result = await window.electronAPI.fetchEmailForAccount(activeAccountId, uid);
      if (result.success) {
        setSelectedEmail(result.email);
      }
    } catch (e) {
      console.error('Error loading email preview', e);
    }
    setLoadingPreview(false);
  };

  const handleSelectEmail = (index) => {
    setSelectedIndex(index);
    if (emails[index]) {
      loadEmailPreview(emails[index].uid);
      
      // Auto-mark as read based on settings (v1.8.1)
      const markMode = localStorage.getItem('emailSettings.markAsReadMode') || 'onClick';
      if (markMode === 'onClick' && !emails[index].seen) {
        handleToggleRead(emails[index].uid, false);
      }
    }
  };

  // Email Actions
  // v1.12.1: Fixed - now also removes from IndexedDB to prevent deleted emails from reappearing
  const handleDelete = useCallback(async (uid) => {
    if (!window.electronAPI || !activeAccountId) return;
    
    setActionLoading(`delete-${uid}`);
    try {
      const result = await window.electronAPI.deleteEmail(activeAccountId, uid, currentFolder);
      if (result.success) {
        // Remove from local state and cache
        const newEmails = emails.filter(e => e.uid !== uid);
        setEmails(newEmails);
        
        // Update memory cache
        const cacheKey = getCacheKey(activeAccountId, currentFolder);
        emailCache.set(cacheKey, { data: newEmails, hasMore, timestamp: Date.now() });
        
        // v1.12.1: Also remove from IndexedDB to prevent re-fetching
        await removeEmailFromIndexedDB(activeAccountId, currentFolder, uid);
        
        // Select next email
        if (selectedIndex >= newEmails.length) {
          setSelectedIndex(Math.max(0, newEmails.length - 1));
        }
        if (newEmails.length > 0 && newEmails[selectedIndex]) {
          loadEmailPreview(newEmails[selectedIndex].uid);
        } else {
          setSelectedEmail(null);
        }
      } else {
        alert('Fehler beim Löschen: ' + result.error);
      }
    } catch (err) {
      alert('Fehler: ' + err.message);
    }
    setActionLoading(null);
  }, [activeAccountId, currentFolder, emails, selectedIndex, hasMore, getCacheKey]);

  const handleToggleRead = useCallback(async (uid, currentSeen) => {
    if (!window.electronAPI || !activeAccountId) return;
    
    setActionLoading(`read-${uid}`);
    try {
      const result = await window.electronAPI.markAsRead(activeAccountId, uid, !currentSeen, currentFolder);
      if (result.success) {
        // Update local state
        const newEmails = emails.map(e => 
          e.uid === uid ? { ...e, seen: !currentSeen } : e
        );
        setEmails(newEmails);
        
        // Update cache
        const cacheKey = getCacheKey(activeAccountId, currentFolder);
        emailCache.set(cacheKey, { data: newEmails, hasMore, timestamp: Date.now() });
        
        // Update selected email if needed
        if (selectedEmail?.uid === uid) {
          setSelectedEmail({ ...selectedEmail, seen: !currentSeen });
        }
      }
    } catch (err) {
      console.error('Error toggling read status:', err);
    }
    setActionLoading(null);
  }, [activeAccountId, currentFolder, emails, selectedEmail, hasMore, getCacheKey]);

  // v2.3.0: Multi-Select Handlers
  const handleCheckboxChange = useCallback((uid, shiftKey) => {
    setSelectedUids(prev => {
      const newSet = new Set(prev);
      
      if (shiftKey && lastClickedIndex !== null) {
        // Shift+Click: Select range
        const clickedIndex = emails.findIndex(e => e.uid === uid);
        const start = Math.min(lastClickedIndex, clickedIndex);
        const end = Math.max(lastClickedIndex, clickedIndex);
        
        for (let i = start; i <= end; i++) {
          newSet.add(emails[i].uid);
        }
      } else {
        // Normal click: Toggle single
        if (newSet.has(uid)) {
          newSet.delete(uid);
        } else {
          newSet.add(uid);
        }
      }
      
      return newSet;
    });
    
    // Track last clicked index for shift-select
    const clickedIndex = emails.findIndex(e => e.uid === uid);
    setLastClickedIndex(clickedIndex);
  }, [emails, lastClickedIndex]);

  const handleSelectAll = useCallback(() => {
    if (selectedUids.size === emails.length) {
      // Deselect all
      setSelectedUids(new Set());
    } else {
      // Select all
      setSelectedUids(new Set(emails.map(e => e.uid)));
    }
  }, [emails, selectedUids]);

  const handleClearSelection = useCallback(() => {
    setSelectedUids(new Set());
    setShowCheckboxes(false);
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (!window.electronAPI || !activeAccountId || selectedUids.size === 0) return;
    
    setBulkDeleting(true);
    const uidsToDelete = Array.from(selectedUids);
    let deletedCount = 0;
    
    try {
      for (const uid of uidsToDelete) {
        const result = await window.electronAPI.deleteEmail(activeAccountId, uid, currentFolder);
        if (result.success) {
          deletedCount++;
          // Remove from IndexedDB
          await removeEmailFromIndexedDB(activeAccountId, currentFolder, uid);
        }
      }
      
      // Update local state
      const newEmails = emails.filter(e => !selectedUids.has(e.uid));
      setEmails(newEmails);
      
      // Update cache
      const cacheKey = getCacheKey(activeAccountId, currentFolder);
      emailCache.set(cacheKey, { data: newEmails, hasMore, timestamp: Date.now() });
      
      // Clear selection
      setSelectedUids(new Set());
      setShowDeleteConfirm(false);
      
      // Select next email
      if (newEmails.length > 0) {
        const newIndex = Math.min(selectedIndex, newEmails.length - 1);
        setSelectedIndex(newIndex);
        loadEmailPreview(newEmails[newIndex].uid);
      } else {
        setSelectedEmail(null);
      }
      
      console.log(`[BulkDelete] Deleted ${deletedCount}/${uidsToDelete.length} emails`);
    } catch (err) {
      console.error('Bulk delete error:', err);
      alert('Fehler beim Löschen einiger E-Mails: ' + err.message);
    }
    
    setBulkDeleting(false);
  }, [activeAccountId, currentFolder, emails, selectedUids, hasMore, getCacheKey, selectedIndex]);

  // Keyboard navigation (v2.3.0: added Ctrl+A for select all)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+A or Cmd+A: Select all emails
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && emails.length > 0) {
        e.preventDefault();
        setShowCheckboxes(true);
        handleSelectAll();
        return;
      }
      
      // Escape: Clear selection
      if (e.key === 'Escape' && selectedUids.size > 0) {
        handleClearSelection();
        return;
      }
      
      // Delete: Delete selected emails or current email
      if (e.key === 'Delete') {
        if (selectedUids.size > 0) {
          setShowDeleteConfirm(true);
        } else if (emails[selectedIndex]) {
          handleDelete(emails[selectedIndex].uid);
        }
        return;
      }
      
      if (e.key === 'ArrowDown' && selectedIndex < emails.length - 1) {
        handleSelectEmail(selectedIndex + 1);
      } else if (e.key === 'ArrowUp' && selectedIndex > 0) {
        handleSelectEmail(selectedIndex - 1);
      } else if (e.key === 'Enter' && selectedEmail) {
        onFullView(selectedEmail, currentFolder);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, emails, selectedEmail, onFullView, currentFolder, handleDelete, handleSelectAll, handleClearSelection, selectedUids]);

  // Scroll handler for infinite loading
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop - clientHeight < 200 && hasMore && !loadingMore) {
      loadMoreEmails();
    }
  }, [hasMore, loadingMore, loadMoreEmails]);

  const account = getActiveAccount();

  // v1.11.1: Sort folders with INBOX first, then standard folders, then alphabetically
  const sortedFolders = useMemo(() => {
    // Priority order for standard folders
    const folderPriority = {
      'inbox': 1,
      'sent': 2,
      'drafts': 3,
      'trash': 4,
      'spam': 5,
      'archive': 6
    };
    
    const getSortPriority = (folder) => {
      // Check folder type first
      if (folder.type && folderPriority[folder.type]) {
        return folderPriority[folder.type];
      }
      // Check folder name/path
      const lowerName = (folder.name || folder.path || '').toLowerCase();
      if (lowerName === 'inbox' || lowerName === 'posteingang') return 1;
      if (lowerName.includes('sent') || lowerName.includes('gesendet')) return 2;
      if (lowerName.includes('draft') || lowerName.includes('entwürfe') || lowerName.includes('entwurf')) return 3;
      if (lowerName.includes('trash') || lowerName.includes('papierkorb') || lowerName.includes('gelöscht')) return 4;
      if (lowerName.includes('spam') || lowerName.includes('junk')) return 5;
      if (lowerName.includes('archiv') || lowerName.includes('archive')) return 6;
      return 100; // Other folders
    };
    
    const sortFolderList = (folderList) => {
      return [...folderList].sort((a, b) => {
        const priorityA = getSortPriority(a);
        const priorityB = getSortPriority(b);
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        // Alphabetical for same priority
        return (a.name || a.path || '').localeCompare(b.name || b.path || '', 'de');
      }).map(folder => ({
        ...folder,
        children: folder.children?.length > 0 ? sortFolderList(folder.children) : folder.children
      }));
    };
    
    return sortFolderList(folders);
  }, [folders]);

  // Flat folder list for display (using sorted folders)
  const flatFolders = useMemo(() => {
    const flat = [];
    const flatten = (folderList, depth = 0) => {
      folderList.forEach(folder => {
        flat.push({ ...folder, depth });
        if (folder.children?.length > 0) {
          flatten(folder.children, depth + 1);
        }
      });
    };
    flatten(sortedFolders);
    return flat;
  }, [sortedFolders]);

  // v1.14.0: Spam filter analysis results
  const [spamResults, setSpamResults] = useState(new Map());
  
  // v1.14.0: Run spam analysis when emails change
  useEffect(() => {
    const settings = getSpamFilterSettings();
    if (!settings.enabled || emails.length === 0) {
      setSpamResults(new Map());
      return;
    }
    
    // Run analysis asynchronously to avoid blocking
    const runAnalysis = async () => {
      const results = analyzeEmails(emails, settings);
      setSpamResults(results);
    };
    runAnalysis();
  }, [emails]);

  // v1.11.0: Count unread emails
  const unreadCount = useMemo(() => {
    return emails.filter(e => !e.seen).length;
  }, [emails]);

  // v1.11.1: Update account stats when emails are loaded (for sidebar unread badge)
  useEffect(() => {
    if (activeAccountId && currentFolder === 'INBOX' && emails.length > 0) {
      const unread = emails.filter(e => !e.seen).length;
      updateAccountStats(activeAccountId, {
        unread,
        total: emails.length,
        lastUpdated: Date.now()
      });
    }
  }, [activeAccountId, currentFolder, emails, updateAccountStats]);

  if (!activeAccountId) {
    return (
      <div className={`flex-1 flex items-center justify-center ${c.bg}`}>
        <div className={`text-center ${c.textSecondary}`}>
          <div className="text-5xl mb-4">📧</div>
          <p>Wähle ein Konto aus der Sidebar</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${c.bg}`}>
        <LoadingSpinner message="E-Mails werden geladen..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex-1 flex items-center justify-center ${c.bg}`}>
        <div className="text-center">
          <div className="text-red-400 text-5xl mb-4">⚠️</div>
          <p className="text-red-400">{error}</p>
          <button onClick={() => fetchEmails(false)} className={`mt-4 px-4 py-2 ${c.accentBg} text-white rounded-lg`}>
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex overflow-hidden ${c.bg}`}>
      {/* Folder List - Resizable (v1.8.1) */}
      <div 
        className={`${c.bgSecondary} ${c.border} border-r flex flex-col overflow-hidden relative`}
        style={{ width: `${folderWidth}px`, minWidth: `${FOLDER_MIN_WIDTH}px`, maxWidth: `${FOLDER_MAX_WIDTH}px` }}
      >
        <div className={`p-3 ${c.border} border-b flex items-center justify-between`}>
          <h3 className={`font-medium ${c.text} text-sm`}>Ordner</h3>
          {loadingFolders && <RefreshCw className={`w-4 h-4 ${c.textSecondary} animate-spin`} />}
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {flatFolders.map(folder => (
            <button
              key={folder.path}
              onClick={() => setCurrentFolder(folder.path)}
              className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm transition-colors ${
                currentFolder === folder.path
                  ? `${c.accentBg} text-white`
                  : `${c.textSecondary} ${c.hover}`
              }`}
              style={{ paddingLeft: `${(folder.depth * 12) + 12}px` }}
            >
              {getFolderIcon(folder.type)}
              <span className="truncate flex-1">{folder.name}</span>
              {/* v1.11.0: Show unread count badge for inbox */}
              {folder.path === 'INBOX' && unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full font-medium min-w-[20px] text-center">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
          
          {flatFolders.length === 0 && !loadingFolders && (
            <div className={`px-3 py-2 text-sm ${c.textSecondary}`}>
              <button
                onClick={() => setCurrentFolder('INBOX')}
                className={`w-full text-left flex items-center gap-2 py-2 ${
                  currentFolder === 'INBOX' ? c.accent : ''
                }`}
              >
                <Inbox className="w-4 h-4" />
                Posteingang
                {unreadCount > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
        
        {/* Resize Handle */}
        <div
          onMouseDown={() => setIsResizingFolder(true)}
          className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-500/50 transition-colors ${isResizingFolder ? 'bg-cyan-500' : ''}`}
          title="Ziehen zum Ändern der Breite"
        />
      </div>

      {/* Email List - v1.12.2: Resizable, v2.3.0: Multi-Select */}
      <div 
        className={`${c.bgSecondary} ${c.border} border-r flex flex-col overflow-hidden relative`} 
        style={{ width: `${emailListWidth}px`, minWidth: `${EMAIL_LIST_MIN_WIDTH}px`, maxWidth: `${EMAIL_LIST_MAX_WIDTH}px` }}
      >
        <div className={`p-4 ${c.border} border-b`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`font-semibold ${c.text}`}>{account?.name || 'Posteingang'}</h2>
              <p className={`text-sm ${c.textSecondary}`}>
                {emails.length} E-Mails {currentFolder !== 'INBOX' && `in ${currentFolder}`}
                {unreadCount > 0 && (
                  <span className="ml-2 text-blue-400">({unreadCount} ungelesen)</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {/* v2.3.0: Toggle Multi-Select */}
              <button
                onClick={() => {
                  setShowCheckboxes(!showCheckboxes);
                  if (showCheckboxes) setSelectedUids(new Set());
                }}
                className={`p-2 ${showCheckboxes ? c.accentBg + ' text-white' : c.hover} rounded-lg transition-colors ${c.textSecondary}`}
                title="Mehrfachauswahl"
              >
                <CheckSquare className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchEmails(false)}
                className={`p-2 ${c.hover} rounded-lg transition-colors ${c.textSecondary}`}
                title="Aktualisieren"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* v2.3.0: Multi-Select Controls */}
          {showCheckboxes && (
            <div className={`mt-3 pt-3 ${c.border} border-t flex items-center justify-between gap-2`}>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className={`px-3 py-1.5 text-xs ${c.hover} rounded-lg transition-colors ${c.textSecondary} flex items-center gap-1.5`}
                >
                  {selectedUids.size === emails.length ? (
                    <>
                      <XSquare className="w-4 h-4" />
                      Keine
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-4 h-4" />
                      Alle
                    </>
                  )}
                </button>
                {selectedUids.size > 0 && (
                  <span className={`text-xs ${c.accent}`}>
                    {selectedUids.size} ausgewählt
                  </span>
                )}
              </div>
              
              {selectedUids.size > 0 && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  Löschen ({selectedUids.size})
                </button>
              )}
            </div>
          )}
        </div>
        <div 
          className="flex-1 overflow-y-auto"
          onScroll={handleScroll}
        >
          {emails.length === 0 ? (
            <div className={`p-8 text-center ${c.textSecondary}`}>
              Keine E-Mails
            </div>
          ) : (
            <>
              {emails.map((email, index) => (
                <EmailListItem
                  key={email.uid}
                  email={email}
                  index={index}
                  isSelected={index === selectedIndex}
                  isChecked={selectedUids.has(email.uid)}
                  onSelect={handleSelectEmail}
                  onCheckboxChange={handleCheckboxChange}
                  onDelete={handleDelete}
                  onToggleRead={handleToggleRead}
                  c={c}
                  actionLoading={actionLoading}
                  spamAnalysis={spamResults.get(email.uid)}
                  showCheckboxes={showCheckboxes}
                />
              ))}
              {loadingMore && (
                <div className={`p-4 text-center ${c.textSecondary}`}>
                  <LoadingSpinner size="small" message="Lade mehr..." />
                </div>
              )}
              {hasMore && !loadingMore && (
                <button
                  onClick={loadMoreEmails}
                  className={`w-full p-3 text-sm ${c.accent} ${c.hover} transition-colors`}
                >
                  Mehr laden...
                </button>
              )}
            </>
          )}
        </div>
        
        {/* v1.12.2: Resize Handle for email list column */}
        <div
          onMouseDown={() => setIsResizingEmailList(true)}
          className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-500/50 transition-colors z-10 ${isResizingEmailList ? 'bg-cyan-500' : ''}`}
          title="Ziehen zum Ändern der Mail-Liste-Breite"
        >
          <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-5 h-10 flex items-center justify-center">
            <GripVertical className={`w-4 h-4 ${c.textSecondary} opacity-50`} />
          </div>
        </div>
      </div>

      {/* Email Preview - v1.12.2: Takes remaining space */}
      <div 
        className={`flex-1 flex flex-col overflow-hidden ${c.bg}`}
        style={{ minWidth: `${PREVIEW_MIN_WIDTH}px` }}
      >
        {loadingPreview ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : selectedEmail ? (
          <>
            {/* v1.14.0: Spam warning banner */}
            {(() => {
              const analysis = spamResults.get(selectedEmail.uid || emails[selectedIndex]?.uid);
              if (!analysis || analysis.category === 'sicher') return null;
              const style = TAG_STYLES[analysis.category];
              if (!style) return null;
              
              return (
                <div className={`px-4 py-3 ${style.bgColor} border-b ${style.borderColor} border flex items-center gap-3`}>
                  <Shield className={`w-5 h-5 ${style.textColor} flex-shrink-0`} />
                  <div className="flex-1">
                    <div className={`font-medium text-sm ${style.textColor}`}>
                      {style.label} — {style.description}
                    </div>
                    {analysis.reasons?.length > 0 && (
                      <div className={`text-xs ${style.textColor} opacity-75 mt-0.5`}>
                        {analysis.reasons.slice(0, 3).join(' • ')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
            <div className={`p-4 ${c.bgSecondary} ${c.border} border-b`}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className={`text-xl font-semibold ${c.text} mb-2`}>
                    {selectedEmail.subject}
                  </h2>
                  <p className={`${c.textSecondary} text-sm`}>Von: {selectedEmail.from}</p>
                  <p className={`${c.textSecondary} text-sm`}>An: {selectedEmail.to}</p>
                  <p className={`${c.textSecondary} text-xs mt-1`}>
                    {new Date(selectedEmail.date).toLocaleString('de-DE')}
                  </p>
                </div>
                <button
                  onClick={() => onFullView(selectedEmail, currentFolder)}
                  className={`px-4 py-2 ${c.accentBg} ${c.accentHover} text-white rounded-lg text-sm transition-colors`}
                >
                  Vollansicht →
                </button>
              </div>
            </div>
            <div className={`flex-1 overflow-auto p-6 ${c.bg}`}>
              {/* v1.11.1: Apply selected font to email content */}
              {(() => {
                const fontId = getCurrentFont();
                const fontFamily = GOOGLE_FONTS[fontId] || 'Inter';
                const fontStyle = `"${fontFamily}", system-ui, -apple-system, sans-serif`;
                
                return selectedEmail.html ? (
                  <div
                    className="email-content"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                    style={{ 
                      backgroundColor: 'white', 
                      color: 'black', 
                      padding: '16px', 
                      borderRadius: '8px',
                      minHeight: '200px',
                      fontFamily: fontStyle
                    }}
                  />
                ) : (
                  <pre className={`${c.text} whitespace-pre-wrap`} style={{ fontFamily: fontStyle }}>
                    {selectedEmail.text}
                  </pre>
                );
              })()}
              {selectedEmail.attachments?.length > 0 && (
                <div className={`mt-6 pt-4 ${c.border} border-t`}>
                  <h4 className={`font-medium ${c.text} mb-2`}>Anhänge ({selectedEmail.attachments.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmail.attachments.map((att, i) => (
                      <div key={i} className={`px-3 py-2 ${c.bgTertiary} ${c.border} border rounded-lg text-sm ${c.text}`}>
                        📎 {att.filename}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={`flex-1 flex items-center justify-center ${c.textSecondary}`}>
            Wähle eine E-Mail aus
          </div>
        )}
      </div>
      
      {/* v2.3.0: Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${c.bgSecondary} ${c.border} border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/20 rounded-full">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${c.text}`}>E-Mails löschen?</h3>
                <p className={`text-sm ${c.textSecondary}`}>
                  {selectedUids.size} E-Mail{selectedUids.size > 1 ? 's' : ''} werden gelöscht
                </p>
              </div>
            </div>
            
            <p className={`text-sm ${c.textSecondary} mb-6`}>
              Diese Aktion kann nicht rückgängig gemacht werden. Die E-Mails werden in den Papierkorb verschoben.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`px-4 py-2 ${c.hover} ${c.border} border rounded-lg transition-colors ${c.text}`}
                disabled={bulkDeleting}
              >
                Abbrechen
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {bulkDeleting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Lösche...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Löschen
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InboxSplitView;
