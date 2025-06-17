import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaCogs,
  FaGitAlt,
  FaRocket,
  FaLayerGroup,
  FaCheckCircle,
  FaPlay,
  FaBolt,
  FaCode,
  FaCloudUploadAlt,
} from "react-icons/fa";
import SEO from "@components/SEO";
import {
  ProductHero,
  StickyFeaturesSection,
  ProductStats,
  ProductCTA,
  ProductDemo,
} from "@components/products";

const DevOpsAutomation = () => {
  const [demoData, setDemoData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const features = [
    {
      icon: FaGitAlt,
      title: "Automated CI/CD Pipelines",
      description:
        "Generate complete GitHub Actions workflows with zero configuration",
      details:
        "Our AI creates comprehensive CI/CD pipelines with automated testing, code quality checks, security scanning, building, and deployment stages - all customized for your specific technology stack and requirements.",
      platforms: [
        "GitHub Actions",
        "GitLab CI",
        "Jenkins",
        "CircleCI",
        "Azure DevOps",
        "Bitbucket Pipelines",
      ],
    },
    {
      icon: FaLayerGroup,
      title: "Multi-Environment Orchestration",
      description:
        "Seamlessly manage development, staging, and production environments",
      details:
        "Automated environment provisioning with proper isolation, configuration management, blue-green deployments, and seamless promotion workflows from development to production with zero downtime.",
      platforms: [
        "Development",
        "Staging",
        "Production",
        "Blue-Green",
        "Canary Releases",
        "Feature Branches",
      ],
    },
    {
      icon: FaBolt,
      title: "Build Optimization & Caching",
      description:
        "Intelligent build optimization with advanced caching strategies",
      details:
        "Smart dependency caching, parallel build processes, incremental builds, and optimization techniques that reduce build times by up to 70% while maintaining reliability and consistency.",
      platforms: [
        "Docker Layer Caching",
        "Dependency Caching",
        "Parallel Builds",
        "Incremental Builds",
        "Build Matrix",
        "Artifact Management",
      ],
    },
    {
      icon: FaCheckCircle,
      title: "Quality Gates & Automation",
      description:
        "Automated testing, code quality, and security checks in your pipeline",
      details:
        "Comprehensive quality assurance with automated unit testing, integration testing, code coverage reports, security vulnerability scanning, and compliance checks before any deployment.",
      platforms: [
        "Unit Testing",
        "Integration Testing",
        "Code Coverage",
        "Security Scanning",
        "Quality Gates",
        "Compliance Checks",
      ],
    },
  ];

  const stats = [
    { label: "Pipeline Templates", value: "100+", icon: FaCogs },
    { label: "Build Time Reduction", value: "70%", icon: FaBolt },
    { label: "Deployment Success", value: "99.5%", icon: FaRocket },
    { label: "Quality Gate Accuracy", value: "98%", icon: FaCheckCircle },
  ];

  const demoPipelineSetup = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setDemoData({
        pipelineType: "Full Stack CI/CD",
        stages: 6,
        estimatedBuildTime: "4m 30s",
        qualityGates: 8,
        securityChecks: 12,
        environments: 3,
        deploymentStrategy: "Blue-Green",
        success: true,
      });
    } catch (error) {
      console.error("Demo error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const heroProps = {
    badge: {
      icon: FaCogs,
      text: "DevOps Automation Platform",
    },
    title: "Automate Your",
    subtitle: "Entire DevOps Workflow",
    description:
      "From code commit to production deployment - automate your entire DevOps pipeline with intelligent CI/CD workflows, quality gates, and multi-environment orchestration.",
    primaryCTA: {
      text: "Build Pipeline",
      icon: FaCogs,
      onClick: () => console.log("Build pipeline"),
    },
    secondaryCTA: {
      text: "Try Demo",
      icon: FaPlay,
      onClick: demoPipelineSetup,
      loading: isLoading,
      loadingText: "Building Pipeline...",
    },
    gradient: "from-orange-400 via-red-400 to-purple-400",
    visual: (
      <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-4 sm:p-6 md:p-8">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center text-orange-400 text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 rounded-full mr-2 sm:mr-3 animate-pulse"></div>
            <span className="hidden sm:inline">DevOps Pipeline Building</span>
            <span className="sm:hidden">Pipeline Building</span>
          </div>

          {[
            {
              icon: FaCode,
              title: "Code Analysis",
              desc: "Scanning repository structure...",
              color: "blue",
              stage: "1/6",
            },
            {
              icon: FaCheckCircle,
              title: "Quality Gates",
              desc: "Setting up testing & linting",
              color: "green",
              stage: "2/6",
            },
            {
              icon: FaBolt,
              title: "Build Optimization",
              desc: "Configuring caching & parallel builds",
              color: "orange",
              stage: "3/6",
            },
            {
              icon: FaLayerGroup,
              title: "Environment Setup",
              desc: "Dev → Staging → Production",
              color: "purple",
              stage: "4/6",
            },
            {
              icon: FaCloudUploadAlt,
              title: "Deployment Strategy",
              desc: "Blue-Green deployment configured",
              color: "cyan",
              stage: "5/6",
            },
            {
              icon: FaRocket,
              title: "Pipeline Ready",
              desc: "CI/CD automation complete",
              color: "green",
              stage: "6/6",
            },
          ].map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + index * 0.2, duration: 0.5 }}
              className={`flex items-center justify-between p-3 sm:p-4 bg-${step.color}-500/10 border border-${step.color}-500/20 rounded-lg`}
            >
              <div className="flex items-center min-w-0 flex-1">
                <step.icon
                  className={`w-4 h-4 sm:w-5 sm:h-5 text-${step.color}-400 mr-2 sm:mr-3 flex-shrink-0`}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-white font-medium text-sm sm:text-base truncate">
                    {step.title}
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm truncate">
                    {step.desc}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
                <div
                  className={`text-${step.color}-400 font-bold text-xs sm:text-sm`}
                >
                  {step.stage}
                </div>
                <div
                  className={`text-${step.color}-400 font-bold text-sm sm:text-base`}
                >
                  ✓
                </div>
              </div>
            </motion.div>
          ))}

          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-700/50">
            <div className="grid grid-cols-2 gap-2 sm:gap-4 text-center">
              <div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                  8
                </div>
                <div className="text-gray-400 text-xs sm:text-sm">
                  Quality Gates
                </div>
              </div>
              <div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                  4m 30s
                </div>
                <div className="text-gray-400 text-xs sm:text-sm">
                  Build Time
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  };

  const featuresProps = {
    title: "Complete DevOps Automation Platform",
    subtitle:
      "End-to-end automation for your development workflow - from code commit to production deployment with intelligent orchestration",
    features,
    gradient: "from-orange-500 to-red-500",
  };

  const statsProps = {
    stats,
    title: "DevOps Performance Metrics",
    description:
      "Industry-leading automation that accelerates development cycles and improves deployment reliability",
    gradientClasses: "bg-gradient-to-r from-orange-600/10 to-red-600/10",
  };

  const ctaProps = {
    title: "Ready to Automate Your DevOps?",
    description:
      "Join thousands of development teams already accelerating their workflows with intelligent automation",
    primaryButton: {
      text: "Start Automation",
      onClick: () => console.log("Start automation"),
    },
    secondaryButton: {
      text: "View Documentation",
      onClick: () => window.open("/resources/docs/devops-automation", "_blank"),
    },
    gradientClasses: "from-orange-600 to-red-600",
  };
  const resetDemo = () => {
    setDemoData(null);
  };

  const demoProps = {
    isVisible: !!demoData,
    title: "DevOps Pipeline Created",
    successMessage: `✓ ${demoData?.pipelineType} Pipeline Ready (${demoData?.stages} stages)`,
    data: demoData
      ? {
          stages: `${demoData.stages} stages`,
          buildTime: demoData.estimatedBuildTime,
          qualityGates: `${demoData.qualityGates} gates`,
          securityChecks: `${demoData.securityChecks} checks`,
          environments: `${demoData.environments} envs`,
          strategy: demoData.deploymentStrategy,
        }
      : {},
    columns: 3,
    onClose: resetDemo,
    onReset: demoPipelineSetup,
    demoType: "Pipeline Creation",
  };

  return (
    <>
      {" "}
      <SEO page="devopsAutomation" />
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

export default DevOpsAutomation;
