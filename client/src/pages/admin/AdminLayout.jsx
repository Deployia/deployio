import { Outlet, NavLink, useNavigate } from "react-router-dom";
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:z-auto lg:transform-none lg:shadow-none lg:border-r lg:border-gray-200`}
      >
        <div className="flex flex-col h-full bg-white">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Admin Panel
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
          {/* Admin Info */}
          <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <FiUser className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {user?.name || "Admin"}
                </p>
                <p className="text-sm text-gray-600">{user?.email}</p>
                <span className="inline-block px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                  {user?.role || "Admin"}
                </span>
              </div>
            </div>
          </div>
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin"}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700 border-l-4 border-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          {/* Logout */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            >
              <FiLogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>{" "}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b relative z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 p-2"
            >
              <FiMenu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome back, {user?.name}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
