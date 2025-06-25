import { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
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
} from "react-icons/fa";
import SEO from "@components/SEO";
import { LoadingGrid } from "@components/LoadingSpinner";
import {
  CategoryTabs,
  ConnectedProvidersSummary,
  IntegrationsGrid,
  RepositorySection,
} from "@components/integrations";
import { useGitProviders } from "@hooks/useGitProviders";
import {
  fetchAvailableProviders,
  fetchConnectedProviders,
  fetchDetailedConnectionStatus,
} from "@redux/slices/gitProviderSlice";

const Integrations = () => {
  const dispatch = useDispatch();
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

        {/* Integrations Grid */}
        <motion.div variants={itemVariants}>
          <IntegrationsGrid
            providers={filteredProviders}
            connections={connections}
            onConnect={initiateConnection}
            onDisconnect={handleDisconnectProvider}
            refreshingProvider={ui.refreshingProvider}
          />
        </motion.div>

        {/* Repository Section for Connected Providers */}
        {connectedProviders.length > 0 && (
          <motion.div variants={itemVariants}>
            <RepositorySection
              connectedProviders={connectedProviders}
              repositories={repositories}
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Integrations;
