"use client";

import { useEffect } from "react";
import { useSettings } from "./hooks";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

function setMeta(selector: string, attr: string, value: string) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

/**
 * Updates document title + meta description per client-side "page".
 * Hash-routed SPA keeps a single server route, so per-view SEO is applied here.
 */
export function usePageMeta(title: string, description?: string, path = "/") {
  const { data: settings } = useSettings();
  useEffect(() => {
    const fullTitle = title
      ? `${title} | ${settings.businessName}`
      : settings.seoTitle;
    document.title = fullTitle;
    const desc = description || settings.seoDescription;
    setMeta('meta[name="description"]', "content", desc);
    setMeta('meta[property="og:title"]', "content", fullTitle);
    setMeta('meta[property="og:description"]', "content", desc);
    setMeta('meta[property="og:url"]', "content", `${SITE_URL}${path}`);
    setMeta('meta[name="twitter:title"]', "content", fullTitle);
    setMeta('meta[name="twitter:description"]', "content", desc);
    // canonical
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `${SITE_URL}${path}`);
  }, [title, description, path, settings]);
}
