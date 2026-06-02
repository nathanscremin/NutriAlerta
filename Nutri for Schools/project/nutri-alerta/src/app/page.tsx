"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Página raiz do Nutri for Schools (porta 3001)
 *
 * Comportamento:
 *   - Se há sessão ativa → /dashboard
 *   - Se não há sessão   → volta para http://localhost:3000 (login unificado)
 *
 * O middleware.ts já faz essa verificação no servidor.
 * Este componente serve como fallback client-side para garantir
 * que nenhum usuário sem sessão chegue a esta página sem ser redirecionado.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/dashboard");
      } else {
        // Login unificado está sempre na porta 3000
        const loginFallbackUrl = process.env.NEXT_PUBLIC_NUTRIALERTA_URL || "http://localhost:3000";
        window.location.href = `${loginFallbackUrl}?logout=true`;
      }
    };
    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-zinc-400">Verificando sessão...</p>
      </div>
    </div>
  );
}
