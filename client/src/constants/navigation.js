import {
  FaRocket,
  FaCode,
  FaCloud,
  FaShieldAlt,
  FaCogs,
  FaBook,
  FaLifeRing,
  FaUsers,
  FaBlog,
  FaDownload,
  FaGithub,
  FaTachometerAlt,
  FaProjectDiagram,
  FaServer,
  FaChartLine,
} from "react-icons/fa";

// Products navigation items
export const productsItems = [
  {
    label: "AI Deployment",
    href: "/products/ai-deployment",
    icon: FaRocket,
    description: "Automated deployment with AI",
  },
  {
    label: "Code Analysis",
    href: "/products/code-analysis",
    icon: FaCode,
    description: "Smart code quality analysis",
  },
  {
    label: "Cloud Integration",
    href: "/products/cloud-integration",
    icon: FaCloud,
    description: "Multi-cloud deployment",
  },
  {
    label: "DevOps Automation",
    href: "/products/devops-automation",
    icon: FaCogs,
    description: "CI/CD pipeline automation",
  },
  {
    label: "Security Shield",
    href: "/products/security-shield",
    icon: FaShieldAlt,
    description: "Enterprise-grade security",
  },
];

// Downloads navigation items
export const downloadsItems = [
  {
    label: "CLI Tool",
    href: "/downloads/cli",
    icon: FaDownload,
    description: "Command line interface",
    comingSoon: "Q1 2026",
  },
  {
    label: "SDK",
    href: "/downloads/sdk",
    icon: FaCode,
    description: "Software development kit",
    comingSoon: "Q2 2026",
  },
  {
    label: "GitHub Repository",
    href: "https://github.com/deployio/deployio",
    icon: FaGithub,
    description: "Open source repository",
  },
];

// Resources navigation items
export const resourcesItems = [
  {
    label: "Documentation",
    href: "/resources/docs",
    icon: FaBook,
    description: "Complete guides and API docs",
  },
  {
    label: "Support Center",
    href: "/resources/support",
    icon: FaLifeRing,
    description: "24/7 developer support",
  },
  {
    label: "Community",
    href: "/resources/community",
    icon: FaUsers,
    description: "Join our developer community",
  },
  {
    label: "Blog",
    href: "/resources/blog",
    icon: FaBlog,
    description: "Latest updates and tutorials",
  },
];

// Dashboard navigation items
export const dashboardItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: FaTachometerAlt,
    description: "Your deployment overview",
  },
  {
    label: "Projects",
    href: "/dashboard/projects",
    icon: FaProjectDiagram,
    description: "Manage your projects",
  },
  {
    label: "Deployments",
    href: "/dashboard/deployments",
    icon: FaRocket,
    description: "View deployment history",
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: FaChartLine,
    description: "Performance analytics",
  },
];

// Tools navigation items
export const toolsItems = [
  {
    label: "CLI Generator",
    href: "/dashboard/cli",
    icon: FaCode,
    description: "Generate CLI commands",
  },
  {
    label: "API Tester",
    href: "/dashboard/api-tester",
    icon: FaCloud,
    description: "Test your APIs",
  },
  {
    label: "Monitoring",
    href: "/dashboard/monitoring",
    icon: FaChartLine,
    description: "System monitoring",
  },
  {
    label: "Integrations",
    href: "/dashboard/integrations",
    icon: FaGithub,
    description: "Third-party integrations",
  },
];

// Dashboard resources (slightly different from home resources)
export const dashboardResourcesItems = [
  {
    label: "Documentation",
    href: "/docs",
    icon: FaBook,
    description: "Complete guides and API docs",
  },
  {
    label: "Support Center",
    href: "/resources/support",
    icon: FaLifeRing,
    description: "24/7 developer support",
  },
  {
    label: "Community",
    href: "/resources/community",
    icon: FaUsers,
    description: "Join our developer community",
  },
  {
    label: "API Reference",
    href: "/docs/api",
    icon: FaServer,
    description: "Complete API documentation",
  },
];

// Home page navigation structure
export const homeNavigationItems = [
  {
    label: "Products",
    id: "products",
    items: productsItems,
  },
  {
    label: "Downloads",
    id: "downloads",
    items: downloadsItems,
  },
  {
    label: "Resources",
    id: "resources",
    items: resourcesItems,
  },
];

// Dashboard/authenticated user navigation structure
export const dashboardNavigationItems = [
  {
    label: "Dashboard",
    id: "dashboard",
    items: dashboardItems,
  },
  {
    label: "Tools",
    id: "tools",
    items: toolsItems,
  },
  {
    label: "Resources",
    id: "resources",
    items: dashboardResourcesItems,
  },
];

// Footer-specific grouped navigation for easier organization
export const footerNavigation = {
  products: productsItems,
  downloads: downloadsItems,
  resources: resourcesItems,
};
