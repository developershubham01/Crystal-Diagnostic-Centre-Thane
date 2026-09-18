"use client";

import { useMemo, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  Home,
  Info,
  MapPin,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { usePageMeta } from "@/lib/seo";
import { useSettings } from "@/lib/hooks";
import { useRouterStore } from "@/lib/store";
import { useServices, usePackages } from "@/lib/hooks";
import { BUSINESS } from "@/lib/constants";
import { DEFAULT_HOURS, parseWorkingHours, type WeekHours } from "@/components/site/OpenNowBadge";
import { Breadcrumbs, JsonLd, PageHero, breadcrumbSchema, type Crumb } from "@/components/site/Shared";
import { Reveal } from "@/components/site/Reveal";
import { TrackerQr } from "@/components/site/TrackerQr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const CRUMBS: Crumb[] = [{ label: "Book a Test" }];

const TIME_SLOTS = [
  "Morning (7:00 AM – 11:00 AM)",
  "Midday (11:00 AM – 2:00 PM)",
  "Afternoon (2:00 PM – 5:00 PM)",
  "Evening (5:00 PM – 9:00 PM)",
];

/** Minute-of-day range for each canonical slot, used to test overlap with
 *  the centre's opening hours on the chosen date. */
const SLOT_RANGES: Record<string, [number, number]> = {
  "Morning (7:00 AM – 11:00 AM)": [7 * 60, 11 * 60],
  "Midday (11:00 AM – 2:00 PM)": [11 * 60, 14 * 60],
  "Afternoon (2:00 PM – 5:00 PM)": [14 * 60, 17 * 60],
  "Evening (5:00 PM – 9:00 PM)": [17 * 60, 21 * 60],
};

/** 420 → "7:00 AM" — used by the slot guardrail hints. */
function fmtMinutes(mins: number): string {
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return m === 0 ? `${h12}:00 ${ampm}` : `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

const OTHER_OPTION = "__other__";

interface FormState {
  name: string;
  mobile: string;
  email: string;
  testValue: string;
  preferredDate: string;
  preferredTime: string;
  homeCollection: boolean;
  message: string;
  consent: boolean;
  website: string; // honeypot — must stay empty
}

const INITIAL_FORM: FormState = {
  name: "",
  mobile: "",
  email: "",
  testValue: "",
  preferredDate: "",
  preferredTime: "",
  homeCollection: false,
  message: "",
  consent: false,
  website: "",
};

type FormErrors = Partial<Record<keyof FormState, string>>;

/** Normalise an Indian mobile number to bare 10 digits (accepts +91 / 91 / 0 prefixes). */
function normaliseMobile(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

/** Today's date in the centre's timezone (Asia/Kolkata) as YYYY-MM-DD. */
function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Weekday index (0 = Sunday) for a YYYY-MM-DD date, evaluated in IST. */
function weekdayOf(dateIso: string): number {
  return new Date(`${dateIso}T12:00:00+05:30`).getDay();
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs font-medium text-destructive">
      {message}
    </p>
  );
}

export function BookTestPage() {
  usePageMeta("Book a Test", "Request an appointment at Crystal Diagnostic Centre, Thane. Our team will contact you to confirm your test, date and time.", "/book-test");
  const { toast } = useToast();
  const navigate = useRouterStore((s) => s.navigate);
  const { data: settings } = useSettings();
  const { data: services = [] } = useServices();
  const { data: packages = [] } = usePackages();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const minDate = useMemo(todayIso, []);

  // Centre visiting hours (admin-editable) drive date validation — closed
  // days can't be requested, so patients never pick a dead slot.
  const weekHours: WeekHours = useMemo(
    () => parseWorkingHours(settings.workingHours) ?? DEFAULT_HOURS,
    [settings.workingHours]
  );

  const dateIssue = useMemo(
    () =>
      (dateIso: string): string | null => {
        if (!dateIso) return null;
        if (dateIso < minDate) return "Please choose today or a future date.";
        if (!weekHours[weekdayOf(dateIso)]) {
          return "The centre is closed on this day — please pick another date.";
        }
        return null;
      },
    [minDate, weekHours]
  );
  const liveDateIssue = dateIssue(form.preferredDate);

  // Opening window for the chosen date (null until a valid date is picked).
  const dayHours: [number, number] | null = useMemo(() => {
    if (!form.preferredDate || liveDateIssue) return null;
    return weekHours[weekdayOf(form.preferredDate)] ?? null;
  }, [form.preferredDate, liveDateIssue, weekHours]);

  // A slot works when it overlaps the day's open window (patients may arrive
  // any time the centre is open inside that band).
  const slotIssue = useMemo(
    () =>
      (slot: string): string | null => {
        if (!dayHours || !slot) return null;
        const [open, close] = dayHours;
        const [start, end] = SLOT_RANGES[slot] ?? [0, 24 * 60];
        if (start < close && end > open) return null;
        return `The centre is open ${fmtMinutes(open)} – ${fmtMinutes(close)} on this day — the ${slot.split(" (")[0].toLowerCase()} slot falls outside those hours.`;
      },
    [dayHours]
  );
  const liveSlotIssue = slotIssue(form.preferredTime);

  // value -> display label for the test/package dropdown
  const testOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of services) map.set(`service:${s.slug}`, s.name);
    for (const p of packages) map.set(`package:${p.slug}`, p.name);
    map.set(OTHER_OPTION, "Other (specify in message)");
    return map;
  }, [services, packages]);

  /** Human label of the chosen test/package — drives the live summary plate. */
  const summaryTest = form.testValue ? (testOptions.get(form.testValue) ?? null) : null;

  // Preparation guidance for the currently selected service/package —
  // surfaced right under the dropdown so patients book correctly first time.
  const selectedTest = useMemo(() => {
    const v = form.testValue;
    if (v.startsWith("service:")) {
      const s = services.find((x) => x.slug === v.slice(8));
      return s ? { name: s.name, preparation: s.preparation } : null;
    }
    if (v.startsWith("package:")) {
      const p = packages.find((x) => x.slug === v.slice(8));
      return p ? { name: p.name, preparation: p.preparation } : null;
    }
    return null;
  }, [form.testValue, services, packages]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (form.name.trim().length < 2) errs.name = "Please enter your full name.";
    const mobile = normaliseMobile(form.mobile);
    if (!/^[6-9]\d{9}$/.test(mobile)) errs.mobile = "Enter a valid 10-digit Indian mobile number.";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Enter a valid email address (or leave it blank).";
    }
    if (!form.testValue) errs.testValue = "Please choose a test, package, or 'Other'.";
    const dateProblem = form.preferredDate ? dateIssue(form.preferredDate) : null;
    if (dateProblem) errs.preferredDate = dateProblem;
    if (!dateProblem && form.preferredTime) {
      const slotProblem = slotIssue(form.preferredTime);
      if (slotProblem) errs.preferredTime = slotProblem;
    }
    if (form.message.length > 2000) errs.message = "Message is too long (max 2000 characters).";
    if (!form.consent) errs.consent = "Please provide consent so our team can contact you.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    const errs = validate();
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      const first = Object.keys(errs).find((k) => errs[k as keyof FormErrors]);
      document.getElementById(`book-${first}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const label = testOptions.get(form.testValue) ?? form.testValue;
      const res = await api.post<{ ok: boolean; id: string; reference?: string }>("/api/appointments", {
        name: form.name.trim(),
        mobile: normaliseMobile(form.mobile),
        email: form.email.trim() || undefined,
        testOrPackage: label,
        preferredDate: form.preferredDate || undefined,
        preferredTime: form.preferredTime || undefined,
        homeCollection: form.homeCollection,
        message: form.message.trim() || undefined,
        consent: form.consent,
        website: form.website, // honeypot — always empty for humans
      });
      setReference(res?.reference ?? null);
      setCopied(false);
      setSubmitted(true);
      toast({
        title: "Request received",
        description: "Our team will contact you to confirm the details.",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      setApiError(message);
      if (!(err instanceof ApiError && err.status === 429)) {
        toast({ title: "Could not send request", description: message, variant: "destructive" });
      }
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setErrors({});
    setApiError(null);
    setSubmitted(false);
    setReference(null);
    setCopied(false);
  }

  const showHomeCollection = settings.homeCollectionAvailable !== "no";

  return (
    <>
      <JsonLd data={breadcrumbSchema(CRUMBS)} />
      <PageHero
        eyebrow="Appointments"
        title="Book a Test"
        description="Tell us which test or health package you need and when you would like to visit. This is an appointment request — our team confirms every slot personally."
      >
        <div className="mt-6">
          <Breadcrumbs items={CRUMBS} />
        </div>
      </PageHero>

      <section className="bg-soft/40">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <Reveal>
            <Card className="border-white/10 bg-white/[0.03] p-0">
              <CardContent className="flex items-start gap-3 p-5">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-ink">Before you submit</p>
                  <p className="mt-1 text-sm leading-relaxed text-inkmuted">{settings.bookTestNote}</p>
                  <p className="mt-1 text-xs leading-relaxed text-inkmuted">
                    Please do not share sensitive medical details in this form — test selection and preparation
                    guidance are confirmed over the phone.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Reveal>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {/* ------------ Form / success ------------ */}
            <Reveal className="lg:col-span-2" delay={0.05}>
              {submitted ? (
                <Card className="border-white/10 bg-card p-0 text-center">
                  <CardContent className="flex flex-col items-center gap-4 p-8 sm:p-12">
                    <span className="hex flex h-16 w-16 items-center justify-center bg-gold/15" aria-hidden>
                      <CheckCircle2 className="h-9 w-9 text-gold" />
                    </span>
                    <h2 className="font-display text-xl uppercase tracking-tight text-ink sm:text-2xl">
                      Thank you. Your appointment request has been received.
                      <span className="block">Our team will contact you to confirm the details.</span>
                    </h2>

                    {reference && (
                      <div className="w-full max-w-md border border-gold/30 bg-gold/[0.06] p-4" role="status">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-steel">
                          Your tracking reference
                        </p>
                        <div className="mt-2 flex items-center gap-4">
                          <TrackerQr reference={reference} size={88} label="Scan to track" className="shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-mono text-lg font-bold tracking-[0.22em] text-gold-text">{reference}</span>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(reference);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2500);
                                  } catch {
                                    /* clipboard unavailable — reference remains visible */
                                  }
                                }}
                                className="border border-white/20 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:border-gold/60 hover:text-gold"
                                aria-live="polite"
                              >
                                {copied ? "Copied" : "Copy"}
                              </button>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-ash">
                              Save this code — you can track your request status anytime with it and your mobile number.
                            </p>
                            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigate("#/track")}>
                              <Search className="h-4 w-4" aria-hidden />
                              Track Your Request
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="max-w-md text-sm leading-relaxed text-inkmuted">
                      Requests are typically confirmed during centre working hours. If your test is time-sensitive,
                      you can call us directly at{" "}
                      <a href={BUSINESS.phoneHref} className="font-semibold text-gold hover:text-gold-text">
                        {BUSINESS.phoneDisplay}
                      </a>
                      .
                    </p>
                    <div className="mt-2 flex flex-wrap justify-center gap-3">
                      <Button variant="outline" onClick={() => navigate("#/")}>
                        <Home className="h-4 w-4" aria-hidden />
                        Back to Home
                      </Button>
                      <Button onClick={resetForm}>
                        <CalendarCheck className="h-4 w-4" aria-hidden />
                        Book Another Test
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-white/10 p-0">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-display text-[15px] uppercase tracking-wide text-ink">
                      Appointment request form
                    </CardTitle>
                    <p className="text-sm text-inkmuted">
                      Fields marked <span aria-hidden>*</span><span className="sr-only">asterisk</span> are required.
                    </p>
                  </CardHeader>
                  <CardContent className="p-5 pt-2 sm:p-6 sm:pt-2">
                    {apiError && (
                      <div
                        role="alert"
                        className="mb-5 border border-white/10 border-l-2 border-l-destructive bg-white/[0.03] px-4 py-3 text-sm font-medium text-destructive"
                      >
                        {apiError}
                      </div>
                    )}

                    <form noValidate onSubmit={handleSubmit} className="space-y-5">
                      {/* Honeypot — hidden from humans, traps bots */}
                      <div className="hidden" aria-hidden="true">
                        <label htmlFor="book-website">Website</label>
                        <input
                          id="book-website"
                          type="text"
                          name="website"
                          tabIndex={-1}
                          autoComplete="off"
                          value={form.website}
                          onChange={(e) => set("website", e.target.value)}
                        />
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="book-name" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-steel">
                            Full Name <span aria-hidden>*</span>
                          </Label>
                          <Input
                            id="book-name"
                            type="text"
                            autoComplete="name"
                            placeholder="e.g. Priya Sharma"
                            value={form.name}
                            onChange={(e) => set("name", e.target.value)}
                            aria-invalid={!!errors.name}
                            aria-describedby={errors.name ? "book-name-error" : undefined}
                            className="mt-1.5 border-white/15 bg-iron text-ink placeholder:text-inkmuted focus-visible:border-gold focus-visible:ring-gold/40"
                          />
                          <FieldError id="book-name-error" message={errors.name} />
                        </div>

                        <div>
                          <Label htmlFor="book-mobile" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-steel">
                            Mobile Number <span aria-hidden>*</span>
                          </Label>
                          <div className="mt-1.5 flex items-stretch gap-2">
                            <span className="inline-flex select-none items-center border border-white/15 bg-iron px-3 text-sm font-semibold text-ink">
                              +91
                            </span>
                            <Input
                              id="book-mobile"
                              type="tel"
                              inputMode="numeric"
                              autoComplete="tel-national"
                              placeholder="98765 43210"
                              value={form.mobile}
                              onChange={(e) => set("mobile", e.target.value)}
                              aria-invalid={!!errors.mobile}
                              aria-describedby={errors.mobile ? "book-mobile-error" : undefined}
                              className="border-white/15 bg-iron text-ink placeholder:text-inkmuted focus-visible:border-gold focus-visible:ring-gold/40"
                            />
                          </div>
                          <FieldError id="book-mobile-error" message={errors.mobile} />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="book-email" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-steel">
                          Email (optional)
                        </Label>
                        <Input
                          id="book-email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={(e) => set("email", e.target.value)}
                          aria-invalid={!!errors.email}
                          aria-describedby={errors.email ? "book-email-error" : undefined}
                          className="mt-1.5 border-white/15 bg-iron text-ink placeholder:text-inkmuted focus-visible:border-gold focus-visible:ring-gold/40"
                        />
                        <FieldError id="book-email-error" message={errors.email} />
                      </div>

                      <div>
                        <Label htmlFor="book-test" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-steel">
                          Test or Package <span aria-hidden>*</span>
                        </Label>
                        <Select value={form.testValue} onValueChange={(v) => set("testValue", v)}>
                          <SelectTrigger
                            id="book-test"
                            aria-invalid={!!errors.testValue}
                            aria-describedby={errors.testValue ? "book-test-error" : undefined}
                            className="mt-1.5 w-full border-white/15 bg-iron text-ink focus-visible:border-gold focus-visible:ring-gold/40 data-[placeholder]:text-inkmuted"
                          >
                            <SelectValue placeholder="Select a test, package, or Other" />
                          </SelectTrigger>
                          <SelectContent className="max-h-72">
                            <SelectGroup>
                              <SelectLabel>Services</SelectLabel>
                              {services.length === 0 && (
                                <SelectItem value="__no_services__" disabled>
                                  Loading services…
                                </SelectItem>
                              )}
                              {services.map((s) => (
                                <SelectItem key={s.slug} value={`service:${s.slug}`}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                            <SelectGroup>
                              <SelectLabel>Health Packages</SelectLabel>
                              {packages.map((p) => (
                                <SelectItem key={p.slug} value={`package:${p.slug}`}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                            <SelectGroup>
                              <SelectLabel>Other</SelectLabel>
                              <SelectItem value={OTHER_OPTION}>Other (specify in message)</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FieldError id="book-test-error" message={errors.testValue} />

                        {/* Live preparation hint from the selected service/package */}
                        {selectedTest?.preparation && (
                          <div
                            role="note"
                            aria-live="polite"
                            className="mt-3 flex items-start gap-3 border border-gold/25 border-l-2 border-l-gold bg-white/[0.03] px-4 py-3"
                          >
                            <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-text">
                                Preparation — {selectedTest.name}
                              </p>
                              <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-inkmuted">
                                {selectedTest.preparation}
                              </p>
                              <p className="mt-1.5 text-[11px] uppercase tracking-[0.1em] text-steel">
                                Indicative — the centre confirms final instructions on call.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="book-date" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-steel">
                            Preferred Date
                          </Label>
                          <Input
                            id="book-date"
                            type="date"
                            min={minDate}
                            value={form.preferredDate}
                            onChange={(e) => set("preferredDate", e.target.value)}
                            aria-invalid={!!liveDateIssue}
                            aria-describedby={liveDateIssue ? "book-date-issue" : "book-date-hint"}
                            className="mt-1.5 border-white/15 bg-iron text-ink focus-visible:border-gold focus-visible:ring-gold/40"
                          />
                          {liveDateIssue ? (
                            <p id="book-date-issue" role="alert" aria-live="polite" className="mt-1.5 text-xs font-medium text-destructive">
                              {liveDateIssue}
                            </p>
                          ) : (
                            <p id="book-date-hint" className="mt-1.5 text-xs text-inkmuted">Optional — final slot is confirmed by phone.</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="book-time" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-steel">
                            Preferred Time
                          </Label>
                          <Select value={form.preferredTime} onValueChange={(v) => set("preferredTime", v)}>
                            <SelectTrigger
                              id="book-time"
                              aria-invalid={!!liveSlotIssue}
                              aria-describedby={liveSlotIssue ? "book-time-issue" : "book-time-hint"}
                              className="mt-1.5 w-full border-white/15 bg-iron text-ink focus-visible:border-gold focus-visible:ring-gold/40 data-[placeholder]:text-inkmuted"
                            >
                              <SelectValue placeholder="Any time (we will confirm)" />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_SLOTS.map((slot) => {
                                const outside = !!slotIssue(slot);
                                return (
                                  <SelectItem key={slot} value={slot} disabled={outside}>
                                    {slot}
                                    {outside && (
                                      <span className="pl-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-inkmuted">
                                        — outside opening hours
                                      </span>
                                    )}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          {liveSlotIssue ? (
                            <p id="book-time-issue" role="alert" aria-live="polite" className="mt-1.5 text-xs font-medium text-destructive">
                              {liveSlotIssue}
                            </p>
                          ) : dayHours ? (
                            <p id="book-time-hint" aria-live="polite" className="mt-1.5 text-xs text-inkmuted">
                              Open {fmtMinutes(dayHours[0])} – {fmtMinutes(dayHours[1])} on the selected day. Slots outside these hours are unavailable.
                            </p>
                          ) : (
                            <p id="book-time-hint" className="mt-1.5 text-xs text-inkmuted">Optional — final slot is confirmed by phone.</p>
                          )}
                        </div>
                      </div>

                      {showHomeCollection && (
                        <div className="border border-white/10 bg-white/[0.03] p-4">
                          <label
                            htmlFor="book-homecollection"
                            className="flex cursor-pointer items-start gap-3 text-sm font-medium text-ink"
                          >
                            <Checkbox
                              id="book-homecollection"
                              checked={form.homeCollection}
                              onCheckedChange={(v) => set("homeCollection", v === true)}
                              className="mt-0.5"
                            />
                            <span>
                              Request home sample collection
                              {settings.homeCollectionAvailable === "tbc" && (
                                <span className="mt-1 block text-xs font-normal text-inkmuted">
                                  Subject to availability — our team will confirm.
                                </span>
                              )}
                            </span>
                          </label>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="book-message" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-steel">
                          Message
                        </Label>
                        <Textarea
                          id="book-message"
                          rows={4}
                          placeholder="Any details that help us prepare — e.g. doctor's reference, preferred language, questions about preparation."
                          value={form.message}
                          onChange={(e) => set("message", e.target.value)}
                          aria-invalid={!!errors.message}
                          aria-describedby={errors.message ? "book-message-error" : "book-message-hint"}
                          className="mt-1.5 border-white/15 bg-iron text-ink placeholder:text-inkmuted focus-visible:border-gold focus-visible:ring-gold/40"
                        />
                        <p id="book-message-hint" className="mt-1.5 text-xs text-inkmuted">
                          Optional. Please avoid sharing sensitive medical information here.
                        </p>
                        <FieldError id="book-message-error" message={errors.message} />
                      </div>

                      <div className="border border-white/10 bg-white/[0.03] p-4">
                        <label
                          htmlFor="book-consent"
                          className="flex cursor-pointer items-start gap-3 text-sm font-medium text-ink"
                        >
                          <Checkbox
                            id="book-consent"
                            checked={form.consent}
                            onCheckedChange={(v) => set("consent", v === true)}
                            aria-invalid={!!errors.consent}
                            aria-describedby={errors.consent ? "book-consent-error" : undefined}
                            className="mt-0.5"
                          />
                          <span>
                            I agree to be contacted by Crystal Diagnostic Centre regarding this request.{" "}
                            <span aria-hidden>*</span>
                          </span>
                        </label>
                        <FieldError id="book-consent-error" message={errors.consent} />
                      </div>

                      {/* Live request summary — aero-cut plate with gold corner ticks */}
                      {summaryTest && (
                        <div className="relative border border-white/10 bg-white/[0.03] p-4" aria-live="polite">
                          <span aria-hidden className="absolute left-0 top-0 h-2.5 w-2.5 border-l-2 border-t-2 border-gold" />
                          <span aria-hidden className="absolute right-0 top-0 h-2.5 w-2.5 border-r-2 border-t-2 border-gold" />
                          <span aria-hidden className="absolute bottom-0 left-0 h-2.5 w-2.5 border-b-2 border-l-2 border-gold" />
                          <span aria-hidden className="absolute bottom-0 right-0 h-2.5 w-2.5 border-b-2 border-r-2 border-gold" />
                          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold-text">
                            Your request at a glance
                          </p>
                          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px] sm:grid-cols-4">
                            <div>
                              <dt className="text-[9px] font-semibold uppercase tracking-[0.18em] text-steel">Test / Package</dt>
                              <dd className="mt-0.5 truncate font-semibold text-ink" title={summaryTest}>{summaryTest}</dd>
                            </div>
                            <div>
                              <dt className="text-[9px] font-semibold uppercase tracking-[0.18em] text-steel">Date</dt>
                              <dd className="mt-0.5 font-semibold text-ink">
                                {form.preferredDate
                                  ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(`${form.preferredDate}T12:00:00+05:30`))
                                  : "—"}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-[9px] font-semibold uppercase tracking-[0.18em] text-steel">Time</dt>
                              <dd className="mt-0.5 font-semibold text-ink">{form.preferredTime || "Any time"}</dd>
                            </div>
                            <div>
                              <dt className="text-[9px] font-semibold uppercase tracking-[0.18em] text-steel">Mode</dt>
                              <dd className="mt-0.5 font-semibold text-ink">{form.homeCollection ? "Home collection" : "Centre visit"}</dd>
                            </div>
                          </dl>
                        </div>
                      )}

                      <Button type="submit" size="lg" disabled={submitting} className="w-full">
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            Sending request…
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" aria-hidden />
                            Send Appointment Request
                          </>
                        )}
                      </Button>
                      <p className="text-xs leading-relaxed text-inkmuted">
                        This form sends a <strong>request</strong> only — slots are confirmed by our team over the
                        phone. No payment is collected online.
                      </p>
                    </form>
                  </CardContent>
                </Card>
              )}
            </Reveal>

            {/* ------------ Sidebar ------------ */}
            <div className="space-y-6">
              <Reveal delay={0.1}>
                <Card className="border-white/10 p-0">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-display text-[14px] uppercase tracking-wide text-ink">
                      Contact & visiting
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5 pt-0">
                    <div className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-4.5 w-4.5 shrink-0 text-teal" aria-hidden />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-steel">Phone</p>
                        <a
                          href={BUSINESS.phoneHref}
                          className="text-sm font-semibold text-ink transition-colors hover:text-gold"
                        >
                          {settings.phone || BUSINESS.phoneDisplay}
                        </a>
                      </div>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4.5 w-4.5 shrink-0 text-teal" aria-hidden />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-steel">Address</p>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{settings.address}</p>
                      </div>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-4.5 w-4.5 shrink-0 text-teal" aria-hidden />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-steel">Working Hours</p>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{settings.workingHours}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>

              <Reveal delay={0.15}>
                <Card className="border-white/10 bg-white/[0.03] p-0">
                  <CardContent className="flex items-start gap-3 p-5">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-ink">No online payment</p>
                      <p className="mt-1 text-xs leading-relaxed text-inkmuted">
                        Booking a test on this website is free. Payments, if applicable, are collected only at the
                        centre after your visit is confirmed.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
