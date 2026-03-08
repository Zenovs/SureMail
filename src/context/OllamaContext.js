import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const OllamaContext = createContext();

const OLLAMA_BASE_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'llama3.2:1b';

export const OllamaProvider = ({ children }) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [installedModels, setInstalledModels] = useState([]);
  const [activeModel, setActiveModel] = useState(DEFAULT_MODEL);
  const [chatHistory, setChatHistory] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);
  // v1.8.0: Email context for AI access
  const [emailContext, setEmailContext] = useState(null);

  // Load saved settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await window.electronAPI.getAppSettings();
        if (settings?.ollama) {
          if (settings.ollama.activeModel) setActiveModel(settings.ollama.activeModel);
          if (settings.ollama.chatHistory) setChatHistory(settings.ollama.chatHistory);
        }
      } catch (err) {
        console.error('Failed to load Ollama settings:', err);
      }
    };
    loadSettings();
  }, []);

  // Check Ollama availability
  const checkOllama = useCallback(async () => {
    setIsChecking(true);
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsAvailable(true);
        setInstalledModels(data.models || []);
        return true;
      }
    } catch (err) {
      console.log('Ollama not available:', err.message);
    }
    setIsAvailable(false);
    setInstalledModels([]);
    setIsChecking(false);
    return false;
  }, []);

  // Initial check
  useEffect(() => {
    checkOllama().finally(() => setIsChecking(false));
    
    // Check every 30 seconds
    const interval = setInterval(() => {
      checkOllama();
    }, 30000);

    return () => clearInterval(interval);
  }, [checkOllama]);

  // Save chat history
  const saveChatHistory = useCallback(async (history) => {
    try {
      const settings = await window.electronAPI.getAppSettings() || {};
      settings.ollama = settings.ollama || {};
      settings.ollama.chatHistory = history.slice(-50); // Keep last 50 messages
      await window.electronAPI.saveAppSettings(settings);
    } catch (err) {
      console.error('Failed to save chat history:', err);
    }
  }, []);

  // Save active model
  const saveActiveModel = useCallback(async (model) => {
    try {
      const settings = await window.electronAPI.getAppSettings() || {};
      settings.ollama = settings.ollama || {};
      settings.ollama.activeModel = model;
      await window.electronAPI.saveAppSettings(settings);
    } catch (err) {
      console.error('Failed to save active model:', err);
    }
  }, []);

  // Send message to Ollama (using /api/chat for better conversation support)
  const sendMessage = useCallback(async (message, systemPrompt = null) => {
    if (!isAvailable || isGenerating) return null;

    setIsGenerating(true);
    
    const userMessage = { role: 'user', content: message, timestamp: Date.now() };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);

    try {
      // Build messages array for chat API
      const messages = [
        { 
          role: 'system', 
          content: systemPrompt || 'Du bist ein hilfreicher Assistent für E-Mail-Kommunikation. Antworte immer auf Deutsch, es sei denn, der Benutzer schreibt in einer anderen Sprache.'
        },
        ...chatHistory.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: message }
      ];

      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activeModel,
          messages: messages,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        if (response.status === 404) {
          throw new Error(`Modell "${activeModel}" nicht gefunden. Bitte stelle sicher, dass das Modell installiert ist.`);
        }
        throw new Error(`Ollama API Fehler: ${response.status}${errorText ? ` - ${errorText}` : ''}`);
      }

      const data = await response.json();
      const assistantMessage = { 
        role: 'assistant', 
        content: data.message?.content || data.response || 'Keine Antwort erhalten',
        timestamp: Date.now(),
        model: activeModel
      };
      
      const updatedHistory = [...newHistory, assistantMessage];
      setChatHistory(updatedHistory);
      saveChatHistory(updatedHistory);
      
      return data.message?.content || data.response;
    } catch (err) {
      console.error('Ollama chat error:', err);
      let errorContent = `Fehler: ${err.message}`;
      
      // Better error messages
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        errorContent = 'Ollama ist nicht erreichbar. Bitte starte Ollama mit "ollama serve" oder überprüfe ob der Dienst läuft.';
      }
      
      const errorMessage = { 
        role: 'assistant', 
        content: errorContent,
        timestamp: Date.now(),
        isError: true
      };
      const updatedHistory = [...newHistory, errorMessage];
      setChatHistory(updatedHistory);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [isAvailable, isGenerating, chatHistory, activeModel, saveChatHistory]);

  // Send message with streaming (for typing effect) - using /api/chat
  const sendMessageStreaming = useCallback(async (message, onChunk, systemPrompt = null) => {
    if (!isAvailable || isGenerating) return null;

    setIsGenerating(true);
    
    const userMessage = { role: 'user', content: message, timestamp: Date.now() };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);

    let fullResponse = '';

    try {
      // Build messages array for chat API
      const messages = [
        { 
          role: 'system', 
          content: systemPrompt || 'Du bist ein hilfreicher Assistent für E-Mail-Kommunikation. Antworte immer auf Deutsch, es sei denn, der Benutzer schreibt in einer anderen Sprache.'
        },
        ...chatHistory.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: message }
      ];

      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activeModel,
          messages: messages,
          stream: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        if (response.status === 404) {
          throw new Error(`Modell "${activeModel}" nicht gefunden. Bitte installiere es mit: ollama pull ${activeModel}`);
        }
        throw new Error(`Ollama API Fehler: ${response.status}${errorText ? ` - ${errorText}` : ''}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            // Chat API returns content in message.content
            if (data.message?.content) {
              fullResponse += data.message.content;
              onChunk(fullResponse);
            }
          } catch (e) {
            // Ignore parse errors for partial JSON
          }
        }
      }

      const assistantMessage = { 
        role: 'assistant', 
        content: fullResponse,
        timestamp: Date.now(),
        model: activeModel
      };
      
      const updatedHistory = [...newHistory, assistantMessage];
      setChatHistory(updatedHistory);
      saveChatHistory(updatedHistory);
      
      return fullResponse;
    } catch (err) {
      console.error('Ollama streaming error:', err);
      let errorContent = `Fehler: ${err.message}`;
      
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        errorContent = 'Ollama ist nicht erreichbar. Bitte starte Ollama mit "ollama serve" oder überprüfe ob der Dienst läuft.';
      }
      
      const errorMessage = { 
        role: 'assistant', 
        content: errorContent,
        timestamp: Date.now(),
        isError: true
      };
      const updatedHistory = [...newHistory, errorMessage];
      setChatHistory(updatedHistory);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [isAvailable, isGenerating, chatHistory, activeModel, saveChatHistory]);

  // Generate without adding to chat history (for email functions) - using /api/chat
  const generate = useCallback(async (prompt, systemPrompt = null) => {
    if (!isAvailable) return null;

    try {
      const messages = [
        { 
          role: 'system', 
          content: systemPrompt || 'Du bist ein hilfreicher E-Mail-Assistent. Antworte immer auf Deutsch.'
        },
        { role: 'user', content: prompt }
      ];

      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activeModel,
          messages: messages,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        if (response.status === 404) {
          throw new Error(`Modell "${activeModel}" nicht gefunden`);
        }
        throw new Error(`Ollama API Fehler: ${response.status}${errorText ? ` - ${errorText}` : ''}`);
      }

      const data = await response.json();
      return data.message?.content || data.response || null;
    } catch (err) {
      console.error('Ollama generate error:', err);
      return null;
    }
  }, [isAvailable, activeModel]);

  // Email specific functions
  const summarizeEmail = useCallback(async (emailContent, subject) => {
    const prompt = `Fasse die folgende E-Mail kurz und prägnant zusammen (max. 3 Sätze):

Betreff: ${subject}

${emailContent}`;
    
    return generate(prompt, 'Du bist ein E-Mail-Assistent. Fasse E-Mails präzise zusammen.');
  }, [generate]);

  const suggestReply = useCallback(async (emailContent, subject, senderName) => {
    const prompt = `Erstelle einen professionellen Antwort-Entwurf für die folgende E-Mail:

Von: ${senderName}
Betreff: ${subject}

${emailContent}

Erstelle eine höfliche, professionelle Antwort auf Deutsch.`;
    
    return generate(prompt, 'Du bist ein E-Mail-Assistent. Erstelle professionelle E-Mail-Antworten.');
  }, [generate]);

  const improveText = useCallback(async (text, instruction = 'verbessern') => {
    const prompt = `${instruction} den folgenden Text:

${text}`;
    
    return generate(prompt, 'Du bist ein Textverbesserungs-Assistent. Halte den ursprünglichen Sinn bei.');
  }, [generate]);

  // v1.8.0: Set email context for AI access
  const setCurrentEmailContext = useCallback((email) => {
    if (email) {
      setEmailContext({
        subject: email.subject,
        from: email.from,
        to: email.to,
        date: email.date,
        content: email.text || email.html?.replace(/<[^>]*>/g, '') || '',
        hasAttachments: email.attachments?.length > 0
      });
    } else {
      setEmailContext(null);
    }
  }, []);

  // v1.8.0: Generate with email context
  const generateWithEmailContext = useCallback(async (prompt) => {
    if (!isAvailable || !emailContext) return null;

    const contextPrompt = `Du hast Zugriff auf die folgende E-Mail:

Von: ${emailContext.from}
An: ${emailContext.to}
Betreff: ${emailContext.subject}
Datum: ${emailContext.date}
${emailContext.hasAttachments ? '(Hat Anhänge)' : ''}

Inhalt:
${emailContext.content}

---

Benutzer-Anfrage: ${prompt}`;

    return generate(contextPrompt, 'Du bist ein E-Mail-Assistent mit Zugriff auf die aktuelle E-Mail. Antworte hilfreich und präzise.');
  }, [isAvailable, emailContext, generate]);

  // v1.8.0: Compose email with AI help
  const composeEmail = useCallback(async (instruction, context = null) => {
    const contextInfo = context ? `

Kontext:
- Empfänger: ${context.to || 'Nicht angegeben'}
- Betreff: ${context.subject || 'Nicht angegeben'}
- Bisheriger Text: ${context.currentText || 'Leer'}
${emailContext ? `
- Bezug auf E-Mail von: ${emailContext.from}
- Ursprünglicher Betreff: ${emailContext.subject}
` : ''}` : '';

    const prompt = `${instruction}${contextInfo}

Erstelle eine professionelle E-Mail auf Deutsch.`;

    return generate(prompt, 'Du bist ein E-Mail-Assistent. Erstelle professionelle, gut strukturierte E-Mails.');
  }, [emailContext, generate]);

  // v1.8.2: Search across all mailboxes
  const searchAllMailboxes = useCallback(async (searchQuery) => {
    if (!window.electronAPI) return [];
    
    try {
      // Get all accounts
      const accountsData = await window.electronAPI.loadAccounts();
      const accounts = accountsData || [];
      
      const results = [];
      
      for (const account of accounts) {
        try {
          // Fetch emails from inbox
          const inboxResult = await window.electronAPI.fetchEmailsForAccount(account.id, { limit: 30 });
          if (inboxResult.success && inboxResult.emails) {
            const matchingEmails = inboxResult.emails.filter(email => {
              const searchLower = searchQuery.toLowerCase();
              return (
                email.subject?.toLowerCase().includes(searchLower) ||
                email.from?.toLowerCase().includes(searchLower) ||
                email.preview?.toLowerCase().includes(searchLower)
              );
            });
            
            results.push(...matchingEmails.map(email => ({
              ...email,
              accountId: account.id,
              accountName: account.name
            })));
          }
        } catch (err) {
          console.warn(`Could not search in account ${account.name}:`, err);
        }
      }
      
      return results;
    } catch (err) {
      console.error('Error searching mailboxes:', err);
      return [];
    }
  }, []);

  // v1.8.2: AI-powered search with context from all mailboxes
  const aiSearchMailboxes = useCallback(async (userQuery) => {
    if (!isAvailable) return null;
    
    // First, search for relevant emails
    const searchResults = await searchAllMailboxes(userQuery);
    
    if (searchResults.length === 0) {
      return generate(
        `Der Benutzer fragt: "${userQuery}"\n\nEs wurden keine passenden E-Mails gefunden. Bitte informiere den Benutzer höflich darüber.`,
        'Du bist ein E-Mail-Assistent. Der Benutzer hat nach E-Mails gesucht, aber keine wurden gefunden.'
      );
    }
    
    // Build context from search results
    const emailSummaries = searchResults.slice(0, 10).map((email, i) => 
      `${i + 1}. [${email.accountName}] Von: ${email.from}, Betreff: "${email.subject}", Datum: ${new Date(email.date).toLocaleDateString('de-DE')}`
    ).join('\n');
    
    const prompt = `Der Benutzer fragt: "${userQuery}"

Gefundene E-Mails (${searchResults.length} Treffer):
${emailSummaries}

Bitte beantworte die Anfrage des Benutzers basierend auf diesen E-Mails. Wenn der Benutzer nach bestimmten Informationen sucht, versuche diese aus den E-Mails zu extrahieren.`;

    return generate(prompt, 'Du bist ein intelligenter E-Mail-Assistent mit Zugriff auf alle Postfächer des Benutzers. Beantworte Fragen präzise basierend auf den gefundenen E-Mails.');
  }, [isAvailable, searchAllMailboxes, generate]);

  // v1.8.2: Get email statistics across all accounts
  const getMailboxStats = useCallback(async () => {
    if (!window.electronAPI) return null;
    
    try {
      const accountsData = await window.electronAPI.loadAccounts();
      const accounts = accountsData || [];
      
      const stats = {
        totalAccounts: accounts.length,
        accounts: []
      };
      
      for (const account of accounts) {
        try {
          const inboxResult = await window.electronAPI.fetchEmailsForAccount(account.id, { limit: 50 });
          if (inboxResult.success) {
            const unreadCount = inboxResult.emails.filter(e => !e.seen).length;
            stats.accounts.push({
              name: account.name,
              totalEmails: inboxResult.emails.length,
              unreadEmails: unreadCount,
              hasMore: inboxResult.hasMore
            });
          }
        } catch (err) {
          console.warn(`Could not get stats for account ${account.name}:`, err);
        }
      }
      
      return stats;
    } catch (err) {
      console.error('Error getting mailbox stats:', err);
      return null;
    }
  }, []);

  // Pull/Download a model
  const pullModel = useCallback(async (modelName) => {
    if (!isAvailable) return false;

    setDownloadProgress({ model: modelName, status: 'starting', progress: 0 });

    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, stream: true })
      });

      if (!response.ok) {
        throw new Error(`Pull error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.total && data.completed) {
              const progress = Math.round((data.completed / data.total) * 100);
              setDownloadProgress({ 
                model: modelName, 
                status: data.status || 'downloading',
                progress 
              });
            } else if (data.status) {
              setDownloadProgress({ 
                model: modelName, 
                status: data.status,
                progress: data.status === 'success' ? 100 : 0
              });
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }

      setDownloadProgress(null);
      await checkOllama(); // Refresh model list
      return true;
    } catch (err) {
      console.error('Pull model error:', err);
      setDownloadProgress(null);
      return false;
    }
  }, [isAvailable, checkOllama]);

  // Delete a model
  const deleteModel = useCallback(async (modelName) => {
    if (!isAvailable) return false;

    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      });

      if (response.ok) {
        await checkOllama(); // Refresh model list
        return true;
      }
    } catch (err) {
      console.error('Delete model error:', err);
    }
    return false;
  }, [isAvailable, checkOllama]);

  // Clear chat history
  const clearChat = useCallback(() => {
    setChatHistory([]);
    saveChatHistory([]);
  }, [saveChatHistory]);

  // Change active model
  const changeModel = useCallback((model) => {
    setActiveModel(model);
    saveActiveModel(model);
  }, [saveActiveModel]);

  const value = {
    // State
    isAvailable,
    isChecking,
    installedModels,
    activeModel,
    chatHistory,
    isGenerating,
    downloadProgress,
    emailContext, // v1.8.0
    
    // Actions
    checkOllama,
    sendMessage,
    sendMessageStreaming,
    generate,
    summarizeEmail,
    suggestReply,
    improveText,
    pullModel,
    deleteModel,
    clearChat,
    changeModel,
    // v1.8.0: Email context functions
    setCurrentEmailContext,
    generateWithEmailContext,
    composeEmail,
    // v1.8.2: Multi-mailbox AI functions
    searchAllMailboxes,
    aiSearchMailboxes,
    getMailboxStats
  };

  return (
    <OllamaContext.Provider value={value}>
      {children}
    </OllamaContext.Provider>
  );
};

export const useOllama = () => {
  const context = useContext(OllamaContext);
  if (!context) {
    throw new Error('useOllama must be used within an OllamaProvider');
  }
  return context;
};

export default OllamaContext;
