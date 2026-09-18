"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarCheck, CalendarPlus, ClipboardList, Loader2, MapPin, MessageCircle, Phone, Search, ShieldCheck } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { usePageMeta } from "@/lib/seo";
import { BUSINESS } from "@/lib/constants";
import { downloadAppointmentIcs } from "@/lib/calendar";
import { Breadcrumbs, JsonLd, PageHero, breadcrumbSchema, type Crumb } from "@/components/site/Shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Reveal } from "@/components/site/Reveal";
import { TrackerQr } from "@/components/site/TrackerQr";

const CRUMBS: Crumb[] = [{ label: "Track Request" }];

interface TrackResult {
  reference: string;
  name: string;
  testOrPackage: string;
  preferredDate: string | null;
  preferredTime: string | null;
  homeCollection: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** Status → public, plain-language meaning + Midnight Showroom chip tone. */
const STATUS_META: Record<string, { label: string; meaning: string; chip: string; dot: string; step: number }> = {
  NEW: {
    label: "RECEIVED",
    meaning: "Your request has reached us. Our team will call you shortly to confirm the details.",
    chip: "border-gold/40 bg-gold/10 text-gold-text",
    dot: "bg-gold",
    step: 1,
  },
  CONTACTED: {
    label: "CONTACTED",
    meaning: "Our team has called you. If you missed the call, please ring us back to confirm your slot.",
    chip: "border-cyan-pulse/40 bg-cyan-pulse/10 text-cyan-pulse",
    dot: "bg-cyan-pulse",
    step: 2,
  },
  SCHEDULED: {
    label: "SCHEDULED",
    meaning: "Your appointment is booked. Please arrive a few minutes early with any previous reports.",
    chip: "border-white/30 bg-white/10 text-ink",
    dot: "bg-ink",
    step: 3,
  },
  COMPLETED: {
    label: "COMPLETED",
    meaning: "Your visit is complete. Reports can be collected from the centre counter as advised.",
    chip: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    dot: "bg-emerald-400",
    step: 4,
  },
  CANCELLED: {
    label: "CANCELLED",
    meaning: "This request was cancelled. You can book a fresh appointment anytime, or call us for help.",
    chip: "border-destructive/40 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
    step: 0,
  },
};

const TIMELINE = ["REQUEST RECEIVED", "CONTACTED BY TEAM", "APPOINTMENT SCHEDULED", "VISIT COMPLETED"];

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }).format(d);
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d.getTime()) ? iso : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

export function TrackPage() {
  usePageMeta(
    "Track Request",
    "Check the status of your appointment request at Crystal Diagnostic Centre using your reference code and mobile number.",
    "/track"
  );

  const [reference, setReference] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [seeded, setSeeded] = useState(false);

  // One-time render-phase sync: prefill the reference (and optionally the
  // mobile number) from a deep link such as #/track?reference=CDC-XXXXXX
  // (runs after hydration, so no SSR mismatch; safe because this lazy page
  // never renders on the server).
  if (!seeded) {
    setSeeded(true);
    const fromHash = typeof window !== "undefined" ? window.location.hash : "";
    const match = /[?&]reference=([A-Za-z0-9-]+)/.exec(fromHash);
    if (match) setReference(match[1].toUpperCase());
    const mobMatch = /[?&]mobile=(\d{10})/.exec(fromHash);
    if (mobMatch) setMobile(mobMatch[1]);
  }

  const meta = result ? STATUS_META[result.status] ?? STATUS_META.NEW : null;

  const refValid = useMemo(() => /^cdc-[a-z2-9]{6,12}$/i.test(reference.trim()), [reference]);
  const mobileValid = useMemo(() => /^[6-9]\d{9}$/.test(mobile.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "").replace(/^0(?=\d{10}$)/, "")), [mobile]);

  async function runLookup(refCode: string, mob: string) {
    setError(null);
    setLoading(true);
    try {
      const data = await api.get<TrackResult>(
        `/api/appointments/track?reference=${encodeURIComponent(refCode)}&mobile=${mob}`
      );
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setResult(null);
      const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // Deep links that carry BOTH the reference and the mobile number (front-desk
  // shares, CSV export, print slips) resolve immediately — one attempt only.
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current) return;
    const fromHash = window.location.hash;
    const refMatch = /[?&]reference=([A-Za-z0-9-]+)/.exec(fromHash);
    const mobMatch = /[?&]mobile=(\d{10})/.exec(fromHash);
    if (!refMatch || !mobMatch) return;
    autoRan.current = true;
    void runLookup(refMatch[1].toUpperCase(), mobMatch[1]);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!refValid) {
      setError("Enter the reference code from your booking confirmation (e.g. CDC-7K2M9Q).");
      return;
    }
    if (!mobileValid) {
      setError("Enter the 10-digit mobile number you provided at booking.");
      return;
    }
    const cleanMobile = mobile.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "").replace(/^0(?=\d{10}$)/, "");
    await runLookup(reference.trim().toUpperCase(), cleanMobile);
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema(CRUMBS)} />
      <PageHero
        eyebrow="Appointment Tracker"
        title="Track Your Request"
        description="Enter the reference code shown after booking, together with the mobile number you gave us, to see where your request stands."
      >
        <div className="mt-6">
          <Breadcrumbs items={CRUMBS} />
        </div>
      </PageHero>

      <section className="bg-soft/40">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* -------- Lookup form / result -------- */}
            <Reveal className="lg:col-span-2" delay={0.05}>
              {!result ? (
                <Card className="border-white/10 p-0">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-display text-[15px] uppercase tracking-wide text-ink">
                      Look up your appointment
                    </CardTitle>
                    <p className="text-sm text-inkmuted">
                      Both details must match the ones you provided while booking.
                    </p>
                  </CardHeader>
                  <CardContent className="p-5 pt-2 sm:p-6 sm:pt-2">
                    {error && (
                      <div
                        role="alert"
                        className="mb-5 border border-white/10 border-l-2 border-l-destructive bg-white/[0.03] px-4 py-3 text-sm font-medium text-destructive"
                      >
                        {error}
                      </div>
                    )}

                    <form noValidate onSubmit={handleSubmit} className="space-y-5">
                      <div>
                        <Label htmlFor="track-ref" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-steel">
                          Reference Code <span aria-hidden>*</span>
                        </Label>
                        <Input
                          id="track-ref"
                          type="text"
                          autoComplete="off"
                          placeholder="e.g. CDC-7K2M9Q"
                          value={reference}
                          onChange={(e) => setReference(e.target.value.toUpperCase())}
                          aria-invalid={reference.length > 0 && !refValid}
                          className="mt-1.5 border-white/15 bg-iron font-mono uppercase tracking-widest text-ink placeholder:text-inkmuted focus-visible:border-gold focus-visible:ring-gold/40"
                        />
                      </div>

                      <div>
                        <Label htmlFor="track-mobile" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-steel">
                          Mobile Number <span aria-hidden>*</span>
                        </Label>
                        <div className="mt-1.5 flex">
                          <span
                            aria-hidden
                            className="flex items-center border border-r-0 border-white/15 bg-white/[0.04] px-3 text-sm font-semibold text-ash"
                          >
                            +91
                          </span>
                          <Input
                            id="track-mobile"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel"
                            maxLength={10}
                            placeholder="98765 43210"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            className="border-white/15 bg-iron text-ink placeholder:text-inkmuted focus-visible:border-gold focus-visible:ring-gold/40"
                          />
                        </div>
                      </div>

                      <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
                        {loading ? "Checking…" : "Check Status"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-white/10 bg-card p-0">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="eyebrow">Request {result.reference}</p>
                        <h2 className="mt-2 font-display text-2xl uppercase tracking-tight text-ink">{result.testOrPackage}</h2>
                        <p className="mt-1 text-sm text-inkmuted">
                          Requested on {fmtDateTime(result.createdAt)}
                          {result.homeCollection ? " · Home collection" : ""}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-2 border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ${meta?.chip}`}>
                        <span className={`h-1.5 w-1.5 ${meta?.dot}`} aria-hidden />
                        {meta?.label}
                      </span>
                    </div>

                    {/* Timeline */}
                    {meta && meta.step > 0 && (
                      <ol className="mt-8 space-y-0" aria-label="Request progress">
                        {TIMELINE.map((stage, i) => {
                          const done = i < meta.step;
                          const current = i === meta.step - 1;
                          return (
                            <li key={stage} className="relative flex gap-4 pb-6 last:pb-0">
                              {/* connector */}
                              {i < TIMELINE.length - 1 && (
                                <span
                                  aria-hidden
                                  className={`absolute left-[7px] top-4 h-full w-px ${done ? "bg-gold/60" : "bg-white/15"}`}
                                />
                              )}
                              <span
                                aria-hidden
                                className={`relative z-10 mt-1 h-[15px] w-[15px] shrink-0 border transition-colors ${
                                  current
                                    ? "border-gold bg-gold shadow-[0_0_10px_rgba(255,192,0,0.45)]"
                                    : done
                                      ? "border-gold/60 bg-gold/40"
                                      : "border-white/25 bg-transparent"
                                }`}
                              />
                              <div className="-mt-0.5">
                                <p className={`text-[12px] font-bold uppercase tracking-[0.16em] ${done || current ? "text-ink" : "text-steel"}`}>
                                  {stage}
                                </p>
                                {/* stage stamps — known dates from the request record */}
                                {i === 0 && (
                                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-steel">
                                    {fmtDateTime(result.createdAt)}
                                  </p>
                                )}
                                {current && i > 0 && (
                                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-steel">
                                    Updated {fmtDateTime(result.updatedAt)}
                                  </p>
                                )}
                                {current && <p className="mt-1 max-w-md text-[13px] leading-relaxed text-inkmuted">{meta.meaning}</p>}
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    )}

                    {meta?.step === 0 && (
                      <p className="mt-6 border-l-2 border-destructive bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-inkmuted">
                        {meta.meaning}
                      </p>
                    )}

                    <dl className="mt-8 grid gap-x-8 gap-y-4 border-t border-white/10 pt-6 sm:grid-cols-2">
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-steel">Preferred date</dt>
                        <dd className="mt-1 text-sm text-ink">{fmtDate(result.preferredDate)}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-steel">Preferred time</dt>
                        <dd className="mt-1 text-sm text-ink">{result.preferredTime || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-steel">Booked for</dt>
                        <dd className="mt-1 text-sm text-ink">{result.name}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-steel">Last updated</dt>
                        <dd className="mt-1 text-sm text-ink">{fmtDateTime(result.updatedAt)}</dd>
                      </div>
                    </dl>

                    <div className="mt-8 flex flex-wrap items-center gap-6 border-t border-white/10 pt-6">
                      <TrackerQr reference={result.reference} size={92} label="Scan on another device" />
                      <p className="max-w-xs text-xs leading-relaxed text-inkmuted">
                        Show this code at the front desk or scan it with a phone to open the tracker
                        pre-filled — no typing needed.
                      </p>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3">
                      {result.status === "SCHEDULED" && result.preferredDate && (
                        <Button
                          variant="outline"
                          className="border-gold/40 text-gold-text hover:bg-gold/10 hover:text-gold-text"
                          onClick={() =>
                            downloadAppointmentIcs({
                              reference: result.reference,
                              patientName: result.name,
                              testOrPackage: result.testOrPackage,
                              preferredDate: result.preferredDate as string,
                              preferredTime: result.preferredTime,
                              trackUrl: `${window.location.origin}/#/track?reference=${result.reference}`,
                            })
                          }
                        >
                          <CalendarPlus className="h-4 w-4" aria-hidden />
                          Add to Calendar
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => {
                          const shareUrl = `${window.location.origin}/#/track?reference=${result.reference}`;
                          const text = `Crystal Diagnostic Centre — appointment ${result.reference}. Track your status: ${shareUrl}`;
                          window.open(
                            `https://wa.me/?text=${encodeURIComponent(text)}`,
                            "_blank",
                            "noopener,noreferrer"
                          );
                        }}
                      >
                        <MessageCircle className="h-4 w-4" aria-hidden />
                        Share via WhatsApp
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setResult(null);
                          setError(null);
                        }}
                      >
                        <Search className="h-4 w-4" aria-hidden />
                        Track Another Request
                      </Button>
                      <Button asChild>
                        <a href={`#/book-test`}>
                          <CalendarCheck className="h-4 w-4" aria-hidden />
                          Book Another Test
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </Reveal>

            {/* -------- Sidebar -------- */}
            <Reveal delay={0.1} className="space-y-6">
              <Card className="border-white/10 p-0">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 font-display text-[15px] uppercase tracking-wide text-ink">
                    <ShieldCheck className="h-4 w-4 text-teal" aria-hidden />
                    Privacy First
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 text-[13px] leading-relaxed text-inkmuted">
                  Your request can only be viewed with <span className="font-semibold text-ink">both</span> the reference code
                  and the exact mobile number used at booking. If you lost your code, call us and we will verify your identity
                  before sharing any details.
                </CardContent>
              </Card>

              <Card className="border-white/10 p-0">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 font-display text-[15px] uppercase tracking-wide text-ink">
                    <ClipboardList className="h-4 w-4 text-teal" aria-hidden />
                    What Each Status Means
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-5 pt-0">
                  {Object.entries(STATUS_META).filter(([, m]) => m.step > 0).map(([key, m]) => (
                    <div key={key} className="flex items-start justify-between gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                      <span className={`inline-flex shrink-0 items-center gap-1.5 border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] ${m.chip}`}>
                        <span className={`h-1 w-1 ${m.dot}`} aria-hidden />
                        {m.label}
                      </span>
                      <p className="max-w-[220px] text-right text-[11px] leading-relaxed text-ash">{m.meaning}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-gold/25 bg-secondary p-0">
                <CardContent className="p-5">
                  <p className="font-display text-sm uppercase tracking-wide text-ink">Need help?</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ash">
                    Our front desk is happy to confirm any detail over the phone.
                  </p>
                  <Button asChild className="mt-4 w-full">
                    <a href={BUSINESS.phoneHref}>
                      <Phone className="h-4 w-4" aria-hidden />
                      {BUSINESS.phoneDisplay}
                    </a>
                  </Button>
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-steel">
                    <MapPin className="h-3.5 w-3.5 text-gold" aria-hidden />
                    Uthalsar Naka, Thane West
                  </p>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
