import React, { useState } from "react";
import {
  FaTerminal,
  FaDownload,
  FaWindows,
  FaApple,
  FaLinux,
  FaRocket,
  FaCog,
  FaBolt,
  FaBook,
} from "react-icons/fa";
import TabbedCodeExamples from "../../components/downloads/TabbedCodeExamples";
import DownloadHero from "../../components/downloads/DownloadHero";
import DownloadOptions from "../../components/downloads/DownloadOptions";
import DownloadStats from "../../components/downloads/DownloadStats";
import DownloadCTA from "../../components/downloads/DownloadCTA";
import SEO from "@/components/SEO";

const CLITool = () => {
  const [selectedPlatform, setSelectedPlatform] = useState("windows");

  const platforms = [
    {
      id: "windows",
      name: "Windows",
      icon: FaWindows,
      color: "text-blue-400",
      downloadUrl: "#",
      size: "18.2 MB",
      version: "v2.1.0",
      checksums: {
        sha256: "abc123...",
        md5: "def456...",
      },
    },
    {
      id: "macos",
      name: "macOS",
      icon: FaApple,
      color: "text-gray-300",
      downloadUrl: "#",
      size: "16.8 MB",
      version: "v2.1.0",
      checksums: {
        sha256: "ghi789...",
        md5: "jkl012...",
      },
    },
    {
      id: "linux",
      name: "Linux",
      icon: FaLinux,
      color: "text-yellow-400",
      downloadUrl: "#",
      size: "15.4 MB",
      version: "v2.1.0",
      checksums: {
        sha256: "mno345...",
        md5: "pqr678...",
      },
    },
  ];
  // Simplified install methods (2 per platform)
  const installMethods = {
    windows: [
      {
        title: "Windows Installer",
        description: "Direct installer with GUI setup",
        command: "deployio-cli-windows-v2.1.0.exe",
        type: "installer",
      },
      {
        title: "Package Manager",
        description: "Install via Chocolatey or Winget",
        command: "choco install deployio-cli",
        type: "package-manager",
      },
    ],
    macos: [
      {
        title: "DMG Installer",
        description: "Standard macOS disk image installer",
        command: "deployio-cli-macos-v2.1.0.dmg",
        type: "installer",
      },
      {
        title: "Homebrew",
        description: "Install via Homebrew package manager",
        command: "brew install deployio/tap/deployio-cli",
        type: "package-manager",
      },
    ],
    linux: [
      {
        title: "AppImage",
        description: "Portable application for all distributions",
        command: "deployio-cli-linux-v2.1.0.AppImage",
        type: "installer",
      },
      {
        title: "Package Manager",
        description: "Install via apt, dnf, or pacman",
        command: "sudo apt install deployio-cli",
        type: "package-manager",
      },
    ],
  };

  /* UNUSED - const commands = [
    {
      title: "🚀 Initialize New Project",
      command: "deployio init my-awesome-app --template react",
      description: "Set up a new project with intelligent defaults",
    },
    {
      title: "🤖 AI-Powered Analysis (Q1 2026)",
      command: "deployio analyze --ai-insights --performance-check",
      description: "Get AI recommendations for optimal deployment",
    },
    {
      title: "⚡ One-Command Deploy",
      command: "deployio deploy --auto-scale --zero-downtime",
      description: "Deploy with intelligent scaling and zero downtime",
    },
    {
      title: "📊 Smart Monitoring (Q2 2026)",
      command: "deployio monitor --ai-alerts --real-time",
      description: "Monitor with AI-powered alerts and insights",
    },
    {
      title: "� Environment Sync",      command: "deployio env sync --validate --secure",
      description: "Sync environments with validation and security checks",
    },
  ]; */

  /* UNUSED - const features = [
    {
      icon: FaRocket,
      title: "AI-Powered Stack Detection",
      description:
        "Automatically analyzes your repository and intelligently detects your technology stack, dependencies, and optimal deployment strategy.",
      benefits: [
        "Smart framework recognition",
        "Dependency analysis",
        "Optimized Docker generation",
      ],
    },
    {
      icon: FaTerminal,
      title: "Intelligent CLI Assistant",
      description:
        "AI-guided workflows that provide contextual suggestions and automate complex DevOps tasks based on your project structure.",
      benefits: [
        "Context-aware commands",
        "Smart auto-completion",
        "Proactive error prevention",
      ],
    },
    {
      icon: FaCode,
      title: "Auto-Generated CI/CD",
      description:
        "AI generates optimized GitHub Actions workflows, Dockerfiles, and deployment configurations tailored to your specific stack.",
      benefits: [
        "Zero-config pipeline creation",
        "Performance optimizations",
        "Best practice implementation",
      ],
    },
    {
      icon: FaCog,
      title: "Smart Configuration",
      description:
        "AI-driven environment management that automatically configures deployment settings, environment variables, and security policies.",
      benefits: [
        "Intelligent env detection",
        "Automated secret management",
        "Security compliance checks",
      ],
    },
    {
      icon: FaBolt,
      title: "Real-time AI Monitoring",
      description:
        "AI-powered monitoring that predicts issues, optimizes performance, and provides intelligent insights about your deployments.",
      benefits: [
        "Predictive error detection",
        "Performance optimization",
        "Intelligent alerting",
      ],
    },
    {
      icon: FaShieldAlt,
      title: "AI Security Analysis",
      description:
        "Continuous security scanning with AI-powered vulnerability detection and automated security hardening recommendations.",
      benefits: [
        "Automated vulnerability scans",
        "Security best practices",
        "Compliance monitoring",
      ],    },
  ]; */

  const stats = [
    { label: "Downloads", value: "500K+", icon: FaDownload },
    { label: "Commands", value: "25+", icon: FaTerminal },
    { label: "Platforms", value: "3", icon: FaCog },
    { label: "Success Rate", value: "99.9%", icon: FaRocket },
  ];
  const heroProps = {
    badge: {
      icon: FaBolt,
      text: "AI-Powered DevOps CLI",
    },
    title: "Deployio CLI",
    subtitle: "Intelligent DevOps Automation",
    description:
      "Experience the future of deployment automation with AI-powered DevOps tools. The Deployio CLI intelligently analyzes your projects, generates optimized configurations, and deploys to any environment with enterprise-grade reliability.",
    version: "v2.1.3",
    primaryCTA: {
      text: "Join Waitlist",
      icon: FaBolt,
      onClick: () =>
        window.open("https://forms.gle/deployio-cli-waitlist", "_blank"),
    },
    secondaryCTA: {
      text: "Learn More",
      icon: FaBook,
      onClick: () => window.open("/docs/cli-preview", "_blank"),
    },
    gradient: "from-blue-400 via-cyan-400 to-blue-600",
    downloadStats: [
      { label: "Expected Q1 2026", value: "Q1" },
      { label: "Waitlist Members", value: "2.5K+" },
      { label: "Success Rate", value: "99.9%" },
    ],
    visual: (
      <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
        <div className="flex items-center mb-4">
          <div className="flex space-x-2 mr-4">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="text-gray-400 text-sm">~/my-app</div>
        </div>{" "}
        <div className="font-mono text-sm space-y-2">
          <div className="text-cyan-400">$ deployio init</div>
          <div className="text-green-400">
            ✓ Detected MERN Stack application
          </div>
          <div className="text-green-400">✓ Generated deployio.config.js</div>
          <div className="text-green-400">
            ✓ Project initialized successfully
          </div>
          <div className="text-cyan-400 mt-4">$ deployio deploy</div>
          <div className="text-blue-400">🚀 Deploying to production...</div>
          <div className="text-green-400">✓ Build completed in 2m 15s</div>
          <div className="text-green-400">
            ✓ Deployed to{" "}
            <span className="text-yellow-400">https://my-app.deployio.app</span>
          </div>
          <div className="text-cyan-400 animate-pulse">_</div>
        </div>
      </div>
    ),
  };
  const optionsProps = {
    title: "Download Options",
    subtitle: "Choose your platform and installation method",
    platforms,
    selectedPlatform,
    onPlatformChange: setSelectedPlatform,
    installMethods: installMethods[selectedPlatform],
    gradient: "from-blue-400 to-cyan-400",
  };

  // Simplified command examples for TabbedCodeExamples
  const examples = [
    {
      id: "quickstart",
      title: "🚀 Quick Start",
      tabs: [
        {
          id: "cli",
          name: "CLI Commands",
          icon: FaTerminal,
          color: "text-cyan-400",
          code: `# Initialize new project with AI detection
deployio init my-awesome-app --template react

# Deploy with AI optimization and zero downtime
deployio deploy --auto-scale --zero-downtime

# Get AI-powered deployment insights
deployio analyze --ai-insights --performance-check`,
        },
      ],
    },
    {
      id: "monitoring",
      title: "📊 AI Monitoring",
      tabs: [
        {
          id: "cli",
          name: "CLI Commands",
          icon: FaTerminal,
          color: "text-cyan-400",
          code: `# Real-time AI monitoring with smart alerts
deployio monitor --ai-alerts --real-time

# Get detailed deployment status with predictions
deployio status --detailed --predictions

# View AI-optimized performance metrics
deployio metrics --timerange 24h --ai-insights`,
        },
      ],
    },
    {
      id: "management",
      title: "🔧 Smart Management",
      tabs: [
        {
          id: "cli",
          name: "CLI Commands",
          icon: FaTerminal,
          color: "text-cyan-400",
          code: `# Secure environment sync with validation
deployio env sync --validate --secure

# AI-assisted rollback with impact analysis
deployio rollback --version previous --analyze

# Intelligent scaling with predictive algorithms
deployio scale --instances auto --ai-predict`,
        },
      ],
    },
  ];

  const statsProps = {
    title: "CLI Statistics",
    stats,
    gradient: "from-blue-400 to-cyan-400",
  };
  const ctaProps = {
    title: "Ready to Transform Your DevOps?",
    subtitle:
      "Join thousands of developers who are already on the waitlist for the most intelligent CLI tool ever created.",
    primaryText: "Join Waitlist",
    secondaryText: "View Documentation",
    onPrimary: () =>
      window.open("https://forms.gle/deployio-cli-waitlist", "_blank"),
    onSecondary: () => window.open("/docs/cli", "_blank"),
    gradient: "from-blue-400 to-cyan-400",
  };

  return (
    <>
      <SEO
        title="Deployio CLI - Command Line Interface for Developers"
        description="The most powerful deployment CLI for developers. Deploy, manage, and monitor applications from the command line with enterprise-grade reliability."
        keywords="CLI tool, command line, deployment automation, developer tools, DevOps CLI, deployment CLI"
      />

      <div className="min-h-screen">
        <DownloadHero {...heroProps} />
        <div id="install-section">
          <DownloadOptions {...optionsProps} />
        </div>{" "}
        <TabbedCodeExamples
          title="Quick Start Commands"
          subtitle="Get started with these powerful AI-driven commands"
          examples={examples}
          gradient="from-blue-400 to-cyan-400"
        />
        <DownloadStats {...statsProps} />
        <DownloadCTA {...ctaProps} />
      </div>
    </>
  );
};

export default CLITool;
