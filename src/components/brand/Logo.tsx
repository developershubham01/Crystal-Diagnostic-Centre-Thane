import { cn } from "@/lib/utils";

/**
 * Crystal Diagnostic Centre logo system — Midnight Showroom edition.
 * Concept: a crystal "C" ring drawn in Lamborghini Gold holding a white
 * medical cross, with a Cyan Pulse leaf accent (informational/medical only).
 * Pure SVG vectors — no embedded raster.
 *
 * Variants:
 *  - LogoMark       icon only
 *  - LogoHorizontal icon + stacked wordmark (primary)
 *  - LogoStacked    icon above wordmark
 *  - theme "color" tuned for dark backgrounds (default), "white" monochrome
 */

function LogoMarkSvg({ className, theme = "color" }: { className?: string; theme?: "color" | "white" }) {
  const id = theme === "white" ? "w" : "c";
  return (
    <svg
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Crystal Diagnostic Centre logo"
    >
      <defs>
        <linearGradient id={`arc-${id}`} x1="14" y1="10" x2="58" y2="62" gradientUnits="userSpaceOnUse">
          {theme === "color" ? (
            <>
              <stop offset="0" stopColor="#FFCE3E" />
              <stop offset="0.55" stopColor="#FFC000" />
              <stop offset="1" stopColor="#917300" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="0.55" stopColor="#E6E6E6" />
              <stop offset="1" stopColor="#969696" />
            </>
          )}
        </linearGradient>
        <linearGradient id={`cross-${id}`} x1="26" y1="24" x2="46" y2="52" gradientUnits="userSpaceOnUse">
          {theme === "color" ? (
            <>
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#D9D9D9" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#BFBFBF" />
            </>
          )}
        </linearGradient>
        <linearGradient id={`leaf-${id}`} x1="50" y1="2" x2="66" y2="20" gradientUnits="userSpaceOnUse">
          {theme === "color" ? (
            <>
              <stop offset="0" stopColor="#4FC3F0" />
              <stop offset="1" stopColor="#29ABE2" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#B8B8B8" />
              <stop offset="1" stopColor="#8A8A8A" />
            </>
          )}
        </linearGradient>
      </defs>

      {/* Crystal "C" ring — opens to the upper right */}
      <path
        d="M 47.8 15.2 A 24.5 24.5 0 1 0 60 44"
        stroke={`url(#arc-${id})`}
        strokeWidth="8"
        strokeLinecap="round"
        transform="rotate(-28 36 36)"
      />
      {/* Inner sparkle facet of the crystal */}
      <path
        d="M 24.5 36 a 12.5 12.5 0 0 1 12.5 -12.5"
        stroke={`url(#arc-${id})`}
        strokeWidth="3.4"
        strokeLinecap="round"
        opacity="0.55"
        transform="rotate(-28 36 36)"
      />
      {/* Medical cross (decorative brand element) */}
      <path
        d="M32.2 25.4 h7.6 a1.9 1.9 0 0 1 1.9 1.9 v6.4 h6.4 a1.9 1.9 0 0 1 1.9 1.9 v7.6 a1.9 1.9 0 0 1 -1.9 1.9 h-6.4 v6.4 a1.9 1.9 0 0 1 -1.9 1.9 h-7.6 a1.9 1.9 0 0 1 -1.9 -1.9 v-6.4 h-6.4 a1.9 1.9 0 0 1 -1.9 -1.9 v-7.6 a1.9 1.9 0 0 1 1.9 -1.9 h6.4 v-6.4 a1.9 1.9 0 0 1 1.9 -1.9 z"
        fill={`url(#cross-${id})`}
      />
      {/* Cyan pulse leaf accent */}
      <path
        d="M53.5 4.5 c6.2 1.4 10.4 6.4 10.9 12.8 c-6.5 0.6 -11.9 -3.2 -13.6 -9.3 c-0.4 -1.4 1.2 -3.9 2.7 -3.5 z"
        fill={`url(#leaf-${id})`}
      />
    </svg>
  );
}

export function LogoMark({ className, theme = "color" }: { className?: string; theme?: "color" | "white" }) {
  return <LogoMarkSvg className={className} theme={theme} />;
}

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
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[1.15rem] font-bold uppercase tracking-[0.06em] leading-[1.05]",
            theme === "white" ? "text-white" : "text-ink"
          )}
        >
          Crystal
        </span>
        <span
          className={cn(
            "text-[0.6rem] font-semibold tracking-[0.3em] uppercase",
            "text-medblue"
          )}
        >
          Diagnostic Centre
        </span>
        {showTagline && (
          <span
            className={cn(
              "mt-1 text-[0.58rem] font-medium tracking-[0.08em] uppercase",
              theme === "white" ? "text-white/55" : "text-inkmuted"
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
    <span className={cn("inline-flex flex-col items-center gap-2", className)}>
      <LogoMarkSvg className="h-16 w-16" theme={theme} />
      <span className="flex flex-col items-center leading-none">
        <span
          className={cn(
            "font-display text-2xl font-bold uppercase tracking-[0.06em]",
            theme === "white" ? "text-white" : "text-ink"
          )}
        >
          Crystal
        </span>
        <span className="mt-1 text-[0.7rem] font-semibold tracking-[0.34em] uppercase text-medblue">
          Diagnostic Centre
        </span>
      </span>
    </span>
  );
}
