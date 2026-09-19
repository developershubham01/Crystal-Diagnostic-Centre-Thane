"use client";

import { ChevronRight, Home } from "lucide-react";
import { useRouterStore, type Route } from "@/lib/store";

export interface Crumb {
  label: string;
  route?: string; // hash route; omit for current page (non-link)
}

/** Breadcrumb navigation with BreadcrumbList schema rendered by the page. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const navigate = useRouterStore((s) => s.navigate);
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-[11px] uppercase tracking-[0.14em]">
        <li>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1 font-semibold text-inkmuted transition-colors hover:text-gold"
          >
            <Home className="h-3.5 w-3.5" aria-hidden />
            Home
          </button>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-graphite" aria-hidden />
            {item.route ? (
              <button
                onClick={() => navigate(item.route!)}
                className="font-semibold text-inkmuted transition-colors hover:text-gold"
              >
                {item.label}
              </button>
            ) : (
              <span aria-current="page" className="font-semibold text-gold">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Shared inner-page hero band — a lit stage on the black canvas. */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-radial-soft relative overflow-hidden border-b border-white/10">
      <div
        className="bg-med-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_80%_at_50%_0%,black,transparent)]"
        aria-hidden
      />
      {/* gold horizon accent */}
      <div className="gold-line absolute bottom-0 left-1/2 w-2/3 -translate-x-1/2 opacity-70" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display-caps mt-3 max-w-3xl text-3xl text-ink sm:text-4xl lg:text-5xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-inkmuted">{description}</p>}
        {children}
      </div>
    </section>
  );
}

/** JSON-LD injector for structured data (client-side). */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function breadcrumbSchema(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      ...items.map((c, i) => ({ "@type": "ListItem", position: i + 2, name: c.label })),
    ],
  };
}

export type { Route };
