"use client";

import { useServices, usePackages } from "@/lib/hooks";

/**
 * Gold marquee ticker — a full-width strip of test/package names drifting
 * across the abyss between the hero and the trust band. Pure CSS animation
 * (duplicated track, translateX -50% loop), pauses on hover, and the global
 * prefers-reduced-motion rule freezes it to a static first frame.
 *
 * Screen-reader model: the moving track is aria-hidden; a visually-hidden
 * list carries the same names once, plus a skip-style call to action.
 */
export function ServiceTicker() {
  const { data: services } = useServices();
  const { data: packages } = usePackages();

  const names = [...(services ?? []).map((s) => s.name), ...(packages ?? []).map((p) => p.name)];
  // Not enough content yet — an empty or stuttering strip looks broken.
  if (names.length < 4) return null;

  // Two copies of the sequence make the -50% translate loop seamless.
  const loop = [...names, ...names];

  return (
    <section
      aria-labelledby="service-ticker-heading"
      className="group relative overflow-hidden border-y border-[#202020] bg-abyss"
    >
      <h2 id="service-ticker-heading" className="sr-only">
        Services and packages at a glance
      </h2>
      <p className="sr-only">{names.join(", ")} — see the Services and Packages pages for details.</p>

      <div
        aria-hidden
        className="ticker-track flex w-max items-center gap-8 py-3.5 pr-8 [mask-image:none] group-hover:[animation-play-state:paused]"
      >
        {loop.map((name, i) => (
          <span key={`${name}-${i}`} className="flex items-center gap-8">
            <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.24em] text-steel transition-colors hover:text-gold">
              {name}
            </span>
            <span className="hex inline-block h-1.5 w-2.5 shrink-0 bg-gold/80" />
          </span>
        ))}
      </div>

      {/* Edge fades so entries materialise out of the abyss */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-abyss to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-abyss to-transparent"
      />
    </section>
  );
}
