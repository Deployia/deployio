import React, { useState } from "react";
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
  ProductDemo,
} from "@components/products";

const AIDeployment = () => {
  const [demoData, setDemoData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const demoAnalyzeRepo = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      setDemoData({
        detectedStack: "MERN Stack",
        confidence: 96,
        dockerfileGenerated: true,
        cicdConfigured: true,
        estimatedDeployTime: "3 minutes",
        optimizationScore: 87,
        securityScore: 94,
      });
    } catch (error) {
      console.error("Demo error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const heroProps = {
    badge: {
      icon: FaBrain,
      text: "AI-Powered DevOps Pipeline",
    },
    title: "Deploy Smarter,",
    subtitle: "Not Harder",
    description:
      "Let AI handle your entire deployment workflow. From detecting your tech stack to generating Dockerfiles and setting up CI/CD - we automate what takes hours into minutes.",
    primaryCTA: {
      text: "Start Deploying",
      icon: FaRocket,
      onClick: () => console.log("Start deploying"),
    },
    secondaryCTA: {
      text: "See AI Demo",
      icon: FaBrain,
      onClick: demoAnalyzeRepo,
      loading: isLoading,
      loadingText: "AI Analyzing...",
    },
    gradient: "from-green-400 via-blue-400 to-purple-400",
    visual: (
      <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-8">
        <div className="space-y-4">
          <div className="flex items-center text-green-400 text-sm font-semibold mb-6">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
            AI DevOps Pipeline Active
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
          ].map((step) => (
            <div
              key={step.title}
              className={`flex items-center p-4 bg-${step.color}-500/10 border border-${step.color}-500/20 rounded-lg`}
            >
              <step.icon className={`w-5 h-5 text-${step.color}-400 mr-3`} />
              <div>
                <div className="text-white font-medium">{step.title}</div>
                <div className="text-gray-400 text-sm">{step.desc}</div>
              </div>
              <div className={`ml-auto text-${step.color}-400 font-bold`}>
                ✓
              </div>
            </div>
          ))}

          <div className="mt-6 pt-6 border-t border-gray-700/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">2m 34s</div>
              <div className="text-gray-400 text-sm">Total Deployment Time</div>
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
      text: "Start Free Trial",
      onClick: () => console.log("Start trial"),
    },
    secondaryButton: {
      text: "View Documentation",
      onClick: () => console.log("View docs"),
    },
    gradientClasses: "from-green-600 to-blue-600",
  };
  const resetDemo = () => {
    setDemoData(null);
  };

  const demoProps = {
    isVisible: !!demoData,
    title: "Repository Analysis Complete",
    successMessage: `✓ ${demoData?.detectedStack} Detected`,
    data: demoData
      ? {
          confidence: `${demoData.confidence}%`,
          deployTime: demoData.estimatedDeployTime,
          optimizationScore: `${demoData.optimizationScore}/100`,
          securityScore: `${demoData.securityScore}/100`,
        }
      : {},
    columns: 4,
    onClose: resetDemo,
    onReset: demoAnalyzeRepo,
    demoType: "AI Analysis",
  };

  return (
    <>
      <SEO
        title="AI-Powered DevOps Automation - Deployio"
        description="Transform your deployment process with AI that detects tech stacks, generates Dockerfiles, sets up CI/CD pipelines, and provides intelligent monitoring."
        keywords="AI DevOps, automated deployment, CI/CD automation, Docker generation, GitHub Actions, deployment automation"
      />

      <div className="min-h-screen">
        <ProductHero {...heroProps} />

        <ProductDemo {...demoProps} />

        <StickyFeaturesSection {...featuresProps} />

        <ProductStats {...statsProps} />

        <ProductCTA {...ctaProps} />
      </div>
    </>
  );
};

export default AIDeployment;
