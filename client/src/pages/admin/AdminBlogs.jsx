import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiSearch,
  FiFilter,
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiEye,
  FiCalendar,
  FiPlus,
  FiFileText,
  FiUser,
  FiClock,
} from "react-icons/fi";

const AdminBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      // Mock data for now - replace with actual API call
      setTimeout(() => {
        setBlogs([
          {
            id: 1,
            title: "Advanced CI/CD Strategies for Modern Applications",
            slug: "advanced-cicd-strategies",
            author: "John Doe",
            status: "published",
            category: "DevOps",
            tags: ["CI/CD", "Docker", "Kubernetes"],
            publishedAt: "2024-06-15",
            views: 1250,
            excerpt:
              "Learn how to implement advanced CI/CD pipelines that scale with your application needs...",
          },
          {
            id: 2,
            title: "Security Best Practices for Cloud Deployments",
            slug: "security-best-practices-cloud",
            author: "Jane Smith",
            status: "published",
            category: "Security",
            tags: ["Security", "Cloud", "AWS"],
            publishedAt: "2024-06-10",
            views: 892,
            excerpt:
              "Essential security measures every developer should implement when deploying to the cloud...",
          },
          {
            id: 3,
            title: "Getting Started with Kubernetes for Beginners",
            slug: "kubernetes-for-beginners",
            author: "Vasu Deep",
            status: "draft",
            category: "Tutorials",
            tags: ["Kubernetes", "Containers", "Tutorial"],
            publishedAt: null,
            views: 0,
            excerpt:
              "A comprehensive guide to understanding Kubernetes concepts and getting your first cluster running...",
          },
          {
            id: 4,
            title: "Monitoring and Logging in Microservices Architecture",
            slug: "monitoring-microservices",
            author: "Bob Wilson",
            status: "published",
            category: "Engineering",
            tags: ["Monitoring", "Microservices", "Logging"],
            publishedAt: "2024-06-05",
            views: 567,
            excerpt:
              "Best practices for implementing comprehensive monitoring and logging in distributed systems...",
          },
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
      setLoading(false);
    }
  };

  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch =
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || blog.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "bg-green-500/20 text-green-400 border border-green-500/30";
      case "draft":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
      case "archived":
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      DevOps: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
      Security: "bg-red-500/20 text-red-400 border border-red-500/30",
      Tutorials: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
      Engineering: "bg-green-500/20 text-green-400 border border-green-500/30",
    };
    return (
      colors[category] ||
      "bg-gray-500/20 text-gray-400 border border-gray-500/30"
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Blog Management</h1>
          <p className="text-gray-400 mt-2">Manage blog posts and content</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <FiPlus className="w-4 h-4" />
          <span>New Post</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-neutral-800/50 backdrop-blur border border-neutral-700 rounded-lg shadow-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search blogs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <FiFilter className="text-gray-400 w-5 h-5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Blogs Table */}
      <div className="bg-neutral-800/50 backdrop-blur border border-neutral-700 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-700/50 border-b border-neutral-600">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-white">
                  Post
                </th>
                <th className="text-left py-3 px-6 font-medium text-white">
                  Author
                </th>
                <th className="text-left py-3 px-6 font-medium text-white">
                  Status
                </th>
                <th className="text-left py-3 px-6 font-medium text-white">
                  Category
                </th>
                <th className="text-left py-3 px-6 font-medium text-white">
                  Views
                </th>
                <th className="text-left py-3 px-6 font-medium text-white">
                  Published
                </th>
                <th className="text-left py-3 px-6 font-medium text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-600">
              {filteredBlogs.map((blog, index) => (
                <motion.tr
                  key={blog.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-neutral-700/30"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                        <FiFileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white line-clamp-1">
                          {blog.title}
                        </p>
                        <p className="text-sm text-gray-400 line-clamp-2 mt-1">
                          {blog.excerpt}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {blog.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-neutral-600/50 text-gray-300 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <FiUser className="w-4 h-4 text-gray-400" />
                      <span className="text-white">{blog.author}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        blog.status
                      )}`}
                    >
                      {blog.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(
                        blog.category
                      )}`}
                    >
                      {blog.category}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-1">
                      <FiEye className="w-4 h-4 text-gray-400" />
                      <span className="text-white">{blog.views}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {blog.publishedAt ? (
                      <div className="flex items-center space-x-1 text-sm text-gray-400">
                        <FiCalendar className="w-4 h-4" />
                        <span>{blog.publishedAt}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">
                        Not published
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/20 rounded-lg transition-colors">
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors">
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-300 hover:bg-neutral-600/50 rounded-lg transition-colors">
                        <FiMoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-neutral-800/50 backdrop-blur border border-neutral-700 rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-3">
            <FiFileText className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-white">{blogs.length}</p>
              <p className="text-sm text-gray-400">Total Posts</p>
            </div>
          </div>
        </div>
        <div className="bg-neutral-800/50 backdrop-blur border border-neutral-700 rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-3">
            <FiEye className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {blogs.filter((b) => b.status === "published").length}
              </p>
              <p className="text-sm text-gray-400">Published</p>
            </div>
          </div>
        </div>
        <div className="bg-neutral-800/50 backdrop-blur border border-neutral-700 rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-3">
            <FiClock className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {blogs.filter((b) => b.status === "draft").length}
              </p>
              <p className="text-sm text-gray-400">Drafts</p>
            </div>
          </div>
        </div>
        <div className="bg-neutral-800/50 backdrop-blur border border-neutral-700 rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-3">
            <FiUser className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {blogs.reduce((sum, blog) => sum + blog.views, 0)}
              </p>
              <p className="text-sm text-gray-400">Total Views</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBlogs;
