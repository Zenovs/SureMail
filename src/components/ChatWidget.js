import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useOllama } from '../context/OllamaContext';

const ChatWidget = () => {
  const { currentTheme } = useTheme();
  const { 
    isAvailable, 
    isChecking, 
    chatHistory, 
    isGenerating, 
    activeModel,
    sendMessageStreaming,
    clearChat
  } = useOllama();
  
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [streamingResponse, setStreamingResponse] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const c = currentTheme.colors;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, streamingResponse]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!message.trim() || isGenerating) return;
    
    const userMessage = message.trim();
    setMessage('');
    setStreamingResponse('');
    
    await sendMessageStreaming(userMessage, (chunk) => {
      setStreamingResponse(chunk);
    });
    
    setStreamingResponse('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-50 transition-all duration-200 hover:scale-110 ${
          isAvailable 
            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400' 
            : 'bg-gray-600 cursor-default'
        }`}
        title={isAvailable ? 'KI-Assistent öffnen' : 'Ollama nicht verfügbar'}
      >
        <MessageCircle className="w-7 h-7 text-white" />
        {!isChecking && !isAvailable && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px]">
            !
          </span>
        )}
      </button>
    );
  }

  // Chat panel when open
  return (
    <div 
      className={`fixed bottom-6 right-6 w-[380px] h-[550px] ${c.bgSecondary} rounded-2xl shadow-2xl flex flex-col z-50 border ${c.border} overflow-hidden`}
      style={{ 
        animation: 'slideUp 0.2s ease-out',
      }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${c.border} bg-gradient-to-r from-cyan-500/10 to-blue-500/10`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className={`font-semibold ${c.text}`}>KI-Assistent</h3>
            <p className={`text-xs ${c.textMuted}`}>
              {isAvailable ? (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  {activeModel}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Ollama nicht verfügbar
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className={`p-2 rounded-lg hover:${c.bgHover} transition-colors`}
            title="Chat löschen"
          >
            <span className="text-lg">🗑️</span>
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className={`p-2 rounded-lg hover:${c.bgHover} transition-colors`}
            title="Schließen"
          >
            <span className="text-lg">✕</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 && !streamingResponse && (
          <div className={`text-center py-8 ${c.textMuted}`}>
            <span className="text-4xl mb-4 block">💬</span>
            <p className="text-sm">Wie kann ich dir helfen?</p>
            <p className="text-xs mt-2 opacity-60">
              Frag mich zum Beispiel:<br/>
              "Fasse diese E-Mail zusammen" oder<br/>
              "Hilf mir eine Antwort zu schreiben"
            </p>
          </div>
        )}

        {chatHistory.map((msg) => (
          <div
            key={msg.timestamp}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-br-md'
                  : msg.isError
                    ? 'bg-red-500/20 text-red-400 rounded-bl-md'
                    : `${c.bg} ${c.text} rounded-bl-md border ${c.border}`
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
              <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-white/70' : c.textMuted}`}>
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {/* Streaming response */}
        {streamingResponse && (
          <div className="flex justify-start">
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${c.bg} ${c.text} rounded-bl-md border ${c.border}`}>
              <p className="text-sm whitespace-pre-wrap break-words">{streamingResponse}</p>
              <span className="inline-block w-1.5 h-4 bg-cyan-500 animate-pulse ml-0.5"></span>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {isGenerating && !streamingResponse && (
          <div className="flex justify-start">
            <div className={`px-4 py-3 rounded-2xl ${c.bg} rounded-bl-md border ${c.border}`}>
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`p-3 border-t ${c.border}`}>
        {!isAvailable ? (
          <div className={`text-center py-2 px-4 rounded-lg bg-red-500/10 ${c.textMuted}`}>
            <p className="text-sm">Ollama ist nicht verfügbar.</p>
            <p className="text-xs mt-1">Stelle sicher, dass Ollama läuft.</p>
          </div>
        ) : (
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nachricht eingeben..."
              rows={1}
              disabled={isGenerating}
              className={`flex-1 px-4 py-2.5 rounded-xl ${c.bg} ${c.text} border ${c.border} focus:border-cyan-500 focus:outline-none resize-none text-sm placeholder:${c.textMuted}`}
              style={{ maxHeight: '80px' }}
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || isGenerating}
              className={`px-4 py-2.5 rounded-xl font-medium transition-all ${
                message.trim() && !isGenerating
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span className="text-lg">📤</span>
            </button>
          </div>
        )}
      </div>

      <style jsx="true">{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ChatWidget;
