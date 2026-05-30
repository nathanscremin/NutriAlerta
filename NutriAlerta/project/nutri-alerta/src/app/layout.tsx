import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NutriAlerta - Monitoramento Epidemiológico Infantil",
  description: "Painel avançado de monitoramento e auditoria epidemiológica para acompanhamento de desnutrição, sobrepeso e obesidade infantil em Rio Claro - SP.",
  metadataBase: new URL("https://nutrialerta.sp.gov.br"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "NutriAlerta - Monitoramento Epidemiológico Infantil",
    description: "Painel avançado de monitoramento e auditoria epidemiológica para acompanhamento de desnutrição, sobrepeso e obesidade infantil em Rio Claro - SP.",
    url: "https://nutrialerta.sp.gov.br",
    siteName: "NutriAlerta",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NutriAlerta - Monitoramento Epidemiológico Infantil",
    description: "Painel avançado de monitoramento e auditoria epidemiológica para acompanhamento de desnutrição, sobrepeso e obesidade infantil em Rio Claro - SP.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#020617", // slate-950
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
