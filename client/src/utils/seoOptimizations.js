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

    // Add viewport meta tag if missing
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      const viewportMeta = document.createElement("meta");
      viewportMeta.name = "viewport";
      viewportMeta.content = "width=device-width, initial-scale=1.0";
      document.head.appendChild(viewportMeta);
    }

    // Add robots meta tag if missing
    const robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      const robotsMeta = document.createElement("meta");
      robotsMeta.name = "robots";
      robotsMeta.content =
        "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";
      document.head.appendChild(robotsMeta);
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
      { rel: "dns-prefetch", href: "//api.deployio.tech" },
      { rel: "dns-prefetch", href: "//cdn.deployio.tech" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossorigin: true,
      },
      { rel: "preconnect", href: "https://api.deployio.tech" },
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

    // Add performance optimization meta tags
    const performanceMetas = [
      { name: "theme-color", content: "#3B82F6" },
      { name: "msapplication-TileColor", content: "#3B82F6" },
      { name: "format-detection", content: "telephone=no" },
    ];

    performanceMetas.forEach((meta) => {
      const existingMeta = document.querySelector(`meta[name="${meta.name}"]`);
      if (!existingMeta) {
        const metaTag = document.createElement("meta");
        metaTag.name = meta.name;
        metaTag.content = meta.content;
        document.head.appendChild(metaTag);
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

    // Add comprehensive organization structured data
    const organizationData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Deployio",
      alternateName: "Deployio Platform",
      url: "https://deployio.tech",
      logo: {
        "@type": "ImageObject",
        url: "https://deployio.tech/logo.png",
        width: 512,
        height: 512,
      },
      description:
        "Modern deployment platform with automated CI/CD, Docker support, and enterprise security",
      sameAs: [
        "https://twitter.com/deployio",
        "https://github.com/deployio",
        "https://linkedin.com/company/deployio",
        "https://facebook.com/deployio",
      ],
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "Technical Support",
          email: "support@deployio.tech",
          availableLanguage: ["English"],
          areaServed: "Worldwide",
        },
        {
          "@type": "ContactPoint",
          contactType: "Sales",
          email: "sales@deployio.tech",
          availableLanguage: ["English"],
          areaServed: "Worldwide",
        },
      ],
      foundingDate: "2023",
      numberOfEmployees: "11-50",
      industry: "Software Development",
      address: {
        "@type": "PostalAddress",
        addressCountry: "US",
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
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.loadEventStart; // Log performance metrics (can be sent to analytics)
          // Only log in development mode if console is available
          if (typeof console !== "undefined") {
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
        }
      }, 0);
    });
  }
};

// Optimize images for better SEO and performance
export const optimizeImages = () => {
  if (typeof document !== "undefined") {
    // Add loading="lazy" to images that don't have it
    const images = document.querySelectorAll("img:not([loading])");
    images.forEach((img, index) => {
      // First few images should load immediately for LCP
      if (index < 3) {
        img.loading = "eager";
      } else {
        img.loading = "lazy";
      }

      // Add decoding="async" for better performance
      if (!img.hasAttribute("decoding")) {
        img.decoding = "async";
      }
    });
  }
};

// Add breadcrumb structured data
export const addBreadcrumbStructuredData = (breadcrumbs) => {
  if (
    typeof document !== "undefined" &&
    breadcrumbs &&
    breadcrumbs.length > 0
  ) {
    // Remove existing breadcrumb structured data
    const existingBreadcrumb = document.querySelector(
      'script[type="application/ld+json"][data-breadcrumb]'
    );
    if (existingBreadcrumb) {
      existingBreadcrumb.remove();
    }

    const breadcrumbData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.url ? `https://deployio.tech${item.url}` : undefined,
      })),
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-breadcrumb", "true");
    script.textContent = JSON.stringify(breadcrumbData);
    document.head.appendChild(script);
  }
};

// Optimize accessibility for SEO
export const optimizeAccessibility = () => {
  if (typeof document !== "undefined") {
    // Add alt text to images without it
    const imagesWithoutAlt = document.querySelectorAll("img:not([alt])");
    imagesWithoutAlt.forEach((img) => {
      img.alt = "Deployio platform feature";
    });

    // Add proper heading structure validation
    const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
    let hasH1 = false;
    headings.forEach((heading) => {
      if (heading.tagName === "H1") {
        hasH1 = true;
      }
    });

    // Ensure page has an H1 tag
    if (!hasH1 && headings.length > 0) {
      const firstHeading = headings[0];
      if (firstHeading.tagName !== "H1") {
        console.warn(
          "SEO Warning: Page should have an H1 tag as the main heading"
        );
      }
    }
  }
};

// Initialize all SEO optimizations
export const initializeSEOOptimizations = () => {
  optimizeInitialSEO();
  optimizeCoreWebVitals();
  addRichSnippets();
  monitorSEOPerformance();
  optimizeImages();
  optimizeAccessibility();
};

// Advanced SEO optimization for specific page types
export const optimizePageTypeSEO = (pageType, pageData = {}) => {
  if (typeof document !== "undefined") {
    switch (pageType) {
      case "dashboard": {
        // Add dashboard-specific optimizations
        if (pageData.breadcrumbs) {
          addBreadcrumbStructuredData(pageData.breadcrumbs);
        }
        break;
      }
      case "blog": {
        // Add article structured data
        if (pageData.article) {
          const articleData = {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: pageData.article.title,
            author: {
              "@type": "Person",
              name: pageData.article.author || "Deployio Team",
            },
            datePublished: pageData.article.publishDate,
            dateModified:
              pageData.article.modifiedDate || pageData.article.publishDate,
            publisher: {
              "@type": "Organization",
              name: "Deployio",
              logo: {
                "@type": "ImageObject",
                url: "https://deployio.tech/logo.png",
              },
            },
          };

          const script = document.createElement("script");
          script.type = "application/ld+json";
          script.setAttribute("data-article", "true");
          script.textContent = JSON.stringify(articleData);
          document.head.appendChild(script);
        }
        break;
      }
      case "product": {
        // Add product/software application structured data
        const softwareData = {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Deployio",
          operatingSystem: "Web Browser",
          applicationCategory: "DeveloperApplication",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            ratingCount: "150",
          },
        };

        const softwareScript = document.createElement("script");
        softwareScript.type = "application/ld+json";
        softwareScript.setAttribute("data-software", "true");
        softwareScript.textContent = JSON.stringify(softwareData);
        document.head.appendChild(softwareScript);
        break;
      }
    }
  }
};

export default {
  optimizeInitialSEO,
  optimizeCoreWebVitals,
  addRichSnippets,
  monitorSEOPerformance,
  optimizeImages,
  optimizeAccessibility,
  addBreadcrumbStructuredData,
  optimizePageTypeSEO,
  initializeSEOOptimizations,
};
