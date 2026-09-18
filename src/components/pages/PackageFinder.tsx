"use client";

import { useMemo, useState } from "react";
import { ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { useRouterStore } from "@/lib/store";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { formatPrice } from "./PageStates";
import type { PackageDTO } from "@/lib/api-client";

/**
 * PACKAGE FINDER — a 3-step guided quiz that scores the centre's published
 * packages against the visitor's answers and recommends the best match.
 * Purely client-side over the existing packages data; suggestions are
 * clearly marked as indicative (demo-honesty rule).
 */

interface Question {
  id: string;
  label: string;
  options: { value: string; label: string; keywords: string[]; bonus: number }[];
}

const QUESTIONS: Question[] = [
  {
    id: "goal",
    label: "What brings you here?",
    options: [
      { value: "general", label: "General health check-up", keywords: ["full body", "master", "comprehensive"], bonus: 2 },
      { value: "concern", label: "A specific health concern", keywords: ["diabetes", "thyroid", "liver", "kidney"], bonus: 2 },
      { value: "doctor", label: "Doctor advised tests", keywords: ["full body", "diabetes", "lipid"], bonus: 1 },
      { value: "preventive", label: "Preventive full-body screening", keywords: ["full body", "comprehensive", "master"], bonus: 3 },
    ],
  },
  {
    id: "who",
    label: "Who is it for?",
    options: [
      { value: "adult", label: "Myself (adult)", keywords: [], bonus: 0 },
      { value: "senior", label: "A senior family member", keywords: ["full body", "master", "comprehensive", "cardiac", "diabetes"], bonus: 2 },
      { value: "family", label: "Multiple family members", keywords: ["full body", "master"], bonus: 1 },
    ],
  },
  {
    id: "when",
    label: "How soon, and how often?",
    options: [
      { value: "soon", label: "This week — need it soon", keywords: ["full body", "diabetes"], bonus: 1 },
      { value: "research", label: "Just researching for now", keywords: [], bonus: 0 },
      { value: "monitor", label: "Monitoring an existing condition", keywords: ["diabetes", "thyroid", "kidney", "liver"], bonus: 3 },
    ],
  },
];

function scorePackage(pkg: PackageDTO, answers: Record<string, string>): number {
  let score = pkg.featured ? 1 : 0;
  const haystack = [
    pkg.name,
    pkg.description ?? "",
    pkg.detailedDescription ?? "",
    ...pkg.tests.map((t) => t.name),
  ]
    .join(" ")
    .toLowerCase();

  for (const q of QUESTIONS) {
    const choice = q.options.find((o) => o.value === answers[q.id]);
    if (!choice) continue;
    score += choice.bonus;
    for (const kw of choice.keywords) {
      if (haystack.includes(kw)) score += 3;
    }
  }
  return score;
}

export function PackageFinder({ packages }: { packages: PackageDTO[] }) {
  const navigate = useRouterStore((s) => s.navigate);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const done = step >= QUESTIONS.length;
  const recommendation = useMemo(() => {
    if (!done || packages.length === 0) return null;
    const ranked = [...packages].sort((a, b) => scorePackage(b, answers) - scorePackage(a, answers));
    return ranked[0];
  }, [done, packages, answers]);

  function choose(qid: string, value: string) {
    setAnswers((a) => ({ ...a, [qid]: value }));
    setStep((s) => s + 1);
  }

  function restart() {
    setAnswers({});
    setStep(0);
  }

  return (
    <Reveal>
      <section className="border border-white/10 bg-card" aria-label="Package finder quiz">
        <div className="border-b border-white/10 bg-secondary px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 font-display text-sm uppercase tracking-wide text-ink">
              <Sparkles className="h-4 w-4 text-gold" aria-hidden />
              Package Finder
            </p>
            {/* Step progress — three sharp bars */}
            <div className="flex items-center gap-1.5" aria-hidden>
              {QUESTIONS.map((_, i) => (
                <span
                  key={i}
                  className={`h-0.5 w-10 ${i < step ? "bg-gold" : i === step ? "animate-pulse bg-gold/60" : "bg-white/10"}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {!done && (
            <div role="group" aria-labelledby={`finder-q-${QUESTIONS[step].id}`}>
              <p id={`finder-q-${QUESTIONS[step].id}`} className="eyebrow">
                Question {step + 1} of {QUESTIONS.length}
              </p>
              <p className="mt-2 font-display text-lg uppercase tracking-tight text-ink sm:text-xl">
                {QUESTIONS[step].label}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {QUESTIONS[step].options.map((opt) => {
                  const selected = answers[QUESTIONS[step].id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => choose(QUESTIONS[step].id, opt.value)}
                      className={`border bg-white/[0.03] px-4 py-3.5 text-left text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                        selected
                          ? "border-gold bg-gold/10 text-gold-text"
                          : "border-white/15 text-white/80 hover:border-gold/50 hover:text-gold"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-ash transition-colors hover:text-gold"
                >
                  ← Back
                </button>
              )}
            </div>
          )}

          {done && recommendation && (
            <div>
              <p className="eyebrow">Recommended for you</p>
              <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-xl uppercase tracking-tight text-ink sm:text-2xl">
                    {recommendation.name}
                  </h3>
                  {recommendation.description && (
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-inkmuted">{recommendation.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="metal-badge">{recommendation.tests.length} tests included</span>
                    <span className="font-display text-lg text-ink">
                      {formatPrice(recommendation.price, recommendation.priceVisible)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => navigate(`#/packages/${recommendation.slug}`)}>
                  View Package
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
                <Button variant="outline" onClick={restart}>
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  Restart
                </Button>
              </div>
            </div>
          )}

          {done && !recommendation && (
            <div>
              <p className="text-sm text-inkmuted">
                No packages matched this combination — you can still browse the full list below or request any test
                directly.
              </p>
              <Button variant="outline" className="mt-4" onClick={restart}>
                <RotateCcw className="h-4 w-4" aria-hidden />
                Restart
              </Button>
            </div>
          )}

          <p className="mt-6 border-t border-white/5 pt-4 text-[10px] uppercase tracking-[0.16em] text-steel">
            Suggestions are indicative — our team will confirm the right tests for you.
          </p>
        </div>
      </section>
    </Reveal>
  );
}
