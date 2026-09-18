"use client";

import { PackageOpen } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { Breadcrumbs, JsonLd, PageHero, breadcrumbSchema } from "@/components/site/Shared";
import { usePackages, useSettings } from "@/lib/hooks";
import { usePageMeta } from "@/lib/seo";
import { PackageCard } from "./PackageCard";
import { PackageFinder } from "./PackageFinder";
import { EmptyState, ErrorState } from "./PageStates";

export function PackagesPage() {
  const { data: settings } = useSettings();
  const { data: packages, isLoading, isError, refetch } = usePackages();
  usePageMeta(
    "Health Packages",
    "Preventive health packages at Crystal Diagnostic Centre, Thane West. View package contents and request an appointment — call +91 8828393955.",
    "/packages"
  );

  const crumbs = [{ label: "Health Packages" }];
  const list = packages ?? [];

  return (
    <div className="bg-card">
      <JsonLd data={breadcrumbSchema(crumbs)} />

      <PageHero
        eyebrow="Health Packages"
        title="Preventive Health Packages"
        description={settings.homePackagesIntro}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <Breadcrumbs items={crumbs} />

        {isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div className="h-96 animate-pulse border border-white/10 bg-card" key={i}>
                <div className="h-24 border-b border-gold/30 bg-secondary" />
                <div className="space-y-3 p-6">
                  <div className="h-4 w-full bg-soft" />
                  <div className="h-4 w-5/6 bg-soft" />
                  <div className="h-4 w-2/3 bg-soft" />
                  <div className="h-11 w-full bg-soft" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <ErrorState
            title="Could not load packages"
            message="We had trouble fetching the health packages. Please try again."
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && list.length === 0 && (
          <EmptyState
            title="Packages coming soon"
            message="Preventive health packages will appear here once published by the centre. In the meantime, you can request any individual test directly."
          />
        )}

        {!isLoading && !isError && list.length > 0 && (
          <>
            <div className="mb-10">
              <PackageFinder packages={list} />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {list.map((pkg, i) => (
                <Reveal key={pkg.id} delay={Math.min(i * 0.06, 0.3)}>
                  <PackageCard pkg={pkg} />
                </Reveal>
              ))}
            </div>
            <p className="mt-8 flex items-start gap-2.5 border-l-2 border-gold/50 bg-white/[0.03] px-4 py-3 text-xs leading-relaxed text-inkmuted">
              <PackageOpen className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
              Package contents are sample data pending confirmation by the centre. Final inclusions and pricing will be
              confirmed at the time of booking.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
