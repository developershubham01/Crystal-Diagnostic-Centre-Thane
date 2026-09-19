"use client";

import { create } from "zustand";

/**
 * Clean path-based client router (HTML5 History API).
 */

export type Route =
  | { name: "home" }
  | { name: "about" }
  | { name: "services" }
  | { name: "service-detail"; slug: string }
  | { name: "packages" }
  | { name: "package-detail"; slug: string }
  | { name: "book-test" }
  | { name: "track" }
  | { name: "reports" }
  | { name: "contact" }
  | { name: "gallery" }
  | { name: "faq" }
  | { name: "privacy" }
  | { name: "terms" }
  | { name: "disclaimer" }
  | { name: "admin" }
  | { name: "not-found" };

export function parsePath(url: string): Route {
  if (typeof window !== "undefined" && window.location.hash && window.location.hash.startsWith("#/")) {
    const legacyPath = window.location.hash.replace(/^#\/?/, "/");
    window.history.replaceState({}, "", legacyPath);
    url = legacyPath;
  }
  
  const clean = url.replace(/^#\/?/, "/").split("?")[0];
  const parts = clean.split("/").filter(Boolean).map(decodeURIComponent);

  if (parts.length === 0) return { name: "home" };
  switch (parts[0]) {
    case "about":
      return { name: "about" };
    case "services":
      return parts[1] ? { name: "service-detail", slug: parts[1] } : { name: "services" };
    case "packages":
      return parts[1] ? { name: "package-detail", slug: parts[1] } : { name: "packages" };
    case "book-test":
      return { name: "book-test" };
    case "track":
      return { name: "track" };
    case "reports":
      return { name: "reports" };
    case "contact":
      return { name: "contact" };
    case "gallery":
      return { name: "gallery" };
    case "faq":
      return { name: "faq" };
    case "privacy":
      return { name: "privacy" };
    case "terms":
      return { name: "terms" };
    case "disclaimer":
      return { name: "disclaimer" };
    case "admin":
      return { name: "admin" };
    default:
      return { name: "not-found" };
  }
}

export function routeToPath(route: Route): string {
  switch (route.name) {
    case "home":
      return "/";
    case "service-detail":
      return `/services/${route.slug}`;
    case "package-detail":
      return `/packages/${route.slug}`;
    default:
      return `/${route.name}`;
  }
}

interface RouterState {
  route: Route;
  ready: boolean;
  navigate: (to: string) => void;
  syncFromUrl: () => void;
  syncFromHash: () => void;
}

export const useRouterStore = create<RouterState>((set, get) => ({
  route: { name: "home" },
  ready: false,
  navigate: (to: string) => {
    let clean = to;
    if (clean.startsWith("#/")) clean = clean.substring(1);
    else if (clean.startsWith("#")) clean = clean.substring(1);
    if (!clean.startsWith("/")) clean = "/" + clean;

    const current = typeof window !== "undefined" ? window.location.pathname + window.location.search : "";
    if (typeof window !== "undefined" && current !== clean) {
      window.history.pushState({}, "", clean);
    }
    
    set({ route: parsePath(clean) });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  },
  syncFromUrl: () => {
    if (typeof window === "undefined") return;
    const url = window.location.pathname + window.location.search + window.location.hash;
    set({ route: parsePath(url), ready: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  },
  syncFromHash: () => {
    get().syncFromUrl();
  },
}));

export function useRoute(): Route {
  return useRouterStore((s) => s.route);
}
