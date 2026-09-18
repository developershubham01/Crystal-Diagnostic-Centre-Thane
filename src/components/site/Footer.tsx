"use client";

import Link from "next/link";
import { MapPin, Phone, Mail, Clock, ShieldCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { LogoHorizontal } from "@/components/brand/Logo";
import { useRoute, useRouterStore } from "@/lib/store";
import { useSettings } from "@/lib/hooks";

const QUICK_LINKS = [
  { label: "Home", route: "#/" },
  { label: "About Us", route: "#/about" },
  { label: "Services", route: "#/services" },
  { label: "Health Packages", route: "#/packages" },
  { label: "Book a Test", route: "#/book-test" },
  { label: "Gallery", route: "#/gallery" },
  { label: "FAQ", route: "#/faq" },
  { label: "Contact", route: "#/contact" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", route: "#/privacy" },
  { label: "Terms of Use", route: "#/terms" },
  { label: "Medical Disclaimer", route: "#/disclaimer" },
];

export function Footer() {
  const navigate = useRouterStore((s) => s.navigate);
  const { data: settings } = useSettings();

  const link = (route: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(route);
  };

  const socials = [
    settings.socialFacebook && { label: "Facebook", url: settings.socialFacebook },
    settings.socialInstagram && { label: "Instagram", url: settings.socialInstagram },
    settings.socialTwitter && { label: "Twitter / X", url: settings.socialTwitter },
    settings.socialLinkedin && { label: "LinkedIn", url: settings.socialLinkedin },
  ].filter(Boolean) as { label: string; url: string }[];

  return (
    <footer className="mt-auto bg-navy text-white" role="contentinfo">
      {/* gold horizon line */}
      <div className="gold-line w-full" aria-hidden />
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <LogoHorizontal showTagline={false} theme="color" />
            <p className="mt-4 text-sm leading-relaxed text-white/70">{settings.footerAbout}</p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-text">
              “{settings.tagline}”
            </p>
            {socials.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="border border-white/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/85 transition-colors hover:border-gold hover:text-gold"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <nav aria-label="Footer">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Quick Links</h3>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 md:grid-cols-1">
              {QUICK_LINKS.map((l) => (
                <li key={l.route}>
                  <Link
                    href={l.route}
                    onClick={link(l.route)}
                    className="text-sm text-white/70 transition-colors hover:text-gold"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Contact</h3>
            <ul className="mt-4 space-y-3.5 text-sm text-white/70">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-pulse" aria-hidden />
                <span>
                  {settings.address.split("\n").map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </li>
              <li>
                <a href="tel:+918828393955" className="flex gap-2.5 transition-colors hover:text-gold">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-cyan-pulse" aria-hidden />
                  {settings.phone}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-cyan-pulse" aria-hidden />
                <span>
                  {settings.email}
                  <span className="block text-xs text-white/45">({settings.emailNote})</span>
                </span>
              </li>
              <li className="flex gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-cyan-pulse" aria-hidden />
                <span>
                  {settings.workingHours.split("\n").map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
                  <span className="block text-xs text-white/45">({settings.workingHoursNote})</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Patient resources */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Patient Resources</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="#/book-test" onClick={link("#/book-test")} className="text-white/70 hover:text-gold">
                  Request an Appointment
                </Link>
              </li>
              <li>
                <Link href="#/track" onClick={link("#/track")} className="text-white/70 hover:text-gold">
                  Track Your Request
                </Link>
              </li>
              <li>
                <Link href="#/reports" onClick={link("#/reports")} className="text-white/70 hover:text-gold">
                  Online Report Access
                </Link>
              </li>
              <li>
                <Link href="#/faq" onClick={link("#/faq")} className="text-white/70 hover:text-gold">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="#/packages" onClick={link("#/packages")} className="text-white/70 hover:text-gold">
                  Preventive Health Packages
                </Link>
              </li>
            </ul>
            <div className="mt-6 border border-white/10 bg-white/[0.04] p-3.5">
              <p className="flex items-start gap-2 text-xs leading-relaxed text-white/60">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-pulse" aria-hidden />
                Your enquiry details are used only to contact you about your request. We never sell or share patient
                information.
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-7 bg-white/10" />

        {/* Legal row */}
        <div className="flex flex-col items-center justify-between gap-3 text-[11px] uppercase tracking-[0.12em] text-white/50 md:flex-row">
          <p>
            © {new Date().getFullYear()} {settings.businessName}, Thane. All rights reserved.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.route} href={l.route} onClick={link(l.route)} className="hover:text-gold">
                {l.label}
              </Link>
            ))}
            <Link href="#/admin" onClick={link("#/admin")} className="text-white/30 hover:text-gold">
              Staff Login
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
