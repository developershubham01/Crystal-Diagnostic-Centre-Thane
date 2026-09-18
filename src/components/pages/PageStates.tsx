"use client";

import { useMemo } from "react";
import { AlertCircle, Check, RotateCw, SearchX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shared loading / empty / error states for public pages.
 * Kept in one place so every inner page looks and behaves consistently.
 */

export function ErrorState({
  title = "Something went wrong",
  message = "We could not load this content. Please check your connection and try again.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Alert className="border-white/10 bg-white/[0.03]">
      <AlertCircle className="h-4 w-4 text-destructive" aria-hidden />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="text-inkmuted">
        <p>{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
            <RotateCw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  message,
  action,
}: {
  title?: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-white/15 bg-card p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center bg-white/5 ring-1 ring-white/10">
        <SearchX className="h-6 w-6 text-teal" aria-hidden />
      </div>
      <p className="font-display text-[16px] uppercase tracking-wide text-ink">{title}</p>
      <p className="max-w-md text-sm leading-relaxed text-inkmuted">{message}</p>
      {action}
    </div>
  );
}

/** Grid of card-shaped skeletons for list pages. */
export function CardsGridSkeleton({ count = 6, className = "h-64" }: { count?: number; className?: string }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`border border-white/10 bg-card p-5 ${className}`}>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-4 h-6 w-3/4" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-1.5 h-4 w-2/3" />
          <div className="mt-5 flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      ))}
    </>
  );
}

/** Two-column detail page skeleton (content + sticky sidebar). */
export function DetailSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
      <div className="lg:col-span-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-4 h-10 w-3/4" />
        <Skeleton className="mt-3 h-5 w-full" />
        <Skeleton className="mt-2 h-5 w-5/6" />
        <div className="mt-8 space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className={`h-4 ${i % 2 === 0 ? "w-full" : "w-11/12"}`} />
          ))}
        </div>
        <Skeleton className="mt-10 h-36 w-full" />
      </div>
      <div>
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}

/** Checklist rendering for newline-separated settings values. */
export function CheckList({ text, columns = 1 }: { text: string; columns?: 1 | 2 }) {
  const items = useMemo(
    () =>
      text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    [text]
  );
  if (items.length === 0) return null;
  return (
    <ul className={`grid gap-2.5 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-ink">
          <span
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center bg-gold/10 ring-1 ring-gold/30"
            aria-hidden
          >
            <Check className="h-3 w-3 text-gold" />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Price display — DTO price is null unless priceVisible (medical-compliance safe). */
export function formatPrice(price: number | null, visible: boolean): string {
  if (!visible || price === null) return "Price on request";
  return `₹${price.toLocaleString("en-IN")}`;
}

/** Split a long text blob into sentences for readable list formatting. */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Split text into paragraphs on blank lines (fallback: single paragraph). */
export function splitParagraphs(text: string): string[] {
  const parts = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : text.trim() ? [text.trim()] : [];
}
