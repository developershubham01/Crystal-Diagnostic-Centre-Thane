"use client";

import { Eye, HeartHandshake, MapPin, Navigation, Phone, Target, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/Reveal";
import { Breadcrumbs, JsonLd, PageHero, breadcrumbSchema } from "@/components/site/Shared";
import { useRouterStore } from "@/lib/store";
import { useSettings } from "@/lib/hooks";
import { usePageMeta } from "@/lib/seo";
import { BUSINESS } from "@/lib/constants";
import { CheckList } from "./PageStates";

export function AboutPage() {
  const navigate = useRouterStore((s) => s.navigate);
  const { data: settings } = useSettings();
  usePageMeta(
    "About Us",
    `${settings.businessName} — a neighbourhood diagnostic centre at Uthalsar Naka, Thane West. Our mission, vision and patient care philosophy.`,
    "/about"
  );

  const crumbs = [{ label: "About Us" }];

  const medicalBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: settings.businessName,
    telephone: BUSINESS.phoneHref.replace("tel:", ""),
    description: settings.footerAbout,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address.split("\n").slice(0, 2).join(", "),
      addressLocality: "Thane",
      addressRegion: "Maharashtra",
      postalCode: "400601",
      addressCountry: "IN",
    },
  };

  return (
    <div className="bg-card">
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <JsonLd data={medicalBusinessSchema} />

      <PageHero
        eyebrow="About Us"
        title={`Know ${settings.businessName}`}
        description={settings.aboutIntro}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Breadcrumbs items={crumbs} />

        {/* Mission / Vision cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Reveal>
            <section
              aria-labelledby="mission-heading"
              className="card-lift h-full border border-white/10 bg-card p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center bg-white/5 ring-1 ring-white/10">
                <Target className="h-6 w-6 text-teal" aria-hidden />
              </div>
              <h2 id="mission-heading" className="font-display mt-4 text-xl uppercase tracking-tight text-ink">
                Our Mission
              </h2>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-inkmuted">{settings.aboutMission}</p>
            </section>
          </Reveal>
          <Reveal delay={0.08}>
            <section
              aria-labelledby="vision-heading"
              className="card-lift h-full border border-white/10 bg-card p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center bg-white/5 ring-1 ring-white/10">
                <Eye className="h-6 w-6 text-teal" aria-hidden />
              </div>
              <h2 id="vision-heading" className="font-display mt-4 text-xl uppercase tracking-tight text-ink">
                Our Vision
              </h2>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-inkmuted">{settings.aboutVision}</p>
            </section>
          </Reveal>
        </div>

        {/* Patient Care Philosophy + image */}
        <div className="mt-14 grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div>
              <p className="eyebrow">Patient Care Philosophy</p>
              <h2 className="font-display mt-2 text-2xl uppercase tracking-tight text-ink sm:text-[1.8rem]">
                Diagnostics is a human service first
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-inkmuted">{settings.aboutPhilosophy}</p>
              <div className="mt-6 flex items-start gap-3 border border-white/10 bg-white/[0.03] p-4">
                <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden />
                <p className="text-[13px] leading-relaxed text-inkmuted">
                  Have a question before your visit? Our front-desk team is happy to help —{" "}
                  <a href={BUSINESS.phoneHref} className="font-semibold text-gold underline-offset-2 hover:text-gold-text hover:underline">
                    call {settings.phone}
                  </a>
                  .
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <figure>
              <div className="aero-cut relative aspect-[4/3] w-full overflow-hidden border border-white/10">
                <img
                  src="/images/about-centre.jpg"
                  alt="Crystal Diagnostic Centre storefront at night with illuminated signboard, Uthalsar Naka, Thane"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="gold-line mt-4" aria-hidden />
              <figcaption className="mt-3 text-center text-[11px] uppercase tracking-[0.16em] text-inkmuted">
                Actual photograph — the illuminated Crystal Diagnostic Centre frontage at Uthalsar Naka, Thane West.
              </figcaption>
            </figure>
          </Reveal>
        </div>

        {/* Facilities + Quality checklists */}
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <Reveal>
            <section
              aria-labelledby="facilities-heading"
              className="h-full border border-white/10 bg-card p-6"
            >
              <h2 id="facilities-heading" className="font-display text-[16px] uppercase tracking-wide text-ink">
                Facilities at the Centre
              </h2>
              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-steel">
                As described by the centre. Details to be confirmed.
              </p>
              <div className="mt-4">
                <CheckList text={settings.aboutFacilities} />
              </div>
            </section>
          </Reveal>
          <Reveal delay={0.08}>
            <section
              aria-labelledby="quality-heading"
              className="h-full border border-white/10 bg-card p-6"
            >
              <h2 id="quality-heading" className="font-display text-[16px] uppercase tracking-wide text-ink">
                Our Approach to Quality
              </h2>
              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-steel">
                Care practices followed at the centre. Process details to be confirmed by the centre.
              </p>
              <div className="mt-4">
                <CheckList text={settings.aboutQuality} />
              </div>
            </section>
          </Reveal>
        </div>

        {/* Location & contact strip */}
        <Reveal>
          <section
            aria-labelledby="location-heading"
            className="mt-14 overflow-hidden border border-white/10 bg-card"
          >
            <div className="border-b border-gold/30 bg-secondary px-6 py-5 text-white sm:px-8">
              <h2 id="location-heading" className="font-display text-[16px] uppercase tracking-wide">
                Visit Us
              </h2>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-steel">
                We are easy to reach from across Thane West, opposite Varad Hospital.
              </p>
            </div>
            <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-3">
              <div>
                <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                  <MapPin className="h-4 w-4 text-teal" aria-hidden />
                  Address
                </h3>
                <address className="mt-2.5 whitespace-pre-line text-[14px] not-italic leading-relaxed text-ink">
                  {settings.address}
                </address>
              </div>
              <div>
                <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                  <Phone className="h-4 w-4 text-teal" aria-hidden />
                  Phone
                </h3>
                <a
                  href={BUSINESS.phoneHref}
                  className="mt-2.5 inline-block text-[15px] font-semibold text-ink transition-colors hover:text-gold"
                >
                  {settings.phone}
                </a>
                <h3 className="mt-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                  <Clock className="h-4 w-4 text-teal" aria-hidden />
                  Working Hours
                </h3>
                <p className="mt-2.5 whitespace-pre-line text-[14px] leading-relaxed text-ink">{settings.workingHours}</p>
                <p className="mt-1.5 text-[11.5px] italic text-inkmuted">{settings.workingHoursNote}</p>
              </div>
              <div className="flex flex-col justify-center gap-3">
                <Button
                  onClick={() => window.open(BUSINESS.mapsDirections, "_blank", "noopener,noreferrer")}
                  className="h-12 text-[13px]"
                >
                  <Navigation className="mr-2 h-4.5 w-4.5" aria-hidden />
                  Get Directions
                </Button>
                <Button variant="outline" onClick={() => navigate("#/contact")} className="h-12">
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
