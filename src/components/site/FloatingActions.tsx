"use client";

import { Phone, MessageCircle, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRoute, useRouterStore } from "@/lib/store";
import { useSettings } from "@/lib/hooks";

/**
 * Floating quick actions — hexagonal brand geometry (DESIGN.md):
 *  - WhatsApp chat (only when a WhatsApp number is configured)
 *  - Sticky call button (mobile only)
 *  - Back-to-top (appears on scroll, desktop)
 */
export function FloatingActions() {
  const { data: settings } = useSettings();
  const route = useRoute();
  const navigate = useRouterStore((s) => s.navigate);

  if (route.name === "admin") return null;

  const waNumber = settings.whatsappNumber.replace(/[^\d]/g, "");
  const waText = encodeURIComponent(
    `Hello ${settings.businessName}, I would like to enquire about a diagnostic test.`
  );

  return (
    <>
      {/* WhatsApp — hexagon, brand-recognisable green */}
      {waNumber.length >= 10 && (
        <a
          href={`https://wa.me/${waNumber}?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          className="hex fixed bottom-5 right-5 z-40 flex items-center justify-center bg-[#25D366] text-white shadow-lg shadow-black/60 transition-colors hover:bg-[#1fb857] animate-in fade-in"
          style={{ height: 52, width: 52 }}
        >
          <MessageCircle className="h-6 w-6 fill-current" aria-hidden />
        </a>
      )}

      {/* Call — mobile only, gold hexagon */}
      <a
        href="tel:+918828393955"
        aria-label="Call Crystal Diagnostic Centre"
        className="hex fixed bottom-5 left-5 z-40 flex items-center justify-center bg-primary text-primary-foreground shadow-lg shadow-black/60 transition-colors hover:bg-gold-dark md:hidden"
        style={{ height: 52, width: 52 }}
      >
        <Phone className="h-5 w-5" aria-hidden />
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
