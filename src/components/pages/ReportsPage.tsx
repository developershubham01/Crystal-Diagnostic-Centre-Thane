"use client";

import {
  BadgeCheck,
  Clock3,
  FileLock2,
  IdCard,
  Lock,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { usePageMeta } from "@/lib/seo";
import { useSettings } from "@/lib/hooks";
import { useRouterStore } from "@/lib/store";
import { BUSINESS } from "@/lib/constants";
import { Breadcrumbs, JsonLd, PageHero, breadcrumbSchema, type Crumb } from "@/components/site/Shared";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CRUMBS: Crumb[] = [{ label: "Report Access" }];

const PLANNED_FEATURES = [
  {
    icon: IdCard,
    title: "Secure patient ID / mobile verification",
    description: "One-time verification linked to your registered mobile number before any report is shown.",
  },
  {
    icon: FileLock2,
    title: "Private report downloads",
    description: "Download your own reports as password-protected PDFs, visible only to you.",
  },
  {
    icon: Clock3,
    title: "Report status updates",
    description: "See when your sample is received, testing is in progress, and the report is ready.",
  },
] as const;

export function ReportsPage() {
  usePageMeta(
    "Report Access",
    "Information about online report access at Crystal Diagnostic Centre, Thane. Reports are currently provided at the centre counter.",
    "/reports"
  );
  const { data: settings } = useSettings();
  const navigate = useRouterStore((s) => s.navigate);

  return (
    <>
      <JsonLd data={breadcrumbSchema(CRUMBS)} />
      <PageHero
        eyebrow="Patient Reports"
        title="Report Access"
        description="How to receive and collect your diagnostic reports today, and what we are preparing for the future."
      >
        <div className="mt-6">
          <Breadcrumbs items={CRUMBS} />
        </div>
      </PageHero>

      <section className="bg-soft/40">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          {/* Main notice card */}
          <Reveal>
            <Card className="border-white/10 bg-card p-0 text-center">
              <CardContent className="flex flex-col items-center gap-4 p-8 sm:p-12">
                <span className="hex flex h-16 w-16 items-center justify-center bg-gold/10 ring-1 ring-gold/30" aria-hidden>
                  <Lock className="h-8 w-8 text-gold" />
                </span>
                <h2 className="font-display text-2xl uppercase tracking-tight text-ink sm:text-3xl">
                  {settings.reportsNotice}
                </h2>
                <p className="max-w-xl text-sm leading-relaxed text-inkmuted sm:text-[15px]">
                  Until then, reports are provided in person at the <strong className="text-ink">centre counter</strong>{" "}
                  at {BUSINESS.addressShort}. Please bring the receipt or patient reference given at the time of sample
                  collection. Patient privacy is our priority — reports are never shared over public channels, and we
                  verify identity before releasing any result.
                </p>
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  <Button size="lg" asChild>
                    <a href={BUSINESS.phoneHref}>
                      <Phone className="h-4 w-4" aria-hidden />
                      Call the Centre
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate("#/contact")}>
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    Contact Us
                  </Button>
                </div>
                <p className="mt-1 text-xs text-inkmuted">
                  For report-related calls, keep your patient reference handy. Working hours: {settings.workingHours.split("\n")[0]}
                </p>
              </CardContent>
            </Card>
          </Reveal>

          {/* Planned features */}
          <Reveal delay={0.08}>
            <div className="mt-10">
              <div className="mb-4 flex items-center justify-center gap-3">
                <h3 className="font-display text-[16px] uppercase tracking-wide text-ink">
                  What to expect when it launches
                </h3>
                <span className="metal-badge">Planned features</span>
              </div>
              <p className="mx-auto mb-6 max-w-xl text-center text-sm text-inkmuted">
                Online report access is under consideration and has not launched yet. The list below describes the
                planned experience — it is <strong className="text-ink">not available today</strong>.
              </p>
              <ul className="grid gap-4 sm:grid-cols-3">
                {PLANNED_FEATURES.map((f) => (
                  <li key={f.title}>
                    <Card className="card-lift h-full border-white/10 bg-card p-0">
                      <CardContent className="flex h-full flex-col gap-2.5 p-5">
                        <span className="flex h-10 w-10 items-center justify-center bg-white/5 ring-1 ring-white/10">
                          <f.icon className="h-5 w-5 text-teal" aria-hidden />
                        </span>
                        <p className="font-display flex items-center gap-1.5 text-[13px] uppercase tracking-wide text-ink">
                          {f.title}
                          <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-gold" aria-label="Planned" />
                        </p>
                        <p className="text-xs leading-relaxed text-inkmuted">{f.description}</p>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Privacy assurance */}
          <Reveal delay={0.12}>
            <div className="mt-8 flex items-start gap-3 border border-white/10 border-l-2 border-l-gold bg-white/[0.03] p-5">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden />
              <p className="text-xs leading-relaxed text-inkmuted">
                <strong className="text-ink">Your privacy:</strong> diagnostic results are personal medical data.
                Crystal Diagnostic Centre releases reports only to the patient (or an authorised representative) after
                verification, in line with standard diagnostic-lab confidentiality practice.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
