"use client";

import { useEffect, useMemo, useState } from "react";
import { useSettings } from "@/lib/hooks";
import { DEFAULT_SETTINGS } from "@/lib/settings";

/**
 * OPEN NOW / CLOSED NOW chip — computed live from the centre's visiting
 * hours in Asia/Kolkata (the centre's local time), so the badge is correct
 * regardless of the viewer's timezone. Hydration-safe: renders a static
 * placeholder on first paint and resolves after mount.
 *
 * Hours are parsed from the admin-editable `workingHours` SiteSetting
 * (e.g. "Monday – Saturday: 7:00 AM – 9:00 PM"), so the front desk can
 * update them from the dashboard without a code change. If the text is
 * missing or unparseable, the documented defaults are used.
 */

const TZ = "Asia/Kolkata";

interface LocalNow {
  day: number; // 0 = Sunday
  minutes: number; // minutes since midnight
}

export type WeekHours = Record<number, [number, number]>; // [openMin, closeMin]

const DEFAULT_HOURS: WeekHours = {
  0: [7 * 60, 13 * 60], // Sunday
  1: [7 * 60, 21 * 60],
  2: [7 * 60, 21 * 60],
  3: [7 * 60, 21 * 60],
  4: [7 * 60, 21 * 60],
  5: [7 * 60, 21 * 60],
  6: [7 * 60, 21 * 60], // Saturday
};

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function localNow(): LocalNow {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: TZ,
    hour12: false,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const day = dayMap[get("weekday")] ?? 0;
  const hour = parseInt(get("hour"), 10) % 24;
  const minute = parseInt(get("minute"), 10);
  return { day, minutes: hour * 60 + minute };
}

/** "7:00 AM" → 420 · "19:30" → 1170 · null when unparseable. */
function parseClock(token: string): number | null {
  const m = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i.exec(token.trim());
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const minute = m[2] ? parseInt(m[2], 10) : 0;
  if (Number.isNaN(hour) || hour > 23 || minute > 59) return null;
  const meridiem = m[3]?.toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return hour * 60 + minute;
}

/**
 * Parses multi-line visiting-hours text into a per-weekday map.
 * Understands single days ("Sunday: …") and dash ranges
 * ("Monday – Saturday: 7:00 AM – 9:00 PM") with en/em/hyphen dashes.
 * Returns null when nothing usable is found (caller applies defaults).
 */
export function parseWorkingHours(raw: string | undefined | null): WeekHours | null {
  if (!raw) return null;
  const map: WeekHours = {};
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    // Split the day part from the clock range on the first colon.
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const dayPart = line.slice(0, colonIdx);
    const timePart = line.slice(colonIdx + 1);

    // Day names mentioned on the left side — full names or 3-letter forms.
    const days = DAY_NAMES.map((name, idx) =>
      dayPart.toLowerCase().includes(name) || dayPart.toLowerCase().includes(name.slice(0, 3)) ? idx : -1
    ).filter((d) => d >= 0);
    if (days.length === 0) continue;
    // If two day names separated by a dash → treat as a contiguous range.
    let covered: number[] = days;
    if (days.length === 2 && /[-–—]/.test(dayPart)) {
      const [a, b] = days;
      covered = [];
      for (let d = a; d !== b; d = (d + 1) % 7) covered.push(d);
      covered.push(b);
    }

    // Clock range: exactly two clock tokens separated by a dash.
    const clockMatch = timePart.match(
      /(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*[-–—]\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)/i
    );
    if (!clockMatch) continue;
    const open = parseClock(clockMatch[1]);
    const close = parseClock(clockMatch[2]);
    if (open === null || close === null || close <= open) continue;
    for (const d of covered) map[d] = [open, close];
  }
  return Object.keys(map).length > 0 ? map : null;
}

export function isOpenNow(now: LocalNow, hours: WeekHours = DEFAULT_HOURS): boolean {
  const [open, close] = hours[now.day] ?? [0, 0];
  return now.minutes >= open && now.minutes < close;
}

/** Human string for the next opening, e.g. "Opens today 7:00 AM" / "Opens tomorrow 7:00 AM". */
function nextOpening(now: LocalNow, hours: WeekHours): string {
  const fmt = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  };
  const [open] = hours[now.day] ?? [0, 0];
  if (now.minutes < open) return `Opens today ${fmt(open)}`;
  const nextDay = (now.day + 1) % 7;
  const [nextOpen] = hours[nextDay] ?? [0, 0];
  return `Opens tomorrow ${fmt(nextOpen)}`;
}

/**
 * Live status chip. OPEN → gold; CLOSED → muted white. Colour-only states.
 */
export function OpenNowBadge({ className = "" }: { className?: string }) {
  const { data: settings } = useSettings();
  const [now, setNow] = useState<LocalNow | null>(null);

  // Hours from the admin-editable setting; defaults while loading/unparseable.
  const hours = useMemo(
    () => parseWorkingHours(settings?.workingHours ?? DEFAULT_SETTINGS.workingHours) ?? DEFAULT_HOURS,
    [settings?.workingHours]
  );

  // Adjust state during render (React-recommended) so the clock resolves
  // immediately after hydration without setState-in-effect.
  if (now === null) {
    setNow(localNow());
  }

  useEffect(() => {
    const t = setInterval(() => setNow(localNow()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!now) {
    // Hydration-safe placeholder bar
    return (
      <span
        className={`inline-block h-[22px] w-24 animate-pulse bg-white/10 ${className}`}
        aria-hidden
      />
    );
  }

  const open = isOpenNow(now, hours);
  return (
    <span
      className={`inline-flex items-center gap-2 border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
        open ? "border-gold/40 bg-gold/10 text-gold-text" : "border-white/20 bg-white/5 text-ash"
      } ${className}`}
      role="status"
      aria-label={open ? "The centre is open now" : `The centre is currently closed — ${nextOpening(now, hours)}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 ${open ? "animate-pulse bg-gold" : "bg-white/40"}`} />
      {open ? "Open Now" : "Closed Now"}
    </span>
  );
}

/**
 * Indicative visiting-hours note (uppercase micro type). Pass the
 * admin-editable `settings.workingHours` when available.
 */
export function HoursNote({ text, className = "" }: { text?: string; className?: string }) {
  const { data: settings } = useSettings();
  const source = text ?? settings?.workingHours ?? DEFAULT_SETTINGS.workingHours;
  const compact = source.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).join(" · ");
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-[0.16em] text-steel ${className}`}>
      {compact}
    </span>
  );
}
