"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { LegalPageLayout, type LegalSection } from "./LegalPageLayout";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";

const sections: LegalSection[] = [
  {
    heading: "1. General Information Only",
    paragraphs: [
      "The content published on this website — including pages describing diagnostic services, health packages, preparation notes, timings and Frequently Asked Questions — is provided for general informational purposes only. It is intended to help you learn about the centre and prepare for a visit; it is not a substitute for professional medical consultation.",
    ],
  },
  {
    heading: "2. Not Medical Diagnosis or Treatment Advice",
    paragraphs: [
      "Nothing on this website constitutes medical diagnosis, treatment advice, or a recommendation about any particular test, medication or course of action for your health condition.",
      "Decisions about your health and about which tests are appropriate must be made together with a qualified doctor. Always follow the instructions of your treating doctor and confirm test-related details directly with the centre's staff.",
    ],
  },
  {
    heading: "3. Service Availability, Preparation and Pricing",
    paragraphs: [
      "Test availability, preparation requirements, report turnaround times and prices shown or referred to on this website may change, and some content is sample data pending verification by the centre.",
      "Please contact the diagnostic centre directly for current test availability, preparation requirements, pricing, and appointment confirmation before making any decision based on this website.",
    ],
  },
  {
    heading: "4. No Guarantee of Outcomes",
    paragraphs: [
      "Diagnostics involves many variables — sample quality, preparation, individual health conditions and clinical interpretation. This website makes no representations or warranties regarding test outcomes, report timelines, or the suitability of any service for your particular situation.",
    ],
  },
  {
    heading: "5. Contact the Centre",
    paragraphs: [
      "If anything on this website is unclear or appears out of date, please tell us — call the centre or speak to the front desk during your visit. Verified, up-to-date information will always come from the centre's staff, not from this website alone.",
    ],
  },
];

export function DisclaimerPage() {
  return (
    <div className="bg-card">
      <LegalPageLayout
        eyebrow="Legal"
        title="Disclaimer"
        description="Please read this disclaimer carefully before relying on any information published on this website."
        metaDescription="Disclaimer for the Crystal Diagnostic Centre website — informational content only, no medical diagnosis or treatment advice. Contact the centre for test availability, preparation, pricing and appointments."
        path="/disclaimer"
        crumbs={[{ label: "Disclaimer" }]}
        sections={sections}
      />

      {/* Verbatim medical disclaimer statement */}
      <div className="mx-auto max-w-3xl px-4 pb-14 sm:px-6 lg:px-8">
        <Reveal>
          <Alert className="border-white/10 border-l-2 border-l-gold bg-white/[0.03]">
            <Info className="h-4 w-4 text-teal" aria-hidden />
            <AlertTitle className="text-[12px] font-semibold uppercase tracking-[0.18em] text-ink">
              Official Disclaimer Statement
            </AlertTitle>
            <AlertDescription className="text-[13px] leading-relaxed text-inkmuted">
              {MEDICAL_DISCLAIMER}
            </AlertDescription>
          </Alert>
        </Reveal>
      </div>
    </div>
  );
}
