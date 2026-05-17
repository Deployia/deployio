import { useEffect, useState } from "react";
import DeploymentPreviewIframe from "./DeploymentPreviewIframe";
import {
  buildDeploymentPreviewUrl,
  getDeploymentUrl,
  isLiveForPreview,
} from "../../utils/deploymentPreview";

const PREVIEW_PROBE_MS = 10_000;

const parseJsonBody = (text) => {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
};

const isJsonContentType = (contentType) =>
  /application\/([a-z+\-.]+\+)?json/i.test(contentType || "");

/**
 * Live deployment preview: probes the URL and shows formatted JSON when the
 * app responds with JSON; otherwise falls back to the iframe preview.
 */
const DeploymentLivePreview = ({
  deployment,
  liveStatus = null,
  variant = "mini",
  pointerEventsNone = false,
  title,
  className = "",
  onError,
}) => {
  const baseUrl = getDeploymentUrl(deployment);
  const effectiveStatus = liveStatus?.status || deployment?.status;
  const isLive = isLiveForPreview(effectiveStatus);

  const [probe, setProbe] = useState({
    loading: true,
    mode: null,
    status: null,
    json: null,
    error: null,
  });

  useEffect(() => {
    if (!isLive || !baseUrl) {
      setProbe({ loading: false, mode: null, status: null, json: null, error: null });
      return undefined;
    }

    let cancelled = false;

    const runProbe = async () => {
      setProbe((prev) => ({ ...prev, loading: true }));
      const url = buildDeploymentPreviewUrl(baseUrl, Date.now());

      try {
        const response = await fetch(url, {
          method: "GET",
          credentials: "omit",
          headers: { Accept: "application/json, text/plain, */*" },
        });

        if (cancelled) return;

        const contentType = response.headers.get("content-type") || "";
        const text = await response.text();
        let json = null;

        if (isJsonContentType(contentType)) {
          json = parseJsonBody(text);
        }
        if (json == null) {
          json = parseJsonBody(text);
        }

        if (json != null) {
          setProbe({
            loading: false,
            mode: "json",
            status: response.status,
            json,
            error: null,
          });
          return;
        }

        setProbe({
          loading: false,
          mode: "iframe",
          status: response.status,
          json: null,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;
        setProbe({
          loading: false,
          mode: "iframe",
          status: null,
          json: null,
          error: err?.message || "probe failed",
        });
      }
    };

    runProbe();
    const timer = setInterval(runProbe, PREVIEW_PROBE_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isLive, baseUrl, effectiveStatus, deployment?.updatedAt]);

  if (!isLive || !baseUrl) return null;

  if (probe.loading) {
    return (
      <div
        className={`flex items-center justify-center h-full min-h-[8rem] bg-neutral-950 text-gray-500 text-xs ${className}`}
      >
        Loading preview…
      </div>
    );
  }

  if (probe.mode === "json" && probe.json != null) {
    return (
      <div
        className={`flex flex-col h-full min-h-[8rem] bg-neutral-950 overflow-hidden ${className}`}
      >
        <div className="flex items-center gap-2 px-2 py-1.5 border-b border-neutral-800/80 shrink-0">
          <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-mono text-[10px] font-semibold">
            {probe.status ?? 200}
          </span>
          <span className="text-[10px] text-gray-500 truncate">application/json</span>
        </div>
        <pre className="flex-1 overflow-auto p-2 text-[10px] leading-snug text-gray-300 font-mono whitespace-pre-wrap break-all">
          {JSON.stringify(probe.json, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <DeploymentPreviewIframe
      deployment={deployment}
      liveStatus={liveStatus}
      title={title}
      variant={variant}
      pointerEventsNone={pointerEventsNone}
      onError={onError}
      className={className}
    />
  );
};

export default DeploymentLivePreview;
