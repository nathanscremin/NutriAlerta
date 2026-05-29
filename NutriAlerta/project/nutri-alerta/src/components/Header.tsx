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
    <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200/50 dark:border-zinc-800/50 px-8 flex items-center justify-between sticky top-0 z-40 transition-all duration-300 shadow-sm">
      {/* Subtle Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-400 opacity-70" />
      
      {/* Brand Section */}
      <div className="flex items-center gap-4">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 bg-gradient-to-tr from-teal-600 to-teal-500 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 shadow-md"
        >
          <NutriAlertaLogo className="w-5 h-5 text-white" />
        </motion.div>
        <div className="ml-1">
          <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">NutriAlerta</h1>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium tracking-wide uppercase">Rio Claro · SP</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center bg-slate-100/80 dark:bg-zinc-900/60 border border-slate-200/50 dark:border-zinc-800/60 rounded-xl p-1 gap-1.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
        {navItems.map((item) => {
          const isActive = viewMode === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setViewMode(item.id)}
              className={`relative px-4 py-2 rounded-lg text-xs font-bold transition-all duration-250 cursor-pointer flex items-center select-none ${
                isActive
                  ? 'text-teal-600 dark:text-teal-400'
                  : 'text-slate-500 dark:text-zinc-450 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-white dark:bg-zinc-800 shadow-sm border border-slate-200/40 dark:border-zinc-700/35 rounded-lg -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all duration-200 cursor-pointer flex items-center justify-center"
          title={darkMode ? "Modo Claro" : "Modo Escuro"}
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-emerald-500" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600" />
          )}
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3 border-l border-slate-200 dark:border-zinc-800 pl-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{userEmail}</p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Administrador</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-zinc-800 flex items-center justify-center">
            <UserCircle className="w-6 h-6 text-slate-600 dark:text-zinc-400" />
          </div>
        </div>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-slate-400 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 cursor-pointer flex items-center justify-center ml-1"
          title="Sair"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
