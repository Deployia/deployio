import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaPlus,
  FaProjectDiagram,
  FaCode,
  FaGithub,
  FaRocket,
  FaCog,
  FaTrash,
  FaEye,
  FaCalendarAlt,
  FaUsers,
  FaCloud,
} from "react-icons/fa";
import SEO from "../components/SEO";

const Projects = () => {
  const [projects] = useState([
    {
      id: 1,
      name: "E-commerce Platform",
      description: "Full-stack e-commerce solution with React and Node.js",
      status: "active",
      lastDeployment: "2 hours ago",
      repository: "github.com/user/ecommerce",
      framework: "React",
      deployments: 23,
      collaborators: 4,
      environment: "production",
    },
    {
      id: 2,
      name: "API Gateway Service",
      description:
        "Microservices API gateway with authentication and rate limiting",
      status: "inactive",
      lastDeployment: "1 week ago",
      repository: "github.com/user/api-gateway",
      framework: "Node.js",
      deployments: 12,
      collaborators: 2,
      environment: "staging",
    },
    {
      id: 3,
      name: "Dashboard Analytics",
      description: "Real-time analytics dashboard with charts and reporting",
      status: "active",
      lastDeployment: "3 days ago",
      repository: "github.com/user/analytics-dashboard",
      framework: "Vue.js",
      deployments: 18,
      collaborators: 3,
      environment: "production",
    },
    {
      id: 4,
      name: "Mobile App Backend",
      description:
        "REST API backend for mobile application with user management",
      status: "development",
      lastDeployment: "5 days ago",
      repository: "github.com/user/mobile-backend",
      framework: "Express",
      deployments: 7,
      collaborators: 5,
      environment: "development",
    },
  ]);

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "active":
        return `${baseClasses} bg-green-500/20 text-green-400 border border-green-500/30`;
      case "inactive":
        return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
      case "development":
        return `${baseClasses} bg-blue-500/20 text-blue-400 border border-blue-500/30`;
      default:
        return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
    }
  };

  const getFrameworkIcon = (framework) => {
    switch (framework.toLowerCase()) {
      case "react":
        return <FaCode className="w-4 h-4 text-blue-400" />;
      case "vue.js":
        return <FaCode className="w-4 h-4 text-green-400" />;
      case "node.js":
      case "express":
        return <FaCode className="w-4 h-4 text-green-500" />;
      default:
        return <FaCode className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <>
      <SEO
        title="Projects - Deployio"
        description="Manage all your projects and deployments in one place with Deployio's project management interface."
      />

      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-white heading mb-2">
                Projects
              </h1>
              <p className="text-gray-400 body">
                Manage and deploy your applications with ease.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
            >
              <FaPlus className="w-4 h-4" />
              Create Project
            </motion.button>
          </motion.div>

          {/* Projects Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 hover:border-neutral-700/50 transition-all duration-200"
              >
                {/* Project Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <FaProjectDiagram className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getFrameworkIcon(project.framework)}
                        <span className="text-gray-400 text-sm">
                          {project.framework}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={getStatusBadge(project.status)}>
                    {project.status}
                  </span>
                </div>

                {/* Project Description */}
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                  {project.description}
                </p>

                {/* Project Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <FaRocket className="w-4 h-4 text-green-400" />
                    <span className="text-gray-400 text-sm">
                      {project.deployments} deployments
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaUsers className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-400 text-sm">
                      {project.collaborators} collaborators
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-400 text-sm">
                      {project.lastDeployment}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCloud className="w-4 h-4 text-orange-400" />
                    <span className="text-gray-400 text-sm">
                      {project.environment}
                    </span>
                  </div>
                </div>

                {/* Repository Link */}
                <div className="flex items-center gap-2 mb-4 p-3 bg-neutral-800/50 rounded-lg">
                  <FaGithub className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300 text-sm font-mono">
                    {project.repository}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-sm">
                    <FaEye className="w-3 h-3" />
                    View
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors text-sm">
                    <FaRocket className="w-3 h-3" />
                    Deploy
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-500/20 border border-gray-500/30 rounded-lg text-gray-400 hover:bg-gray-500/30 transition-colors text-sm">
                    <FaCog className="w-3 h-3" />
                    Settings
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors text-sm ml-auto">
                    <FaTrash className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Empty State for No Projects */}
          {projects.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaProjectDiagram className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">
                No projects yet
              </h3>
              <p className="text-gray-400 mb-6">
                Create your first project to get started with deployments.
              </p>
              <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200">
                Create Your First Project
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default Projects;
