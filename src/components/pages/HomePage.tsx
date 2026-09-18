"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  ClipboardCheck,
  HeartHandshake,
  MapPin,
  Phone,
  ShieldCheck,
  FlaskConical,
  Microscope,
  ScanLine,
  Droplets,
  Stethoscope,
  Sparkles,
  Clock,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoMark } from "@/components/brand/Logo";
import { Lazy3D, loadHeroCrystal, loadDnaShowcase } from "@/components/three/Lazy3D";
import { Reveal } from "@/components/site/Reveal";
import { TestimonialsSection } from "@/components/site/TestimonialsSection";
import { useRouterStore } from "@/lib/store";
import { useSettings, useCategories, usePackages, useGallery } from "@/lib/hooks";
import { parseWhyChooseUs } from "@/lib/settings";
import { usePageMeta } from "@/lib/seo";
import { useIsMobile } from "@/hooks/use-mobile";
import { BUSINESS } from "@/lib/constants";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Droplets,
  Microscope,
  ScanLine,
  HeartPulse: HeartHandshake,
  Stethoscope,
  FlaskConical,
};

function formatPrice(price: number | null, visible: boolean) {
  if (!visible || price === null) return "Price on request";
  return `₹${price.toLocaleString("en-IN")}`;
}

export function HomePage() {
  const navigate = useRouterStore((s) => s.navigate);
  const { data: settings } = useSettings();
  const { data: categories, isLoading: catsLoading } = useCategories();
  const { data: packages, isLoading: pkgsLoading } = usePackages({ featured: true });
  const { data: gallery = [] } = useGallery();
  // The storefront photo already features in "Why Choose Us" — exclude it here.
  const galleryImages = gallery.filter(
    (g) => g.url !== "/images/about-centre.jpg" && g.url !== "/images/gallery/centre-4.jpg"
  );
  const isMobile = useIsMobile() ?? false;
  const whyItems = parseWhyChooseUs(settings.whyChooseUs).slice(0, 4);
  usePageMeta("", settings.seoDescription, "/");

  const go = (hash: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(hash);
  };

  const trustCards = [
    {
      icon: CalendarCheck,
      title: "Convenient Appointment Requests",
      text: "Request a test slot online in under a minute — our team confirms the details with you by phone.",
    },
    {
      icon: ClipboardCheck,
      title: "Transparent Test Information",
      text: "Clear preparation instructions and test details, so you arrive ready and confident.",
    },
    {
      icon: HeartHandshake,
      title: "Patient-Focused Service",
      text: "A caring front-desk team that takes time to answer your questions without rushing.",
    },
    {
      icon: MapPin,
      title: "Easy Location Access",
      text: "Opposite Varad Hospital at Uthalsar Naka — easy to reach from across Thane West.",
    },
  ];

  const sciencePoints = [
    {
      icon: ShieldCheck,
      title: "Careful Process",
      text: "Sample labelling, handling and verification at every step.",
    },
    {
      icon: Clock,
      title: "Timely Reporting",
      text: "Clear turnaround expectations communicated upfront.",
    },
    {
      icon: FileCheck,
      title: "Doctor-Friendly Reports",
      text: "Organised, readable reports your doctor can act on.",
    },
  ];

  return (
    <div className="bg-background">
      {/* ============================ HERO ============================ */}
      <section className="bg-radial-soft relative overflow-hidden" aria-labelledby="hero-heading">
        <div className="bg-med-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(75%_60%_at_50%_35%,black,transparent)]" aria-hidden />
        <div className="relative mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-7xl items-center px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pb-24">
          <div className="grid w-full items-center gap-12 lg:grid-cols-2 xl:gap-16">
            {/* Copy */}
            <div className="max-w-xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-3.5"
              >
                <span className="hex flex h-11 w-11 shrink-0 items-center justify-center bg-gold/10">
                  <LogoMark className="h-6 w-6" />
                </span>
                <p className="eyebrow">{settings.businessName} — Thane</p>
              </motion.div>

              <motion.h1
                id="hero-heading"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.08 }}
                className="display-caps mt-6 text-5xl text-ink sm:text-6xl lg:text-7xl xl:text-[5.2rem]"
              >
                {settings.heroHeadline.split(" ").slice(0, -2).join(" ")}{" "}
                <span className="text-gradient-brand">
                  {settings.heroHeadline.split(" ").slice(-2).join(" ")}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.16 }}
                className="mt-6 text-[15px] leading-relaxed text-inkmuted sm:text-base"
              >
                {settings.heroSubheadline}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.24 }}
                className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4"
              >
                <Button size="lg" onClick={go("#/book-test")}>
                  <CalendarCheck className="h-4 w-4" aria-hidden />
                  Book a Test
                </Button>
                <Button variant="outline" size="lg" onClick={go("#/services")}>
                  Explore Services
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
                <button
                  onClick={go("#/contact")}
                  className="link-underline text-[11px] font-semibold uppercase tracking-[0.2em]"
                >
                  Contact
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-8 max-w-md"
              >
                <div className="progress-line" aria-hidden />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3"
              >
                <a
                  href={BUSINESS.phoneHref}
                  className="inline-flex items-center gap-2.5 border border-white/15 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-gold/50 hover:text-gold-text"
                >
                  <Phone className="h-4 w-4 text-gold" aria-hidden />
                  {settings.phone}
                </a>
                <span className="inline-flex items-center gap-2 text-sm text-inkmuted">
                  <MapPin className="h-4 w-4 text-inkmuted" aria-hidden />
                  {BUSINESS.addressShort}
                </span>
              </motion.div>
            </div>

            {/* 3D visual — hero crystal on a cut-corner stage plate */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative mx-auto w-full max-w-[540px]"
            >
              <div className="absolute -right-6 -top-10 h-44 w-44" aria-hidden>
                <div className="hex absolute inset-0 bg-gold/20" />
                <div className="hex absolute inset-[2px] bg-black" />
              </div>
              <div className="aero-cut relative bg-white/10 p-px">
                <div className="aero-cut relative bg-iron/60 p-5 sm:p-8">
                  <Lazy3D
                    load={loadHeroCrystal}
                    fallbackSrc="/images/hero-fallback.jpg"
                    fallbackAlt="Abstract crystal with molecular structure (static preview)"
                    className="aspect-square w-full"
                    minHeight={340}
                    sceneProps={{ mobile: isMobile }}
                    hint="Interactive 3D — drag to rotate"
                  />
                </div>
              </div>
              <div className="gold-line relative mx-auto mt-6 w-2/3" aria-hidden />
            </motion.div>
          </div>
        </div>

        {/* trust strip — dark horizon line under the stage */}
        <div className="relative border-t border-white/10 bg-abyss">
          <div className="mx-auto grid max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Appointment Requests", sub: "Online & by phone" },
              { label: "Clear Preparation", sub: "Step-by-step guidance" },
              { label: "Neighbourhood Care", sub: "At Uthalsar Naka" },
              { label: "Sample Data Marked", sub: "Verified before launch" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-1 border-white/10 px-4 py-5 text-center [&:nth-child(n+2)]:border-t sm:[&:nth-child(n+2)]:border-t-0 sm:[&:nth-child(n+3)]:border-t sm:[&:nth-child(even)]:border-l lg:[&:nth-child(n+2)]:border-l lg:[&:nth-child(n+3)]:border-t-0 lg:[&:nth-child(even)]:border-l-0"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85">
                  {item.label}
                </span>
                <span className="text-[10px] text-inkmuted">{item.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== TRUST & CONVENIENCE ==================== */}
      <section className="py-16 sm:py-24" aria-labelledby="trust-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Why Patients Choose Us</p>
            <h2 id="trust-heading" className="display-caps mt-3 text-3xl text-ink sm:text-4xl lg:text-[2.75rem]">
              Care that starts before your test
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-inkmuted">
              Simple conveniences that make your diagnostic visit smooth — verified information only, no exaggerated claims.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {trustCards.map((card, i) => (
              <Reveal key={card.title} delay={i * 0.08}>
                <div className="card-lift group h-full border border-white/10 bg-card p-6">
                  <div className="hex flex h-12 w-12 items-center justify-center bg-gold/10">
                    <card.icon className="h-6 w-6 text-gold" aria-hidden />
                  </div>
                  <h3 className="mt-5 text-[13px] font-semibold uppercase tracking-[0.1em] text-ink">{card.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-inkmuted">{card.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== SERVICES PREVIEW ==================== */}
      <section className="section-divider border-t border-[#202020] bg-soft py-16 sm:py-24" aria-labelledby="services-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <Reveal className="max-w-xl">
              <p className="eyebrow">Our Services</p>
              <h2 id="services-heading" className="display-caps mt-3 text-3xl text-ink sm:text-4xl lg:text-[2.75rem]">
                Diagnostic service categories
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-inkmuted">{settings.homeServicesIntro}</p>
            </Reveal>
            <Reveal delay={0.1}>
              <Button variant="outline" onClick={go("#/services")}>
                View All Services <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </Reveal>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {catsLoading &&
              [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-44" />)}
            {!catsLoading &&
              (categories ?? []).slice(0, 5).map((cat, i) => {
                const Icon = CATEGORY_ICONS[cat.icon ?? ""] ?? FlaskConical;
                return (
                  <Reveal key={cat.id} delay={i * 0.06}>
                    <button
                      onClick={go("#/services")}
                      className="card-lift group flex h-full w-full flex-col border border-white/10 bg-card p-6 text-left"
                      aria-label={`View ${cat.name}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="hex relative flex h-11 w-11 items-center justify-center bg-white/10">
                          <div className="hex absolute inset-px bg-card" aria-hidden />
                          <Icon className="relative h-5 w-5 text-gold" aria-hidden />
                        </div>
                        <span className="metal-badge">
                          {cat.serviceCount ?? 0} {cat.serviceCount === 1 ? "test" : "tests"}
                        </span>
                      </div>
                      <h3 className="mt-5 text-[15px] font-semibold uppercase tracking-[0.06em] text-ink">{cat.name}</h3>
                      <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-inkmuted">
                        {cat.description}
                      </p>
                      <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-inkmuted opacity-0 transition-opacity group-hover:text-gold group-hover:opacity-100">
                        Learn more <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    </button>
                  </Reveal>
                );
              })}
          </div>
        </div>
      </section>

      {/* ==================== FEATURED PACKAGES ==================== */}
      <section className="py-16 sm:py-24" aria-labelledby="packages-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Health Packages</p>
            <h2 id="packages-heading" className="display-caps mt-3 text-3xl text-ink sm:text-4xl lg:text-[2.75rem]">
              Preventive check-ups, thoughtfully bundled
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-inkmuted">{settings.homePackagesIntro}</p>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pkgsLoading &&
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-72" />)}
            {!pkgsLoading &&
              (packages ?? []).slice(0, 3).map((pkg, i) => (
                <Reveal key={pkg.id} delay={i * 0.08}>
                  <div className="card-lift flex h-full flex-col border border-white/10 bg-card">
                    <div className="flex items-center justify-between border-b border-gold/30 bg-secondary p-5">
                      <div>
                        <h3 className="font-display text-lg font-medium uppercase tracking-[0.04em] text-ink">{pkg.name}</h3>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-inkmuted">
                          {pkg.tests.length} {pkg.tests.length === 1 ? "test" : "tests"} included
                        </p>
                      </div>
                      <Sparkles className="h-5 w-5 text-gold" aria-hidden />
                    </div>
                    <div className="flex-1 p-5">
                      <p className="text-[13.5px] leading-relaxed text-inkmuted">{pkg.description}</p>
                      <ul className="mt-4 space-y-2">
                        {pkg.tests.slice(0, 4).map((t) => (
                          <li key={t.id} className="flex items-center gap-2.5 text-[13px] text-ink">
                            <span className="h-1.5 w-1.5 shrink-0 bg-gold" aria-hidden />
                            {t.name}
                          </li>
                        ))}
                        {pkg.tests.length > 4 && (
                          <li className="text-[13px] font-semibold text-gold-text">
                            + {pkg.tests.length - 4} more tests
                          </li>
                        )}
                      </ul>
                    </div>
                    <div className="mt-auto flex items-center justify-between border-t border-white/10 p-5">
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.18em] text-inkmuted">Package price</span>
                        <p className="font-display text-lg font-medium text-ink">{formatPrice(pkg.price, pkg.priceVisible)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={go(`#/packages/${pkg.slug}`)}>
                          Details
                        </Button>
                        <Button size="sm" onClick={go("#/book-test")}>
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            {!pkgsLoading && (packages ?? []).length === 0 && (
              <p className="col-span-full border border-dashed border-brandborder bg-card p-8 text-center text-sm text-inkmuted">
                Health packages will appear here once published by the centre.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ==================== WHY CHOOSE US ==================== */}
      <section className="py-16 sm:py-24" aria-labelledby="why-heading">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <div className="relative">
              <div className="aero-cut bg-white/10 p-px">
                <div className="aero-cut relative bg-iron">
                  <img
                    src="/images/about-centre.jpg"
                    alt="Crystal Diagnostic Centre storefront at night with illuminated signboard, Uthalsar Naka, Thane"
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="glass-card absolute -bottom-5 left-6 right-6 flex items-center gap-3 p-4 sm:left-8 sm:right-auto">
                <LogoMark className="h-9 w-9 shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink">{settings.businessName}</p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-inkmuted">Uthalsar Naka, Thane West</p>
                </div>
              </div>
              <div className="gold-line mt-8 w-2/3" aria-hidden />
            </div>
          </Reveal>
          <div>
            <Reveal>
              <p className="eyebrow">Why Choose Us</p>
              <h2 id="why-heading" className="display-caps mt-3 text-3xl text-ink sm:text-4xl lg:text-[2.75rem]">
                A diagnostic partner your family can rely on
              </h2>
            </Reveal>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {whyItems.map((item, i) => (
                <Reveal key={item.title} delay={i * 0.07}>
                  <div className="card-lift h-full border border-white/10 bg-card p-5">
                    <span className="font-display text-lg font-medium text-gold">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="mt-2 text-[14px] font-semibold uppercase tracking-[0.06em] text-ink">{item.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-inkmuted">{item.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== INSIDE THE CENTRE (real photos) ==================== */}
      {galleryImages.length > 0 && (
        <section className="section-divider border-t border-[#202020] bg-abyss py-16 sm:py-20" aria-labelledby="inside-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">Inside The Centre</p>
                  <h2 id="inside-heading" className="display-caps mt-3 text-3xl text-ink sm:text-4xl">
                    Real photos. No staging.
                  </h2>
                </div>
                <Button variant="outline" onClick={() => navigate("#/gallery")}>
                  View Full Gallery
                </Button>
              </div>
            </Reveal>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {galleryImages.slice(0, 3).map((img, i) => (
                <Reveal key={img.id} delay={i * 0.08}>
                  <button
                    type="button"
                    onClick={() => navigate("#/gallery")}
                    aria-label={`Open photo in gallery: ${img.title}`}
                    className="group relative block w-full overflow-hidden border border-white/10 transition-colors duration-200 hover:border-gold/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  >
                    <div className="aero-cut relative">
                      <img
                        src={img.url}
                        alt={img.alt ?? img.title}
                        className="aspect-[4/3] w-full object-cover transition-opacity duration-300 group-hover:opacity-80"
                        loading="lazy"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pb-3 pt-10 text-left">
                        <p className="font-display text-[13px] uppercase tracking-[0.08em] text-ink">{img.title}</p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-gold-text">{img.category}</p>
                      </div>
                    </div>
                  </button>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== 3D SCIENCE SHOWCASE ==================== */}
      <section className="relative overflow-hidden bg-navy py-16 text-white sm:py-24" aria-labelledby="science-heading">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(45% 40% at 80% 20%, rgba(255,192,0,0.08) 0%, transparent 60%), radial-gradient(40% 45% at 10% 85%, rgba(41,171,226,0.06) 0%, transparent 60%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="order-2 lg:order-1">
            <Reveal>
              <p className="eyebrow">The Science of Diagnostics</p>
              <h2 id="science-heading" className="display-caps mt-3 text-3xl text-ink sm:text-4xl">
                {settings.homeTechHeading}
              </h2>
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/70">{settings.homeTechBody}</p>
            </Reveal>
            <div className="mt-8 space-y-4">
              {sciencePoints.map((p, i) => (
                <Reveal key={p.title} delay={i * 0.08}>
                  <div className="flex gap-4 border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-white/25">
                    <div className="hex flex h-11 w-11 shrink-0 items-center justify-center bg-cyan-pulse/10">
                      <p.icon className="h-5 w-5 text-cyan-pulse" aria-hidden />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-semibold uppercase tracking-[0.06em] text-white">{p.title}</h3>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-white/60">{p.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
          <Reveal className="order-1 lg:order-2" delay={0.1}>
            <div className="relative mx-auto w-full max-w-[520px]">
              <Lazy3D
                load={loadDnaShowcase}
                fallbackSrc="/images/og-image.jpg"
                fallbackAlt="Abstract DNA double-helix visualisation (static preview)"
                className="aspect-square w-full"
                minHeight={340}
                sceneProps={{ mobile: isMobile }}
                hint="Abstract scientific visualisation"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==================== TESTIMONIALS ==================== */}
      <TestimonialsSection />

      {/* ==================== APPOINTMENT CTA ==================== */}
      <section className="py-16 sm:py-24" aria-labelledby="cta-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="relative overflow-hidden border border-gold/25 bg-charcoal p-8 sm:p-12">
              <div className="absolute inset-y-0 left-0 w-1 bg-gold" aria-hidden />
              <div
                className="bg-med-grid pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(80%_80%_at_50%_50%,black,transparent)]"
                aria-hidden
              />
              <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
                <div className="max-w-xl">
                  <p className="eyebrow">Book With Confidence</p>
                  <h2 id="cta-heading" className="display-caps mt-3 text-2xl text-ink sm:text-3xl lg:text-4xl">
                    Take the next step towards better health.
                  </h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-inkmuted">
                    Request an appointment online and our team will call you back to confirm the slot, preparation and
                    any other details. Walk-ins are welcome during working hours.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col xl:flex-row">
                  <Button size="lg" onClick={go("#/book-test")}>
                    <CalendarCheck className="h-4 w-4" aria-hidden />
                    Request an Appointment
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <a href={BUSINESS.phoneHref}>
                      <Phone className="h-4 w-4" aria-hidden />
                      {settings.phone}
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
