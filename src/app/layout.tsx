import type { Metadata } from "next";
import { Playfair_Display, Bebas_Neue, Lora, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";

// Retro font system — clean bold, anti-AI-slop:
// - Playfair Display: high-contrast serif for headlines (broadsheet masthead feel)
//   Used at weight 700 for big titles — bold but NOT ultra-heavy (clean)
// - Bebas Neue: ultra-condensed uppercase for nav/labels (retro poster feel)
//   Single weight 400 — natural weight, no forced bold (keeps it clean)
// - Lora: readable serif for body text (newspaper column feel)
// - IBM Plex Mono: typewriter monospace for dates/metadata (retro archival)
//
// Anti-AI-slop principles:
// 1. No forced bold on condensed fonts — Bebas Neue at natural 400 is clean
// 2. Consistent letter-spacing on labels instead of heavy weight
// 3. Headlines use Playfair 700 (not 900) for "clean bold" not "ultra-bold"
// 4. Body text uses Lora with generous line-height (1.7) for readability

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

const bebas = Bebas_Neue({
  variable: "--font-condensed",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

const lora = Lora({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Statistika '25 — Profil Angkatan Untirta",
  description:
    "Website resmi profil angkatan Statistika 2025 Universitas Sultan Ageng Tirtayasa. Direktori mahasiswa, kelas, galeri, artikel, dan event angkatan.",
  keywords: [
    "Statistika",
    "Untirta",
    "Angkatan 2025",
    "Mahasiswa",
    "Banten",
    "Cilegon",
    "Statistika Untirta",
  ],
  authors: [{ name: "Statistika '25" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Statistika '25 — Profil Angkatan Untirta",
    description:
      "Direktori mahasiswa, kelas, galeri, artikel, dan event angkatan Statistika Untirta.",
    siteName: "Statistika '25",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${bebas.variable} ${lora.variable} ${mono.variable} antialiased bg-[var(--brand-bg)] text-[var(--brand-ink)] relative`}
      >
        <ThemeProvider>
          {children}
          <Toaster />
          <SonnerToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
