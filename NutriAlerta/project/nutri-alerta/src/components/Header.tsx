import React from 'react';
import { UserCircle, Menu, Map, School, Stethoscope, Bot, LogOut, Sun, Moon } from 'lucide-react';
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
  { id: 'schools' as const, label: 'Análise Escolar', icon: School },
  { id: 'comparison' as const, label: 'Comparador UBS', icon: Stethoscope },
  { id: 'consultant' as const, label: 'Consultor', icon: Bot },
];

export default function Header() {
  const { viewMode, setViewMode, sidebarCollapsed, setSidebarCollapsed, darkMode, setDarkMode } = useAppStore();
  const router = useRouter();
  const [userEmail, setUserEmail] = React.useState<string>('Carregando...');

  React.useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      } else {
        setUserEmail('FATEC User');
      }
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      } else {
        setUserEmail('FATEC User');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white/90 dark:bg-[#0c0d10]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-[#1f2229]/65 px-6 flex items-center justify-between sticky top-0 z-40 transition-all duration-300 relative shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Dynamic Top-Premium Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-400 opacity-90" />
      
      {/* Brand */}
      <div className="flex items-center gap-3">
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-[#f5f5f7] hover:bg-slate-100/70 dark:hover:bg-zinc-800/80 transition-all cursor-pointer flex items-center justify-center mr-1"
            title="Expandir barra lateral"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <motion.div 
          whileHover={{ scale: 1.04, y: -0.5 }}
          whileTap={{ scale: 0.96 }}
          className="w-10 h-10 bg-gradient-to-tr from-teal-600 via-teal-550 to-emerald-400 rounded-xl shadow-lg shadow-teal-500/10 flex items-center justify-center cursor-pointer transition-all duration-300"
        >
          <NutriAlertaLogo className="w-5 h-5 text-white" />
        </motion.div>
        <div>
          <h1 className="text-sm font-extrabold text-slate-800 dark:text-[#f5f5f7] tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent">NutriAlerta</h1>
          <p className="text-[9px] text-slate-450 dark:text-zinc-500 font-extrabold tracking-widest uppercase">RIO CLARO · SP · PORTAL DO GESTOR</p>
        </div>
      </div>

      {/* Middle Pill - Sliding Segmented Control */}
      <div className="flex items-center bg-slate-100/70 dark:bg-zinc-900/60 border border-slate-200/50 dark:border-zinc-800/80 rounded-xl p-1 gap-0.5 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.03)] relative z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = viewMode === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setViewMode(item.id)}
              className={`relative px-3.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-colors duration-300 cursor-pointer flex items-center gap-1.5 select-none ${
                isActive
                  ? 'text-white dark:text-zinc-900'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-[#f5f5f7]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-gradient-to-r from-teal-600 to-teal-500 dark:from-teal-400 dark:to-teal-300 rounded-lg -z-10 shadow-[0_2px_8px_rgba(13,148,136,0.22)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden lg:inline">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* User & Logout */}
      <div className="flex items-center gap-3.5">
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-[#a1a1aa] dark:hover:text-[#f5f5f7] hover:bg-slate-100/70 dark:hover:bg-zinc-800/80 transition-all cursor-pointer flex items-center justify-center mr-0.5"
          title={darkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" />
          ) : (
            <Moon className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
          )}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 dark:text-[#f5f5f7]">{userEmail}</p>
            <p className="text-[10px] text-slate-400 dark:text-zinc-550 font-bold uppercase tracking-wider">Administrador</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800/80 flex items-center justify-center shadow-sm">
            <UserCircle className="w-5 h-5 text-slate-400 dark:text-zinc-550" />
          </div>
        </div>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-xl text-slate-400 hover:text-red-600 dark:text-[#a1a1aa] dark:hover:text-red-400 hover:bg-slate-100/70 dark:hover:bg-zinc-800/80 transition-all cursor-pointer flex items-center justify-center"
          title="Sair do Sistema"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
