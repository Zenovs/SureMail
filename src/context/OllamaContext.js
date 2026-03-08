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

  // Send message to Ollama (with streaming)
  const sendMessage = useCallback(async (message, systemPrompt = null) => {
    if (!isAvailable || isGenerating) return null;

    setIsGenerating(true);
    
    const userMessage = { role: 'user', content: message, timestamp: Date.now() };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);

    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activeModel,
          prompt: message,
          system: systemPrompt || 'Du bist ein hilfreicher Assistent für E-Mail-Kommunikation. Antworte immer auf Deutsch, es sei denn, der Benutzer schreibt in einer anderen Sprache.',
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = { 
        role: 'assistant', 
        content: data.response,
        timestamp: Date.now(),
        model: activeModel
      };
      
      const updatedHistory = [...newHistory, assistantMessage];
      setChatHistory(updatedHistory);
      saveChatHistory(updatedHistory);
      
      return data.response;
    } catch (err) {
      console.error('Ollama generate error:', err);
      const errorMessage = { 
        role: 'assistant', 
        content: `Fehler: ${err.message}`,
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

  // Send message with streaming (for typing effect)
  const sendMessageStreaming = useCallback(async (message, onChunk, systemPrompt = null) => {
    if (!isAvailable || isGenerating) return null;

    setIsGenerating(true);
    
    const userMessage = { role: 'user', content: message, timestamp: Date.now() };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);

    let fullResponse = '';

    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activeModel,
          prompt: message,
          system: systemPrompt || 'Du bist ein hilfreicher Assistent für E-Mail-Kommunikation. Antworte immer auf Deutsch, es sei denn, der Benutzer schreibt in einer anderen Sprache.',
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
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
            if (data.response) {
              fullResponse += data.response;
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
      const errorMessage = { 
        role: 'assistant', 
        content: `Fehler: ${err.message}`,
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

  // Generate without adding to chat history (for email functions)
  const generate = useCallback(async (prompt, systemPrompt = null) => {
    if (!isAvailable) return null;

    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activeModel,
          prompt: prompt,
          system: systemPrompt || 'Du bist ein hilfreicher E-Mail-Assistent. Antworte immer auf Deutsch.',
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
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
    changeModel
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
