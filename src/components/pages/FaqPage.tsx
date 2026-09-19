"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HelpCircle, MessageCircleQuestion, Phone, Search } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/site/Reveal";
import { Breadcrumbs, JsonLd, PageHero, breadcrumbSchema } from "@/components/site/Shared";
import { useRouterStore } from "@/lib/store";
import { useFaqs, useSettings } from "@/lib/hooks";
import { usePageMeta } from "@/lib/seo";
import { BUSINESS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { FaqDTO as FaqDTOModel } from "@/lib/api-client";
import { EmptyState, ErrorState } from "./PageStates";

export function FaqPage() {
  const navigate = useRouterStore((s) => s.navigate);
  const { data: settings } = useSettings();
  const { data: faqs, isLoading, isError, refetch } = useFaqs();
  usePageMeta(
    "FAQ",
    "Frequently asked questions about appointments, test preparation, reports and visiting Crystal Diagnostic Centre, Thane West.",
    "/faq"
  );

  const crumbs = [{ label: "FAQ" }];
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  // Per-category controlled accordions (deep links open a specific question)
  const [openMap, setOpenMap] = useState<Record<string, string>>({});
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // Deep-link seed: #/faq?q=<faqId> opens + scrolls to that answer once.
  const [pendingFaq] = useState(() => {
    if (typeof window === "undefined") return null;
    const m = /[?&]q=([A-Za-z0-9_-]+)/.exec(window.location.hash);
    return m ? m[1] : null;
  });
  // Also react to deep links that arrive while the page is already mounted
  // (same-document hash navigations — e.g. a shared link opened from #/faq).
  const lastApplied = useRef<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const apply = (id: string) => {
      if (lastApplied.current === id || !faqs) return;
      const faq = faqs.find((f) => f.id === id);
      if (!faq) return;
      lastApplied.current = id;
      const cat = faq.category?.trim() || "General";
      setOpenMap((m) => ({ ...m, [cat]: faq.id }));
      setHighlightId(faq.id);
      const scroll = setTimeout(() => {
        document
          .querySelector(`[data-faq-id="${faq.id}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
      const clear = setTimeout(() => setHighlightId(null), 4000);
      timers.current.push(scroll, clear);
    };
    if (pendingFaq) apply(pendingFaq);
    const onHash = () => {
      const m = /[?&]q=([A-Za-z0-9_-]+)/.exec(window.location.hash);
      if (m) apply(m[1]);
    };
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("hashchange", onHash);
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [faqs, pendingFaq]);

  const all = useMemo(() => faqs ?? [], [faqs]);

  const filtered = useMemo(() => {
    if (!normalizedQuery) return all;
    return all.filter(
      (f) =>
        f.question.toLowerCase().includes(normalizedQuery) ||
        f.answer.toLowerCase().includes(normalizedQuery)
    );
  }, [all, normalizedQuery]);

  // Group by category, preserving sort order
  const groups = useMemo(() => {
    const map = new Map<string, FaqDTOModel[]>();
    for (const f of filtered) {
      const key = f.category?.trim() || "General";
      const list = map.get(key) ?? [];
      list.push(f);
      map.set(key, list);
    }
    return [...map.entries()].map(([category, items]) => ({ category, items }));
  }, [filtered]);

  const faqSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: all.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    }),
    [all]
  );

  return (
    <div className="bg-card">
      <JsonLd data={breadcrumbSchema(crumbs)} />
      {all.length > 0 && <JsonLd data={faqSchema} />}

      <PageHero
        eyebrow="Help Centre"
        title="Frequently Asked Questions"
        description="Quick answers about appointments, test preparation, reports and visiting the centre. For anything else, our team is one call away."
      />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <Breadcrumbs items={crumbs} />

        {/* Live search */}
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-inkmuted"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions — e.g. fasting, reports, appointment…"
            aria-label="Search frequently asked questions"
            className="h-12 border-white/15 bg-iron pl-11 pr-4 text-[14px] text-ink placeholder:text-inkmuted focus-visible:border-gold focus-visible:ring-gold/40"
          />
        </div>

        {isLoading && (
          <div className="mt-8 space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="border border-white/10 bg-card p-5">
                <Skeleton className="h-5 w-28" />
                <div className="mt-4 space-y-3">
                  {[0, 1, 2].map((j) => (
                    <Skeleton key={j} className="h-10 w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <div className="mt-8">
            <ErrorState
              title="Could not load FAQs"
              message="We had trouble fetching the questions. Please try again."
              onRetry={() => refetch()}
            />
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="mt-8">
            <EmptyState
              title={normalizedQuery ? "No matching questions" : "No questions published yet"}
              message={
                normalizedQuery
                  ? `Nothing matched “${query.trim()}”. Try a different word — or call us, we are happy to answer directly.`
                  : "FAQs will appear here once published by the centre. Please contact us directly for any questions."
              }
              action={
                normalizedQuery ? (
                  <Button onClick={() => setQuery("")} className="mt-1 min-h-[44px]">
                    Clear search
                  </Button>
                ) : undefined
              }
            />
          </div>
        )}

        {/* Grouped accordions */}
        {!isLoading && !isError && groups.length > 0 && (
          <div className="mt-8 space-y-8">
            {groups.map((group) => (
              <section key={group.category} aria-labelledby={`faq-cat-${group.category}`}>
                <Reveal>
                  <div className="flex items-center gap-2.5">
                    <MessageCircleQuestion className="h-5 w-5 text-teal" aria-hidden />
                    <h2
                      id={`faq-cat-${group.category}`}
                      className="font-display text-[15px] uppercase tracking-wide text-ink"
                    >
                      {group.category}
                    </h2>
                    <span className="metal-badge">{group.items.length}</span>
                  </div>
                  <Accordion
                    type="single"
                    collapsible
                    className="mt-4 border border-white/10 bg-card px-5"
                    value={openMap[group.category] ?? ""}
                    onValueChange={(v) => setOpenMap((m) => ({ ...m, [group.category]: v }))}
                  >
                    {group.items.map((faq) => (
                      <AccordionItem
                        key={faq.id}
                        value={faq.id}
                        data-faq-id={faq.id}
                        className={cn(
                          "border-white/10 transition-colors duration-500",
                          highlightId === faq.id && "bg-gold/[0.06] ring-1 ring-inset ring-gold/40"
                        )}
                      >
                        <AccordionTrigger className="min-h-[44px] py-4 text-[13px] font-semibold uppercase tracking-[0.02em] text-ink hover:text-gold hover:no-underline [&>svg]:text-gold">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-[13.5px] leading-relaxed text-inkmuted">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Reveal>
              </section>
            ))}
          </div>
        )}

        {/* Still have questions? */}
        <Reveal delay={0.05}>
          <section
            aria-labelledby="still-questions"
            className="mt-12 overflow-hidden border border-white/10 bg-card"
          >
            <div className="flex flex-col items-start gap-5 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-white/5 ring-1 ring-white/10">
                  <HelpCircle className="h-6 w-6 text-teal" aria-hidden />
                </div>
                <div>
                  <h2 id="still-questions" className="font-display text-[16px] uppercase tracking-wide text-ink">
                    Still have questions?
                  </h2>
                  <p className="mt-1 max-w-sm text-[13.5px] leading-relaxed text-inkmuted">
                    Call the centre during working hours or send us a message — we usually respond the same day.
                  </p>
                </div>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button asChild className="h-11 px-6">
                  <a href={BUSINESS.phoneHref}>
                    <Phone className="h-4 w-4" aria-hidden />
                    Call {settings.phone}
                  </a>
                </Button>
                <Button variant="outline" onClick={() => navigate("#/contact")} className="h-11 px-6">
                  Contact Us
                </Button>
              </div>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
