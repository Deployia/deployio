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

const DEFAULT_SANDBOX =
  "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox";

/**
 * Live app preview iframe. Refreshes periodically and on status changes so
 * previews recover after Traefik switches from the landing-page fallback.
 *
 * - `fill` — iframe fills the parent (best for detail panels).
 * - `mini` — desktop viewport scaled down with a clipping wrapper (card thumbnails).
 */
const DeploymentPreviewIframe = ({
  deployment,
  liveStatus = null,
  title = "deployment-preview",
  className = "w-full h-full border-0",
  sandbox = DEFAULT_SANDBOX,
  pointerEventsNone = false,
  variant = "fill",
  onError,
}) => {
  const baseUrl = getDeploymentUrl(deployment);
  const effectiveStatus = liveStatus?.status || deployment?.status;
  const [refreshTick, setRefreshTick] = useState(0);
  const containerRef = useRef(null);
  const [miniScale, setMiniScale] = useState(0.25);

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
      setMiniScale(Math.max(0.15, scale));
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

  const pointerClass = pointerEventsNone ? " pointer-events-none" : "";
  const iframeCommon = {
    key: previewUrl,
    title,
    src: previewUrl,
    sandbox,
    loading: "eager",
    referrerPolicy: "no-referrer-when-downgrade",
    onError,
  };

  if (variant === "mini") {
    const scaledWidth = MINI_VIEWPORT_WIDTH * miniScale;
    const scaledHeight = MINI_VIEWPORT_HEIGHT * miniScale;

    return (
      <div
        ref={containerRef}
        className="relative w-full h-full min-h-[8rem] overflow-hidden bg-neutral-950 flex items-center justify-center"
      >
        <div
          className="overflow-hidden"
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
            maxWidth: "100%",
            maxHeight: "100%",
          }}
        >
          <iframe
            {...iframeCommon}
            className={`block border-0 origin-top-left${pointerClass}`}
            style={{
              width: MINI_VIEWPORT_WIDTH,
              height: MINI_VIEWPORT_HEIGHT,
              transform: `scale(${miniScale})`,
              transformOrigin: "0 0",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <iframe
      {...iframeCommon}
      className={`${className}${pointerClass}`}
    />
  );
};

export default DeploymentPreviewIframe;
