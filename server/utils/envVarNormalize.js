/**
 * Normalize env var values pasted from .env files (KEY=value) into plain values.
 */
function normalizeEnvVarValue(key, value) {
  let v = String(value ?? "").trim();
  if (!v) return "";

  const keyName = String(key || "").trim();
  const directPrefix = `${keyName}=`;
  if (keyName && v.startsWith(directPrefix)) {
    v = v.slice(directPrefix.length).trim();
  }

  const exportPrefix = `export ${keyName}=`;
  if (keyName && v.startsWith(exportPrefix)) {
    v = v.slice(exportPrefix.length).trim();
  }

  // Common mistake: value is "MONGODB_URI_PROJECTS=mongodb+srv://..."
  if (keyName === "MONGODB_URI") {
    for (const alt of ["MONGODB_URI_PROJECTS=", "MONGODB_URI="]) {
      if (v.startsWith(alt)) {
        v = v.slice(alt.length).trim();
        break;
      }
    }
  }

  return v;
}

module.exports = { normalizeEnvVarValue };
