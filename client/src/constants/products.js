import {
  FaRocket,
  FaCode,
  FaCloud,
  FaShieldAlt,
  FaCogs,
  FaBrain,
  FaPlay,
  FaCloudUploadAlt,
  FaLayerGroup,
  FaBolt,
  FaCheckCircle,
  FaLock,
  FaChartLine,
} from "react-icons/fa";

// Product Timeline & Status
export const PRODUCT_PHASES = {
  PHASE_1: {
    period: "Available Now - Till Late July 2025",
    products: ["code-analysis", "devops-automation"],
  },
  PHASE_2: {
    period: "Q1 2026 - Till Feb 2026",
    products: ["cloud-integration"],
  },
  PHASE_3: {
    period: "Q2 2026 - Till June 2026",
    products: ["ai-deployment", "security-shield"],
  },
};

// Product Configurations
export const PRODUCTS_CONFIG = {
  "code-analysis": {
    id: "code-analysis",
    available: true,
    comingSoon: null,
    hero: {
      badge: {
        icon: FaCode,
        text: "Smart Code Intelligence",
      },
      title: "Intelligent Code",
      subtitle: "Analysis Engine",
      description:
        "AI-powered code analysis that detects your tech stack, analyzes dependencies, and generates optimized deployment configurations automatically.",
      primaryCTA: {
        text: "Start Analysis",
        icon: FaCode,
        onClick: () => window.open("/dashboard/projects", "_blank"),
      },
      secondaryCTA: {
        text: "View Demo",
        icon: FaPlay,
        onClick: () => window.open("/docs/code-analysis", "_blank"),
      },
      gradient: "from-blue-400 via-cyan-400 to-blue-600",
    },
    stats: [
      { label: "Stacks Detected", value: "50+", icon: FaCode },
      { label: "Analysis Accuracy", value: "96%", icon: FaBrain },
      { label: "Config Generation", value: "< 30s", icon: FaBolt },
      { label: "Dependencies Mapped", value: "10K+", icon: FaLayerGroup },
    ],
    cta: {
      title: "Ready to Analyze Your Code?",
      description:
        "Join thousands of developers using AI-powered code analysis for smarter deployments",
      primaryButton: {
        text: "Start Free Analysis",
        onClick: () => window.open("/dashboard/projects", "_blank"),
      },
      secondaryButton: {
        text: "View Documentation",
        onClick: () => window.open("/docs/code-analysis", "_blank"),
      },
      gradientClasses: "from-blue-600 to-cyan-600",
    },
  },

  "devops-automation": {
    id: "devops-automation",
    available: true,
    comingSoon: null,
    hero: {
      badge: {
        icon: FaCogs,
        text: "Complete CI/CD Automation",
      },
      title: "Automate Your",
      subtitle: "DevOps Pipeline",
      description:
        "Generate complete GitHub Actions workflows, manage multi-environment deployments, and optimize build processes with zero configuration required.",
      primaryCTA: {
        text: "Setup Pipeline",
        icon: FaCogs,
        onClick: () => window.open("/dashboard/projects", "_blank"),
      },
      secondaryCTA: {
        text: "View Templates",
        icon: FaPlay,
        onClick: () => window.open("/docs/devops-automation", "_blank"),
      },
      gradient: "from-purple-400 via-blue-400 to-indigo-400",
    },
    stats: [
      { label: "Pipeline Templates", value: "100+", icon: FaCogs },
      { label: "Build Time Reduction", value: "70%", icon: FaBolt },
      { label: "Deployment Success", value: "99.5%", icon: FaRocket },
      { label: "Quality Gate Accuracy", value: "98%", icon: FaCheckCircle },
    ],
    cta: {
      title: "Ready to Automate Your DevOps?",
      description:
        "Join thousands of developers deploying faster with automated CI/CD pipelines",
      primaryButton: {
        text: "Create Pipeline",
        onClick: () => window.open("/dashboard/projects", "_blank"),
      },
      secondaryButton: {
        text: "View Templates",
        onClick: () => window.open("/docs/devops-automation", "_blank"),
      },
      gradientClasses: "from-purple-600 to-indigo-600",
    },
  },

  "cloud-integration": {
    id: "cloud-integration",
    available: false,
    comingSoon: "Q1 2026",
    hero: {
      badge: {
        icon: FaCloud,
        text: "Multi-Cloud Platform",
      },
      comingSoonBadge: {
        text: "Coming Q1 2026",
        highlight: true,
      },
      title: "Deploy Anywhere,",
      subtitle: "Scale Everywhere",
      description:
        "Connect to any cloud provider with intelligent deployment strategies. From AWS to Google Cloud, Azure to DigitalOcean - deploy with confidence across all major platforms.",
      primaryCTA: {
        text: "Join Waitlist",
        icon: FaCloudUploadAlt,
        onClick: () =>
          window.open("https://forms.gle/deployio-cloud-waitlist", "_blank"),
      },
      secondaryCTA: {
        text: "Learn More",
        icon: FaPlay,
        onClick: () => window.open("/docs/cloud-preview", "_blank"),
      },
      gradient: "from-cyan-400 via-blue-400 to-purple-400",
    },
    stats: [
      { label: "Cloud Providers", value: "15+", icon: FaCloud },
      { label: "Deployment Success", value: "99.8%", icon: FaRocket },
      { label: "Average Deploy Time", value: "2.1min", icon: FaCogs },
      { label: "Cost Optimization", value: "40%", icon: FaChartLine },
    ],
    cta: {
      title: "Ready to Deploy to the Cloud?",
      description:
        "Join thousands of developers deploying faster across multiple cloud providers",
      primaryButton: {
        text: "Join Waitlist",
        onClick: () =>
          window.open("https://forms.gle/deployio-cloud-waitlist", "_blank"),
      },
      secondaryButton: {
        text: "View Cloud Preview",
        onClick: () => window.open("/docs/cloud-preview", "_blank"),
      },
      gradientClasses: "from-cyan-600 to-blue-600",
    },
  },

  "ai-deployment": {
    id: "ai-deployment",
    available: false,
    comingSoon: "Q2 2026",
    hero: {
      badge: {
        icon: FaBrain,
        text: "AI-Powered DevOps Pipeline",
      },
      comingSoonBadge: {
        text: "Coming Q2 2026",
        highlight: true,
      },
      title: "Deploy Smarter,",
      subtitle: "Not Harder",
      description:
        "Let AI handle your entire deployment workflow. From detecting your tech stack to generating Dockerfiles and setting up CI/CD - we automate what takes hours into minutes.",
      primaryCTA: {
        text: "Join Waitlist",
        icon: FaRocket,
        onClick: () =>
          window.open("https://forms.gle/deployio-ai-waitlist", "_blank"),
      },
      secondaryCTA: {
        text: "View AI Preview",
        icon: FaBrain,
        onClick: () => window.open("/docs/ai-preview", "_blank"),
      },
      gradient: "from-green-400 via-blue-400 to-purple-400",
    },
    stats: [
      { label: "AI Accuracy", value: "94%", icon: FaBrain },
      { label: "Time Saved", value: "85%", icon: FaBolt },
      { label: "Auto Configs", value: "1000+", icon: FaCogs },
      { label: "Success Rate", value: "97%", icon: FaRocket },
    ],
    cta: {
      title: "Ready to Automate Your Deployments?",
      description:
        "Join thousands of developers already deploying faster with AI-powered automation",
      primaryButton: {
        text: "Join Waitlist",
        onClick: () =>
          window.open("https://forms.gle/deployio-ai-waitlist", "_blank"),
      },
      secondaryButton: {
        text: "View AI Preview",
        onClick: () => window.open("/docs/ai-preview", "_blank"),
      },
      gradientClasses: "from-green-600 to-blue-600",
    },
  },

  "security-shield": {
    id: "security-shield",
    available: false,
    comingSoon: "Q2 2026",
    hero: {
      badge: {
        icon: FaShieldAlt,
        text: "Enterprise-Grade Security",
      },
      comingSoonBadge: {
        text: "Coming Q2 2026",
        highlight: true,
      },
      title: "Deploy with",
      subtitle: "Military-Grade Security",
      description:
        "Every deployment automatically includes comprehensive security scanning, threat detection, and compliance validation. Deploy confidently knowing your applications are protected by industry-leading security measures.",
      primaryCTA: {
        text: "Join Waitlist",
        icon: FaShieldAlt,
        onClick: () =>
          window.open("https://forms.gle/deployio-security-waitlist", "_blank"),
      },
      secondaryCTA: {
        text: "Security Preview",
        icon: FaPlay,
        onClick: () => window.open("/docs/security-preview", "_blank"),
      },
      gradient: "from-red-400 via-orange-400 to-yellow-400",
    },
    stats: [
      { label: "Security Scans", value: "10,000+", icon: FaShieldAlt },
      { label: "Vulnerabilities Blocked", value: "99.8%", icon: FaLock },
      { label: "Compliance Rate", value: "100%", icon: FaCheckCircle },
      { label: "Mean Response Time", value: "<5min", icon: FaBolt },
    ],
    cta: {
      title: "Ready to Secure Your Deployments?",
      description:
        "Join thousands of developers deploying with enterprise-grade security built-in",
      primaryButton: {
        text: "Join Waitlist",
        onClick: () =>
          window.open("https://forms.gle/deployio-security-waitlist", "_blank"),
      },
      secondaryButton: {
        text: "Security Preview",
        onClick: () => window.open("/docs/security-preview", "_blank"),
      },
      gradientClasses: "from-red-600 to-orange-600",
    },
  },
};

// Helper functions
export const getProductConfig = (productId) => PRODUCTS_CONFIG[productId];
export const getAvailableProducts = () =>
  Object.values(PRODUCTS_CONFIG).filter((p) => p.available);
export const getComingSoonProducts = () =>
  Object.values(PRODUCTS_CONFIG).filter((p) => !p.available);
export const getProductsByPhase = (phase) =>
  PRODUCT_PHASES[phase]?.products.map((id) => PRODUCTS_CONFIG[id]) || [];
