"use client";

import { LegalPageLayout, type LegalSection } from "./LegalPageLayout";
import { BUSINESS } from "@/lib/constants";

const sections: LegalSection[] = [
  {
    heading: "1. Introduction",
    paragraphs: [
      "This Privacy Policy describes how Crystal Diagnostic Centre (referred to as “the centre”, “we”, “us” or “our”) handles information submitted through this website. We respect your privacy and are committed to handling your personal information responsibly and transparently.",
      "By using this website and submitting information through it, you agree to the practices described in this policy. If you do not agree, please do not use the website forms; you may instead contact the centre directly by phone or in person.",
    ],
  },
  {
    heading: "2. Information We Collect",
    paragraphs: [
      "We only collect information that you choose to provide to us through this website. This may include:",
    ],
    bullets: [
      "Your name and mobile number, when you submit an appointment request or contact message.",
      "Your email address, if you choose to provide it.",
      "Details of the test or health package you are enquiring about, along with any preferred date, time, home-collection preference and message you include.",
      "Your consent confirmation, recorded when you submit a form.",
      "Basic technical logs (such as time of submission) kept for operational and security purposes.",
    ],
  },
  {
    heading: "3. How We Use Your Information",
    paragraphs: [
      "Information submitted through this website is used solely to contact you about your request — for example, to confirm an appointment slot, share preparation instructions, clarify test details, or respond to your enquiry.",
      "We do not sell, rent or trade your personal information to any third party. We do not use your details for unrelated marketing without your explicit consent.",
    ],
  },
  {
    heading: "4. Consent",
    paragraphs: [
      "Each form on this website includes a consent checkbox. Your information is processed only after you tick that checkbox and submit the form, indicating that you permit the centre to contact you about the request you have made.",
      "You may withdraw consent or request removal of your details at any time using the contact details below, subject to any records the centre is required to maintain for legitimate operational purposes.",
    ],
  },
  {
    heading: "5. Data Retention",
    paragraphs: [
      "Appointment requests and contact messages are retained only for as long as needed to handle your request and for reasonable record-keeping by the centre. Information that is no longer required may be deleted periodically.",
      "The exact retention period is to be confirmed by the centre; if you have a question about a specific submission, please contact us.",
    ],
  },
  {
    heading: "6. Cookies",
    paragraphs: [
      "This website does not use advertising or tracking cookies. A single session cookie is used strictly for the centre's own staff admin login — it stores a signed login session so authorised staff can manage website content. This cookie is not set for ordinary visitors browsing the public pages.",
    ],
  },
  {
    heading: "7. Data Security",
    paragraphs: [
      "Reasonable technical measures are in place to protect the information submitted through this website, including access controls on the admin dashboard. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security of information sent through online forms.",
      "Please do not include highly sensitive medical details in website forms. Share such information directly with the centre's staff when you visit or over the phone.",
    ],
  },
  {
    heading: "8. Your Choices and Contact",
    paragraphs: [
      "You may ask us to access, correct or delete the personal information you submitted through this website by contacting the centre using the details below. We will respond to reasonable requests as promptly as we can.",
      `Privacy requests: ${BUSINESS.name}, ${BUSINESS.addressLines.join(" ")} Phone: ${BUSINESS.phoneDisplay}.`,
      "This policy may be updated from time to time. Any changes will be published on this page.",
    ],
  },
];

export function PrivacyPage() {
  return (
    <LegalPageLayout
      eyebrow="Legal"
      title="Privacy Policy"
      description="How Crystal Diagnostic Centre collects, uses and protects information submitted through this website."
      metaDescription="Privacy Policy of Crystal Diagnostic Centre, Thane West — what information the website collects, how it is used, consent, retention and how to contact us for privacy requests."
      path="/privacy"
      crumbs={[{ label: "Privacy Policy" }]}
      sections={sections}
    />
  );
}
