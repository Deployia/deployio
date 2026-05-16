import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import {
  FaDocker,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaFileCode,
  FaArrowLeft,
} from "react-icons/fa";
import {
  discoverDockerfiles,
  setSelectedDockerfile,
  setProjectConfiguration,
  completeStep,
  updateStep,
  resetAnalysisForNewRepo,
} from "@redux/slices/projectCreationSlice";

const DockerfileSelection = ({ stepData, onNext, onPrevious, loading }) => {
  const dispatch = useDispatch();
  const autoAdvancedRef = useRef(false);
  const [localSelection, setLocalSelection] = useState(
    stepData.selectedDockerfile,
  );
  const [projectNameOverride, setProjectNameOverride] = useState(
    stepData.projectName || "",
  );

  const buildRepositoryPayload = () => {
    let repositoryUrl;
    const repo = stepData.selectedRepository;
    if (repo?.htmlUrl) {
      repositoryUrl = repo.htmlUrl;
    } else if (repo?.cloneUrl) {
      repositoryUrl = repo.cloneUrl;
    } else {
      const owner =
        typeof repo?.owner === "object" ? repo.owner.login : repo?.owner;
      repositoryUrl = `https://github.com/${owner}/${repo?.name}`;
    }

    return {
      repositoryUrl,
      branch: stepData.selectedBranch?.name || stepData.selectedBranch,
      provider: stepData.selectedProvider || "github",
    };
  };

  useEffect(() => {
    if (
      !stepData.selectedRepository ||
      !stepData.selectedBranch ||
      stepData.dockerfiles?.length > 0 ||
      stepData.dockerfileDiscoveryStatus === "loading"
    ) {
      return;
    }

    dispatch(discoverDockerfiles(buildRepositoryPayload()));
  }, [
    dispatch,
    stepData.selectedRepository,
    stepData.selectedBranch,
    stepData.dockerfiles?.length,
    stepData.dockerfileDiscoveryStatus,
  ]);

  const dockerfiles = stepData.dockerfiles || [];
  const validDockerfiles = dockerfiles.filter((df) => df.isValid);
  const hasBlockingIssue =
    stepData.dockerfileDiscoveryStatus === "completed" &&
    (dockerfiles.length === 0 || validDockerfiles.length === 0);

  useEffect(() => {
    const list = stepData.dockerfiles || [];
    const valid = list.filter((df) => df.isValid);
    if (valid.length !== 1 || stepData.selectedDockerfile) {
      return;
    }

    const only = valid[0];
    setLocalSelection(only);
    dispatch(setSelectedDockerfile(only));
    setProjectNameOverride(only.suggestedName || "");
    dispatch(
      setProjectConfiguration({
        projectName: only.suggestedName || "",
        dockerfilePath: only.path,
        dockerfilePreview: only.content || only.preview || "",
      }),
    );
  }, [dispatch, stepData.dockerfiles, stepData.selectedDockerfile]);

  useEffect(() => {
    const valid = (stepData.dockerfiles || []).filter((df) => df.isValid);
    if (
      autoAdvancedRef.current ||
      stepData.dockerfileDiscoveryStatus !== "completed" ||
      valid.length !== 1 ||
      !valid[0]?.path
    ) {
      return;
    }

    autoAdvancedRef.current = true;
    const only = valid[0];
    dispatch(setSelectedDockerfile(only));
    dispatch(
      setProjectConfiguration({
        projectName: only.suggestedName || "",
        dockerfilePath: only.path,
        dockerfilePreview: only.content || only.preview || "",
      }),
    );
    dispatch(completeStep(4));
    const timer = setTimeout(() => onNext(), 400);
    return () => clearTimeout(timer);
  }, [
    dispatch,
    onNext,
    stepData.dockerfileDiscoveryStatus,
    stepData.dockerfiles,
  ]);

  const handleSelect = (dockerfile) => {
    setLocalSelection(dockerfile);
    dispatch(setSelectedDockerfile(dockerfile));
    const name = projectNameOverride || dockerfile.suggestedName || "";
    if (!projectNameOverride) {
      setProjectNameOverride(dockerfile.suggestedName || "");
    }
    dispatch(
      setProjectConfiguration({
        projectName: name || dockerfile.suggestedName,
        dockerfilePath: dockerfile.path,
        dockerfilePreview: dockerfile.content || dockerfile.preview || "",
      }),
    );
  };

  const handleContinue = () => {
    if (!localSelection?.path || !localSelection?.isValid) return;

    dispatch(
      setProjectConfiguration({
        projectName: projectNameOverride || localSelection.suggestedName,
        dockerfilePath: localSelection.path,
        dockerfilePreview:
          localSelection.content || localSelection.preview || "",
      }),
    );
    dispatch(completeStep(4));
    onNext();
  };

  const handleGoBack = () => {
    dispatch(resetAnalysisForNewRepo());
    if (onPrevious) {
      onPrevious();
    } else {
      dispatch(updateStep({ step: 3 }));
    }
  };

  const handleGoToRepository = () => {
    dispatch(resetAnalysisForNewRepo());
    dispatch(updateStep({ step: 2 }));
  };

  const isDiscovering =
    stepData.dockerfileDiscoveryStatus === "loading" || loading;
  const discoveryError = stepData.dockerfileDiscoveryError;
  const blockingMessage =
    stepData.dockerfileDiscoveryReason ||
    (dockerfiles.length === 0
      ? "No Dockerfiles found in this repository."
      : "Dockerfiles were found but none are valid for deployment.");

  if (hasBlockingIssue) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto px-3 sm:px-6 text-center"
      >
        <FaExclamationTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">
          Repository not deployable
        </h2>
        <p className="text-neutral-300 text-sm mb-2">{blockingMessage}</p>
        <p className="text-neutral-500 text-sm mb-8">
          Each service needs a Dockerfile with <code className="text-neutral-400">FROM</code> and{" "}
          <code className="text-neutral-400">CMD</code> or{" "}
          <code className="text-neutral-400">ENTRYPOINT</code>. Docker Compose alone is not
          used for deployment — add per-service Dockerfiles instead.
        </p>
        <motion.div layout className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={handleGoBack}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium inline-flex items-center gap-2"
          >
            <FaArrowLeft className="w-4 h-4" />
            Back to branch
          </button>
          <button
            type="button"
            onClick={handleGoToRepository}
            className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-medium"
          >
            Choose another repository
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-3 sm:px-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6 sm:mb-8"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="w-12 h-12 sm:w-16 sm:h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
        >
          <FaDocker className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
        </motion.div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Choose a Dockerfile
        </h2>
        <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto px-2">
          Each Dockerfile becomes its own project (e.g. frontend, API). Pick a{" "}
          <span className="text-green-400">valid</span> service to deploy — you can add
          others later from the same repository.
        </p>
      </motion.div>

      {isDiscovering && (
        <div className="flex items-center justify-center py-12 text-neutral-400">
          <FaSpinner className="w-6 h-6 animate-spin text-cyan-400 mr-3" />
          Scanning repository for Dockerfiles…
        </div>
      )}

      {!isDiscovering && discoveryError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm"
        >
          {discoveryError}
        </motion.div>
      )}

      {!isDiscovering && dockerfiles.length > 0 && (
        <motion.div layout className="space-y-4 mb-6">
          {dockerfiles.map((df, index) => {
            const isSelected = localSelection?.path === df.path;
            const canSelect = df.isValid;
            return (
              <motion.button
                key={df.path}
                type="button"
                disabled={!canSelect}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => canSelect && handleSelect(df)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  !canSelect
                    ? "border-neutral-800 bg-neutral-900/40 opacity-60 cursor-not-allowed"
                    : isSelected
                      ? "border-cyan-500/60 bg-cyan-500/10 ring-2 ring-cyan-500/20"
                      : "border-neutral-700 bg-neutral-800/50 hover:border-neutral-600"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <motion.div layout className="flex-1 min-w-0">
                    <motion.div layout className="flex items-center gap-2 flex-wrap">
                      <FaFileCode className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <code className="text-white font-mono text-sm break-all">
                        {df.path}
                      </code>
                      {df.isValid ? (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
                          Valid
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-300">
                          Not deployable
                        </span>
                      )}
                    </motion.div>
                    <p className="text-sm text-neutral-400 mt-2">
                      Suggested project:{" "}
                      <span className="text-neutral-200">{df.suggestedName}</span>
                    </p>
                    {!df.isValid && (
                      <p className="text-xs text-red-300/90 mt-2">
                        Missing FROM and CMD or ENTRYPOINT — fix this file before
                        deploying.
                      </p>
                    )}
                    {df.preview && (
                      <pre className="mt-3 p-3 bg-neutral-900/80 rounded text-xs text-neutral-400 overflow-x-auto max-h-32 font-mono">
                        {df.preview}
                        {df.content && df.content.split("\n").length > 12
                          ? "\n…"
                          : ""}
                      </pre>
                    )}
                  </motion.div>
                  {isSelected && canSelect && (
                    <FaCheckCircle className="w-6 h-6 text-cyan-400 flex-shrink-0" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {localSelection?.isValid && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Project name
          </label>
          <input
            type="text"
            value={projectNameOverride}
            onChange={(e) => {
              setProjectNameOverride(e.target.value);
              dispatch(
                setProjectConfiguration({ projectName: e.target.value }),
              );
            }}
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500"
            placeholder={localSelection.suggestedName}
          />
          <p className="text-xs text-neutral-500 mt-2">
            Auto-generated from{" "}
            <code className="text-neutral-400">{localSelection.path}</code>
          </p>
        </motion.div>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!localSelection?.isValid || isDiscovering}
          className={`px-8 py-3 rounded-lg font-medium transition-all ${
            localSelection?.isValid && !isDiscovering
              ? "bg-cyan-600 hover:bg-cyan-700 text-white"
              : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
          }`}
        >
          Continue to analysis
        </button>
        {localSelection && !localSelection.isValid && (
          <p className="text-amber-400 text-xs mt-3">
            Select a valid Dockerfile to continue.
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default DockerfileSelection;
