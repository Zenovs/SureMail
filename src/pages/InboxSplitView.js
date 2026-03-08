import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { Trash2, Mail, MailOpen, RefreshCw, Inbox, Send, FileText, Trash, AlertCircle, Archive, Folder, GripVertical } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../context/AccountContext';
import LoadingSpinner from '../components/LoadingSpinner';

// Folder column width constants (v1.8.1)
const FOLDER_MIN_WIDTH = 150;
const FOLDER_MAX_WIDTH = 350;
const FOLDER_DEFAULT_WIDTH = 192;

// Email cache for performance (v1.8.0)
const emailCache = new Map();
const folderCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Memoized Email List Item for performance
const EmailListItem = memo(({ email, index, isSelected, onSelect, onDelete, onToggleRead, c, actionLoading }) => {
  return (
    <div
      onClick={() => onSelect(index)}
      className={`p-4 cursor-pointer transition-colors ${c.border} border-b ${
        isSelected ? c.bgTertiary : c.hover
      } ${!email.seen ? 'font-medium' : ''} group relative`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className={`text-sm truncate ${c.text} ${!email.seen ? c.accent : ''}`}>
            {email.from}
          </div>
          <div className={`text-sm truncate ${c.text} mt-1`}>
            {!email.seen && <span className="inline-block w-2 h-2 bg-cyan-500 rounded-full mr-2" />}
            {email.subject}
          </div>
          <div className={`text-xs ${c.textSecondary} mt-1 truncate`}>
            {email.preview}
          </div>
          <div className={`text-xs ${c.textSecondary} mt-2`}>
            {new Date(email.date).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
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
  const { activeAccountId, getActiveAccount } = useAccounts();
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
  
  // Resizable folder column (v1.8.1)
  const [folderWidth, setFolderWidth] = useState(() => {
    const saved = localStorage.getItem('inbox.folderColumnWidth');
    return saved ? parseInt(saved, 10) : FOLDER_DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef(null);
  
  // Handle folder column resize
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = Math.max(FOLDER_MIN_WIDTH, Math.min(FOLDER_MAX_WIDTH, e.clientX - 60)); // 60 = sidebar offset approx
      setFolderWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        localStorage.setItem('inbox.folderColumnWidth', folderWidth.toString());
      }
    };
    
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, folderWidth]);

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

  // Fetch emails with caching
  const fetchEmails = useCallback(async (useCache = true) => {
    if (!window.electronAPI || !activeAccountId) {
      setLoading(false);
      return;
    }

    const cacheKey = getCacheKey(activeAccountId, currentFolder);
    
    // Check cache first
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

    setLoading(true);
    setError(null);

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
        
        // Update cache
        emailCache.set(cacheKey, { 
          data: result.emails, 
          hasMore: result.hasMore,
          timestamp: Date.now() 
        });
        
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
  const handleDelete = useCallback(async (uid) => {
    if (!window.electronAPI || !activeAccountId) return;
    
    setActionLoading(`delete-${uid}`);
    try {
      const result = await window.electronAPI.deleteEmail(activeAccountId, uid, currentFolder);
      if (result.success) {
        // Remove from local state and cache
        const newEmails = emails.filter(e => e.uid !== uid);
        setEmails(newEmails);
        
        // Update cache
        const cacheKey = getCacheKey(activeAccountId, currentFolder);
        emailCache.set(cacheKey, { data: newEmails, hasMore, timestamp: Date.now() });
        
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' && selectedIndex < emails.length - 1) {
        handleSelectEmail(selectedIndex + 1);
      } else if (e.key === 'ArrowUp' && selectedIndex > 0) {
        handleSelectEmail(selectedIndex - 1);
      } else if (e.key === 'Enter' && selectedEmail) {
        onFullView(selectedEmail, currentFolder);
      } else if (e.key === 'Delete' && emails[selectedIndex]) {
        handleDelete(emails[selectedIndex].uid);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, emails, selectedEmail, onFullView, currentFolder, handleDelete]);

  // Scroll handler for infinite loading
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop - clientHeight < 200 && hasMore && !loadingMore) {
      loadMoreEmails();
    }
  }, [hasMore, loadingMore, loadMoreEmails]);

  const account = getActiveAccount();

  // Flat folder list for display
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
    flatten(folders);
    return flat;
  }, [folders]);

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
              <span className="truncate">{folder.name}</span>
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
              </button>
            </div>
          )}
        </div>
        
        {/* Resize Handle */}
        <div
          ref={resizeRef}
          onMouseDown={() => setIsResizing(true)}
          className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-500/50 transition-colors ${isResizing ? 'bg-cyan-500' : ''}`}
          title="Ziehen zum Ändern der Breite"
        />
      </div>

      {/* Email List */}
      <div className={`w-1/3 min-w-[300px] ${c.bgSecondary} ${c.border} border-r flex flex-col overflow-hidden`}>
        <div className={`p-4 ${c.border} border-b flex items-center justify-between`}>
          <div>
            <h2 className={`font-semibold ${c.text}`}>{account?.name || 'Posteingang'}</h2>
            <p className={`text-sm ${c.textSecondary}`}>
              {emails.length} E-Mails {currentFolder !== 'INBOX' && `in ${currentFolder}`}
            </p>
          </div>
          <button
            onClick={() => fetchEmails(false)}
            className={`p-2 ${c.hover} rounded-lg transition-colors ${c.textSecondary}`}
            title="Aktualisieren"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
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
                  onSelect={handleSelectEmail}
                  onDelete={handleDelete}
                  onToggleRead={handleToggleRead}
                  c={c}
                  actionLoading={actionLoading}
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
      </div>

      {/* Email Preview */}
      <div className={`flex-1 flex flex-col overflow-hidden ${c.bg}`}>
        {loadingPreview ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : selectedEmail ? (
          <>
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
              {selectedEmail.html ? (
                <div
                  className="email-content"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                  style={{ 
                    backgroundColor: 'white', 
                    color: 'black', 
                    padding: '16px', 
                    borderRadius: '8px',
                    minHeight: '200px'
                  }}
                />
              ) : (
                <pre className={`${c.text} whitespace-pre-wrap font-sans`}>
                  {selectedEmail.text}
                </pre>
              )}
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
    </div>
  );
}

export default InboxSplitView;
