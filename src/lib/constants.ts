/**
 * Verified business information for Crystal Diagnostic Centre.
 * Only the details provided by the client are hard-coded here.
 * Everything else lives in SiteSetting (editable from the admin dashboard).
 */

export const BUSINESS = {
  name: "Crystal Diagnostic Centre",
  category: "Diagnostic Centre — Medical Testing & Diagnostic Services",
  phoneDisplay: "+91 8828393955",
  phoneHref: "tel:+918828393955",
  whatsapp: "918828393955",
  addressLines: [
    "1,2, Shrikrishna Bhavan CHS,",
    "Opposite Varad Hospital, Uthalsar Naka,",
    "Uthalsar, Thane West, Thane,",
    "Maharashtra — 400601, India.",
  ],
  addressShort: "Uthalsar, Thane West, Thane",
  mapsQuery: "Crystal+Diagnostic+Centre+Uthalsar+Naka+Thane+West",
  mapsEmbed:
    "https://www.google.com/maps?q=Crystal%20Diagnostic%20Centre%2C%20Uthalsar%20Naka%2C%20Thane%20West%2C%20Maharashtra%20400601&output=embed",
  mapsDirections:
    "https://www.google.com/maps/dir/?api=1&destination=Crystal%20Diagnostic%20Centre%2C%20Uthalsar%20Naka%2C%20Thane%20West%2C%20Maharashtra%20400601",
} as const;

export const APPOINTMENT_STATUSES = ["NEW", "CONTACTED", "SCHEDULED", "COMPLETED", "CANCELLED"] as const;
export const MESSAGE_STATUSES = ["NEW", "CONTACTED", "COMPLETED", "CANCELLED"] as const;

export const GALLERY_CATEGORIES = ["Centre", "Reception", "Facilities", "Equipment", "Staff", "Other"] as const;

export const MEDICAL_DISCLAIMER =
  "Information on this website is for general informational purposes only. Please contact the diagnostic centre for test availability, preparation requirements, pricing, and appointment confirmation. This website does not provide medical diagnosis or treatment advice.";
