"use client";

import { useEffect, useMemo } from "react";
import { ArrowRight, BookOpenText, FileText, HelpCircle, Package, Search, Stethoscope } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useFaqs, usePackages, useServices } from "@/lib/hooks";
import { useRouterStore } from "@/lib/store";

/**
 * SiteSearch — full-site quick finder (services, packages, FAQs and pages),
 * opened from the header or with ⌘K / Ctrl+K. Midnight Showroom styling:
 * abyss panel, sharp corners, gold selection state, uppercase micro headings.
 */

interface Entry {
  id: string;
  group: "pages" | "services" | "packages" | "faqs";
  label: string;
  hint?: string;
  route: string;
}

const GROUP_META: Record<Entry["group"], { heading: string; icon: React.ComponentType<{ className?: string }> }> = {
  pages: { heading: "Pages", icon: FileText },
  services: { heading: "Diagnostic Services", icon: Stethoscope },
  packages: { heading: "Health Packages", icon: Package },
  faqs: { heading: "FAQs", icon: HelpCircle },
};

const GROUP_ORDER: Entry["group"][] = ["pages", "services", "packages", "faqs"];

const PAGE_ENTRIES: Entry[] = [
  { id: "p-home", group: "pages", label: "Home", route: "#/" },
  { id: "p-about", group: "pages", label: "About the Centre", route: "#/about" },
  { id: "p-book", group: "pages", label: "Book a Test", hint: "Appointment request", route: "#/book-test" },
  { id: "p-track", group: "pages", label: "Track a Request", hint: "Reference + mobile", route: "#/track" },
  { id: "p-services", group: "pages", label: "All Services", route: "#/services" },
  { id: "p-packages", group: "pages", label: "All Health Packages", hint: "Includes Package Finder quiz", route: "#/packages" },
  { id: "p-gallery", group: "pages", label: "Gallery — Real Photos", route: "#/gallery" },
  { id: "p-reports", group: "pages", label: "Report Access", route: "#/reports" },
  { id: "p-faq", group: "pages", label: "Frequently Asked Questions", route: "#/faq" },
  { id: "p-contact", group: "pages", label: "Contact & Location", hint: "Uthalsar Naka, Thane West", route: "#/contact" },
];

export function SiteSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useRouterStore((s) => s.navigate);
  const { data: services = [] } = useServices();
  const { data: packages = [] } = usePackages();
  const { data: faqs = [] } = useFaqs();

  // ⌘K / Ctrl+K toggles the palette from anywhere on the public site
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  // Close on navigation (hash change covers in-palette jumps + browser back)
  useEffect(() => {
    const close = () => onOpenChange(false);
    window.addEventListener("hashchange", close);
    return () => window.removeEventListener("hashchange", close);
  }, [onOpenChange]);

  const entries = useMemo<Entry[]>(() => {
    const dynamic: Entry[] = [
      ...services.map((s) => ({
        id: `s-${s.slug}`,
        group: "services" as const,
        label: s.name,
        hint: s.shortDescription ?? undefined,
        route: `#/services/${s.slug}`,
      })),
      ...packages.map((p) => ({
        id: `k-${p.slug}`,
        group: "packages" as const,
        label: p.name,
        hint: p.description ?? undefined,
        route: `#/packages/${p.slug}`,
      })),
      ...faqs.map((f) => ({
        id: `f-${f.id}`,
        group: "faqs" as const,
        label: f.question,
        route: `#/faq?q=${f.id}`,
      })),
    ];
    return [...dynamic, ...PAGE_ENTRIES];
  }, [services, packages, faqs]);

  const go = (route: string) => {
    onOpenChange(false);
    navigate(route);
  };

  // cmdk filters on the item's value/keywords; encode hint text as keywords
  const groups = GROUP_ORDER.map((g) => ({
    group: g,
    items: entries.filter((e) => e.group === g),
  })).filter((g) => g.items.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[12%] max-w-xl translate-y-0 gap-0 overflow-hidden border-white/10 bg-abyss p-0 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95)] rounded-none"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Search the site</DialogTitle>
          <DialogDescription>Find services, health packages, answers and pages.</DialogDescription>
        </DialogHeader>
        <span aria-hidden className="absolute left-0 top-0 z-10 h-2.5 w-2.5 border-l-2 border-t-2 border-gold" />
        <span aria-hidden className="absolute right-0 top-0 z-10 h-2.5 w-2.5 border-r-2 border-t-2 border-gold" />
        <Command className="bg-transparent text-ink" loop>
          <div className="flex items-center gap-3 border-b border-white/10 px-4">
            <Search className="h-4 w-4 shrink-0 text-gold" aria-hidden />
            <CommandInput
              placeholder="Search tests, packages, answers…"
              className="h-14 border-0 text-[15px] tracking-wide caret-gold placeholder:text-steel focus:ring-0"
            />
            <kbd className="hidden shrink-0 border border-white/15 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-ash sm:inline-block">
              Esc
            </kbd>
          </div>

          <CommandList className="max-h-[380px] py-2">
            <CommandEmpty className="py-10 text-center">
              <p className="font-display text-sm uppercase tracking-[0.18em] text-ink">No matches</p>
              <p className="mt-1.5 text-xs text-inkmuted">
                Try a shorter word — or call{" "}
                <a href="tel:+918828393955" className="font-semibold text-gold">
                  +91 88283 93955
                </a>{" "}
                and we will help.
              </p>
            </CommandEmpty>

            {groups.map(({ group, items }, gi) => {
              const { heading, icon: Icon } = GROUP_META[group];
              return (
                <div key={group}>
                  {gi > 0 && <CommandSeparator className="bg-white/5" />}
                  <CommandGroup
                    heading={heading.toUpperCase()}
                    className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[9px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:tracking-[0.28em] [&_[cmdk-group-heading]]:text-gold"
                  >
                    {items.map((e) => (
                      <CommandItem
                        key={e.id}
                        value={`${e.label} ${e.hint ?? ""}`}
                        keywords={[e.label, e.hint ?? ""]}
                        onSelect={() => go(e.route)}
                        className="border-l-2 border-transparent px-4 py-3 data-[selected=true]:border-l-gold data-[selected=true]:bg-gold/10 [&[data-selected=true]_.item-label]:text-gold [&[data-selected=true]_.item-go]:opacity-100 [&[data-selected=true]_.item-go]:text-gold"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-steel" aria-hidden />
                        <span className="item-label min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold text-ink">
                            {e.label}
                          </span>
                          {e.hint && (
                            <span className="mt-0.5 block truncate text-[11px] leading-snug text-inkmuted">{e.hint}</span>
                          )}
                        </span>
                        <ArrowRight className="item-go h-3.5 w-3.5 shrink-0 text-steel opacity-0 transition-opacity" aria-hidden />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </div>
              );
            })}
          </CommandList>

          <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-4 py-2.5">
            <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-steel">
              <BookOpenText className="h-3 w-3 text-gold" aria-hidden />
              {services.length} services · {packages.length} packages · {faqs.length} answers
            </p>
            <p className="hidden text-[9px] font-semibold uppercase tracking-[0.2em] text-steel sm:block">
              ↑↓ Navigate · ↵ Open
            </p>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
