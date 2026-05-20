"use client";
import React from 'react';
import { UserCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { motion } from 'framer-motion';

// Gemini / Samsung AI Sparkles Icon
export function SparklesIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Large Star */}
      <path d="M10 2Q10 9 17 9Q10 9 10 16Q10 9 3 9Q10 9 10 2Z" />
      {/* Small Star */}
      <path d="M19 12Q19 16 23 16Q19 16 19 20Q19 16 15 16Q19 16 19 12Z" />
    </svg>
  );
}

// Simple, elegant, bold "N" logo inspired by Apple (SF Pro Rounded style)
export function NutriAlertaLogo({ className = "w-6 h-6 text-white" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path 
        d="M7 17.5V6.5l10 11V6.5" 
        stroke="currentColor" 
        strokeWidth="3.2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Header() {
  const { viewMode, setViewMode } = useAppStore();

  return (
    <header className="h-16 bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-2xl border-b border-slate-200 dark:border-[#2c2c2e] px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm transition-colors duration-300">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <motion.div 
          whileHover={{ scale: 1.08, y: -1 }}
          whileTap={{ scale: 0.95 }}
          className="w-11 h-11 bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 rounded-xl shadow-md shadow-teal-500/10 flex items-center justify-center cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/20"
        >
          <NutriAlertaLogo className="w-6 h-6 text-white" />
        </motion.div>
        <div>
          <h1 className="text-base font-black text-slate-800 dark:text-[#f5f5f7] tracking-tight">NutriAlerta</h1>
          <p className="text-[10px] text-slate-500 dark:text-zinc-450 font-medium tracking-wider">RIO CLARO · SP · SISVAN 2025</p>
        </div>
      </div>

      {/* View Toggle — pill segmented control */}
      <div className="flex items-center bg-slate-100 dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60 rounded-xl p-1 gap-1 shadow-inner">
        <button
          onClick={() => setViewMode('expert')}
          className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
            viewMode === 'expert'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-[#f5f5f7] hover:bg-slate-200/40 dark:hover:bg-zinc-700/40'
          }`}
        >
          Especialista
        </button>
        <button
          onClick={() => setViewMode('consultant')}
          className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-2 ${
            viewMode === 'consultant'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-[#f5f5f7] hover:bg-slate-200/40 dark:hover:bg-zinc-700/40'
          }`}
        >
          Consultor
          <SparklesIcon className={`w-5 h-5 transition-colors duration-300 ${viewMode === 'consultant' ? 'text-amber-300' : 'text-teal-600 dark:text-teal-500'}`} />
        </button>
      </div>

      {/* User */}
      <div className="flex items-center gap-3 cursor-pointer group">
        <div className="text-right hidden md:block">
          <p className="text-xs font-bold text-slate-800 dark:text-[#f5f5f7] group-hover:text-teal-600 transition-colors">FATEC Rio Claro</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center group-hover:border-teal-500/50 group-hover:shadow-sm transition-all">
          <UserCircle className="w-6 h-6 text-slate-400 dark:text-zinc-500 group-hover:text-teal-600 transition-colors" />
        </div>
      </div>
    </header>
  );
}
