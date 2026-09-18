import { BUSINESS } from "./constants";

/**
 * Add-to-Calendar (.ics) support for scheduled appointments.
 *
 * Produces a standards-compliant VCALENDAR (RFC 5545) with CRLF endings,
 * 75-octet line folding, TEXT escaping and a 2-hour display reminder.
 * Times are converted to UTC using India's fixed +05:30 offset (no DST),
 * so the event is correct in every calendar client without a VTIMEZONE.
 *
 * Time input is deliberately tolerant — the booking form stores broad
 * windows ("Morning (7:00 AM – 11:00 AM)"), while front-desk staff may
 * store exact times ("7:30 AM" / "19:30") in the same field:
 *   - two times found  → event spans that window
 *   - one time found   → 60-minute event starting at that time
 *   - nothing parseable (or no time at all) → all-day event on the date
 */

export interface AppointmentIcsInput {
  reference: string;
  patientName: string;
  testOrPackage: string;
  preferredDate: string; // "YYYY-MM-DD" or parseable date string
  preferredTime: string | null; // free text, may be a window
  trackUrl: string;
}

const IST_OFFSET_MIN = 5 * 60 + 30; // India is UTC+05:30 year-round

/** "7:00 AM" → 420 · "19:30" → 1170 · null when unparseable. */
function parseTimeToMinutes(raw: string): number | null {
  const m = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i.exec(raw.trim());
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const minute = m[2] ? parseInt(m[2], 10) : 0;
  if (Number.isNaN(hour) || minute > 59 || hour > 23) return null;
  const meridiem = m[3]?.toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return hour * 60 + minute;
}

/** Extracts the start/end minutes of the visit from free-text time. */
function resolveWindow(timeText: string | null): { start: number; end: number } | null {
  if (!timeText) return null;
  const matches = [...timeText.matchAll(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/gi)];
  const times = matches.map((m) => parseTimeToMinutes(m[0])).filter((v): v is number => v !== null);
  if (times.length >= 2) {
    const [a, b] = times;
    return a <= b ? { start: a, end: b } : { start: a, end: Math.min(a + 60, 23 * 60 + 59) };
  }
  if (times.length === 1) return { start: times[0], end: times[0] + 60 };
  return null;
}

/** ICS TEXT escaping per RFC 5545 §3.3.11. */
function esc(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Folds content lines longer than 75 octets (RFC 5545 §3.1). */
function fold(line: string): string[] {
  if (line.length <= 75) return [line];
  const parts: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 0) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  return parts;
}

/** "2026-09-20" + minutes-since-midnight IST → UTC "YYYYMMDDTHHMMSSZ". */
function utcStamp(dateISO: string, minutes: number): string {
  const [y, m, d] = dateISO.split("-").map((n) => parseInt(n, 10));
  const totalUtcMin = minutes - IST_OFFSET_MIN;
  const dayShift = Math.floor(totalUtcMin / 1440);
  const norm = ((totalUtcMin % 1440) + 1440) % 1440;
  const base = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + dayShift, Math.floor(norm / 60), norm % 60));
  const p = (n: number, len = 2) => String(n).padStart(len, "0");
  return `${base.getUTCFullYear()}${p(base.getUTCMonth() + 1)}${p(base.getUTCDate())}T${p(base.getUTCHours())}${p(base.getUTCMinutes())}00Z`;
}

/** "2026-09-20" → compact "20260920" (all-day DATE value). */
function compactDate(dateISO: string): string {
  return dateISO.replaceAll("-", "");
}

/** Next day in compact form, for all-day DTEND (exclusive). */
function nextCompactDate(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + 1));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${dt.getUTCFullYear()}${p(dt.getUTCMonth() + 1)}${p(dt.getUTCDate())}`;
}

/** Builds the full ICS document for an appointment visit. */
export function buildAppointmentIcs(input: AppointmentIcsInput): string {
  const { reference, patientName, testOrPackage, preferredDate, preferredTime, trackUrl } = input;
  const dateISO = preferredDate.slice(0, 10);
  const window_ = resolveWindow(preferredTime);

  const summary = `${BUSINESS.name} — ${testOrPackage}`;
  const descriptionLines = [
    `Appointment reference: ${reference}`,
    `Booked for: ${patientName}`,
    window_
      ? "Please arrive 10 minutes early with any previous reports and your doctor's prescription."
      : "The exact time will be confirmed by our team — please keep the morning flexible or call us.",
    `Track this request: ${trackUrl}`,
    `Phone: ${BUSINESS.phoneDisplay}`,
  ].join("\n");

  const location = `${BUSINESS.name}, ${BUSINESS.addressLines.join(" ")}`;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Crystal Diagnostic Centre//Appointment//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${reference.replace(/[^A-Za-z0-9-]/g, "")}@crystaldiagnosticcentre.com`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
  ];

  if (window_) {
    lines.push(`DTSTART:${utcStamp(dateISO, window_.start)}`);
    lines.push(`DTEND:${utcStamp(dateISO, window_.end)}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${compactDate(dateISO)}`);
    lines.push(`DTEND;VALUE=DATE:${nextCompactDate(dateISO)}`);
  }

  lines.push(
    `SUMMARY:${esc(summary)}`,
    `DESCRIPTION:${esc(descriptionLines)}`,
    `LOCATION:${esc(location)}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(`Reminder: ${summary}`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  );

  return lines.flatMap(fold).join("\r\n") + "\r\n";
}

/** Triggers a client-side download of an ICS document. */
export function downloadAppointmentIcs(input: AppointmentIcsInput): void {
  const ics = buildAppointmentIcs(input);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `crystal-appointment-${input.reference.replace(/[^A-Za-z0-9-]/g, "")}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}
