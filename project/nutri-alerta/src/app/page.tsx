"use client";
import React, { useEffect } from 'react';
import Header from '@/components/Header';
import ExpertView from '@/components/ExpertView';
import ConsultantView from '@/components/ConsultantView';
import ChatbotWidget from '@/components/ChatbotWidget';
import { useAppStore } from '@/store/useAppStore';
import { AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const { viewMode, initializeData, darkMode } = useAppStore();

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // Sync dark class on HTML element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans relative transition-colors duration-300">
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
