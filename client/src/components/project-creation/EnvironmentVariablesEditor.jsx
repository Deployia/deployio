import { useRef } from "react";
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

const EnvironmentVariablesEditor = ({ value, onChange, disabled = false }) => {
  const fileInputRef = useRef(null);
  const uploadTargetRef = useRef("development");
  const envVars = normalizeEnvironmentVariables(value);

  const updateEnvVars = (next) => {
    onChange(normalizeEnvironmentVariables(next));
  };

  const triggerUpload = (environment) => {
    uploadTargetRef.current = environment;
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const target = uploadTargetRef.current || "development";
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseEnvFile(reader.result);
      if (!parsed.length) return;
      updateEnvVars({
        ...envVars,
        [target]: parsed,
      });
    };
    reader.readAsText(file);
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
          isSecret: false,
          required: false,
          source: "user",
        },
      ],
    });
  };

  const updateVariable = (environment, index, field, fieldValue) => {
    updateEnvVars({
      ...envVars,
      [environment]: envVars[environment].map((row, i) =>
        i === index ? { ...row, [field]: fieldValue } : row,
      ),
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
      [toEnv]: envVars[fromEnv].map((row) => ({ ...row })),
    });
  };

  const copyToAllEnvironments = (fromEnv) => {
    const copied = envVars[fromEnv].map((row) => ({ ...row }));
    updateEnvVars({
      development: copied.map((row) => ({ ...row })),
      staging: copied.map((row) => ({ ...row })),
      production: copied.map((row) => ({ ...row })),
    });
  };

  const renderSection = (environment) => {
    const vars = envVars[environment] || [];
    const otherEnvs = DEPLOYMENT_ENVIRONMENT_KEYS.filter((e) => e !== environment);

    return (
      <motion.div
        key={environment}
        layout
        className="bg-neutral-800/20 rounded-lg p-3 sm:p-4 border border-neutral-700/50 space-y-3"
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
              Upload .env
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
              <div className="col-span-3">
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
              <div className="col-span-4">
                <input
                  type={env.isSecret ? "password" : "text"}
                  disabled={disabled}
                  value={env.value}
                  onChange={(e) =>
                    updateVariable(environment, index, "value", e.target.value)
                  }
                  className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded text-white text-sm disabled:opacity-60"
                  placeholder="value"
                />
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <label className="flex items-center gap-1 text-xs text-neutral-400">
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={env.required || false}
                    onChange={(e) =>
                      updateVariable(environment, index, "required", e.target.checked)
                    }
                  />
                  Required
                </label>
                <label className="flex items-center gap-1 text-xs text-neutral-400">
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={env.isSecret || false}
                    onChange={(e) =>
                      updateVariable(environment, index, "isSecret", e.target.checked)
                    }
                  />
                  Secret
                </label>
              </div>
              <div className="col-span-1 flex justify-center">
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
              No variables for {ENV_LABELS[environment]}. Upload a .env file, copy from
              another environment, or add manually.
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
        accept=".env,.env.example,.env.local,text/plain"
        className="hidden"
        onChange={handleFileUpload}
      />
      <p className="text-xs text-gray-400">
        Variables from your repo&apos;s <code className="text-gray-300">.env.example</code>{" "}
        are prefilled when analysis finds one. Upload a local <code className="text-gray-300">.env</code>{" "}
        file or copy between development, staging, and production.
      </p>
      {DEPLOYMENT_ENVIRONMENT_KEYS.map(renderSection)}
    </div>
  );
};

export default EnvironmentVariablesEditor;
