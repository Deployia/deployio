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
  FaCog,
  FaLock,
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

// Admin navigation items
export const adminItems = [
  {
    label: "Admin Dashboard",
    href: "/admin",
    icon: FaTachometerAlt,
    description: "Admin overview and statistics",
  },
  {
    label: "User Management",
    href: "/admin/users",
    icon: FaUsers,
    description: "Manage platform users",
  },
  {
    label: "Project Management",
    href: "/admin/projects",
    icon: FaProjectDiagram,
    description: "Manage user projects",
  },
  {
    label: "Blog Management",
    href: "/admin/blogs",
    icon: FaBlog,
    description: "Manage blog posts",
  },
  {
    label: "Deployment Management",
    href: "/admin/deployments",
    icon: FaServer,
    description: "Monitor deployments",
  },
  {
    label: "Security Center",
    href: "/admin/security",
    icon: FaLock,
    description: "Security settings",
  },
  {
    label: "Platform Settings",
    href: "/admin/settings",
    icon: FaCog,
    description: "System configuration",
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
    label: "API Reference",
    href: "resources/docs/api",
    icon: FaServer,
    description: "Complete API documentation",
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
  {
    label: "Admin",
    id: "admin",
    items: adminItems,
  },
];

// Footer-specific grouped navigation for easier organization
export const footerNavigation = {
  products: productsItems,
  downloads: downloadsItems,
  resources: resourcesItems,
};
