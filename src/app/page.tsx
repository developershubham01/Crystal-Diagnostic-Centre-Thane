import { LogoHorizontal } from "@/components/brand/Logo";

/**
 * SSR fallback for the app route.
 *
 * The interactive site is a hash-routed SPA rendered by <AppShell /> (see
 * layout.tsx); this server-rendered markup is what crawlers and no-JS
 * visitors see. It carries the official brand lockup, a truthful summary
 * of the centre and the key contact details — no interactive chrome,
 * no duplicated navigation (the SPA provides it once JS loads).
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 py-20 text-center">
      <LogoHorizontal showTagline={false} />
      <h1 className="max-w-2xl text-balance font-display text-2xl font-bold uppercase tracking-wide text-ink sm:text-3xl">
        Crystal Diagnostic Centre — Uthalsar Naka, Thane West
      </h1>
      <p className="max-w-xl text-sm leading-relaxed text-white/70">
        Diagnostic services, pathology and radiology, and preventive health packages. Request an
        appointment online and track it with your reference code.
      </p>
      <address className="text-[13px] not-italic leading-relaxed text-white/60">
        1 &amp; 2, Shrikrishna Bhavan CHS, Opp. Varad Hospital, Uthalsar Naka, Thane West, MH 400601
        <br />
        <a href="tel:+918828393955" className="font-semibold text-gold">
          +91 88283 93955
        </a>
      </address>
      <noscript>
        <p className="text-xs text-white/50">
          This site is interactive and needs JavaScript — please enable it, or call us anytime.
        </p>
      </noscript>
    </div>
  );
}
