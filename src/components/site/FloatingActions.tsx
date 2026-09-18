"use client";

import { useState } from "react";
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
 *  - Back-to-top (appears on scroll, desktop)
 */
export function FloatingActions() {
  const { data: settings } = useSettings();
  const route = useRoute();
  const navigate = useRouterStore((s) => s.navigate);
  const [waHover, setWaHover] = useState(false);
  const [callHover, setCallHover] = useState(false);

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

      {/* Back to top — outlined hexagon */}
      <Button
        variant="outline"
        size="icon"
        aria-label="Back to top"
        className="hex fixed bottom-24 right-5 z-40 hidden border-white/40 bg-black/80 shadow-md backdrop-blur lg:flex"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <ArrowUp className="h-4 w-4 text-gold" />
      </Button>
    </>
  );
}
