"use client";

import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouterStore } from "@/lib/store";

export function PagePlaceholder({ title }: { title: string }) {
  const navigate = useRouterStore((s) => s.navigate);
  return (
    <section className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center bg-white/5 ring-1 ring-white/10">
        <Construction className="h-7 w-7 text-teal" aria-hidden />
      </div>
      <h1 className="font-display text-2xl uppercase tracking-tight text-ink">{title}</h1>
      <p className="max-w-md text-sm text-inkmuted">
        This section is being prepared. Please check back shortly.
      </p>
      <Button onClick={() => navigate("#/")} className="px-6">
        Back to Home
      </Button>
    </section>
  );
}
