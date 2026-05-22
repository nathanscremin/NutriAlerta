"use client";
import React, { useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ExpertView from '@/components/ExpertView';
import ConsultantView from '@/components/ConsultantView';
import DemographicsSection from '@/components/DemographicsSection';
import UbsComparisonSection from '@/components/UbsComparisonSection';
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
      
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        
        <main className="flex-1 relative overflow-y-auto bg-background transition-colors duration-300">
          <AnimatePresence mode="wait">
            {viewMode === 'map' && <ExpertView key="map" />}
            {viewMode === 'schools' && (
              <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
                <DemographicsSection />
              </div>
            )}
            {viewMode === 'comparison' && (
              <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
                <UbsComparisonSection />
              </div>
            )}
            {viewMode === 'consultant' && <ConsultantView key="consultant" />}
          </AnimatePresence>
        </main>
      </div>

      {/* FAB Chatbot (Apenas nas abas que não sejam o Consultor de IA) */}
      {viewMode !== 'consultant' && <ChatbotWidget />}
    </div>
  );
}
