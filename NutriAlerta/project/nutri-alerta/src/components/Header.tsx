import React from 'react';
import { UserCircle, Menu, Map, Users, Stethoscope, Bot, LogOut } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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

const navItems = [
  { id: 'map' as const, label: 'Mapa de Risco', icon: Map },
  { id: 'schools' as const, label: 'Análise Escolar', icon: Users },
  { id: 'comparison' as const, label: 'Comparador UBS', icon: Stethoscope },
  { id: 'consultant' as const, label: 'Consultor', icon: Bot },
];

export default function Header() {
  const { viewMode, setViewMode, sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white/95 dark:bg-[#121316]/95 backdrop-blur-2xl border-b border-slate-200 dark:border-[#1f2229] px-6 flex items-center justify-between sticky top-0 z-40 transition-colors duration-300">
      {/* Brand */}
      <div className="flex items-center gap-3">
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-[#f5f5f7] hover:bg-slate-100/80 dark:hover:bg-zinc-800 transition-all cursor-pointer flex items-center justify-center mr-1"
            title="Expandir barra lateral"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <motion.div 
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 rounded-xl shadow-md shadow-teal-500/10 flex items-center justify-center cursor-pointer transition-all duration-300"
        >
          <NutriAlertaLogo className="w-5 h-5 text-white" />
        </motion.div>
        <div>
          <h1 className="text-sm font-bold text-slate-800 dark:text-[#f5f5f7] tracking-tight">NutriAlerta</h1>
          <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-semibold tracking-wider">RIO CLARO · SP · Nutri for Schools 2025</p>
        </div>
      </div>

      {/* Middle Pill - Sliding Segmented Control */}
      <div className="flex items-center bg-slate-100/80 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800/80 rounded-xl p-1 gap-0.5 shadow-inner relative z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = viewMode === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setViewMode(item.id)}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-300 cursor-pointer flex items-center gap-1.5 select-none ${
                isActive
                  ? 'text-white dark:text-zinc-900'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-[#f5f5f7]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-teal-600 dark:bg-teal-400 rounded-lg -z-10 shadow-[0_2px_8px_rgba(13,148,136,0.2)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* User & Logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-700 dark:text-[#f5f5f7]">FATEC Rio Claro</p>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Administrador</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-slate-400 dark:text-zinc-500" />
          </div>
        </div>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-xl text-slate-500 hover:text-red-600 dark:text-[#a1a1aa] dark:hover:text-red-400 hover:bg-slate-100/80 dark:hover:bg-zinc-800/80 transition-all cursor-pointer flex items-center justify-center"
          title="Sair do Sistema"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
