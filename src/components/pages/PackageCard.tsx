"use client";

import { CalendarCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouterStore } from "@/lib/store";
import type { PackageDTO } from "@/lib/api-client";
import { formatPrice } from "./PageStates";

/**
 * Premium package card used on PackagesPage.
 * Larger variant of the home-page featured card, with the full test list
 * (scrollable when long) and CTAs.
 */
export function PackageCard({ pkg }: { pkg: PackageDTO }) {
  const navigate = useRouterStore((s) => s.navigate);

  const openDetail = () => navigate(`#/packages/${pkg.slug}`);
  const book = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate("#/book-test");
  };

  const tests = pkg.tests ?? [];

  return (
    <article
      onClick={openDetail}
      className="card-lift group flex h-full cursor-pointer flex-col overflow-hidden border border-white/10 bg-card focus-within:ring-2 focus-within:ring-gold/60"
      tabIndex={0}
      role="link"
      aria-label={`View details for ${pkg.name} package`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDetail();
        }
      }}
    >
      {/* Charcoal header band with gold hairline */}
      <div className="relative flex items-center justify-between gap-3 border-b border-gold/30 bg-secondary p-6 text-white">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-[17px] uppercase leading-snug tracking-tight">{pkg.name}</h3>
            {pkg.featured && (
              <span className="inline-flex items-center gap-1 border border-gold/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gold">
                <Sparkles className="h-3 w-3" aria-hidden />
                Featured
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-steel">
            {tests.length} {tests.length === 1 ? "test" : "tests"} included
          </p>
        </div>
        <Sparkles className="h-7 w-7 shrink-0 text-white/10" aria-hidden />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-6">
        {pkg.description && (
          <p className="text-[13.5px] leading-relaxed text-inkmuted">{pkg.description}</p>
        )}

        {tests.length > 0 && (
          <div className={tests.length > 8 ? "mt-4 pr-2" : "mt-4"}>
            <div className={tests.length > 8 ? "scroll-area" : undefined}>
              <ul className="space-y-2">
                {tests.map((t) => (
                  <li key={t.id} className="flex items-start gap-2.5 text-[13.5px] text-ink">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-gold" aria-hidden />
                    {t.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-auto border-t border-white/10 pt-5">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-steel">Package price</span>
          <span className="font-display text-xl text-ink">{formatPrice(pkg.price, pkg.priceVisible)}</span>
        </div>

        <div className="mt-4 flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              openDetail();
            }}
            className="h-11 flex-1"
          >
            View Details
          </Button>
          <Button onClick={book} className="h-11 flex-1">
            <CalendarCheck className="mr-1.5 h-4 w-4" aria-hidden />
            Book Now
          </Button>
        </div>
      </div>
    </article>
  );
}
