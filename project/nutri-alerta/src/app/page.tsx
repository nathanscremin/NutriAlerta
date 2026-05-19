"use client";
import React from 'react';
import Header from '@/components/Header';
import ExpertView from '@/components/ExpertView';
import ConsultantView from '@/components/ConsultantView';
import ChatbotWidget from '@/components/ChatbotWidget';
import { useAppStore } from '@/store/useAppStore';
import { AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const { viewMode } = useAppStore();

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden font-sans relative">
      <Header />
      
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {viewMode === 'expert' ? (
            <ExpertView key="expert" />
          ) : (
            <ConsultantView key="consultant" />
          )}
        </AnimatePresence>
      </main>

      {/* FAB Chatbot (Apenas no modo especialista) */}
      {viewMode === 'expert' && <ChatbotWidget />}
    </div>
  );
}
