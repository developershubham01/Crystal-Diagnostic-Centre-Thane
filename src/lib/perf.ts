/**
 * Device capability helpers for 3D/performance decisions (SSR-safe).
 */

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isLowPowerDevice(): boolean {
  if (typeof window === "undefined") return false;
  const cores = navigator.hardwareConcurrency ?? 4;
  const narrow = window.innerWidth < 640;
  return cores <= 4 || narrow;
}
