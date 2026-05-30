"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();
  const [hasTimeout, setHasTimeout] = React.useState(false);

  useEffect(() => {
    // Check dark mode preference
    if (typeof window !== 'undefined') {
      const isDark = localStorage.getItem('theme') === 'dark' || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    const timer = setTimeout(() => {
      setHasTimeout(true);
    }, 5000);

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        clearTimeout(timer);
        if (session) {
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      } catch (err) {
        clearTimeout(timer);
        setHasTimeout(true);
      }
    };
    checkAuth();

    return () => clearTimeout(timer);
  }, [router]);

  if (hasTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
          <p className="text-sm font-bold text-rose-400">A conexão está demorando mais do que o esperado.</p>
          <p className="text-xs text-zinc-400">Verifique sua rede ou tente prosseguir diretamente para a página de acesso.</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-teal-500/10 cursor-pointer"
          >
            Acessar Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-zinc-400">Direcionando para o portal...</p>
      </div>
    </div>
  );
}
