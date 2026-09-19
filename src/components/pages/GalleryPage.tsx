"use client";

import { useMemo, useState } from "react";
import { Camera } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { Breadcrumbs, JsonLd, PageHero, breadcrumbSchema } from "@/components/site/Shared";
import { useGallery } from "@/lib/hooks";
import { usePageMeta } from "@/lib/seo";
import { GALLERY_CATEGORIES } from "@/lib/constants";
import type { GalleryImageDTO } from "@/lib/api-client";
import { EmptyState, ErrorState } from "./PageStates";
import { FilterChip, Lightbox } from "./Lightbox";

export function GalleryPage() {
  const { data: images, isLoading, isError, refetch } = useGallery();
  usePageMeta(
    "Gallery",
    "A look inside Crystal Diagnostic Centre, Thane West — featuring real photographs of our reception, imaging rooms and frontage.",
    "/gallery"
  );

  const crumbs = [{ label: "Gallery" }];
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const all = useMemo(() => images ?? [], [images]);

  const filtered = useMemo(
    () => (activeCategory === "All" ? all : all.filter((img) => img.category === activeCategory)),
    [all, activeCategory]
  );

  // Categories present in the data (plus the fixed list) → chips with counts
  const chips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const img of all) counts.set(img.category, (counts.get(img.category) ?? 0) + 1);
    const ordered = [
      "All",
      ...GALLERY_CATEGORIES.filter((c) => counts.has(c)),
      ...[...counts.keys()].filter((c) => !GALLERY_CATEGORIES.includes(c as (typeof GALLERY_CATEGORIES)[number])),
    ];
    return ordered.map((c) => ({ name: c, count: c === "All" ? all.length : counts.get(c) ?? 0 }));
  }, [all]);

  const openLightbox = (idx: number) => setLightboxIndex(idx);

  return (
    <div className="bg-card">
      <JsonLd data={breadcrumbSchema(crumbs)} />

      <PageHero
        eyebrow="Gallery"
        title="A Look Inside the Centre"
        description="A look inside Crystal Diagnostic Centre. Includes real photographs of the centre alongside illustrative visuals."
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <Breadcrumbs items={crumbs} />

        {/* Category filter chips */}
        <div
          className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Filter gallery by category"
        >
          {chips.map((chip) => (
            <FilterChip
              key={chip.name}
              active={activeCategory === chip.name}
              onClick={() => {
                setActiveCategory(chip.name);
                setLightboxIndex(null);
              }}
              count={chip.count}
            >
              {chip.name}
            </FilterChip>
          ))}
        </div>

        {isLoading && (
          <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="mb-4 animate-pulse break-inside-avoid border border-white/10 bg-soft"
                style={{ height: `${140 + ((i * 37) % 120)}px` }}
                aria-hidden
              />
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <ErrorState
            title="Could not load the gallery"
            message="We had trouble fetching gallery images. Please try again."
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState
            title={activeCategory === "All" ? "No photos yet" : `Nothing in “${activeCategory}” yet`}
            message="Photographs of the centre will appear here once they are published. Please check back soon."
          />
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="columns-2 gap-4 sm:columns-3 lg:columns-4" aria-label="Gallery images">
            {filtered.map((img, idx) => (
              <Reveal key={img.id} delay={Math.min(idx * 0.04, 0.3)} className="mb-4 break-inside-avoid">
                <GalleryTile image={img} onClick={() => openLightbox(idx)} />
              </Reveal>
            ))}
          </div>
        )}

        <p className="mx-auto mt-8 flex max-w-2xl items-start gap-2.5 border-l-2 border-gold/50 bg-white/[0.03] px-4 py-3 text-xs leading-relaxed text-inkmuted">
          <Camera className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
          Photographs of the reception, X-ray and sonography rooms and the centre frontage are actual photos of Crystal Diagnostic Centre; any remaining illustrative visuals are placeholders.
        </p>
      </div>

      <Lightbox
        items={filtered}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={(i) => setLightboxIndex(i)}
      />
    </div>
  );
}

function GalleryTile({ image, onClick }: { image: GalleryImageDTO; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative block w-full overflow-hidden border border-white/10 bg-soft transition-colors duration-200 hover:border-gold/60 focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:outline-none"
      aria-label={`Open image: ${image.title}`}
    >
      <img
        src={image.url}
        alt={image.alt || image.title}
        loading="lazy"
        draggable={false}
        className="w-full break-inside-avoid object-cover"
      />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3 pb-2.5 pt-8 text-left opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <span className="font-display block truncate text-[12px] uppercase tracking-wide text-white">{image.title}</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-text">
          {image.category}
        </span>
      </span>
    </button>
  );
}
