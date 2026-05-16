import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildDeploymentPreviewUrl,
  buildPreviewRefreshToken,
  getDeploymentUrl,
  isLiveForPreview,
} from "../../utils/deploymentPreview";

const PREVIEW_POLL_MS = 10_000;
const MINI_VIEWPORT_WIDTH = 1280;
const MINI_VIEWPORT_HEIGHT = 720;

/**
 * Live app preview iframe. Refreshes periodically and on status changes so
 * previews recover after Traefik switches from the landing-page fallback.
 *
 * `variant="mini"` renders a fixed desktop viewport scaled down inside the
 * container so the site layout is not squashed by a responsive iframe.
 */
const DeploymentPreviewIframe = ({
  deployment,
  liveStatus = null,
  title = "deployment-preview",
  className = "w-full h-full border-0",
  sandbox = "allow-same-origin allow-scripts allow-forms",
  pointerEventsNone = false,
  variant = "mini",
  onError,
}) => {
  const baseUrl = getDeploymentUrl(deployment);
  const effectiveStatus = liveStatus?.status || deployment?.status;
  const [refreshTick, setRefreshTick] = useState(0);
  const containerRef = useRef(null);
  const [miniScale, setMiniScale] = useState(0.28);

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

  useEffect(() => {
    if (variant !== "mini") return undefined;
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;

    const updateScale = () => {
      const w = el.clientWidth || 360;
      const h = el.clientHeight || 160;
      const scale = Math.min(
        w / MINI_VIEWPORT_WIDTH,
        h / MINI_VIEWPORT_HEIGHT,
        1,
      );
      setMiniScale(Math.max(0.12, scale));
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, [variant]);

  const previewUrl = useMemo(() => {
    if (!baseUrl) return null;
    const token = buildPreviewRefreshToken(deployment, liveStatus, refreshTick);
    return buildDeploymentPreviewUrl(baseUrl, token);
  }, [baseUrl, deployment, liveStatus, refreshTick]);

  if (!isLive || !previewUrl) return null;

  if (variant === "mini") {
    return (
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden bg-neutral-950"
      >
        <iframe
          key={previewUrl}
          title={title}
          src={previewUrl}
          sandbox={sandbox}
          width={MINI_VIEWPORT_WIDTH}
          height={MINI_VIEWPORT_HEIGHT}
          loading="lazy"
          onError={onError}
          className={`absolute top-0 left-0 border-0 origin-top-left${
            pointerEventsNone ? " pointer-events-none" : ""
          }`}
          style={{
            width: MINI_VIEWPORT_WIDTH,
            height: MINI_VIEWPORT_HEIGHT,
            transform: `scale(${miniScale})`,
          }}
        />
      </div>
    );
  }

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
