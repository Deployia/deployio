import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaGithub,
  FaArrowLeft,
  FaCodeBranch,
  FaCogs,
  FaTerminal,
  FaEnvira,
  FaServer,
  FaRocket,
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle,
  FaBox,
} from "react-icons/fa";

const ProjectDetails = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/v1/projects/${projectId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch project details");
        }

        const data = await response.json();
        setProject(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-neutral-400">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FaExclamationTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-neutral-400 mb-4">
            {error || "Project not found"}
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const deployments = project.deployments || [];
  const canAddDeployment =
    deployments.filter((d) => d.status !== "deleted").length < 2;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "repository", label: "Repository" },
    { id: "configuration", label: "Configuration" },
    { id: "environment", label: "Environment" },
    { id: "dockerfile", label: "Dockerfile" },
    { id: "deployments", label: `Deployments (${deployments.length})` },
  ];

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-neutral-900/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/")}
                className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <FaArrowLeft className="w-5 h-5 text-neutral-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {project.name}
                </h1>
                <p className="text-sm text-neutral-400 mt-1">
                  {project.description}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-neutral-400 mb-2">Status</div>
              <div className="flex items-center space-x-2 text-green-400">
                <FaCheckCircle className="w-4 h-4" />
                <span className="font-medium capitalize">{project.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-800 bg-neutral-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-neutral-400 hover:text-neutral-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="grid gap-4 md:grid-cols-4">
              <div className="bg-neutral-800/30 rounded-lg p-4 border border-neutral-700">
                <div className="text-neutral-400 text-sm mb-2">Stack</div>
                <div className="text-2xl font-bold text-white capitalize">
                  {project.stack?.detected?.primary}
                </div>
              </div>

              <div className="bg-neutral-800/30 rounded-lg p-4 border border-neutral-700">
                <div className="text-neutral-400 text-sm mb-2">
                  Default Port
                </div>
                <div className="text-2xl font-bold text-white">
                  {project.deployment?.buildConfig?.port || 3000}
                </div>
              </div>

              <div className="bg-neutral-800/30 rounded-lg p-4 border border-neutral-700">
                <div className="text-neutral-400 text-sm mb-2">Deployments</div>
                <div className="text-2xl font-bold text-white">
                  {deployments.length}/2
                </div>
              </div>

              <div className="bg-neutral-800/30 rounded-lg p-4 border border-neutral-700">
                <div className="text-neutral-400 text-sm mb-2">Created</div>
                <div className="text-sm font-mono text-neutral-300">
                  {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {canAddDeployment && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FaRocket className="w-5 h-5 text-blue-400" />
                    <div>
                      <h3 className="text-white font-medium">
                        Ready to Deploy
                      </h3>
                      <p className="text-sm text-blue-300 mt-1">
                        You can create deployments for this project. You have
                        space for {2 - deployments.length} more deployment(s).
                      </p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                    Start Deployment
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Repository Tab */}
        {activeTab === "repository" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="bg-neutral-800/30 rounded-lg p-6 border border-neutral-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <FaGithub className="w-5 h-5" />
                <span>Repository Information</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-neutral-400">Provider</label>
                  <div className="text-white font-mono text-sm capitalize">
                    {project.repository?.provider}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-neutral-400">Owner</label>
                  <div className="text-white font-mono text-sm">
                    {project.repository?.owner}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-neutral-400">Repository</label>
                  <div className="text-white font-mono text-sm">
                    {project.repository?.name}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-neutral-400">Branch</label>
                  <div className="flex items-center space-x-2 text-white font-mono text-sm">
                    <FaCodeBranch className="w-4 h-4 text-neutral-500" />
                    <span>{project.repository?.branch}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-neutral-400">Visibility</label>
                  <div className="text-white text-sm capitalize">
                    {project.repository?.private ? "Private" : "Public"}
                  </div>
                </div>

                {project.repository?.url && (
                  <div>
                    <label className="text-sm text-neutral-400">
                      Repository URL
                    </label>
                    <a
                      href={project.repository.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm break-all"
                    >
                      {project.repository.url}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Configuration Tab */}
        {activeTab === "configuration" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="bg-neutral-800/30 rounded-lg p-6 border border-neutral-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <FaCogs className="w-5 h-5" />
                <span>Build Configuration</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-neutral-400 mb-2 block">
                    Build Command
                  </label>
                  <code className="block bg-neutral-900 px-3 py-2 rounded text-sm text-green-400 font-mono break-all">
                    {project.deployment?.buildConfig?.buildCommand}
                  </code>
                </div>

                <div>
                  <label className="text-sm text-neutral-400 mb-2 block">
                    Start Command
                  </label>
                  <code className="block bg-neutral-900 px-3 py-2 rounded text-sm text-green-400 font-mono break-all">
                    {project.deployment?.buildConfig?.startCommand}
                  </code>
                </div>

                <div>
                  <label className="text-sm text-neutral-400 mb-2 block">
                    Install Command
                  </label>
                  <code className="block bg-neutral-900 px-3 py-2 rounded text-sm text-green-400 font-mono break-all">
                    {project.deployment?.buildConfig?.installCommand}
                  </code>
                </div>

                <div>
                  <label className="text-sm text-neutral-400 mb-2 block">
                    Port
                  </label>
                  <div className="text-white font-mono text-sm">
                    {project.deployment?.buildConfig?.port}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Environment Tab */}
        {activeTab === "environment" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="bg-neutral-800/30 rounded-lg p-6 border border-neutral-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <FaEnvira className="w-5 h-5" />
                <span>Environment Variables</span>
              </h3>

              {project.deployment?.buildConfig?.environmentVariables &&
              project.deployment.buildConfig.environmentVariables.length > 0 ? (
                <div className="space-y-2">
                  {project.deployment.buildConfig.environmentVariables.map(
                    (env, index) => (
                      <div
                        key={index}
                        className="p-3 bg-neutral-900/30 rounded border border-neutral-700 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <code className="text-blue-400 font-mono text-sm">
                            {env.key}
                          </code>
                          <span className="text-neutral-500">=</span>
                          <code className="text-green-400 font-mono text-sm">
                            {env.isSecret ? "***" : env.value || "(not set)"}
                          </code>
                        </div>
                        {env.isSecret && (
                          <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">
                            Secret
                          </span>
                        )}
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="text-neutral-400 text-sm">
                  No environment variables configured
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Dockerfile Tab */}
        {activeTab === "dockerfile" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="bg-neutral-800/30 rounded-lg p-6 border border-neutral-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <FaTerminal className="w-5 h-5" />
                <span>Dockerfile</span>
              </h3>

              {project.deployment?.dockerfile ? (
                <div className="bg-neutral-950 rounded p-4 overflow-x-auto border border-neutral-700">
                  <pre className="text-xs sm:text-sm text-neutral-300 whitespace-pre-wrap break-words font-mono">
                    {project.deployment.dockerfile}
                  </pre>
                </div>
              ) : (
                <p className="text-neutral-400 text-sm">
                  No Dockerfile available
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Deployments Tab */}
        {activeTab === "deployments" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {deployments.length > 0 ? (
              <div className="space-y-4">
                {deployments.map((deployment) => (
                  <div
                    key={deployment._id}
                    className="bg-neutral-800/30 rounded-lg p-6 border border-neutral-700"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <FaServer className="w-5 h-5 text-blue-400" />
                        <div>
                          <h4 className="font-semibold text-white">
                            Deployment {deployment._id?.slice(-6).toUpperCase()}
                          </h4>
                          <p className="text-sm text-neutral-400">
                            {new Date(deployment.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            deployment.status === "running"
                              ? "bg-green-500/20 text-green-300"
                              : deployment.status === "failed"
                                ? "bg-red-500/20 text-red-300"
                                : "bg-yellow-500/20 text-yellow-300"
                          }`}
                        >
                          {deployment.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <div className="text-xs text-neutral-400 mb-1">
                          Image
                        </div>
                        <div className="text-sm font-mono text-white break-all">
                          {deployment.docker?.imageName}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-400 mb-1">
                          Container
                        </div>
                        <div className="text-sm font-mono text-white break-all">
                          {deployment.docker?.containerId?.slice(0, 12)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-400 mb-1">URL</div>
                        <a
                          href={`https://${deployment.subdomain}.deployio.tech`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          {deployment.subdomain}.deployio.tech
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FaBox className="w-8 h-8 text-neutral-500 mx-auto mb-3" />
                <p className="text-neutral-400 mb-4">
                  No deployments yet. Start your first deployment to see it
                  here.
                </p>
                {canAddDeployment && (
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                    Start Deployment
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
