"use client";

import { lazy, Suspense } from "react";
import { useRoute } from "@/lib/store";
import { HomePage } from "@/components/pages/HomePage";
import { AboutPage } from "@/components/pages/AboutPage";
import { ServicesPage } from "@/components/pages/ServicesPage";
import { ServiceDetailPage } from "@/components/pages/ServiceDetailPage";
import { PackagesPage } from "@/components/pages/PackagesPage";
import { PackageDetailPage } from "@/components/pages/PackageDetailPage";
import { BookTestPage } from "@/components/pages/BookTestPage";
import { ReportsPage } from "@/components/pages/ReportsPage";
import { ContactPage } from "@/components/pages/ContactPage";
import { GalleryPage } from "@/components/pages/GalleryPage";
import { FaqPage } from "@/components/pages/FaqPage";
import { PrivacyPage } from "@/components/pages/PrivacyPage";
import { TermsPage } from "@/components/pages/TermsPage";
import { DisclaimerPage } from "@/components/pages/DisclaimerPage";
import { AdminPage } from "@/components/pages/AdminPage";
import { NotFoundPage } from "@/components/pages/NotFoundPage";

/**
 * Renders the page component matching the current hash route.
 * All pages are client components; code-splitting via lazy() keeps
 * the initial bundle focused on the home page.
 */
const Lazy = {
  AboutPage: lazy(() => import("@/components/pages/AboutPage").then((m) => ({ default: m.AboutPage }))),
  ServicesPage: lazy(() => import("@/components/pages/ServicesPage").then((m) => ({ default: m.ServicesPage }))),
  ServiceDetailPage: lazy(() => import("@/components/pages/ServiceDetailPage").then((m) => ({ default: m.ServiceDetailPage }))),
  PackagesPage: lazy(() => import("@/components/pages/PackagesPage").then((m) => ({ default: m.PackagesPage }))),
  PackageDetailPage: lazy(() => import("@/components/pages/PackageDetailPage").then((m) => ({ default: m.PackageDetailPage }))),
  BookTestPage: lazy(() => import("@/components/pages/BookTestPage").then((m) => ({ default: m.BookTestPage }))),
  ReportsPage: lazy(() => import("@/components/pages/ReportsPage").then((m) => ({ default: m.ReportsPage }))),
  ContactPage: lazy(() => import("@/components/pages/ContactPage").then((m) => ({ default: m.ContactPage }))),
  GalleryPage: lazy(() => import("@/components/pages/GalleryPage").then((m) => ({ default: m.GalleryPage }))),
  FaqPage: lazy(() => import("@/components/pages/FaqPage").then((m) => ({ default: m.FaqPage }))),
  PrivacyPage: lazy(() => import("@/components/pages/PrivacyPage").then((m) => ({ default: m.PrivacyPage }))),
  TermsPage: lazy(() => import("@/components/pages/TermsPage").then((m) => ({ default: m.TermsPage }))),
  DisclaimerPage: lazy(() => import("@/components/pages/DisclaimerPage").then((m) => ({ default: m.DisclaimerPage }))),
  AdminPage: lazy(() => import("@/components/pages/AdminPage").then((m) => ({ default: m.AdminPage }))),
};

function RouteFallback() {
  return (
    <div className="container py-24" role="status" aria-label="Loading page">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-soft" />
        <div className="h-5 w-96 max-w-full animate-pulse rounded-lg bg-soft" />
        <div className="grid gap-6 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-soft" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function RouteRenderer() {
  const route = useRoute();

  const page = (() => {
    switch (route.name) {
      case "home":
        return <HomePage />;
      case "about":
        return <Lazy.AboutPage />;
      case "services":
        return <Lazy.ServicesPage />;
      case "service-detail":
        return <Lazy.ServiceDetailPage slug={route.slug} />;
      case "packages":
        return <Lazy.PackagesPage />;
      case "package-detail":
        return <Lazy.PackageDetailPage slug={route.slug} />;
      case "book-test":
        return <Lazy.BookTestPage />;
      case "reports":
        return <Lazy.ReportsPage />;
      case "contact":
        return <Lazy.ContactPage />;
      case "gallery":
        return <Lazy.GalleryPage />;
      case "faq":
        return <Lazy.FaqPage />;
      case "privacy":
        return <Lazy.PrivacyPage />;
      case "terms":
        return <Lazy.TermsPage />;
      case "disclaimer":
        return <Lazy.DisclaimerPage />;
      case "admin":
        return <Lazy.AdminPage />;
      default:
        return <NotFoundPage />;
    }
  })();

  return <Suspense fallback={<RouteFallback />}>{page}</Suspense>;
}
