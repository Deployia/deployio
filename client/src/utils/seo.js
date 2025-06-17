// SEO Configuration for Deployio
// This file contains SEO metadata for all pages in the application

const defaultSEO = {
  title: "Deployio - AI-Powered DevOps Automation Platform",
  description:
    "Transform your deployment process with Deployio's AI-powered automation. Submit a GitHub URL and get instant stack detection, Dockerfiles, CI/CD pipelines, and production deployments with real-time monitoring.",
  keywords:
    "AI DevOps automation, intelligent deployment, automated CI/CD, GitHub deployment, Docker generation, MERN stack deployment, cloud deployment automation, DevOps platform, deployment pipeline, infrastructure automation",
  author: "Deployio Team",
  type: "website",
  url: "https://deployio.tech",
  image: "https://deployio.tech/og-image.jpg",
  siteName: "Deployio",
  locale: "en_US",
  twitterCardType: "summary_large_image",
  twitterSite: "@deployio",
  twitterCreator: "@deployio",
};

// Page-specific SEO configurations
export const seoConfig = {
  // Home page
  home: {
    title:
      "Deployio - AI-Powered DevOps Automation Platform | Intelligent Deployment Solutions",
    description:
      "Transform your deployment process with Deployio's AI-powered automation. Submit a GitHub URL and get instant stack detection, Dockerfiles, CI/CD pipelines, and production deployments with real-time monitoring.",
    keywords:
      "AI deployment automation, intelligent DevOps, automated CI/CD, GitHub to production, Docker generation, MERN deployment, cloud automation, DevOps AI assistant",
    url: `${defaultSEO.url}/`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Deployio",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      description:
        "AI-powered DevOps automation platform that transforms deployment processes",
      url: defaultSEO.url,
      author: {
        "@type": "Organization",
        name: defaultSEO.author,
      },
    },
  },

  // Authentication pages
  login: {
    title: "Login | Deployio - Access Your AI DevOps Dashboard",
    description:
      "Sign in to your Deployio account to access your AI-powered deployment dashboard, manage automated deployments with intelligent stack detection, and monitor your applications with real-time insights.",
    keywords:
      "login AI DevOps, sign in deployment automation, authentication, AI deployment dashboard, automated CI/CD access, intelligent deployment management",
    url: `${defaultSEO.url}/auth/login`,
    robots: "noindex, nofollow",
  },
  register: {
    title: "Sign Up | Deployio - Start AI-Powered DevOps Automation",
    description:
      "Create your Deployio account and start deploying applications with AI automation in minutes. Join developers experiencing intelligent DevOps workflows with automated stack detection and CI/CD generation.",
    keywords:
      "sign up AI DevOps, register deployment automation, create account, join deployio, AI deployment platform, automated deployment",
    url: `${defaultSEO.url}/auth/register`,
    robots: "noindex, nofollow",
  },

  forgotPassword: {
    title: "Reset Password | Deployio - Recover Your Account",
    description:
      "Forgot your password? Reset it securely and regain access to your Deployio deployment dashboard.",
    keywords: "password reset, forgot password, account recovery",
    url: `${defaultSEO.url}/auth/forgot-password`,
    robots: "noindex, nofollow",
  },

  resetPassword: {
    title: "Set New Password | Deployio - Secure Account Access",
    description:
      "Set a new secure password for your Deployio account to continue managing your deployments.",
    keywords: "new password, password reset, secure access",
    robots: "noindex, nofollow",
  },

  verifyOtp: {
    title: "Verify Code | Deployio - Two-Factor Authentication",
    description:
      "Complete your secure login with two-factor authentication to access your Deployio dashboard.",
    keywords: "two factor authentication, 2FA, verify code, secure login",
    robots: "noindex, nofollow",
  },

  // Protected pages
  profile: {
    title: "Profile Settings | Deployio - Manage Your Account",
    description:
      "Manage your Deployio account settings, update profile information, and configure security preferences.",
    keywords:
      "profile settings, account management, user preferences, security settings",
    url: `${defaultSEO.url}/profile`,
    robots: "noindex, nofollow",
  },

  // Legal pages
  privacyPolicy: {
    title: "Privacy Policy | Deployio - Data Protection & Privacy",
    description:
      "Learn how Deployio protects your privacy and handles your data. Our commitment to transparency and data security.",
    keywords:
      "privacy policy, data protection, GDPR compliance, user privacy, data security",
    url: `${defaultSEO.url}/privacy-policy`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Privacy Policy",
      description: "Deployio's privacy policy and data protection practices",
      url: `${defaultSEO.url}/privacy-policy`,
      dateModified: new Date().toISOString(),
      publisher: {
        "@type": "Organization",
        name: defaultSEO.siteName,
      },
    },
  },

  termsOfService: {
    title: "Terms of Service | Deployio - Usage Terms & Conditions",
    description:
      "Read Deployio's terms of service, usage policies, and legal agreements for using our deployment platform.",
    keywords:
      "terms of service, usage policy, legal terms, service agreement, user agreement",
    url: `${defaultSEO.url}/terms-of-service`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Terms of Service",
      description: "Deployio's terms of service and usage policies",
      url: `${defaultSEO.url}/terms-of-service`,
      dateModified: new Date().toISOString(),
      publisher: {
        "@type": "Organization",
        name: defaultSEO.siteName,
      },
    },
  },

  cookiePolicy: {
    title: "Cookie Policy | Deployio - Cookie Usage & Preferences",
    description:
      "Understand how Deployio uses cookies to enhance your experience and how to manage your cookie preferences.",
    keywords:
      "cookie policy, cookie usage, privacy settings, tracking preferences, website cookies",
    url: `${defaultSEO.url}/cookie-policy`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Cookie Policy",
      description: "Deployio's cookie policy and usage practices",
      url: `${defaultSEO.url}/cookie-policy`,
      dateModified: new Date().toISOString(),
      publisher: {
        "@type": "Organization",
        name: defaultSEO.siteName,
      },
    },
  },
  // Dashboard pages (Protected)
  dashboard: {
    title: "Dashboard | Deployio - AI DevOps Control Center",
    description:
      "Manage your deployments and monitor your applications with Deployio's comprehensive AI-powered dashboard. View deployment statistics, recent activity, and project overviews.",
    keywords:
      "AI deployment dashboard, DevOps control center, deployment management, project overview, deployment statistics, application monitoring",
    url: `${defaultSEO.url}/dashboard`,
    robots: "noindex, nofollow",
  },

  projects: {
    title: "Projects | Deployio - Manage Development Projects",
    description:
      "Manage all your projects and deployments in one place with Deployio's project management interface. Create, deploy, and monitor your applications effortlessly.",
    keywords:
      "project management, deployment projects, application management, project dashboard, development projects, deployment interface",
    url: `${defaultSEO.url}/dashboard/projects`,
    robots: "noindex, nofollow",
  },

  deployments: {
    title: "Deployments | Deployio - Deployment History & Monitoring",
    description:
      "Monitor and manage all your application deployments with detailed logs and status tracking. View deployment history, rollback options, and real-time deployment status.",
    keywords:
      "deployment monitoring, deployment history, deployment logs, application deployment, deployment tracking, deployment management",
    url: `${defaultSEO.url}/dashboard/deployments`,
    robots: "noindex, nofollow",
  },

  analytics: {
    title: "Analytics | Deployio - Deployment Performance Insights",
    description:
      "Monitor your deployment performance and insights with comprehensive analytics. Track success rates, performance metrics, and deployment trends over time.",
    keywords:
      "deployment analytics, performance insights, deployment metrics, deployment statistics, performance monitoring, deployment trends",
    url: `${defaultSEO.url}/dashboard/analytics`,
    robots: "noindex, nofollow",
  },

  monitoring: {
    title: "Monitoring | Deployio - Real-time System Monitoring",
    description:
      "Monitor your applications and infrastructure in real-time. Track performance metrics, alerts, system health, and get notified of issues instantly.",
    keywords:
      "application monitoring, infrastructure monitoring, real-time monitoring, system health, performance metrics, monitoring dashboard",
    url: `${defaultSEO.url}/dashboard/monitoring`,
    robots: "noindex, nofollow",
  },
  integrations: {
    title: "Integrations | Deployio - Connect Your Favorite Tools",
    description:
      "Connect your favorite tools and services with Deployio. Integrate with GitHub, Slack, AWS, Docker, and many more platforms to streamline your workflow.",
    keywords:
      "integrations, GitHub integration, Slack integration, AWS integration, Docker integration, CI/CD integrations, deployment integrations",
    url: `${defaultSEO.url}/dashboard/integrations`,
    robots: "noindex, nofollow",
  },

  activity: {
    title: "Activity | Deployio - Recent Activity & Deployment Logs",
    description:
      "View recent deployment activity, system events, and real-time logs. Track all deployment operations, user actions, and system notifications in one place.",
    keywords:
      "deployment activity, system logs, deployment history, activity feed, deployment tracking, system events",
    url: `${defaultSEO.url}/dashboard/activity`,
    robots: "noindex, nofollow",
  },

  "create-project": {
    title: "Create Project | Deployio - New Project Setup",
    description:
      "Create a new project with Deployio's intelligent setup wizard. Connect your GitHub repository and let AI configure deployment settings automatically.",
    keywords:
      "create project, new project, project setup, GitHub integration, AI configuration, deployment setup",
    url: `${defaultSEO.url}/dashboard/create-project`,
    robots: "noindex, nofollow",
  },

  "project-details": {
    title: "Project Details | Deployio - Project Management",
    description:
      "Manage your project deployments, view detailed analytics, configure settings, and monitor performance with comprehensive project insights.",
    keywords:
      "project management, project details, deployment configuration, project analytics, deployment monitoring",
    url: `${defaultSEO.url}/dashboard/projects`,
    robots: "noindex, nofollow",
  },

  // Support & Tools pages
  cli: {
    title: "CLI Tool | Deployio - Command Line Interface",
    description:
      "Download and use Deployio's powerful CLI tool for command-line deployment management. Generate commands, automate deployments, and manage projects from your terminal.",
    keywords:
      "CLI tool, command line interface, deployment CLI, terminal deployment, command line deployment, CLI commands, deployment automation",
    url: `${defaultSEO.url}/dashboard/cli`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Deployio CLI",
      applicationCategory: "DeveloperApplication",
      operatingSystem: ["Windows", "macOS", "Linux"],
      description: "Command-line tool for deployment automation and management",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  },

  apiTester: {
    title: "API Tester | Deployio - Test & Debug APIs",
    description:
      "Test and debug APIs with our powerful API testing tool. Send requests, view responses, manage collections, and debug your API workflows efficiently.",
    keywords:
      "API testing, REST API testing, HTTP client, API debugging, API development, request testing, API workflows",
    url: `${defaultSEO.url}/dashboard/api-tester`,
  },

  documentation: {
    title: "Documentation | Deployio - Complete Developer Guides",
    description:
      "Comprehensive documentation for Deployio. Learn deployment strategies, API references, integration guides, and best practices for modern DevOps.",
    keywords:
      "documentation, developer guides, API documentation, deployment guides, DevOps documentation, integration guides, deployment best practices",
    url: `${defaultSEO.url}/resources/docs`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Deployio Documentation",
      description: "Complete developer documentation for Deployio platform",
      url: `${defaultSEO.url}/resources/docs`,
      publisher: {
        "@type": "Organization",
        name: defaultSEO.siteName,
      },
    },
  },

  supportCenter: {
    title: "Support Center | Deployio - Help & Customer Support",
    description:
      "Get help with Deployio. Access FAQs, troubleshooting guides, contact support, and find answers to common deployment questions.",
    keywords:
      "support center, customer support, help desk, troubleshooting, FAQ, deployment help, technical support",
    url: `${defaultSEO.url}/resources/support`,
  },

  // Product pages
  aiDeployment: {
    title: "AI Deployment | Deployio - Intelligent Deployment Automation",
    description:
      "Transform your deployment process with AI-powered automation. Intelligent stack detection, automated optimization, and predictive deployment management.",
    keywords:
      "AI deployment, intelligent automation, automated deployment, AI DevOps, machine learning deployment, intelligent deployment optimization",
    url: `${defaultSEO.url}/products/ai-deployment`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "AI Deployment",
      description: "AI-powered deployment automation and optimization",
      category: "Software",
      brand: {
        "@type": "Brand",
        name: "Deployio",
      },
    },
  },

  codeAnalysis: {
    title: "Code Analysis | Deployio - Advanced Code Quality & Security",
    description:
      "Advanced code analysis and quality assurance. Detect bugs, security vulnerabilities, code smells, and performance issues before deployment.",
    keywords:
      "code analysis, static analysis, code quality, security scanning, vulnerability detection, code review automation",
    url: `${defaultSEO.url}/products/code-analysis`,
  },

  cloudIntegration: {
    title: "Cloud Integration | Deployio - Multi-Cloud Deployment",
    description:
      "Deploy seamlessly across multiple cloud providers. AWS, Google Cloud, Azure, and more with unified deployment management and optimization.",
    keywords:
      "cloud integration, multi-cloud deployment, AWS deployment, Google Cloud deployment, Azure deployment, cloud automation",
    url: `${defaultSEO.url}/products/cloud-integration`,
  },
  securityShield: {
    title: "Security Shield | Deployio - Enterprise Security Platform",
    description:
      "Enterprise-grade security for your deployments. Automated vulnerability scanning, compliance monitoring, threat detection, and security best practices.",
    keywords:
      "deployment security, vulnerability scanning, compliance monitoring, threat detection, enterprise security, DevSecOps, security automation",
    url: `${defaultSEO.url}/products/security-shield`,
  },

  devopsAutomation: {
    title: "DevOps Automation | Deployio - CI/CD Pipeline Builder",
    description:
      "Automate your entire DevOps workflow with intelligent CI/CD pipelines, quality gates, multi-environment orchestration, and deployment automation.",
    keywords:
      "DevOps automation, CI/CD pipelines, GitHub Actions, build automation, deployment automation, quality gates, blue-green deployment",
    url: `${defaultSEO.url}/products/devops-automation`,
  },

  // Marketing & Community pages
  community: {
    title: "Community | Deployio - Developer Community Hub",
    description:
      "Join the Deployio developer community. Connect with other developers, share experiences, get help, and contribute to the platform's growth.",
    keywords:
      "developer community, community hub, developer forum, deployment community, DevOps community, developer support",
    url: `${defaultSEO.url}/resources/community`,
  },

  blog: {
    title: "Blog | Deployio - Latest Updates & Tutorials",
    description:
      "Stay updated with the latest deployment best practices, tutorials, product updates, and news from the Deployio team and community.",
    keywords:
      "deployment blog, DevOps blog, deployment tutorials, DevOps best practices, CI/CD guides, deployment news, technical blog",
    url: `${defaultSEO.url}/resources/blogs`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Deployio Blog",
      description: "Latest deployment tutorials and DevOps best practices",
      url: `${defaultSEO.url}/resources/blogs`,
      publisher: {
        "@type": "Organization",
        name: defaultSEO.siteName,
      },
    },
  },

  // Download pages
  cliTool: {
    title: "Download CLI | Deployio - Command Line Tool",
    description:
      "Download the official Deployio CLI tool. Available for Windows, macOS, and Linux. Automate deployments from your terminal with powerful commands.",
    keywords:
      "CLI download, command line tool download, deployment CLI, terminal tool, CLI installation, command line deployment",
    url: `${defaultSEO.url}/downloads/cli`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Deployio CLI",
      applicationCategory: "DeveloperApplication",
      operatingSystem: ["Windows", "macOS", "Linux"],
      description:
        "Official command-line interface for Deployio deployment platform",
      downloadUrl: `${defaultSEO.url}/downloads/cli`,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  },

  sdk: {
    title: "Download SDK | Deployio - Software Development Kits",
    description:
      "Download official Deployio SDKs for JavaScript, Python, Java, Go, PHP, Ruby, C#, and Rust. Integrate deployment automation into your applications.",
    keywords:
      "SDK download, software development kit, JavaScript SDK, Python SDK, Java SDK, Go SDK, API client libraries, deployment SDK",
    url: `${defaultSEO.url}/downloads/sdk`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Deployio SDKs",
      applicationCategory: "DeveloperApplication",
      description:
        "Official SDKs for integrating Deployio into your applications",
      downloadUrl: `${defaultSEO.url}/downloads/sdk`,
      programmingLanguage: [
        "JavaScript",
        "Python",
        "Java",
        "Go",
        "PHP",
        "Ruby",
        "C#",
        "Rust",
      ],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  },

  // System pages
  health: {
    title: "System Health | Deployio - Platform Status",
    description:
      "Check the current status and health of Deployio's deployment platform services and infrastructure. Monitor service uptime and performance metrics.",
    keywords:
      "system health, platform status, service status, uptime monitoring, infrastructure health, system monitoring, service availability",
    url: `${defaultSEO.url}/health`,
    robots: "noindex, nofollow",
  },

  notFound: {
    title: "Page Not Found | Deployio - 404 Error",
    description:
      "The page you're looking for doesn't exist. Return to Deployio's deployment platform or explore our features and documentation.",
    keywords: "404 error, page not found, missing page, error page",
    robots: "noindex, nofollow",
  },
};

// Function to get SEO config for a specific page
export const getSEOConfig = (pageName, customData = {}) => {
  const pageConfig = seoConfig[pageName] || {};

  return {
    ...defaultSEO,
    ...pageConfig,
    ...customData,
    // Ensure URL is absolute
    url: pageConfig.url || defaultSEO.url,
    // Combine keywords if both default and page-specific exist
    keywords: pageConfig.keywords
      ? `${pageConfig.keywords}, ${defaultSEO.keywords}`
      : defaultSEO.keywords,
  };
};

// Function to generate structured data script
export const generateStructuredData = (structuredData) => {
  if (!structuredData) return null;

  return {
    type: "application/ld+json",
    innerHTML: JSON.stringify(structuredData),
  };
};

// Common meta tags generator
export const generateMetaTags = (seoData) => {
  const tags = [
    // Basic meta tags
    { name: "description", content: seoData.description },
    { name: "keywords", content: seoData.keywords },
    { name: "author", content: seoData.author },

    // Open Graph tags
    { property: "og:title", content: seoData.title },
    { property: "og:description", content: seoData.description },
    { property: "og:type", content: seoData.type },
    { property: "og:url", content: seoData.url },
    { property: "og:image", content: seoData.image },
    { property: "og:site_name", content: seoData.siteName },
    { property: "og:locale", content: seoData.locale },

    // Twitter Card tags
    { name: "twitter:card", content: seoData.twitterCardType },
    { name: "twitter:site", content: seoData.twitterSite },
    { name: "twitter:creator", content: seoData.twitterCreator },
    { name: "twitter:title", content: seoData.title },
    { name: "twitter:description", content: seoData.description },
    { name: "twitter:image", content: seoData.image }, // Additional SEO tags
    { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    { name: "theme-color", content: "#1e293b" },
    { name: "msapplication-TileColor", content: "#1e293b" },
  ];

  // Add robots tag if specified
  if (seoData.robots) {
    tags.push({ name: "robots", content: seoData.robots });
  }

  return tags;
};

// Function to dynamically update document title without React Helmet
export const updateDocumentTitle = (title) => {
  if (typeof document !== "undefined") {
    document.title = title;
  }
};

// Function to update meta description without React Helmet
export const updateMetaDescription = (description) => {
  if (typeof document !== "undefined") {
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    }
  }
};

// Function to update canonical URL
export const updateCanonicalUrl = (url) => {
  if (typeof document !== "undefined") {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);
  }
};

// Preload critical SEO resources
export const preloadSEOResources = () => {
  if (typeof document !== "undefined") {
    // Preload Open Graph image
    const ogImageLink = document.createElement("link");
    ogImageLink.rel = "preload";
    ogImageLink.href = "/og-image.jpg";
    ogImageLink.as = "image";
    document.head.appendChild(ogImageLink);

    // Preload favicon only
    const faviconLink = document.createElement("link");
    faviconLink.rel = "preload";
    faviconLink.href = "/favicon.png";
    faviconLink.as = "image";
    document.head.appendChild(faviconLink);

    // Don't preload logo.png to avoid unused preload warnings
    // Logo will be loaded when needed by navigation components
  }
};

export default seoConfig;
