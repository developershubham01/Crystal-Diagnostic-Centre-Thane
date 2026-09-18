"use client";

import { FileText } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { Breadcrumbs, JsonLd, PageHero, breadcrumbSchema, type Crumb } from "@/components/site/Shared";
import { usePageMeta } from "@/lib/seo";

export interface LegalSection {
  heading: string;
  /** Paragraphs; each entry is rendered as its own <p>. */
  paragraphs: string[];
  /** Optional bullet list rendered under the paragraphs. */
  bullets?: string[];
}

/**
 * Shared layout for the legal pages (Privacy / Terms / Disclaimer):
 * small PageHero + readable prose sections + last-updated note.
 */
export function LegalPageLayout({
  eyebrow,
  title,
  description,
  metaDescription,
  path,
  crumbs,
  sections,
}: {
  eyebrow: string;
  title: string;
  description: string;
  metaDescription: string;
  path: string;
  crumbs: Crumb[];
  sections: LegalSection[];
}) {
  usePageMeta(title, metaDescription, path);

  return (
    <div className="bg-card">
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <PageHero eyebrow={eyebrow} title={title} description={description} />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Breadcrumbs items={crumbs} />
        <Reveal>
          <p className="metal-badge mb-8 px-3 py-1.5">
            <FileText className="h-3.5 w-3.5" aria-hidden />
            Last updated: to be reviewed by the centre before launch.
          </p>
        </Reveal>

        <div className="space-y-10">
          {sections.map((section, i) => (
            <Reveal key={section.heading} delay={Math.min(i * 0.05, 0.25)}>
              <section aria-labelledby={`legal-${i}`}>
                <h2
                  id={`legal-${i}`}
                  className="font-display text-lg uppercase tracking-tight text-ink sm:text-xl"
                >
                  {section.heading}
                </h2>
                <div className="mt-3 space-y-3">
                  {section.paragraphs.map((p, j) => (
                    <p key={j} className="text-[14.5px] leading-relaxed text-inkmuted">
                      {p}
                    </p>
                  ))}
                </div>
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {section.bullets.map((b, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-ink">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-gold" aria-hidden />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
