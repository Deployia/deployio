import { FaCode, FaExclamationTriangle, FaLightbulb, FaShieldAlt } from "react-icons/fa";
import { useOutletContext } from "react-router-dom";

const InfoCard = ({ title, children }) => (
  <div className="bg-neutral-900/60 border border-neutral-800/70 rounded-xl p-4">
    <h4 className="text-sm font-semibold text-gray-300 mb-3">{title}</h4>
    {children}
  </div>
);

const formatDisplayValue = (value) => {
  if (value == null || value === "") return "N/A";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => formatDisplayValue(item)).join(", ");
  }
  return JSON.stringify(value);
};

const getDockerfileDisplay = (dockerfile) => {
  if (!dockerfile) return "No Dockerfile stored on this project yet.";
  if (typeof dockerfile === "string") return dockerfile;
  if (typeof dockerfile === "object") {
    const content = dockerfile.content;
    if (typeof content === "string" && content.trim()) return content;
    const path = dockerfile.path || "Dockerfile";
    const valid = dockerfile.isValid ? "valid" : "missing or invalid";
    return `# Path: ${path} (${valid})\n# No Dockerfile content stored on this project.`;
  }
  return String(dockerfile);
};

const KV = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3 py-1.5 border-b border-neutral-800/70 last:border-b-0">
    <span className="text-xs text-gray-400">{label}</span>
    <span className="text-sm text-white text-right break-words">
      {formatDisplayValue(value)}
    </span>
  </div>
);

const ListBlock = ({ title, icon, items, emptyText }) => (
  <div className="rounded-xl border border-neutral-800/70 bg-neutral-900/60 p-4">
    <h3 className="text-white font-semibold flex items-center gap-2 mb-2">
      {icon}
      {title}
    </h3>
    {items?.length ? (
      <ul className="text-sm text-gray-200 space-y-2">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>- {typeof item === "string" ? item : JSON.stringify(item)}</li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-gray-400">{emptyText}</p>
    )}
  </div>
);

const ProjectAnalysis = ({ project: projectProp }) => {
  const outletContext = useOutletContext?.() || {};
  const project = projectProp || outletContext.project;
  const analysis = project?.aiAnalysis || project?.analysis || {};
  const detectedConfig = analysis.detectedConfig || {};
  const insights = analysis.insights || {};
  const tech = analysis.technologyStack || {};
  const runtime = project?.deployment?.runtime || {};
  const stats = project?.statistics || {};
  const settings = project?.settings || {};
  const repo = project?.repository || {};
  const envs = project?.deployment?.environment || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
          <p className="text-xs uppercase text-purple-300">Confidence</p>
          <p className="text-2xl text-white font-semibold">
            {Math.round((analysis.confidence || 0) * 100)}%
          </p>
          <p className="text-sm text-purple-200">{analysis.approach || "Unknown"}</p>
        </div>
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
          <p className="text-xs uppercase text-blue-300">Framework</p>
          <p className="text-xl text-white font-semibold">
            {analysis.technologyStack?.framework || "N/A"}
          </p>
          <p className="text-sm text-blue-200">
            Runtime: {analysis.technologyStack?.runtime || "N/A"}
          </p>
        </div>
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
          <p className="text-xs uppercase text-green-300">Build Port</p>
          <p className="text-2xl text-white font-semibold">{detectedConfig.port || "N/A"}</p>
          <p className="text-sm text-green-200">Install: {detectedConfig.installCommand || "N/A"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InfoCard title="Technology Stack">
          <KV label="Framework" value={tech.framework} />
          <KV label="Build Tool" value={tech.buildTool} />
          <KV label="Package Manager" value={tech.packageManager} />
          <KV label="Runtime" value={tech.runtime} />
          <KV label="Version" value={tech.version} />
          <div className="pt-2">
            <p className="text-xs text-gray-400 mb-1">Dependencies</p>
            <div className="flex flex-wrap gap-2">
              {tech.dependencies?.length ? (
                tech.dependencies.map((dependency) => (
                  <span
                    key={dependency}
                    className="text-xs px-2 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-200"
                  >
                    {dependency}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-400">No dependencies detected</span>
              )}
            </div>
          </div>
        </InfoCard>
        <InfoCard title="Detected Configuration">
          <KV label="Install Command" value={detectedConfig.installCommand} />
          <KV label="Build Command" value={detectedConfig.buildCommand} />
          <KV label="Start Command" value={detectedConfig.startCommand} />
          <KV label="Port" value={detectedConfig.port} />
        </InfoCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ListBlock
          title="Recommendations"
          icon={<FaLightbulb className="w-4 h-4 text-green-300" />}
          items={insights.recommendations}
          emptyText="No recommendations."
        />
        <ListBlock
          title="Warnings"
          icon={<FaExclamationTriangle className="w-4 h-4 text-yellow-300" />}
          items={insights.warnings}
          emptyText="No warnings."
        />
        <ListBlock
          title="Optimizations"
          icon={<FaShieldAlt className="w-4 h-4 text-blue-300" />}
          items={insights.optimizations}
          emptyText="No optimizations."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InfoCard title="Repository">
          <KV label="URL" value={repo.url} />
          <KV label="Provider" value={repo.provider} />
          <KV label="Owner/Name" value={repo.owner && repo.name ? `${repo.owner}/${repo.name}` : null} />
          <KV label="Branch" value={repo.branch} />
          <KV label="Access" value={repo.accessLevel} />
          <KV label="Private" value={repo.isPrivate ? "Yes" : "No"} />
        </InfoCard>
        <InfoCard title="Runtime Configuration">
          <KV label="Platform" value={runtime.platform} />
          <KV label="Memory" value={runtime.memory} />
          <KV label="CPU" value={runtime.cpu} />
          <KV label="Instances" value={runtime.instances} />
          <KV label="Health Path" value={runtime.healthCheck?.path} />
        </InfoCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InfoCard title="Project Statistics">
          <KV label="Total Deployments" value={stats.totalDeployments} />
          <KV label="Successful Deployments" value={stats.successfulDeployments} />
          <KV label="Failed Deployments" value={stats.failedDeployments} />
          <KV label="Uptime" value={stats.uptime != null ? `${stats.uptime}%` : null} />
          <KV
            label="Last Deployment"
            value={stats.lastDeployment ? new Date(stats.lastDeployment).toLocaleString() : null}
          />
        </InfoCard>
        <InfoCard title="Project Settings">
          <KV
            label="Auto Deploy"
            value={settings.autoDeployment?.enabled ? "Enabled" : "Disabled"}
          />
          <KV label="Auto Deploy Branch" value={settings.autoDeployment?.branch} />
          <KV
            label="Notifications (Email)"
            value={settings.notifications?.email ? "Enabled" : "Disabled"}
          />
          <KV
            label="SSL Enabled"
            value={settings.advanced?.sslEnabled ? "Yes" : "No"}
          />
        </InfoCard>
      </div>

      <div className="bg-neutral-900/60 border border-neutral-800/70 rounded-xl p-4">
        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
          <FaCode className="w-4 h-4 text-orange-300" />
          Config Files
        </h3>
        {project?.deployment?.dockerfile?.path && (
          <p className="text-xs text-gray-400 mb-2">
            Path:{" "}
            <code className="text-orange-200">{project.deployment.dockerfile.path}</code>
            {project.deployment.dockerfile.isValid === false && (
              <span className="ml-2 text-amber-400">(not validated)</span>
            )}
          </p>
        )}
        <pre className="text-xs text-gray-200 whitespace-pre-wrap break-words mb-3 font-mono bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/50 max-h-96 overflow-auto">
          {getDockerfileDisplay(project?.deployment?.dockerfile)}
        </pre>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <InfoCard title="Build Config">
            <KV label="Install" value={project?.deployment?.buildConfig?.installCommand} />
            <KV label="Build" value={project?.deployment?.buildConfig?.buildCommand} />
            <KV label="Start" value={project?.deployment?.buildConfig?.startCommand} />
            <KV label="Port" value={project?.deployment?.buildConfig?.port} />
          </InfoCard>
          <InfoCard title="Environment Variables by Target">
            {["production", "staging", "development"].map((env) => (
              <div key={env} className="mb-3 last:mb-0">
                <p className="text-xs uppercase text-gray-400 mb-1">{env}</p>
                {envs[env]?.length ? (
                  <div className="space-y-1">
                    {envs[env].map((item, index) => (
                      <div key={`${env}-${index}`} className="text-xs text-gray-200">
                        {item.key}: {item.isSecret ? "********" : item.value}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No variables configured</p>
                )}
              </div>
            ))}
          </InfoCard>
        </div>
      </div>
    </div>
  );
};

export default ProjectAnalysis;
