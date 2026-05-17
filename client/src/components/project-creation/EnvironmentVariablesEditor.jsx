import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaCopy, FaPlus, FaTrash, FaUpload } from "react-icons/fa";
import {
  DEPLOYMENT_ENVIRONMENT_KEYS,
  normalizeEnvironmentVariables,
} from "@utils/deploymentConstants";
import { parseEnvFile } from "@utils/parseEnvFile";

const ENV_LABELS = {
  development: "Development",
  staging: "Staging",
  production: "Production",
};

/** Matches .env, .env.local, .env.production, app.env, etc. */
const isLikelyEnvFile = (name = "") => {
  const base = name.split(/[/\\]/).pop() || name;
  return (
    base === ".env" ||
    /^\.env\./.test(base) ||
    /\.env(?:\.|$)/i.test(base)
  );
};

const EnvironmentVariablesEditor = ({
  value,
  onChange,
  disabled = false,
  showSaveButton = false,
  onSave = null,
  saveLabel = "Save variables",
  saving = false,
}) => {
  const fileInputRef = useRef(null);
  const uploadTargetRef = useRef("development");
  const [dragOverEnv, setDragOverEnv] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const envVars = normalizeEnvironmentVariables(value);

  const updateEnvVars = (next) => {
    onChange(normalizeEnvironmentVariables(next));
  };

  const triggerUpload = (environment) => {
    uploadTargetRef.current = environment;
    fileInputRef.current?.click();
  };

  const applyParsedFile = (text, target, fileName = "") => {
    setUploadError(null);
    const parsed = parseEnvFile(text);
    if (!parsed.length) {
      setUploadError(
        fileName && !isLikelyEnvFile(fileName)
          ? `"${fileName}" does not look like an env file. Use .env, .env.local, or similar.`
          : "No KEY=value pairs found in that file.",
      );
      return;
    }
    updateEnvVars({
      ...envVars,
      [target]: parsed,
    });
  };

  const readEnvFile = (file, target) => {
    const reader = new FileReader();
    reader.onload = () =>
      applyParsedFile(reader.result, target, file.name || "");
    reader.onerror = () =>
      setUploadError("Could not read the file. Try again or paste variables manually.");
    reader.readAsText(file);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const target = uploadTargetRef.current || "development";
    readEnvFile(file, target);
  };

  const handleDrop = (environment, event) => {
    event.preventDefault();
    setDragOverEnv(null);
    if (disabled) return;

    const file = event.dataTransfer?.files?.[0];
    if (!file) return;

    readEnvFile(file, environment);
  };

  const addVariable = (environment) => {
    updateEnvVars({
      ...envVars,
      [environment]: [
        ...envVars[environment],
        {
          key: "",
          value: "",
          description: "",
          isSecret: true,
          hasValue: false,
          required: false,
          source: "user",
        },
      ],
    });
  };

  const updateVariable = (environment, index, field, fieldValue) => {
    updateEnvVars({
      ...envVars,
      [environment]: envVars[environment].map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, [field]: fieldValue, isSecret: true };
        if (field === "value" && fieldValue) {
          next.hasValue = true;
        }
        return next;
      }),
    });
  };

  const removeVariable = (environment, index) => {
    updateEnvVars({
      ...envVars,
      [environment]: envVars[environment].filter((_, i) => i !== index),
    });
  };

  const copyEnvironment = (fromEnv, toEnv) => {
    if (fromEnv === toEnv) return;
    updateEnvVars({
      ...envVars,
      [toEnv]: envVars[fromEnv].map((row) => ({ ...row, isSecret: true })),
    });
  };

  const copyToAllEnvironments = (fromEnv) => {
    const copied = envVars[fromEnv].map((row) => ({
      ...row,
      isSecret: true,
    }));
    updateEnvVars({
      development: copied.map((row) => ({ ...row })),
      staging: copied.map((row) => ({ ...row })),
      production: copied.map((row) => ({ ...row })),
    });
  };

  const valuePlaceholder = (env) => {
    if (env.hasValue && !env.value) {
      return "•••••••• (unchanged if left blank)";
    }
    return "Enter value";
  };

  const renderSection = (environment) => {
    const vars = envVars[environment] || [];
    const otherEnvs = DEPLOYMENT_ENVIRONMENT_KEYS.filter((e) => e !== environment);
    const isDragOver = dragOverEnv === environment;

    return (
      <motion.div
        key={environment}
        layout
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOverEnv(environment);
        }}
        onDragLeave={() => setDragOverEnv(null)}
        onDrop={(e) => handleDrop(environment, e)}
        className={`bg-neutral-800/20 rounded-lg p-3 sm:p-4 border space-y-3 transition-colors ${
          isDragOver
            ? "border-blue-500/50 bg-blue-500/5"
            : "border-neutral-700/50"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h4 className="text-sm font-semibold text-white">
            {ENV_LABELS[environment] || environment}
          </h4>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => triggerUpload(environment)}
              className="flex items-center gap-1 text-xs text-blue-300 hover:text-blue-200 disabled:opacity-50"
            >
              <FaUpload className="w-3 h-3" />
              Upload env file
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => addVariable(environment)}
              className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 disabled:opacity-50"
            >
              <FaPlus className="w-3 h-3" />
              Add
            </button>
          </div>
        </div>

        <p className="text-[11px] text-neutral-500">
          Drop a <code className="text-neutral-400">.env</code> or{" "}
          <code className="text-neutral-400">.env.local</code> file here. In the
          file picker on Mac, press Cmd+Shift+. to show hidden files like{" "}
          <code className="text-neutral-400">.env</code>.
        </p>

        <div className="flex flex-wrap gap-2">
          {otherEnvs.map((source) => (
            <button
              key={`${source}-to-${environment}`}
              type="button"
              disabled={disabled || envVars[source].length === 0}
              onClick={() => copyEnvironment(source, environment)}
              className="flex items-center gap-1 px-2 py-1 rounded border border-neutral-600 text-[11px] text-gray-300 hover:bg-neutral-700/50 disabled:opacity-40"
              title={`Copy ${ENV_LABELS[source]} variables here`}
            >
              <FaCopy className="w-3 h-3" />
              From {ENV_LABELS[source]}
            </button>
          ))}
          <button
            type="button"
            disabled={disabled || vars.length === 0}
            onClick={() => copyToAllEnvironments(environment)}
            className="flex items-center gap-1 px-2 py-1 rounded border border-neutral-600 text-[11px] text-gray-300 hover:bg-neutral-700/50 disabled:opacity-40"
          >
            <FaCopy className="w-3 h-3" />
            Apply to all envs
          </button>
        </div>

        <div className="space-y-2">
          {vars.map((env, index) => (
            <div
              key={`${environment}-${index}`}
              className="grid grid-cols-12 gap-2 items-start"
            >
              <div className="col-span-4 sm:col-span-3">
                <input
                  type="text"
                  disabled={disabled}
                  value={env.key}
                  onChange={(e) =>
                    updateVariable(environment, index, "key", e.target.value)
                  }
                  className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded text-white text-sm disabled:opacity-60"
                  placeholder="KEY"
                />
              </div>
              <div className="col-span-5 sm:col-span-5">
                <input
                  type="password"
                  disabled={disabled}
                  value={env.value || ""}
                  onChange={(e) =>
                    updateVariable(environment, index, "value", e.target.value)
                  }
                  className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded text-white text-sm disabled:opacity-60"
                  placeholder={valuePlaceholder(env)}
                  autoComplete="new-password"
                />
                {env.hasValue && !env.value && (
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    Value set — leave blank to keep existing
                  </p>
                )}
              </div>
              <div className="col-span-2 sm:col-span-3 flex items-center gap-2 pt-2">
                <label className="flex items-center gap-1 text-xs text-neutral-400">
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={env.required || false}
                    onChange={(e) =>
                      updateVariable(
                        environment,
                        index,
                        "required",
                        e.target.checked,
                      )
                    }
                  />
                  Required
                </label>
              </div>
              <div className="col-span-1 flex justify-center pt-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeVariable(environment, index)}
                  className="p-1 text-red-400 hover:text-red-300 disabled:opacity-40"
                >
                  <FaTrash className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
          {vars.length === 0 && (
            <p className="text-neutral-500 text-xs">
              No variables for {ENV_LABELS[environment]}. Upload a .env file,
              drag one here, copy from another environment, or add manually.
            </p>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileUpload}
      />
      {uploadError && (
        <p className="text-xs text-amber-400/90" role="alert">
          {uploadError}
        </p>
      )}
      <p className="text-xs text-gray-400">
        All values are stored as secrets and are never shown again after save.
        Upload or paste from your repo&apos;s{" "}
        <code className="text-gray-300">.env.example</code> when analysis finds
        one.
      </p>
      {DEPLOYMENT_ENVIRONMENT_KEYS.map(renderSection)}
      {showSaveButton && onSave && (
        <button
          type="button"
          disabled={disabled || saving}
          onClick={onSave}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50"
        >
          {saving ? "Saving..." : saveLabel}
        </button>
      )}
    </div>
  );
};

export default EnvironmentVariablesEditor;
