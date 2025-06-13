import { motion } from "framer-motion";
import {
  FaUsers,
  FaGithub,
  FaDiscord,
  FaTwitter,
  FaReddit,
  FaStackOverflow,
  FaYoutube,
  FaBlog,
  FaCalendarAlt,
  FaTrophy,
  FaCode,
  FaQuestionCircle,
  FaLightbulb,
  FaHeart,
  FaArrowRight,
  FaStar,
  FaComments,
  FaUserFriends,
} from "react-icons/fa";
import SEO from "@components/SEO";

const Community = () => {
  const communityStats = [
    {
      label: "Community Members",
      value: "25,000+",
      icon: FaUsers,
      color: "text-blue-600",
    },
    {
      label: "GitHub Stars",
      value: "12,500+",
      icon: FaStar,
      color: "text-yellow-500",
    },
    {
      label: "Monthly Discussions",
      value: "2,800+",
      icon: FaComments,
      color: "text-green-600",
    },
    {
      label: "Contributors",
      value: "450+",
      icon: FaUserFriends,
      color: "text-purple-600",
    },
  ];

  const communityChannels = [
    {
      name: "Discord Server",
      description:
        "Join our active Discord community for real-time discussions and support",
      icon: FaDiscord,
      members: "8,500+ members",
      color: "bg-indigo-500",
      link: "#",
    },
    {
      name: "GitHub Discussions",
      description: "Contribute to the project, report issues, and share ideas",
      icon: FaGithub,
      members: "12,500+ stars",
      color: "bg-gray-900",
      link: "#",
    },
    {
      name: "Stack Overflow",
      description: "Ask technical questions and get expert answers",
      icon: FaStackOverflow,
      members: "1,200+ questions",
      color: "bg-orange-500",
      link: "#",
    },
    {
      name: "Reddit Community",
      description: "Share experiences and learn from other developers",
      icon: FaReddit,
      members: "3,800+ members",
      color: "bg-red-500",
      link: "#",
    },
    {
      name: "Twitter",
      description: "Follow for updates, tips, and community highlights",
      icon: FaTwitter,
      members: "15,000+ followers",
      color: "bg-blue-400",
      link: "#",
    },
    {
      name: "YouTube Channel",
      description: "Watch tutorials, webinars, and community spotlights",
      icon: FaYoutube,
      members: "5,200+ subscribers",
      color: "bg-red-600",
      link: "#",
    },
  ];

  const upcomingEvents = [
    {
      title: "Monthly Community Call",
      date: "June 15, 2025",
      time: "2:00 PM PST",
      type: "Virtual Meetup",
      description:
        "Join our monthly community call to discuss new features and roadmap",
      attendees: 250,
    },
    {
      title: "DevOps Best Practices Workshop",
      date: "June 22, 2025",
      time: "10:00 AM PST",
      type: "Workshop",
      description:
        "Learn advanced deployment strategies and optimization techniques",
      attendees: 150,
    },
    {
      title: "Deployio Hackathon 2025",
      date: "July 1-3, 2025",
      time: "All Day",
      type: "Hackathon",
      description:
        "Build amazing projects using Deployio and win exciting prizes",
      attendees: 500,
    },
  ];

  const contributorSpotlight = [
    {
      name: "Sarah Chen",
      role: "Core Contributor",
      avatar:
        "https://ui-avatars.com/api/?name=Sarah+Chen&background=3b82f6&color=fff",
      contributions: "125 commits",
      specialty: "Frontend Development",
    },
    {
      name: "Michael Rodriguez",
      role: "Documentation Lead",
      avatar:
        "https://ui-avatars.com/api/?name=Michael+Rodriguez&background=10b981&color=fff",
      contributions: "89 docs updates",
      specialty: "Technical Writing",
    },
    {
      name: "Alex Kim",
      role: "Community Moderator",
      avatar:
        "https://ui-avatars.com/api/?name=Alex+Kim&background=8b5cf6&color=fff",
      contributions: "500+ helped users",
      specialty: "Developer Support",
    },
  ];

  const communityValues = [
    {
      icon: FaLightbulb,
      title: "Innovation",
      description: "We encourage creative solutions and fresh perspectives",
    },
    {
      icon: FaHeart,
      title: "Inclusivity",
      description: "Everyone is welcome regardless of experience level",
    },
    {
      icon: FaCode,
      title: "Open Source",
      description: "Transparency and collaboration drive our development",
    },
    {
      icon: FaQuestionCircle,
      title: "Learning",
      description: "We help each other grow and learn new skills",
    },
  ];

  return (
    <>
      {" "}
      <SEO page="community" />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl mb-6">
                <FaUsers className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Join Our
                <span className="text-purple-600 dark:text-purple-400">
                  {" "}
                  Community
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Connect with thousands of developers, share knowledge, and build
                the future of deployment automation together.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors">
                  Join Discord
                </button>
                <button className="px-8 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-semibold transition-colors">
                  View on GitHub
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Community Stats */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {communityStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 text-center"
                  >
                    <Icon className={`w-12 h-12 ${stat.color} mx-auto mb-4`} />
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {stat.value}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Community Channels */}
        <section className="py-16 px-4 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Connect With Us
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Choose your preferred platform to engage with the community
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {communityChannels.map((channel, index) => {
                const Icon = channel.icon;
                return (
                  <motion.div
                    key={channel.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer group"
                  >
                    <div
                      className={`inline-flex items-center justify-center w-14 h-14 ${channel.color} rounded-xl mb-6 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {channel.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {channel.description}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      {channel.members}
                    </p>
                    <div className="flex items-center text-purple-600 dark:text-purple-400 font-medium group-hover:text-purple-700 dark:group-hover:text-purple-300">
                      Join Now
                      <FaArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Upcoming Events
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Join our events to learn, network, and grow with the community
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {upcomingEvents.map((event, index) => (
                <motion.div
                  key={event.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium">
                      {event.type}
                    </span>
                    <FaCalendarAlt className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {event.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {event.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-6">
                    <span>{event.date}</span>
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {event.attendees} attending
                    </span>
                    <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Register
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contributor Spotlight */}
        <section className="py-16 px-4 bg-gray-100 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Contributor Spotlight
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Celebrating our amazing community contributors
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {contributorSpotlight.map((contributor, index) => (
                <motion.div
                  key={contributor.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 text-center"
                >
                  <img
                    src={contributor.avatar}
                    alt={contributor.name}
                    className="w-20 h-20 rounded-full mx-auto mb-6"
                  />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {contributor.name}
                  </h3>
                  <p className="text-purple-600 dark:text-purple-400 font-medium mb-2">
                    {contributor.role}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {contributor.specialty}
                  </p>
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <FaTrophy className="text-yellow-500" />
                    {contributor.contributions}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Community Values */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Our Community Values
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                What makes our community special
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {communityValues.map((value, index) => {
                const Icon = value.icon;
                return (
                  <motion.div
                    key={value.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="text-center"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl mb-6">
                      <Icon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {value.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12 text-white"
            >
              <FaUsers className="w-16 h-16 mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Get Involved?
              </h2>
              <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                Whether you're looking to contribute code, help others, or just
                learn from the community, there's a place for you here.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Join Our Discord
                </button>
                <button className="px-8 py-4 border border-purple-300 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                  Start Contributing
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Community;
