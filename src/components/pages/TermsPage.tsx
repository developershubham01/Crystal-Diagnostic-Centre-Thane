"use client";

import { LegalPageLayout, type LegalSection } from "./LegalPageLayout";
import { BUSINESS } from "@/lib/constants";

const sections: LegalSection[] = [
  {
    heading: "1. Use of This Website",
    paragraphs: [
      "These Terms of Use govern your access to and use of this website, which is operated by Crystal Diagnostic Centre for general information about the centre, its diagnostic services and health packages, and for submitting appointment requests and enquiries.",
      "By accessing or using this website you agree to these terms. If you do not agree with any part of these terms, please discontinue use of the website.",
      "You agree to use the website only for lawful purposes: to learn about the centre and to make genuine enquiries or appointment requests. You must not misuse the website, attempt unauthorised access to its admin areas, interfere with its operation, or submit false, abusive or misleading information through its forms.",
    ],
  },
  {
    heading: "2. No Medical Advice",
    paragraphs: [
      "Content on this website — including service names, package descriptions, preparation notes and Frequently Asked Questions — is provided for general informational purposes only. It does not constitute medical advice, diagnosis, or treatment recommendations.",
      "Always seek the advice of a qualified doctor regarding any medical condition or before acting on any test-related information. Never disregard professional medical advice because of something you have read on this website. If you have an urgent health concern, contact a medical professional or emergency service immediately.",
    ],
  },
  {
    heading: "3. Appointment Requests Are Not Confirmed Bookings",
    paragraphs: [
      "Submitting the appointment request form on this website creates a request only — it is NOT a confirmed booking. A booking exists only after a member of the centre's staff contacts you (typically by phone) and explicitly confirms the test, date, time, preparation requirements and price.",
      "The centre reserves the right to confirm, reschedule or decline any request, and to update service availability, package contents and prices at any time. Information shown on the website, including sample data pending verification, may change without prior notice.",
    ],
  },
  {
    heading: "4. Intellectual Property",
    paragraphs: [
      "The name, logo, website design, text and other content on this website are the property of Crystal Diagnostic Centre or its licensors, and are protected by applicable intellectual-property laws.",
      "You may view and print pages from this website for your own personal, non-commercial use (for example, preparation instructions for your visit). You may not reproduce, republish, sell or redistribute website content, branding or imagery for commercial purposes without prior written permission.",
      "Representative and placeholder images used on this website remain the property of their respective sources and are used to illustrate the centre until actual photographs are published.",
    ],
  },
  {
    heading: "5. Limitation of Liability",
    paragraphs: [
      "The website is provided on an “as is” and “as available” basis. While we aim to keep the information accurate and up to date, the centre makes no warranties about the completeness, reliability or availability of the website or its content.",
      "To the fullest extent permitted by law, Crystal Diagnostic Centre shall not be liable for any loss or damage arising from the use of, or inability to use, this website or reliance on its content.",
    ],
  },
  {
    heading: "6. Third-Party Links and Services",
    paragraphs: [
      "This website may link to third-party services (for example, map directions provided by external mapping providers). These are provided for your convenience; the centre is not responsible for the content or availability of external websites.",
    ],
  },
  {
    heading: "7. Governing Law",
    paragraphs: [
      "These terms and any dispute arising from the use of this website shall be governed by and construed in accordance with the laws of India, and the courts at Thane, Maharashtra shall have exclusive jurisdiction.",
      `Questions about these terms may be directed to ${BUSINESS.name}, ${BUSINESS.addressLines.join(" ")} Phone: ${BUSINESS.phoneDisplay}.`,
      "These terms may be updated from time to time; the version published on this page applies at the time of your visit.",
    ],
  },
];

export function TermsPage() {
  return (
    <LegalPageLayout
      eyebrow="Legal"
      title="Terms of Use"
      description="The terms that apply when you use the Crystal Diagnostic Centre website and submit requests through it."
      metaDescription="Terms of Use for the Crystal Diagnostic Centre website — acceptable use, no medical advice, appointment requests vs confirmed bookings, intellectual property and governing law (India / Maharashtra)."
      path="/terms"
      crumbs={[{ label: "Terms of Use" }]}
      sections={sections}
    />
  );
}
