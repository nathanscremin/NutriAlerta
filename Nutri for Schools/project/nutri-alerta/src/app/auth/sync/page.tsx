"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * /auth/sync — Rota de Sincronização de Sessão Cross-Port
 *
 * Fluxo:
 *   1. O usuário loga na porta 3000 (NutriAlerta) e escolhe "Nutri for Schools".
 *   2. A porta 3000 redireciona para:
 *      http://localhost:3001/auth/sync#access_token=...&refresh_token=...
 *   3. Esta página lê os tokens do hash (fragment), que NUNCA é enviado ao
 *      servidor — só existe no browser — e chama supabase.auth.setSession().
 *   4. Supabase grava o cookie de sessão para localhost:3001.
 *   5. O usuário é redirecionado para /dashboard.
 *
 * Segurança:
 *   - O hash não aparece nos logs do servidor Next.js nem do Supabase.
 *   - A rota só é acessível localmente (localhost), portanto não há risco
 *     de interceptação em ambiente de desenvolvimento.
 *   - Em produção, use subdomínios com domínio compartilhado e cookies
 *     com domain=".seudominio.com" em vez desta estratégia de hash.
 */
export default function AuthSyncPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const run = async () => {
      // ── Lê o hash da URL ──────────────────────────────────────────────────
      // window.location.hash = "#access_token=xxx&refresh_token=yyy"
      const hash = window.location.hash.slice(1); // remove o "#"

      if (!hash) {
        // Nenhum token no hash: o usuário acessou /auth/sync diretamente.
        // Verifica se já possui sessão ativa e redireciona.
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace("/dashboard");
        } else {
          window.location.href = "http://localhost:3000";
        }
        return;
      }

      const params = new URLSearchParams(hash);
      const access_token  = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (!access_token || !refresh_token) {
        setErrorMsg("Token de sessão inválido ou ausente. Redirecionando para o login...");
        setStatus("error");
        setTimeout(() => { window.location.href = "http://localhost:3000"; }, 2500);
        return;
      }

      // ── Estabelece a sessão no Supabase do 3001 ───────────────────────────
      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (error) {
        setErrorMsg(`Falha ao estabelecer sessão: ${error.message}. Redirecionando...`);
        setStatus("error");
        setTimeout(() => { window.location.href = "http://localhost:3000"; }, 2500);
        return;
      }

      // ── Define o cookie de sessão para o middleware ───────────────────────
      const getProjectRef = () => {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
        const match = url.match(/https:\/\/([^.]+)\.supabase\.(co|net)/);
        return match ? match[1] : "peqvaslchaxrewhtxltc";
      };
      const projectRef = getProjectRef();
      const cookieName = `sb-${projectRef}-auth-token`;
      const cookieValue = JSON.stringify({ access_token, refresh_token });
      document.cookie = `${cookieName}=${encodeURIComponent(cookieValue)}; path=/; max-age=604800; SameSite=Lax`;

      // ── Limpa o hash da URL por segurança e redireciona ───────────────────
      // Substituímos o history entry para que os tokens não fiquem no histórico
      // do browser mesmo que o usuário pressione "voltar".
      window.history.replaceState(null, "", "/auth/sync");
      router.replace("/dashboard");
    };

    run();
  }, [router]);

  // ── UI de transição ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
      <div className="flex flex-col items-center gap-4 text-center px-6">
        {status === "loading" ? (
          <>
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-zinc-300">
              Sincronizando sessão...
            </p>
            <p className="text-xs text-zinc-500">
              Você será redirecionado automaticamente.
            </p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-red-950/40 border border-red-900/50 flex items-center justify-center text-red-400 text-lg">
              ⚠
            </div>
            <p className="text-sm font-medium text-red-300">{errorMsg}</p>
          </>
        )}
      </div>
    </div>
  );
}
