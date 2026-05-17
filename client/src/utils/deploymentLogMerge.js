/**
 * Merge deployment log rows without duplicates (streaming polls often resend tail windows).
 */

export function deploymentLogKey(log) {
  if (!log || typeof log !== "object") {
    return String(log ?? "");
  }
  const ts = log.timestamp || log.ts || "";
  const level = log.level || "info";
  const source = log.source || "";
  const message =
    typeof log.message === "string"
      ? log.message
      : log.message != null
        ? JSON.stringify(log.message)
        : "";
  return `${ts}|${level}|${source}|${message}`;
}

export function mergeDeploymentLogs(existing = [], incoming = [], { max = 500 } = {}) {
  const map = new Map();
  const put = (row) => {
    if (!row) return;
    map.set(deploymentLogKey(row), row);
  };
  for (const row of existing) put(row);
  for (const row of incoming) put(row);
  const merged = Array.from(map.values());
  merged.sort(
    (a, b) =>
      new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime(),
  );
  if (merged.length > max) {
    return merged.slice(-max);
  }
  return merged;
}

export function upsertDeploymentLog(existing = [], entry, { max = 500 } = {}) {
  return mergeDeploymentLogs(existing, [entry], { max });
}
