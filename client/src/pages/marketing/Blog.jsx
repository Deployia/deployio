import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaBlog,
  FaCalendarAlt,
  FaUser,
  FaClock,
  FaArrowRight,
  FaSearch,
  FaHeart,
  FaShare,
  FaComment,
  FaEye,
  FaChartLine,
  FaFire,
  FaNewspaper,
  FaGraduationCap,
  FaTools,
  FaRocket,
  FaChevronRight,
  FaUsers,
} from "react-icons/fa";
import SEO from "@components/SEO";
import {
  ResourcePageHeader,
  ResourceCard,
  ResourceSidebar,
  ResourceSearchBar,
  ResourceCTA,
} from "@components/resources/ResourcePageComponents";
import { Link } from "react-router-dom";

const Blog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", title: "All Posts", icon: FaBlog, count: 87 },
    { id: "tutorials", title: "Tutorials", icon: FaGraduationCap, count: 32 },
    { id: "best-practices", title: "Best Practices", icon: FaTools, count: 18 },
    { id: "news", title: "News & Updates", icon: FaNewspaper, count: 15 },
    { id: "case-studies", title: "Case Studies", icon: FaChartLine, count: 12 },
    { id: "devops", title: "DevOps", icon: FaRocket, count: 10 },
  ];

  const featuredPost = {
    id: 1,
    title: "Building Production-Ready CI/CD Pipelines with Deployio",
    excerpt:
      "A comprehensive guide to setting up robust continuous integration and deployment pipelines that scale with your team and ensure reliable deployments every time.",
    author: "Sarah Chen",
    authorRole: "Senior DevOps Engineer",
    publishDate: "2025-01-15",
    readTime: "12 min read",
    category: "tutorials",
    tags: ["CI/CD", "Automation", "DevOps", "Best Practices"],
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop",
    featured: true,
    likes: 245,
    comments: 18,
    views: "2.1k",
  };

  const blogPosts = [
    {
      id: 2,
      title: "Serverless Deployment Strategies: Beyond the Basics",
      excerpt:
        "Advanced techniques for deploying serverless applications with optimal performance, cost efficiency, and reliability.",
      author: "Alex Rodriguez",
      authorRole: "Cloud Architect",
      publishDate: "2025-01-12",
      readTime: "8 min read",
      category: "best-practices",
      tags: ["Serverless", "AWS", "Performance"],
      featured: false,
      likes: 156,
      comments: 12,
      views: "1.8k",
    },
    {
      id: 3,
      title: "Deployio 2.0: What's New and How It Changes Everything",
      excerpt:
        "Exploring the game-changing features in Deployio 2.0, including improved security, faster deployments, and enhanced monitoring.",
      author: "Jamie Park",
      authorRole: "Product Manager",
      publishDate: "2025-01-10",
      readTime: "6 min read",
      category: "news",
      tags: ["Product Update", "Features", "Release"],
      featured: false,
      likes: 203,
      comments: 24,
      views: "3.2k",
    },
    {
      id: 4,
      title: "Case Study: How TechCorp Reduced Deployment Time by 75%",
      excerpt:
        "Learn how TechCorp transformed their deployment process using Deployio, achieving faster releases and improved reliability.",
      author: "Morgan Davis",
      authorRole: "Customer Success",
      publishDate: "2025-01-08",
      readTime: "10 min read",
      category: "case-studies",
      tags: ["Case Study", "Performance", "Enterprise"],
      featured: false,
      likes: 189,
      comments: 15,
      views: "1.5k",
    },
    {
      id: 5,
      title: "Container Security Best Practices for Production Deployments",
      excerpt:
        "Essential security practices every team should implement when deploying containerized applications in production environments.",
      author: "Taylor Kim",
      authorRole: "Security Engineer",
      publishDate: "2025-01-05",
      readTime: "9 min read",
      category: "devops",
      tags: ["Security", "Containers", "Production"],
      featured: false,
      likes: 167,
      comments: 9,
      views: "1.3k",
    },
    {
      id: 6,
      title: "Monitoring and Observability: A Developer's Complete Guide",
      excerpt:
        "Everything you need to know about implementing effective monitoring and observability for your deployed applications.",
      author: "Casey Williams",
      authorRole: "Site Reliability Engineer",
      publishDate: "2025-01-03",
      readTime: "11 min read",
      category: "tutorials",
      tags: ["Monitoring", "Observability", "SRE"],
      featured: false,
      likes: 134,
      comments: 7,
      views: "1.1k",
    },
  ];

  const trendingTopics = [
    { tag: "CI/CD", count: 23 },
    { tag: "DevOps", count: 18 },
    { tag: "Kubernetes", count: 15 },
    { tag: "Security", count: 12 },
    { tag: "Automation", count: 10 },
  ];

  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory =
      selectedCategory === "all" || post.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.icon : FaBlog;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="dashboard-page">
      <SEO page="blog" />

      {/* Header */}
      <ResourcePageHeader
        icon={FaBlog}
        title="Deployio Blog"
        description="Latest insights, tutorials, and best practices for modern deployment automation"
      />

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <ResourceSearchBar
          placeholder="Search articles, tutorials, and insights..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={FaSearch}
        />
      </motion.div>

      {/* Featured Post */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <div className="relative bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl overflow-hidden group hover:border-neutral-700/50 transition-all">
          <div className="absolute top-4 left-4 z-10">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-medium">
              <FaFire className="w-3 h-3" />
              Featured
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-gray-400 text-lg">{featuredPost.excerpt}</p>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <FaUser className="w-4 h-4" />
                  <span className="text-white font-medium">
                    {featuredPost.author}
                  </span>
                  <span>•</span>
                  <span>{featuredPost.authorRole}</span>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <FaCalendarAlt className="w-3 h-3" />
                  {formatDate(featuredPost.publishDate)}
                </span>
                <span className="flex items-center gap-1">
                  <FaClock className="w-3 h-3" />
                  {featuredPost.readTime}
                </span>
                <span className="flex items-center gap-1">
                  <FaEye className="w-3 h-3" />
                  {featuredPost.views} views
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {featuredPost.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-neutral-800/50 text-gray-300 text-xs rounded border border-neutral-700/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                  Read Article
                  <FaArrowRight className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-4 text-gray-400">
                  <button className="flex items-center gap-1 hover:text-red-400 transition-colors">
                    <FaHeart className="w-4 h-4" />
                    {featuredPost.likes}
                  </button>
                  <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                    <FaComment className="w-4 h-4" />
                    {featuredPost.comments}
                  </button>
                  <button className="flex items-center gap-1 hover:text-green-400 transition-colors">
                    <FaShare className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-neutral-800/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <FaNewspaper className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-sm opacity-75">Featured Article Image</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <ResourceSidebar
          title="Categories"
          items={categories}
          activeItem={selectedCategory}
          onItemClick={setSelectedCategory}
        >
          <div className="mt-8 pt-6 border-t border-neutral-800/50">
            {" "}
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <FaChartLine className="w-4 h-4 text-blue-400" />
              Trending Topics
            </h4>
            <div className="space-y-2">
              {trendingTopics.map((topic, index) => (
                <motion.button
                  key={topic.tag}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-neutral-800/50 transition-colors group"
                  onClick={() => setSearchQuery(topic.tag)}
                >
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    #{topic.tag}
                  </span>
                  <span className="text-xs text-gray-500">{topic.count}</span>
                </motion.button>
              ))}
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
          <div className="space-y-8">
            <ResourceCard>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Latest Articles
                </h2>
                <span className="text-sm text-gray-400">
                  {filteredPosts.length} articles
                </span>
              </div>
            </ResourceCard>

            {filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 hover:border-neutral-700/50 hover:bg-neutral-800/50 transition-all cursor-pointer group"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        {React.createElement(getCategoryIcon(post.category), {
                          className: "w-4 h-4 text-blue-400",
                        })}
                        <span className="text-xs text-blue-400 font-medium capitalize">
                          {post.category.replace("-", " ")}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                        {post.title}
                      </h3>

                      <p className="text-gray-400 text-sm line-clamp-3">
                        {post.excerpt}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <FaUser className="w-3 h-3" />
                          {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaCalendarAlt className="w-3 h-3" />
                          {formatDate(post.publishDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaClock className="w-3 h-3" />
                          {post.readTime}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-neutral-800/50 text-gray-400 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-neutral-800/50">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FaHeart className="w-3 h-3" />
                            {post.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaComment className="w-3 h-3" />
                            {post.comments}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaEye className="w-3 h-3" />
                            {post.views}
                          </span>
                        </div>
                        <FaChevronRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <ResourceCard>
                <div className="text-center py-12">
                  <FaSearch className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">
                    No articles found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Try adjusting your search terms or browse a different
                    category.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              </ResourceCard>
            )}

            {/* Newsletter Signup CTA */}
            <ResourceCTA
              title="Stay Updated with Deployio"
              description="Get the latest deployment insights, tutorials, and best practices delivered directly to your inbox. Join thousands of developers staying ahead of the curve."
              primaryButton={
                <button className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
                  <FaNewspaper className="mr-2" />
                  Subscribe to Newsletter
                </button>
              }
              secondaryButton={
                <Link
                  to="/resources/community"
                  className="inline-flex items-center px-6 py-3 border border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
                >
                  <FaUsers className="mr-2" />
                  Join Community
                </Link>
              }
              delay={0.5}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Blog;
