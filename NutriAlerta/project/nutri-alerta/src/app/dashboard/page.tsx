"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import ExpertView from '@/components/ExpertView';
import ConsultantView from '@/components/ConsultantView';
import DemographicsSection from '@/components/DemographicsSection';
import UbsComparisonSection from '@/components/UbsComparisonSection';
import ChatbotWidget from '@/components/ChatbotWidget';
import { useAppStore } from '@/store/useAppStore';
import { AnimatePresence, motion } from 'framer-motion';

export default function Dashboard() {
  const { viewMode, initializeData, darkMode, setViewMode } = useAppStore();
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setAuthorized(true);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (authorized) {
      initializeData();
    }
  }, [initializeData, authorized]);

  useEffect(() => {
    if (viewMode === 'data-entry') {
      setViewMode('map');
    }
  }, [viewMode, setViewMode]);

  // Sync dark class on HTML element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-zinc-400">Verificando credenciais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans relative transition-colors duration-300">
      <Header />
      
      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 relative overflow-y-auto bg-background transition-colors duration-300">
          <AnimatePresence mode="wait">
            {viewMode === 'map' && <ExpertView key="map" />}
            {viewMode === 'schools' && (
              <motion.div
                key="schools"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="p-6 space-y-6 max-w-7xl mx-auto w-full"
              >
                <DemographicsSection />
              </motion.div>
            )}
            {viewMode === 'comparison' && (
              <motion.div
                key="comparison"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="p-6 space-y-6 max-w-7xl mx-auto w-full"
              >
                <UbsComparisonSection />
              </motion.div>
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
