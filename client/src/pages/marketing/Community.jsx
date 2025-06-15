import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaUsers,
  FaGithub,
  FaDiscord,
  FaReddit,
  FaStackOverflow,
  FaCalendarAlt,
  FaTrophy,
  FaCode,
  FaLightbulb,
  FaHeart,
  FaStar,
  FaComments,
  FaUserFriends,
  FaExternalLinkAlt,
  FaBookmark,
  FaHandsHelping,
  FaFire,
  FaCrown,
} from "react-icons/fa";
import SEO from "@components/SEO";
import {
  ResourcePageHeader,
  ResourceCard,
  ResourceSidebar,
  ResourceCTA,
} from "@components/resources/ResourcePageComponents";
import { Link } from "react-router-dom";

const Community = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const communityStats = [
    {
      label: "Community Members",
      value: "25,000+",
      icon: FaUsers,
      color: "blue",
      trend: "+2.4k this month",
    },
    {
      label: "GitHub Stars",
      value: "12,500+",
      icon: FaStar,
      color: "yellow",
      trend: "+890 this month",
    },
    {
      label: "Monthly Discussions",
      value: "2,800+",
      icon: FaComments,
      color: "green",
      trend: "+15% vs last month",
    },
    {
      label: "Active Contributors",
      value: "450+",
      icon: FaUserFriends,
      color: "purple",
      trend: "+67 new contributors",
    },
  ];

  const communityPlatforms = [
    {
      name: "Discord Server",
      description:
        "Join our vibrant Discord community for real-time discussions, support, and networking with fellow developers.",
      icon: FaDiscord,
      members: "18,500+ members",
      activity: "Very Active",
      color: "from-indigo-500 to-purple-600",
      link: "https://discord.gg/deployio",
      features: [
        "24/7 Support",
        "Voice Channels",
        "Weekly Events",
        "Code Reviews",
      ],
    },
    {
      name: "GitHub Discussions",
      description:
        "Contribute to Deployio's development, report issues, suggest features, and collaborate on open-source projects.",
      icon: FaGithub,
      members: "12,500+ stars",
      activity: "Active Development",
      color: "from-gray-700 to-gray-900",
      link: "https://github.com/deployio/deployio/discussions",
      features: [
        "Open Source",
        "Issue Tracking",
        "Feature Requests",
        "Pull Requests",
      ],
    },
    {
      name: "Reddit Community",
      description:
        "Share your Deployio experiences, ask questions, and discover best practices with the broader community.",
      icon: FaReddit,
      members: "8,200+ members",
      activity: "Daily Posts",
      color: "from-orange-500 to-red-600",
      link: "https://reddit.com/r/deployio",
      features: [
        "Daily Discussions",
        "Showcase Projects",
        "Tips & Tricks",
        "AMAs",
      ],
    },
    {
      name: "Stack Overflow",
      description:
        "Get technical help and share knowledge about Deployio deployment challenges and solutions.",
      icon: FaStackOverflow,
      members: "3,400+ questions",
      activity: "Expert Answers",
      color: "from-orange-400 to-yellow-500",
      link: "https://stackoverflow.com/questions/tagged/deployio",
      features: [
        "Expert Help",
        "Code Solutions",
        "Best Practices",
        "Quick Answers",
      ],
    },
  ];

  const communityEvents = [
    {
      title: "Monthly Community Meetup",
      date: "January 25, 2025",
      time: "6:00 PM UTC",
      type: "Virtual Event",
      description:
        "Join our monthly virtual meetup featuring product updates, community showcases, and networking.",
      attendees: "500+ registered",
      status: "upcoming",
    },
    {
      title: "Deployio DevFest 2025",
      date: "March 15-16, 2025",
      time: "All Day",
      type: "Conference",
      description:
        "Two-day virtual conference with expert talks, workshops, and hands-on sessions.",
      attendees: "2,000+ registered",
      status: "early-bird",
    },
    {
      title: "Deployment Workshop Series",
      date: "Every Tuesday",
      time: "3:00 PM UTC",
      type: "Weekly Workshop",
      description:
        "Weekly hands-on workshops covering different deployment strategies and best practices.",
      attendees: "150+ per session",
      status: "ongoing",
    },
  ];

  const contributorSpotlight = [
    {
      name: "Sarah Chen",
      role: "Core Contributor",
      avatar: "👩‍💻",
      contributions: "125 commits",
      specialty: "CLI Development",
      badge: "Top Contributor",
    },
    {
      name: "Alex Rodriguez",
      role: "Community Moderator",
      avatar: "👨‍🔧",
      contributions: "2,300+ helped",
      specialty: "DevOps Expert",
      badge: "Helper Hero",
    },
    {
      name: "Jamie Park",
      role: "Documentation Lead",
      avatar: "✍️",
      contributions: "80+ articles",
      specialty: "Technical Writing",
      badge: "Doc Master",
    },
  ];

  const tabs = [
    { id: "overview", title: "Overview", icon: FaUsers },
    { id: "platforms", title: "Platforms", icon: FaComments },
    { id: "events", title: "Events", icon: FaCalendarAlt },
    { id: "contributors", title: "Contributors", icon: FaTrophy },
  ];

  const getStatColor = (color) => {
    const colors = {
      blue: "text-blue-400",
      yellow: "text-yellow-400",
      green: "text-green-400",
      purple: "text-purple-400",
    };
    return colors[color] || colors.blue;
  };

  const getEventStatus = (status) => {
    const statuses = {
      upcoming: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
      "early-bird":
        "bg-purple-500/20 text-purple-400 border border-purple-500/30",
      ongoing: "bg-green-500/20 text-green-400 border border-green-500/30",
    };
    return statuses[status] || statuses.upcoming;
  };

  return (
    <div className="dashboard-page">
      <SEO page="community" />

      {/* Header */}
      <ResourcePageHeader
        icon={FaUsers}
        title="Community"
        description="Join thousands of developers building and deploying with Deployio"
      />

      {/* Community Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-12"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {communityStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 text-center"
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-neutral-800/50 rounded-xl">
                  <stat.icon
                    className={`w-6 h-6 ${getStatColor(stat.color)}`}
                  />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {stat.value}
              </h3>
              <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
              <span className="text-xs text-green-400 font-medium">
                {stat.trend}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <ResourceSidebar
          title="Community Hub"
          items={tabs}
          activeItem={activeTab}
          onItemClick={setActiveTab}
        >
          <div className="mt-8 pt-6 border-t border-neutral-800/50">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <FaFire className="w-4 h-4 text-orange-400" />
              Community Highlights
            </h4>
            <div className="space-y-3">
              <div className="text-sm">
                <p className="text-gray-300 font-medium">Weekly Showcase</p>
                <p className="text-xs text-gray-500">Share your projects</p>
              </div>
              <div className="text-sm">
                <p className="text-gray-300 font-medium">Expert AMAs</p>
                <p className="text-xs text-gray-500">Ask the experts</p>
              </div>
              <Link
                to="https://discord.gg/deployio"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors text-center"
              >
                Join Discord
              </Link>
            </div>
          </div>
        </ResourceSidebar>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3"
        >
          {activeTab === "overview" && (
            <div className="space-y-8">
              <ResourceCard>
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Welcome to the Deployio Community! 🚀
                  </h2>
                  <p className="text-gray-400 text-lg mb-8 max-w-3xl mx-auto">
                    Connect with developers worldwide, share knowledge, get
                    support, and help shape the future of deployment automation.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href="https://discord.gg/deployio"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <FaDiscord className="mr-2" />
                      Join Discord
                    </a>
                    <a
                      href="https://github.com/deployio/deployio"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 border border-neutral-600 text-gray-300 hover:bg-neutral-800 rounded-lg font-medium transition-colors"
                    >
                      <FaGithub className="mr-2" />
                      View on GitHub
                    </a>
                  </div>
                </div>
              </ResourceCard>

              <ResourceCard>
                <h3 className="text-xl font-bold text-white mb-6">
                  Community Guidelines
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <FaHeart className="w-5 h-5 text-red-400 mt-1" />
                      <div>
                        <h4 className="font-semibold text-white">
                          Be Respectful
                        </h4>
                        <p className="text-sm text-gray-400">
                          Treat everyone with kindness and respect
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <FaHandsHelping className="w-5 h-5 text-blue-400 mt-1" />
                      <div>
                        <h4 className="font-semibold text-white">
                          Help Others
                        </h4>
                        <p className="text-sm text-gray-400">
                          Share knowledge and support fellow developers
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <FaLightbulb className="w-5 h-5 text-yellow-400 mt-1" />
                      <div>
                        <h4 className="font-semibold text-white">
                          Share Ideas
                        </h4>
                        <p className="text-sm text-gray-400">
                          Contribute suggestions and feedback
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <FaCode className="w-5 h-5 text-green-400 mt-1" />
                      <div>
                        <h4 className="font-semibold text-white">
                          Collaborate
                        </h4>
                        <p className="text-sm text-gray-400">
                          Work together on projects and improvements
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </ResourceCard>
            </div>
          )}

          {activeTab === "platforms" && (
            <div className="space-y-6">
              {communityPlatforms.map((platform, index) => (
                <motion.div
                  key={platform.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-8 relative overflow-hidden group hover:border-neutral-700/50 transition-all"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${platform.color} opacity-5`}
                  />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-xl bg-gradient-to-r ${platform.color}`}
                        >
                          <platform.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            {platform.name}
                          </h3>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-gray-400">
                              {platform.members}
                            </span>
                            <span className="text-sm text-green-400">
                              {platform.activity}
                            </span>
                          </div>
                        </div>
                      </div>
                      <a
                        href={platform.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        Join
                        <FaExternalLinkAlt className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-gray-400 mb-6">{platform.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {platform.features.map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-sm text-gray-300"
                        >
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === "events" && (
            <div className="space-y-6">
              <ResourceCard>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Upcoming Events
                </h2>
                <p className="text-gray-400 mb-6">
                  Join our community events to learn, network, and grow with
                  fellow Deployio developers.
                </p>
              </ResourceCard>

              {communityEvents.map((event, index) => (
                <motion.div
                  key={event.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 hover:border-neutral-700/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">
                          {event.title}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getEventStatus(
                            event.status
                          )}`}
                        >
                          {event.status === "early-bird"
                            ? "Early Bird"
                            : event.status.charAt(0).toUpperCase() +
                              event.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <FaCalendarAlt className="w-3 h-3" />
                          {event.date}
                        </span>
                        <span>{event.time}</span>
                        <span className="text-blue-400">{event.type}</span>
                      </div>
                      <p className="text-gray-400 mb-3">{event.description}</p>
                      <span className="text-sm text-green-400 font-medium">
                        {event.attendees}
                      </span>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                      Register
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === "contributors" && (
            <div className="space-y-6">
              <ResourceCard>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Community Contributors
                </h2>
                <p className="text-gray-400 mb-6">
                  Meet the amazing people who make Deployio better every day
                  through code, documentation, and community support.
                </p>
              </ResourceCard>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {contributorSpotlight.map((contributor, index) => (
                  <motion.div
                    key={contributor.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 text-center hover:border-neutral-700/50 transition-all"
                  >
                    <div className="text-4xl mb-4">{contributor.avatar}</div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      {contributor.name}
                    </h3>
                    <p className="text-blue-400 text-sm mb-3">
                      {contributor.role}
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="text-sm text-gray-400">
                        <span className="font-medium text-white">
                          {contributor.contributions}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {contributor.specialty}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-medium">
                      <FaCrown className="w-3 h-3" />
                      {contributor.badge}
                    </span>
                  </motion.div>
                ))}
              </div>

              <ResourceCard>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Become a Contributor
                  </h3>
                  <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                    Join our contributor community and help shape the future of
                    Deployio. Whether you&apos;re a developer, designer, or
                    writer, there&apos;s a place for you.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href="https://github.com/deployio/deployio/blob/main/CONTRIBUTING.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <FaCode className="mr-2" />
                      Contribute Code
                    </a>
                    <Link
                      to="/resources/docs"
                      className="inline-flex items-center px-6 py-3 border border-neutral-600 text-gray-300 hover:bg-neutral-800 rounded-lg font-medium transition-colors"
                    >
                      <FaBookmark className="mr-2" />
                      Write Docs
                    </Link>
                  </div>
                </div>
              </ResourceCard>
            </div>
          )}

          {/* Community CTA */}
          <ResourceCTA
            title="Ready to Join Our Community?"
            description="Connect with thousands of developers, get support, share knowledge, and help build the future of deployment automation together."
            primaryButton={
              <a
                href="https://discord.gg/deployio"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                <FaDiscord className="mr-2" />
                Join Discord Now
              </a>
            }
            secondaryButton={
              <a
                href="https://github.com/deployio/deployio"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                <FaGithub className="mr-2" />
                Star on GitHub
              </a>
            }
            delay={0.5}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default Community;
