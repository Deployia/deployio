/** Base deployment URL (no cache-busting). */
export const getDeploymentUrl = (deployment) => {
  const direct =
    deployment?.url ||
    deployment?.networking?.fullUrl ||
    deployment?.fullUrl ||
    null;
  if (direct) return direct;

  const subdomain =
    deployment?.subdomain || deployment?.config?.subdomain || deployment?.networking?.subdomain;
  if (!subdomain) return null;

  const baseDomain =
    import.meta.env.VITE_DEPLOYMENT_BASE_DOMAIN ||
    import.meta.env.VITE_APP_DOMAIN ||
    null;
  if (!baseDomain) return null;

  const host = String(baseDomain).replace(/^\.+/, "");
  return `https://${subdomain}.${host}`;
};

export const isLiveForPreview = (status) =>
  status === "running" || status === "success";

/**
 * Append a cache-busting query param so iframe previews do not stick on the
 * Traefik landing-page fallback served before the deployment router is live.
 */
export const buildDeploymentPreviewUrl = (baseUrl, refreshToken) => {
  if (!baseUrl) return null;
  const token = refreshToken ?? Date.now();
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("_deployio_preview", String(token));
    return url.href;
  } catch {
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}_deployio_preview=${encodeURIComponent(token)}`;
  }
};

export const buildPreviewRefreshToken = (deployment, liveStatus, refreshTick = 0) =>
  [
    liveStatus?.status || deployment?.status || "",
    liveStatus?.message || "",
    deployment?.updatedAt || deployment?.updated_at || "",
    refreshTick,
  ].join("|");
