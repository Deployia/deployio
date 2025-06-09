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
  url: "https://deployio.com",
  image: "https://deployio.com/og-image.jpg",
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

  // System pages
  health: {
    title: "System Health | Deployio - Platform Status",
    description:
      "Check the current status and health of Deployio's deployment platform services and infrastructure.",
    keywords:
      "system health, platform status, service status, uptime, system monitoring",
    url: `${defaultSEO.url}/health`,
    robots: "noindex, nofollow",
  },

  notFound: {
    title: "Page Not Found | Deployio - 404 Error",
    description:
      "The page you're looking for doesn't exist. Return to Deployio's deployment platform or explore our features.",
    keywords: "404 error, page not found, missing page",
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
    { name: "twitter:image", content: seoData.image },

    // Additional SEO tags
    { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    { name: "theme-color", content: "#3b82f6" },
    { name: "msapplication-TileColor", content: "#3b82f6" },
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

    // Preload favicon
    const faviconLink = document.createElement("link");
    faviconLink.rel = "preload";
    faviconLink.href = "/favicon.png";
    faviconLink.as = "image";
    document.head.appendChild(faviconLink);
  }
};

export default seoConfig;
