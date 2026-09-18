"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/site/Reveal";
import { Breadcrumbs, JsonLd, PageHero, breadcrumbSchema } from "@/components/site/Shared";
import { useCategories, useServices, useSettings } from "@/lib/hooks";
import { usePageMeta } from "@/lib/seo";
import { ServiceCard } from "./ServiceCard";
import { EmptyState, ErrorState } from "./PageStates";
import { FilterChip } from "./Lightbox";

export function ServicesPage() {
  const { data: settings } = useSettings();
  const { data: categories, isLoading: catsLoading } = useCategories();
  const { data: services, isLoading: servicesLoading, isError, refetch } = useServices();
  usePageMeta(
    "Diagnostic Services",
    "Explore diagnostic services at Crystal Diagnostic Centre, Thane — blood tests, pathology, imaging and more. Request an appointment online or call +91 8828393955.",
    "/services"
  );

  const crumbs = [{ label: "Services" }];

  // Search: local input debounced 300 ms, then case-insensitive client-side
  // filtering (server-side LIKE is case-sensitive on SQLite).
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null); // null = All

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const allServices = useMemo(() => services ?? [], [services]);

  const visibleServices = useMemo(() => {
    let list = activeCategory
      ? allServices.filter((s) => s.category?.slug === activeCategory)
      : allServices;
    if (debouncedSearch) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(debouncedSearch) ||
          (s.shortDescription ?? "").toLowerCase().includes(debouncedSearch)
      );
    }
    return list;
  }, [allServices, activeCategory, debouncedSearch]);

  const hasFilters = activeCategory !== null || debouncedSearch !== "";
  const clearFilters = () => {
    setSearchInput("");
    setActiveCategory(null);
  };

  return (
    <div className="bg-card">
      <JsonLd data={breadcrumbSchema(crumbs)} />

      <PageHero
        eyebrow="Diagnostic Services"
        title="Explore Our Diagnostic Services"
        description={settings.homeServicesIntro}
      />

      {/* Sticky toolbar: search + category chips */}
      <div className="sticky top-16 z-30 border-b border-white/10 bg-black/85 backdrop-blur-md md:top-[4.5rem]">
        <div className="mx-auto max-w-7xl space-y-3 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="relative max-w-xl">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-inkmuted"
              aria-hidden
            />
            <Input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search tests — e.g. blood, sugar, X-ray…"
              aria-label="Search diagnostic services"
              className="h-11 border-white/15 bg-iron pl-11 pr-4 text-[14px] text-ink placeholder:text-inkmuted focus-visible:border-gold focus-visible:ring-gold/40"
            />
          </div>
          <div
            className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="Filter by category"
          >
            <FilterChip active={activeCategory === null} onClick={() => setActiveCategory(null)}>
              All
            </FilterChip>
            {catsLoading &&
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-11 w-28 shrink-0" />)}
            {(categories ?? []).map((cat) => (
              <FilterChip
                key={cat.id}
                active={activeCategory === cat.slug}
                onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug)}
                count={cat.serviceCount ?? 0}
              >
                {cat.name}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8" aria-label="Diagnostic services list">
        <Breadcrumbs items={crumbs} />
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-inkmuted" aria-live="polite">
            Showing <span className="text-ink">{visibleServices.length}</span> of{" "}
            <span className="text-ink">{allServices.length}</span> services
            {activeCategory &&
              ` in “${categories?.find((c) => c.slug === activeCategory)?.name ?? "selected category"}”`}
          </p>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="min-h-[44px] text-inkmuted hover:text-gold"
            >
              Clear filters
            </Button>
          )}
        </div>

        {servicesLoading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-64 animate-pulse border border-white/10 bg-card p-5">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="mt-4 h-6 w-3/4" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-1.5 h-4 w-2/3" />
                <Skeleton className="mt-6 h-9 w-full" />
              </div>
            ))}
          </div>
        )}

        {!servicesLoading && isError && (
          <ErrorState
            title="Could not load services"
            message="We had trouble fetching the service list. Please try again."
            onRetry={() => refetch()}
          />
        )}

        {!servicesLoading && !isError && visibleServices.length === 0 && (
          <EmptyState
            title={hasFilters ? "No services match your filters" : "Services coming soon"}
            message={
              hasFilters
                ? "Try a different search term or category — or contact the centre directly to ask about a specific test."
                : "The centre has not published its service list yet. Please check back soon or contact us by phone."
            }
            action={
              hasFilters ? (
                <Button onClick={clearFilters} className="mt-1 min-h-[44px]">
                  Clear all filters
                </Button>
              ) : undefined
            }
          />
        )}

        {!servicesLoading && !isError && visibleServices.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleServices.map((service, i) => (
              <Reveal key={service.id} delay={Math.min(i * 0.05, 0.3)}>
                <ServiceCard service={service} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
