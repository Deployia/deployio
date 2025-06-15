import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  FaShieldAlt,
  FaLock,
  FaKey,
  FaEye,
  FaCheckCircle,
  FaPlay,
  FaBolt,
} from "react-icons/fa";
import SEO from "@components/SEO";
import {
  ProductHero,
  StickyFeaturesSection,
  ProductStats,
  ProductCTA,
  ProductDemo,
} from "@components/products";

const SecurityShield = () => {
  const [selectedFeature, setSelectedFeature] = useState(0);
  const [demoData, setDemoData] = useState(null);
  const { scrollY } = useScroll();

  // Scroll-triggered feature progression
  const featureProgress = useTransform(
    scrollY,
    [0, 400, 800, 1200],
    [0, 1, 2, 3]
  );

  useEffect(() => {
    const unsubscribe = featureProgress.onChange((latest) => {
      setSelectedFeature(Math.floor(latest));
    });
    return () => unsubscribe();
  }, [featureProgress]);

  const features = [
    {
      icon: FaShieldAlt,
      title: "Secure Deployment Pipeline",
      description:
        "Built-in security scanning and compliance checks throughout the deployment process",
      color: "blue",
      details:
        "Every deployment includes automated security scanning, vulnerability detection, and compliance validation to ensure your applications meet security standards before going live.",
      platforms: [
        "OWASP Top 10",
        "CVE Database",
        "License Scanning",
        "Secret Detection",
      ],
    },
    {
      icon: FaLock,
      title: "Infrastructure Security",
      description:
        "Secure containerization and encrypted communications for all deployments",
      color: "green",
      details:
        "All containers are built with security best practices, encrypted connections, and isolated environments to protect your applications and data.",
      platforms: [
        "TLS/SSL",
        "Container Isolation",
        "Network Security",
        "Access Control",
      ],
    },
    {
      icon: FaKey,
      title: "Secrets Management",
      description:
        "Secure handling and injection of environment variables and sensitive data",
      color: "purple",
      details:
        "Automated secrets management with encrypted storage, secure injection, and rotation capabilities for API keys, database credentials, and other sensitive data.",
      platforms: [
        "Environment Variables",
        "API Keys",
        "Database Credentials",
        "Certificates",
      ],
    },
    {
      icon: FaEye,
      title: "Security Monitoring",
      description:
        "Real-time security monitoring and threat detection for deployed applications",
      color: "orange",
      details:
        "Continuous monitoring for security threats, anomalous behavior, and compliance violations with instant alerts and automated responses.",
      platforms: [
        "Threat Detection",
        "Anomaly Detection",
        "Compliance Monitoring",
        "Security Alerts",
      ],
    },
  ];

  const securityFeatures = [
    {
      name: "Vulnerability Scanning",
      status: "Active",
      severity: "High",
      description: "Automated dependency and container scanning",
    },
    {
      name: "Secrets Detection",
      status: "Active",
      severity: "Critical",
      description: "Prevent credential leaks in code",
    },
    {
      name: "Compliance Checks",
      status: "Active",
      severity: "Medium",
      description: "SOC 2, GDPR compliance validation",
    },
    {
      name: "Access Control",
      status: "Active",
      severity: "High",
      description: "Role-based permissions and audit logs",
    },
    {
      name: "Data Encryption",
      status: "Active",
      severity: "Critical",
      description: "End-to-end encryption in transit and at rest",
    },
    {
      name: "Security Monitoring",
      status: "Active",
      severity: "High",
      description: "24/7 threat detection and response",
    },
  ];
  const heroProps = {
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
      text: "View Documentation",
      icon: FaPlay,
      onClick: () => window.open("/resources/docs/security-shield", "_blank"),
    },
    visual: (
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-4 sm:p-6 md:p-8">
        <div className="flex items-center mb-4 sm:mb-6">
          <FaShieldAlt className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-400 mr-2 sm:mr-3" />
          <span className="text-white font-semibold text-sm sm:text-base">
            Security Dashboard
          </span>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {securityFeatures.slice(0, 4).map((feature, index) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + index * 0.2, duration: 0.5 }}
              className="flex items-center justify-between p-3 sm:p-4 bg-gray-800/40 border border-gray-700/50 rounded-lg"
            >
              <div className="flex items-center min-w-0 flex-1">
                <div
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-2 sm:mr-3 flex-shrink-0 ${
                    feature.severity === "Critical"
                      ? "bg-red-400"
                      : feature.severity === "High"
                      ? "bg-orange-400"
                      : "bg-yellow-400"
                  }`}
                ></div>
                <div className="min-w-0 flex-1">
                  <div className="text-white font-medium text-xs sm:text-sm truncate">
                    {feature.name}
                  </div>
                  <div className="text-gray-400 text-xs truncate">
                    {feature.description}
                  </div>
                </div>
              </div>
              <div className="text-green-400 text-xs sm:text-sm font-medium flex-shrink-0 ml-2">
                {feature.status}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  };

  const stats = [
    { label: "Security Scans", value: "10,000+", icon: FaShieldAlt },
    { label: "Vulnerabilities Blocked", value: "99.8%", icon: FaLock },
    { label: "Compliance Rate", value: "100%", icon: FaCheckCircle },
    { label: "Mean Response Time", value: "<5min", icon: FaBolt },
  ];

  const featuresProps = {
    title: "Complete Security Pipeline",
    description:
      "From code analysis to runtime protection - comprehensive security at every stage",
    features,
    selectedFeature,
    setSelectedFeature,
    featureProgress,
    gradientClasses: "from-red-600/30 to-orange-600/30",
  };
  const statsProps = {
    stats,
    title: "Security Performance",
    description:
      "Industry-leading security metrics that protect your deployments",
    gradientClasses: "bg-gradient-to-r from-red-600/10 to-orange-600/10",
  };

  const ctaProps = {
    title: "Ready to Secure Your Deployments?",
    description:
      "Join the waitlist to be first in line when our enterprise-grade security features launch in Q2 2026",
    primaryButton: {
      text: "Join Security Waitlist",
      onClick: () =>
        window.open("https://forms.gle/deployio-security-waitlist", "_blank"),
    },
    secondaryButton: {
      text: "View Documentation",
      onClick: () => window.open("/docs/security-shield", "_blank"),
    },
    gradientClasses: "from-red-600 to-orange-600",
  };
  const resetDemo = () => {
    setDemoData(null);
  };

  const demoProps = {
    isVisible: !!demoData,
    title: "Security Scan Complete",
    successMessage: `Security Score: ${demoData?.securityScore}% - All systems secure`,
    data: demoData || {},
    columns: 3,
    onClose: resetDemo,
    onReset: resetDemo,
    demoType: "Security Preview",
  };

  return (
    <>
      <SEO
        title="Security & Compliance - Automated Security Scanning | Deployio"
        description="Deploy with confidence using Deployio's built-in security scanning, compliance validation, and threat monitoring for all your applications."
        keywords="deployment security, vulnerability scanning, compliance, OWASP, security monitoring, DevSecOps"
      />

      <div className="min-h-screen">
        <ProductHero {...heroProps} />

        <ProductDemo {...demoProps} />

        {/* Security Features Showcase */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-white mb-6">
                Built-in Security Features
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Every deployment includes comprehensive security measures
                without any additional configuration
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {securityFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6 hover:border-red-500/50 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      {feature.name}
                    </h3>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        feature.severity === "Critical"
                          ? "bg-red-500/20 text-red-300"
                          : feature.severity === "High"
                          ? "bg-orange-500/20 text-orange-300"
                          : "bg-yellow-500/20 text-yellow-300"
                      }`}
                    >
                      {feature.severity}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">
                    {feature.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-green-400 text-sm font-medium">
                      Status
                    </span>
                    <span className="text-green-400 font-bold">
                      {feature.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <StickyFeaturesSection {...featuresProps} />

        <ProductStats {...statsProps} />

        <ProductCTA {...ctaProps} />
      </div>
    </>
  );
};

export default SecurityShield;
