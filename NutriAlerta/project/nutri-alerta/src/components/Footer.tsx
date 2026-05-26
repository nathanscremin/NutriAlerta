"use client";
import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-slate-950 border-t border-slate-200/50 dark:border-zinc-800/50 py-6 px-8 mt-auto transition-colors duration-300">
      {/* Subtle accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500/30 via-teal-400/40 to-emerald-400/30" />
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="w-8 h-8 bg-teal-100 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/50 rounded-lg flex items-center justify-center text-teal-600 dark:text-teal-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              NutriAlerta
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Vigilância Alimentar e Nutricional</p>
          </div>
        </div>

        <div className="max-w-md">
          <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium leading-relaxed">
            Desenvolvido pela FATEC Rio Claro. Monitoramento preditivo e prevenção da obesidade e desnutrição infantil.
          </p>
        </div>

        <div className="text-xs text-slate-500 dark:text-zinc-500 font-semibold">
          © 2026 Rio Claro, SP
        </div>
      </div>
    </footer>
  );
}
