import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { Trash2, Mail, MailOpen, RefreshCw, Inbox, Send, FileText, Trash, AlertCircle, Archive, Folder, GripVertical, Shield, CheckSquare, Square, XSquare, ChevronDown, ChevronRight, Megaphone, Ban, ShieldAlert, Bug, Tag, X, CheckCircle, Reply, ReplyAll } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../context/AccountContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { getCurrentFont } from './FontSettings';
import { analyzeEmails, getSpamFilterSettings, TAG_STYLES } from '../utils/SpamFilter';
import SenderCategoryManager from '../services/SenderCategoryManager';

// v2.4.0: Virtual Inbox Subfolders for automatic categorization
const INBOX_SUBFOLDERS = [
  { id: 'werbung', name: 'Werbung', icon: Megaphone, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  { id: 'spam', name: 'Spam', icon: Ban, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  { id: 'schaedlich', name: 'Schädlich', icon: ShieldAlert, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  { id: 'virus', name: 'Virus', icon: Bug, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  { id: 'whitelist', name: 'Vertrauenswürdig', icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/20' },
];

// v2.6.0: Category definitions for manual categorization
const MANUAL_CATEGORIES = [
  { id: 'whitelist', name: 'Vertrauenswürdig', icon: '✅', color: '#10B981', bgClass: 'bg-green-500', hoverClass: 'hover:bg-green-600' },
  { id: 'werbung', name: 'Werbung', icon: '📢', color: '#F59E0B', bgClass: 'bg-orange-500', hoverClass: 'hover:bg-orange-600' },
  { id: 'spam', name: 'Spam', icon: '🚫', color: '#EF4444', bgClass: 'bg-red-500', hoverClass: 'hover:bg-red-600' },
  { id: 'schaedlich', name: 'Schädlich', icon: '⚠️', color: '#EAB308', bgClass: 'bg-yellow-500', hoverClass: 'hover:bg-yellow-600' },
  { id: 'virus', name: 'Virus', icon: '🦠', color: '#7C3AED', bgClass: 'bg-purple-500', hoverClass: 'hover:bg-purple-600' },
];

// v2.6.0: Category Buttons Component for manual email categorization
const CategoryButtons = memo(({ email, currentCategory, onCategorize, c }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const senderEmail = SenderCategoryManager.extractEmail(email?.from);
  const senderCategory = SenderCategoryManager.getSenderCategory(email?.from);
  
  return (
    <div className={`px-4 py-3 ${c.bgSecondary} ${c.border} border-t flex items-center gap-3 flex-wrap`}>
      <div className="flex items-center gap-2">
        <Tag className={`w-4 h-4 ${c.textSecondary}`} />
        <span className={`text-sm font-medium ${c.text}`}>Als markieren:</span>
      </div>
      
      <div className="flex items-center gap-2 flex-wrap">
        {MANUAL_CATEGORIES.map(cat => {
          const isActive = currentCategory === cat.id || senderCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategorize(email, cat.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
                isActive 
                  ? `${cat.bgClass} text-white shadow-lg scale-105` 
                  : `bg-transparent border-2 ${c.text} ${cat.hoverClass} hover:text-white`
              }`}
              style={{ borderColor: isActive ? 'transparent' : cat.color }}
              title={`Als ${cat.name} markieren`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              {isActive && <span className="ml-1">✓</span>}
            </button>
          );
        })}
        
        {/* Remove category button */}
        {(currentCategory || senderCategory) && (
          <button
            onClick={() => onCategorize(email, null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all border-2 ${c.border} ${c.textSecondary} ${c.hover}`}
            title="Kategorie entfernen"
          >
            <X className="w-4 h-4" />
            <span>Entfernen</span>
          </button>
        )}
      </div>
      
      {/* Sender info */}
      {senderCategory && (
        <div className={`text-xs ${c.textSecondary} ml-auto flex items-center gap-1`}>
          <span>Absender gemerkt:</span>
          <span className={`px-2 py-0.5 rounded-full ${
            INBOX_SUBFOLDERS.find(f => f.id === senderCategory)?.bgColor || 'bg-gray-500/20'
          } ${
            INBOX_SUBFOLDERS.find(f => f.id === senderCategory)?.color || 'text-gray-400'
          }`}>
            {MANUAL_CATEGORIES.find(c => c.id === senderCategory)?.name || senderCategory}
          </span>
        </div>
      )}
    </div>
  );
});

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
const EmailListItem = memo(({ email, index, isSelected, isChecked, onSelect, onCheckboxChange, onDelete, onToggleRead, c, actionLoading, spamAnalysis, showCheckboxes, isSentFolder }) => {
  const isUnread = !email.seen;
  const spamCategory = spamAnalysis?.category;
  const spamTags = spamAnalysis?.tags || [];
  const displayAddress = isSentFolder ? (email.to || email.from) : email.from;
  
  // v1.14.0: Border color based on spam category
  const getBorderColor = () => {
    if (spamCategory === 'virus') return 'border-l-red-600';
    if (spamCategory === 'schaedlich') return 'border-l-yellow-500';
    if (spamCategory === 'spam') return 'border-l-red-400';
    if (spamCategory === 'werbung') return 'border-l-orange-400';
    if (spamCategory === 'whitelist') return 'border-l-green-500';
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
      className={`p-3 cursor-pointer transition-colors ${c.border} border-b relative group
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
            className={`text-sm flex items-start gap-2 font-medium ${isUnread ? c.accent : c.text}`}
            style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
          >
            <span className={`inline-flex items-center justify-center w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse mt-1.5 ${isUnread ? '' : 'invisible'}`} />
            {isSentFolder && <span className={`text-xs ${c.textSecondary} flex-shrink-0`}>An:</span>}
            <span style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>{displayAddress}</span>
          </div>

          {/* Subject - v1.12.2: text wrapping enabled */}
          <div
            className={`text-sm mt-1 font-medium ${isUnread ? c.text : c.textSecondary}`}
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
            <span className={`px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full font-medium ${isUnread ? '' : 'invisible'}`}>
              Neu
            </span>
            {/* v1.14.0: Spam filter tags */}
            {spamCategory && spamCategory !== 'sicher' && spamCategory !== 'whitelist' && (
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

function InboxSplitView({ onFullView, onNavigate }) {
  const { currentTheme } = useTheme();
  const { activeAccountId, getActiveAccount, accounts, updateAccountStats } = useAccounts();
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
  const [bgLoadOffset, setBgLoadOffset] = useState(50);
  const [loadingMore, setLoadingMore] = useState(false);
  // Abort signal for background batch loading — set to true when account/folder changes
  const bgLoadAbortRef = useRef(false);
  const c = currentTheme.colors;
  
  // v2.3.0: Multi-Select State
  const [selectedUids, setSelectedUids] = useState(new Set());
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [lastClickedIndex, setLastClickedIndex] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  // v2.4.0: Inbox Subfolder Filter State
  const [categoryFilter, setCategoryFilter] = useState(null); // null = alle, 'werbung', 'spam', 'schaedlich', 'virus'
  const [inboxExpanded, setInboxExpanded] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  
  // v2.6.0: Manual sender-based categorization state
  const [manualCategories, setManualCategories] = useState(new Map()); // uid -> category
  const [senderCategoryVersion, setSenderCategoryVersion] = useState(0); // Force re-render on sender category changes

  // v2.9.3: Inline reply state
  const [replyMode, setReplyMode] = useState(null); // null | 'reply' | 'replyAll'
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState(null);
  const replyEditorRef = useRef(null);

  // v1.14.0: Spam filter analysis results (moved up to avoid TDZ in filteredEmails)
  const [spamResults, setSpamResults] = useState(new Map());
  
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

  // v2.9.0: Helper to check if current account uses Microsoft Graph API
  const isGraphAccount = useCallback(() => {
    const acc = getActiveAccount();
    return acc?.type === 'microsoft';
  }, [getActiveAccount]);

  // Load folders for account
  const loadFolders = useCallback(async () => {
    if (!window.electronAPI || !activeAccountId) return;

    const cacheKey = `folders:${activeAccountId}`;
    const cached = folderCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setFolders(cached.data);
      return;
    }

    setLoadingFolders(true);
    try {
      let result;
      if (isGraphAccount()) {
        // v2.9.0: Microsoft Graph folders
        result = await window.electronAPI.listGraphFolders(activeAccountId);
        if (result.success) {
          // Normalize Graph folders to the same shape as IMAP folders
          const normalized = result.folders.map(f => ({
            name: f.name,
            path: f.path,        // Graph folder ID used as path
            type: f.type,
            children: [],
            unread: f.unread || 0
          }));
          setFolders(normalized);
          folderCache.set(cacheKey, { data: normalized, timestamp: Date.now() });
        }
      } else {
        result = await window.electronAPI.listFolders(activeAccountId);
        if (result.success) {
          setFolders(result.folders);
          folderCache.set(cacheKey, { data: result.folders, timestamp: Date.now() });
        }
      }
    } catch (err) {
      console.error('Error loading folders:', err);
    }
    setLoadingFolders(false);
  }, [activeAccountId, isGraphAccount]);

  // v2.8.3: Background batch loading — runs a loop loading 50 emails at a time
  // until all are loaded or aborted (account/folder change).
  // Tracks full running list locally so cache + IndexedDB stay up-to-date,
  // meaning a later account switch restores all emails instantly.
  const startBackgroundLoading = useCallback(async (startOffset, accountId, folder, initialEmails) => {
    let offset = startOffset;
    let runningList = [...initialEmails]; // full list so far (for cache/DB saves)

    while (true) {
      if (bgLoadAbortRef.current) break;

      // Small pause between batches to avoid hammering the IMAP server
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (bgLoadAbortRef.current) break;
      if (!window.electronAPI) break;

      try {
        let result;
        if (folder === 'INBOX') {
          result = await window.electronAPI.fetchEmailsForAccount(accountId, { limit: 50, offset });
        } else {
          result = await window.electronAPI.fetchEmailsFromFolder(accountId, folder, { limit: 50, offset });
        }

        if (bgLoadAbortRef.current || !result.success) break;

        if (result.emails.length > 0) {
          const existingUids = new Set(runningList.map(e => e.uid));
          const olderOnes = result.emails.filter(e => !existingUids.has(e.uid));
          if (olderOnes.length > 0) {
            runningList = [...runningList, ...olderOnes];
            setEmails(runningList);
            offset += olderOnes.length;
            setBgLoadOffset(offset);

            // Keep memory cache and IndexedDB up-to-date so account switches restore correctly
            const cacheKey = `${accountId}:${folder}`;
            emailCache.set(cacheKey, { data: runningList, hasMore: result.hasMore, timestamp: Date.now() });
            const localStorageEnabled = localStorage.getItem('emailSettings.localStorageEnabled') !== 'false';
            if (localStorageEnabled) saveEmailsToIndexedDB(accountId, folder, runningList);
          }
        }

        setHasMore(result.hasMore || false);
        if (!result.hasMore) break;
      } catch (e) {
        console.error('[BgLoad] Error:', e);
        break;
      }
    }
  }, []); // no deps — uses ref for abort, params passed explicitly

  // v1.8.2: Fetch emails with caching and IndexedDB (stale-while-revalidate)
  const fetchEmails = useCallback(async (useCache = true) => {
    if (!window.electronAPI || !activeAccountId) {
      setLoading(false);
      return;
    }

    // Abort any running background batch load
    bgLoadAbortRef.current = true;

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
    let existingEmails = [];
    if (localStorageEnabled && useCache) {
      const localData = await loadEmailsFromIndexedDB(activeAccountId, currentFolder);
      if (localData && localData.emails?.length > 0) {
        existingEmails = localData.emails;
        // Show cached data immediately
        setEmails(existingEmails);
        setLoading(false);
        loadEmailPreview(existingEmails[0].uid);
        // Continue to fetch fresh data in background
      }
    }

    setError(null);
    if (existingEmails.length === 0) {
      setLoading(true);
    }

    try {
      let result;
      if (isGraphAccount()) {
        // v2.9.0: Microsoft Graph fetch
        result = await window.electronAPI.fetchGraphEmails(activeAccountId, { folder: currentFolder, limit: 50, skip: 0 });
        if (result?.error === 'TOKEN_EXPIRED') {
          setError('Microsoft-Token abgelaufen. Bitte Konto erneut verbinden (Einstellungen → Kontenverwaltung).');
          setLoading(false);
          return;
        }
      } else if (currentFolder === 'INBOX') {
        result = await window.electronAPI.fetchEmailsForAccount(activeAccountId, { limit: 50 });
      } else {
        result = await window.electronAPI.fetchEmailsFromFolder(activeAccountId, currentFolder, { limit: 50 });
      }

      if (result.success) {
        // v2.9.7: Server is authoritative — use server list as base, preserve local seen status,
        // keep older cached emails (pagination) that aren't in the server page.
        // This prevents deleted emails from reappearing and keeps read status intact.
        let finalEmails;
        if (existingEmails.length > 0) {
          const serverUids = new Set(result.emails.map(e => e.uid));
          const existingByUid = new Map(existingEmails.map(e => [e.uid, e]));

          // Server emails with local seen-status preserved
          const mergedServer = result.emails.map(e => {
            const cached = existingByUid.get(e.uid);
            return cached ? { ...e, seen: cached.seen } : e;
          });

          // Keep only truly older cached emails not covered by the server page
          const olderCached = existingEmails.filter(e => !serverUids.has(e.uid));

          finalEmails = [...mergedServer, ...olderCached];
        } else {
          finalEmails = result.emails;
        }

        setEmails(finalEmails);
        setHasMore(result.hasMore || false);
        setBgLoadOffset(finalEmails.length);

        // Start background loading if server has more than we have locally
        if (result.hasMore) {
          bgLoadAbortRef.current = false;
          startBackgroundLoading(finalEmails.length, activeAccountId, currentFolder, finalEmails);
        }

        // Update memory cache
        emailCache.set(cacheKey, {
          data: finalEmails,
          hasMore: result.hasMore,
          timestamp: Date.now()
        });

        // v1.8.2: Save to IndexedDB for offline access
        if (localStorageEnabled) {
          saveEmailsToIndexedDB(activeAccountId, currentFolder, finalEmails);
        }

        if (finalEmails.length > 0) {
          loadEmailPreview(finalEmails[0].uid);
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
      if (isGraphAccount()) {
        result = await window.electronAPI.fetchGraphEmails(activeAccountId, {
          folder: currentFolder, limit: 50, skip: emails.length
        });
      } else if (currentFolder === 'INBOX') {
        result = await window.electronAPI.fetchEmailsForAccount(activeAccountId, {
          limit: 50, offset: emails.length
        });
      } else {
        result = await window.electronAPI.fetchEmailsFromFolder(activeAccountId, currentFolder, {
          limit: 50, offset: emails.length
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

  // v2.8.3: Sync — fetch latest emails from server, merge with current state
  // v2.9.8: Also updates seen-status from server + persists to cache/IndexedDB
  const syncEmails = useCallback(async () => {
    if (!window.electronAPI || !activeAccountId) return;
    try {
      let freshResult;
      if (isGraphAccount()) {
        freshResult = await window.electronAPI.fetchGraphEmails(activeAccountId, { folder: currentFolder, limit: 50, skip: 0 });
      } else if (currentFolder === 'INBOX') {
        freshResult = await window.electronAPI.fetchEmailsForAccount(activeAccountId, { limit: 50, offset: 0 });
      } else {
        freshResult = await window.electronAPI.fetchEmailsFromFolder(activeAccountId, currentFolder, { limit: 50, offset: 0 });
      }
      if (freshResult?.success) {
        const localStorageEnabled = localStorage.getItem('emailSettings.localStorageEnabled') !== 'false';
        setEmails(prev => {
          const serverUids = new Set(freshResult.emails.map(e => e.uid));
          const prevByUid = new Map(prev.map(e => [e.uid, e]));

          // Update existing emails with fresh server data (e.g. seen-status from other device)
          const updated = freshResult.emails.map(e => {
            const local = prevByUid.get(e.uid);
            // Keep local seen-status only if it's MORE read than server
            // (local mark-as-read should not be overwritten by stale server state)
            return local ? { ...e, seen: local.seen || e.seen } : e;
          });

          // Prepend truly new emails, keep older ones not in server page
          const olderOnes = prev.filter(e => !serverUids.has(e.uid));
          const merged = [...updated, ...olderOnes];

          // Persist to cache + IndexedDB so account-switch doesn't lose sync results
          const cacheKey = getCacheKey(activeAccountId, currentFolder);
          emailCache.set(cacheKey, { data: merged, hasMore: freshResult.hasMore ?? false, timestamp: Date.now() });
          if (localStorageEnabled) saveEmailsToIndexedDB(activeAccountId, currentFolder, merged);

          return merged;
        });
      }
    } catch (e) {
      console.error('[Sync] Error:', e);
    }
  }, [activeAccountId, currentFolder, isGraphAccount, getCacheKey]);

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

  // v2.9.9: Receive background sync results from App.js global timer
  // The timer runs in App.js (always active), dispatches 'coremail:bgSync' events.
  // InboxSplitView merges incoming data into state + memory cache when visible.
  useEffect(() => {
    const handleBgSync = (e) => {
      const { accountId, folder, emails: serverEmails } = e.detail || {};
      if (accountId !== activeAccountId || folder !== currentFolder) return;

      const localStorageEnabled = localStorage.getItem('emailSettings.localStorageEnabled') !== 'false';
      setEmails(prev => {
        const serverUids = new Set(serverEmails.map(e => e.uid));
        const prevByUid = new Map(prev.map(e => [e.uid, e]));

        const merged = serverEmails.map(e => {
          const local = prevByUid.get(e.uid);
          return local ? { ...e, seen: local.seen || e.seen } : e;
        });
        const olderOnes = prev.filter(e => !serverUids.has(e.uid));
        const result = [...merged, ...olderOnes];

        // Keep memory cache in sync
        emailCache.set(getCacheKey(activeAccountId, currentFolder), {
          data: result, hasMore: false, timestamp: Date.now()
        });
        if (localStorageEnabled) saveEmailsToIndexedDB(activeAccountId, currentFolder, result);

        return result;
      });
    };

    window.addEventListener('coremail:bgSync', handleBgSync);
    return () => window.removeEventListener('coremail:bgSync', handleBgSync);
  }, [activeAccountId, currentFolder, getCacheKey]);

  const loadEmailPreview = async (uid) => {
    if (!window.electronAPI || !activeAccountId) return;

    setLoadingPreview(true);
    try {
      let result;
      if (isGraphAccount()) {
        result = await window.electronAPI.fetchGraphEmail(activeAccountId, uid);
      } else {
        result = await window.electronAPI.fetchEmailForAccount(activeAccountId, uid, currentFolder);
      }
      if (result?.success) {
        setSelectedEmail(result.email);
      }
    } catch (e) {
      console.error('Error loading email preview', e);
    }
    setLoadingPreview(false);
  };

  const handleSelectEmail = (index) => {
    setSelectedIndex(index);
    // v2.4.0: Use filteredEmails for selection
    if (filteredEmails[index]) {
      loadEmailPreview(filteredEmails[index].uid);
      
      // Auto-mark as read based on settings (v1.8.1)
      const markMode = localStorage.getItem('emailSettings.markAsReadMode') || 'onClick';
      if (markMode === 'onClick' && !filteredEmails[index].seen) {
        handleToggleRead(filteredEmails[index].uid, false);
      }
    }
  };

  // Email Actions
  // v1.12.1: Fixed - now also removes from IndexedDB to prevent deleted emails from reappearing
  const handleDelete = useCallback(async (uid) => {
    if (!window.electronAPI || !activeAccountId) return;

    setActionLoading(`delete-${uid}`);
    try {
      const result = isGraphAccount()
        ? await window.electronAPI.deleteGraphEmail(activeAccountId, uid)
        : await window.electronAPI.deleteEmail(activeAccountId, uid, currentFolder);
      if (result.success) {
        // Stop background loader immediately so it can't write the deleted email back
        bgLoadAbortRef.current = true;

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
  }, [activeAccountId, currentFolder, emails, selectedIndex, hasMore, getCacheKey, isGraphAccount]);

  const handleToggleRead = useCallback(async (uid, currentSeen) => {
    if (!window.electronAPI || !activeAccountId) return;

    setActionLoading(`read-${uid}`);
    try {
      const result = isGraphAccount()
        ? await window.electronAPI.markGraphAsRead(activeAccountId, uid, !currentSeen)
        : await window.electronAPI.markAsRead(activeAccountId, uid, !currentSeen, currentFolder);
      if (result.success) {
        // Update local state
        const newEmails = emails.map(e =>
          e.uid === uid ? { ...e, seen: !currentSeen } : e
        );
        setEmails(newEmails);

        // Update memory cache
        const cacheKey = getCacheKey(activeAccountId, currentFolder);
        emailCache.set(cacheKey, { data: newEmails, hasMore, timestamp: Date.now() });

        // Also persist to IndexedDB so read status survives account switches
        const localStorageEnabled = localStorage.getItem('emailSettings.localStorageEnabled') !== 'false';
        if (localStorageEnabled) saveEmailsToIndexedDB(activeAccountId, currentFolder, newEmails);

        // Update selected email if needed
        if (selectedEmail?.uid === uid) {
          setSelectedEmail({ ...selectedEmail, seen: !currentSeen });
        }
      }
    } catch (err) {
      console.error('Error toggling read status:', err);
    }
    setActionLoading(null);
  }, [activeAccountId, currentFolder, emails, selectedEmail, hasMore, getCacheKey, isGraphAccount]);

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

  // v2.6.0: Filtered emails based on category filter (moved up to avoid TDZ)
  const filteredEmails = useMemo(() => {
    let result = emails;

    if (categoryFilter && currentFolder === 'INBOX') {
      result = result.filter(email => {
        const manualCat = manualCategories.get(email.uid);
        if (manualCat) return manualCat === categoryFilter;
        const analysis = spamResults.get(email.uid);
        return analysis?.category === categoryFilter;
      });
    }

    if (showUnreadOnly) {
      result = result.filter(email => !email.seen);
    }

    return result;
  }, [emails, categoryFilter, manualCategories, spamResults, currentFolder, showUnreadOnly]);

  const handleSelectAll = useCallback(() => {
    if (selectedUids.size === filteredEmails.length) {
      // Deselect all
      setSelectedUids(new Set());
    } else {
      // Select all (from filtered emails)
      setSelectedUids(new Set(filteredEmails.map(e => e.uid)));
    }
  }, [filteredEmails, selectedUids]);

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

  // v2.6.0: Manual categorization handler - saves sender category and updates UI
  const handleCategorize = useCallback((email, category) => {
    if (!email) return;
    
    const senderEmail = SenderCategoryManager.extractEmail(email.from);
    
    // Save sender category
    SenderCategoryManager.setSenderCategory(senderEmail, category);
    
    // Update local state for immediate UI feedback
    setManualCategories(prev => {
      const newMap = new Map(prev);
      if (category === null) {
        newMap.delete(email.uid);
      } else {
        newMap.set(email.uid, category);
      }
      return newMap;
    });
    
    // Force re-render to update all emails from this sender
    setSenderCategoryVersion(v => v + 1);
    
    // Show notification
    const catName = category 
      ? MANUAL_CATEGORIES.find(c => c.id === category)?.name || category 
      : 'Keine';
    console.log(`[Categorize] ${senderEmail} -> ${catName}`);
    
    // Optional: Show toast notification
    if (category) {
      // Could integrate with a toast system here
      console.log(`E-Mail als "${catName}" markiert. Zukünftige E-Mails von ${senderEmail} werden automatisch kategorisiert.`);
    }
  }, []);

  // v2.6.0: Apply sender-based categories when emails change
  useEffect(() => {
    // Update manual categories based on sender rules
    const newCategories = new Map();
    emails.forEach(email => {
      const senderCategory = SenderCategoryManager.getSenderCategory(email.from);
      if (senderCategory) {
        newCategories.set(email.uid, senderCategory);
      }
    });
    setManualCategories(newCategories);
  }, [emails, senderCategoryVersion]);

  // v2.6.0: Get effective category for an email (manual > spam filter)
  const getEmailCategory = useCallback((email) => {
    // Manual/sender-based category takes precedence
    const manualCat = manualCategories.get(email.uid);
    if (manualCat) return manualCat;
    
    // Fall back to spam filter analysis
    const analysis = spamResults.get(email.uid);
    return analysis?.category || null;
  }, [manualCategories, spamResults]);

  // v2.9.3: Reset reply panel when selected email changes
  useEffect(() => {
    setReplyMode(null);
    setReplyError(null);
    if (replyEditorRef.current) replyEditorRef.current.innerHTML = '';
  }, [selectedEmail?.uid]);

  // v2.9.3: Send inline reply
  const handleSendReply = useCallback(async () => {
    if (!selectedEmail || !replyEditorRef.current) return;
    setReplySending(true);
    setReplyError(null);

    const account = accounts.find(a => a.id === activeAccountId);
    const replyBodyHtml = replyEditorRef.current.innerHTML || '';
    const originalHtml = selectedEmail.html || `<p>${(selectedEmail.text || '').replace(/\n/g, '<br>')}</p>`;
    const fullHtml = `${replyBodyHtml}<br><br><blockquote style="border-left:3px solid #555;padding-left:1em;color:#888;margin:0 0 0 0.5em">${originalHtml}</blockquote>`;

    // Build CC for replyAll: original CC + all recipients except own address
    let ccVal;
    if (replyMode === 'replyAll') {
      const ownEmail = account?.smtp?.fromEmail || account?.smtp?.username || account?.microsoft?.email || '';
      const toAddrs = (selectedEmail.to || '').split(/[,;]/).map(s => s.trim()).filter(Boolean);
      const ccAddrs = (selectedEmail.cc || '').split(/[,;]/).map(s => s.trim()).filter(Boolean);
      const allAddrs = [...toAddrs, ...ccAddrs].filter(a => a && !a.toLowerCase().includes(ownEmail.toLowerCase()));
      ccVal = allAddrs.join(', ') || undefined;
    }

    const emailData = {
      to: selectedEmail.from,
      cc: ccVal,
      subject: selectedEmail.subject?.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject || ''}`,
      text: replyEditorRef.current.innerText || '',
      html: fullHtml,
      attachments: [],
    };

    try {
      let result;
      if (account?.type === 'microsoft') {
        result = await window.electronAPI.sendGraphEmail(activeAccountId, emailData);
      } else {
        result = await window.electronAPI.sendEmailForAccount(activeAccountId, emailData);
      }
      if (result?.success) {
        setReplyMode(null);
        if (replyEditorRef.current) replyEditorRef.current.innerHTML = '';
      } else {
        setReplyError(result?.error || 'Senden fehlgeschlagen');
      }
    } catch (e) {
      setReplyError(e.message);
    }
    setReplySending(false);
  }, [selectedEmail, replyMode, activeAccountId, accounts]);

  // Keyboard navigation (v2.3.0: added Ctrl+A for select all)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore all shortcuts when typing in an input, textarea, or contentEditable (e.g. reply editor)
      if (e.target.isContentEditable || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Ctrl+A or Cmd+A: Select all emails
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && filteredEmails.length > 0) {
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
        } else if (filteredEmails[selectedIndex]) {
          handleDelete(filteredEmails[selectedIndex].uid);
        }
        return;
      }

      if (e.key === 'ArrowDown' && selectedIndex < filteredEmails.length - 1) {
        handleSelectEmail(selectedIndex + 1);
      } else if (e.key === 'ArrowUp' && selectedIndex > 0) {
        handleSelectEmail(selectedIndex - 1);
      } else if (e.key === 'Enter' && selectedEmail) {
        onFullView(selectedEmail, currentFolder);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filteredEmails, selectedEmail, onFullView, currentFolder, handleDelete, handleSelectAll, handleClearSelection, selectedUids]);

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

  // v2.6.0: Category counts for inbox subfolders (includes manual + auto categories)
  const categoryCounts = useMemo(() => {
    const counts = { whitelist: 0, werbung: 0, spam: 0, schaedlich: 0, virus: 0 };
    if (currentFolder !== 'INBOX') return counts;
    
    emails.forEach(email => {
      // Check manual/sender category first
      const manualCat = manualCategories.get(email.uid);
      if (manualCat && counts.hasOwnProperty(manualCat)) {
        counts[manualCat]++;
        return;
      }
      
      // Fall back to spam filter
      const analysis = spamResults.get(email.uid);
      if (analysis?.category && counts.hasOwnProperty(analysis.category)) {
        counts[analysis.category]++;
      }
    });
    return counts;
  }, [emails, manualCategories, spamResults, currentFolder]);

  // v2.4.0: Reset category filter when folder changes
  useEffect(() => {
    if (currentFolder !== 'INBOX') {
      setCategoryFilter(null);
    }
    setShowUnreadOnly(false);
  }, [currentFolder]);

  // v2.4.0: Reset selection when category filter changes
  useEffect(() => {
    setSelectedIndex(0);
    setSelectedEmail(null);
    setSelectedUids(new Set());
    if (filteredEmails.length > 0) {
      loadEmailPreview(filteredEmails[0].uid);
    }
  }, [categoryFilter]);

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
      <div className={`flex-1 flex items-center justify-center ${c.bgSecondary}`}>
        <div className={`text-center ${c.textSecondary}`}>
          <div className="text-5xl mb-4">📧</div>
          <p>Wähle ein Konto aus der Sidebar</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${c.bgSecondary}`}>
        <LoadingSpinner message="E-Mails werden geladen..." />
      </div>
    );
  }

  if (error) {
    const activeAccount = getActiveAccount();
    return (
      <div className={`flex-1 flex items-center justify-center ${c.bgSecondary}`}>
        <div className="text-center max-w-lg px-4">
          <div className="text-red-400 text-5xl mb-4">⚠️</div>
          <h3 className={`font-semibold ${c.text} mb-2`}>Verbindung fehlgeschlagen</h3>
          {activeAccount && (
            <p className={`text-xs ${c.textSecondary} mb-2`}>
              {activeAccount.imap?.host}:{activeAccount.imap?.port} ({activeAccount.imap?.username})
            </p>
          )}
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-3 text-left">
            <p className="text-red-400 text-sm font-mono break-all">{error}</p>
          </div>
          <p className={`text-xs ${c.textSecondary} mb-4`}>
            Überprüfe Host, Port, Benutzername und Passwort. Bei Gmail/Outlook wird ein App-Passwort benötigt.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button onClick={() => fetchEmails(false)} className={`px-4 py-2 ${c.accentBg} text-white rounded-lg text-sm`}>
              Erneut versuchen
            </button>
            {onNavigate && (
              <button onClick={() => onNavigate('accounts')} className={`px-4 py-2 ${c.bgTertiary} ${c.text} ${c.border} border rounded-lg text-sm`}>
                Konto-Einstellungen
              </button>
            )}
            {window.electronAPI?.openDevTools && (
              <button onClick={() => window.electronAPI.openDevTools()} className={`px-4 py-2 ${c.bgTertiary} ${c.textSecondary} ${c.border} border rounded-lg text-sm`}>
                DevTools
              </button>
            )}
          </div>
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
            <div key={folder.path}>
              <button
                onClick={() => {
                  setCurrentFolder(folder.path);
                  if (folder.path === 'INBOX') {
                    setCategoryFilter(null);
                  }
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm transition-colors ${
                  currentFolder === folder.path && !categoryFilter
                    ? `${c.accentBg} text-white`
                    : `${c.textSecondary} ${c.hover}`
                }`}
                style={{ paddingLeft: `${(folder.depth * 12) + 12}px` }}
              >
                {/* v2.4.0: Expand/Collapse arrow for INBOX */}
                {folder.path === 'INBOX' ? (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setInboxExpanded(!inboxExpanded); 
                    }}
                    className="p-0.5 -ml-1 hover:bg-white/10 rounded"
                  >
                    {inboxExpanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                ) : null}
                {getFolderIcon(folder.type)}
                <span className="truncate flex-1">{folder.name}</span>
                {/* v1.11.0: Show unread count badge for inbox */}
                {folder.path === 'INBOX' && unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full font-medium min-w-[20px] text-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {/* v2.4.0: Virtual Inbox Subfolders */}
              {folder.path === 'INBOX' && inboxExpanded && (
                <div className="ml-3">
                  {INBOX_SUBFOLDERS.map(subfolder => {
                    const SubIcon = subfolder.icon;
                    const count = categoryCounts[subfolder.id] || 0;
                    const isActive = currentFolder === 'INBOX' && categoryFilter === subfolder.id;
                    
                    return (
                      <button
                        key={subfolder.id}
                        onClick={() => {
                          setCurrentFolder('INBOX');
                          setCategoryFilter(subfolder.id);
                        }}
                        className={`w-full text-left px-3 py-1.5 flex items-center gap-2 text-sm transition-colors rounded-lg my-0.5 ${
                          isActive
                            ? `${subfolder.bgColor} ${subfolder.color}`
                            : `${c.textSecondary} ${c.hover}`
                        }`}
                        style={{ paddingLeft: '24px' }}
                      >
                        <SubIcon className={`w-4 h-4 ${isActive ? subfolder.color : ''}`} />
                        <span className="truncate flex-1">{subfolder.name}</span>
                        {count > 0 && (
                          <span className={`px-1.5 py-0.5 ${subfolder.bgColor} ${subfolder.color} text-xs rounded-full font-medium min-w-[20px] text-center`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
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
              <div className="flex items-center gap-2">
                <h2 className={`font-semibold ${c.text}`}>{account?.name || 'Posteingang'}</h2>
                {/* v2.4.0: Show active category filter */}
                {categoryFilter && currentFolder === 'INBOX' && (
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    INBOX_SUBFOLDERS.find(f => f.id === categoryFilter)?.bgColor || 'bg-gray-500/20'
                  } ${
                    INBOX_SUBFOLDERS.find(f => f.id === categoryFilter)?.color || 'text-gray-400'
                  }`}>
                    {INBOX_SUBFOLDERS.find(f => f.id === categoryFilter)?.name}
                    <button 
                      onClick={() => setCategoryFilter(null)}
                      className="ml-1.5 hover:opacity-70"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
              <p className={`text-sm ${c.textSecondary}`}>
                {filteredEmails.length} E-Mails {currentFolder !== 'INBOX' && `in ${currentFolder}`}
                {(categoryFilter || showUnreadOnly) && ` (von ${emails.length} gesamt)`}
                {!categoryFilter && !showUnreadOnly && unreadCount > 0 && (
                  <span className="ml-2 text-blue-400">({unreadCount} ungelesen)</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {/* v2.8.5: Ungelesen-Filter */}
              <button
                onClick={() => setShowUnreadOnly(v => !v)}
                className={`p-2 rounded-lg transition-colors ${showUnreadOnly ? 'bg-blue-500 text-white' : `${c.hover} ${c.textSecondary}`}`}
                title={showUnreadOnly ? 'Alle E-Mails anzeigen' : 'Nur ungelesene anzeigen'}
              >
                <Mail className="w-4 h-4" />
              </button>
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
                  {selectedUids.size === filteredEmails.length && filteredEmails.length > 0 ? (
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
          {filteredEmails.length === 0 ? (
            <div className={`p-8 text-center ${c.textSecondary}`}>
              {showUnreadOnly ? (
                <div>
                  <div className="text-3xl mb-2">✅</div>
                  <p>Keine ungelesenen E-Mails</p>
                  <button
                    onClick={() => setShowUnreadOnly(false)}
                    className={`mt-2 text-sm ${c.accent} hover:underline`}
                  >
                    Alle E-Mails anzeigen
                  </button>
                </div>
              ) : categoryFilter ? (
                <div>
                  <div className="text-3xl mb-2">✨</div>
                  <p>Keine E-Mails in dieser Kategorie</p>
                  <button
                    onClick={() => setCategoryFilter(null)}
                    className={`mt-2 text-sm ${c.accent} hover:underline`}
                  >
                    Alle E-Mails anzeigen
                  </button>
                </div>
              ) : (
                'Keine E-Mails'
              )}
            </div>
          ) : (
            <>
              {filteredEmails.map((email, index) => {
                // v2.6.0: Merge manual category with spam analysis
                const manualCat = manualCategories.get(email.uid);
                const spamAnalysis = spamResults.get(email.uid);
                const effectiveAnalysis = manualCat
                  ? { ...spamAnalysis, category: manualCat, isManual: true }
                  : spamAnalysis;
                const folderLower = currentFolder.toLowerCase();
                const isSentFolder = folderLower.includes('sent') || folderLower.includes('gesendet');

                return (
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
                    spamAnalysis={effectiveAnalysis}
                    showCheckboxes={showCheckboxes}
                    isSentFolder={isSentFolder}
                  />
                );
              })}
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
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h2 className={`text-xl font-semibold ${c.text} mb-2 truncate`}>
                    {selectedEmail.subject}
                  </h2>
                  <p className={`${c.textSecondary} text-sm`}>Von: {selectedEmail.from}</p>
                  <p className={`${c.textSecondary} text-sm`}>An: {selectedEmail.to}</p>
                  <p className={`${c.textSecondary} text-xs mt-1`}>
                    {new Date(selectedEmail.date).toLocaleString('de-DE')}
                  </p>
                </div>
                {/* v2.9.3: Reply buttons + full view */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setReplyMode(replyMode === 'reply' ? null : 'reply')}
                    className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-sm ${
                      replyMode === 'reply'
                        ? `${c.accentBg} text-white`
                        : `${c.hover} ${c.textSecondary}`
                    }`}
                    title="Antworten"
                  >
                    <Reply className="w-4 h-4" />
                    <span className="hidden xl:inline">Antworten</span>
                  </button>
                  <button
                    onClick={() => setReplyMode(replyMode === 'replyAll' ? null : 'replyAll')}
                    className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-sm ${
                      replyMode === 'replyAll'
                        ? `${c.accentBg} text-white`
                        : `${c.hover} ${c.textSecondary}`
                    }`}
                    title="Allen antworten"
                  >
                    <ReplyAll className="w-4 h-4" />
                    <span className="hidden xl:inline">Allen</span>
                  </button>
                  <div className={`w-px h-5 ${c.border} border-l mx-1`} />
                  <button
                    onClick={() => onFullView(selectedEmail, currentFolder)}
                    className={`px-3 py-2 ${c.accentBg} ${c.accentHover} text-white rounded-lg text-sm transition-colors`}
                  >
                    Vollansicht →
                  </button>
                </div>
              </div>
            </div>

            {/* v2.6.0: Manual Categorization Buttons */}
            <CategoryButtons
              email={selectedEmail}
              currentCategory={manualCategories.get(selectedEmail?.uid)}
              onCategorize={handleCategorize}
              c={c}
            />

            <div className={`flex-1 overflow-auto ${c.bg} flex flex-col`}>
              {/* v2.9.3: Inline Reply Panel — oberhalb des Mails */}
              {replyMode && (
                <div className={`border-b ${c.border} ${c.bgSecondary} flex-shrink-0`}>
                  {/* Reply header */}
                  <div className={`px-4 py-2 border-b ${c.border} flex items-center justify-between`}>
                    <div className={`text-sm font-medium ${c.text} flex items-center gap-2`}>
                      {replyMode === 'replyAll' ? <ReplyAll className="w-4 h-4" /> : <Reply className="w-4 h-4" />}
                      <span>{replyMode === 'replyAll' ? 'Allen antworten' : 'Antworten'}</span>
                      <span className={`${c.textSecondary} font-normal truncate max-w-[200px]`}>an {selectedEmail.from}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {replyError && <span className="text-xs text-red-400">{replyError}</span>}
                      <button
                        onClick={handleSendReply}
                        disabled={replySending}
                        className={`px-3 py-1.5 ${c.accentBg} ${c.accentHover} text-white rounded-lg text-sm transition-colors flex items-center gap-1.5 disabled:opacity-50`}
                      >
                        {replySending ? <><span className="animate-spin text-xs">⏳</span> Sende...</> : <><Send className="w-3.5 h-3.5" /> Senden</>}
                      </button>
                      <button
                        onClick={() => { setReplyMode(null); setReplyError(null); if (replyEditorRef.current) replyEditorRef.current.innerHTML = ''; }}
                        className={`p-1.5 ${c.hover} rounded ${c.textSecondary}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Formatting toolbar */}
                  <div className={`flex items-center gap-1 px-3 py-1.5 border-b ${c.border} ${c.bg}`}>
                    {[
                      { cmd: 'bold',      label: <strong>B</strong>,  title: 'Fett (Ctrl+B)' },
                      { cmd: 'italic',    label: <em>I</em>,           title: 'Kursiv (Ctrl+I)' },
                      { cmd: 'underline', label: <span style={{textDecoration:'underline'}}>U</span>, title: 'Unterstrichen (Ctrl+U)' },
                    ].map(btn => (
                      <button
                        key={btn.cmd}
                        onMouseDown={e => { e.preventDefault(); replyEditorRef.current?.focus(); document.execCommand(btn.cmd, false, null); }}
                        title={btn.title}
                        className={`w-7 h-7 flex items-center justify-center rounded text-xs ${c.hover} ${c.textSecondary} hover:text-cyan-400`}
                      >
                        {btn.label}
                      </button>
                    ))}
                    <div className={`w-px h-4 ${c.border} border-l mx-1`} />
                    {[
                      { cmd: 'insertUnorderedList', label: '•', title: 'Aufzählungsliste' },
                      { cmd: 'insertOrderedList',   label: '1.', title: 'Nummerierte Liste' },
                    ].map(btn => (
                      <button
                        key={btn.cmd}
                        onMouseDown={e => { e.preventDefault(); replyEditorRef.current?.focus(); document.execCommand(btn.cmd, false, null); }}
                        title={btn.title}
                        className={`w-7 h-7 flex items-center justify-center rounded text-xs ${c.hover} ${c.textSecondary} hover:text-cyan-400`}
                      >
                        {btn.label}
                      </button>
                    ))}
                    <div className={`w-px h-4 ${c.border} border-l mx-1`} />
                    <button
                      onMouseDown={e => { e.preventDefault(); replyEditorRef.current?.focus(); document.execCommand('removeFormat', false, null); }}
                      title="Formatierung entfernen"
                      className={`w-7 h-7 flex items-center justify-center rounded text-xs ${c.hover} ${c.textSecondary} hover:text-cyan-400`}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Reply editor */}
                  <div
                    ref={replyEditorRef}
                    contentEditable
                    suppressContentEditableWarning
                    className={`min-h-[120px] max-h-[240px] overflow-y-auto p-4 focus:outline-none ${c.text}`}
                    style={{ fontSize: '14px', lineHeight: '1.6' }}
                    data-placeholder="Antwort schreiben..."
                  />

                  {/* Quoted original email */}
                  <div className={`mx-4 mb-3 pl-3 border-l-2 border-gray-500 text-xs ${c.textSecondary} max-h-20 overflow-hidden`}>
                    <p className="font-medium mb-1">
                      Am {new Date(selectedEmail.date).toLocaleString('de-DE')} schrieb {selectedEmail.from}:
                    </p>
                    <div className="opacity-70 line-clamp-3">
                      {selectedEmail.text?.slice(0, 200) || selectedEmail.html?.replace(/<[^>]*>/g, '').slice(0, 200)}
                    </div>
                  </div>
                </div>
              )}

              {/* Email content */}
              <div className="p-6">
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
