"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
type SystemTarget = "nutrialerta" | "nutrischools";

interface WaveLine {
  amplitude: number;
  frequency: number;
  phase: number;
  speed: number;
  color: string;
  lineWidth: number;
  yOffset: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const NUTRISCHOOLS_SYNC_URL =
  process.env.NEXT_PUBLIC_NUTRISCHOOLS_URL
    ? `${process.env.NEXT_PUBLIC_NUTRISCHOOLS_URL}/auth/sync`
    : "http://localhost:3001/auth/sync";

// Wave palette: vivid green → teal → cobalt blue
const WAVE_PALETTE = [
  "rgba(0, 220, 100, 0.70)",
  "rgba(0, 200, 120, 0.55)",
  "rgba(0, 180, 140, 0.50)",
  "rgba(0, 155, 180, 0.55)",
  "rgba(0, 120, 220, 0.65)",
  "rgba(30,  90, 230, 0.60)",
  "rgba(60,  60, 200, 0.50)",
  "rgba(0, 210, 110, 0.40)",
  "rgba(0, 170, 160, 0.40)",
  "rgba(20, 100, 240, 0.40)",
];

// Guard: evaluated once at module load — never blocks render
const SUPABASE_CONFIGURED =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Helper to extract Supabase project ref
const getProjectRef = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const match = url.match(/https:\/\/([^.]+)\.supabase\.(co|net)/);
  return match ? match[1] : "peqvaslchaxrewhtxltc";
};

// ─── WaveCanvas ───────────────────────────────────────────────────────────────
function WaveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const linesRef  = useRef<WaveLine[]>([]);
  const timeRef   = useRef(0);

  const buildLines = useCallback(
    (h: number): WaveLine[] =>
      Array.from({ length: 10 }, (_, i) => ({
        amplitude: 38 + Math.random() * 55,
        frequency: 0.007 + Math.random() * 0.006,
        phase:     (i / 10) * Math.PI * 2,
        speed:     0.008 + Math.random() * 0.009,
        color:     WAVE_PALETTE[i % WAVE_PALETTE.length],
        lineWidth: 0.8 + Math.random() * 0.7,
        yOffset:   h * (0.18 + (i / 10) * 0.65),
      })),
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      linesRef.current = buildLines(canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      timeRef.current += 1;

      linesRef.current.forEach((line) => {
        ctx.beginPath();
        ctx.strokeStyle = line.color;
        ctx.lineWidth   = line.lineWidth;

        for (let x = 0; x <= width; x += 2) {
          const y =
            line.yOffset +
            Math.sin(
              x * line.frequency + line.phase + timeRef.current * line.speed
            ) * line.amplitude;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        line.phase += 0.001;
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [buildLines]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}

// ─── SystemSelector ───────────────────────────────────────────────────────────
function SystemSelector({
  value,
  onChange,
}: {
  value: SystemTarget;
  onChange: (v: SystemTarget) => void;
}) {
  const options: { id: SystemTarget; label: string }[] = [
    { id: "nutrialerta",  label: "NutriAlerta" },
    { id: "nutrischools", label: "Nutri for Schools" },
  ];

  return (
    <div
      className="flex w-full rounded-full p-[3px] mb-5"
      style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
      role="tablist"
      aria-label="Selecione o sistema de destino"
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            id={`system-tab-${opt.id}`}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={[
              "flex-1 py-2 rounded-full text-xs font-bold tracking-wide",
              "transition-all duration-200 cursor-pointer",
              active
                ? "bg-white/15 text-white shadow-sm"
                : "text-white/40 hover:text-white/70",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── LoginInput ───────────────────────────────────────────────────────────────
function LoginInput({
  id,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      autoComplete={autoComplete}
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={[
        "w-full px-5 py-3 rounded-full text-sm !text-white outline-none",
        "placeholder:text-white/35 border border-transparent",
        "focus:border-white/20 focus:ring-2 focus:ring-white/10",
        "transition-all duration-200",
      ].join(" ")}
      style={{ backgroundColor: "rgba(255,255,255,0.09)", color: "white" }}
    />
  );
}

// ─── ErrorBadge ───────────────────────────────────────────────────────────────
function ErrorBadge({ message, isConfig = false }: { message: string; isConfig?: boolean }) {
  return (
    <div
      role="alert"
      className={[
        "w-full px-4 py-3 text-xs font-medium mb-3 flex items-start gap-2",
        isConfig ? "rounded-xl text-left" : "rounded-full text-center justify-center",
      ].join(" ")}
      style={{
        backgroundColor: isConfig
          ? "rgba(251, 191, 36, 0.10)"
          : "rgba(239, 68, 68, 0.15)",
        color: isConfig ? "#fcd34d" : "#fca5a5",
        border: `1px solid ${isConfig ? "rgba(251,191,36,0.25)" : "rgba(239,68,68,0.25)"}`,
      }}
    >
      <span className="shrink-0 mt-[1px]">{isConfig ? "⚙" : "⚠"}</span>
      <span>{message}</span>
    </div>
  );
}

// ─── LogoMark ─────────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <div
      className="mx-auto w-10 h-10 rounded-2xl flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, rgba(0,200,120,0.25) 0%, rgba(30,120,220,0.25) 100%)",
        border: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
        style={{ color: "rgba(255,255,255,0.75)" }}
      >
        <path
          d="M7 17.5V6.5l10 11V6.5"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// ─── SpinnerIcon ──────────────────────────────────────────────────────────────
function SpinnerIcon() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── LoginPage (default export for ROOT page) ─────────────────────────────────
export default function LoginPage() {
  const [system,   setSystem]   = useState<SystemTarget>("nutrialerta");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [isConfigError, setIsConfigError] = useState(false);
  const router = useRouter();

  // Auto-redirect when session already exists
  useEffect(() => {
    (async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const isRestricted = searchParams.get("restricted") === "true";
      if (searchParams.get("logout") === "true") {
        await supabase.auth.signOut();
        const projectRef = getProjectRef();
        document.cookie = `sb-${projectRef}-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
        if (isRestricted) {
          setError("Acesso restrito. O usuário de teste possui permissão exclusiva para acessar o NutriAlerta (Painel Gestor).");
        }
        window.history.replaceState(null, "", window.location.pathname);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Garante a existência do cookie localmente para o middleware
        const projectRef = getProjectRef();
        const cookieName = `sb-${projectRef}-auth-token`;
        const hasCookie = document.cookie.split("; ").some((c) => c.startsWith(cookieName + "="));
        if (!hasCookie) {
          const cookieValue = JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
          document.cookie = `${cookieName}=${encodeURIComponent(cookieValue)}; path=/; max-age=604800; SameSite=Lax`;
        }
        router.replace("/dashboard");
      }
    })();
  }, [router]);

  const handleSystemChange = (v: SystemTarget) => {
    setSystem(v);
    setError(null);
    setIsConfigError(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsConfigError(false);

    // ── Guard #1: Supabase env vars missing ─────────────────────────────────
    if (!SUPABASE_CONFIGURED) {
      setIsConfigError(true);
      setError(
        "Erro de Configuração: As credenciais do Supabase não foram encontradas " +
        "no arquivo .env.local. Defina NEXT_PUBLIC_SUPABASE_URL e " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY e reinicie o servidor de desenvolvimento."
      );
      return;
    }

    setLoading(true);
    let navigating = false;

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email:    email.trim().toLowerCase(),
        password,
      });

      // ── Guard #2: auth error ───────────────────────────────────────────────
      if (authError) {
        const msg =
          authError.message === "Invalid login credentials"
            ? "E-mail ou senha incorretos. Verifique e tente novamente."
            : authError.message === "Email not confirmed"
            ? "Confirme seu e-mail antes de entrar."
            : authError.message === "Too many requests"
            ? "Muitas tentativas. Aguarde alguns minutos e tente novamente."
            : `Erro de autenticação: ${authError.message}`;
        setError(msg);
        return;
      }

      // ── Guard #3: session missing despite no error ─────────────────────────
      if (!data.session) {
        setError("Sessão não iniciada. Tente novamente.");
        return;
      }

      // ── Define o cookie local para o middleware do NutriAlerta ─────────────
      const projectRef = getProjectRef();
      const cookieName = `sb-${projectRef}-auth-token`;
      const cookieValue = JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      document.cookie = `${cookieName}=${encodeURIComponent(cookieValue)}; path=/; max-age=604800; SameSite=Lax`;

      // ── Redirect: NutriAlerta (mesma origem) ──────────────────────────────
      if (system === "nutrialerta") {
        navigating = true;
        router.push("/dashboard");
        return;
      }

      // Bloqueio de segurança para usuário de teste no Nutri for Schools
      if (email.trim().toLowerCase() === "teste@nutrialerta.com") {
        setError("Acesso restrito. O usuário de teste possui permissão exclusiva para acessar o NutriAlerta (Painel Gestor).");
        await supabase.auth.signOut();
        const projectRef = getProjectRef();
        document.cookie = `sb-${projectRef}-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
        setLoading(false);
        return;
      }

      // ── Redirect: Nutri for Schools (porta 3001) ──────────────────────────
      navigating = true;
      const { access_token, refresh_token } = data.session;
      const params = new URLSearchParams({
        access_token,
        refresh_token,
      });
      window.location.href = `${NUTRISCHOOLS_SYNC_URL}#${params.toString()}`;

    } catch {
      setError("Erro de rede. Verifique sua conexão e tente novamente.");
    } finally {
      if (!navigating) setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#080a0c" }}
    >
      {/* ── Animated wave background ──────────────────────────────────────── */}
      <WaveCanvas />

      {/* ── Radial vignette ───────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 30%, rgba(8,10,12,0.78) 100%)",
        }}
      />

      {/* ── Login card ────────────────────────────────────────────────────── */}
      <div
        className="relative z-10 w-full max-w-[360px] mx-4 px-8 py-9 rounded-[28px] flex flex-col items-center"
        style={{
          backgroundColor:    "rgba(22, 26, 30, 0.85)",
          backdropFilter:     "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border:     "1px solid rgba(255,255,255,0.08)",
          boxShadow:  "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset",
          animation:  "cardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      >
        {/* Brand header */}
        <div className="mb-6 text-center">
          <LogoMark />
          <h1 className="text-xl font-light tracking-[0.08em] mt-3 text-white">
            Login
          </h1>
          <p className="text-[10px] mt-1 tracking-wider font-mono text-white/30">
            NUTRIALERTA · ECOSSISTEMA
          </p>
        </div>

        {/* System selector */}
        <SystemSelector value={system} onChange={handleSystemChange} />

        {/* Error / config warning */}
        {error && <ErrorBadge message={error} isConfig={isConfigError} />}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="w-full space-y-3" noValidate>
          <LoginInput
            id="login-email"
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />
          <LoginInput
            id="login-password"
            type="password"
            placeholder="Senha"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className={[
              "w-full py-3 rounded-full text-sm font-semibold tracking-wide",
              "text-white transition-all duration-200 mt-1 cursor-pointer",
              "disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
            ].join(" ")}
            style={{
              backgroundColor: "rgba(255,255,255,0.12)",
              border:          "1px solid rgba(255,255,255,0.14)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgba(255,255,255,0.18)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgba(255,255,255,0.12)";
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2 text-white">
                <SpinnerIcon />
                Autenticando...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* Destination hint */}
        <p className="mt-6 text-[10px] text-center font-mono text-white/20">
          {system === "nutrialerta"
            ? "→ localhost:3000/dashboard"
            : "→ localhost:3001/dashboard"}
        </p>
      </div>

      {/* ── CSS keyframes ─────────────────────────────────────────────────── */}
      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: white !important;
          -webkit-box-shadow: 0 0 0px 1000px rgba(22, 26, 30, 0.85) inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
}
