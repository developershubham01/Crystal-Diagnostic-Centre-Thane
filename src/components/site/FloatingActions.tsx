"use client";

import { useEffect, useState } from "react";
import { Phone, MessageCircle, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRoute, useRouterStore } from "@/lib/store";
import { useSettings } from "@/lib/hooks";

/**
 * Floating quick actions — hexagonal brand geometry (DESIGN.md).
 * All FABs follow the Midnight Showroom palette: charcoal glass with a
 * white hairline, gold on hover — never brand-green, which is outside
 * the monochrome-plus-gold system.
 *  - WhatsApp chat (only when a WhatsApp number is configured)
 *  - Sticky call button (mobile only)
 *  - Back-to-top with a live gold reading-progress fill (appears after
 *    the patient has scrolled into the page)
 */

const SHOW_AFTER = 560; // px scrolled before the back-to-top appears

export function FloatingActions() {
  const { data: settings } = useSettings();
  const route = useRoute();
  const navigate = useRouterStore((s) => s.navigate);
  const [waHover, setWaHover] = useState(false);
  const [callHover, setCallHover] = useState(false);
  // Scroll state as one primitive: progress 0..1, visible once past SHOW_AFTER.
  const [scroll, setScroll] = useState({ visible: false, progress: 0 });

  // rAF-throttled reading progress for the back-to-top fill (same pattern
  // as the Header progress hairline). Hooks stay above the admin early-return.
  useEffect(() => {
    if (route.name === "admin") return;
    let raf = 0;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      setScroll({ visible: window.scrollY > SHOW_AFTER, progress });
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [route.name]);

  if (route.name === "admin") return null;

  const waNumber = settings.whatsappNumber.replace(/[^\d]/g, "");
  const waText = encodeURIComponent(
    `Hello ${settings.businessName}, I would like to enquire about a diagnostic test.`
  );

  return (
    <>
      {/* WhatsApp — hexagonal charcoal plate, gold on hover (colour-only) */}
      {waNumber.length >= 10 && (
        <a
          href={`https://wa.me/${waNumber}?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          className="fixed bottom-5 right-5 z-40 animate-in fade-in"
          onMouseEnter={() => setWaHover(true)}
          onMouseLeave={() => setWaHover(false)}
        >
          {/* Nested hex plates so the 1px ring survives clip-path */}
          <span
            className="hex flex items-center justify-center bg-white/25 transition-colors duration-200"
            style={{ height: 54, width: 54 }}
          >
            <span
              className="hex flex items-center justify-center transition-colors duration-200"
              style={{ height: 52, width: 52, background: waHover ? "#ffc000" : "rgba(24,24,24,0.92)" }}
            >
              <MessageCircle
                className="h-6 w-6 transition-colors duration-200"
                style={{ color: waHover ? "#000000" : "#f5f5f5" }}
                aria-hidden
              />
            </span>
          </span>
          {/* Uppercase micro label — desktop hover only */}
          <span
            aria-hidden
            className={`pointer-events-none absolute right-[62px] top-1/2 hidden -translate-y-1/2 border border-white/15 bg-black/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink transition-opacity duration-200 lg:block ${
              waHover ? "opacity-100" : "opacity-0"
            }`}
          >
            WhatsApp
          </span>
        </a>
      )}

      {/* Call — mobile only, gold hexagon with label */}
      <a
        href="tel:+918828393955"
        aria-label="Call Crystal Diagnostic Centre"
        className="fixed bottom-5 left-5 z-40 md:hidden"
        onMouseEnter={() => setCallHover(true)}
        onMouseLeave={() => setCallHover(false)}
      >
        <span
          className="hex flex items-center justify-center bg-gold transition-colors duration-200"
          style={{ height: 54, width: 54, background: callHover ? "#917300" : "#ffc000" }}
        >
          <Phone className="h-5 w-5 text-black" aria-hidden />
        </span>
      </a>

      {/* Back to top — outlined hexagon whose lower region fills with a soft
          gold tint as the patient reads down the page (hex clip keeps it sharp) */}
      <Button
        variant="outline"
        size="icon"
        aria-label="Back to top"
        aria-hidden={!scroll.visible}
        tabIndex={scroll.visible ? 0 : -1}
        className={`hex fixed bottom-24 right-5 z-40 border-white/40 bg-black/80 shadow-md backdrop-blur transition-opacity duration-300 lg:flex ${
          scroll.visible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 bg-gold/15"
          style={{ height: `${Math.round(scroll.progress * 100)}%` }}
        />
        <ArrowUp className="relative h-4 w-4 text-gold" />
      </Button>
    </>
  );
}
