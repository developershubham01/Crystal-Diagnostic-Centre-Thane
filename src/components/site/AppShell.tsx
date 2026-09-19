"use client";

import { useEffect } from "react";
import { useRouterStore, useRoute } from "@/lib/store";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { FloatingActions } from "./FloatingActions";
import { RouteRenderer } from "./RouteRenderer";
import { useSettings } from "@/lib/hooks";
import { useState } from "react";
import { Info, X } from "lucide-react";

/** Dismissible demo-content notice (compliance: sample data must be clearly marked). */
function DemoNotice() {
  const { data: settings } = useSettings();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || !settings.demoNotice) return null;
  return (
    <div className="relative z-[60] border-b border-gold/30 bg-charcoal px-10 py-1.5 text-center text-[11px] font-medium uppercase tracking-[0.1em] text-white/80 sm:text-[11.5px]">
      <span className="inline-flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
        {settings.demoNotice}
      </span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss notice"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/70 transition-colors hover:text-gold"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/**
 * AppShell — public site chrome (header/footer/floating actions) + route rendering.
 * The admin route renders standalone (no public chrome) for a focused dashboard.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const syncFromUrl = useRouterStore((s) => s.syncFromUrl);
  const route = useRoute();

  useEffect(() => {
    syncFromUrl();
    const onUrlChange = () => syncFromUrl();
    window.addEventListener("popstate", onUrlChange);
    window.addEventListener("hashchange", onUrlChange);
    return () => {
      window.removeEventListener("popstate", onUrlChange);
      window.removeEventListener("hashchange", onUrlChange);
    };
  }, [syncFromUrl]);

  // Keep {children} mounted for SSR content of the single route
  void children;

  if (route.name === "admin") {
    return (
      <div className="flex min-h-screen flex-col bg-soft">
        <RouteRenderer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DemoNotice />
      <Header />
      <main id="main" className="flex-1" tabIndex={-1}>
        <RouteRenderer />
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
