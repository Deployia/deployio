import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaUsers, FaProjectDiagram, FaServer, FaRocket, FaGlobe } from "react-icons/fa";
import adminService from "@/services/adminService";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatGrid from "@/components/admin/AdminStatGrid";
import AdminOverviewCharts from "@/components/admin/charts/AdminOverviewCharts";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";
import { LoadingGrid, LoadingChart } from "@components/LoadingSpinner";
import { adminTokens } from "@/constants/adminDesignTokens";
import { formatDate } from "@/utils/adminFormatters";

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminService.getDashboardStats();
        if (res.success) setData(res.data);
        else setError(res.message || "Failed to load dashboard");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const quickLinks = [
    { label: "Users", path: "/admin/users" },
    { label: "Projects", path: "/admin/projects" },
    { label: "Deployments", path: "/admin/deployments" },
    { label: "Subdomains", path: "/admin/subdomains" },
    { label: "Activity", path: "/admin/activity" },
    { label: "Health", path: "/health" },
  ];

  if (loading) {
    return (
      <div className={adminTokens.pageRoot}>
        <AdminPageHeader title="Overview" subtitle="Loading platform statistics..." />
        <LoadingGrid columns={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <LoadingChart height="h-64" />
          <LoadingChart height="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={adminTokens.pageRoot}>
        <AdminPageHeader title="Overview" subtitle="Platform statistics" />
        <AdminErrorBanner message={error} />
      </div>
    );
  }

  const overview = data?.overview || {};
  const charts = data?.charts || {
    userSignupsTrend: data?.userSignupsTrend,
    deploymentsTrend: data?.deploymentsTrend,
    deploymentStatusBreakdown: data?.deploymentStatusBreakdown,
    roleDistribution: data?.roleDistribution,
  };

  const stats = [
    { label: "Total Users", value: overview.totalUsers ?? 0, icon: FaUsers, iconBg: "bg-blue-500/20", iconColor: "text-blue-400", href: "/admin/users" },
    { label: "Projects", value: overview.totalProjects ?? 0, icon: FaProjectDiagram, iconBg: "bg-green-500/20", iconColor: "text-green-400", href: "/admin/projects" },
    { label: "Deployments", value: overview.totalDeployments ?? 0, icon: FaServer, iconBg: "bg-purple-500/20", iconColor: "text-purple-400", href: "/admin/deployments" },
    { label: "Active Deployments", value: overview.activeDeployments ?? 0, icon: FaRocket, iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400", footnote: `${overview.failedDeploymentsLast7d ?? 0} failed in last 7 days`, footnoteColor: "text-red-400", href: "/admin/deployments" },
  ];

  return (
    <div className={adminTokens.pageRoot}>
      <AdminPageHeader title="Overview" subtitle="Platform health and operational metrics" />
      <AdminStatGrid stats={stats} columns={4} />
      <AdminOverviewCharts charts={charts} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`xl:col-span-2 ${adminTokens.glassCard} ${adminTokens.glassCardPadding}`}>
          <h2 className={`${adminTokens.sectionTitle} mb-4`}>Recent activity</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {(data?.recentActivity || []).length === 0 ? (
              <p className="text-gray-500 text-sm body">No recent activity</p>
            ) : (
              data.recentActivity.map((item) => (
                <div key={item._id} className={`flex justify-between gap-2 p-3 ${adminTokens.nestedRow}`}>
                  <div>
                    <p className="text-gray-200 text-sm">{item.action}</p>
                    <p className="text-gray-500 text-xs body">{item.category} · {item.severity}</p>
                  </div>
                  <span className="text-gray-500 text-xs whitespace-nowrap body">{formatDate(item.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`${adminTokens.glassCard} ${adminTokens.glassCardPadding}`}>
          <h2 className={`${adminTokens.sectionTitle} mb-4`}>Quick actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((link) => (
              <Link key={link.path} to={link.path} className="px-4 py-3 rounded-lg border border-dashed border-neutral-700/50 text-gray-300 hover:border-blue-500/50 hover:text-blue-400 transition-colors text-sm text-center body">{link.label}</Link>
            ))}
          </div>
          <div className={`mt-6 p-4 ${adminTokens.nestedRow}`}>
            <div className="flex items-center gap-2 mb-2">
              <FaGlobe className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-white font-medium">Subdomains</span>
            </div>
            <p className="text-xs text-gray-400 body">{overview.subdomainsActive ?? 0} active · {overview.subdomainsOnHold ?? 0} on hold</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
