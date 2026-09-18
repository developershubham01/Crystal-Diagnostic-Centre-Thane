"use client";

import { useEffect, useState } from "react";

/**
 * OPEN NOW / CLOSED NOW chip — computed live from the centre's visiting
 * hours in Asia/Kolkata (the centre's local time), so the badge is correct
 * regardless of the viewer's timezone. Hydration-safe: renders a static
 * placeholder on first paint and resolves after mount.
 *
 * Hours are indicative and mirror the footer / contact page:
 *   Mon–Sat 07:00–21:00 · Sun 07:00–13:00
 */

const TZ = "Asia/Kolkata";

interface LocalNow {
  day: number; // 0 = Sunday
  minutes: number; // minutes since midnight
}

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

/** [openMin, closeMin] per weekday — minutes since midnight. */
const HOURS: Record<number, [number, number]> = {
  0: [7 * 60, 13 * 60], // Sunday
  1: [7 * 60, 21 * 60],
  2: [7 * 60, 21 * 60],
  3: [7 * 60, 21 * 60],
  4: [7 * 60, 21 * 60],
  5: [7 * 60, 21 * 60],
  6: [7 * 60, 21 * 60], // Saturday
};

export function isOpenNow(now: LocalNow): boolean {
  const [open, close] = HOURS[now.day] ?? [0, 0];
  return now.minutes >= open && now.minutes < close;
}

/** Human string for the next opening, e.g. "Opens today 7:00 AM" / "Opens tomorrow 7:00 AM". */
function nextOpening(now: LocalNow): string {
  const fmt = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  };
  const [open] = HOURS[now.day] ?? [0, 0];
  if (now.minutes < open) return `Opens today ${fmt(open)}`;
  const nextDay = (now.day + 1) % 7;
  const [nextOpen] = HOURS[nextDay] ?? [0, 0];
  return nextDay === 0 ? `Opens tomorrow ${fmt(nextOpen)}` : `Opens tomorrow ${fmt(nextOpen)}`;
}

/**
 * Live status chip. OPEN → gold; CLOSED → muted white. Colour-only states.
 */
export function OpenNowBadge({ className = "" }: { className?: string }) {
  const [now, setNow] = useState<LocalNow | null>(null);

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

  const open = isOpenNow(now);
  return (
    <span
      className={`inline-flex items-center gap-2 border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
        open ? "border-gold/40 bg-gold/10 text-gold-text" : "border-white/20 bg-white/5 text-ash"
      } ${className}`}
      role="status"
      aria-label={open ? "The centre is open now" : `The centre is currently closed — ${nextOpening(now)}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 ${open ? "animate-pulse bg-gold" : "bg-white/40"}`} />
      {open ? "Open Now" : "Closed Now"}
    </span>
  );
}

/**
 * Indicative visiting-hours note (uppercase micro type).
 */
export function HoursNote({ className = "" }: { className?: string }) {
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-[0.16em] text-steel ${className}`}>
      Mon–Sat 7:00 AM – 9:00 PM · Sun 7:00 AM – 1:00 PM
    </span>
  );
}
