"use client";
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

const SESSION_KEY = 'nutribot_guia_session';

function getSessionId() {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = 'guia-' + Math.random().toString(36).slice(2, 9);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Olá! Sou o NutriAI Guia. Posso explicar como usar o dashboard, o que cada gráfico significa, e como interpretar os dados. Como posso ajudar?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: getSessionId(),
          message: text,
          context: {
            screenData: {
              tipo: 'guia',
            }
          }
        })
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.response || data.error || 'Sem resposta.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Erro de conexão com a API.' }]);
    }

    setLoading(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] shadow-2xl rounded-2xl w-80 h-96 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 transition-colors duration-300">
          {/* Header */}
          <div className="bg-slate-50 dark:bg-zinc-800/40 border-b border-slate-200 dark:border-[#2c2c2e] p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-teal-50 dark:bg-teal-950/40 p-2 rounded-lg border border-teal-100 dark:border-teal-900/60 flex items-center justify-center">
                <Bot className="w-5 h-5 text-teal-600 dark:text-teal-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-[#f5f5f7] text-sm">NutriAI Guia</h3>
                <p className="text-[10px] text-teal-600 dark:text-teal-500 font-bold">Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-[#f5f5f7] transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-white dark:bg-[#1c1c1e] scrollbar-thin">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-2xl p-3 max-w-[85%] text-xs font-semibold ${
                  msg.role === 'user'
                    ? 'bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50 text-teal-800 dark:text-teal-300 self-end rounded-tr-none shadow-sm'
                    : 'bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-[#2c2c2e] text-slate-700 dark:text-zinc-200 self-start rounded-tl-none shadow-sm'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-[#2c2c2e] rounded-2xl rounded-tl-none p-3 max-w-[85%] self-start shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-200 dark:border-[#2c2c2e] bg-slate-50/50 dark:bg-[#1c1c1e]/50">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Pergunte sobre os dados..."
                className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-[#2c2c2e] rounded-full py-2 pl-4 pr-10 text-xs font-semibold text-slate-800 dark:text-[#f5f5f7] placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all shadow-sm"
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="absolute right-2 top-1.5 text-teal-600 dark:text-teal-500 hover:text-teal-700 dark:hover:text-teal-400 disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-teal-600 dark:bg-teal-600 hover:bg-teal-700 dark:hover:bg-teal-700 text-white p-4 rounded-full shadow-lg shadow-teal-500/20 transition-all hover:scale-105 flex items-center justify-center cursor-pointer"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
