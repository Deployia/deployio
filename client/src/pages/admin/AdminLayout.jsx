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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-neutral-900/70 backdrop-blur-lg border-r border-neutral-800/30 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col lg:w-64`}
      >
        <div className="flex flex-col h-full">
          {" "}
          {/* Logo Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="p-6 border-b border-neutral-800/30 flex-shrink-0"
          >
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <img
                    src="/favicon.png"
                    alt="Deployio Logo"
                    className="w-8 h-8"
                  />
                </div>
                <span className="text-2xl font-bold text-white heading group-hover:text-blue-400 transition-colors duration-200">
                  Deployio
                </span>
              </Link>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-neutral-800/50"
              >
                <FiX className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>{" "}
          {/* Navigation */}
          <motion.nav
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex-1 p-6 space-y-3 overflow-auto"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(115, 115, 115, 0.5) rgba(23, 23, 23, 0.3)",
            }}
          >
            <style>{`
              nav::-webkit-scrollbar {
                width: 8px;
              }
              nav::-webkit-scrollbar-track {
                background: rgba(23, 23, 23, 0.3);
                border-radius: 4px;
              }
              nav::-webkit-scrollbar-thumb {
                background: rgba(115, 115, 115, 0.5);
                border-radius: 4px;
              }
              nav::-webkit-scrollbar-thumb:hover {
                background: rgba(115, 115, 115, 0.7);
              }
            `}</style>
            {sidebarItems.map((item, index) => (
              <motion.div
                key={item.path}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
              >
                <NavLink
                  to={item.path}
                  end={item.path === "/admin"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 body font-medium text-sm border border-transparent ${
                      isActive
                        ? "bg-neutral-800/50 border-neutral-700/50 text-white"
                        : "text-gray-300 hover:text-white hover:bg-neutral-800/50 hover:border-neutral-700/50"
                    }`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              </motion.div>
            ))}
          </motion.nav>{" "}
          {/* User Profile & Logout - Matching Mobile Sidebar Style */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="p-4 border-t border-neutral-800/50 bg-neutral-900/50 flex-shrink-0"
          >
            <div className="flex items-center gap-3">
              {/* Profile Avatar and Info */}
              <Link
                to="/dashboard/profile"
                className="flex items-center gap-3 flex-1 p-2 rounded-lg hover:bg-neutral-800/50 transition-all duration-200 group"
              >
                {" "}
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  src={
                    user?.profileImage ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user?.firstName && user?.lastName
                        ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
                        : user?.username
                        ? user.username.slice(0, 2).toUpperCase()
                        : "AD"
                    )}&background=4F46E5&color=ffffff&size=60`
                  }
                  alt="Profile"
                  className="w-10 h-10 rounded-xl border-2 border-neutral-600 shadow-lg group-hover:border-blue-500 transition-colors"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm truncate group-hover:text-blue-400 transition-colors">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user?.username || "Administrator"}
                  </h3>
                  <p className="text-gray-400 text-xs truncate group-hover:text-gray-300 transition-colors">
                    {user?.email || "admin@deployio.com"}
                  </p>
                </div>
              </Link>

              {/* Logout Icon Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 transition-all duration-200"
                title="Logout"
              >
                <FiLogOut className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>{" "}
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile menu button */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="lg:hidden flex items-center p-4 bg-neutral-900/70 backdrop-blur-lg border-b border-neutral-800/30"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-neutral-800/50"
          >
            <FiMenu className="w-5 h-5" />
          </motion.button>
          <span className="ml-3 text-lg font-semibold text-white heading">
            Admin Panel
          </span>
        </motion.div>

        {/* Page content with custom scrollbar */}
        <main
          className="flex-1 overflow-auto"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(115, 115, 115, 0.5) rgba(23, 23, 23, 0.3)",
          }}
        >
          <style>{`
            main::-webkit-scrollbar {
              width: 8px;
            }
            main::-webkit-scrollbar-track {
              background: rgba(23, 23, 23, 0.3);
              border-radius: 4px;
            }
            main::-webkit-scrollbar-thumb {
              background: rgba(115, 115, 115, 0.5);
              border-radius: 4px;
            }
            main::-webkit-scrollbar-thumb:hover {
              background: rgba(115, 115, 115, 0.7);
            }
          `}</style>
          <motion.div
            className="p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
