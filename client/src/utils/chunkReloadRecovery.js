const STORAGE_KEY = "deployio-chunk-reload";

function reloadOnce() {
  if (sessionStorage.getItem(STORAGE_KEY) === "1") return false;
  sessionStorage.setItem(STORAGE_KEY, "1");
  window.location.reload();
  return true;
}

function isChunkLoadError(reason) {
  const message = String(reason?.message ?? reason ?? "");
  return (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Importing a module script failed") ||
    message.includes("error loading dynamically imported module")
  );
}

/** One automatic reload after deploy when a lazy chunk hash is stale. */
export function installChunkReloadRecovery() {
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    reloadOnce();
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (isChunkLoadError(event.reason) && reloadOnce()) {
      event.preventDefault();
    }
  });

  window.addEventListener("load", () => {
    sessionStorage.removeItem(STORAGE_KEY);
  });
}
