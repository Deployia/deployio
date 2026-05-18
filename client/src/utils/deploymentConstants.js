/**
 * Shared deployment constants and helpers used across ProjectDetails and ProjectDeployments.
 */

/** Canonical deploy targets (dev / staging / production). */
export const DEPLOYMENT_ENVIRONMENT_KEYS = [
  "development",
  "staging",
  "production",
];

export const EMPTY_ENVIRONMENT_VARIABLES = {
  development: [],
  staging: [],
  production: [],
};

const VALID_ENV_VAR_SOURCES = new Set(["env-example", "user", "system"]);

/** Coerce env var `source` to values allowed by the Project schema. */
export const normalizeEnvVarSource = (source) => {
  if (!source || source === "env-file") {
    return "env-example";
  }
  if (VALID_ENV_VAR_SOURCES.has(source)) {
    return source;
  }
  return "env-example";
};

const normalizeEnvVarRow = (row) => {
  if (!row || typeof row !== "object") return row;
  const hasValue =
    row.hasValue === true ||
    (row.hasValue !== false && Boolean(String(row.value ?? "").length));
  return {
    ...row,
    value: row.value ?? "",
    isSecret: true,
    hasValue,
    source: normalizeEnvVarSource(row.source),
  };
};

/** Normalize env-var maps from API, legacy shapes, or partial objects. */
export const normalizeEnvironmentVariables = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      development: [],
      staging: [],
      production: [],
    };
  }
  const mapList = (list) =>
    Array.isArray(list) ? list.map(normalizeEnvVarRow) : [];
  return {
    development: mapList(input.development),
    staging: mapList(input.staging),
    production: mapList(input.production),
  };
};

/** Merge analyzer env template into the three-target shape. */
export const mergeEnvTemplate = (template) => {
  const base = normalizeEnvironmentVariables(template);
  const copyList = (list) =>
    Array.isArray(list) ? list.map((entry) => ({ ...entry })) : [];
  return {
    development: copyList(base.development),
    staging: copyList(base.staging),
    production: copyList(base.production),
  };
};

export const DEPLOYMENT_POLL_STATUSES = new Set([
  "pending",
  "queued",
  "cloning",
  "detecting",
  "building",
  "deploying",
  "stopping",
]);

/** Statuses that count as "active" for capacity / concurrency checks. */
export const ACTIVE_DEPLOYMENT_STATUSES = new Set([
  "pending",
  "queued",
  "cloning",
  "detecting",
  "building",
  "deploying",
  "running",
]);

/** Terminal statuses (deployment is done, one way or another). */
export const TERMINAL_DEPLOYMENT_STATUSES = new Set([
  "running",
  "stopped",
  "failed",
  "error",
  "cancelled",
  "deleted",
]);

/**
 * Returns Tailwind className string for a deployment status badge.
 * Used in list rows (fixed-width pill with pulse for in-progress).
 */
export const getDeploymentStatusBadge = (status) => {
  const base =
    "inline-flex items-center justify-center min-w-[112px] px-3 py-1 rounded-full text-xs font-medium";
  switch (status) {
    case "success":
    case "running":
      return `${base} bg-green-500/20 text-green-400 border border-green-500/30`;
    case "failed":
    case "error":
      return `${base} bg-red-500/20 text-red-400 border border-red-500/30`;
    case "pending":
    case "queued":
      return `${base} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`;
    case "cloning":
    case "detecting":
    case "building":
    case "deploying":
      return `${base} bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse`;
    case "stopping":
      return `${base} bg-orange-500/20 text-orange-300 border border-orange-500/30 animate-pulse`;
    case "stopped":
    case "cancelled":
      return `${base} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
    case "archived":
      return `${base} bg-orange-500/20 text-orange-300 border border-orange-500/30`;
    default:
      return `${base} bg-blue-500/20 text-blue-400 border border-blue-500/30`;
  }
};

/**
 * Returns Tailwind className string for a compact project-level status badge
 * (no fixed width, used in overview headers and project lists).
 */
export const getProjectStatusBadge = (status) => {
  const base = "px-3 py-1 rounded-full text-xs font-medium";
  switch (status) {
    case "success":
    case "running":
    case "active":
      return `${base} bg-green-500/20 text-green-400 border border-green-500/30`;
    case "failed":
    case "error":
      return `${base} bg-red-500/20 text-red-400 border border-red-500/30`;
    case "pending":
    case "building":
      return `${base} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`;
    case "inactive":
    case "stopped":
      return `${base} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
    case "archived":
      return `${base} bg-orange-500/20 text-orange-300 border border-orange-500/30`;
    default:
      return `${base} bg-blue-500/20 text-blue-400 border border-blue-500/30`;
  }
};

const IN_FLIGHT_DEPLOYMENT_STATUSES = new Set([
  "pending",
  "queued",
  "cloning",
  "detecting",
  "building",
  "deploying",
]);

/** Whether a lifecycle action is valid for the current deployment status. */
export const isDeploymentActionAllowed = (deployment, action) => {
  const status = String(deployment?.status || "").toLowerCase();
  switch (action) {
    case "cancel":
      return IN_FLIGHT_DEPLOYMENT_STATUSES.has(status) || status === "running";
    case "stop":
      return status === "running";
    case "restart":
    case "redeploy":
      return ["stopped", "failed", "cancelled"].includes(status);
    case "delete":
      return ["stopped", "failed", "cancelled"].includes(status);
    default:
      return false;
  }
};

/**
 * Compact environment badge (DEV / STG / PROD).
 */
export const getDeploymentEnvironmentBadge = (environment) => {
  const env = String(environment || "staging").toLowerCase();
  const base =
    "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border";
  switch (env) {
    case "development":
      return `${base} bg-amber-500/15 text-amber-300 border-amber-500/30`;
    case "production":
      return `${base} bg-green-500/15 text-green-300 border-green-500/30`;
    case "staging":
    default:
      return `${base} bg-blue-500/15 text-blue-300 border-blue-500/30`;
  }
};

export const getDeploymentEnvironmentLabel = (environment) => {
  const env = String(environment || "staging").toLowerCase();
  if (env === "development") return "DEV";
  if (env === "production") return "PROD";
  if (env === "staging") return "STG";
  return env.slice(0, 3).toUpperCase();
};

/** Ordered pipeline stage names — must match statuses emitted by the agent. */
export const PIPELINE_STAGE_ORDER = [
  "queued",
  "cloning",
  "detecting",
  "building",
  "deploying",
  "running",
];

/** In-flight build pipeline (no container runtime yet). */
export const BUILD_PIPELINE_STATUSES = new Set([
  "pending",
  "queued",
  "cloning",
  "detecting",
  "building",
  "deploying",
]);

const PIPELINE_STAGE_SET = new Set(PIPELINE_STAGE_ORDER);

/** Map API status to a pipeline stage label (pending → queued for the stepper). */
export const resolvePipelineStage = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "queued";
  if (s === "success") return "running";
  return s;
};

export const isDeploymentBuildPhase = (status) =>
  BUILD_PIPELINE_STATUSES.has(String(status || "").toLowerCase());

export const isPipelineStageStatus = (status) => {
  const resolved = resolvePipelineStage(status);
  return PIPELINE_STAGE_SET.has(resolved);
};
