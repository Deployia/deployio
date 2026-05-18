import { inferEnvPhase } from "./deploymentConstants";

/**
 * Parse .env / .env.example text into variable rows for project configuration.
 */
export function parseEnvFile(content) {
  if (!content || typeof content !== "string") return [];

  const rows = [];
  const seen = new Set();

  content.split(/\r?\n/).forEach((line) => {
    let trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    if (trimmed.startsWith("export ")) {
      trimmed = trimmed.slice(7).trim();
    }

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) return;

    const key = trimmed.slice(0, eqIndex).trim();
    if (!key || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return;

    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    const upper = key.toUpperCase();
    if (seen.has(upper)) return;
    seen.add(upper);

    rows.push({
      key,
      value,
      description: "",
      isSecret: true,
      hasValue: Boolean(value),
      required: false,
      source: "env-example",
      phase: inferEnvPhase(key),
    });
  });

  return rows;
}
