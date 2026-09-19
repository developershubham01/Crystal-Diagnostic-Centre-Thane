import { BUSINESS } from "./constants";

/**
 * Site settings model — stored as key/value pairs in the SiteSetting table.
 * `DEFAULT_SETTINGS` is the single source of truth for keys and fallback values.
 * All values are editable from the admin dashboard ("Website Content" tab).
 * Placeholder values use "To be confirmed" where the client has not yet verified data.
 */

export interface SiteSettings {
  businessName: string;
  tagline: string;
  heroHeadline: string;
  heroSubheadline: string;
  address: string;
  phone: string;
  email: string;
  emailNote: string;
  workingHours: string;
  workingHoursNote: string;
  whatsappNumber: string; // empty = hide WhatsApp button
  socialFacebook: string;
  socialInstagram: string;
  socialTwitter: string;
  socialLinkedin: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  aboutIntro: string;
  aboutMission: string;
  aboutVision: string;
  aboutPhilosophy: string;
  aboutFacilities: string; // newline separated
  aboutQuality: string; // newline separated
  whyChooseUs: string; // JSON array [{title, description}]
  homeServicesIntro: string;
  homePackagesIntro: string;
  homeTechHeading: string;
  homeTechBody: string;
  reportsNotice: string;
  bookTestNote: string;
  homeCollectionAvailable: string; // "yes" | "no" | "tbc"
  footerAbout: string;
  demoNotice: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  businessName: BUSINESS.name,
  tagline: "Your Health, Our Priority",
  heroHeadline: "Precision Diagnostics. Better Health Decisions.",
  heroSubheadline:
    "Explore diagnostic services, check available health packages, and request an appointment at Crystal Diagnostic Centre, Thane.",
  address: BUSINESS.addressLines.join("\n"),
  phone: BUSINESS.phoneDisplay,
  email: "info@crystaldiagnosticcentre.com",
  emailNote: "To be confirmed by the client",
  workingHours: "Monday – Saturday: 7:00 AM – 9:00 PM\nSunday: 7:00 AM – 1:00 PM",
  workingHoursNote: "To be confirmed by the centre",
  whatsappNumber: BUSINESS.whatsapp,
  socialFacebook: "",
  socialInstagram: "",
  socialTwitter: "",
  socialLinkedin: "",
  seoTitle: "Crystal Diagnostic Centre — Diagnostic Centre in Thane West | Uthalsar",
  seoDescription:
    "Crystal Diagnostic Centre in Uthalsar, Thane West offers diagnostic services, blood tests and preventive health packages. Request an appointment online or call +91 8828393955.",
  seoKeywords:
    "diagnostic centre in Thane, diagnostic centre near Uthalsar Naka, blood test services in Thane, diagnostic services in Thane West, health checkup Thane",
  aboutIntro:
    "Crystal Diagnostic Centre is a neighbourhood diagnostic facility located at Uthalsar Naka, Thane West, established with the aim of making quality diagnostic services accessible and convenient for the local community. (Editor's note: founding year and team details to be confirmed by the centre.)",
  aboutMission:
    "To provide timely, reliable and patient-friendly diagnostic services supported by careful sample handling and clear communication, so that patients and their doctors can make better health decisions.",
  aboutVision:
    "To be the most trusted diagnostic centre in Uthalsar and greater Thane — known for accuracy, transparency and genuine patient care.",
  aboutPhilosophy:
    "We believe diagnostics is a human service first. Every sample represents a person waiting for answers, so we focus on respectful service, honest guidance on test preparation, and timely reporting.",
  aboutFacilities:
    "Patient reception and waiting area\nSample collection room\nTie-up based radiology services (details to be confirmed)\nClean, accessible premises near Uthalsar Naka",
  aboutQuality:
    "Careful sample labelling and handling\nStandard operating procedures for collection\nReport verification before release (process details to be confirmed by the centre)",
  whyChooseUs:
    '[{"title":"Convenient Appointment Requests","description":"Request a test appointment online or over the phone and our team will confirm the details with you."},{"title":"Transparent Test Information","description":"Clear preparation instructions and test details so you arrive ready — no guesswork."},{"title":"Patient-Focused Service","description":"A caring front-desk team that treats every patient with patience and respect."},{"title":"Easy Location Access","description":"Located opposite Varad Hospital at Uthalsar Naka, easy to reach from across Thane West."}]',
  homeServicesIntro:
    "Browse our diagnostic service categories. Availability of individual tests is confirmed by the centre — contact us for the latest list.",
  homePackagesIntro:
    "Preventive health packages grouped for convenience. Package contents and prices shown are sample data pending confirmation by the centre.",
  homeTechHeading: "Science You Can Trust",
  homeTechBody:
    "Modern diagnostics is the combination of careful process, calibrated technology and skilled hands. This section illustrates the science behind laboratory testing — an abstract visualisation, not a depiction of specific equipment at the centre.",
  reportsNotice: "Online report access will be available soon.",
  bookTestNote:
    "This is an appointment request form. Our team will contact you on the provided number to confirm your slot, test details and any preparation requirements.",
  homeCollectionAvailable: "tbc", // yes | no | tbc
  footerAbout:
    "A neighbourhood diagnostic centre at Uthalsar Naka, Thane West — focused on accurate testing, transparent service and patient convenience.",
  demoNotice:
    "Demo preview — service names, package contents and prices shown are sample data pending verification by Crystal Diagnostic Centre.",
};

export const SETTINGS_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof SiteSettings)[];

export function parseSettings(rows: { key: string; value: string }[]): SiteSettings {
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const out = { ...DEFAULT_SETTINGS };
  for (const key of SETTINGS_KEYS) {
    const v = map.get(key);
    if (v !== undefined && v !== null) {
      (out as Record<string, string>)[key] = v;
    }
  }
  return out;
}

export interface WhyChooseItem {
  title: string;
  description: string;
}

export function parseWhyChooseUs(raw: string): WhyChooseItem[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((i) => i && typeof i.title === "string");
  } catch {
    // ignore
  }
  return [];
}
