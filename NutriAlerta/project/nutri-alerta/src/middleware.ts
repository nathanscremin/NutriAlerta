import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware do NutriAlerta (porta 3000)
 *
 * Regras:
 *   1. A raiz (/) é a página de login unificada.
 *      - Se sem sessão: Acesso permitido.
 *      - Se com sessão: Redireciona para /dashboard (evita tela de login para quem já está logado).
 *   2. /dashboard exige sessão.
 *      - Se sem sessão: Redireciona para / (login).
 *   3. Arquivos estáticos passam direto.
 */

const PUBLIC_PATHS = [
  "/",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Rota pública: raiz (/) ──────────────────────────────────────────────
  if (pathname === "/") {
    // Se a rota for acionada com flag de logout, passa direto para processamento client-side
    const isLogout = request.nextUrl.searchParams.get("logout") === "true";
    if (isLogout) {
      return NextResponse.next();
    }

    const hasSbCookie = [...request.cookies.getAll()].some(
      (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
    );
    if (hasSbCookie) {
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
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

  // ── 3. Rotas protegidas (ex: /dashboard) ───────────────────────────────────
  const hasSbCookie = [...request.cookies.getAll()].some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  const hasAuthHeader = request.headers.get("authorization")?.startsWith("Bearer ");

  if (!hasSbCookie && !hasAuthHeader) {
    // Sem sessão → redireciona para a tela de login (raiz "/")
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Aplica o middleware a todas as rotas
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
