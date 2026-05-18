const {
  encryptSecret,
  decryptSecret,
  hasStoredSecret,
} = require("./secretsVault");
const { normalizeEnvRowPhase } = require("./envVarPhase");

const ENV_TARGETS = ["development", "staging", "production"];

function normalizeEnvRowForStorage(row) {
  if (!row || typeof row !== "object" || !row.key) {
    return null;
  }

  const key = String(row.key).trim();
  if (!key) {
    return null;
  }

  const plainValue = String(row.value ?? "");
  const encryptedValue = plainValue ? encryptSecret(plainValue) : "";

  return {
    ...row,
    key,
    value: encryptedValue,
    isSecret: true,
    phase: normalizeEnvRowPhase(row),
  };
}

function encryptEnvironmentMap(envMap = {}) {
  const result = {};
  for (const target of ENV_TARGETS) {
    const list = Array.isArray(envMap[target]) ? envMap[target] : [];
    result[target] = list
      .map(normalizeEnvRowForStorage)
      .filter(Boolean);
  }
  return result;
}

function redactEnvironmentMapForApi(envMap = {}) {
  const result = {};
  for (const target of ENV_TARGETS) {
    const list = Array.isArray(envMap[target]) ? envMap[target] : [];
    result[target] = list
      .filter((row) => row && row.key)
      .map((row) => ({
        key: row.key,
        value: "",
        hasValue: hasStoredSecret(row.value),
        isSecret: true,
        required: Boolean(row.required),
        description: row.description || "",
        source: row.source || "user",
        phase: normalizeEnvRowPhase(row),
      }));
  }
  return result;
}

function mergeEnvironmentMapUpdate(existingMap = {}, incomingMap = {}) {
  const result = {};
  for (const target of ENV_TARGETS) {
    const existingList = Array.isArray(existingMap[target])
      ? existingMap[target]
      : [];
    const incomingList = Array.isArray(incomingMap[target])
      ? incomingMap[target]
      : null;

    if (!incomingList) {
      result[target] = existingList.map((row) => ({ ...row }));
      continue;
    }

    const existingByKey = new Map(
      existingList.filter((r) => r?.key).map((r) => [r.key, r]),
    );

    result[target] = incomingList
      .filter((row) => row && row.key)
      .map((row) => {
        const key = String(row.key).trim();
        const prev = existingByKey.get(key);
        const incomingValue = String(row.value ?? "").trim();
        const hasValueFlag =
          row.hasValue === true ||
          (row.hasValue !== false && hasStoredSecret(prev?.value));

        let value = "";
        if (incomingValue) {
          value = encryptSecret(incomingValue);
        } else if (hasValueFlag && prev?.value) {
          value = prev.value;
          if (!incomingValue && prev.value && !String(prev.value).startsWith("enc:v1:")) {
            value = encryptSecret(prev.value);
          }
        }

        return {
          key,
          value,
          isSecret: true,
          required: Boolean(row.required),
          description: row.description || prev?.description || "",
          source: row.source || prev?.source || "user",
          phase: normalizeEnvRowPhase({ ...prev, ...row, key }),
        };
      });
  }
  return result;
}

function decryptEnvironmentMapForDeploy(envMap = {}) {
  const result = {};
  for (const target of ENV_TARGETS) {
    const list = Array.isArray(envMap[target]) ? envMap[target] : [];
    result[target] = list
      .filter((row) => row && row.key)
      .map((row) => ({
        ...row,
        value: decryptSecret(row.value),
      }));
  }
  return result;
}

function decryptEnvVarList(list = []) {
  return list
    .filter((row) => row && row.key)
    .map((row) => ({
      ...row,
      value: decryptSecret(row.value),
    }));
}

/**
 * Copy project env rows onto a deployment record (values stay encrypted at rest).
 */
function snapshotProjectEnvForDeployment(projectEnvList = []) {
  return (Array.isArray(projectEnvList) ? projectEnvList : [])
    .filter((row) => row && row.key)
    .map((row) => ({
      key: String(row.key).trim(),
      value: row.value || "",
      isSecret: row.isSecret !== false,
      phase: normalizeEnvRowPhase(row),
    }))
    .filter((row) => row.key);
}

module.exports = {
  ENV_TARGETS,
  encryptEnvironmentMap,
  redactEnvironmentMapForApi,
  mergeEnvironmentMapUpdate,
  decryptEnvironmentMapForDeploy,
  decryptEnvVarList,
  normalizeEnvRowForStorage,
  snapshotProjectEnvForDeployment,
};
