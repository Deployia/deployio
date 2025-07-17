import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  FaCode,
  FaCopy,
  FaTerminal,
  FaPlay,
  FaBook,
  FaGithub,
  FaCog,
  FaRocket,
  FaExclamationCircle,
} from "react-icons/fa";
import SEO from "@components/SEO";

const CLI = () => {
  const [selectedCommand, setSelectedCommand] = useState("deploy");
  const [activeTab, setActiveTab] = useState("generator");
  const [formData, setFormData] = useState({
    projectName: "",
    environment: "production",
    branch: "main",
    buildCommand: "npm run build",
    outputDir: "dist",
  });
  const [generatedCommand, setGeneratedCommand] = useState("");
  const codeRef = useRef();

  const commandTemplates = {
    deploy: {
      label: "Deploy Project",
      description: "Deploy your project to the specified environment",
      template:
        "deployio deploy --project={projectName} --env={environment} --branch={branch}",
    },
    build: {
      label: "Build Project",
      description: "Build your project with custom commands",
      template:
        "deployio build --project={projectName} --command='{buildCommand}' --output={outputDir}",
    },
    logs: {
      label: "View Logs",
      description: "View deployment logs and monitoring data",
      template:
        "deployio logs --project={projectName} --env={environment} --tail=100",
    },
    rollback: {
      label: "Rollback Deployment",
      description: "Rollback to a previous deployment version",
      template:
        "deployio rollback --project={projectName} --env={environment} --version=previous",
    },
    status: {
      label: "Check Status",
      description: "Check the status of your deployments",
      template: "deployio status --project={projectName} --env={environment}",
    },
  };

  const quickCommands = [
    {
      title: "Initialize Project",
      command: "deployio init",
      description: "Initialize a new Deployio project in the current directory",
    },
    {
      title: "Login to Deployio",
      command: "deployio login",
      description: "Authenticate with your Deployio account",
    },
    {
      title: "List Projects",
      command: "deployio list",
      description: "List all your projects and their status",
    },
    {
      title: "Environment Variables",
      command: "deployio env:set KEY=value",
      description: "Set environment variables for your project",
    },
    {
      title: "Domain Management",
      command: "deployio domain:add example.com",
      description: "Add a custom domain to your deployment",
    },
    {
      title: "Health Check",
      command: "deployio health",
      description: "Check the health of your deployments",
    },
  ];

  const installationSteps = [
    {
      platform: "npm",
      command: "npm install -g @deployio/cli",
      icon: "📦",
    },
    {
      platform: "yarn",
      command: "yarn global add @deployio/cli",
      icon: "🧶",
    },
    {
      platform: "curl",
      command: "curl -fsSL https://get.deployio.dev | sh",
      icon: "🌐",
    },
    {
      platform: "homebrew",
      command: "brew install deployio/tap/deployio",
      icon: "🍺",
    },
  ];

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateCommand = () => {
    const template = commandTemplates[selectedCommand]?.template || "";
    let command = template;

    Object.entries(formData).forEach(([key, value]) => {
      command = command.replace(`{${key}}`, value || `<${key}>`);
    });

    setGeneratedCommand(command);
  };
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log("Copied to clipboard!");
      // Could trigger a visual indicator here instead of toast
    } catch {
      console.error("Failed to copy to clipboard");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <>
      {" "}
      <SEO page="cli" />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <FaTerminal className="text-blue-400" />
              CLI Generator
            </h1>
            <div className="px-3 py-1 bg-orange-500/20 text-orange-400 text-sm rounded-full border border-orange-500/30 flex items-center gap-2">
              <FaExclamationCircle className="w-3 h-3" />
              Coming Soon
            </div>
          </div>
          <p className="text-gray-400 text-lg">
            Generate and manage CLI commands for your deployments
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div variants={itemVariants} className="flex justify-center">
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("generator")}
              className={`px-6 py-2 rounded-md transition-all duration-200 ${
                activeTab === "generator"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-400 hover:text-white hover:bg-neutral-800/50"
              }`}
            >
              Command Generator
            </button>
            <button
              onClick={() => setActiveTab("installation")}
              className={`px-6 py-2 rounded-md transition-all duration-200 ${
                activeTab === "installation"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-400 hover:text-white hover:bg-neutral-800/50"
              }`}
            >
              Installation
            </button>
            <button
              onClick={() => setActiveTab("commands")}
              className={`px-6 py-2 rounded-md transition-all duration-200 ${
                activeTab === "commands"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-400 hover:text-white hover:bg-neutral-800/50"
              }`}
            >
              Quick Commands
            </button>
          </div>
        </motion.div>

        {/* Command Generator Tab */}
        {activeTab === "generator" && (
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Configuration Form */}
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 hover:border-neutral-700/50 transition-all duration-200">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FaCog className="w-4 h-4 text-blue-400" />
                </div>
                Configuration
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Command Type
                  </label>
                  <select
                    value={selectedCommand}
                    onChange={(e) => setSelectedCommand(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-800/50 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    {Object.entries(commandTemplates).map(([key, cmd]) => (
                      <option key={key} value={key}>
                        {cmd.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-400 mt-1">
                    {commandTemplates[selectedCommand]?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleFormChange}
                    placeholder="my-awesome-project"
                    className="w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-800/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Environment
                  </label>
                  <select
                    name="environment"
                    value={formData.environment}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-800/50 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Branch
                  </label>
                  <input
                    type="text"
                    name="branch"
                    value={formData.branch}
                    onChange={handleFormChange}
                    placeholder="main"
                    className="w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-800/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>

                {selectedCommand === "build" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Build Command
                      </label>
                      <input
                        type="text"
                        name="buildCommand"
                        value={formData.buildCommand}
                        onChange={handleFormChange}
                        placeholder="npm run build"
                        className="w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-800/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Output Directory
                      </label>
                      <input
                        type="text"
                        name="outputDir"
                        value={formData.outputDir}
                        onChange={handleFormChange}
                        placeholder="dist"
                        className="w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-800/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      />
                    </div>
                  </>
                )}

                <button
                  onClick={generateCommand}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                >
                  <FaPlay />
                  Generate Command
                </button>
              </div>
            </div>

            {/* Generated Command */}
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 hover:border-neutral-700/50 transition-all duration-200">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <FaCode className="w-4 h-4 text-green-400" />
                </div>
                Generated Command
              </h3>

              <div className="bg-neutral-800/80 rounded-lg p-4 font-mono text-sm border border-neutral-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-400">$ </span>
                  <button
                    onClick={() => copyToClipboard(generatedCommand)}
                    className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-neutral-700/50 rounded"
                    disabled={!generatedCommand}
                  >
                    <FaCopy />
                  </button>
                </div>
                <code ref={codeRef} className="text-white block">
                  {generatedCommand ||
                    "Click 'Generate Command' to see the CLI command"}
                </code>
              </div>

              {generatedCommand && (
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="font-medium text-blue-400 mb-2 flex items-center gap-2">
                    <FaRocket className="w-4 h-4" />
                    Usage Instructions:
                  </h4>
                  <ol className="text-sm text-gray-300 space-y-1">
                    <li>1. Copy the command above</li>
                    <li>2. Open your terminal</li>
                    <li>3. Navigate to your project directory</li>
                    <li>4. Paste and run the command</li>
                  </ol>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Installation Tab */}
        {activeTab === "installation" && (
          <motion.div
            variants={itemVariants}
            className="max-w-4xl mx-auto space-y-8"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Install DeployIO CLI
              </h2>
              <p className="text-gray-400">
                Choose your preferred installation method
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {installationSteps.map((step, index) => (
                <div
                  key={index}
                  className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 hover:border-neutral-700/50 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{step.icon}</span>
                    <h3 className="text-lg font-semibold text-white capitalize">
                      {step.platform}
                    </h3>
                  </div>
                  <div className="bg-neutral-800/80 rounded-lg p-3 font-mono text-sm border border-neutral-700/50">
                    <div className="flex items-center justify-between">
                      <code className="text-green-400">{step.command}</code>
                      <button
                        onClick={() => copyToClipboard(step.command)}
                        className="text-gray-400 hover:text-white transition-colors ml-2 p-1 hover:bg-neutral-700/50 rounded"
                      >
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Verify Installation
              </h3>
              <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm mb-4">
                <code className="text-green-400">deployio --version</code>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Run this command to verify that Deployio CLI is installed
                correctly.
              </p>
            </div>
          </motion.div>
        )}

        {/* Quick Commands Tab */}
        {activeTab === "commands" && (
          <motion.div variants={itemVariants} className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Quick Commands
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Common CLI commands for everyday tasks
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quickCommands.map((cmd, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {cmd.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {cmd.description}
                  </p>
                  <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm">
                    <div className="flex items-center justify-between">
                      <code className="text-green-400">{cmd.command}</code>
                      <button
                        onClick={() => copyToClipboard(cmd.command)}
                        className="text-gray-400 hover:text-white transition-colors ml-2"
                      >
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <div className="flex justify-center gap-4">
                <a
                  href="/docs"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaBook />
                  View Documentation
                </a>
                <a
                  href="https://github.com/deployio/cli"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                >
                  <FaGithub />
                  View on GitHub
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </>
  );
};

export default CLI;
