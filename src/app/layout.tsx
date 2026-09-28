import type { Metadata } from "next";
import { Playfair_Display, Bebas_Neue, Lora, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";

// Retro font system: clean bold, anti-AI-slop.
// See DESIGN.md for full design system documentation.
//
// Fonts (4 families, editorial newspaper aesthetic):
//   Playfair Display  : headlines, weight 700 (NOT 900)
//   Bebas Neue        : nav/labels, weight 400 only (no forced bold)
//   Lora              : body text, weight 400-700 (SERIF, not sans)
//   IBM Plex Mono     : metadata/dates, weight 400-600
//
// Anti-AI-slop principles (see DESIGN.md):
//   1. No forced bold on condensed fonts (Bebas Neue at 400 is clean)
//   2. Letter-spacing on labels instead of heavy weight
//   3. Headlines use weight 700, not 900 (clean bold, not ultra-heavy)
//   4. No em dash in user-facing text (use colon, comma, or parentheses)
//   5. No Inter/Roboto/Arial/Helvetica (all fonts are distinctive)

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

// Lora is a SERIF font used for body text. Variable named --font-body
// (not --font-body) to avoid confusion: this is NOT a sans-serif font.
const lora = Lora({
  variable: "--font-body",
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
  title: "Statistika '25: Profil Angkatan Untirta",
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
    title: "Statistika '25: Profil Angkatan Untirta",
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
