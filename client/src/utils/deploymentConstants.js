/**
 * Shared deployment constants and helpers used across ProjectDetails and ProjectDeployments.
 */

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

/** Ordered pipeline stage names — must match statuses emitted by the agent. */
export const PIPELINE_STAGE_ORDER = [
  "queued",
  "cloning",
  "detecting",
  "building",
  "deploying",
  "running",
];
