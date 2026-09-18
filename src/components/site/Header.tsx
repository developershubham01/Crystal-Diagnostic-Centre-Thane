"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Phone, CalendarCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LogoHorizontal } from "@/components/brand/Logo";
import { useRoute, useRouterStore } from "@/lib/store";
import { useSettings } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Home", route: "#/" },
  { label: "About", route: "#/about" },
  { label: "Services", route: "#/services" },
  { label: "Packages", route: "#/packages" },
  { label: "Gallery", route: "#/gallery" },
  { label: "Track", route: "#/track" },
  { label: "FAQ", route: "#/faq" },
  { label: "Contact", route: "#/contact" },
];

export function Header() {
  const route = useRoute();
  const navigate = useRouterStore((s) => s.navigate);
  const { data: settings } = useSettings();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll, { passive: true } as never);
  }, []);

  useEffect(() => {
    // Close the drawer whenever navigation happens (incl. browser back/forward)
    const close = () => setOpen(false);
    window.addEventListener("hashchange", close);
    return () => window.removeEventListener("hashchange", close);
  }, []);

  const isActive = (hash: string) => {
    const target = hash.replace("#/", "").replace("#", "");
    if (target === "") return route.name === "home";
    if (target === "services") return route.name === "services" || route.name === "service-detail";
    if (target === "packages") return route.name === "packages" || route.name === "package-detail";
    return route.name === target;
  };

  const go = (hash: string) => {
    setOpen(false);
    navigate(hash);
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-[70] focus:bg-card focus:px-3 focus:py-2 focus:text-xs focus:text-gold"
      >
        Skip to content
      </a>
      <div
        className={cn(
          "w-full border-b transition-all duration-300",
          scrolled
            ? "border-white/10 bg-black/85 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            : "border-transparent bg-black/55 backdrop-blur-md"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 md:h-20 lg:px-8">
          {/* Logo — white/gold mark floating in darkness */}
          <Link
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              go("#/");
            }}
            aria-label="Crystal Diagnostic Centre — Home"
            className="shrink-0 outline-offset-4"
          >
            <LogoHorizontal showTagline={false} />
          </Link>

          {/* Desktop nav — uppercase micro labels, gold active state */}
          <nav aria-label="Primary" className="hidden items-center gap-6 lg:flex">
            {NAV.map((item) => {
              const active = isActive(item.route);
              return (
                <Link
                  key={item.route}
                  href={item.route}
                  onClick={(e) => {
                    e.preventDefault();
                    go(item.route);
                  }}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors",
                    active ? "text-gold" : "text-white/60 hover:text-white"
                  )}
                >
                  {item.label}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -bottom-0.5 left-0 h-px w-full origin-left bg-gold transition-transform duration-300",
                      active ? "scale-x-100" : "scale-x-0"
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <a
              href="tel:+918828393955"
              className="hidden items-center gap-2 border border-white/25 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85 transition-colors hover:border-gold hover:text-gold md:inline-flex"
            >
              <Phone className="h-3.5 w-3.5 text-gold" aria-hidden />
              {settings.phone || "+91 88283 93955"}
            </a>
            <Button
              onClick={() => go("#/book-test")}
              className="hidden sm:inline-flex"
            >
              <CalendarCheck className="mr-0.5 h-4 w-4" aria-hidden />
              Book a Test
            </Button>

            {/* Mobile drawer — MENU wordmark + hamburger, like the brand's own nav */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  className="inline-flex items-center gap-2 px-1 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white lg:hidden"
                  aria-label="Open menu"
                >
                  Menu
                  <Menu className="h-5 w-5" aria-hidden />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] border-white/10 bg-abyss p-0">
                <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                <div className="flex items-center justify-between border-b border-white/10 p-4">
                  <LogoHorizontal showTagline={false} />
                  <button
                    onClick={() => setOpen(false)}
                    className="p-2 text-white/60 transition-colors hover:text-gold"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <nav aria-label="Mobile" className="flex flex-col p-4">
                  {NAV.map((item, i) => (
                    <button
                      key={item.route}
                      onClick={() => go(item.route)}
                      className={cn(
                        "flex items-baseline gap-3 border-b border-white/5 px-2 py-3.5 text-left transition-colors",
                        isActive(item.route) ? "text-gold" : "text-white/80 hover:text-white"
                      )}
                    >
                      <span className="text-[10px] font-medium tracking-[0.2em] text-white/35">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm font-semibold uppercase tracking-[0.18em]">{item.label}</span>
                    </button>
                  ))}
                  <div className="mt-5 space-y-2.5">
                    <Button onClick={() => go("#/book-test")} className="w-full">
                      <CalendarCheck className="mr-1 h-4 w-4" aria-hidden />
                      Book a Test
                    </Button>
                    <Button onClick={() => go("#/reports")} variant="outline" className="w-full">
                      Report Access
                    </Button>
                    <a
                      href="tel:+918828393955"
                      className="flex items-center justify-center gap-2 border border-white/15 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85"
                    >
                      <Phone className="h-4 w-4 text-gold" aria-hidden /> {settings.phone || "+91 88283 93955"}
                    </a>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
