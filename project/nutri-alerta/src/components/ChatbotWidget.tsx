"use client";
import React, { useState } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl w-80 h-96 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 p-4 flex justify-between items-center border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <Bot className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 text-sm">NutriAI Guia</h3>
                <p className="text-[10px] text-emerald-400">Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
            <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-3 max-w-[85%] self-start">
              <p className="text-xs text-slate-300">Olá! Sou o seu assistente de dados da saúde. Notei que o Bairro Norte teve um aumento no risco nutricional. Quer analisar os motivos?</p>
            </div>
          </div>
          
          <div className="p-3 border-t border-white/10 bg-black/20">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Pergunte sobre os dados..." 
                className="w-full bg-slate-900 border border-white/10 rounded-full py-2 pl-4 pr-10 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <button className="absolute right-2 top-1.5 text-emerald-400 hover:text-emerald-300">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-white p-4 rounded-full shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 flex items-center justify-center"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
