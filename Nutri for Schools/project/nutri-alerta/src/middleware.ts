import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware do Nutri for Schools (porta 3001)
 *
 * Regras:
 *   1. /auth/sync é sempre pública — é a rota que CRIA a sessão.
 *      Bloqueá-la quebraria o fluxo de login cross-port.
 *   2. Arquivos estáticos (_next, favicon, etc.) passam sem verificação.
 *   3. Para qualquer outra rota, verifica o cookie de sessão Supabase.
 *   4. Se não houver sessão → redireciona para http://localhost:3000
 *      (NUNCA para /login local, que foi deletado).
 *
 * Limitação do Edge Runtime:
 *   O middleware do Next.js roda no Edge e não suporta o cliente Supabase
 *   padrão com persistência de sessão. Por isso usamos uma verificação
 *   simples do cookie sb-*-auth-token que o Supabase grava no browser.
 *   Para apps em produção, use @supabase/ssr com createServerClient.
 */

// Rotas que NÃO precisam de autenticação
const PUBLIC_PATHS = [
  "/auth/sync",    // rota de sincronização de sessão cross-port
  "/auth/callback", // callback OAuth (se usar no futuro)
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Rotas públicas: passa direto ────────────────────────────────────────
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ── 2. Arquivos estáticos: passa direto ────────────────────────────────────
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  // ── 3. Verifica sessão Supabase via cookie ─────────────────────────────────
  // O Supabase armazena a sessão em um cookie chamado "sb-<project-ref>-auth-token"
  // ou, em versões mais novas da lib, "sb-access-token" / "sb-refresh-token".
  // Como estamos no Edge, fazemos uma verificação simples de presença do cookie.
  const hasSbCookie = [...request.cookies.getAll()].some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  // Fallback: verifica o header Authorization (útil para chamadas de API)
  const hasAuthHeader = request.headers.get("authorization")?.startsWith("Bearer ");

  if (!hasSbCookie && !hasAuthHeader) {
    // Sem sessão → redireciona para a página de login UNIFICADA na porta 3000 com flag de logout
    const loginUrl = new URL("http://localhost:3000?logout=true");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Aplica o middleware a TODAS as rotas exceto as estáticas do Next.js
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
