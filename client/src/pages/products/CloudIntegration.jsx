import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaCloud,
  FaAws,
  FaGoogle,
  FaMicrosoft,
  FaRocket,
  FaChartLine,
  FaDocker,
  FaCog,
  FaPlay,
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

const CloudIntegration = () => {
  const [demoData, setDemoData] = useState(null);

  const features = [
    {
      icon: FaCloud,
      title: "Seamless Cloud Deployment",
      description:
        "Deploy your applications to leading cloud platforms with intelligent configuration",
      details:
        "Our AI automatically configures your application for optimal deployment across AWS, Google Cloud, Azure, and other major cloud providers with platform-specific optimizations and best practices.",
      platforms: [
        "AWS EC2",
        "Google Cloud Run",
        "Azure Container Instances",
        "DigitalOcean Droplets",
        "Vercel",
        "Netlify",
      ],
    },
    {
      icon: FaDocker,
      title: "Containerized Infrastructure",
      description:
        "Automatic containerization with cloud-optimized Docker configurations",
      details:
        "Generate production-ready Docker containers with multi-stage builds, security scanning, and cloud-specific optimizations for faster deployment and better performance across all platforms.",
      platforms: [
        "Docker",
        "Kubernetes",
        "Container Registry",
        "Orchestration",
        "Auto-scaling",
        "Load Balancing",
      ],
    },
    {
      icon: FaCog,
      title: "Environment Management",
      description:
        "Manage staging, production, and development environments across cloud providers",
      details:
        "Automated environment provisioning with proper isolation, configuration management, and seamless promotion from development to production with zero-downtime deployments.",
      platforms: [
        "Staging",
        "Production",
        "Development",
        "Testing",
        "Blue-Green",
        "Canary Deployment",
      ],
    },
    {
      icon: FaChartLine,
      title: "Performance Monitoring",
      description:
        "Real-time monitoring and optimization recommendations for cloud deployments",
      details:
        "AI-powered performance insights with automatic scaling recommendations, cost optimization, and health monitoring across all your cloud deployments with predictive analytics.",
      platforms: [
        "Metrics",
        "Logging",
        "Alerting",
        "Optimization",
        "Cost Analysis",
        "Predictive Scaling",
      ],
    },
  ];

  const stats = [
    { label: "Cloud Providers", value: "15+", icon: FaCloud },
    { label: "Deployment Success", value: "99.8%", icon: FaRocket },
    { label: "Average Deploy Time", value: "2.1min", icon: FaCog },
    { label: "Cost Optimization", value: "40%", icon: FaChartLine },
  ];

  const heroProps = {
    badge: {
      icon: FaCloud,
      text: "Multi-Cloud Platform",
    },
    comingSoonBadge: {
      text: "Coming Q1 2026",
      highlight: true,
    },
    title: "Deploy Anywhere,",
    subtitle: "Scale Everywhere",
    description:
      "Connect to any cloud provider with intelligent deployment strategies. From AWS to Google Cloud, Azure to DigitalOcean - deploy with confidence across all major platforms.",
    primaryCTA: {
      text: "Join Waitlist",
      icon: FaCloudUploadAlt,
      onClick: () =>
        window.open("https://forms.gle/deployio-cloud-waitlist", "_blank"),
    },
    secondaryCTA: {
      text: "Learn More",
      icon: FaPlay,
      onClick: () => window.open("/docs/cloud-preview", "_blank"),
    },
    gradient: "from-cyan-400 via-blue-400 to-purple-400",
    visual: (
      <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-8">
        <div className="space-y-4">
          <div className="flex items-center text-cyan-400 text-sm font-semibold mb-6">
            <div className="w-3 h-3 bg-cyan-500 rounded-full mr-3 animate-pulse"></div>
            Multi-Cloud Platform Active
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              {
                icon: FaAws,
                name: "AWS",
                color: "orange",
                status: "Connected",
              },
              {
                icon: FaGoogle,
                name: "GCP",
                color: "blue",
                status: "Connected",
              },
              {
                icon: FaMicrosoft,
                name: "Azure",
                color: "blue",
                status: "Connected",
              },
            ].map((provider, index) => (
              <motion.div
                key={provider.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                className={`p-3 bg-${provider.color}-500/10 border border-${provider.color}-500/20 rounded-lg text-center`}
              >
                <provider.icon
                  className={`w-6 h-6 text-${provider.color}-400 mx-auto mb-2`}
                />
                <div className="text-white text-sm font-medium">
                  {provider.name}
                </div>{" "}
                <div className={`text-${provider.color}-400 text-xs`}>
                  {provider.status}
                </div>
              </motion.div>
            ))}
          </div>

          {[
            {
              icon: FaDocker,
              title: "Container Build",
              desc: "Multi-stage optimization",
              color: "blue",
              time: "45s",
            },
            {
              icon: FaCloud,
              title: "Cloud Deploy",
              desc: "AWS EC2 + Load Balancer",
              color: "green",
              time: "1m 30s",
            },
            {
              icon: FaChartLine,
              title: "Performance",
              desc: "Monitoring & scaling",
              color: "purple",
              time: "Real-time",
            },
          ].map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + index * 0.2, duration: 0.5 }}
              className={`flex items-center justify-between p-4 bg-${step.color}-500/10 border border-${step.color}-500/20 rounded-lg`}
            >
              <div className="flex items-center">
                <step.icon className={`w-5 h-5 text-${step.color}-400 mr-3`} />
                <div>
                  <div className="text-white font-medium">{step.title}</div>
                  <div className="text-gray-400 text-sm">{step.desc}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`text-${step.color}-400 font-bold text-sm`}>
                  {step.time}
                </div>{" "}
                <div className={`text-${step.color}-400 font-bold`}>✓</div>
              </div>
            </motion.div>
          ))}

          <div className="mt-6 pt-6 border-t border-gray-700/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                my-app.deployio.app
              </div>
              <div className="text-cyan-400 text-sm">Live on AWS EC2</div>
            </div>
          </div>
        </div>
      </div>
    ),
  };

  const featuresProps = {
    title: "Multi-Cloud Deployment Platform",
    subtitle:
      "Deploy to any cloud provider with intelligent orchestration, monitoring, and optimization across all major platforms",
    features,
    gradient: "from-cyan-500 to-blue-500",
  };

  const statsProps = {
    stats,
    title: "Cloud Deployment Metrics",
    description:
      "Seamless multi-cloud deployments with industry-leading performance and reliability",
    gradientClasses: "bg-gradient-to-r from-cyan-600/10 to-blue-600/10",
  };
  const ctaProps = {
    title: "Ready to Deploy to the Cloud?",
    description:
      "Join thousands of developers deploying faster across multiple cloud providers",
    primaryButton: {
      text: "Join Waitlist",
      onClick: () =>
        window.open("https://forms.gle/deployio-cloud-waitlist", "_blank"),
    },
    secondaryButton: {
      text: "View Cloud Preview",
      onClick: () => window.open("/docs/cloud-preview", "_blank"),
    },
    gradientClasses: "from-cyan-600 to-blue-600",
  };
  const resetDemo = () => {
    setDemoData(null);
  };

  const demoProps = {
    isVisible: !!demoData,
    title: "Cloud Deployment Complete",
    successMessage: `✓ Deployed to ${demoData?.provider} in ${demoData?.deployTime}`,
    data: demoData
      ? {
          provider: demoData.provider,
          region: demoData.region,
          instances: `${demoData.instances} nodes`,
          url: demoData.url,
          costOptimization: `${demoData.costOptimization}% saved`,
          performanceScore: `${demoData.performanceScore}/100`,
        }
      : {},
    columns: 3,
    onClose: resetDemo,
    onReset: resetDemo,
    demoType: "Cloud Deployment Preview",
  };

  return (
    <>
      <SEO
        title="Multi-Cloud Deployment Platform - Deploy Anywhere | Deployio"
        description="Deploy your applications to AWS, Google Cloud, Azure, and 15+ cloud providers with intelligent orchestration, monitoring, and cost optimization."
        keywords="multi-cloud deployment, AWS deployment, Google Cloud, Azure, cloud integration, containerization, DevOps platform"
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

export default CloudIntegration;
