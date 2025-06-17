import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiFileText,
  FiBook,
  FiSettings,
  FiBarChart,
  FiDatabase,
  FiShield,
  FiMenu,
  FiX,
  FiLogOut,
  FiUser,
  FiHome,
  FiArrowLeft,
} from "react-icons/fi";
import { logout } from "@redux/slices/authSlice";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const sidebarItems = [
    { icon: FiBarChart, label: "Dashboard", path: "/admin" },
    { icon: FiUsers, label: "Users", path: "/admin/users" },
    { icon: FiFileText, label: "Projects", path: "/admin/projects" },
    { icon: FiBook, label: "Blogs", path: "/admin/blogs" },
    { icon: FiDatabase, label: "Deployments", path: "/admin/deployments" },
    { icon: FiShield, label: "Security", path: "/admin/security" },
    { icon: FiSettings, label: "Settings", path: "/admin/settings" },
  ];
  return (
    <div className="h-screen bg-gradient-to-b from-black to-neutral-900 text-white flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-neutral-800 to-neutral-900 border-r border-neutral-700 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col lg:w-64`}
      >
        <div className="flex flex-col h-full">
          {" "}
          {/* Logo & Admin Header */}
          <div className="p-6 border-b border-neutral-700">
            <div className="flex items-center justify-between mb-4">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <img src="/favicon.png" alt="Deployio Logo" />
                </div>
                <span className="text-2xl font-bold text-white heading group-hover:text-blue-400 transition-colors duration-200">
                  Deployio
                </span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-400 hover:text-white transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Admin Badge */}
            <div className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-lg">
              <FiShield className="w-4 h-4 text-red-400 mr-2" />
              <span className="text-sm font-medium text-red-400">
                Admin Panel
              </span>
            </div>
          </div>
          {/* Admin Info */}
          <div className="p-6 border-b border-neutral-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <FiUser className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">
                  {user?.name || "Admin"}
                </p>
                <p className="text-sm text-gray-400">{user?.email}</p>
                <span className="inline-block px-2 py-1 text-xs font-medium text-purple-300 bg-purple-500/20 border border-purple-500/30 rounded-full mt-1">
                  Administrator
                </span>
              </div>
            </div>
          </div>
          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-2">
            {sidebarItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin"}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-blue-400"
                      : "text-gray-300 hover:bg-neutral-700/50 hover:text-white"
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>
          {/* Quick Actions */}
          <div className="p-6 border-t border-neutral-700">
            <Link
              to="/dashboard"
              className="flex items-center space-x-3 w-full px-4 py-3 text-gray-300 hover:bg-neutral-700/50 hover:text-white rounded-lg transition-all duration-200 mb-2"
            >
              <FiHome className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 text-gray-300 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all duration-200"
            >
              <FiLogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>{" "}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-neutral-800/50 backdrop-blur border-b border-neutral-700 flex-shrink-0">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white transition-colors"
              >
                <FiMenu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-400">
                  Welcome back, {user?.name}
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-gray-300 hover:text-white rounded-lg transition-all duration-200"
              >
                <FiArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-full"
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
