// SEO Performance Optimizations
// This file contains functions to optimize SEO performance and loading

// Early meta tag updates for faster SEO
export const optimizeInitialSEO = () => {
  // Keep initial optimizations minimal to avoid conflicts with react-helmet-async
  if (typeof document !== "undefined") {
    // Only optimize meta description if it's empty
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && !metaDescription.getAttribute("content")) {
      metaDescription.setAttribute(
        "content",
        "Modern deployment platform with automated CI/CD, Docker support, and enterprise security."
      );
    }

    // Ensure the document has a basic title that can be easily overridden
    if (!document.title || document.title === "") {
      document.title = "Deployio";
    }
  }
};

// Optimize Core Web Vitals for SEO
export const optimizeCoreWebVitals = () => {
  if (typeof document !== "undefined") {
    // Add resource hints for better performance
    const resourceHints = [
      { rel: "dns-prefetch", href: "//fonts.googleapis.com" },
      { rel: "dns-prefetch", href: "//fonts.gstatic.com" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossorigin: true,
      },
    ];

    resourceHints.forEach((hint) => {
      const existingHint = document.querySelector(
        `link[rel="${hint.rel}"][href="${hint.href}"]`
      );
      if (!existingHint) {
        const link = document.createElement("link");
        link.rel = hint.rel;
        link.href = hint.href;
        if (hint.crossorigin) link.crossOrigin = hint.crossorigin;
        document.head.appendChild(link);
      }
    });
  }
};

// Add structured data for better search results
export const addRichSnippets = () => {
  if (typeof document !== "undefined") {
    // Check if structured data already exists
    const existingStructuredData = document.querySelector(
      'script[type="application/ld+json"]'
    );
    if (existingStructuredData) return;

    // Add organization structured data
    const organizationData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Deployio",
      url: "https://deployio.com",
      logo: "https://deployio.com/logo.png",
      description: "Modern deployment platform with automated CI/CD",
      sameAs: ["https://twitter.com/deployio", "https://github.com/deployio"],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "Technical Support",
        email: "support@deployio.com",
      },
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(organizationData);
    document.head.appendChild(script);
  }
};

// Monitor and optimize SEO performance
export const monitorSEOPerformance = () => {
  if (typeof window !== "undefined" && "performance" in window) {
    // Monitor page load performance for SEO
    window.addEventListener("load", () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType("navigation")[0];
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;

        // Log performance metrics (can be sent to analytics)
        if (process.env.NODE_ENV === "development") {
          console.log("SEO Performance Metrics:", {
            loadTime: `${loadTime.toFixed(2)}ms`,
            domContentLoaded: `${
              navigation.domContentLoadedEventEnd -
              navigation.domContentLoadedEventStart
            }ms`,
            firstContentfulPaint:
              navigation.loadEventEnd - navigation.fetchStart,
          });
        }
      }, 0);
    });
  }
};

// Initialize all SEO optimizations
export const initializeSEOOptimizations = () => {
  optimizeInitialSEO();
  optimizeCoreWebVitals();
  addRichSnippets();
  monitorSEOPerformance();
};

export default {
  optimizeInitialSEO,
  optimizeCoreWebVitals,
  addRichSnippets,
  monitorSEOPerformance,
  initializeSEOOptimizations,
};
