"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";

/**
 * TrackerQr — crisp QR code encoding the public tracker deep link
 * (#/track?reference=CDC-XXXXXX) so patients can scan the confirmation
 * from another screen or share a printed slip.
 *
 * Rendered client-side after mount (window.location.origin) in a white
 * tile for maximum scanner contrast; gold corner brackets echo the
 * Midnight Showroom aero-cut frame language.
 */
export function TrackerQr({
  reference,
  size = 92,
  label = "Scan to track this request",
  className,
}: {
  reference: string;
  size?: number;
  label?: string;
  className?: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const url = `${window.location.origin}/track?reference=${encodeURIComponent(reference)}`;
    QRCode.toDataURL(url, {
      width: size * 2, // 2x for retina crispness
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then((u) => {
        if (!cancelled) setDataUrl(u);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [reference, size]);

  return (
    <figure className={cn("inline-flex flex-col items-center gap-2", className)}>
      <div className="relative p-1.5">
        {/* gold aero-cut corner brackets */}
        <span aria-hidden className="absolute -left-px -top-px h-3 w-3 border-l-2 border-t-2 border-gold" />
        <span aria-hidden className="absolute -right-px -top-px h-3 w-3 border-r-2 border-t-2 border-gold" />
        <span aria-hidden className="absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-gold" />
        <span aria-hidden className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-gold" />
        {dataUrl ? (
          <img src={dataUrl} alt={`QR code linking to tracking page for ${reference}`} width={size} height={size} className="block bg-white" />
        ) : (
          <div style={{ width: size, height: size }} className="block animate-pulse bg-white/80" aria-hidden />
        )}
      </div>
      <figcaption className="text-center text-[9px] font-semibold uppercase tracking-[0.18em] text-steel">
        {label}
      </figcaption>
    </figure>
  );
}
