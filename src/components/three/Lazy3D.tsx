"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { prefersReducedMotion } from "@/lib/perf";

type LoadState = "idle" | "loading" | "ready" | "failed" | "unsupported";

/**
 * Lazy3D — defers mounting a WebGL canvas until the container scrolls into
 * view, skips entirely for reduced-motion users or missing WebGL, and shows
 * a static fallback image otherwise.
 */
export function Lazy3D({
  load, // () => Promise<{ default: React.ComponentType<any> }>
  fallbackSrc,
  fallbackAlt,
  className,
  minHeight = 420,
  sceneProps = {},
  hint,
}: {
  load: () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>;
  fallbackSrc: string;
  fallbackAlt: string;
  className?: string;
  minHeight?: number;
  sceneProps?: Record<string, unknown>;
  hint?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<LoadState>("idle");
  const [Scene, setScene] = useState<React.ComponentType<Record<string, unknown>> | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return; // keep static fallback
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        // WebGL capability check (inside observer callback — runs on user scroll)
        try {
          const canvas = document.createElement("canvas");
          const ok = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
          setState(ok ? "loading" : "unsupported");
        } catch {
          setState("unsupported");
        }
      },
      { rootMargin: "160px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (state !== "loading") return;
    let cancelled = false;
    load()
      .then((mod) => {
        if (cancelled) return;
        setScene(() => mod.default);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("failed");
      });
    return () => {
      cancelled = true;
    };
  }, [state, load]);

  const showFallback = state !== "ready" || !Scene;

  return (
    <div ref={ref} className={`canvas-wrap relative ${className ?? ""}`} style={{ minHeight }}>
      {showFallback ? (
        <>
          <Image
            src={fallbackSrc}
            alt={fallbackAlt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="rounded-2xl object-cover"
            priority={false}
          />
          {hint && (
            <span className="absolute bottom-3 right-3 rounded-full bg-navy/80 px-3 py-1 text-[11px] font-medium text-white/90">
              {hint}
            </span>
          )}
        </>
      ) : (
        <Suspense fallback={null}>
          <Scene {...sceneProps} />
        </Suspense>
      )}
    </div>
  );
}

/** Convenience dynamic importers (code-split: three.js only loads when needed) */
export const loadHeroCrystal = () => import("./HeroCrystal");
export const loadDnaShowcase = () => import("./DnaShowcase");
