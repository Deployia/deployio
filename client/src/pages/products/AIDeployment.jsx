import React from "react";
import { motion } from "framer-motion";
import {
  FaBrain,
  FaBolt,
  FaShieldAlt,
  FaRocket,
  FaGithub,
  FaDocker,
  FaCog,
  FaEye,
} from "react-icons/fa";
import SEO from "@components/SEO";
import {
  ProductHero,
  StickyFeaturesSection,
  ProductStats,
  ProductCTA,
} from "@components/products";

const AIDeployment = () => {
  const features = [
    {
      icon: FaBrain,
      title: "Smart Stack Detection",
      description:
        "AI automatically identifies your technology stack from GitHub repositories",
      details:
        "Our AI analyzes your codebase and intelligently detects MERN, Django, Flask, Spring Boot, and more, configuring optimal deployment settings for each stack.",
      platforms: [
        "MERN Stack",
        "Django",
        "Flask",
        "Spring Boot",
        "Laravel",
        "Ruby on Rails",
      ],
    },
    {
      icon: FaDocker,
      title: "Intelligent Dockerfile Generation",
      description: "Generate optimized Docker containers automatically",
      details:
        "AI creates production-ready Dockerfiles with multi-stage builds, security best practices, and performance optimizations tailored to your specific application.",
      platforms: [
        "Multi-stage Builds",
        "Security Scanning",
        "Performance Optimization",
        "Production Ready",
      ],
    },
    {
      icon: FaCog,
      title: "CI/CD Pipeline Automation",
      description: "Set up GitHub Actions workflows with zero configuration",
      details:
        "Automatically generate complete CI/CD pipelines with testing, security scanning, building, and deployment stages - all customized for your project.",
      platforms: [
        "GitHub Actions",
        "Automated Testing",
        "Security Scanning",
        "Deployment Stages",
      ],
    },
    {
      icon: FaEye,
      title: "Real-time Monitoring & Insights",
      description:
        "Monitor deployments with AI-powered diagnostics and recommendations",
      details:
        "Get intelligent error diagnostics, performance insights, and optimization suggestions powered by AI analysis of your deployment patterns.",
      platforms: [
        "Error Diagnostics",
        "Performance Insights",
        "AI Analytics",
        "Optimization Suggestions",
      ],
    },
  ];

  const stats = [
    { label: "Applications Deployed", value: "5,000+", icon: FaRocket },
    { label: "Deployment Time Reduction", value: "85%", icon: FaBolt },
    { label: "Stack Detection Accuracy", value: "96%", icon: FaBrain },
    { label: "Successful Deployments", value: "99.2%", icon: FaShieldAlt },
  ];

  const heroProps = {
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
      text: "View Documentation",
      icon: FaBrain,
      onClick: () => window.open("/resources/docs/ai-deployment", "_blank"),
    },
    gradient: "from-green-400 via-blue-400 to-purple-400",
    visual: (
      <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-3 sm:p-4 md:p-6">
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center text-green-400 text-xs font-semibold mb-3 sm:mb-4">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full mr-2 sm:mr-3 animate-pulse"></div>
            <span className="hidden sm:inline">AI DevOps Pipeline Active</span>
            <span className="sm:hidden">AI Pipeline Active</span>
          </div>

          {[
            {
              icon: FaGithub,
              title: "Repository Analysis",
              desc: "Scanning project structure...",
              color: "blue",
            },
            {
              icon: FaBrain,
              title: "Stack Detection",
              desc: "MERN Stack identified (98%)",
              color: "green",
            },
            {
              icon: FaDocker,
              title: "Configuration Generation",
              desc: "Dockerfile & CI/CD created",
              color: "purple",
            },
            {
              icon: FaRocket,
              title: "Live Deployment",
              desc: "my-app.deployio.app",
              color: "orange",
            },
          ].map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + index * 0.2, duration: 0.5 }}
              className={`flex items-center p-2 sm:p-3 bg-${step.color}-500/10 border border-${step.color}-500/20 rounded-lg`}
            >
              <step.icon
                className={`w-3 h-3 sm:w-4 sm:h-4 text-${step.color}-400 mr-2 flex-shrink-0`}
              />
              <div className="min-w-0 flex-1">
                <div className="text-white font-medium text-xs sm:text-sm truncate">
                  {step.title}
                </div>
                <div className="text-gray-400 text-xs truncate">
                  {step.desc}
                </div>
              </div>
              <div
                className={`ml-2 text-${step.color}-400 font-bold text-xs sm:text-sm flex-shrink-0`}
              >
                ✓
              </div>
            </motion.div>
          ))}

          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-700/50">
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-white mb-1">
                2m 34s
              </div>
              <div className="text-gray-400 text-xs">Total Deployment Time</div>
            </div>
          </div>
        </div>
      </div>
    ),
  };

  const featuresProps = {
    title: "AI-Powered DevOps Automation Pipeline",
    subtitle:
      "Experience how our AI transforms your entire deployment workflow - from code analysis to production deployment",
    features,
    gradient: "from-green-500 to-blue-500",
  };

  const statsProps = {
    stats,
    title: "Deployment Performance",
    description:
      "Industry-leading automation metrics that accelerate your development workflow",
    gradientClasses: "bg-gradient-to-r from-green-600/10 to-blue-600/10",
  };
  const ctaProps = {
    title: "Ready to Automate Your Deployments?",
    description:
      "Join thousands of developers already deploying faster with AI-powered automation",
    primaryButton: {
      text: "Join Waitlist",
      onClick: () =>
        window.open("https://forms.gle/deployio-ai-waitlist", "_blank"),
    },
    secondaryButton: {
      text: "View Documentation",
      onClick: () =>
        window.open("/resources/docs/products/ai-deployment", "_blank"),
    },
    gradientClasses: "from-green-600 to-blue-600",
  };

  return (
    <>
      {" "}
      <SEO page="aiDeployment" />
      <div className="min-h-screen">
        <ProductHero {...heroProps} />

        <StickyFeaturesSection {...featuresProps} />

        <ProductStats {...statsProps} />

        <ProductCTA {...ctaProps} />
      </div>
    </>
  );
};

export default AIDeployment;
