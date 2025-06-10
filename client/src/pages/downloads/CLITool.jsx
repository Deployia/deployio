import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaDownload,
  FaTerminal,
  FaWindows,
  FaApple,
  FaLinux,
  FaCode,
  FaCopy,
  FaCheck,
  FaBook,
  FaRocket,
  FaGithub,
  FaExternalLinkAlt,
} from "react-icons/fa";
import SEO from "@components/SEO";

const CLIDownload = () => {
  const [copiedCommand, setCopiedCommand] = useState("");
  const [selectedOS, setSelectedOS] = useState("windows");

  const downloadLinks = {
    windows: {
      x64: "https://releases.deployio.com/cli/windows/deployio-cli-x64.exe",
      x32: "https://releases.deployio.com/cli/windows/deployio-cli-x86.exe",
    },
    macos: {
      intel: "https://releases.deployio.com/cli/macos/deployio-cli-intel.dmg",
      m1: "https://releases.deployio.com/cli/macos/deployio-cli-m1.dmg",
      universal:
        "https://releases.deployio.com/cli/macos/deployio-cli-universal.dmg",
    },
    linux: {
      deb: "https://releases.deployio.com/cli/linux/deployio-cli.deb",
      rpm: "https://releases.deployio.com/cli/linux/deployio-cli.rpm",
      tar: "https://releases.deployio.com/cli/linux/deployio-cli.tar.gz",
    },
  };

  const installCommands = {
    windows: {
      powershell: "iwr https://get.deployio.com/cli.ps1 | iex",
      chocolatey: "choco install deployio-cli",
      scoop: "scoop install deployio-cli",
    },
    macos: {
      homebrew: "brew install deployio/tap/deployio-cli",
      curl: "curl -fsSL https://get.deployio.com/cli.sh | sh",
    },
    linux: {
      curl: "curl -fsSL https://get.deployio.com/cli.sh | sh",
      apt: "sudo apt install deployio-cli",
      yum: "sudo yum install deployio-cli",
      snap: "sudo snap install deployio-cli",
    },
  };

  const quickCommands = [
    {
      command: "deployio login",
      description: "Authenticate with your Deployio account",
    },
    {
      command: "deployio init",
      description: "Initialize a new project in the current directory",
    },
    {
      command: "deployio deploy",
      description: "Deploy your application to production",
    },
    {
      command: "deployio status",
      description: "Check the status of your deployments",
    },
    {
      command: "deployio logs",
      description: "View deployment logs and debugging information",
    },
    {
      command: "deployio rollback",
      description: "Rollback to a previous deployment version",
    },
  ];

  const features = [
    {
      icon: FaRocket,
      title: "One-Command Deploy",
      description: "Deploy your applications with a single command",
    },
    {
      icon: FaTerminal,
      title: "Interactive CLI",
      description: "User-friendly prompts and interactive workflows",
    },
    {
      icon: FaCode,
      title: "Scriptable",
      description: "Integrate seamlessly into your CI/CD pipelines",
    },
    {
      icon: FaBook,
      title: "Rich Documentation",
      description: "Comprehensive help system and examples",
    },
  ];

  const copyToClipboard = (text, commandType) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(commandType);
    setTimeout(() => setCopiedCommand(""), 2000);
  };

  const getOSIcon = (os) => {
    switch (os) {
      case "windows":
        return FaWindows;
      case "macos":
        return FaApple;
      case "linux":
        return FaLinux;
      default:
        return FaTerminal;
    }
  };

  return (
    <>
      <SEO
        title="Download CLI Tool - Deployio Command Line Interface"
        description="Download the Deployio CLI tool for Windows, macOS, and Linux. Deploy your applications from the command line with ease."
        keywords="CLI download, command line tool, deployment CLI, Deployio CLI, terminal deployment"
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <section className="py-20 px-4 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-6">
                <FaTerminal className="w-8 h-8 text-gray-700 dark:text-gray-300" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Deployio CLI Tool
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Deploy, manage, and monitor your applications directly from the
                command line. Available for Windows, macOS, and Linux.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-8">
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                  Latest: v2.1.0
                </span>
                <span>•</span>
                <span>Released June 8, 2025</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* OS Selection */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Choose Your Platform
              </h2>
              <div className="flex justify-center gap-4 mb-8">
                {["windows", "macos", "linux"].map((os) => {
                  const Icon = getOSIcon(os);
                  return (
                    <button
                      key={os}
                      onClick={() => setSelectedOS(os)}
                      className={`flex items-center gap-3 px-6 py-4 rounded-xl font-medium transition-colors ${
                        selectedOS === os
                          ? "bg-blue-500 text-white"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {os.charAt(0).toUpperCase() + os.slice(1)}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Installation Methods */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16"
            >
              {/* Package Managers */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Package Managers (Recommended)
                </h3>
                <div className="space-y-4">
                  {Object.entries(installCommands[selectedOS]).map(
                    ([method, command]) => (
                      <div key={method} className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                            {method}
                          </span>
                          <button
                            onClick={() => copyToClipboard(command, method)}
                            className="flex items-center gap-2 px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            {copiedCommand === method ? (
                              <>
                                <FaCheck className="w-3 h-3 text-green-500" />
                                Copied
                              </>
                            ) : (
                              <>
                                <FaCopy className="w-3 h-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <code className="block p-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200">
                          {command}
                        </code>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Direct Downloads */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Direct Downloads
                </h3>
                <div className="space-y-4">
                  {Object.entries(downloadLinks[selectedOS]).map(
                    ([arch, url]) => (
                      <a
                        key={arch}
                        href={url}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white capitalize">
                            {arch}{" "}
                            {selectedOS === "linux" ? "Package" : "Installer"}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Direct download for {arch} architecture
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                          <FaDownload className="w-4 h-4" />
                          <FaExternalLinkAlt className="w-3 h-3" />
                        </div>
                      </a>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Quick Start Commands */}
        <section className="py-16 px-4 bg-white dark:bg-gray-800">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Quick Start Commands
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Get started with these essential commands
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quickCommands.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <code className="text-sm font-mono text-blue-600 dark:text-blue-400 font-medium">
                      {item.command}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(item.command, `cmd-${index}`)
                      }
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {copiedCommand === `cmd-${index}` ? (
                        <FaCheck className="w-4 h-4 text-green-500" />
                      ) : (
                        <FaCopy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                CLI Features
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Everything you need for command-line deployment management
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="text-center"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-6">
                      <Icon className="w-8 h-8 text-gray-700 dark:text-gray-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Help Section */}
        <section className="py-16 px-4 bg-gray-100 dark:bg-gray-800">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-12 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <FaBook className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Need Help?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Check out our comprehensive documentation and examples to get
                the most out of the Deployio CLI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                  View Documentation
                </button>
                <button className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-semibold transition-colors">
                  <FaGithub className="w-4 h-4" />
                  View on GitHub
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default CLIDownload;
