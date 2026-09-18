"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { usePageMeta } from "@/lib/seo";
import { useSettings } from "@/lib/hooks";
import { useRouterStore } from "@/lib/store";
import { BUSINESS } from "@/lib/constants";
import { Breadcrumbs, JsonLd, PageHero, breadcrumbSchema, type Crumb } from "@/components/site/Shared";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useToast } from "@/hooks/use-toast";

const CRUMBS: Crumb[] = [{ label: "Contact Us" }];

const SUBJECTS = ["General Enquiry", "Test Availability", "Reports", "Feedback", "Other"] as const;

interface FormState {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  consent: boolean;
  website: string; // honeypot
}

const INITIAL_FORM: FormState = {
  name: "",
  phone: "",
  email: "",
  subject: "",
  message: "",
  consent: false,
  website: "",
};

type FormErrors = Partial<Record<keyof FormState, string>>;

/** Normalise an Indian mobile number to bare 10 digits (accepts +91 / 91 / 0 prefixes). */
function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs font-medium text-destructive">
      {message}
    </p>
  );
}

export function ContactPage() {
  usePageMeta(
    "Contact Us",
    "Contact Crystal Diagnostic Centre, Uthalsar Naka, Thane West — phone, email, address, working hours and enquiry form.",
    "/contact"
  );
  const { toast } = useToast();
  const navigate = useRouterStore((s) => s.navigate);
  const { data: settings } = useSettings();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (form.name.trim().length < 2) errs.name = "Please enter your name.";
    const phone = normalisePhone(form.phone);
    if (!/^[6-9]\d{9}$/.test(phone)) errs.phone = "Enter a valid 10-digit Indian mobile number.";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Enter a valid email address (or leave it blank).";
    }
    if (form.message.trim().length < 5) errs.message = "Please enter your message.";
    if (!form.consent) errs.consent = "Please provide consent so we can respond to you.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    const errs = validate();
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      const first = Object.keys(errs).find((k) => errs[k as keyof FormErrors]);
      document.getElementById(`contact-${first}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/contact", {
        name: form.name.trim(),
        phone: normalisePhone(form.phone),
        email: form.email.trim() || undefined,
        subject: form.subject || undefined,
        message: form.message.trim(),
        consent: form.consent,
        website: form.website, // honeypot — always empty for humans
      });
      setSubmitted(true);
      toast({
        title: "Message sent",
        description: "Thanks for reaching out — we will get back to you soon.",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      setApiError(message);
      if (!(err instanceof ApiError && err.status === 429)) {
        toast({ title: "Could not send message", description: message, variant: "destructive" });
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
  }

  const whatsappHref = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`
    : null;

  return (
    <>
      <JsonLd data={breadcrumbSchema(CRUMBS)} />
      <PageHero
        eyebrow="Get in touch"
        title="Contact Us"
        description="Questions about a test, preparation, reports or visiting hours? Send us a message or drop by the centre — we are happy to help."
      >
        <div className="mt-6">
          <Breadcrumbs items={CRUMBS} />
        </div>
      </PageHero>

      <section className="bg-soft/40">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-5">
            {/* ------------ Form ------------ */}
            <Reveal className="lg:col-span-3">
              <Card className="border-white/10 p-0">
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-[15px] uppercase tracking-wide text-ink">Send an enquiry</CardTitle>
                  <p className="text-sm text-inkmuted">
                    Fields marked <span aria-hidden>*</span><span className="sr-only">asterisk</span> are required.
                  </p>
                </CardHeader>
                <CardContent className="p-5 pt-2 sm:p-6 sm:pt-2">
                  {submitted ? (
                    <div className="flex flex-col items-center gap-4 py-10 text-center">
                      <span className="hex flex h-16 w-16 items-center justify-center bg-gold/15" aria-hidden>
                        <CheckCircle2 className="h-9 w-9 text-gold" />
                      </span>
                      <h3 className="font-display text-xl uppercase tracking-tight text-ink">Thank you — your message has been sent.</h3>
                      <p className="max-w-md text-sm leading-relaxed text-inkmuted">
                        Our team will get back to you during working hours. For urgent queries, please call{" "}
                        <a href={BUSINESS.phoneHref} className="font-semibold text-gold hover:text-gold-text">
                          {BUSINESS.phoneDisplay}
                        </a>
                        .
                      </p>
                      <div className="mt-2 flex flex-wrap justify-center gap-3">
                        <Button variant="outline" onClick={() => navigate("#/")}>
                          Back to Home
                        </Button>
                        <Button onClick={resetForm}>Send Another Message</Button>
                      </div>
                    </div>
                  ) : (
                    <>
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
                          <label htmlFor="contact-website">Website</label>
                          <input
                            id="contact-website"
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
                            <Label htmlFor="contact-name" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-steel">
                              Name <span aria-hidden>*</span>
                            </Label>
                            <Input
                              id="contact-name"
                              type="text"
                              autoComplete="name"
                              placeholder="Your full name"
                              value={form.name}
                              onChange={(e) => set("name", e.target.value)}
                              aria-invalid={!!errors.name}
                              aria-describedby={errors.name ? "contact-name-error" : undefined}
                              className="mt-1.5 border-white/15 bg-iron text-ink placeholder:text-inkmuted focus-visible:border-gold focus-visible:ring-gold/40"
                            />
                            <FieldError id="contact-name-error" message={errors.name} />
                          </div>

                          <div>
                            <Label htmlFor="contact-phone" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-steel">
                              Phone <span aria-hidden>*</span>
                            </Label>
                            <div className="mt-1.5 flex items-stretch gap-2">
                              <span className="inline-flex select-none items-center border border-white/15 bg-iron px-3 text-sm font-semibold text-ink">
                                +91
                              </span>
                              <Input
                                id="contact-phone"
                                type="tel"
                                inputMode="numeric"
                                autoComplete="tel-national"
                                placeholder="98765 43210"
                                value={form.phone}
                                onChange={(e) => set("phone", e.target.value)}
                                aria-invalid={!!errors.phone}
                                aria-describedby={errors.phone ? "contact-phone-error" : undefined}
                                className="border-white/15 bg-iron text-ink placeholder:text-inkmuted focus-visible:border-gold focus-visible:ring-gold/40"
                              />
                            </div>
                            <FieldError id="contact-phone-error" message={errors.phone} />
                          </div>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                          <div>
                            <Label htmlFor="contact-email" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-steel">
                              Email (optional)
                            </Label>
                            <Input
                              id="contact-email"
                              type="email"
                              autoComplete="email"
                              placeholder="you@example.com"
                              value={form.email}
                              onChange={(e) => set("email", e.target.value)}
                              aria-invalid={!!errors.email}
                              aria-describedby={errors.email ? "contact-email-error" : undefined}
                              className="mt-1.5 border-white/15 bg-iron text-ink placeholder:text-inkmuted focus-visible:border-gold focus-visible:ring-gold/40"
                            />
                            <FieldError id="contact-email-error" message={errors.email} />
                          </div>
                          <div>
                            <Label htmlFor="contact-subject" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-steel">
                              Subject
                            </Label>
                            <Select value={form.subject} onValueChange={(v) => set("subject", v)}>
                              <SelectTrigger
                                id="contact-subject"
                                className="mt-1.5 w-full border-white/15 bg-iron text-ink focus-visible:border-gold focus-visible:ring-gold/40 data-[placeholder]:text-inkmuted"
                              >
                                <SelectValue placeholder="Choose a topic (optional)" />
                              </SelectTrigger>
                              <SelectContent>
                                {SUBJECTS.map((s) => (
                                  <SelectItem key={s} value={s}>
                                    {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="contact-message" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-steel">
                            Message <span aria-hidden>*</span>
                          </Label>
                          <Textarea
                            id="contact-message"
                            rows={5}
                            placeholder="How can we help?"
                            value={form.message}
                            onChange={(e) => set("message", e.target.value)}
                            aria-invalid={!!errors.message}
                            aria-describedby={errors.message ? "contact-message-error" : undefined}
                            className="mt-1.5 border-white/15 bg-iron text-ink placeholder:text-inkmuted focus-visible:border-gold focus-visible:ring-gold/40"
                          />
                          <FieldError id="contact-message-error" message={errors.message} />
                        </div>

                        <div className="border border-white/10 bg-white/[0.03] p-4">
                          <label
                            htmlFor="contact-consent"
                            className="flex cursor-pointer items-start gap-3 text-sm font-medium text-ink"
                          >
                            <Checkbox
                              id="contact-consent"
                              checked={form.consent}
                              onCheckedChange={(v) => set("consent", v === true)}
                              aria-invalid={!!errors.consent}
                              aria-describedby={errors.consent ? "contact-consent-error" : undefined}
                              className="mt-0.5"
                            />
                            <span>
                              I agree to be contacted by Crystal Diagnostic Centre regarding this enquiry.{" "}
                              <span aria-hidden>*</span>
                            </span>
                          </label>
                          <FieldError id="contact-consent-error" message={errors.consent} />
                        </div>

                        <Button type="submit" size="lg" disabled={submitting} className="w-full">
                          {submitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                              Sending…
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" aria-hidden />
                              Send Message
                            </>
                          )}
                        </Button>
                      </form>
                    </>
                  )}
                </CardContent>
              </Card>
            </Reveal>

            {/* ------------ Info stack ------------ */}
            <div className="space-y-6 lg:col-span-2">
              <Reveal delay={0.05}>
                <Card className="border-white/10 p-0">
                  <CardContent className="flex items-start gap-3 p-5">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Visit the Centre</p>
                      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink">{settings.address}</p>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>

              <Reveal delay={0.08}>
                <Card className="border-white/10 p-0">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden />
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Call us</p>
                        <a
                          href={BUSINESS.phoneHref}
                          className="mt-1.5 block text-sm font-semibold text-ink transition-colors hover:text-gold"
                        >
                          {settings.phone || BUSINESS.phoneDisplay}
                        </a>
                      </div>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="flex items-start gap-3">
                      <Mail className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden />
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Email</p>
                        <a
                          href={`mailto:${settings.email}`}
                          className="mt-1.5 block text-sm font-semibold text-ink transition-colors hover:text-gold"
                        >
                          {settings.email}
                        </a>
                        <p className="mt-0.5 text-xs text-inkmuted">{settings.emailNote}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>

              <Reveal delay={0.11}>
                <Card className="border-white/10 p-0">
                  <CardContent className="flex items-start gap-3 p-5">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Working Hours</p>
                      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink">
                        {settings.workingHours}
                      </p>
                      <p className="mt-1 text-xs text-inkmuted">{settings.workingHoursNote}</p>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>

              {whatsappHref && (
                <Reveal delay={0.14}>
                  <Card className="border-white/10 bg-card p-0">
                    <CardContent className="p-5">
                      <Button asChild size="lg" variant="outline" className="w-full">
                        <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-4 w-4" aria-hidden />
                          Chat on WhatsApp
                        </a>
                      </Button>
                      <p className="mt-2 text-center text-xs text-inkmuted">
                        Opens WhatsApp in a new tab — replies during working hours.
                      </p>
                    </CardContent>
                  </Card>
                </Reveal>
              )}
            </div>
          </div>

          {/* ------------ Map ------------ */}
          <Reveal delay={0.06}>
            <div className="mt-10">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-[16px] uppercase tracking-wide text-ink">Find us at Uthalsar Naka</h2>
                <Button asChild variant="outline">
                  <a href={BUSINESS.mapsDirections} target="_blank" rel="noopener noreferrer">
                    <MapPin className="h-4 w-4" aria-hidden />
                    Get Directions
                  </a>
                </Button>
              </div>
              <div className="overflow-hidden border border-white/10">
                <iframe
                  src={BUSINESS.mapsEmbed}
                  title="Map showing Crystal Diagnostic Centre, Uthalsar Naka, Thane West"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-80 w-full border-0"
                  allowFullScreen
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
