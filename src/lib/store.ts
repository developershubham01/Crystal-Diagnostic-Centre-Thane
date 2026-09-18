"use client";

import { create } from "zustand";

/**
 * Hash-based SPA router.
 * The sandbox preview only exposes the `/` route, so the whole site is
 * client-side routed via location.hash (e.g. #/services, #/packages/full-body-checkup).
 */

export type Route =
  | { name: "home" }
  | { name: "about" }
  | { name: "services" }
  | { name: "service-detail"; slug: string }
  | { name: "packages" }
  | { name: "package-detail"; slug: string }
  | { name: "book-test" }
  | { name: "reports" }
  | { name: "contact" }
  | { name: "gallery" }
  | { name: "faq" }
  | { name: "privacy" }
  | { name: "terms" }
  | { name: "disclaimer" }
  | { name: "admin" }
  | { name: "not-found" };

function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, "").replace(/\/+$/, "");
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
      return "#/";
    case "service-detail":
      return `#/services/${route.slug}`;
    case "package-detail":
      return `#/packages/${route.slug}`;
    default:
      return `#/${route.name}`;
  }
}

interface RouterState {
  route: Route;
  ready: boolean;
  navigate: (to: string) => void;
  syncFromHash: () => void;
}

export const useRouterStore = create<RouterState>((set) => ({
  route: { name: "home" },
  ready: false,
  navigate: (to: string) => {
    const target = to.startsWith("#") ? to : `#${to.startsWith("/") ? to : `/${to}`}`;
    if (typeof window !== "undefined" && window.location.hash !== target) {
      window.location.hash = target;
    } else {
      // Same-hash navigation: force sync (e.g. re-clicking a nav link)
      set({ route: parseHash(target) });
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  },
  syncFromHash: () => {
    if (typeof window === "undefined") return;
    set({ route: parseHash(window.location.hash), ready: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  },
}));

export function useRoute(): Route {
  return useRouterStore((s) => s.route);
}
