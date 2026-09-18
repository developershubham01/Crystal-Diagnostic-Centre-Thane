"use client";

import { MapPin } from "lucide-react";
import { useTestimonials } from "@/lib/hooks";
import { Reveal } from "@/components/site/Reveal";
import { StarRating } from "@/components/site/StarRating";

/**
 * TestimonialsSection — shared "What patients say" band, fed by the
 * admin-manageable Testimonial rows (published only). Used on the Home and
 * About pages; hides itself entirely when no published testimonials exist.
 */
export function TestimonialsSection() {
  const { data: testimonials = [] } = useTestimonials();

  if (testimonials.length === 0) return null;

  return (
    <section
      className="section-divider border-t border-[#202020] bg-soft py-16 sm:py-24"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <p className="eyebrow">Patient Voices</p>
          <h2 id="testimonials-heading" className="display-caps mt-3 text-3xl text-ink sm:text-4xl">
            What patients say
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-inkmuted">
            Feedback from people who visited the centre — collected at the front desk and over the phone.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.slice(0, 6).map((t, i) => (
            <Reveal key={t.id} delay={(i % 3) * 0.08}>
              <figure className="group relative flex h-full flex-col border border-white/10 bg-white/[0.03] p-6 transition-colors duration-300 hover:border-gold/40 hover:bg-white/[0.05]">
                <span
                  aria-hidden
                  className="pointer-events-none absolute right-5 top-4 font-brand text-6xl leading-none text-gold/10 transition-colors duration-300 group-hover:text-gold/20"
                >
                  &rdquo;
                </span>
                <StarRating rating={t.rating} className="relative" />
                <blockquote className="relative mt-4 flex-1 text-[14px] leading-relaxed text-white/80">
                  {t.text}
                </blockquote>
                <figcaption className="relative mt-6 border-t border-white/10 pt-4">
                  <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-ink">{t.name}</p>
                  {t.area && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-steel">
                      <MapPin className="h-3 w-3 text-gold/70" aria-hidden />
                      {t.area}
                    </p>
                  )}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-steel">
          Sample feedback shown for preview — real patient reviews will replace these before launch.
        </p>
      </div>
    </section>
  );
}
