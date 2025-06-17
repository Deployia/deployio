import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiFileText,
  FiBook,
  FiDatabase,
  FiTrendingUp,
  FiActivity,
  FiServer,
  FiShield,
} from "react-icons/fi";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    projects: 0,
    blogs: 0,
    deployments: 0,
    activeDeployments: 0,
    totalStorage: "0 MB",
  });

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch admin dashboard data
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // For now, we'll use mock data. Later you can replace with actual API calls
      setTimeout(() => {
        setStats({
          users: 142,
          projects: 58,
          blogs: 23,
          deployments: 187,
          activeDeployments: 12,
          totalStorage: "2.4 GB",
        });

        setActivities([
          {
            id: 1,
            type: "user",
            message: "New user registered: john.doe@example.com",
            timestamp: "2 minutes ago",
            icon: FiUsers,
            color: "text-green-600",
          },
          {
            id: 2,
            type: "deployment",
            message: "Deployment completed for Project Alpha",
            timestamp: "5 minutes ago",
            icon: FiServer,
            color: "text-blue-600",
          },
          {
            id: 3,
            type: "blog",
            message: "New blog post published: 'Advanced CI/CD Strategies'",
            timestamp: "1 hour ago",
            icon: FiBook,
            color: "text-purple-600",
          },
          {
            id: 4,
            type: "security",
            message: "Security scan completed for all projects",
            timestamp: "2 hours ago",
            icon: FiShield,
            color: "text-orange-600",
          },
        ]);

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.users,
      icon: FiUsers,
      color: "bg-blue-500",
      change: "+12%",
      changeType: "positive",
    },
    {
      title: "Projects",
      value: stats.projects,
      icon: FiFileText,
      color: "bg-green-500",
      change: "+8%",
      changeType: "positive",
    },
    {
      title: "Blog Posts",
      value: stats.blogs,
      icon: FiBook,
      color: "bg-purple-500",
      change: "+15%",
      changeType: "positive",
    },
    {
      title: "Total Deployments",
      value: stats.deployments,
      icon: FiDatabase,
      color: "bg-orange-500",
      change: "+23%",
      changeType: "positive",
    },
    {
      title: "Active Deployments",
      value: stats.activeDeployments,
      icon: FiActivity,
      color: "bg-red-500",
      change: "-2%",
      changeType: "negative",
    },
    {
      title: "Storage Used",
      value: stats.totalStorage,
      icon: FiServer,
      color: "bg-indigo-500",
      change: "+5%",
      changeType: "positive",
    },
  ];

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>{" "}
        <p className="text-gray-600 mt-2">
          Overview of your platform&apos;s performance and activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
                <div className="flex items-center mt-2">
                  <span
                    className={`text-sm font-medium ${
                      stat.changeType === "positive"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    vs last month
                  </span>
                </div>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Activity Feed & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`${activity.color} p-2 rounded-lg`}>
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Quick Actions
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <FiUsers className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-600">
                  Manage Users
                </span>
              </button>
              <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors">
                <FiBook className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-600">
                  Create Blog
                </span>
              </button>
              <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors">
                <FiDatabase className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-600">
                  View Deployments
                </span>
              </button>
              <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors">
                <FiTrendingUp className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-600">
                  Analytics
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
