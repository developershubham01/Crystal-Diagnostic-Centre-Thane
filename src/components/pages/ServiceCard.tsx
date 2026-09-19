"use client";

import { ArrowRight, CalendarCheck, Clock, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouterStore } from "@/lib/store";
import type { ServiceDTO } from "@/lib/api-client";
import { formatPrice } from "./PageStates";

/** Card used in the ServicesPage grid — clicking anywhere navigates to detail. */
export function ServiceCard({ service }: { service: ServiceDTO }) {
  const navigate = useRouterStore((s) => s.navigate);

  const openDetail = () => navigate(`#/services/${service.slug}`);
  const book = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate("#/book-test");
  };

  return (
    <article
      onClick={openDetail}
      className="card-lift group flex h-full cursor-pointer flex-col border border-white/10 bg-card p-5 text-left focus-within:ring-2 focus-within:ring-gold/60"
      tabIndex={0}
      role="link"
      aria-label={`View details for ${service.name}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDetail();
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="metal-badge">{service.category?.name ?? "Diagnostic Test"}</span>
        {service.featured && (
          <span className="border border-gold/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gold">
            Popular
          </span>
        )}
      </div>

      <h3 className="font-display mt-3.5 text-[16px] uppercase leading-snug tracking-tight text-ink transition-colors group-hover:text-gold-text">
        {service.name}
      </h3>

      {service.shortDescription && (
        <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-inkmuted">{service.shortDescription}</p>
      )}

      {/* Sample type + turnaround mini row */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-inkmuted">
        <span className="inline-flex items-center gap-1.5">
          <Droplets className="h-3.5 w-3.5 text-teal" aria-hidden />
          {service.sampleType || "Sample type: to be confirmed"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-teal" aria-hidden />
          {service.turnaroundTime || "Report time: to be confirmed"}
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-steel">Price</span>
          <span className="font-display text-[15px] text-ink">{formatPrice(service.price, service.priceVisible)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={book} className="h-9 px-4">
            <CalendarCheck className="mr-1 h-3.5 w-3.5" aria-hidden />
            Book
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              openDetail();
            }}
            className="h-9 px-4"
          >
            View Details
            <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
      </div>
    </article>
  );
}
