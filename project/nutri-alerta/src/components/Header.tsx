"use client";
import React from 'react';
import { Activity, UserCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function Header() {
  const { viewMode, setViewMode } = useAppStore();

  return (
    <header className="h-16 bg-[#0B0E14]/90 backdrop-blur-2xl border-b border-white/5 px-6 flex items-center justify-between sticky top-0 z-40 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="bg-[#00ff9d]/10 p-2 rounded-xl border border-[#00ff9d]/20 shadow-[0_0_15px_rgba(0,255,157,0.15)]">
          <Activity className="w-5 h-5 text-[#00ff9d]" />
        </div>
        <div>
          <h1 className="text-base font-black text-white tracking-tight">NutriAlerta <span className="text-[#00ff9d]">PRO</span></h1>
          <p className="text-[10px] text-white/50 font-medium tracking-wider">RIO CLARO · SP · SISVAN 2025</p>
        </div>
      </div>

      {/* View Toggle — pill segmented control */}
      <div className="flex items-center bg-[#131823] border border-white/10 rounded-xl p-1 gap-1 shadow-inner">
        <button
          onClick={() => setViewMode('expert')}
          className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
            viewMode === 'expert'
              ? 'bg-[#00ff9d] text-[#0B0E14] shadow-[0_0_15px_rgba(0,255,157,0.4)]'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          Especialista
        </button>
        <button
          onClick={() => setViewMode('consultant')}
          className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
            viewMode === 'consultant'
              ? 'bg-[#00ff9d] text-[#0B0E14] shadow-[0_0_15px_rgba(0,255,157,0.4)]'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          Consultor IA
        </button>
      </div>

      {/* User */}
      <div className="flex items-center gap-3 cursor-pointer group">
        <div className="text-right hidden md:block">
          <p className="text-xs font-bold text-white group-hover:text-[#00ff9d] transition-colors">Dra. Amanda Silva</p>
          <p className="text-[10px] text-white/50">Vigilância Epidemiológica</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#131823] border border-white/10 flex items-center justify-center group-hover:border-[#00ff9d]/50 group-hover:shadow-[0_0_15px_rgba(0,255,157,0.2)] transition-all">
          <UserCircle className="w-6 h-6 text-white/70 group-hover:text-[#00ff9d] transition-colors" />
        </div>
      </div>
    </header>
  );
}
