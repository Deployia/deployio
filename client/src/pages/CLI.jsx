import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  FaCode,
  FaCopy,
  FaDownload,
  FaTerminal,
  FaRocket,
  FaServer,
  FaCloud,
  FaCheck,
  FaPlay,
  FaBook,
  FaGithub,
} from "react-icons/fa";
import SEO from "../components/SEO";
import { toast } from "react-hot-toast";

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
      toast.success("Copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy to clipboard");
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
      <SEO
        title="CLI Tools - Deployio"
        description="Generate CLI commands, manage deployments, and streamline your workflow with Deployio CLI tools."
        keywords="CLI, command line, deployment, tools, generator, terminal"
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
                <FaTerminal className="text-blue-600" />
                CLI Tools
              </h1>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Generate commands, manage deployments, and streamline your
                workflow with powerful CLI tools
              </p>
            </motion.div>

            {/* Tab Navigation */}
            <motion.div variants={itemVariants} className="flex justify-center">
              <div className="bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab("generator")}
                  className={`px-6 py-2 rounded-md transition-colors ${
                    activeTab === "generator"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Command Generator
                </button>
                <button
                  onClick={() => setActiveTab("installation")}
                  className={`px-6 py-2 rounded-md transition-colors ${
                    activeTab === "installation"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Installation
                </button>
                <button
                  onClick={() => setActiveTab("commands")}
                  className={`px-6 py-2 rounded-md transition-colors ${
                    activeTab === "commands"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <FaCog className="text-blue-600" />
                    Configuration
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Command Type
                      </label>
                      <select
                        value={selectedCommand}
                        onChange={(e) => setSelectedCommand(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {Object.entries(commandTemplates).map(([key, cmd]) => (
                          <option key={key} value={key}>
                            {cmd.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-sm text-gray-500 mt-1">
                        {commandTemplates[selectedCommand]?.description}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Project Name
                      </label>
                      <input
                        type="text"
                        name="projectName"
                        value={formData.projectName}
                        onChange={handleFormChange}
                        placeholder="my-awesome-project"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Environment
                      </label>
                      <select
                        name="environment"
                        value={formData.environment}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="production">Production</option>
                        <option value="staging">Staging</option>
                        <option value="development">Development</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Branch
                      </label>
                      <input
                        type="text"
                        name="branch"
                        value={formData.branch}
                        onChange={handleFormChange}
                        placeholder="main"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {selectedCommand === "build" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Build Command
                          </label>
                          <input
                            type="text"
                            name="buildCommand"
                            value={formData.buildCommand}
                            onChange={handleFormChange}
                            placeholder="npm run build"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Output Directory
                          </label>
                          <input
                            type="text"
                            name="outputDir"
                            value={formData.outputDir}
                            onChange={handleFormChange}
                            placeholder="dist"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </>
                    )}

                    <button
                      onClick={generateCommand}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaPlay />
                      Generate Command
                    </button>
                  </div>
                </div>

                {/* Generated Command */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <FaCode className="text-green-600" />
                    Generated Command
                  </h3>

                  <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-green-400">$ </span>
                      <button
                        onClick={() => copyToClipboard(generatedCommand)}
                        className="text-gray-400 hover:text-white transition-colors"
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
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                        Usage Instructions:
                      </h4>
                      <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
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
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Install Deployio CLI
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose your preferred installation method
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {installationSteps.map((step, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">{step.icon}</span>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                          {step.platform}
                        </h3>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm">
                        <div className="flex items-center justify-between">
                          <code className="text-green-400">{step.command}</code>
                          <button
                            onClick={() => copyToClipboard(step.command)}
                            className="text-gray-400 hover:text-white transition-colors ml-2"
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
        </div>
      </div>
    </>
  );
};

export default CLI;
