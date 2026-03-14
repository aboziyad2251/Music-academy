"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Music, X, Send, Star, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Message {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  suggestions?: string[];
  timestamp: number;
}

const QUICK_QUESTIONS = [
  "ما هو مقام الراست؟",
  "كيف أبدأ تعلم العود؟",
  "اشرح لي السلم العربي"
];

const LOCAL_STORAGE_KEY = "maqam_chat_history";

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { t, lang } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load history
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        // Initial greeting
        setMessages([{
          id: 'init',
          role: 'ai',
          content: t.chat.greeting,
          timestamp: Date.now()
        }]);
      }
    } catch (e) {
      console.error('Failed to load chat history', e);
    }
  }, [t.chat.greeting]);

  // Save history
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const toggleChat = () => setIsOpen(!isOpen);

  const clearHistory = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setMessages([{
      id: Date.now().toString(),
      role: 'ai',
      content: t.chat.greeting,
      timestamp: Date.now()
    }]);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/music-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language: lang,
          context: 'general'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch');
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.response || (lang === 'ar' ? 'عذراً، حدث خطأ.' : 'Sorry, an error occurred.'),
        suggestions: data.suggestions || [],
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: error.message || t.chat.error,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const isRtl = lang === 'ar';

  return (
    <div 
      className={cn("fixed z-[100] transition-all duration-300", isRtl ? "bottom-6 left-6" : "bottom-6 right-6")} 
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="bg-[var(--gold)] hover:bg-[var(--gold-light)] text-white p-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] transform hover:scale-105 transition-all flex items-center justify-center"
          aria-label="Open AI Tutor"
        >
          <Music size={28} className="text-white drop-shadow-md" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="bg-[var(--dark)] border border-[var(--dark-3)] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] w-[380px] h-[520px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          <style jsx global>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: var(--dark-3);
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: var(--teal);
            }
          `}</style>
          
          {/* Header */}
          <div className="bg-[var(--dark-2)] px-4 py-3 border-b border-[var(--dark-3)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[var(--teal)]/20 p-2 rounded-lg">
                <Star size={20} className="text-[var(--teal)] fill-current" />
              </div>
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <span className={isRtl ? "font-amiri text-lg tracking-wide" : "font-sans"}>
                    {t.chat.title}
                  </span>
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={clearHistory} className="p-2 hover:bg-[var(--dark-3)] rounded-lg text-gray-400 hover:text-white transition-colors" title={t.chat.clearHistory}>
                <Trash2 size={16} />
              </button>
              <button onClick={toggleChat} className="p-2 hover:bg-[var(--dark-3)] rounded-lg text-gray-400 hover:text-white transition-colors" title={t.chat.close}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={msg.id} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                <div 
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm",
                    msg.role === 'user' 
                      ? "bg-[var(--gold)] text-white rounded-br-none rtl:rounded-br-2xl rtl:rounded-bl-none" 
                      : msg.role === 'system'
                        ? "bg-red-900/50 text-red-200 border border-red-800 font-mono text-xs"
                        : "bg-[var(--dark-3)] text-[var(--cream)] rounded-bl-none rtl:rounded-bl-2xl rtl:rounded-br-none"
                  )}
                >
                  <div className={cn(
                    "whitespace-pre-wrap text-start", 
                    (msg.role !== 'system' && lang === 'ar') ? "font-amiri text-lg leading-relaxed" : "text-sm"
                  )}>
                    {msg.content}
                  </div>
                </div>
                
                {/* Suggestions Chips */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className={cn("flex flex-wrap gap-2 mt-2", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    {msg.suggestions.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => sendMessage(sug)}
                        className="text-xs bg-[var(--dark-2)] hover:bg-[var(--teal)]/20 text-[var(--teal)] border border-[var(--teal)]/30 px-3 py-1.5 rounded-full transition-colors font-amiri tracking-wide"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start">
                <div className="bg-[var(--dark-3)] text-gray-300 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm">
                  <div className="flex space-x-1.5 items-center justify-center h-4">
                    <div className="w-2 h-2 rounded-full bg-[var(--gold)] animate-[bounce_1s_infinite_0ms]"></div>
                    <div className="w-2 h-2 rounded-full bg-[var(--gold)] animate-[bounce_1s_infinite_200ms]"></div>
                    <div className="w-2 h-2 rounded-full bg-[var(--gold)] animate-[bounce_1s_infinite_400ms]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.filter(m => m.role === 'user').length === 0 && (
            <div className="px-4 pb-2 space-y-2">
              <div className="flex flex-wrap gap-2">
                {QUICK_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="text-xs bg-transparent hover:bg-[var(--dark-3)] text-[var(--gold)] border border-[var(--gold)]/30 px-3 py-1.5 rounded-full transition-colors font-amiri"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 border-t border-[var(--dark-3)] bg-[var(--dark-2)]">
            <form 
              onSubmit={(e) => { e.preventDefault(); sendMessage(inputValue); }}
              className="flex items-center gap-2 bg-[var(--dark)] border border-[var(--dark-3)] rounded-full px-1 py-1 focus-within:border-[var(--gold)] focus-within:ring-1 focus-within:ring-[var(--gold)] transition-all"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t.chat.placeholder}
                className={cn(
                  "flex-1 bg-transparent border-none focus:outline-none focus:ring-0 px-4 py-2 text-white placeholder-gray-500",
                  lang === 'ar' ? "font-amiri text-lg" : "text-sm",
                  "m-0"
                )}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="bg-[var(--gold)] hover:bg-[var(--gold-light)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--dark)] p-2 rounded-full transition-colors flex items-center justify-center min-w-[36px] min-h-[36px]"
              >
                <Send size={18} className={cn("text-[var(--dark)]", isRtl ? "rotate-180" : "")} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
