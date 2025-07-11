import { FaCode, FaDocker, FaServer, FaCloud } from "react-icons/fa";
import { FiZap, FiPackage, FiSettings } from "react-icons/fi";

const EditorSidebar = ({ workspace }) => {
  // Get DevOps file type and recommendations
  const getDevOpsAnalysis = (fileName) => {
    if (!fileName) return null;

    const lowercaseName = fileName.toLowerCase();

    if (lowercaseName.includes("dockerfile")) {
      return {
        type: "Docker Configuration",
        icon: FaDocker,
        color: "text-blue-400",
        tips: [
          "Use multi-stage builds for smaller images",
          "Run as non-root user for security",
          "Add health checks for reliability",
          "Use .dockerignore for build optimization",
        ],
      };
    }

    if (lowercaseName.includes("docker-compose")) {
      return {
        type: "Container Orchestration",
        icon: FaServer,
        color: "text-green-400",
        tips: [
          "Define networks for service communication",
          "Use environment variables for configuration",
          "Set resource limits for containers",
          "Implement proper service dependencies",
        ],
      };
    }

    if (lowercaseName.includes("terraform") || lowercaseName.endsWith(".tf")) {
      return {
        type: "Infrastructure as Code",
        icon: FaCloud,
        color: "text-purple-400",
        tips: [
          "Use modules for reusable infrastructure",
          "Implement remote state management",
          "Tag resources for better organization",
          "Use workspaces for environments",
        ],
      };
    }

    if (lowercaseName.includes("nginx") || lowercaseName.includes("apache")) {
      return {
        type: "Web Server Configuration",
        icon: FaServer,
        color: "text-orange-400",
        tips: [
          "Enable gzip compression",
          "Configure SSL/TLS properly",
          "Set up rate limiting",
          "Implement security headers",
        ],
      };
    }

    if (
      lowercaseName.includes("package.json") ||
      lowercaseName.includes("requirements.txt")
    ) {
      return {
        type: "Dependency Management",
        icon: FiPackage,
        color: "text-cyan-400",
        tips: [
          "Keep dependencies up to date",
          "Use exact versions for production",
          "Audit for security vulnerabilities",
          "Minimize dependency count",
        ],
      };
    }

    if (lowercaseName.includes(".yml") || lowercaseName.includes(".yaml")) {
      return {
        type: "Configuration File",
        icon: FiSettings,
        color: "text-yellow-400",
        tips: [
          "Validate YAML syntax",
          "Use consistent indentation",
          "Add comments for clarity",
          "Secure sensitive data with secrets",
        ],
      };
    }

    return {
      type: "Source Code",
      icon: FaCode,
      color: "text-neutral-400",
      tips: [
        "Follow coding best practices",
        "Add comprehensive documentation",
        "Implement proper error handling",
        "Write unit tests for coverage",
      ],
    };
  };

  const analysis = workspace.activeFile
    ? getDevOpsAnalysis(workspace.activeFile.name)
    : null;

  return (
    <div
      className="h-full overflow-y-auto"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "#525252 #262626",
      }}
    >
      <div className="p-4 space-y-4 min-h-full">
        <div className="text-xs text-neutral-400 uppercase tracking-wide font-medium body">
          DevOps Analysis
        </div>
        {workspace.activeFile && analysis ? (
          <div className="space-y-4">
            {/* DevOps File Analysis */}
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <analysis.icon className={`w-4 h-4 ${analysis.color}`} />
                <div className="text-sm font-semibold text-white heading">
                  {analysis.type}
                </div>
              </div>
              <div className="text-xs text-neutral-300 body leading-relaxed mb-3">
                File:{" "}
                <span className="text-cyan-400 font-medium">
                  {workspace.activeFile.name}
                </span>
              </div>
              {workspace.activeFile.size && (
                <div className="text-xs text-neutral-300 body leading-relaxed">
                  Size: {(workspace.activeFile.size / 1024).toFixed(1)} KB
                </div>
              )}
            </div>

            {/* DevOps Best Practices */}
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <FiZap className="w-4 h-4 text-yellow-400" />
                <div className="text-sm font-semibold text-white heading">
                  Best Practices
                </div>
              </div>
              <div className="space-y-2">
                {analysis.tips.map((tip, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-xs text-neutral-300 body leading-relaxed"
                  >
                    <div className="w-1 h-1 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Coming Soon Badge for DeployBot Analysis */}
            <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <span className="px-2 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-xs text-blue-300 font-medium">
                  Coming Soon
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <FiZap className="w-4 h-4 text-blue-400" />
                <div className="text-sm font-semibold text-white heading">
                  DeployBot Analysis
                </div>
              </div>
              <div className="text-xs text-neutral-400 body leading-relaxed">
                AI-powered code analysis and DevOps recommendations will be
                available here.
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <FiZap className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <div className="text-sm text-neutral-400 body mb-2">
              No file selected
            </div>
            <div className="text-xs text-neutral-500 body">
              Select a file from the explorer to get DevOps insights and
              analysis
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorSidebar;
