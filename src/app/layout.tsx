import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, Baloo_2 } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/site/Providers";
import { AppShell } from "@/components/site/AppShell";

// Inter — neo-grotesk body/UI voice
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Space Grotesk — geometric display face with angular terminals (LamboType stand-in)
const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  display: "swap",
});

// Baloo 2 — heavy rounded face matching the centre's real signboard lettering;
// used only by the official brand lockup (--font-brand).
const baloo = Baloo_2({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.crystaldiagnosticcentre.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Crystal Diagnostic Centre — Diagnostic Centre in Thane West | Uthalsar",
    template: "%s | Crystal Diagnostic Centre",
  },
  description:
    "Crystal Diagnostic Centre in Uthalsar, Thane West offers diagnostic services, blood tests and preventive health packages. Request an appointment online or call +91 8828393955.",
  keywords: [
    "diagnostic centre in Thane",
    "diagnostic centre near Uthalsar Naka",
    "blood test services in Thane",
    "diagnostic services in Thane West",
    "health checkup Thane",
    "Crystal Diagnostic Centre",
  ],
  authors: [{ name: "Crystal Diagnostic Centre" }],
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Crystal Diagnostic Centre — Precision Diagnostics. Better Health Decisions.",
    description:
      "Explore diagnostic services, check available health packages, and request an appointment at Crystal Diagnostic Centre, Uthalsar Naka, Thane West.",
    url: "/",
    siteName: "Crystal Diagnostic Centre",
    type: "website",
    locale: "en_IN",
    images: [{ url: "/images/og-image.jpg", width: 1440, height: 704, alt: "Crystal Diagnostic Centre, Thane" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crystal Diagnostic Centre — Thane",
    description:
      "Diagnostic services and preventive health packages in Uthalsar, Thane West. Request an appointment online.",
    images: ["/images/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${inter.variable} ${grotesk.variable} ${baloo.variable} antialiased bg-background text-foreground font-sans`}
      >
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
