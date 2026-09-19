"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Phone, CalendarCheck, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LogoHorizontal } from "@/components/brand/Logo";
import { SiteSearch } from "@/components/site/SearchDialog";
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
  const [progress, setProgress] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll, { passive: true } as never);
  }, []);

  // Gold reading-progress hairline (rAF-throttled; colour-only decoration)
  useEffect(() => {
    let raf = 0;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("popstate", close);
    window.addEventListener("hashchange", close);
    return () => {
      window.removeEventListener("popstate", close);
      window.removeEventListener("hashchange", close);
    };
  }, []);

  const isActive = (path: string) => {
    const target = path.replace(/^\//, "");
    if (target === "") return route.name === "home";
    if (target === "services") return route.name === "services" || route.name === "service-detail";
    if (target === "packages") return route.name === "packages" || route.name === "package-detail";
    return route.name === target;
  };

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
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
          "relative w-full border-b transition-all duration-300",
          scrolled
            ? "border-white/10 bg-black/85 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            : "border-transparent bg-black/55 backdrop-blur-md"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 md:h-20 lg:px-8">
          {/* Logo — white/gold mark floating in darkness */}
          <Link
            href="/"
            onClick={(e) => {
              e.preventDefault();
              go("/");
            }}
            aria-label="Crystal Diagnostic Centre — Home"
            className="shrink-0 outline-offset-4"
          >
            <LogoHorizontal showTagline={false} />
          </Link>

          {/* Desktop Nav */}
          <nav aria-label="Primary" className="hidden lg:flex lg:items-center lg:gap-7">
            {NAV.map((item) => (
              <button
                key={item.route}
                onClick={() => go(item.route)}
                className={cn(
                  "relative py-2 text-[11.5px] font-semibold uppercase tracking-[0.2em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold",
                  isActive(item.route) ? "text-gold font-bold" : "text-white/80 hover:text-white"
                )}
              >
                {item.label}
                {isActive(item.route) && (
                  <span className="absolute bottom-0 left-0 h-[2px] w-full bg-gold shadow-[0_0_8px_rgba(255,192,0,0.8)]" />
                )}
              </button>
            ))}
          </nav>

          {/* Search + Primary CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search the site"
              className="inline-flex items-center gap-2 border border-white/25 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85 transition-colors hover:border-gold hover:text-gold"
            >
              <Search className="h-3.5 w-3.5 text-gold" aria-hidden />
              <span className="hidden xl:inline">Search</span>
            </button>
            <SiteSearch open={searchOpen} onOpenChange={setSearchOpen} />
            <a
              href="tel:+918828393955"
              className="hidden items-center gap-2 border border-white/25 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85 transition-colors hover:border-gold hover:text-gold md:inline-flex"
            >
              <Phone className="h-3.5 w-3.5 text-gold" aria-hidden />
              {settings.phone || "+91 88283 93955"}
            </a>
            <Button
              onClick={() => go("/book-test")}
              className="hidden sm:inline-flex"
            >
              <CalendarCheck className="mr-0.5 h-4 w-4" aria-hidden />
              Book a Test
            </Button>

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
                    <Button onClick={() => go("/book-test")} className="w-full">
                      <CalendarCheck className="mr-1 h-4 w-4" aria-hidden />
                      Book a Test
                    </Button>
                    <Button onClick={() => go("/reports")} variant="outline" className="w-full">
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

        <SiteSearch open={searchOpen} onOpenChange={setSearchOpen} />

        {/* Reading-progress hairline — gold fill, 2px, above the border */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden bg-white/[0.06]"
        >
          <div
            className="h-full w-full origin-left bg-gold will-change-transform"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      </div>
    </header>
  );
}
