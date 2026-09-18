"use client";

import { useMemo } from "react";
import {
  ArrowRight,
  CalendarCheck,
  ClipboardList,
  Clock,
  Droplets,
  FolderOpen,
  Info,
  Phone,
  Tag,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/Reveal";
import { Breadcrumbs, JsonLd, PageHero, breadcrumbSchema } from "@/components/site/Shared";
import { useRouterStore } from "@/lib/store";
import { useService, useServices, useSettings } from "@/lib/hooks";
import { usePageMeta } from "@/lib/seo";
import { ApiError, type ServiceDTO } from "@/lib/api-client";
import { BUSINESS } from "@/lib/constants";
import {
  DetailSkeleton,
  ErrorState,
  formatPrice,
  splitParagraphs,
  splitSentences,
} from "./PageStates";

export function ServiceDetailPage({ slug }: { slug: string }) {
  const navigate = useRouterStore((s) => s.navigate);
  const { data: settings } = useSettings();
  const { data: service, isLoading, isError, error } = useService(slug);
  const { data: allServices } = useServices();

  const loaded = service ?? null;
  usePageMeta(
    loaded ? loaded.seoTitle || loaded.name : "Diagnostic Service",
    loaded
      ? loaded.seoDescription || loaded.shortDescription || `Details for ${loaded.name} at ${settings.businessName}.`
      : undefined,
    `/services/${slug}`
  );

  const related = useMemo(() => {
    if (!loaded || !allServices) return [];
    return allServices
      .filter((s) => s.id !== loaded.id && s.categoryId === loaded.categoryId)
      .slice(0, 3);
  }, [loaded, allServices]);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (isError) {
    const is404 = error instanceof ApiError && error.status === 404;
    if (is404) return <NotFoundPanel />;
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState
          title="Could not load this service"
          message="We had trouble fetching the service details. Please try again."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!loaded) return <NotFoundPanel />;

  const crumbs = [
    { label: "Services", route: "#/services" },
    { label: loaded.name },
  ];

  const serviceSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: loaded.name,
    description: loaded.shortDescription || loaded.name,
    serviceType: loaded.category?.name || "Diagnostic testing",
    provider: {
      "@type": "MedicalBusiness",
      name: settings.businessName,
      telephone: BUSINESS.phoneHref.replace("tel:", ""),
      address: BUSINESS.addressShort,
    },
  };
  if (loaded.priceVisible && loaded.price !== null) {
    serviceSchema.offers = {
      "@type": "Offer",
      price: loaded.price,
      priceCurrency: "INR",
    };
  }

  const descriptionParagraphs = loaded.detailedDescription
    ? splitParagraphs(loaded.detailedDescription)
    : [];
  const preparationSteps = loaded.preparation ? splitSentences(loaded.preparation) : [];

  return (
    <div className="bg-card">
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <JsonLd data={serviceSchema} />

      <PageHero eyebrow="Diagnostic Service" title={loaded.name} description={loaded.shortDescription ?? undefined} />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs items={crumbs} />
        <div className="grid gap-10 lg:grid-cols-3">
          {/* ============ Left: main content ============ */}
          <div className="lg:col-span-2">
            <Reveal>
              <div className="flex flex-wrap items-center gap-2">
                <span className="metal-badge">
                  <Tag className="h-3 w-3" aria-hidden />
                  {loaded.category?.name ?? "Diagnostic Test"}
                </span>
                {loaded.featured && (
                  <span className="border border-gold/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gold">
                    Popular Test
                  </span>
                )}
              </div>

              {descriptionParagraphs.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {descriptionParagraphs.map((p, i) => (
                    <p key={i} className="text-[14.5px] leading-relaxed text-inkmuted">
                      {p}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-6 border border-dashed border-white/15 bg-white/[0.03] p-5 text-[13.5px] leading-relaxed text-inkmuted">
                  Detailed information for this test is being prepared. Please contact the centre for specifics —
                  our team will be happy to explain the procedure.
                </p>
              )}
            </Reveal>

            {/* Preparation instructions */}
            {preparationSteps.length > 0 && (
              <Reveal delay={0.05}>
                <section
                  aria-labelledby="prep-heading"
                  className="mt-8 border border-white/10 border-l-2 border-l-gold bg-white/[0.03] p-6"
                >
                  <h2
                    id="prep-heading"
                    className="font-display flex items-center gap-2.5 text-[15px] uppercase tracking-wide text-ink"
                  >
                    <span className="flex h-9 w-9 items-center justify-center bg-white/5 ring-1 ring-white/10">
                      <ClipboardList className="h-4.5 w-4.5 text-teal" aria-hidden />
                    </span>
                    Preparation Instructions
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

            {/* Sample-data note if the copy carries one */}
            {loaded.detailedDescription?.includes("[Sample data") && (
              <p className="mt-4 text-[11.5px] italic leading-relaxed text-inkmuted">
                Note: this description contains sample data pending verification by the centre.
              </p>
            )}

            {/* Related services */}
            {related.length > 0 && (
              <Reveal delay={0.05}>
                <section aria-labelledby="related-heading" className="mt-12">
                  <h2
                    id="related-heading"
                    className="font-display text-xl uppercase tracking-tight text-ink"
                  >
                    Related Services
                  </h2>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {related.map((r) => (
                      <RelatedCard key={r.id} service={r} />
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate("#/services")}
                    className="mt-6 min-h-[44px]"
                  >
                    View All Services
                    <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                  </Button>
                </section>
              </Reveal>
            )}
          </div>

          {/* ============ Right: sticky sidebar ============ */}
          <div>
            <div className="lg:sticky lg:top-24">
              <Reveal delay={0.08}>
                <aside
                  aria-label="Request this test"
                  className="overflow-hidden border border-white/10 bg-card"
                >
                  <div className="border-b border-gold/30 bg-secondary p-5 text-white">
                    <h2 className="font-display text-[15px] uppercase tracking-wide">Request this Test</h2>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-white/70">
                      Send an appointment request — our team will call you to confirm the slot and preparation.
                    </p>
                  </div>

                  <div className="space-y-3 p-5">
                    <Button
                      onClick={() => navigate("#/book-test")}
                      className="h-12 w-full text-[13px]"
                    >
                      <CalendarCheck className="mr-2 h-4.5 w-4.5" aria-hidden />
                      Request this Test
                    </Button>
                    <a
                      href={BUSINESS.phoneHref}
                      className="flex h-12 w-full items-center justify-center gap-2 border border-white/15 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-gold/60 hover:text-gold"
                    >
                      <Phone className="h-4.5 w-4.5 text-teal" aria-hidden />
                      Call {settings.phone}
                    </a>

                    {/* Quick facts */}
                    <dl className="mt-5 divide-y divide-white/10 border-t border-white/10 text-[13px]">
                      <div className="flex items-start justify-between gap-3 py-3">
                        <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-steel">
                          <Droplets className="h-3.5 w-3.5 text-teal" aria-hidden />
                          Sample Type
                        </dt>
                        <dd className="text-right font-semibold text-ink">{loaded.sampleType || "To be confirmed"}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-3 py-3">
                        <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-steel">
                          <Clock className="h-3.5 w-3.5 text-teal" aria-hidden />
                          Report Time
                        </dt>
                        <dd className="text-right font-semibold text-ink">{loaded.turnaroundTime || "To be confirmed"}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-3 py-3">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-steel">Category</dt>
                        <dd className="text-right font-semibold text-ink">{loaded.category?.name ?? "To be confirmed"}</dd>
                      </div>
                    </dl>

                    {/* Price row */}
                    <div className="border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-steel">Price</span>
                        <span className="font-display text-lg text-ink">
                          {formatPrice(loaded.price, loaded.priceVisible)}
                        </span>
                      </div>
                      {(loaded.price === null || !loaded.priceVisible) && (
                        <p className="mt-1 text-[11.5px] leading-relaxed text-inkmuted">
                          Pricing to be confirmed by the centre.
                        </p>
                      )}
                    </div>
                  </div>
                </aside>

                {/* Medical disclaimer footnote */}
                <Alert className="mt-5 border-white/10 bg-white/[0.03]">
                  <Info className="h-4 w-4 text-teal" aria-hidden />
                  <AlertTitle className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
                    Please note
                  </AlertTitle>
                  <AlertDescription className="text-[12px] leading-relaxed text-inkmuted">
                    This page is informational only and does not provide medical advice. Always follow the guidance of
                    your treating doctor.
                  </AlertDescription>
                </Alert>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mini card for related services. */
function RelatedCard({ service }: { service: ServiceDTO }) {
  const navigate = useRouterStore((s) => s.navigate);
  return (
    <button
      onClick={() => navigate(`#/services/${service.slug}`)}
      className="card-lift group h-full min-h-[44px] border border-white/10 bg-card p-4 text-left hover:border-gold/40"
      aria-label={`View ${service.name}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-steel">
        {service.category?.name ?? "Diagnostic Test"}
      </p>
      <h3 className="font-display mt-1.5 text-[14px] uppercase leading-snug text-ink transition-colors group-hover:text-gold-text">
        {service.name}
      </h3>
      {service.shortDescription && (
        <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-inkmuted">{service.shortDescription}</p>
      )}
      <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-inkmuted transition-colors group-hover:text-gold">
        View details
        <ArrowRight className="h-3 w-3" aria-hidden />
      </span>
    </button>
  );
}

/** Friendly 404 panel for unknown slugs. */
function NotFoundPanel() {
  const navigate = useRouterStore((s) => s.navigate);
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center bg-white/5 ring-1 ring-white/10">
          <FolderOpen className="h-7 w-7 text-teal" aria-hidden />
        </div>
        <h1 className="font-display text-2xl uppercase tracking-tight text-ink">Service not found</h1>
        <p className="max-w-md text-sm leading-relaxed text-inkmuted">
          The test you are looking for may not be published yet, or the link may be outdated. Browse the full service
          list or contact the centre — our team will help you find the right test.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => navigate("#/services")} className="min-h-[44px] px-6">
            Back to Services
          </Button>
          <Button variant="outline" onClick={() => navigate("#/contact")} className="min-h-[44px] px-6">
            Contact Us
          </Button>
        </div>
      </div>
    </div>
  );
}
