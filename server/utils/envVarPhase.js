const BUILD_ARG_KEY_PREFIX = /^(VITE_|NEXT_PUBLIC_|REACT_APP_)/;
const SENSITIVE_KEY_PATTERN = /(SECRET|TOKEN|PASSWORD|PRIVATE|API_KEY)/i;

const ENV_PHASES = ["runtime", "build"];

/**
 * Infer build vs runtime from variable name (Vite, Next, CRA conventions).
 */
function inferEnvPhase(key) {
  const name = String(key || "").trim();
  if (!name) return "runtime";
  if (BUILD_ARG_KEY_PREFIX.test(name)) return "build";
  return "runtime";
}

function normalizeEnvPhase(phase) {
  const p = String(phase || "").trim().toLowerCase();
  return ENV_PHASES.includes(p) ? p : null;
}

/**
 * Secrets and sensitive names must never be Docker build-args (image layer history).
 */
function isSensitiveBuildKey(key) {
  const name = String(key || "").trim();
  if (!name) return true;
  return SENSITIVE_KEY_PATTERN.test(name);
}

/**
 * Resolved phase for a stored env row.
 * ``isSecret`` only means the value is encrypted in the UI — not runtime-only.
 * Sensitive key names (JWT_SECRET, etc.) are never build-args.
 */
function resolveEnvPhase(row = {}) {
  const key = String(row.key || "").trim();
  if (!key) return "runtime";

  if (isSensitiveBuildKey(key)) {
    return "runtime";
  }

  const explicit = normalizeEnvPhase(row.phase);
  if (explicit === "build") return "build";

  const inferred = inferEnvPhase(key);
  if (explicit === "runtime") {
    // Rows saved before phase UI may have runtime stored for VITE_* / REACT_APP_*
    if (inferred === "build") return "build";
    return "runtime";
  }

  return inferred;
}

/**
 * Split decrypted env rows into Docker build-args vs container runtime env maps.
 */
function splitEnvVarsForDeploy(rows = []) {
  const buildArgs = {};
  const runtimeEnv = {};

  for (const row of rows) {
    const key = String(row?.key || "").trim();
    if (!key) continue;

    const value = row.value ?? "";
    if (resolveEnvPhase(row) === "build") {
      buildArgs[key] = value;
    } else {
      runtimeEnv[key] = value;
    }
  }

  return { buildArgs, runtimeEnv };
}

/**
 * Normalize phase on ingest (UI / API).
 */
function normalizeEnvRowPhase(row = {}) {
  return resolveEnvPhase(row);
}

module.exports = {
  ENV_PHASES,
  BUILD_ARG_KEY_PREFIX,
  inferEnvPhase,
  normalizeEnvPhase,
  resolveEnvPhase,
  isSensitiveBuildKey,
  splitEnvVarsForDeploy,
  normalizeEnvRowPhase,
};
