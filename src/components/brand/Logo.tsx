import { cn } from "@/lib/utils";

/**
 * Crystal Diagnostic Centre — OFFICIAL brand system (production).
 *
 * Faithful vector recreation of the centre's real signboard:
 *  - Circular badge: white ring + cyan gradient disc holding a white
 *    ultrasound transducer (probe) with three radiating sound waves.
 *  - Wordmark: "CRYSTAL" / "DIAGNOSTIC CENTRE" in the brand's rounded
 *    heavy face (Baloo 2 via --font-brand) with the authentic cyan
 *    gradient; the "O" of DIAGNOSTIC is the brand's hot-pink circle
 *    with a mini probe inside.
 *
 * NOTE (design-system exemption): the logo intentionally uses the
 * centre's authentic cyan/pink brand colours. This is the single
 * sanctioned exception to the Midnight Showroom "gold-only" accent rule
 * (documented in DESIGN.md) — do not apply these colours elsewhere.
 *
 * Pure SVG vectors — no embedded raster, crisp at any size.
 *
 * Variants:
 *  - LogoMark       circular probe badge only
 *  - LogoHorizontal badge + stacked wordmark (primary lockup)
 *  - LogoStacked    badge above centred wordmark
 *  - theme "color"  authentic brand colours (default, tuned for dark)
 *  - theme "white"  monochrome fallback for special surfaces
 */

/* ------------------------------------------------------------------ */
/* Shared geometry — ultrasound probe glyph (drawn head-up around 0,0) */
/* ------------------------------------------------------------------ */

/** Probe silhouette: convex head tapering to a rounded handle. */
const PROBE_BODY =
  "M -13 -8 C -13 -16.5 -7.5 -20.5 0 -20.5 C 7.5 -20.5 13 -16.5 13 -8 " +
  "C 13 -3.2 10 0.8 5.3 3.8 L 5.3 5 Q 0 7.6 -5.3 5 L -5.3 3.8 C -10 0.8 -13 -3.2 -13 -8 Z";

/** Three sound waves radiating from the probe face (arcs above origin). */
const WAVE_ARCS = [
  "M -5.66 -27.66 A 8 8 0 0 1 5.66 -27.66",
  "M -9.55 -31.55 A 13.5 13.5 0 0 1 9.55 -31.55",
  "M -13.44 -35.44 A 19 19 0 0 1 13.44 -35.44",
];

/** Ultrasonic probe + waves group, tilted like the real signboard. */
function ProbeGlyph({ tilt = 35, scale = 1 }: { tilt?: number; scale?: number }) {
  return (
    <g transform={`rotate(${tilt}) scale(${scale})`}>
      <g stroke="#FFFFFF" strokeWidth="3.6" strokeLinecap="round" fill="none">
        {WAVE_ARCS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <path d={PROBE_BODY} fill="#FFFFFF" />
      <rect x="-4.8" y="4.2" width="9.6" height="26.5" rx="4.8" fill="#FFFFFF" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* LogoMark — circular probe badge                                     */
/* ------------------------------------------------------------------ */

function LogoMarkSvg({ className, theme = "color" }: { className?: string; theme?: "color" | "white" }) {
  const uid = theme === "white" ? "-w" : "-c";
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Crystal Diagnostic Centre logo"
    >
      {theme === "color" && (
        <defs>
          <linearGradient id={`disc${uid}`} x1="22" y1="14" x2="76" y2="84" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#82E4FB" />
            <stop offset="0.5" stopColor="#3BB6EF" />
            <stop offset="1" stopColor="#1F86D8" />
          </linearGradient>
        </defs>
      )}

      {/* outer ring */}
      <circle cx="48" cy="48" r="44" stroke="#FFFFFF" strokeOpacity={theme === "white" ? 1 : 0.95} strokeWidth="5" />
      {/* cyan disc (monochrome: soft white disc) */}
      <circle
        cx="48"
        cy="48"
        r="35.5"
        fill={theme === "color" ? `url(#disc${uid})` : "#FFFFFF"}
        fillOpacity={theme === "color" ? 1 : 0.16}
      />
      {/* probe + waves, tilted to match the real signboard */}
      <g transform="translate(43 52)">
        <ProbeGlyph tilt={35} scale={0.92} />
      </g>
    </svg>
  );
}

export function LogoMark({ className, theme = "color" }: { className?: string; theme?: "color" | "white" }) {
  return <LogoMarkSvg className={className} theme={theme} />;
}

/* ------------------------------------------------------------------ */
/* BrandO — the hot-pink "O" of DIAGNOSTIC (mini probe inside)         */
/* ------------------------------------------------------------------ */

function MiniProbe({ className }: { className?: string }) {
  return (
    <svg viewBox="-22 -19 38 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <g transform="rotate(35)">
        <path d={PROBE_BODY} fill="#FFFFFF" />
        <rect x="-4.8" y="4.2" width="9.6" height="26.5" rx="4.8" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

/** The real logo's signature pink "O" — circle + inner ring + mini probe. */
function BrandO({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full bg-[#EC5FA8]",
        "shadow-[inset_0_0_0_2px_rgba(255,255,255,0.55)]",
        className
      )}
    >
      <MiniProbe className="h-[74%] w-[74%]" />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Wordmark                                                            */
/* ------------------------------------------------------------------ */

function DiagnosticLine({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <span>DIAGN</span>
      <BrandO className="mx-[0.06em] h-[0.88em] w-[0.88em]" />
      <span>STIC</span>
      <span className="inline-block w-[0.45em]" aria-hidden />
      <span>CENTRE</span>
      {/* the replaced glyph, for screen readers */}
      <span className="sr-only">O</span>
    </span>
  );
}

function Wordmark({
  theme = "color",
  size = "md",
  className,
}: {
  theme?: "color" | "white";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const gradient = theme === "color" ? "brand-gradient-text" : "text-white";
  const glow = theme === "color" ? "brand-glow" : "";
  const scale = {
    sm: { crystal: "text-[1.05rem]", diag: "text-[0.56rem]" },
    md: { crystal: "text-[1.28rem]", diag: "text-[0.64rem]" },
    lg: { crystal: "text-[2.6rem]", diag: "text-[1.05rem]" },
  }[size];

  return (
    <span className={cn("flex flex-col leading-none", className)}>
      <span
        className={cn(
          "font-brand font-extrabold uppercase leading-[1.02] tracking-[0.03em]",
          scale.crystal,
          gradient,
          glow
        )}
      >
        Crystal
      </span>
      <DiagnosticLine
        className={cn(
          "mt-[0.28em] font-brand font-bold uppercase leading-none tracking-[0.16em]",
          scale.diag,
          gradient,
          glow
        )}
      />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Lockups                                                             */
/* ------------------------------------------------------------------ */

export function LogoHorizontal({
  className,
  theme = "color",
  showTagline = true,
}: {
  className?: string;
  theme?: "color" | "white";
  showTagline?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMarkSvg className="h-10 w-10 shrink-0" theme={theme} />
      <span className="flex flex-col">
        <Wordmark theme={theme} size="md" />
        {showTagline && (
          <span
            className={cn(
              "mt-1 text-[0.56rem] font-semibold uppercase tracking-[0.14em]",
              theme === "white" ? "text-white/60" : "text-inkmuted"
            )}
          >
            Your Health, Our Priority
          </span>
        )}
      </span>
    </span>
  );
}

export function LogoStacked({ className, theme = "color" }: { className?: string; theme?: "color" | "white" }) {
  return (
    <span className={cn("inline-flex flex-col items-center gap-3", className)}>
      <LogoMarkSvg className="h-16 w-16" theme={theme} />
      <Wordmark theme={theme} size="lg" className="items-center [&>span]:items-center [&>span]:text-center" />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Static markup (print slip / emails / popups)                        */
/* ------------------------------------------------------------------ */

/** Standalone inline-SVG badge for contexts that build raw HTML strings. */
export const LOGO_MARK_SVG = `<svg viewBox="0 0 96 96" width="44" height="44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="disc-print" x1="22" y1="14" x2="76" y2="84" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#82E4FB"/><stop offset="0.5" stop-color="#3BB6EF"/><stop offset="1" stop-color="#1F86D8"/>
    </linearGradient>
  </defs>
  <circle cx="48" cy="48" r="44" fill="none" stroke="#1F86D8" stroke-width="5"/>
  <circle cx="48" cy="48" r="35.5" fill="url(#disc-print)"/>
  <g transform="translate(43 52) rotate(35) scale(0.92)" fill="#FFFFFF">
    <g stroke="#FFFFFF" stroke-width="3.6" stroke-linecap="round" fill="none">
      <path d="M -5.66 -27.66 A 8 8 0 0 1 5.66 -27.66"/>
      <path d="M -9.55 -31.55 A 13.5 13.5 0 0 1 9.55 -31.55"/>
      <path d="M -13.44 -35.44 A 19 19 0 0 1 13.44 -35.44"/>
    </g>
    <path d="M -13 -8 C -13 -16.5 -7.5 -20.5 0 -20.5 C 7.5 -20.5 13 -16.5 13 -8 C 13 -3.2 10 0.8 5.3 3.8 L 5.3 5 Q 0 7.6 -5.3 5 L -5.3 3.8 C -10 0.8 -13 -3.2 -13 -8 Z"/>
    <rect x="-4.8" y="4.2" width="9.6" height="26.5" rx="4.8"/>
  </g>
</svg>`;
