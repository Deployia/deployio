import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaGithub,
  FaGitlab,
  FaBitbucket,
  FaSlack,
  FaDiscord,
  FaJira,
  FaTrello,
  FaDocker,
  FaAws,
  FaGoogle,
  FaMicrosoft,
  FaDigitalOcean,
  FaPlus,
  FaCheck,
  FaCog,
  FaTrash,
  FaExternalLinkAlt,
  FaKey,
  FaShieldAlt,
  FaRocket,
  FaCode,
  FaCloud,
  FaBell,
  FaTools,
} from "react-icons/fa";
import SEO from "../components/SEO";
import { toast } from "react-hot-toast";

const Integrations = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [connectedIntegrations, setConnectedIntegrations] = useState([
    { id: "github", name: "GitHub", connected: true, lastSync: "2 hours ago" },
    { id: "slack", name: "Slack", connected: true, lastSync: "5 minutes ago" },
    { id: "aws", name: "AWS", connected: true, lastSync: "1 hour ago" },
  ]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);

  const integrationCategories = [
    { id: "all", name: "All", icon: FaTools },
    { id: "scm", name: "Source Control", icon: FaCode },
    { id: "cloud", name: "Cloud Providers", icon: FaCloud },
    { id: "communication", name: "Communication", icon: FaBell },
    { id: "project", name: "Project Management", icon: FaRocket },
  ];

  const availableIntegrations = [
    {
      id: "github",
      name: "GitHub",
      description: "Connect your GitHub repositories for automated deployments",
      icon: FaGithub,
      category: "scm",
      popular: true,
      features: [
        "Auto-deploy on push",
        "Pull request previews",
        "Branch protection",
      ],
      setup: "OAuth connection",
    },
    {
      id: "gitlab",
      name: "GitLab",
      description: "Integrate with GitLab for CI/CD pipelines",
      icon: FaGitlab,
      category: "scm",
      popular: false,
      features: [
        "CI/CD integration",
        "Merge request builds",
        "Container registry",
      ],
      setup: "Personal access token",
    },
    {
      id: "bitbucket",
      name: "Bitbucket",
      description: "Connect Bitbucket repositories and pipelines",
      icon: FaBitbucket,
      category: "scm",
      popular: false,
      features: ["Repository sync", "Pipeline triggers", "Branch workflows"],
      setup: "App password",
    },
    {
      id: "aws",
      name: "Amazon Web Services",
      description: "Deploy to AWS infrastructure with ease",
      icon: FaAws,
      category: "cloud",
      popular: true,
      features: [
        "EC2 deployment",
        "S3 hosting",
        "Lambda functions",
        "RDS integration",
      ],
      setup: "IAM credentials",
    },
    {
      id: "gcp",
      name: "Google Cloud Platform",
      description: "Integrate with Google Cloud services",
      icon: FaGoogle,
      category: "cloud",
      popular: true,
      features: [
        "GKE deployment",
        "Cloud Run",
        "Firebase hosting",
        "Cloud Storage",
      ],
      setup: "Service account key",
    },
    {
      id: "azure",
      name: "Microsoft Azure",
      description: "Deploy to Azure cloud infrastructure",
      icon: FaMicrosoft,
      category: "cloud",
      popular: false,
      features: [
        "App Service",
        "Container Instances",
        "Storage Account",
        "CDN",
      ],
      setup: "Service principal",
    },
    {
      id: "digitalocean",
      name: "DigitalOcean",
      description: "Simple cloud deployment with DigitalOcean",
      icon: FaDigitalOcean,
      category: "cloud",
      popular: false,
      features: [
        "Droplet deployment",
        "Spaces storage",
        "Load balancers",
        "Kubernetes",
      ],
      setup: "API token",
    },
    {
      id: "docker",
      name: "Docker Hub",
      description: "Manage Docker images and containers",
      icon: FaDocker,
      category: "cloud",
      popular: true,
      features: [
        "Image registry",
        "Automated builds",
        "Webhooks",
        "Private repositories",
      ],
      setup: "Docker Hub credentials",
    },
    {
      id: "slack",
      name: "Slack",
      description: "Get deployment notifications in Slack",
      icon: FaSlack,
      category: "communication",
      popular: true,
      features: [
        "Deploy notifications",
        "Error alerts",
        "Custom channels",
        "Interactive messages",
      ],
      setup: "Slack app installation",
    },
    {
      id: "discord",
      name: "Discord",
      description: "Receive updates in your Discord server",
      icon: FaDiscord,
      category: "communication",
      popular: false,
      features: [
        "Webhook notifications",
        "Channel integration",
        "Rich embeds",
        "Role mentions",
      ],
      setup: "Discord webhook",
    },
    {
      id: "jira",
      name: "Jira",
      description: "Track deployments in Jira issues",
      icon: FaJira,
      category: "project",
      popular: true,
      features: [
        "Issue linking",
        "Status updates",
        "Release tracking",
        "Sprint integration",
      ],
      setup: "Atlassian API token",
    },
    {
      id: "trello",
      name: "Trello",
      description: "Update Trello cards with deployment status",
      icon: FaTrello,
      category: "project",
      popular: false,
      features: [
        "Card updates",
        "Board automation",
        "Label management",
        "Due date tracking",
      ],
      setup: "Trello API key",
    },
  ];

  const filteredIntegrations =
    activeCategory === "all"
      ? availableIntegrations
      : availableIntegrations.filter(
          (integration) => integration.category === activeCategory
        );

  const isConnected = (integrationId) => {
    return connectedIntegrations.some(
      (conn) => conn.id === integrationId && conn.connected
    );
  };

  const handleConnect = (integration) => {
    setSelectedIntegration(integration);
    setShowConnectModal(true);
  };

  const connectIntegration = () => {
    if (!selectedIntegration) return;

    // Simulate connection process
    setTimeout(() => {
      setConnectedIntegrations((prev) => [
        ...prev.filter((conn) => conn.id !== selectedIntegration.id),
        {
          id: selectedIntegration.id,
          name: selectedIntegration.name,
          connected: true,
          lastSync: "Just now",
        },
      ]);

      setShowConnectModal(false);
      setSelectedIntegration(null);
      toast.success(`${selectedIntegration.name} connected successfully!`);
    }, 1500);
  };

  const disconnectIntegration = (integrationId) => {
    setConnectedIntegrations((prev) =>
      prev.map((conn) =>
        conn.id === integrationId ? { ...conn, connected: false } : conn
      )
    );
    toast.success("Integration disconnected");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <>
      <SEO
        title="Integrations - Deployio"
        description="Connect your favorite tools and services with Deployio. Integrate with GitHub, Slack, AWS, and many more platforms."
        keywords="integrations, GitHub, Slack, AWS, Docker, CI/CD, automation"
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
                <FaTools className="text-blue-600" />
                Integrations
              </h1>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Connect your favorite tools and services to streamline your
                deployment workflow
              </p>
            </motion.div>

            {/* Connected Integrations Summary */}
            <motion.div
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Connected Integrations
                </h3>
                <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-medium">
                  {
                    connectedIntegrations.filter((conn) => conn.connected)
                      .length
                  }{" "}
                  Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {connectedIntegrations
                  .filter((conn) => conn.connected)
                  .map((integration) => {
                    const integrationData = availableIntegrations.find(
                      (i) => i.id === integration.id
                    );
                    return (
                      <div
                        key={integration.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {integrationData && (
                            <integrationData.icon className="text-2xl text-gray-700 dark:text-gray-300" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {integration.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Last sync: {integration.lastSync}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaCheck className="text-green-600" />
                          <button
                            onClick={() =>
                              disconnectIntegration(integration.id)
                            }
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {connectedIntegrations.filter((conn) => conn.connected).length ===
                0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No integrations connected yet. Browse available integrations
                  below.
                </p>
              )}
            </motion.div>

            {/* Category Filter */}
            <motion.div variants={itemVariants} className="flex justify-center">
              <div className="bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-wrap gap-1">
                {integrationCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                      activeCategory === category.id
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <category.icon />
                    {category.name}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Available Integrations */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredIntegrations.map((integration) => (
                <div
                  key={integration.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <integration.icon className="text-3xl text-gray-700 dark:text-gray-300" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          {integration.name}
                          {integration.popular && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full">
                              Popular
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {integration.setup}
                        </p>
                      </div>
                    </div>

                    {isConnected(integration.id) ? (
                      <div className="flex items-center gap-2">
                        <FaCheck className="text-green-600" />
                        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <FaCog />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleConnect(integration)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <FaPlus />
                        Connect
                      </button>
                    )}
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {integration.description}
                  </p>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      Features:
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {integration.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <FaCheck className="text-green-600 text-xs" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Help Section */}
            <motion.div
              variants={itemVariants}
              className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 text-center"
            >
              <FaShieldAlt className="text-3xl text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Need Help with Integrations?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Our team is here to help you set up and configure your
                integrations for optimal performance.
              </p>
              <div className="flex justify-center gap-4">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <FaExternalLinkAlt />
                  View Documentation
                </button>
                <button className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                  Contact Support
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Connect Integration Modal */}
      {showConnectModal && selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4"
          >
            <div className="text-center mb-6">
              <selectedIntegration.icon className="text-4xl text-gray-700 dark:text-gray-300 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Connect {selectedIntegration.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                You'll be redirected to {selectedIntegration.name} to authorize
                the connection.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <FaKey className="text-blue-600" />
                Permissions Required:
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {selectedIntegration.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <FaCheck className="text-green-600 text-xs" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConnectModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={connectIntegration}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FaExternalLinkAlt />
                Connect
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default Integrations;
