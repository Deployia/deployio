import { lazy } from "react";

/**
 * Lazy-load a route chunk; reload once on failure (stale asset hash after deploy).
 */
export function lazyWithRetry(importFn) {
  return lazy(async () => {
    const storageKey = "deployio-chunk-reload";
    const hasReloaded = sessionStorage.getItem(storageKey) === "1";

    try {
      const module = await importFn();
      sessionStorage.removeItem(storageKey);
      return module;
    } catch (error) {
      if (!hasReloaded) {
        sessionStorage.setItem(storageKey, "1");
        window.location.reload();
        return new Promise(() => {});
      }
      sessionStorage.removeItem(storageKey);
      throw error;
    }
  });
}
