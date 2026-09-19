import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Gold stars out of 5 (read-only display, shared by home page + admin table). */
export function StarRating({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn("h-3.5 w-3.5", i < rating ? "fill-gold text-gold" : "text-white/20")}
          aria-hidden
        />
      ))}
    </span>
  );
}
