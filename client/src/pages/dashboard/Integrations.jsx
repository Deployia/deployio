import { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaGithub,
  FaGitlab,
  FaBitbucket,
  FaMicrosoft,
  FaAws,
  FaGoogle,
  FaDigitalOcean,
  FaDocker,
  FaSlack,
  FaDiscord,
  FaJira,
  FaTrello,
  FaTools,
  FaCode,
  FaCloud,
  FaBell,
  FaRocket,
  FaCheck,
  FaClock,
} from "react-icons/fa";
import SEO from "@components/SEO";
import { LoadingGrid } from "@components/LoadingSpinner";
import {
  CategoryTabs,
  ConnectedProvidersSummary,
  IntegrationsGrid,
} from "@components/integrations";
import { useGitProviders } from "@hooks/useGitProviders";
import {
  fetchAvailableProviders,
  fetchConnectedProviders,
  fetchDetailedConnectionStatus,
} from "@redux/slices/gitProviderSlice";

const Integrations = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    connections,
    repositories,
    ui,
    loading,
    connectedProviders,
    setActiveCategory,
    initiateConnection,
    disconnectProvider: handleDisconnectProvider,
  } = useGitProviders();

  // Handle OAuth callback with enhanced error handling
  useEffect(() => {
    const connected = searchParams.get("connected");
    const status = searchParams.get("status");
    const error = searchParams.get("error");

    if (connected && status) {
      // Map provider names for display
      const providerDisplayNames = {
        github: "GitHub",
        gitlab: "GitLab",
        azuredevops: "Azure DevOps",
        bitbucket: "Bitbucket",
      };

      const displayName = providerDisplayNames[connected] || connected;

      if (status === "success") {
        console.log(`Successfully connected to ${displayName}!`);

        // Refresh provider data to show new connection
        dispatch(fetchConnectedProviders());
        dispatch(fetchDetailedConnectionStatus());

        // Optional: Trigger repository fetch for newly connected provider
        if (
          connected === "github" ||
          connected === "gitlab" ||
          connected === "azuredevops"
        ) {
          // Future: dispatch(fetchRepositories(connected));
        }
      } else if (status === "error") {
        // Enhanced error message mapping
        const errorMessages = {
          missing_state: "Security validation failed. Please try again.",
          auth_failed: "Authentication failed. Please check your credentials.",
          access_denied:
            "Access was denied. Please try again and authorize the application.",
          invalid_state: "Security token expired. Please try again.",
          provider_error: "Provider service is temporarily unavailable.",
        };

        const errorMessage =
          error && errorMessages[error]
            ? errorMessages[error]
            : error
            ? decodeURIComponent(error)
            : "Connection failed due to an unknown error";

        console.error(`Failed to connect to ${displayName}: ${errorMessage}`);

        // Log error for debugging
        console.error(`OAuth connection failed for ${connected}:`, {
          error,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        });
      }

      // Clean up URL parameters after handling
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, dispatch]);

  // Integration categories
  const integrationCategories = useMemo(
    () => [
      { id: "all", name: "All Integrations", icon: FaTools },
      { id: "scm", name: "Source Control", icon: FaCode },
      { id: "cloud", name: "Cloud Providers", icon: FaCloud },
      { id: "communication", name: "Communication", icon: FaBell },
      { id: "project", name: "Project Management", icon: FaRocket },
    ],
    []
  );

  // Git provider configurations
  const gitProviders = useMemo(
    () => [
      {
        id: "github",
        name: "GitHub",
        description:
          "Connect your GitHub repositories for automated deployments",
        icon: FaGithub,
        category: "scm",
        enabled: true,
        popular: true,
        comingSoon: false,
        features: [
          "Auto-deploy on push",
          "Pull request previews",
          "Branch protection",
          "Webhook integration",
        ],
        setup: "OAuth connection",
      },
      {
        id: "gitlab",
        name: "GitLab",
        description: "Integrate with GitLab for CI/CD pipelines",
        icon: FaGitlab,
        category: "scm",
        enabled: true,
        popular: false,
        comingSoon: false,
        features: [
          "CI/CD integration",
          "Merge request builds",
          "Container registry",
          "Issue tracking",
        ],
        setup: "OAuth connection",
      },
      {
        id: "bitbucket",
        name: "Bitbucket",
        description: "Connect Bitbucket repositories and pipelines",
        icon: FaBitbucket,
        category: "scm",
        enabled: false,
        popular: false,
        comingSoon: true,
        features: ["Repository sync", "Pipeline triggers", "Branch workflows"],
        setup: "OAuth connection",
        timeline: "Q3 2025",
      },
      {
        id: "azure",
        name: "Azure DevOps",
        description: "Integrate with Azure DevOps for enterprise workflows",
        icon: FaMicrosoft,
        category: "scm",
        enabled: false,
        popular: false,
        comingSoon: true,
        features: ["Azure Repos", "Azure Pipelines", "Work Items", "Artifacts"],
        setup: "OAuth connection",
        timeline: "Q3 2025",
      },
    ],
    []
  );

  // Cloud provider configurations (coming soon)
  const cloudProviders = useMemo(
    () => [
      {
        id: "aws",
        name: "Amazon Web Services",
        description: "Deploy to AWS infrastructure with ease",
        icon: FaAws,
        category: "cloud",
        enabled: false,
        popular: true,
        comingSoon: true,
        features: [
          "EC2 deployment",
          "S3 hosting",
          "Lambda functions",
          "RDS integration",
        ],
        setup: "IAM credentials",
        timeline: "Q3 2025",
      },
      {
        id: "gcp",
        name: "Google Cloud Platform",
        description: "Integrate with Google Cloud services",
        icon: FaGoogle,
        category: "cloud",
        enabled: false,
        popular: true,
        comingSoon: true,
        features: [
          "GKE deployment",
          "Cloud Run",
          "Firebase hosting",
          "Cloud Storage",
        ],
        setup: "Service account key",
        timeline: "Q3 2025",
      },
      {
        id: "azure-cloud",
        name: "Microsoft Azure",
        description: "Deploy to Azure cloud infrastructure",
        icon: FaMicrosoft,
        category: "cloud",
        enabled: false,
        popular: false,
        comingSoon: true,
        features: [
          "App Service",
          "Container Instances",
          "Storage Account",
          "CDN",
        ],
        setup: "Service principal",
        timeline: "Q4 2025",
      },
      {
        id: "digitalocean",
        name: "DigitalOcean",
        description: "Simple cloud deployment with DigitalOcean",
        icon: FaDigitalOcean,
        category: "cloud",
        enabled: false,
        popular: false,
        comingSoon: true,
        features: [
          "Droplet deployment",
          "Spaces storage",
          "Load balancers",
          "Kubernetes",
        ],
        setup: "API token",
        timeline: "Q4 2025",
      },
      {
        id: "docker",
        name: "Docker Hub",
        description: "Manage Docker images and containers",
        icon: FaDocker,
        category: "cloud",
        enabled: false,
        popular: true,
        comingSoon: true,
        features: [
          "Image registry",
          "Automated builds",
          "Webhooks",
          "Private repositories",
        ],
        setup: "Docker Hub credentials",
        timeline: "Q4 2025",
      },
    ],
    []
  );

  // Communication providers (future)
  const communicationProviders = useMemo(
    () => [
      {
        id: "slack",
        name: "Slack",
        description: "Get deployment notifications in Slack",
        icon: FaSlack,
        category: "communication",
        enabled: false,
        popular: true,
        comingSoon: true,
        features: [
          "Deploy notifications",
          "Error alerts",
          "Custom channels",
          "Interactive messages",
        ],
        setup: "Slack app installation",
        timeline: "Q4 2025",
      },
      {
        id: "discord",
        name: "Discord",
        description: "Receive updates in your Discord server",
        icon: FaDiscord,
        category: "communication",
        enabled: false,
        popular: false,
        comingSoon: true,
        features: [
          "Webhook notifications",
          "Channel integration",
          "Rich embeds",
          "Role mentions",
        ],
        setup: "Discord webhook",
        timeline: "Q4 2025",
      },
    ],
    []
  );

  // Project management providers (future)
  const projectProviders = useMemo(
    () => [
      {
        id: "jira",
        name: "Jira",
        description: "Track deployments in Jira issues",
        icon: FaJira,
        category: "project",
        enabled: false,
        popular: true,
        comingSoon: true,
        features: [
          "Issue linking",
          "Status updates",
          "Release tracking",
          "Sprint integration",
        ],
        setup: "Atlassian API token",
        timeline: "Q4 2025",
      },
      {
        id: "trello",
        name: "Trello",
        description: "Update Trello cards with deployment status",
        icon: FaTrello,
        category: "project",
        enabled: false,
        popular: false,
        comingSoon: true,
        features: [
          "Card updates",
          "Board automation",
          "Label management",
          "Due date tracking",
        ],
        setup: "Trello API key",
        timeline: "Q4 2025",
      },
    ],
    []
  );

  // Combine all providers
  const allProviders = useMemo(
    () => [
      ...gitProviders,
      ...cloudProviders,
      ...communicationProviders,
      ...projectProviders,
    ],
    [gitProviders, cloudProviders, communicationProviders, projectProviders]
  );

  // Filter providers based on active category
  const filteredProviders = useMemo(() => {
    if (ui.activeCategory === "all") {
      return allProviders;
    }
    return allProviders.filter(
      (provider) => provider.category === ui.activeCategory
    );
  }, [allProviders, ui.activeCategory]);

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchAvailableProviders());
    dispatch(fetchConnectedProviders());
    dispatch(fetchDetailedConnectionStatus());
  }, [dispatch]);

  // Animation variants
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

  if (loading || ui.connectionsLoading) {
    return (
      <div className="dashboard-page">
        <SEO page="integrations" />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white heading mb-2">
            Integrations
          </h1>
          <p className="text-gray-400 body">
            Loading your integration settings...
          </p>
        </motion.div>

        {/* Loading State */}
        <div className="space-y-8">
          <LoadingGrid columns={4} />
          <LoadingGrid columns={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <SEO page="integrations" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white heading mb-2">
          Integrations
        </h1>
        <p className="text-gray-400 body">
          Connect your development tools and cloud providers to streamline your
          deployment workflow.
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Category Tabs */}
        <motion.div variants={itemVariants}>
          <CategoryTabs
            categories={integrationCategories}
            activeCategory={ui.activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </motion.div>

        {/* Welcome Section for New Users */}
        {connectedProviders.length === 0 && (
          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6 sm:p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-blue-500/20 rounded-full">
                  <FaRocket className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 heading">
                Welcome to Integrations
              </h3>
              <p className="text-gray-400 mb-6 max-w-2xl mx-auto text-sm sm:text-base body">
                Connect your development tools to streamline your deployment
                workflow. Start with GitHub or GitLab to import your
                repositories and begin deploying instantly.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full">
                  <FaCheck className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                  <span className="text-xs sm:text-sm text-green-400 font-medium">
                    GitHub & GitLab Ready
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
                  <FaClock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                  <span className="text-xs sm:text-sm text-yellow-400 font-medium">
                    More Coming Q3 2025
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Connected Providers Summary */}
        {connectedProviders.length > 0 && (
          <motion.div variants={itemVariants}>
            <ConnectedProvidersSummary
              connectedProviders={connectedProviders}
              connections={connections}
              repositories={repositories}
            />
          </motion.div>
        )}

        {/* Integrations Grid - Always Show */}
        <motion.div variants={itemVariants}>
          <IntegrationsGrid
            providers={filteredProviders}
            connections={connections}
            onConnect={initiateConnection}
            onDisconnect={handleDisconnectProvider}
            refreshingProvider={ui.refreshingProvider}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Integrations;
