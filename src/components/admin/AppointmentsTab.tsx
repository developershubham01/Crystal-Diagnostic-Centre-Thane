"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  ClipboardList,
  Clock,
  Download,
  FilterX,
  Home,
  Mail,
  Phone,
  Printer,
  Search,
  StickyNote,
} from "lucide-react";
import {
  api,
  type AppointmentDTO,
} from "@/lib/api-client";
import { APPOINTMENT_STATUSES } from "@/lib/constants";
import { LOGO_MARK_SVG } from "@/components/brand/Logo";
import { downloadAppointmentIcs } from "@/lib/calendar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  DeleteConfirmDialog,
  EmptyState,
  ListSkeleton,
  ResponsiveTableWrap,
  StatusBadge,
  TabHeader,
  fmtDate,
  fmtDateTime,
  mutationError,
  useDebouncedValue,
} from "@/components/admin/admin-shared";

const QUERY_KEY = "admin-appointments";

interface Filters {
  status: string;
  from: string;
  to: string;
  q: string;
}

const EMPTY_FILTERS: Filters = { status: "ALL", from: "", to: "", q: "" };

function DetailRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      {icon && <span className="mt-0.5 text-medblue">{icon}</span>}
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-inkmuted">{label}</p>
        <div className="text-sm font-medium text-ink">{value}</div>
      </div>
    </div>
  );
}

/**
 * Opens a print popup with the given HTML; falls back to a hidden iframe
 * when popups are blocked (the embedded onload script still triggers
 * window.print() inside the frame). Returns true when a route succeeded.
 */
function openPrintWindow(html: string): boolean {
  const w = window.open("", "_blank", "width=800,height=900");
  if (w) {
    w.document.open();
    w.document.write(html);
    w.document.close();
    return true;
  }
  try {
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;visibility:hidden;";
    frame.srcdoc = html;
    frame.onload = () => {
      try {
        frame.contentWindow?.focus();
      } catch {
        /* cross-origin guard — srcdoc is same-origin, never expected */
      }
      setTimeout(() => frame.remove(), 60_000);
    };
    document.body.appendChild(frame);
    return true;
  } catch {
    return false;
  }
}

/** Shared print CSS for front-desk printouts (black on white). */
const PRINT_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; padding: 32px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #111; padding-bottom: 12px; }
  .brand { display: flex; gap: 12px; align-items: center; }
  .brand .bname { font-size: 20px; font-weight: 800; letter-spacing: 0.06em; }
  .brand .bname small { display: block; font-size: 11px; font-weight: 400; letter-spacing: 0.14em; color: #444; margin-top: 4px; }
  .brand svg { width: 46px; height: 46px; flex: 0 0 auto; }
  .ref { text-align: right; }
  .ref .code { font-family: Consolas, monospace; font-size: 18px; font-weight: 700; letter-spacing: 0.12em; }
  .ref .label { font-size: 9px; letter-spacing: 0.2em; color: #555; }
  h1 { font-size: 13px; letter-spacing: 0.18em; margin: 22px 0 12px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 7px 0; border-bottom: 1px solid #ddd; font-size: 13px; vertical-align: top; }
  td.k { width: 180px; font-size: 10px; letter-spacing: 0.14em; color: #555; text-transform: uppercase; padding-right: 12px; }
  .foot { margin-top: 26px; font-size: 11px; color: #555; border-top: 1px solid #ddd; padding-top: 10px; }
  .sign { margin-top: 48px; display: flex; justify-content: space-between; font-size: 11px; color: #333; }
  .sign span { border-top: 1px solid #333; padding-top: 4px; width: 220px; text-align: center; }
  @media print { body { padding: 12mm; } }
`;

/**
 * Opens a print-friendly front-desk slip for an appointment request in a
 * dedicated popup window (black on white for paper) and invokes printing.
 * Internal notes are deliberately excluded from the printout.
 */
function printAppointmentSlip(a: AppointmentDTO): void {
  const esc = (s: unknown) =>
    String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
  const received = new Date(a.createdAt).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
  });
  const html = `<!doctype html><html><head><meta charset="utf-8" /><title>Appointment ${esc(a.reference)}</title>
<style>${PRINT_STYLES}</style></head><body>
  <div class="head">
    <div class="brand">${LOGO_MARK_SVG}<div class="bname">CRYSTAL DIAGNOSTIC CENTRE<small>UTHALSAR NAKA · THANE WEST · +91 88283 93955</small></div></div>
    <div class="ref"><div class="label">APPOINTMENT REFERENCE</div><div class="code">${esc(a.reference)}</div></div>
  </div>
  <h1>APPOINTMENT REQUEST SUMMARY</h1>
  <table>
    <tr><td class="k">Patient</td><td><strong>${esc(a.name)}</strong></td></tr>
    <tr><td class="k">Mobile</td><td>+91 ${esc(a.mobile)}</td></tr>
    ${a.email ? `<tr><td class="k">Email</td><td>${esc(a.email)}</td></tr>` : ""}
    <tr><td class="k">Test / Package</td><td>${esc(a.testOrPackage)}</td></tr>
    <tr><td class="k">Preferred date</td><td>${a.preferredDate ? esc(a.preferredDate) : "Any"}</td></tr>
    <tr><td class="k">Preferred time</td><td>${a.preferredTime ? esc(a.preferredTime) : "Any (we will confirm)"}</td></tr>
    <tr><td class="k">Home collection</td><td>${a.homeCollection ? "Requested" : "Not requested"}</td></tr>
    <tr><td class="k">Status</td><td>${esc(a.status)}</td></tr>
    <tr><td class="k">Received</td><td>${esc(received)}</td></tr>
  </table>
  <div class="sign"><span>Patient signature</span><span>Front desk</span></div>
  <div class="foot">Track this request any time at ${esc(`${location.origin}/#/track?reference=${a.reference}`)} with the reference code and the booked mobile number. This is an appointment request summary, not a medical report or bill.</div>
  <script>window.onload = function () { window.focus(); window.print(); };</script>
</body></html>`;
  openPrintWindow(html);
}

/**
 * Printable front-desk DAY SHEET — every SCHEDULED visit for one date,
 * used at the reception counter to walk through the day's appointments.
 */
function printDaySheet(appointments: AppointmentDTO[], dateISO: string): void {
  const esc = (s: unknown) =>
    String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
  const scheduled = appointments
    .filter((a) => a.status === "SCHEDULED" && a.preferredDate === dateISO)
    .sort((a, b) => (a.preferredTime ?? "").localeCompare(b.preferredTime ?? ""));
  const pretty = new Date(`${dateISO}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });

  const rows = scheduled.length
    ? scheduled
        .map(
          (a, i) => `<tr>
            <td style="width:34px;color:#555;">${i + 1}</td>
            <td style="width:150px;">${esc(a.preferredTime || "Any — confirm on call")}</td>
            <td style="width:110px;font-family:Consolas,monospace;font-weight:700;">${esc(a.reference)}</td>
            <td><strong>${esc(a.name)}</strong></td>
            <td style="width:110px;">+91 ${esc(a.mobile)}</td>
            <td>${esc(a.testOrPackage)}${a.homeCollection ? ' <span style="color:#777;">· home visit</span>' : ""}</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="6" style="text-align:center;color:#777;padding:24px 0;">No scheduled visits for this date.</td></tr>`;

  const html = `<!doctype html><html><head><meta charset="utf-8" /><title>Day sheet ${esc(dateISO)}</title>
<style>${PRINT_STYLES}
  td { padding: 9px 8px; font-size: 12.5px; }
  tr.head-row td { font-size: 9.5px; letter-spacing: 0.16em; color: #555; text-transform: uppercase; border-bottom: 2px solid #111; }
</style></head><body>
  <div class="head">
    <div class="brand">${LOGO_MARK_SVG}<div class="bname">CRYSTAL DIAGNOSTIC CENTRE<small>UTHALSAR NAKA · THANE WEST · +91 88283 93955</small></div></div>
    <div class="ref"><div class="label">FRONT-DESK DAY SHEET</div><div class="code" style="font-size:14px;">${esc(pretty)}</div></div>
  </div>
  <h1>SCHEDULED VISITS — ${scheduled.length} APPOINTMENT${scheduled.length === 1 ? "" : "S"}</h1>
  <table>
    <tr class="head-row"><td>#</td><td>Slot</td><td>Reference</td><td>Patient</td><td>Mobile</td><td>Test / Package</td></tr>
    ${rows}
  </table>
  <div class="sign"><span>Prepared by</span><span>Front desk</span></div>
  <div class="foot">Only requests with status SCHEDULED appear here. Times are patient preferences — reconfirm on call. This sheet is for internal reception use, not a medical record or bill.</div>
  <script>window.onload = function () { window.focus(); window.print(); };</script>
</body></html>`;
  openPrintWindow(html);
}

function AppointmentDetailDialog({
  appointmentId,
  appointments,
  onClose,
}: {
  appointmentId: string | null;
  appointments: AppointmentDTO[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const appointment = useMemo(
    () => appointments.find((a) => a.id === appointmentId) ?? null,
    [appointments, appointmentId]
  );

  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("NEW");

  // Adjust state during render (React-recommended replacement for the old
  // useEffect): re-sync the editable fields whenever the dialog target or its
  // server data changes.
  const syncKey = {
    appointmentId,
    internalNotes: appointment?.internalNotes,
    status: appointment?.status,
  };
  const [lastSyncKey, setLastSyncKey] = useState(syncKey);
  if (
    syncKey.appointmentId !== lastSyncKey.appointmentId ||
    syncKey.internalNotes !== lastSyncKey.internalNotes ||
    syncKey.status !== lastSyncKey.status
  ) {
    setLastSyncKey(syncKey);
    setNotes(appointment?.internalNotes ?? "");
    setStatus(appointment?.status ?? "NEW");
  }

  const patch = useMutation({
    mutationFn: (data: { status?: string; internalNotes?: string }) =>
      api.patch<AppointmentDTO>(`/api/appointments/${appointmentId}`, data),
    onSuccess: (updated, vars) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["overview-recent-appointments"] });
      toast({
        title: vars.internalNotes !== undefined ? "Internal notes saved" : `Status updated to ${updated.status}`,
      });
    },
    onError: (err) => mutationError(err, toast, "Update failed"),
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/api/appointments/${appointmentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["overview-recent-appointments"] });
      toast({ title: "Request deleted" });
      onClose();
    },
    onError: (err) => mutationError(err, toast, "Delete failed"),
  });

  return (
    <Dialog open={!!appointmentId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {appointment ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2 pr-6 text-ink">
                Appointment request
                <StatusBadge status={status} />
              </DialogTitle>
              <DialogDescription>
                Received {fmtDateTime(appointment.createdAt)} · Reference {appointment.reference}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => printAppointmentSlip(appointment)}
              >
                <Printer className="h-4 w-4" aria-hidden />
                Print summary
              </Button>
              {appointment.status === "SCHEDULED" && appointment.preferredDate && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-gold/40 text-gold-text hover:bg-gold/10 hover:text-gold-text sm:w-auto"
                  onClick={() =>
                    downloadAppointmentIcs({
                      reference: appointment.reference,
                      patientName: appointment.name,
                      testOrPackage: appointment.testOrPackage,
                      preferredDate: appointment.preferredDate as string,
                      preferredTime: appointment.preferredTime,
                      trackUrl: `${window.location.origin}/#/track?reference=${appointment.reference}`,
                    })
                  }
                >
                  <CalendarPlus className="h-4 w-4" aria-hidden />
                  Calendar (.ics)
                </Button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailRow label="Patient name" value={appointment.name} />
              <DetailRow
                label="Mobile"
                icon={<Phone className="h-4 w-4" aria-hidden />}
                value={
                  <a href={`tel:+91${appointment.mobile}`} className="font-bold text-medblue hover:underline">
                    +91 {appointment.mobile}
                  </a>
                }
              />
              <DetailRow
                label="Email"
                icon={<Mail className="h-4 w-4" aria-hidden />}
                value={appointment.email ?? <span className="text-inkmuted">Not provided</span>}
              />
              <DetailRow
                label="Test / Package"
                value={<Badge variant="outline" className="border-brandborder font-semibold text-ink">{appointment.testOrPackage}</Badge>}
              />
              <DetailRow
                label="Preferred date"
                icon={<CalendarDays className="h-4 w-4" aria-hidden />}
                value={appointment.preferredDate ? fmtDate(appointment.preferredDate) : <span className="text-inkmuted">Any</span>}
              />
              <DetailRow
                label="Preferred time"
                icon={<Clock className="h-4 w-4" aria-hidden />}
                value={appointment.preferredTime ?? <span className="text-inkmuted">Any</span>}
              />
              <DetailRow
                label="Home sample collection"
                icon={<Home className="h-4 w-4" aria-hidden />}
                value={
                  appointment.homeCollection ? (
                    <span className="font-bold text-teal-800">Requested</span>
                  ) : (
                    <span className="text-inkmuted">Not requested</span>
                  )
                }
              />
              <DetailRow
                label="Consent to contact"
                value={appointment.consent ? <span className="font-bold text-emerald-700">Yes</span> : <span className="font-bold text-red-700">No</span>}
              />
            </div>

            {appointment.message && (
              <>
                <Separator className="bg-brandborder" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-inkmuted">Patient message</p>
                  <p className="mt-1 whitespace-pre-line bg-soft/70 p-3 text-sm leading-relaxed text-ink">
                    {appointment.message}
                  </p>
                </div>
              </>
            )}

            <Separator className="bg-brandborder" />

            <div className="space-y-4">
              <div>
                <Label htmlFor="appointment-status">Update status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => {
                    setStatus(v);
                    patch.mutate({ status: v });
                  }}
                >
                  <SelectTrigger id="appointment-status" className="mt-1.5 w-full sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPOINTMENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="appointment-notes" className="flex items-center gap-1.5">
                  <StickyNote className="h-3.5 w-3.5 text-medblue" aria-hidden />
                  Internal notes (staff only)
                </Label>
                <Textarea
                  id="appointment-notes"
                  rows={3}
                  placeholder="e.g. Called on 12 Jan, patient will visit Tuesday 9 AM."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1.5"
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={patch.isPending || notes === (appointment.internalNotes ?? "")}
                    onClick={() => patch.mutate({ internalNotes: notes })}
                  >
                    Save notes
                  </Button>
                  <DeleteConfirmDialog
                    title="Delete this appointment request?"
                    description="This permanently removes the request (including notes) from the system. Consider setting status to CANCELLED instead."
                    onConfirm={() => remove.mutate()}
                    disabled={remove.isPending}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
                      disabled={remove.isPending}
                    >
                      {remove.isPending ? "Deleting…" : "Delete request"}
                    </Button>
                  </DeleteConfirmDialog>
                </div>
              </div>
            </div>
          </>
        ) : (
          <DialogHeader>
            <DialogTitle>Request not found</DialogTitle>
            <DialogDescription>This request may have been deleted.</DialogDescription>
          </DialogHeader>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AppointmentsTab() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const debouncedQ = useDebouncedValue(filters.q);
  // Day-sheet date, defaulting to "today" at the centre (Asia/Kolkata).
  const [daySheetDate, setDaySheetDate] = useState(() =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date())
  );

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (filters.status !== "ALL") p.set("status", filters.status);
    if (filters.from) p.set("from", filters.from);
    if (filters.to) p.set("to", filters.to);
    if (debouncedQ.trim()) p.set("q", debouncedQ.trim());
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [filters.status, filters.from, filters.to, debouncedQ]);

  const list = useQuery<AppointmentDTO[]>({
    queryKey: [QUERY_KEY, filters.status, filters.from, filters.to, debouncedQ],
    queryFn: () => api.get<AppointmentDTO[]>(`/api/appointments${qs}`),
    placeholderData: (prev) => prev,
  });

  // Memoized so the rolling "seen" merge below can safely compare by identity.
  const appointments = useMemo(() => list.data ?? [], [list.data]);

  // Day sheet source: ALL scheduled visits (independent of the visible
  // filters above, so the sheet is correct whatever the admin is filtering).
  const daySheet = useQuery<AppointmentDTO[]>({
    queryKey: ["daysheet", daySheetDate],
    queryFn: () => api.get<AppointmentDTO[]>("/api/appointments?status=SCHEDULED"),
    placeholderData: (prev) => prev,
  });

  // Keep a rolling map of every loaded request so the detail dialog keeps
  // working even if a status change moves the row out of the active filter.
  // Held in state and merged during render (adjust-state-during-render
  // pattern) instead of mutating a ref, which React forbids while rendering.
  const [seen, setSeen] = useState<{ source: AppointmentDTO[]; map: Map<string, AppointmentDTO> }>({
    source: appointments,
    map: new Map(),
  });
  if (appointments !== seen.source) {
    const map = new Map(seen.map);
    for (const a of appointments) map.set(a.id, a);
    setSeen({ source: appointments, map });
  }
  const dialogAppointments = useMemo(() => {
    if (selectedId && !appointments.some((a) => a.id === selectedId)) {
      const seenItem = seen.map.get(selectedId);
      if (seenItem) return [...appointments, seenItem];
    }
    return appointments;
  }, [appointments, selectedId, seen]);

  const hasFilters = filters.status !== "ALL" || filters.from !== "" || filters.to !== "" || filters.q !== "";

  return (
    <div>
      <TabHeader
        title="Appointment Requests"
        description="Every online booking request from the public site. Open a request to call the patient, update its status and keep internal notes."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 border border-brandborder bg-card px-3 py-1.5">
              <Label
                htmlFor="daysheet-date"
                className="text-[10px] font-semibold uppercase tracking-[0.14em] text-inkmuted"
              >
                Day sheet
              </Label>
              <input
                id="daysheet-date"
                type="date"
                value={daySheetDate}
                onChange={(e) => setDaySheetDate(e.target.value)}
                className="bg-transparent text-sm text-ink outline-none"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-[11px]"
                onClick={() => printDaySheet(daySheet.data ?? [], daySheetDate)}
              >
                <Printer className="h-3.5 w-3.5" aria-hidden />
                Print
              </Button>
            </div>
            <Button variant="outline" onClick={() => window.open("/api/admin/export?type=appointments", "_blank")}>
              <Download className="h-4 w-4" aria-hidden />
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="mb-4 grid gap-3 border border-brandborder bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-inkmuted" aria-hidden />
          <Input
            type="search"
            placeholder="Search name, mobile or test…"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            className="pl-9"
            aria-label="Search appointment requests"
          />
        </div>
        <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}>
          <SelectTrigger className="w-full" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {APPOINTMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={filters.from}
          max={filters.to || undefined}
          onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          aria-label="Received from date"
         
        />
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            aria-label="Received to date"
           
          />
          {hasFilters && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label="Clear filters"
              title="Clear filters"
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              <FilterX className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {list.isLoading ? (
        <ListSkeleton rows={6} />
      ) : list.isError ? (
        <Card className="border-destructive/30 bg-destructive/5 p-0">
          <CardContent className="p-5 text-sm font-medium text-destructive">
            Could not load appointment requests. Please refresh.
          </CardContent>
        </Card>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-10 w-10" aria-hidden />}
          title={hasFilters ? "No requests match these filters" : "No appointment requests yet"}
          hint={
            hasFilters
              ? "Try widening the date range or clearing the search."
              : "Requests submitted from the “Book a Test” page will appear here in real time."
          }
        />
      ) : (
        <>
          <p className="mb-2 text-xs font-semibold text-inkmuted">
            Showing {appointments.length} request{appointments.length === 1 ? "" : "s"} — click a row for full details
          </p>

          {/* Desktop table */}
          <ResponsiveTableWrap>
            <table className="hidden w-full text-left text-sm md:table">
              <thead>
                <tr className="border-b border-brandborder bg-soft/60 text-[11px] uppercase tracking-wide text-inkmuted">
                  <th scope="col" className="px-4 py-3 font-bold">Received</th>
                  <th scope="col" className="px-4 py-3 font-bold">Ref</th>
                  <th scope="col" className="px-4 py-3 font-bold">Patient</th>
                  <th scope="col" className="px-4 py-3 font-bold">Test / Package</th>
                  <th scope="col" className="px-4 py-3 font-bold">Preferred</th>
                  <th scope="col" className="px-4 py-3 font-bold">Status</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    className={`cursor-pointer border-b border-brandborder/70 transition-colors last:border-0 hover:bg-soft/70 ${
                      a.status === "NEW" ? "bg-teal-soft/20" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-inkmuted">{fmtDateTime(a.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-bold tracking-wider text-gold-text">{a.reference}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-ink">
                        {a.name}
                        {a.homeCollection && (
                          <span title="Home collection requested" className="ml-1.5 inline-flex align-middle">
                            <Home className="h-3.5 w-3.5 text-teal" aria-label="Home collection requested" />
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-inkmuted">+91 {a.mobile}</p>
                    </td>
                    <td className="max-w-52 truncate px-4 py-3 text-ink">{a.testOrPackage}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-inkmuted">
                      {a.preferredDate ? fmtDate(a.preferredDate) : "—"}
                      {a.preferredTime ? ` · ${a.preferredTime.split(" (")[0]}` : ""}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <ChevronDown className="ml-auto h-4 w-4 rotate-[-90deg] text-inkmuted" aria-hidden />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <ul className="divide-y divide-brandborder md:hidden">
              {appointments.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => setSelectedId(a.id)}
                    className={`w-full px-4 py-3 text-left transition-colors active:bg-soft ${
                      a.status === "NEW" ? "bg-teal-soft/20" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-ink">{a.name}</p>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink">{a.testOrPackage}</p>
                    <p className="mt-0.5 font-mono text-[11px] font-bold tracking-wider text-gold-text">{a.reference}</p>
                    <p className="mt-0.5 text-xs text-inkmuted">
                      +91 {a.mobile} · {fmtDateTime(a.createdAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </ResponsiveTableWrap>
        </>
      )}

      <AppointmentDetailDialog
        appointmentId={selectedId}
        appointments={dialogAppointments}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
