"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouterStore } from "@/lib/store";
import { usePageMeta } from "@/lib/seo";

export function NotFoundPage() {
  const navigate = useRouterStore((s) => s.navigate);
  usePageMeta("Page Not Found", "The page you are looking for could not be found.");

  return (
    <section className="bg-radial-soft">
      <div className="container flex min-h-[70vh] flex-col items-center justify-center gap-6 py-20 text-center">
        {/* Oversized display numeral — the Lamborghini statement mark */}
        <p
          className="font-display select-none text-[7rem] uppercase leading-[0.85] text-gold/20 sm:text-[10rem]"
          aria-hidden
        >
          404
        </p>
        <div>
          <p className="eyebrow">Error 404</p>
          <h1 className="font-display mt-2 text-3xl uppercase tracking-tight text-ink sm:text-4xl">
            This page seems to have wandered off
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-inkmuted">
            The page you are looking for doesn&apos;t exist or may have moved. Let&apos;s get you back on track.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => navigate("#/")} className="px-6">
            Go to Homepage
          </Button>
          <Button variant="outline" onClick={() => navigate("#/services")}>
            Browse Services
          </Button>
          <a
            href="tel:+918828393955"
            className="inline-flex items-center gap-2 border border-white/30 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:border-gold/60 hover:text-gold"
          >
            <Phone className="h-4 w-4 text-teal" aria-hidden />
            Call the Centre
          </a>
        </div>
        <p className="text-xs text-inkmuted">
          Looking for something specific?{" "}
          <Link href="#/contact" onClick={(e) => { e.preventDefault(); navigate("#/contact"); }} className="font-semibold text-gold underline-offset-2 hover:text-gold-text hover:underline">
            Contact us
          </Link>{" "}
          and we&apos;ll help you out.
        </p>
      </div>
    </section>
  );
}
