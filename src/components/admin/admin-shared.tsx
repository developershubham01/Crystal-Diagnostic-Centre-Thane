"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { api, ApiError, type CategoryDTO } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Session-expiry event bus (tabs → AdminPage)                         */
/* ------------------------------------------------------------------ */

type Listener = () => void;
const sessionListeners = new Set<Listener>();

export function onSessionExpired(fn: Listener): () => void {
  sessionListeners.add(fn);
  return () => {
    sessionListeners.delete(fn);
  };
}

export function notifySessionExpired(): void {
  sessionListeners.forEach((fn) => fn());
}

/* ------------------------------------------------------------------ */
/* Error helpers                                                       */
/* ------------------------------------------------------------------ */

export function mutationError(
  err: unknown,
  toast: (t: { title?: string; description?: string; variant?: "default" | "destructive" }) => void,
  label: string
): void {
  if (err instanceof ApiError && err.status === 401) {
    notifySessionExpired();
    toast({ title: "Session expired", description: "Please sign in again.", variant: "destructive" });
    return;
  }
  const message = err instanceof ApiError ? err.message : "Unexpected error. Please try again.";
  toast({ title: label, description: message, variant: "destructive" });
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const DATE_FMT = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const TIME_FMT = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : DATE_FMT.format(d);
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : `${DATE_FMT.format(d)}, ${TIME_FMT.format(d)}`;
}

/* ------------------------------------------------------------------ */
/* Status badges (NEW=teal, CONTACTED=medblue, SCHEDULED=navy,         */
/* COMPLETED=green, CANCELLED=red)                                     */
/* ------------------------------------------------------------------ */

const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  NEW: { badge: "border-teal-soft bg-teal-soft/50 text-teal-800", dot: "bg-teal" },
  CONTACTED: { badge: "border-cyan-200 bg-cyan-50 text-cyan-800", dot: "bg-cyan-600" },
  SCHEDULED: { badge: "border-[#0b3b66]/25 bg-[#0b3b66]/[0.07] text-[#0b3b66]", dot: "bg-navy" },
  COMPLETED: { badge: "border-emerald-200 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  CANCELLED: { badge: "border-red-200 bg-red-50 text-red-700", dot: "bg-red-500" },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { badge: "border-brandborder bg-soft text-inkmuted", dot: "bg-inkmuted" };
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-bold", style.badge)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} aria-hidden />
      {status}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/* Layout primitives                                                   */
/* ------------------------------------------------------------------ */

export function TabHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-ink">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm text-inkmuted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, hint }: { icon: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-brandborder bg-card/60 px-6 py-12 text-center">
      <span className="text-inkmuted">{icon}</span>
      <p className="text-sm font-bold text-ink">{title}</p>
      {hint && <p className="max-w-sm text-xs leading-relaxed text-inkmuted">{hint}</p>}
    </div>
  );
}

/** Wraps a shadcn table for safe horizontal scrolling on small screens. */
export function ResponsiveTableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-brandborder bg-card">
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form primitives                                                     */
/* ------------------------------------------------------------------ */

export function AdminField({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id}>
        {label} {required && <span aria-hidden>*</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <p className="mt-1 text-xs text-inkmuted">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function SwitchRow({
  id,
  label,
  checked,
  onCheckedChange,
  disabled,
  note,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  note?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-brandborder bg-soft/50 px-4 py-3">
      <div>
        <Label htmlFor={id} className="cursor-pointer">
          {label}
        </Label>
        {note && <p className="mt-0.5 text-xs text-inkmuted">{note}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Confirm-delete dialog                                               */
/* ------------------------------------------------------------------ */

export function DeleteConfirmDialog({
  title,
  description,
  onConfirm,
  disabled,
  children,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  disabled?: boolean;
  children: ReactNode; // trigger
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={disabled}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ------------------------------------------------------------------ */
/* Admin category list (tries ?all=1 for drafts, falls back gracefully) */
/* ------------------------------------------------------------------ */

async function fetchAdminCategories(): Promise<CategoryDTO[]> {
  try {
    return await api.get<CategoryDTO[]>("/api/categories?all=1");
  } catch {
    return api.get<CategoryDTO[]>("/api/categories");
  }
}

export function useAdminCategories() {
  return useQuery<CategoryDTO[]>({
    queryKey: ["admin-categories"],
    queryFn: fetchAdminCategories,
    staleTime: 30_000,
  });
}

/* ------------------------------------------------------------------ */
/* Debounced value (search inputs)                                     */
/* ------------------------------------------------------------------ */

export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
