"use client";

import {
  ArrowLeft,
  CalendarCheck,
  ClipboardList,
  FlaskConical,
  Info,
  ListChecks,
  Phone,
  Users,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/Reveal";
import { Breadcrumbs, JsonLd, PageHero, breadcrumbSchema } from "@/components/site/Shared";
import { useRouterStore } from "@/lib/store";
import { usePackage, useSettings } from "@/lib/hooks";
import { usePageMeta } from "@/lib/seo";
import { ApiError } from "@/lib/api-client";
import { BUSINESS } from "@/lib/constants";
import {
  DetailSkeleton,
  ErrorState,
  formatPrice,
  splitParagraphs,
  splitSentences,
} from "./PageStates";

export function PackageDetailPage({ slug }: { slug: string }) {
  const navigate = useRouterStore((s) => s.navigate);
  const { data: settings } = useSettings();
  const { data: pkg, isLoading, isError, error } = usePackage(slug);

  const loaded = pkg ?? null;
  usePageMeta(
    loaded ? loaded.name : "Health Package",
    loaded
      ? loaded.description || `Details for the ${loaded.name} health package at ${settings.businessName}.`
      : undefined,
    `/packages/${slug}`
  );

  if (isLoading) return <DetailSkeleton />;

  if (isError) {
    const is404 = error instanceof ApiError && error.status === 404;
    if (is404) return <PackageNotFoundPanel />;
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState
          title="Could not load this package"
          message="We had trouble fetching the package details. Please try again."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!loaded) return <PackageNotFoundPanel />;

  const crumbs = [
    { label: "Health Packages", route: "#/packages" },
    { label: loaded.name },
  ];

  const tests = loaded.tests ?? [];
  const descriptionParagraphs = loaded.detailedDescription ? splitParagraphs(loaded.detailedDescription) : [];
  const preparationSteps = loaded.preparation ? splitSentences(loaded.preparation) : [];

  return (
    <div className="bg-card">
      <JsonLd data={breadcrumbSchema(crumbs)} />

      <PageHero
        eyebrow="Health Package"
        title={loaded.name}
        description={loaded.description ?? undefined}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs items={crumbs} />

        <div className="grid gap-10 lg:grid-cols-3">
          {/* ============ Left: main content ============ */}
          <div className="lg:col-span-2">
            <Reveal>
              {descriptionParagraphs.length > 0 && (
                <div className="space-y-4">
                  {descriptionParagraphs.map((p, i) => (
                    <p key={i} className="text-[14.5px] leading-relaxed text-inkmuted">
                      {p}
                    </p>
                  ))}
                </div>
              )}
            </Reveal>

            {/* Tests included */}
            <Reveal delay={0.05}>
              <section
                aria-labelledby="tests-heading"
                className="mt-8 overflow-hidden border border-white/10 bg-card"
              >
                <div className="flex items-center justify-between gap-3 border-b border-gold/30 bg-secondary px-6 py-4 text-white">
                  <h2
                    id="tests-heading"
                    className="font-display flex items-center gap-2.5 text-[15px] uppercase tracking-wide"
                  >
                    <ListChecks className="h-5 w-5 text-gold" aria-hidden />
                    Tests Included
                  </h2>
                  <span className="metal-badge">
                    {tests.length} {tests.length === 1 ? "test" : "tests"}
                  </span>
                </div>
                {tests.length > 0 ? (
                  <ol className={tests.length > 8 ? "scroll-area" : undefined}>
                    {tests.map((t, i) => (
                      <li
                        key={t.id}
                        className="flex items-start gap-3.5 border-b border-white/10 px-6 py-3.5 last:border-b-0"
                      >
                        <span className="font-display mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center bg-white/5 text-[11px] text-gold ring-1 ring-white/10">
                          {i + 1}
                        </span>
                        <span className="text-[14px] leading-relaxed text-ink">{t.name}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="px-6 py-6 text-[13.5px] leading-relaxed text-inkmuted">
                    The list of tests in this package is being prepared — to be confirmed by the centre.
                  </p>
                )}
              </section>
            </Reveal>

            {/* Preparation */}
            {preparationSteps.length > 0 && (
              <Reveal delay={0.05}>
                <section
                  aria-labelledby="pkg-prep-heading"
                  className="mt-6 border border-white/10 border-l-2 border-l-gold bg-white/[0.03] p-6"
                >
                  <h2
                    id="pkg-prep-heading"
                    className="font-display flex items-center gap-2.5 text-[15px] uppercase tracking-wide text-ink"
                  >
                    <span className="flex h-9 w-9 items-center justify-center bg-white/5 ring-1 ring-white/10">
                      <ClipboardList className="h-4.5 w-4.5 text-teal" aria-hidden />
                    </span>
                    Preparation
                  </h2>
                  <ol className="mt-4 space-y-2.5">
                    {preparationSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-[14px] leading-relaxed text-ink">
                        <span className="font-display mt-0.5 flex h-5.5 w-5.5 shrink-0 items-center justify-center bg-white/5 text-[11px] text-gold ring-1 ring-white/10">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </section>
              </Reveal>
            )}

            {/* Applicability — only if present, else default note */}
            <Reveal delay={0.05}>
              <section aria-labelledby="pkg-appl-heading" className="mt-6 border border-white/10 bg-white/[0.03] p-6">
                <h2
                  id="pkg-appl-heading"
                  className="font-display flex items-center gap-2.5 text-[14px] uppercase tracking-wide text-ink"
                >
                  <Users className="h-4.5 w-4.5 text-teal" aria-hidden />
                  Who is this package for?
                </h2>
                <p className="mt-2.5 text-[14px] leading-relaxed text-ink">
                  {loaded.applicability || "Applicability details to be confirmed — please contact the centre."}
                </p>
              </section>
            </Reveal>

            {/* Sample-data compliance note */}
            <Reveal delay={0.05}>
              <Alert className="mt-6 border-white/10 bg-white/[0.03]">
                <Info className="h-4 w-4 text-teal" aria-hidden />
                <AlertDescription className="text-[12px] leading-relaxed text-inkmuted">
                  Package contents are sample data pending confirmation by the centre. Please verify the final list of
                  tests, preparation requirements and pricing when booking.
                </AlertDescription>
              </Alert>
            </Reveal>
          </div>

          {/* ============ Right: sticky sidebar ============ */}
          <div>
            <div className="lg:sticky lg:top-24">
              <Reveal delay={0.08}>
                <aside
                  aria-label="Book this package"
                  className="overflow-hidden border border-white/10 bg-card"
                >
                  <div className="border-b border-gold/30 bg-secondary p-5 text-white">
                    <h2 className="font-display text-[15px] uppercase tracking-wide">Book this Package</h2>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-white/70">
                      Request an appointment and our team will confirm the slot, preparation and final inclusions.
                    </p>
                  </div>

                  <div className="space-y-3 p-5">
                    <div className="border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-steel">
                          Package price
                        </span>
                        <span className="font-display text-xl text-ink">
                          {formatPrice(loaded.price, loaded.priceVisible)}
                        </span>
                      </div>
                      {(loaded.price === null || !loaded.priceVisible) && (
                        <p className="mt-1 text-[11.5px] leading-relaxed text-inkmuted">
                          Pricing to be confirmed by the centre.
                        </p>
                      )}
                    </div>

                    <Button onClick={() => navigate("#/book-test")} className="h-12 w-full text-[13px]">
                      <CalendarCheck className="mr-2 h-4.5 w-4.5" aria-hidden />
                      Book Now
                    </Button>
                    <a
                      href={BUSINESS.phoneHref}
                      className="flex h-12 w-full items-center justify-center gap-2 border border-white/15 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-gold/60 hover:text-gold"
                    >
                      <Phone className="h-4.5 w-4.5 text-teal" aria-hidden />
                      Call {settings.phone}
                    </a>

                    <div className="flex items-start gap-2.5 border-t border-white/10 pt-4 text-[12px] leading-relaxed text-inkmuted">
                      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
                      Appointment requests are confirmed by phone. Fasting or other preparation needs are shared at the
                      time of confirmation.
                    </div>
                  </div>
                </aside>

                <Button
                  variant="ghost"
                  onClick={() => navigate("#/packages")}
                  className="mt-4 min-h-[44px] w-full text-inkmuted hover:text-gold"
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
                  Back to All Packages
                </Button>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Friendly 404 panel for unknown package slugs. */
function PackageNotFoundPanel() {
  const navigate = useRouterStore((s) => s.navigate);
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center bg-white/5 ring-1 ring-white/10">
          <FlaskConical className="h-7 w-7 text-teal" aria-hidden />
        </div>
        <h1 className="font-display text-2xl uppercase tracking-tight text-ink">Package not found</h1>
        <p className="max-w-md text-sm leading-relaxed text-inkmuted">
          The package you are looking for may not be published yet, or the link may be outdated. Browse all packages or
          contact the centre for the current list.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => navigate("#/packages")} className="min-h-[44px] px-6">
            Back to Packages
          </Button>
          <Button variant="outline" onClick={() => navigate("#/contact")} className="min-h-[44px] px-6">
            Contact Us
          </Button>
        </div>
      </div>
    </div>
  );
}
