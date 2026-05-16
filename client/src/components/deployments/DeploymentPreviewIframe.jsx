import { useEffect, useMemo, useState } from "react";
import {
  buildDeploymentPreviewUrl,
  buildPreviewRefreshToken,
  getDeploymentUrl,
  isLiveForPreview,
} from "../../utils/deploymentPreview";

const PREVIEW_POLL_MS = 10_000;

/**
 * Live app preview iframe. Refreshes periodically and on status changes so
 * previews recover after Traefik switches from the landing-page fallback.
 */
const DeploymentPreviewIframe = ({
  deployment,
  liveStatus = null,
  title = "deployment-preview",
  className = "w-full h-full border-0",
  sandbox = "allow-same-origin allow-scripts allow-forms",
  pointerEventsNone = false,
  onError,
}) => {
  const baseUrl = getDeploymentUrl(deployment);
  const effectiveStatus = liveStatus?.status || deployment?.status;
  const [refreshTick, setRefreshTick] = useState(0);

  const isLive = isLiveForPreview(effectiveStatus);

  useEffect(() => {
    if (!isLive || !baseUrl) return undefined;
    const timer = setInterval(() => setRefreshTick((n) => n + 1), PREVIEW_POLL_MS);
    return () => clearInterval(timer);
  }, [isLive, baseUrl]);

  useEffect(() => {
    if (!liveStatus?.status) return;
    setRefreshTick((n) => n + 1);
  }, [liveStatus?.status, liveStatus?.message]);

  useEffect(() => {
    if (!isLiveForPreview(deployment?.status)) return;
    setRefreshTick((n) => n + 1);
  }, [deployment?.status, deployment?.updatedAt, deployment?.updated_at]);

  const previewUrl = useMemo(() => {
    if (!baseUrl) return null;
    const token = buildPreviewRefreshToken(deployment, liveStatus, refreshTick);
    return buildDeploymentPreviewUrl(baseUrl, token);
  }, [baseUrl, deployment, liveStatus, refreshTick]);

  if (!isLive || !previewUrl) return null;

  return (
    <iframe
      key={previewUrl}
      title={title}
      src={previewUrl}
      sandbox={sandbox}
      className={`${className}${pointerEventsNone ? " pointer-events-none" : ""}`}
      loading="lazy"
      onError={onError}
    />
  );
};

export default DeploymentPreviewIframe;
