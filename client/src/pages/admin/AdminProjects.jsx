import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiSearch,
  FiFilter,
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiGitBranch,
  FiCalendar,
  FiPlus,
  FiFolder,
  FiUser,
  FiActivity,
} from "react-icons/fi";

const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      // Mock data for now - replace with actual API call
      setTimeout(() => {
        setProjects([
          {
            id: 1,
            name: "E-commerce Platform",
            description:
              "Full-stack e-commerce solution with React and Node.js",
            owner: "John Doe",
            status: "active",
            deployments: 15,
            lastDeployment: "2024-06-15",
            repository: "github.com/johndoe/ecommerce",
            createdAt: "2024-01-15",
            framework: "React",
          },
          {
            id: 2,
            name: "API Gateway Service",
            description: "Microservices API gateway built with Express.js",
            owner: "Jane Smith",
            status: "active",
            deployments: 8,
            lastDeployment: "2024-06-10",
            repository: "github.com/janesmith/api-gateway",
            createdAt: "2024-02-20",
            framework: "Express",
          },
          {
            id: 3,
            name: "Analytics Dashboard",
            description: "Real-time analytics dashboard with Vue.js",
            owner: "Vasu Deep",
            status: "inactive",
            deployments: 22,
            lastDeployment: "2024-05-28",
            repository: "github.com/vasudeepu/analytics",
            createdAt: "2024-01-10",
            framework: "Vue",
          },
          {
            id: 4,
            name: "Chat Application",
            description: "Real-time chat app with Socket.io",
            owner: "Bob Wilson",
            status: "active",
            deployments: 5,
            lastDeployment: "2024-06-12",
            repository: "github.com/bobwilson/chat-app",
            createdAt: "2024-03-05",
            framework: "Socket.io",
          },
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getFrameworkColor = (framework) => {
    const colors = {
      React: "bg-blue-100 text-blue-800",
      Vue: "bg-green-100 text-green-800",
      Express: "bg-yellow-100 text-yellow-800",
      "Socket.io": "bg-purple-100 text-purple-800",
    };
    return colors[framework] || "bg-gray-100 text-gray-800";
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
          <h1 className="text-3xl font-bold text-gray-900">
            Project Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage platform projects and deployments
          </p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <FiPlus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search projects..."
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-900">
                  Project
                </th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">
                  Owner
                </th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">
                  Status
                </th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">
                  Framework
                </th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">
                  Deployments
                </th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">
                  Last Deploy
                </th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProjects.map((project, index) => (
                <motion.tr
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                        <FiFolder className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {project.name}
                        </p>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {project.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <FiUser className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{project.owner}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getFrameworkColor(
                        project.framework
                      )}`}
                    >
                      {project.framework}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-1">
                      <FiActivity className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">
                        {project.deployments}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <FiCalendar className="w-4 h-4" />
                      <span>{project.lastDeployment}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <FiGitBranch className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
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
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <FiFolder className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {projects.length}
              </p>
              <p className="text-sm text-gray-600">Total Projects</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <FiActivity className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {projects.filter((p) => p.status === "active").length}
              </p>
              <p className="text-sm text-gray-600">Active Projects</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <FiGitBranch className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {projects.reduce(
                  (sum, project) => sum + project.deployments,
                  0
                )}
              </p>
              <p className="text-sm text-gray-600">Total Deployments</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <FiCalendar className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {
                  projects.filter(
                    (p) =>
                      new Date(p.createdAt) >
                      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                  ).length
                }
              </p>
              <p className="text-sm text-gray-600">New This Month</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProjects;
