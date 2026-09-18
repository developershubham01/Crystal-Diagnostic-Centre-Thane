"use client";

/** Typed fetch helpers for the public API. All requests are same-origin relative paths. */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: options?.body ? { "Content-Type": "application/json" } : undefined,
    ...options,
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON response
  }
  if (!res.ok) {
    const message =
      (data as { error?: string } | null)?.error || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/* ---------- Shared public types (mirror API responses) ---------- */

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  sortOrder: number;
  published: boolean;
  serviceCount?: number;
}

export interface ServiceDTO {
  id: string;
  categoryId: string;
  category?: { id: string; name: string; slug: string };
  name: string;
  slug: string;
  shortDescription: string | null;
  detailedDescription: string | null;
  preparation: string | null;
  sampleType: string | null;
  turnaroundTime: string | null;
  price: number | null;
  priceVisible: boolean;
  image: string | null;
  featured: boolean;
  published: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  sortOrder: number;
}

export interface PackageDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  detailedDescription: string | null;
  tests: { id: string; name: string; sortOrder: number }[];
  price: number | null;
  priceVisible: boolean;
  preparation: string | null;
  applicability: string | null;
  image: string | null;
  featured: boolean;
  published: boolean;
  sortOrder: number;
}

export interface FaqDTO {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sortOrder: number;
  published: boolean;
}

export interface GalleryImageDTO {
  id: string;
  title: string;
  category: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  published: boolean;
}

export interface AppointmentDTO {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  testOrPackage: string;
  preferredDate: string | null;
  preferredTime: string | null;
  homeCollection: boolean;
  message: string | null;
  consent: boolean;
  status: string;
  internalNotes: string | null;
  createdAt: string;
}

export interface ContactMessageDTO {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  subject: string | null;
  message: string;
  consent: boolean;
  status: string;
  internalNotes: string | null;
  createdAt: string;
}
