"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type CategoryDTO, type FaqDTO, type GalleryImageDTO, type PackageDTO, type ServiceDTO, type TestimonialDTO } from "./api-client";
import { DEFAULT_SETTINGS, parseSettings, type SiteSettings } from "./settings";

/** React Query hooks for public dynamic content. */

export function useSettings() {
  return useQuery<SiteSettings>({
    queryKey: ["settings"],
    queryFn: async () => parseSettings(await api.get<{ key: string; value: string }[]>("/api/settings")),
    staleTime: 60_000,
    initialData: DEFAULT_SETTINGS,
  });
}

export function useCategories() {
  return useQuery<CategoryDTO[]>({
    queryKey: ["categories"],
    queryFn: () => api.get<CategoryDTO[]>("/api/categories"),
    staleTime: 60_000,
  });
}

export function useServices(params?: { category?: string; search?: string; featured?: boolean }) {
  const search = new URLSearchParams();
  if (params?.category) search.set("category", params.category);
  if (params?.search) search.set("search", params.search);
  if (params?.featured) search.set("featured", "1");
  const qs = search.toString();
  return useQuery<ServiceDTO[]>({
    queryKey: ["services", qs],
    queryFn: () => api.get<ServiceDTO[]>(`/api/services${qs ? `?${qs}` : ""}`),
    staleTime: 60_000,
  });
}

export function useService(slug: string) {
  return useQuery<ServiceDTO | null>({
    queryKey: ["service", slug],
    queryFn: () => api.get<ServiceDTO | null>(`/api/services/${slug}`),
    enabled: !!slug,
    staleTime: 60_000,
    retry: false,
  });
}

export function usePackages(params?: { featured?: boolean }) {
  const search = new URLSearchParams();
  if (params?.featured) search.set("featured", "1");
  const qs = search.toString();
  return useQuery<PackageDTO[]>({
    queryKey: ["packages", qs],
    queryFn: () => api.get<PackageDTO[]>(`/api/packages${qs ? `?${qs}` : ""}`),
    staleTime: 60_000,
  });
}

export function usePackage(slug: string) {
  return useQuery<PackageDTO | null>({
    queryKey: ["package", slug],
    queryFn: () => api.get<PackageDTO | null>(`/api/packages/${slug}`),
    enabled: !!slug,
    staleTime: 60_000,
    retry: false,
  });
}

export function useFaqs() {
  return useQuery<FaqDTO[]>({
    queryKey: ["faqs"],
    queryFn: () => api.get<FaqDTO[]>("/api/faqs"),
    staleTime: 60_000,
  });
}

export function useGallery() {
  return useQuery<GalleryImageDTO[]>({
    queryKey: ["gallery"],
    queryFn: () => api.get<GalleryImageDTO[]>("/api/gallery"),
    staleTime: 60_000,
  });
}

export function useTestimonials() {
  return useQuery<TestimonialDTO[]>({
    queryKey: ["testimonials"],
    queryFn: () => api.get<TestimonialDTO[]>("/api/testimonials"),
    staleTime: 60_000,
  });
}
