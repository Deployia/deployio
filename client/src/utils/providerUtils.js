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
  FaExternalLinkAlt,
} from "react-icons/fa";

/**
 * Get provider icon component
 * @param {string} provider - Provider ID
 * @returns {React.Component} - Icon component
 */
export const getProviderIcon = (provider) => {
  switch (provider?.toLowerCase()) {
    case "github":
      return FaGithub;
    case "gitlab":
      return FaGitlab;
    case "bitbucket":
      return FaBitbucket;
    case "azure":
    case "azuredevops":
    case "azure-cloud":
      return FaMicrosoft;
    case "aws":
      return FaAws;
    case "gcp":
    case "google":
      return FaGoogle;
    case "digitalocean":
      return FaDigitalOcean;
    case "docker":
      return FaDocker;
    case "slack":
      return FaSlack;
    case "discord":
      return FaDiscord;
    case "jira":
      return FaJira;
    case "trello":
      return FaTrello;
    default:
      return FaExternalLinkAlt;
  }
};

/**
 * Get provider display name
 * @param {string} provider - Provider ID
 * @returns {string} - Display name
 */
export const getProviderDisplayName = (provider) => {
  switch (provider?.toLowerCase()) {
    case "github":
      return "GitHub";
    case "gitlab":
      return "GitLab";
    case "bitbucket":
      return "Bitbucket";
    case "azure":
    case "azuredevops":
      return "Azure DevOps";
    case "azure-cloud":
      return "Microsoft Azure";
    case "aws":
      return "Amazon Web Services";
    case "gcp":
    case "google":
      return "Google Cloud Platform";
    case "digitalocean":
      return "DigitalOcean";
    case "docker":
      return "Docker Hub";
    case "slack":
      return "Slack";
    case "discord":
      return "Discord";
    case "jira":
      return "Jira";
    case "trello":
      return "Trello";
    default:
      return (
        provider?.charAt(0).toUpperCase() + provider?.slice(1) || "Unknown"
      );
  }
};

/**
 * Get provider color class
 * @param {string} provider - Provider ID
 * @returns {string} - CSS color class
 */
export const getProviderColor = (provider) => {
  switch (provider?.toLowerCase()) {
    case "github":
      return "text-white";
    case "gitlab":
      return "text-orange-400";
    case "bitbucket":
      return "text-blue-400";
    case "azure":
    case "azuredevops":
    case "azure-cloud":
      return "text-blue-400";
    case "aws":
      return "text-orange-400";
    case "gcp":
    case "google":
      return "text-red-400";
    case "digitalocean":
      return "text-blue-400";
    case "docker":
      return "text-blue-400";
    case "slack":
      return "text-purple-400";
    case "discord":
      return "text-indigo-400";
    case "jira":
      return "text-blue-400";
    case "trello":
      return "text-blue-400";
    default:
      return "text-gray-400";
  }
};

/**
 * Get provider background color for badge/icon backgrounds
 * @param {string} provider - Provider ID
 * @returns {string} - CSS background color class
 */
export const getProviderBgColor = (provider) => {
  switch (provider?.toLowerCase()) {
    case "github":
      return "bg-gray-500/20";
    case "gitlab":
      return "bg-orange-500/20";
    case "bitbucket":
      return "bg-blue-500/20";
    case "azure":
    case "azuredevops":
    case "azure-cloud":
      return "bg-blue-500/20";
    case "aws":
      return "bg-orange-500/20";
    case "gcp":
    case "google":
      return "bg-red-500/20";
    case "digitalocean":
      return "bg-blue-500/20";
    case "docker":
      return "bg-blue-500/20";
    case "slack":
      return "bg-purple-500/20";
    case "discord":
      return "bg-indigo-500/20";
    case "jira":
      return "bg-blue-500/20";
    case "trello":
      return "bg-blue-500/20";
    default:
      return "bg-gray-500/20";
  }
};

/**
 * Get provider category
 * @param {string} provider - Provider ID
 * @returns {string} - Category
 */
export const getProviderCategory = (provider) => {
  switch (provider?.toLowerCase()) {
    case "github":
    case "gitlab":
    case "bitbucket":
    case "azure":
    case "azuredevops":
      return "scm";
    case "aws":
    case "gcp":
    case "google":
    case "azure-cloud":
    case "digitalocean":
    case "docker":
      return "cloud";
    case "slack":
    case "discord":
      return "communication";
    case "jira":
    case "trello":
      return "project";
    default:
      return "other";
  }
};

/**
 * Check if provider is available/enabled
 * @param {string} provider - Provider ID
 * @returns {boolean} - Whether provider is enabled
 */
export const isProviderEnabled = (provider) => {
  const enabledProviders = ["github", "gitlab"];
  return enabledProviders.includes(provider?.toLowerCase());
};

/**
 * Check if provider is coming soon
 * @param {string} provider - Provider ID
 * @returns {boolean} - Whether provider is coming soon
 */
export const isProviderComingSoon = (provider) => {
  const comingSoonProviders = [
    "bitbucket",
    "azure",
    "azuredevops",
    "azure-cloud",
    "aws",
    "gcp",
    "google",
    "digitalocean",
    "docker",
    "slack",
    "discord",
    "jira",
    "trello",
  ];
  return comingSoonProviders.includes(provider?.toLowerCase());
};
