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
              "How to implement effective monitoring and logging strategies for distributed systems...",
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
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      DevOps: "bg-blue-100 text-blue-800",
      Security: "bg-red-100 text-red-800",
      Tutorials: "bg-purple-100 text-purple-800",
      Engineering: "bg-green-100 text-green-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
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
          <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
          <p className="text-gray-600 mt-2">Manage blog posts and content</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <FiPlus className="w-4 h-4" />
          <span>New Post</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search blogs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <FiFilter className="text-gray-400 w-5 h-5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Blogs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBlogs.map((blog, index) => (
          <motion.div
            key={blog.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {blog.excerpt}
                  </p>
                </div>
                <div className="ml-4">
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                    <FiMoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    blog.status
                  )}`}
                >
                  {blog.status}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(
                    blog.category
                  )}`}
                >
                  {blog.category}
                </span>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {blog.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <FiUser className="w-4 h-4" />
                    <span>{blog.author}</span>
                  </div>
                  {blog.publishedAt && (
                    <div className="flex items-center space-x-1">
                      <FiCalendar className="w-4 h-4" />
                      <span>{blog.publishedAt}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <FiEye className="w-4 h-4" />
                  <span>{blog.views}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <FiEye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  <button className="flex items-center space-x-1 px-3 py-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <FiEdit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                </div>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <FiFileText className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{blogs.length}</p>
              <p className="text-sm text-gray-600">Total Posts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <FiEye className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {blogs.filter((b) => b.status === "published").length}
              </p>
              <p className="text-sm text-gray-600">Published</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <FiClock className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {blogs.filter((b) => b.status === "draft").length}
              </p>
              <p className="text-sm text-gray-600">Drafts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <FiEye className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {blogs.reduce((sum, blog) => sum + blog.views, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Views</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBlogs;
