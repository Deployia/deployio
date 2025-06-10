import { motion } from "framer-motion";
import {
  FaCloud,
  FaAws,
  FaGoogle,
  FaMicrosoft,
  FaRocket,
  FaShieldAlt,
  FaChartLine,
  FaGlobe,
  FaCheck,
} from "react-icons/fa";
import { SiDigitalocean, SiVercel, SiNetlify, SiHeroku } from "react-icons/si";
import SEO from "@components/SEO";

const CloudIntegration = () => {
  const cloudProviders = [
    {
      name: "Amazon Web Services",
      icon: FaAws,
      color: "text-orange-500",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
      description: "Deploy to EC2, ECS, Lambda, and more AWS services",
      features: ["Auto-scaling", "Load balancing", "Global regions"],
    },
    {
      name: "Google Cloud Platform",
      icon: FaGoogle,
      color: "text-blue-500",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      description:
        "Integrate with GCP services and Google's global infrastructure",
      features: ["Kubernetes Engine", "Cloud Functions", "AI/ML services"],
    },
    {
      name: "Microsoft Azure",
      icon: FaMicrosoft,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      description: "Deploy to Azure's enterprise-grade cloud platform",
      features: ["Azure DevOps", "Container Instances", "Active Directory"],
    },
    {
      name: "DigitalOcean",
      icon: SiDigitalocean,
      color: "text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      description: "Simple cloud computing with developer-friendly pricing",
      features: ["Droplets", "Kubernetes", "App Platform"],
    },
  ];

  const platformProviders = [
    {
      name: "Vercel",
      icon: SiVercel,
      color: "text-gray-900 dark:text-white",
      bgColor: "bg-gray-100 dark:bg-gray-800",
      description: "Deploy modern web applications with zero configuration",
    },
    {
      name: "Netlify",
      icon: SiNetlify,
      color: "text-teal-500",
      bgColor: "bg-teal-100 dark:bg-teal-900/20",
      description: "JAMstack deployments with continuous deployment",
    },
    {
      name: "Heroku",
      icon: SiHeroku,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      description: "Platform as a service with Git-based deployments",
    },
  ];

  const features = [
    {
      icon: FaRocket,
      title: "One-Click Deployment",
      description: "Deploy to multiple cloud providers with a single command",
    },
    {
      icon: FaShieldAlt,
      title: "Secure by Default",
      description: "Built-in security best practices and compliance standards",
    },
    {
      icon: FaChartLine,
      title: "Performance Optimization",
      description: "Automatic optimization for each cloud provider's strengths",
    },
    {
      icon: FaGlobe,
      title: "Global Distribution",
      description: "Deploy across multiple regions for optimal performance",
    },
  ];

  const benefits = [
    "Avoid vendor lock-in with multi-cloud strategies",
    "Reduce deployment complexity across different platforms",
    "Automatic failover and disaster recovery",
    "Cost optimization through cloud provider comparison",
    "Unified monitoring and management dashboard",
    "Infrastructure as code with version control",
  ];

  return (
    <>
      <SEO
        title="Cloud Integration - Multi-Cloud Deployment Platform | Deployio"
        description="Deploy your applications across multiple cloud providers with Deployio's unified cloud integration platform. Support for AWS, GCP, Azure, and more."
        keywords="cloud integration, multi-cloud deployment, AWS, Google Cloud, Azure, DigitalOcean, cloud platform"
      />

      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Hero Section */}
        <section className="relative py-20 px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-6">
                <FaCloud className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Multi-Cloud
                <span className="text-blue-600 dark:text-blue-400">
                  {" "}
                  Integration
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
                Deploy your applications across multiple cloud providers with
                unified management, automated optimization, and seamless
                scaling.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                  Start Free Trial
                </button>
                <button className="px-8 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-semibold transition-colors">
                  View Documentation
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Cloud Providers Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Supported Cloud Providers
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Deploy to your preferred cloud infrastructure with native
                integration
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {cloudProviders.map((provider, index) => {
                const Icon = provider.icon;
                return (
                  <motion.div
                    key={provider.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-center mb-4">
                      <div
                        className={`p-3 rounded-lg ${provider.bgColor} mr-4`}
                      >
                        <Icon className={`w-8 h-8 ${provider.color}`} />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {provider.name}
                      </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {provider.description}
                    </p>
                    <ul className="space-y-2">
                      {provider.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-center text-sm text-gray-600 dark:text-gray-300"
                        >
                          <FaCheck className="w-4 h-4 text-green-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>

            {/* Platform Providers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                Platform as a Service
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {platformProviders.map((platform, index) => {
                  const Icon = platform.icon;
                  return (
                    <div
                      key={platform.name}
                      className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700"
                    >
                      <div
                        className={`p-3 rounded-lg ${platform.bgColor} w-fit mx-auto mb-4`}
                      >
                        <Icon className={`w-6 h-6 ${platform.color}`} />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {platform.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {platform.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Powerful Features
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Everything you need to manage multi-cloud deployments
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="text-center"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-6">
                      <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  Why Choose Multi-Cloud?
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                  Multi-cloud strategies provide flexibility, redundancy, and
                  cost optimization that single-cloud deployments can't match.
                </p>
                <ul className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center text-gray-700 dark:text-gray-300"
                    >
                      <FaCheck className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      {benefit}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white"
              >
                <h3 className="text-2xl font-bold mb-6">
                  Ready to Get Started?
                </h3>
                <p className="text-blue-100 mb-8">
                  Join thousands of developers already using Deployio for their
                  multi-cloud deployment needs.
                </p>
                <div className="space-y-4">
                  <button className="w-full py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                    Start Free Trial
                  </button>
                  <button className="w-full py-3 border border-blue-300 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                    Schedule Demo
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default CloudIntegration;
