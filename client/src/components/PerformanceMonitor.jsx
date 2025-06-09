import { useEffect } from "react";

const PerformanceMonitor = () => {
  useEffect(() => {
    // Only run in development
    if (import.meta.env.MODE !== "development") return;

    // Monitor performance metrics
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "navigation") {
          console.log("Navigation Performance:", {
            DNS: `${entry.domainLookupEnd - entry.domainLookupStart}ms`,
            TCP: `${entry.connectEnd - entry.connectStart}ms`,
            Request: `${entry.responseStart - entry.requestStart}ms`,
            Response: `${entry.responseEnd - entry.responseStart}ms`,
            DOM: `${
              entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart
            }ms`,
            Load: `${entry.loadEventEnd - entry.loadEventStart}ms`,
            Total: `${entry.loadEventEnd - entry.navigationStart}ms`,
          });
        }

        if (entry.entryType === "measure") {
          console.log(
            `Custom Metric [${entry.name}]:`,
            `${entry.duration.toFixed(2)}ms`
          );
        }

        // Monitor Core Web Vitals
        if (entry.entryType === "largest-contentful-paint") {
          console.log("LCP:", `${entry.startTime.toFixed(2)}ms`);
        }

        if (entry.entryType === "first-input") {
          console.log("FID:", `${entry.processingStart - entry.startTime}ms`);
        }

        if (entry.entryType === "layout-shift") {
          if (!entry.hadRecentInput) {
            console.log("CLS Score:", entry.value);
          }
        }
      }
    });

    // Observe different performance metrics
    observer.observe({
      entryTypes: [
        "navigation",
        "measure",
        "largest-contentful-paint",
        "first-input",
        "layout-shift",
      ],
    });

    // Custom performance marks for React components
    const markComponentRender = (componentName) => {
      performance.mark(`${componentName}-start`);
      return () => {
        performance.mark(`${componentName}-end`);
        performance.measure(
          componentName,
          `${componentName}-start`,
          `${componentName}-end`
        );
      };
    };

    // Make it available globally for component usage
    window.markComponentRender = markComponentRender;

    return () => {
      observer.disconnect();
      delete window.markComponentRender;
    };
  }, []);

  return null; // This component doesn't render anything
};

export default PerformanceMonitor;
