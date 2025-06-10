import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaBlog,
  FaCalendarAlt,
  FaUser,
  FaTag,
  FaClock,
  FaArrowRight,
  FaSearch,
  FaFilter,
  FaHeart,
  FaShare,
  FaComment,
} from "react-icons/fa";
import SEO from "@components/SEO";

const Blog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", name: "All Posts" },
    { id: "tutorials", name: "Tutorials" },
    { id: "best-practices", name: "Best Practices" },
    { id: "news", name: "News & Updates" },
    { id: "case-studies", name: "Case Studies" },
    { id: "devops", name: "DevOps" },
  ];

  const blogPosts = [
    {
      id: 1,
      title: "Building a CI/CD Pipeline with Deployio: A Complete Guide",
      excerpt:
        "Learn how to set up a robust continuous integration and deployment pipeline using Deployio's powerful automation features.",
      author: "Sarah Chen",
      authorAvatar:
        "https://ui-avatars.com/api/?name=Sarah+Chen&background=3b82f6&color=fff",
      publishDate: "2025-06-08",
      readTime: "12 min read",
      category: "tutorials",
      tags: ["CI/CD", "Automation", "DevOps"],
      image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop",
      featured: true,
      likes: 245,
      comments: 18,
    },
    {
      id: 2,
      title: "10 Best Practices for Secure Deployments",
      excerpt:
        "Discover essential security practices to protect your applications and data during the deployment process.",
      author: "Michael Rodriguez",
      authorAvatar:
        "https://ui-avatars.com/api/?name=Michael+Rodriguez&background=10b981&color=fff",
      publishDate: "2025-06-05",
      readTime: "8 min read",
      category: "best-practices",
      tags: ["Security", "Best Practices", "DevSecOps"],
      image:
        "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=400&fit=crop",
      featured: false,
      likes: 189,
      comments: 12,
    },
    {
      id: 3,
      title: "Deployio 3.0: Introducing AI-Powered Deployment Analytics",
      excerpt:
        "Explore the new AI features in Deployio 3.0 that provide intelligent insights into your deployment performance.",
      author: "Alex Kim",
      authorAvatar:
        "https://ui-avatars.com/api/?name=Alex+Kim&background=8b5cf6&color=fff",
      publishDate: "2025-06-02",
      readTime: "6 min read",
      category: "news",
      tags: ["Product Update", "AI", "Analytics"],
      image:
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop",
      featured: true,
      likes: 312,
      comments: 24,
    },
    {
      id: 4,
      title: "How TechCorp Reduced Deployment Time by 75% with Deployio",
      excerpt:
        "A case study on how TechCorp streamlined their deployment process and achieved significant time savings.",
      author: "Jennifer Liu",
      authorAvatar:
        "https://ui-avatars.com/api/?name=Jennifer+Liu&background=f59e0b&color=fff",
      publishDate: "2025-05-30",
      readTime: "10 min read",
      category: "case-studies",
      tags: ["Case Study", "Performance", "Enterprise"],
      image:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop",
      featured: false,
      likes: 156,
      comments: 8,
    },
    {
      id: 5,
      title: "Container Orchestration Strategies for Modern Applications",
      excerpt:
        "Learn advanced container orchestration techniques to optimize your application deployments at scale.",
      author: "David Park",
      authorAvatar:
        "https://ui-avatars.com/api/?name=David+Park&background=ef4444&color=fff",
      publishDate: "2025-05-25",
      readTime: "15 min read",
      category: "devops",
      tags: ["Containers", "Kubernetes", "Docker"],
      image:
        "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&h=400&fit=crop",
      featured: false,
      likes: 203,
      comments: 15,
    },
    {
      id: 6,
      title: "Monitoring and Observability: Essential Tools for DevOps Success",
      excerpt:
        "Discover the monitoring and observability tools that every DevOps team needs for successful deployments.",
      author: "Emma Wilson",
      authorAvatar:
        "https://ui-avatars.com/api/?name=Emma+Wilson&background=06b6d4&color=fff",
      publishDate: "2025-05-20",
      readTime: "9 min read",
      category: "tutorials",
      tags: ["Monitoring", "Observability", "DevOps"],
      image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop",
      featured: false,
      likes: 178,
      comments: 11,
    },
  ];

  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory =
      selectedCategory === "all" || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  const featuredPosts = filteredPosts.filter((post) => post.featured);
  const regularPosts = filteredPosts.filter((post) => !post.featured);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <SEO
        title="Blog - Latest Updates and Tutorials | Deployio"
        description="Stay updated with the latest deployment best practices, tutorials, and news from the Deployio team and community."
        keywords="blog, deployment tutorials, DevOps best practices, CI/CD guides, deployment news"
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <section className="py-20 px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-6">
                <FaBlog className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Deployio Blog
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Latest updates, tutorials, and best practices for modern
                deployment workflows.
              </p>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <FaFilter className="text-gray-400 w-4 h-4" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="py-16 px-4">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="mb-12"
              >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                  Featured Posts
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {featuredPosts.map((post, index) => (
                    <motion.article
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.2 }}
                      viewport={{ once: true }}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                    >
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-8">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                            Featured
                          </span>
                          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm">
                            {
                              categories.find((c) => c.id === post.category)
                                ?.name
                            }
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={post.authorAvatar}
                              alt={post.author}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {post.author}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(post.publishDate)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <FaClock className="w-3 h-3" />
                            {post.readTime}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <FaHeart className="w-3 h-3" />
                              {post.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <FaComment className="w-3 h-3" />
                              {post.comments}
                            </span>
                          </div>
                          <button className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                            Read More
                            <FaArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* Regular Posts */}
        <section className="py-16 px-4 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Latest Posts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {regularPosts.map((post, index) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                          {categories.find((c) => c.id === post.category)?.name}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-2 mb-3">
                        <img
                          src={post.authorAvatar}
                          alt={post.author}
                          className="w-6 h-6 rounded-full"
                        />
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <p>{post.author}</p>
                          <p>{formatDate(post.publishDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <FaHeart className="w-3 h-3" />
                            {post.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaClock className="w-3 h-3" />
                            {post.readTime}
                          </span>
                        </div>
                        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                          Read More
                        </button>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>

              {filteredPosts.length === 0 && (
                <div className="text-center py-16">
                  <FaBlog className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No posts found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white"
            >
              <FaBlog className="w-16 h-16 mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Stay Updated
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Subscribe to our newsletter and never miss the latest deployment
                tips, tutorials, and product updates.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                />
                <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Subscribe
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Blog;
