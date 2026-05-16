import {
  FaBlog,
  FaBook,
  FaChartLine,
  FaCloud,
  FaCode,
  FaCog,
  FaCogs,
  FaDownload,
  FaGithub,
  FaLaptopCode,
  FaLifeRing,
  FaLock,
  FaPlug,
  FaProjectDiagram,
  FaRocket,
  FaServer,
  FaShieldAlt,
  FaTachometerAlt,
  FaUsers,
} from "react-icons/fa";

// Products navigation items
export const productsItems = [
  {
    label: "Code Analysis",
    href: "/products/code-analysis",
    icon: FaCode,
    description: "Smart code quality analysis",
  },
  {
    label: "DevOps Automation",
    href: "/products/devops-automation",
    icon: FaCogs,
    description: "CI/CD pipeline automation",
  },
  {
    label: "Cloud Integration",
    href: "/products/cloud-integration",
    icon: FaCloud,
    description: "Multi-cloud deployment",
    comingSoon: "Q1 2026",
  },
  {
    label: "AI Deployment",
    href: "/products/ai-deployment",
    icon: FaRocket,
    description: "Automated deployment with AI",
    comingSoon: "Q2 2026",
  },
  {
    label: "Security Shield",
    href: "/products/security-shield",
    icon: FaShieldAlt,
    description: "Enterprise-grade security",
    comingSoon: "Q2 2026",
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
    href: "https://github.com/deployia/",
    icon: FaGithub,
    description: "Open source repository",
  },
];

// Resources navigation items
export const resourcesItems = [
  {
    label: "Playground",
    href: "/playground",
    icon: FaLaptopCode,
    description: "AI-powered DevOps IDE & Sandbox",
    highlight: true,
  },
  {
    label: "Documentation",
    href: "/resources/docs",
    icon: FaBook,
    description: "Complete guides and API docs",
  },
  {
    label: "Blog",
    href: "/resources/blogs",
    icon: FaBlog,
    description: "Latest updates and tutorials",
  },
  {
    label: "Support Center",
    href: "/resources/support",
    icon: FaLifeRing,
    description: "24/7 developer support",
    comingSoon: "Coming Soon",
  },
  {
    label: "Community",
    href: "/resources/community",
    icon: FaUsers,
    description: "Join our developer community",
    comingSoon: "Coming Soon",
  },
  {
    label: "System Health",
    href: "/health",
    icon: FaTachometerAlt,
    description: "Real-time system monitoring",
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
    label: "Integrations",
    href: "/dashboard/integrations",
    icon: FaPlug,
    description: "Third-party integrations",
  },
  {
    label: "Monitoring",
    href: "/dashboard/monitoring",
    icon: FaChartLine,
    description: "Deployment health & status",
  },
  {
    label: "CLI Generator",
    href: "/dashboard/cli",
    icon: FaCode,
    description: "Generate CLI commands",
    comingSoon: "Coming Soon",
  },
  {
    label: "API Tester",
    href: "/dashboard/api-tester",
    icon: FaCloud,
    description: "Test your APIs",
    comingSoon: "Coming Soon",
  },
];

// Admin navigation items
export const adminItems = [
  {
    label: "Overview",
    href: "/admin",
    icon: FaTachometerAlt,
    description: "Platform overview and statistics",
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: FaUsers,
    description: "Manage platform users",
  },
  {
    label: "Projects",
    href: "/admin/projects",
    icon: FaProjectDiagram,
    description: "Manage user projects",
  },
  {
    label: "Deployments",
    href: "/admin/deployments",
    icon: FaServer,
    description: "Monitor deployments",
  },
  {
    label: "Subdomains",
    href: "/admin/subdomains",
    icon: FaCloud,
    description: "Subdomain reservations and status",
  },
  {
    label: "Activity",
    href: "/admin/activity",
    icon: FaChartLine,
    description: "Audit log and platform activity",
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: FaCogs,
    description: "Send and review notifications",
  },
  {
    label: "Health Monitor",
    href: "/health",
    icon: FaShieldAlt,
    description: "Real-time system monitoring",
  },
];

// Dashboard resources (slightly different from home resources)
export const dashboardResourcesItems = [
  {
    label: "Playground",
    href: "/playground",
    icon: FaLaptopCode,
    description: "AI-powered DevOps IDE",
    highlight: true,
  },
  {
    label: "Documentation",
    href: "/resources/docs",
    icon: FaBook,
    description: "Complete guides and API docs",
  },
  {
    label: "API Reference",
    href: "/resources/docs/api",
    icon: FaServer,
    description: "Complete API documentation",
  },
  {
    label: "Support Center",
    href: "/resources/support",
    icon: FaLifeRing,
    description: "24/7 developer support",
    comingSoon: "Coming Soon",
  },
  {
    label: "Community",
    href: "/resources/community",
    icon: FaUsers,
    description: "Join our developer community",
    comingSoon: "Coming Soon",
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
