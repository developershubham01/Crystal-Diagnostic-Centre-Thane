"use client";

import { useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { GalleryImageDTO } from "@/lib/api-client";

/**
 * Accessible fullscreen-ish image lightbox for the gallery.
 * Keyboard: ← / → navigate, Escape closes (Radix built-in).
 */
export function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: GalleryImageDTO[];
  index: number | null;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
}) {
  const open = index !== null && index >= 0 && index < items.length;
  const item = open ? items[index] : null;

  const goPrev = useCallback(() => {
    if (index === null || items.length === 0) return;
    onNavigate((index - 1 + items.length) % items.length);
  }, [index, items.length, onNavigate]);

  const goNext = useCallback(() => {
    if (index === null || items.length === 0) return;
    onNavigate((index + 1) % items.length);
  }, [index, items.length, onNavigate]);

  // Arrow-key navigation while the lightbox is open
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, goPrev, goNext]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-[calc(100%-1rem)] gap-0 overflow-hidden border-white/10 bg-black/95 p-3 sm:max-w-4xl sm:p-4"
        aria-describedby={undefined}
      >
        {item && (
          <div className="flex flex-col">
            <div className="relative flex items-center justify-center">
              {items.length > 1 && (
                <>
                  <button
                    onClick={goPrev}
                    aria-label="Previous image"
                    className="hex absolute left-1.5 z-10 flex h-11 w-11 items-center justify-center bg-white/10 text-white transition-colors hover:bg-gold hover:text-black sm:-left-2"
                  >
                    <ChevronLeft className="h-6 w-6" aria-hidden />
                  </button>
                  <button
                    onClick={goNext}
                    aria-label="Next image"
                    className="hex absolute right-1.5 z-10 flex h-11 w-11 items-center justify-center bg-white/10 text-white transition-colors hover:bg-gold hover:text-black sm:-right-2"
                  >
                    <ChevronRight className="h-6 w-6" aria-hidden />
                  </button>
                </>
              )}
              <img
                src={item.url}
                alt={item.alt || item.title}
                className="max-h-[62vh] w-auto max-w-full bg-iron object-contain"
                draggable={false}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 pb-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <DialogTitle className="font-display truncate text-[14px] uppercase tracking-wide text-white">
                  {item.title}
                </DialogTitle>
                <span className="metal-badge">{item.category}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="metal-badge">
                  {index !== null ? index + 1 : 0} / {items.length}
                </span>
                <button
                  onClick={onClose}
                  aria-label="Close gallery viewer"
                  className="flex h-11 w-11 items-center justify-center text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Filter chip used by Services / Gallery pages. */
export function FilterChip({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-[40px] shrink-0 items-center gap-1.5 whitespace-nowrap border px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors sm:min-h-[44px]",
        active
          ? "border-gold bg-gold/10 text-gold"
          : "border-white/15 bg-transparent text-white/70 hover:border-gold/50 hover:text-ink"
      )}
    >
      {children}
      {typeof count === "number" && (
        <span
          className={cn(
            "px-1.5 py-0.5 text-[10px] font-semibold",
            active ? "bg-gold/20 text-gold" : "bg-white/5 text-steel"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
